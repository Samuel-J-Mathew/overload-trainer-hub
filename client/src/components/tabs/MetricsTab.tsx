import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart } from "@/components/charts/LineChart";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { collection, query, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, subDays, subWeeks, subMonths } from "date-fns";

interface MetricsTabProps {
  clientId: string;
}

interface WeightEntry {
  date: Date;
  weight: number;
}

export const MetricsTab = ({ clientId }: MetricsTabProps) => {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last-month");

  // Debug client data
  console.log("MetricsTab clientId:", clientId);

  const loadWeightData = async () => {
    try {
      setLoading(true);
      console.log("Loading weight data for clientId:", clientId);
      
      if (!clientId) {
        console.log("No clientId provided");
        setWeightData([]);
        setLoading(false);
        return;
      }

      const weightLogsRef = collection(db, `users/${clientId}/weightLogs`);
      const snapshot = await getDocs(weightLogsRef);
      
      console.log("Weight logs snapshot size:", snapshot.size);
      
      const entries: WeightEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Weight log document:", doc.id, data);
        
        if (data.weight && data.date) {
          entries.push({
            date: data.date.toDate ? data.date.toDate() : new Date(data.date),
            weight: Number(data.weight)
          });
        }
      });

      // Sort by date ascending for time series
      entries.sort((a, b) => a.date.getTime() - b.date.getTime());
      console.log("Processed weight entries:", entries);
      setWeightData(entries);
    } catch (error) {
      console.error("Error loading weight data:", error);
      setWeightData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadWeightData();
    }
  }, [clientId]);

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case "last-week":
        cutoffDate = subWeeks(now, 1);
        break;
      case "last-month":
        cutoffDate = subMonths(now, 1);
        break;
      case "last-3-months":
        cutoffDate = subMonths(now, 3);
        break;
      default:
        cutoffDate = subMonths(now, 1);
    }

    return weightData.filter(entry => entry.date >= cutoffDate);
  };

  const filteredData = getFilteredData();

  // Calculate metrics
  const currentWeight = filteredData.length > 0 ? filteredData[filteredData.length - 1].weight : null;
  const previousWeight = filteredData.length > 1 ? filteredData[filteredData.length - 2].weight : null;
  const weeklyChange = currentWeight && previousWeight ? currentWeight - previousWeight : null;

  // Prepare chart data
  const chartData = {
    labels: filteredData.map(entry => format(entry.date, "MMM d")),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: filteredData.map(entry => entry.weight),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  if (loading) {
    return <div className="text-center py-8">Loading weight data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Weight Summary */}
      {currentWeight && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Current Weight</h4>
              <Button className="hubfit-primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Log Weight
              </Button>
            </div>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {currentWeight.toFixed(1)} lbs
                </div>
                <div className="text-sm text-gray-500">
                  {format(filteredData[filteredData.length - 1].date, "MMM d, yyyy")}
                </div>
              </div>
              {weeklyChange !== null && (
                <div className="flex items-center space-x-2">
                  {weeklyChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-red-500" />
                  ) : weeklyChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-green-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="text-sm">
                    <div className={`font-medium ${
                      weeklyChange > 0 ? 'text-red-600' : 
                      weeklyChange < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)} lbs
                    </div>
                    <div className="text-gray-500">vs previous</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weight Progress</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-week">Last week</SelectItem>
                  <SelectItem value="last-month">Last month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No weight data available for the selected time period.</p>
              <p className="text-sm mt-2">Weight entries will appear here when the client logs their measurements</p>
            </div>
          ) : (
            <LineChart data={chartData} height={400} />
          )}
        </CardContent>
      </Card>

      {/* Weight History Table */}
      {filteredData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weight History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredData.slice().reverse().slice(0, 10).map((entry, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="text-sm text-gray-600">
                    {format(entry.date, "MMM d, yyyy")}
                  </div>
                  <div className="font-medium text-gray-900">
                    {entry.weight.toFixed(1)} lbs
                  </div>
                </div>
              ))}
              {filteredData.length > 10 && (
                <div className="text-center pt-2">
                  <div className="text-sm text-gray-500">
                    Showing latest 10 entries of {filteredData.length} total
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useCollection } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart } from "@/components/charts/LineChart";
import { Plus, Edit, Download, BarChart3 } from "lucide-react";
import { where, orderBy } from "firebase/firestore";

interface MetricsTabProps {
  clientId: string;
}

export const MetricsTab = ({ clientId }: MetricsTabProps) => {
  const { data: metrics, loading } = useCollection("metrics", [
    where("clientId", "==", clientId),
    orderBy("date", "desc")
  ]);

  // Mock empty chart data
  const metricsChartData = {
    labels: [],
    datasets: [
      {
        label: 'Weight',
        data: [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
      },
      {
        label: 'Body Fat %',
        data: [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      }
    ]
  };

  if (loading) {
    return <div className="text-center py-8">Loading metrics data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Weight</h4>
              <Button className="hubfit-primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Metric
              </Button>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">kg</div>
            <div className="text-sm text-gray-500">29 Jan 2025</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Body Fat</h4>
            <div className="text-3xl font-bold text-gray-900 mb-1">kg</div>
            <div className="text-sm text-gray-500">29 Jan 2025</div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Metrics Overview</CardTitle>
            <div className="flex items-center space-x-2">
              <Select defaultValue="last-week">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-week">Last week</SelectItem>
                  <SelectItem value="last-month">Last month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Log Metric
              </Button>
              <Button className="hubfit-primary" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Metric
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center text-gray-500">
            No data for the Last week period. Try change the filter.
          </div>
          <LineChart data={metricsChartData} height={400} />
        </CardContent>
      </Card>

      {/* Metrics Data Table */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500 py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data</p>
            <p className="text-sm mt-2">Metrics will appear here when the client logs their measurements</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

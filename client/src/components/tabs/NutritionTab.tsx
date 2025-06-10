import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart } from "@/components/charts/LineChart";
import { CalendarIcon, Plus } from "lucide-react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

interface NutritionTabProps {
  clientId: string;
}

interface FoodEntry {
  id: string;
  name: string;
  calories: string;
  carbs: string;
  protein: string;
  fats: string;
  timestamp: any; // Firestore Timestamp
}

interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export const NutritionTab = ({ clientId }: NutritionTabProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  });
  const [loading, setLoading] = useState(true);

  // Format date to YYYYMMDD for Firebase path
  const formatDateForFirebase = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // Load food entries for selected date
  const loadFoodEntries = async (date: Date): Promise<(() => void) | undefined> => {
    try {
      setLoading(true);
      const dateString = formatDateForFirebase(date);
      const entriesCollection = collection(db, "users", clientId, "foods", dateString, "entries");
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(entriesCollection, (snapshot) => {
        const entries: FoodEntry[] = [];
        
        snapshot.forEach((doc) => {
          entries.push({
            id: doc.id,
            ...doc.data()
          } as FoodEntry);
        });

        // Sort by timestamp (most recent first)
        entries.sort((a, b) => {
          const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return timestampB.getTime() - timestampA.getTime();
        });

        setFoodEntries(entries);
        calculateDailySummary(entries);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading food entries:", error);
      setLoading(false);
      return undefined;
    }
  };

  // Calculate daily nutrition summary
  const calculateDailySummary = (entries: FoodEntry[]) => {
    const summary = entries.reduce((acc, entry) => {
      return {
        totalCalories: acc.totalCalories + (parseFloat(entry.calories) || 0),
        totalProtein: acc.totalProtein + (parseFloat(entry.protein) || 0),
        totalCarbs: acc.totalCarbs + (parseFloat(entry.carbs) || 0),
        totalFats: acc.totalFats + (parseFloat(entry.fats) || 0),
      };
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
    });

    setDailySummary(summary);
  };

  // Format timestamp for display
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "h:mm a");
  };

  // Get chart data for macronutrient breakdown
  const getMacroChartData = () => {
    const total = dailySummary.totalProtein + dailySummary.totalCarbs + dailySummary.totalFats;
    
    if (total === 0) {
      return {
        labels: ['No data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb'],
          borderWidth: 0,
        }]
      };
    }

    return {
      labels: ['Protein', 'Carbs', 'Fats'],
      datasets: [{
        data: [
          dailySummary.totalProtein,
          dailySummary.totalCarbs,
          dailySummary.totalFats
        ],
        backgroundColor: [
          '#ef4444', // Red for protein
          '#3b82f6', // Blue for carbs
          '#eab308', // Yellow for fats
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    };
  };

  useEffect(() => {
    if (clientId) {
      let unsubscribeFn: (() => void) | undefined;
      
      loadFoodEntries(selectedDate).then(unsubscribe => {
        unsubscribeFn = unsubscribe;
      });
      
      return () => {
        if (unsubscribeFn) {
          unsubscribeFn();
        }
      };
    }
  }, [clientId, selectedDate]);

  if (loading) {
    return <div className="text-center py-8">Loading nutrition data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Selector and Daily Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Select Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-auto">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(dailySummary.totalCalories)}
                  </div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round(dailySummary.totalProtein)}g
                  </div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round(dailySummary.totalCarbs)}g
                  </div>
                  <div className="text-sm text-gray-600">Carbs</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(dailySummary.totalFats)}g
                  </div>
                  <div className="text-sm text-gray-600">Fats</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macronutrient Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              {dailySummary.totalCalories > 0 ? (
                <div className="text-center">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                      <span>Protein ({Math.round(dailySummary.totalProtein)}g)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                      <span>Carbs ({Math.round(dailySummary.totalCarbs)}g)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                      <span>Fats ({Math.round(dailySummary.totalFats)}g)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center">
                  <p>No nutrition data for this date</p>
                  <p className="text-sm mt-1">Food entries will appear when logged</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Food Entry Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Food Log - {format(selectedDate, "MMMM d, yyyy")}</span>
            <Button className="hubfit-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {foodEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No food entries for this date</p>
              <p className="text-sm mt-2">Food items will appear here when logged</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Time</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Food</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Calories</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Protein</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Carbs</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Fats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {foodEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {formatTime(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {entry.name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {Math.round(parseFloat(entry.calories) || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {Math.round(parseFloat(entry.protein) || 0)}g
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {Math.round(parseFloat(entry.carbs) || 0)}g
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {Math.round(parseFloat(entry.fats) || 0)}g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

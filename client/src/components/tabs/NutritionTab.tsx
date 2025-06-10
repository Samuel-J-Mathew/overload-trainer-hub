import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { LineChart } from "@/components/charts/LineChart";
import { CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameWeek } from "date-fns";

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

interface WeeklyData {
  [dateKey: string]: {
    entries: FoodEntry[];
    summary: DailySummary;
  };
}

interface MacroVisibility {
  calories: boolean;
  protein: boolean;
  carbs: boolean;
  fats: boolean;
}

export const NutritionTab = ({ clientId }: NutritionTabProps) => {
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({});
  const [macroVisibility, setMacroVisibility] = useState<MacroVisibility>({
    calories: true,
    protein: true,
    carbs: true,
    fats: true,
  });
  const [loading, setLoading] = useState(true);

  // Format date to YYYYMMDD for Firebase path
  const formatDateForFirebase = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // Get week dates (Monday to Sunday)
  const getWeekDates = (weekStart: Date) => {
    const start = startOfWeek(weekStart, { weekStartsOn: 1 }); // Monday = 1
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  // Load food entries for entire week
  const loadWeeklyData = async (weekStart: Date) => {
    try {
      setLoading(true);
      const weekDates = getWeekDates(weekStart);
      const weekData: WeeklyData = {};
      
      // Load data for each day of the week
      for (const date of weekDates) {
        const dateString = formatDateForFirebase(date);
        const entriesCollection = collection(db, "users", clientId, "foods", dateString, "entries");
        
        try {
          const snapshot = await getDocs(entriesCollection);
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

          weekData[dateString] = {
            entries,
            summary: calculateDailySummary(entries)
          };
        } catch (dayError) {
          // If no data for this day, create empty entry
          weekData[dateString] = {
            entries: [],
            summary: { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
          };
        }
      }
      
      setWeeklyData(weekData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading weekly data:", error);
      setLoading(false);
    }
  };

  // Calculate daily nutrition summary
  const calculateDailySummary = (entries: FoodEntry[]): DailySummary => {
    return entries.reduce((acc, entry) => {
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
  };

  // Format timestamp for display
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "h:mm a");
  };

  // Get weekly chart data for macros
  const getWeeklyChartData = () => {
    const weekDates = getWeekDates(selectedWeek);
    const dayLabels = weekDates.map(date => format(date, 'EEE')); // Mon, Tue, Wed...
    
    const datasets = [];
    
    if (macroVisibility.calories) {
      datasets.push({
        label: 'Calories',
        data: weekDates.map(date => {
          const dateKey = formatDateForFirebase(date);
          return weeklyData[dateKey]?.summary.totalCalories || 0;
        }),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.2,
      });
    }
    
    if (macroVisibility.protein) {
      datasets.push({
        label: 'Protein (g)',
        data: weekDates.map(date => {
          const dateKey = formatDateForFirebase(date);
          return weeklyData[dateKey]?.summary.totalProtein || 0;
        }),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.2,
      });
    }
    
    if (macroVisibility.carbs) {
      datasets.push({
        label: 'Carbs (g)',
        data: weekDates.map(date => {
          const dateKey = formatDateForFirebase(date);
          return weeklyData[dateKey]?.summary.totalCarbs || 0;
        }),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.2,
      });
    }
    
    if (macroVisibility.fats) {
      datasets.push({
        label: 'Fats (g)',
        data: weekDates.map(date => {
          const dateKey = formatDateForFirebase(date);
          return weeklyData[dateKey]?.summary.totalFats || 0;
        }),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.2,
      });
    }

    return {
      labels: dayLabels,
      datasets
    };
  };

  // Calculate weekly totals and averages
  const getWeeklySummary = () => {
    const weekDates = getWeekDates(selectedWeek);
    const totals = weekDates.reduce((acc, date) => {
      const dateKey = formatDateForFirebase(date);
      const dayData = weeklyData[dateKey];
      if (dayData) {
        return {
          totalCalories: acc.totalCalories + dayData.summary.totalCalories,
          totalProtein: acc.totalProtein + dayData.summary.totalProtein,
          totalCarbs: acc.totalCarbs + dayData.summary.totalCarbs,
          totalFats: acc.totalFats + dayData.summary.totalFats,
        };
      }
      return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 });

    const averages = {
      avgCalories: totals.totalCalories / 7,
      avgProtein: totals.totalProtein / 7,
      avgCarbs: totals.totalCarbs / 7,
      avgFats: totals.totalFats / 7,
    };

    return { totals, averages };
  };

  useEffect(() => {
    if (clientId) {
      loadWeeklyData(selectedWeek);
    }
  }, [clientId, selectedWeek]);

  if (loading) {
    return <div className="text-center py-8">Loading nutrition data...</div>;
  }

  const { totals, averages } = getWeeklySummary();
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Week Selection</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Macros Target Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Weekly Macro Trends</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={macroVisibility.calories}
                  onCheckedChange={(checked) => 
                    setMacroVisibility(prev => ({ ...prev, calories: checked }))
                  }
                />
                <span className="text-sm">Calories</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={macroVisibility.protein}
                  onCheckedChange={(checked) => 
                    setMacroVisibility(prev => ({ ...prev, protein: checked }))
                  }
                />
                <span className="text-sm">Protein</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={macroVisibility.carbs}
                  onCheckedChange={(checked) => 
                    setMacroVisibility(prev => ({ ...prev, carbs: checked }))
                  }
                />
                <span className="text-sm">Carbs</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={macroVisibility.fats}
                  onCheckedChange={(checked) => 
                    setMacroVisibility(prev => ({ ...prev, fats: checked }))
                  }
                />
                <span className="text-sm">Fats</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart 
            data={getWeeklyChartData()} 
            height={300}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Amount'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Day of Week'
                  }
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Weekly Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {Math.round(totals.totalCalories)}
                </div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {Math.round(totals.totalProtein)}g
                </div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-xl font-bold text-yellow-600">
                  {Math.round(totals.totalCarbs)}g
                </div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {Math.round(totals.totalFats)}g
                </div>
                <div className="text-sm text-gray-600">Fats</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {Math.round(averages.avgCalories)}
                </div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {Math.round(averages.avgProtein)}g
                </div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-xl font-bold text-yellow-600">
                  {Math.round(averages.avgCarbs)}g
                </div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {Math.round(averages.avgFats)}g
                </div>
                <div className="text-sm text-gray-600">Fats</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Food Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Food Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {getWeekDates(selectedWeek).map(date => {
              const dateKey = formatDateForFirebase(date);
              const dayData = weeklyData[dateKey];
              const dayName = format(date, 'EEEE, MMMM d');
              
              return (
                <div key={dateKey} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-3">{dayName}</h4>
                  
                  {!dayData || dayData.entries.length === 0 ? (
                    <p className="text-gray-500 text-sm">No food logged for this day</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                        <span>Total: {Math.round(dayData.summary.totalCalories)} cal</span>
                        <span>{Math.round(dayData.summary.totalProtein)}g protein</span>
                        <span>{Math.round(dayData.summary.totalCarbs)}g carbs</span>
                        <span>{Math.round(dayData.summary.totalFats)}g fats</span>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {dayData.entries.map((entry) => (
                          <div key={entry.id} className="py-2 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-500">
                                {formatTime(entry.timestamp)}
                              </span>
                              <span className="font-medium">{entry.name}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{Math.round(parseFloat(entry.calories) || 0)} cal</span>
                              <span>{Math.round(parseFloat(entry.protein) || 0)}g protein</span>
                              <span>{Math.round(parseFloat(entry.carbs) || 0)}g carbs</span>
                              <span>{Math.round(parseFloat(entry.fats) || 0)}g fats</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

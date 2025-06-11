import { useState, useEffect } from "react";
import { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/charts/LineChart";
import { User, TrendingUp, Activity, Camera, Scale, Dumbbell, Apple } from "lucide-react";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, subDays, parseISO } from "date-fns";

interface OverviewTabProps {
  client: Client;
}

interface WeightEntry {
  date: Date;
  weight: number;
}

interface ActivityEntry {
  date: Date;
  type: 'workout' | 'nutrition' | 'weight';
  description: string;
  icon: string;
}

interface WorkoutSummary {
  date: string;
  exerciseCount: number;
}

interface NutritionSummary {
  date: string;
  entryCount: number;
  totalCalories: number;
}

export const OverviewTab = ({ client }: OverviewTabProps) => {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug client data
  console.log("OverviewTab client object:", client);
  console.log("Client firebaseUid:", client?.firebaseUid);
  console.log("Client id:", client?.id);

  const formatDate = (date?: any) => {
    if (!date) return "Never";
    
    // Handle Firestore Timestamp objects
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const loadWeightData = async () => {
    try {
      // Try firebaseUid first, then fallback to id
      const userId = client.firebaseUid || client.id;
      console.log("Loading weight data for userId:", userId);
      console.log("Using firebaseUid:", client.firebaseUid);
      console.log("Using id:", client.id);
      
      if (!userId) {
        console.log("No userId found");
        setWeightData([]);
        return;
      }

      const weightLogsRef = collection(db, `users/${userId}/weightLogs`);
      console.log("Attempting to fetch from path:", `users/${userId}/weightLogs`);
      
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

      // Sort by date ascending for chart
      entries.sort((a, b) => a.date.getTime() - b.date.getTime());
      console.log("Processed weight entries:", entries);
      setWeightData(entries);
    } catch (error) {
      console.error("Error loading weight data:", error);
      setWeightData([]);
    }
  };

  const loadActivityData = async () => {
    try {
      // Try firebaseUid first, then fallback to id
      const userId = client.firebaseUid || client.id;
      console.log("Loading activity data for userId:", userId);
      
      if (!userId) {
        console.log("No userId found for activity");
        setActivityLog([]);
        return;
      }

      const activities: ActivityEntry[] = [];
      const last30Days = subDays(new Date(), 30);

      // Load workout logs
      try {
        const workoutLogsRef = collection(db, `users/${userId}/workouts`);
        const workoutSnapshot = await getDocs(workoutLogsRef);
        console.log("Workout logs found:", workoutSnapshot.size);
        
        for (const workoutDoc of workoutSnapshot.docs) {
          const dateStr = workoutDoc.id; // YYYYMMDD format
          console.log("Processing workout date:", dateStr);
          
          if (dateStr.length === 8) {
            const date = parseISO(`${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`);
            
            if (date >= last30Days) {
              const exercisesRef = collection(db, `users/${userId}/workouts/${dateStr}/exercises`);
              const exerciseSnapshot = await getDocs(exercisesRef);
              
              console.log(`Exercises found for ${dateStr}:`, exerciseSnapshot.size);
              
              if (!exerciseSnapshot.empty) {
                activities.push({
                  date,
                  type: 'workout',
                  description: `Completed workout – ${exerciseSnapshot.size} exercises logged`,
                  icon: '🏋️'
                });
                console.log("Added workout activity for", dateStr, "with", exerciseSnapshot.size, "exercises");
              } else {
                // Even if no exercises, check if there's workout data
                const workoutData = workoutDoc.data();
                if (Object.keys(workoutData).length > 0) {
                  activities.push({
                    date,
                    type: 'workout',
                    description: `Completed workout session`,
                    icon: '🏋️'
                  });
                  console.log("Added workout activity for", dateStr, "based on workout document");
                }
              }
            }
          }
        }
      } catch (workoutError) {
        console.error("Error loading workout data:", workoutError);
      }

      // Load nutrition logs
      try {
        const nutritionLogsRef = collection(db, `users/${userId}/foods`);
        const nutritionSnapshot = await getDocs(nutritionLogsRef);
        console.log("Nutrition logs found:", nutritionSnapshot.size);
        
        for (const nutritionDoc of nutritionSnapshot.docs) {
          const dateStr = nutritionDoc.id; // YYYYMMDD format
          console.log("Processing nutrition date:", dateStr);
          
          if (dateStr.length === 8) {
            const date = parseISO(`${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`);
            
            if (date >= last30Days) {
              const entriesRef = collection(db, `users/${userId}/foods/${dateStr}/entries`);
              const entriesSnapshot = await getDocs(entriesRef);
              
              if (!entriesSnapshot.empty) {
                let totalCalories = 0;
                entriesSnapshot.forEach((doc) => {
                  const data = doc.data();
                  totalCalories += Number(data.calories || 0);
                });

                activities.push({
                  date,
                  type: 'nutrition',
                  description: `Logged ${entriesSnapshot.size} meals – ${Math.round(totalCalories)} calories`,
                  icon: '🍎'
                });
                console.log("Added nutrition activity for", dateStr, "with", entriesSnapshot.size, "entries");
              }
            }
          }
        }
      } catch (nutritionError) {
        console.error("Error loading nutrition data:", nutritionError);
      }

      // Add weight logs from already loaded weight data
      const recentWeights = weightData.filter(w => w.date >= last30Days);
      recentWeights.forEach((entry) => {
        activities.push({
          date: entry.date,
          type: 'weight',
          description: `Weight updated: ${entry.weight.toFixed(1)} lbs`,
          icon: '⚖️'
        });
      });

      // Sort by date descending (newest first)
      activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      console.log("Total activities loaded:", activities.length);
      setActivityLog(activities);
    } catch (error) {
      console.error("Error loading activity data:", error);
      setActivityLog([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const userId = client.firebaseUid || client.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      await loadWeightData();
      await loadActivityData();
      setLoading(false);
    };

    loadData();
  }, [client.firebaseUid, client.id]);

  // Calculate weight metrics
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;
  const weekAgoWeight = weightData.length > 1 ? weightData.find(w => {
    const daysDiff = Math.abs(new Date().getTime() - w.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff >= 7;
  })?.weight : null;
  
  const weeklyChange = currentWeight && weekAgoWeight ? currentWeight - weekAgoWeight : null;

  // Prepare weight chart data
  const weightChartData = {
    labels: weightData.slice(-14).map(entry => format(entry.date, "MMM d")),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: weightData.slice(-14).map(entry => entry.weight),
        borderColor: 'rgb(23, 23, 23)',
        backgroundColor: 'rgba(23, 23, 23, 0.1)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  // Group activities by date
  const groupedActivities = activityLog.reduce((groups, activity) => {
    const dateKey = format(activity.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, ActivityEntry[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Client Details Card */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{client.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Check-in</span>
              <span className="font-medium">{formatDate(client.lastCheckin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Active</span>
              <span className="font-medium">{formatDate(client.lastActive)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <Badge variant={client.duration === 'active' ? 'default' : 'secondary'}>
                {client.duration || 'New'}
              </Badge>
            </div>
            {client.tag && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tags</span>
                <Badge variant={client.tag === 'in-person' ? 'default' : 'secondary'}>
                  {client.tag.replace('-', ' ')}
                </Badge>
              </div>
            )}

            {/* Goal Section */}
            {client.goal && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Goal</h4>
                <p className="text-gray-600 text-sm">{client.goal}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>15 November 2022</span>
                  <span className="mx-2 px-2 py-1 bg-gray-200 text-gray-700 rounded">PRIVATE</span>
                </div>
              </div>
            )}

            {/* Injuries Section */}
            {client.injuries && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Injuries</h4>
                <p className="text-gray-600 text-sm">{client.injuries}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>15 November 2022</span>
                  <span className="mx-2 px-2 py-1 bg-gray-200 text-gray-700 rounded">PRIVATE</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metrics and Activity */}
      <div className="lg:col-span-2 space-y-6">
        {/* Weight Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="w-5 h-5 mr-2" />
              Weight Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading weight data...</div>
            ) : weightData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Scale className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No weight data available</p>
                <p className="text-sm">Weight entries will appear here when logged</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Weight Summary */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {currentWeight?.toFixed(1)} lbs
                    </div>
                    <div className="text-sm text-gray-500">
                      Current weight
                    </div>
                  </div>
                  {weeklyChange !== null && (
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        weeklyChange > 0 ? 'text-red-600' : 
                        weeklyChange < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)} lbs
                      </div>
                      <div className="text-xs text-gray-500">7-day change</div>
                    </div>
                  )}
                </div>
                
                {/* Weight Chart */}
                <LineChart data={weightChartData} height={200} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading activity data...</div>
            ) : Object.keys(groupedActivities).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here when the client starts using the app</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {Object.entries(groupedActivities).map(([dateKey, activities]) => (
                  <div key={dateKey} className="space-y-2">
                    <div className="text-sm font-medium text-gray-600 border-b border-gray-100 pb-1">
                      {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                    </div>
                    {activities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 py-2">
                        <span className="text-lg">{activity.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {format(activity.date, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Photos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Recent Photos
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No photos yet</p>
              <p className="text-sm">Progress photos will appear here when uploaded</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

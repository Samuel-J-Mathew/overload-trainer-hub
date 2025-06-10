import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, Dumbbell, Search, TrendingUp } from "lucide-react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LineChart } from "@/components/charts/LineChart";

interface TrainingTabProps {
  clientId: string;
}

// Type definitions for the training data
interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface MuscleGroup {
  muscleGroupName: string;
  exercises: Exercise[];
}

interface WorkoutSplit {
  day: string;
  muscleGroups: MuscleGroup[];
}

interface WorkoutProgram {
  splits: WorkoutSplit[];
}

interface WorkoutLog {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

interface WorkoutsByDate {
  [date: string]: WorkoutLog[];
}

interface ExerciseHistory {
  name: string;
  entries: Array<{
    date: string;
    weight: string;
    sets: string;
    reps: string;
  }>;
}

interface GroupedWorkout {
  date: string;
  muscleGroups: {
    [muscleGroup: string]: WorkoutLog[];
  };
}

export const TrainingTab = ({ clientId }: TrainingTabProps) => {
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutsByDate>({});
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseHistory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("programs");

  // Load workout program from /users/{userUID}/split/workoutProgram
  const loadWorkoutProgram = async () => {
    try {
      const programDoc = await getDoc(doc(db, "users", clientId, "split", "workoutProgram"));
      if (programDoc.exists()) {
        setWorkoutProgram(programDoc.data() as WorkoutProgram);
      }
    } catch (error) {
      console.error("Error loading workout program:", error);
    }
  };

  // Load recent workouts and build exercise history
  const loadRecentWorkouts = async () => {
    try {
      const workoutsCollection = collection(db, "users", clientId, "workouts");
      const workoutDatesSnapshot = await getDocs(workoutsCollection);
      
      const workoutsByDate: WorkoutsByDate = {};
      const exerciseHistoryMap: { [name: string]: ExerciseHistory } = {};
      
      for (const dateDoc of workoutDatesSnapshot.docs) {
        const dateKey = dateDoc.id; // YYYYMMDD format
        const exercisesCollection = collection(db, "users", clientId, "workouts", dateKey, "exercises");
        const exercisesSnapshot = await getDocs(exercisesCollection);
        
        const exercises: WorkoutLog[] = [];
        exercisesSnapshot.forEach((exerciseDoc) => {
          const exercise = exerciseDoc.data() as WorkoutLog;
          exercises.push(exercise);
          
          // Build exercise history
          if (!exerciseHistoryMap[exercise.name]) {
            exerciseHistoryMap[exercise.name] = {
              name: exercise.name,
              entries: []
            };
          }
          
          exerciseHistoryMap[exercise.name].entries.push({
            date: dateKey,
            weight: exercise.weight,
            sets: exercise.sets,
            reps: exercise.reps
          });
        });
        
        if (exercises.length > 0) {
          workoutsByDate[dateKey] = exercises;
        }
      }
      
      // Sort exercise history entries by date
      Object.values(exerciseHistoryMap).forEach(exercise => {
        exercise.entries.sort((a, b) => b.date.localeCompare(a.date));
      });
      
      setRecentWorkouts(workoutsByDate);
      setExerciseHistory(Object.values(exerciseHistoryMap));
    } catch (error) {
      console.error("Error loading recent workouts:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadWorkoutProgram(), loadRecentWorkouts()]);
      setLoading(false);
    };

    if (clientId) {
      loadData();
    }
  }, [clientId]);

  const formatWorkoutDate = (dateKey: string) => {
    // Convert YYYYMMDD to readable format
    const year = dateKey.substring(0, 4);
    const month = dateKey.substring(4, 6);
    const day = dateKey.substring(6, 8);
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatDateForChart = (dateKey: string) => {
    const year = dateKey.substring(0, 4);
    const month = dateKey.substring(4, 6);
    const day = dateKey.substring(6, 8);
    return `${month}/${day}/${year}`;
  };

  const getChartData = (exercise: ExerciseHistory) => {
    const sortedEntries = [...exercise.entries].sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      labels: sortedEntries.map(entry => formatDateForChart(entry.date)),
      datasets: [
        {
          label: 'Weight (lbs)',
          data: sortedEntries.map(entry => parseFloat(entry.weight) || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.2,
          fill: false,
        }
      ]
    };
  };

  const filteredExercises = exerciseHistory.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupWorkoutsByMuscle = () => {
    const grouped: GroupedWorkout[] = [];
    
    Object.entries(recentWorkouts)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([dateKey, exercises]) => {
        const muscleGroups: { [muscleGroup: string]: WorkoutLog[] } = {};
        
        exercises.forEach(exercise => {
          // Simple muscle group classification based on exercise name
          let muscleGroup = "Other";
          const exerciseName = exercise.name.toLowerCase();
          
          if (exerciseName.includes("bench") || exerciseName.includes("chest") || exerciseName.includes("fly")) {
            muscleGroup = "Chest";
          } else if (exerciseName.includes("pull") || exerciseName.includes("row") || exerciseName.includes("lat")) {
            muscleGroup = "Back";
          } else if (exerciseName.includes("squat") || exerciseName.includes("leg") || exerciseName.includes("lunge")) {
            muscleGroup = "Legs";
          } else if (exerciseName.includes("shoulder") || exerciseName.includes("press") || exerciseName.includes("raise")) {
            muscleGroup = "Shoulders";
          } else if (exerciseName.includes("curl") || exerciseName.includes("tricep") || exerciseName.includes("bicep")) {
            muscleGroup = "Arms";
          }
          
          if (!muscleGroups[muscleGroup]) {
            muscleGroups[muscleGroup] = [];
          }
          muscleGroups[muscleGroup].push(exercise);
        });
        
        grouped.push({
          date: dateKey,
          muscleGroups
        });
      });
    
    return grouped;
  };

  if (loading) {
    return <div className="text-center py-8">Loading training data...</div>;
  }

  const muscleGroupColors: { [key: string]: string } = {
    "Chest": "🟦",
    "Back": "🟧", 
    "Legs": "🟩",
    "Shoulders": "🟡",
    "Arms": "🟣",
    "Other": "⚫"
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="programs">Programs</TabsTrigger>
        <TabsTrigger value="exercise-history">Exercise History</TabsTrigger>
        <TabsTrigger value="completed-workouts">Completed Workouts</TabsTrigger>
      </TabsList>

      {/* Programs Tab */}
      <TabsContent value="programs" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Training Programs</h3>
          <Button className="hubfit-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </Button>
        </div>

        {workoutProgram && workoutProgram.splits ? (
          <div className="space-y-4">
            {workoutProgram.splits.map((split, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Dumbbell className="w-5 h-5 mr-2 text-blue-600" />
                    {split.day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {split.muscleGroups.map((muscleGroup, mgIndex) => (
                      <div key={mgIndex}>
                        <h5 className="font-semibold text-gray-900 mb-2">{muscleGroup.muscleGroupName}</h5>
                        <div className="grid gap-2">
                          {muscleGroup.exercises.map((exercise, exIndex) => (
                            <div key={exIndex} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <span className="font-medium">{exercise.name}</span>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>{exercise.sets} sets</span>
                                <span>{exercise.reps} reps</span>
                                <span>{exercise.weight} lbs</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No training program set up yet</p>
                <p className="text-sm mt-2">Training programs will appear here when assigned</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Exercise History Tab */}
      <TabsContent value="exercise-history" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Exercise History</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {selectedExercise ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedExercise(null)}
                >
                  ← Back
                </Button>
                <h4 className="text-xl font-semibold">{selectedExercise.name}</h4>
              </div>
              <Badge variant="outline" className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {selectedExercise.entries.length} sessions
              </Badge>
            </div>

            {/* Weight Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart 
                  data={getChartData(selectedExercise)} 
                  height={300}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: false,
                        title: {
                          display: true,
                          text: 'Weight (lbs)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Date'
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Historical Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedExercise.entries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{formatWorkoutDate(entry.date)}</span>
                      <span className="text-gray-600">
                        {entry.sets} sets x {entry.reps} reps x {entry.weight} lbs
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No exercises found</p>
                  <p className="text-sm mt-2">Exercises will appear here when workouts are logged</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredExercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <div className="flex items-center space-x-3">
                        <Dumbbell className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{exercise.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{exercise.entries.length} sessions</span>
                        <span>Latest: {exercise.entries[0]?.weight || 0} lbs</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Completed Workouts Tab */}
      <TabsContent value="completed-workouts" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Completed Workouts</h3>
        </div>

        {Object.keys(recentWorkouts).length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <p>No workouts recorded yet</p>
                <p className="text-sm mt-2">Workouts will appear here when the client logs them</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupWorkoutsByMuscle().map((workout, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formatWorkoutDate(workout.date)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(workout.muscleGroups).map(([muscleGroup, exercises]) => (
                      <div key={muscleGroup}>
                        <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <span className="mr-2">{muscleGroupColors[muscleGroup] || "⚫"}</span>
                          {muscleGroup}
                        </h5>
                        <div className="ml-6 space-y-2">
                          {exercises.map((exercise, exIndex) => (
                            <div key={exIndex} className="text-gray-700">
                              • {exercise.name} – {exercise.sets}x{exercise.reps} @ {exercise.weight} lbs
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

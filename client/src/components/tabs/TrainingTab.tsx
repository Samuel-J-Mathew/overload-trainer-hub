import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Dumbbell } from "lucide-react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

export const TrainingTab = ({ clientId }: TrainingTabProps) => {
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutsByDate>({});
  const [loading, setLoading] = useState(true);

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

  // Load recent workouts from /users/{userUID}/workouts/{YYYYMMDD}/exercises/{exerciseUID}
  const loadRecentWorkouts = async () => {
    try {
      const workoutsCollection = collection(db, "users", clientId, "workouts");
      const workoutDatesSnapshot = await getDocs(workoutsCollection);
      
      const workoutsByDate: WorkoutsByDate = {};
      
      for (const dateDoc of workoutDatesSnapshot.docs) {
        const dateKey = dateDoc.id; // YYYYMMDD format
        const exercisesCollection = collection(db, "users", clientId, "workouts", dateKey, "exercises");
        const exercisesSnapshot = await getDocs(exercisesCollection);
        
        const exercises: WorkoutLog[] = [];
        exercisesSnapshot.forEach((exerciseDoc) => {
          exercises.push(exerciseDoc.data() as WorkoutLog);
        });
        
        if (exercises.length > 0) {
          workoutsByDate[dateKey] = exercises;
        }
      }
      
      setRecentWorkouts(workoutsByDate);
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

  if (loading) {
    return <div className="text-center py-8">Loading training data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Training Programs</h3>
        <Button className="hubfit-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* Training Program (Workout Split) */}
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

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(recentWorkouts).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No workouts recorded yet</p>
              <p className="text-sm mt-2">Workouts will appear here when the client logs them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(recentWorkouts)
                .sort(([a], [b]) => b.localeCompare(a)) // Sort by date desc
                .map(([dateKey, exercises]) => (
                <Card key={dateKey} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">
                        Workout - {formatWorkoutDate(dateKey)}
                      </h5>
                      <Badge variant="outline">{exercises.length} exercises</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2">
                      {exercises.map((exercise, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium">{exercise.name}</span>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{exercise.sets} sets</span>
                            <span>{exercise.reps} reps</span>
                            <span>{exercise.weight} lbs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

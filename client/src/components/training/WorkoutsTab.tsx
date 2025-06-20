import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query, collectionGroup, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Calendar, Dumbbell, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Workout {
  id: string;
  name: string;
  programId: string;
  programName: string;
  exerciseCount: number;
  exercises: WorkoutExercise[];
  createdAt: Timestamp;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
}

export const WorkoutsTab = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Load all workouts from all programs
  useEffect(() => {
    if (!user?.uid) return;

    const programsRef = collection(db, 'coaches', user.uid, 'Programs');
    
    const unsubscribe = onSnapshot(programsRef, async (programsSnapshot) => {
      const allWorkouts: Workout[] = [];
      
      for (const programDoc of programsSnapshot.docs) {
        const programData = programDoc.data();
        const workoutsRef = collection(db, 'coaches', user.uid, 'Programs', programDoc.id, 'workouts');
        
        const workoutsSnapshot = await new Promise<any>((resolve) => {
          const unsub = onSnapshot(workoutsRef, resolve);
          return unsub;
        });
        
        workoutsSnapshot.forEach((workoutDoc: any) => {
          const workoutData = workoutDoc.data();
          allWorkouts.push({
            id: workoutDoc.id,
            name: workoutData.name || `Day ${workoutDoc.id}`,
            programId: programDoc.id,
            programName: programData.name,
            exerciseCount: workoutData.exercises?.length || 0,
            exercises: workoutData.exercises || [],
            createdAt: workoutData.createdAt || programData.createdAt
          });
        });
      }
      
      setWorkouts(allWorkouts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter workouts
  useEffect(() => {
    const filtered = workouts.filter(workout =>
      workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.programName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorkouts(filtered);
  }, [workouts, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Workouts</h2>
          <p className="text-sm text-gray-600">View workouts from all your programs</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search workouts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-gray-300"
        />
      </div>

      {/* Workouts Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="text-gray-600 font-medium">Workout Name</TableHead>
              <TableHead className="text-gray-600 font-medium">Program</TableHead>
              <TableHead className="text-gray-600 font-medium">Exercises</TableHead>
              <TableHead className="text-gray-600 font-medium">Created</TableHead>
              <TableHead className="text-gray-600 font-medium w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredWorkouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500">
                    {searchQuery ? "No workouts found" : "No workouts created yet"}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Create a program and add workout days to see them here
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkouts.map((workout) => (
                <TableRow key={`${workout.programId}-${workout.id}`} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{workout.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {workout.programName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{workout.exerciseCount} exercises</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {format(workout.createdAt.toDate(), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        // Navigate back to program builder with this workout selected
                        window.location.hash = `#program-${workout.programId}-workout-${workout.id}`;
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
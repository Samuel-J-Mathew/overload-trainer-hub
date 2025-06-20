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
import { collection, onSnapshot, query, collectionGroup, Timestamp, doc, updateDoc, arrayUnion, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Calendar, Dumbbell, ArrowRight, ArrowLeft, X, Plus, GripVertical } from "lucide-react";
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

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
}

export const WorkoutsTab = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExercisePanel, setShowExercisePanel] = useState(false);

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

  // Load exercises
  useEffect(() => {
    if (!user?.uid) return;

    const exercisesRef = collection(db, 'coaches', user.uid, 'exercises');
    const exercisesQuery = query(exercisesRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
      const loadedExercises: Exercise[] = [];
      snapshot.forEach((doc) => {
        loadedExercises.push({
          id: doc.id,
          ...doc.data()
        } as Exercise);
      });
      setExercises(loadedExercises);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter exercises
  useEffect(() => {
    const filtered = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
      exercise.muscleGroup.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [exercises, exerciseSearchQuery]);

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors: { [key: string]: string } = {
      "Chest": "bg-red-100 text-red-800",
      "Back": "bg-blue-100 text-blue-800",
      "Legs": "bg-green-100 text-green-800",
      "Shoulders": "bg-yellow-100 text-yellow-800",
      "Arms": "bg-purple-100 text-purple-800",
      "Biceps": "bg-purple-100 text-purple-800",
      "Triceps": "bg-purple-100 text-purple-800",
      "Abs": "bg-orange-100 text-orange-800",
      "Core": "bg-orange-100 text-orange-800",
      "Cardio": "bg-pink-100 text-pink-800"
    };
    return colors[muscleGroup] || "bg-gray-100 text-gray-800";
  };

  const addExerciseToWorkout = async (exerciseDetails: {
    sets: number;
    reps: number;
    weight: number;
    notes?: string;
  }) => {
    if (!selectedExercise || !selectedWorkout || !user?.uid) return;

    try {
      const workoutRef = doc(db, 'coaches', user.uid, 'Programs', selectedWorkout.programId, 'workouts', selectedWorkout.id);
      
      const newExercise: WorkoutExercise = {
        id: `${selectedExercise.id}-${Date.now()}`,
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        sets: exerciseDetails.sets,
        reps: exerciseDetails.reps,
        weight: exerciseDetails.weight,
        notes: exerciseDetails.notes
      };

      await updateDoc(workoutRef, {
        exercises: arrayUnion(newExercise)
      });

      // Update local state
      setSelectedWorkout(prev => prev ? {
        ...prev,
        exercises: [...prev.exercises, newExercise],
        exerciseCount: prev.exerciseCount + 1
      } : null);

      setSelectedExercise(null);
      setShowExercisePanel(false);
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      alert('Error adding exercise. Please try again.');
    }
  };

  // Show workout detail view if a workout is selected
  if (selectedWorkout) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedWorkout(null)}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workouts
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedWorkout.name}</h2>
            <p className="text-sm text-gray-600">From program: {selectedWorkout.programName}</p>
          </div>
        </div>

        {/* Workout Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workout Exercises */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Exercises</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedWorkout.exerciseCount} exercises
                  </Badge>
                  <Button
                    onClick={() => setShowExercisePanel(!showExercisePanel)}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>
              </div>
            
            {selectedWorkout.exercises.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Dumbbell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No exercises added to this workout yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedWorkout.exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">{exercise.exerciseName}</h4>
                        <p className="text-sm text-gray-600">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight > 0 && ` @ ${exercise.weight}lbs`}
                        </p>
                        {exercise.notes && (
                          <p className="text-xs text-gray-500 mt-1">{exercise.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created: {format(selectedWorkout.createdAt.toDate(), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>

          {/* Exercise Library Panel */}
          {showExercisePanel && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Exercise Library</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExercisePanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Exercise Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exercises..."
                  value={exerciseSearchQuery}
                  onChange={(e) => setExerciseSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300"
                />
              </div>

              {/* Exercise List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                        <Badge className={`text-xs ${getMuscleGroupColor(exercise.muscleGroup)}`}>
                          {exercise.muscleGroup}
                        </Badge>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>

              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Dumbbell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p>No exercises found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exercise Details Modal */}
        {selectedExercise && (
          <ExerciseDetailsModal
            open={selectedExercise !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedExercise(null);
              }
            }}
            exercise={selectedExercise}
            onSubmit={addExerciseToWorkout}
          />
        )}
      </div>
    );
  }

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
                      onClick={() => setSelectedWorkout(workout)}
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
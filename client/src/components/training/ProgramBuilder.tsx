import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddWorkoutModal } from "./AddWorkoutModal";
import { ExerciseDetailsModal } from "./ExerciseDetailsModal";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, Timestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Plus, Search, Dumbbell, GripVertical, Trash2, X, MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
}

interface WorkoutDay {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
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

interface ProgramBuilderProps {
  program: Program;
  onBack: () => void;
}

export const ProgramBuilder = ({ program, onBack }: ProgramBuilderProps) => {
  const { user } = useAuth();
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [targetWorkoutId, setTargetWorkoutId] = useState<string | null>(null);
  const [draggedExercise, setDraggedExercise] = useState<Exercise | null>(null);
  const [deletingProgram, setDeletingProgram] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  // Load workout days
  useEffect(() => {
    if (!user?.uid) return;

    const workoutsRef = collection(db, 'coaches', user.uid, 'Programs', program.id, 'workouts');
    const workoutsQuery = query(workoutsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(workoutsQuery, (snapshot) => {
      const loadedWorkouts: WorkoutDay[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedWorkouts.push({
          id: doc.id,
          name: data.name || `Day ${doc.id}`,
          exercises: data.exercises || []
        });
      });
      
      setWorkoutDays(loadedWorkouts);
      
      // Set first workout as active if none selected and this is the initial load
      if (loadedWorkouts.length > 0 && !activeWorkoutId) {
        setActiveWorkoutId(loadedWorkouts[0].id);
      }
      // If we have an active workout, make sure it still exists in the loaded workouts
      else if (activeWorkoutId && loadedWorkouts.length > 0) {
        const stillExists = loadedWorkouts.find(w => w.id === activeWorkoutId);
        if (!stillExists) {
          setActiveWorkoutId(loadedWorkouts[0].id);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, program.id]);



  // Load exercises
  useEffect(() => {
    if (!user?.uid) return;

    const exercisesRef = collection(db, 'coaches', user.uid, 'exercises');
    const exercisesQuery = query(exercisesRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
      const loadedExercises: Exercise[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedExercises.push({
          id: doc.id,
          name: data.name,
          muscleGroup: data.muscleGroup,
          description: data.description
        });
      });
      
      setExercises(loadedExercises);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter exercises
  useEffect(() => {
    const filtered = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [exercises, searchQuery]);

  const handleDragStart = (exercise: Exercise) => {
    setDraggedExercise(exercise);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, workoutId: string) => {
    e.preventDefault();
    if (draggedExercise) {
      setSelectedExercise(draggedExercise);
      setTargetWorkoutId(workoutId);
      setDraggedExercise(null);
    }
  };

  const addExerciseToWorkout = async (exerciseDetails: {
    sets: number;
    reps: number;
    weight: number;
    notes?: string;
  }) => {
    if (!selectedExercise || !targetWorkoutId || !user?.uid) return;

    try {
      const workoutRef = doc(db, 'coaches', user.uid, 'Programs', program.id, 'workouts', targetWorkoutId);
      
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

      setSelectedExercise(null);
      setTargetWorkoutId(null);
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
    }
  };

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

  const handleDeleteProgram = async () => {
    if (!user?.uid) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this program? This action cannot be undone and will delete all workouts and exercises.');
    if (!confirmDelete) return;

    setDeletingProgram(true);
    try {
      const programRef = doc(db, 'coaches', user.uid, 'Programs', program.id);
      await deleteDoc(programRef);
      onBack(); // Navigate back to programs list
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Error deleting program. Please try again.');
    }
    setDeletingProgram(false);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user?.uid) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this workout?');
    if (!confirmDelete) return;

    try {
      const workoutRef = doc(db, 'coaches', user.uid, 'Programs', program.id, 'workouts', workoutId);
      await deleteDoc(workoutRef);
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Error deleting workout. Please try again.');
    }
  };

  const handleRemoveExercise = async (workoutId: string, exerciseId: string) => {
    if (!user?.uid) return;

    try {
      const workout = workoutDays.find(w => w.id === workoutId);
      if (!workout) return;

      const updatedExercises = workout.exercises.filter(ex => ex.id !== exerciseId);
      
      const workoutRef = doc(db, 'coaches', user.uid, 'Programs', program.id, 'workouts', workoutId);
      await updateDoc(workoutRef, {
        exercises: updatedExercises
      });
    } catch (error) {
      console.error('Error removing exercise:', error);
      alert('Error removing exercise. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Exercise Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-600">{exercises.length} EXERCISES</span>
            <Button variant="outline" size="sm" className="ml-auto">
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exercise"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              draggable
              onDragStart={() => handleDragStart(exercise)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow"
            >
              <Dumbbell className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">{exercise.name}</div>
                <Badge className={`text-xs ${getMuscleGroupColor(exercise.muscleGroup)}`}>
                  {exercise.muscleGroup}
                </Badge>
              </div>
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{program.name}</h1>
              <p className="text-sm text-gray-600">{program.description || "No description"}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                onClick={handleDeleteProgram}
                disabled={deletingProgram}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deletingProgram ? 'Deleting...' : 'Delete Program'}
              </Button>
              <Button
                onClick={() => setShowAddWorkoutModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Workout
              </Button>
            </div>
          </div>

          {/* Workout Days Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {workoutDays.map((workout) => (
              <button
                key={workout.id}
                onClick={() => setActiveWorkoutId(workout.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeWorkoutId === workout.id
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
              >
                {workout.name}
              </button>
            ))}
          </div>
        </div>

        {/* Workout Content */}
        <div className="flex-1 p-6">
          {workoutDays.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No workout days yet</h3>
              <p className="text-gray-500 mb-4">Add your first workout day to get started</p>
              <Button 
                onClick={() => setShowAddWorkoutModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Workout
              </Button>
            </div>
          ) : (
            <>
              {/* Active Workout Display */}
              {activeWorkoutId && workoutDays.find(w => w.id === activeWorkoutId) && (() => {
                const workout = workoutDays.find(w => w.id === activeWorkoutId)!;
                return (
                  <Card
                    className="min-h-[400px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, workout.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {workout.name}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteWorkout(workout.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Workout
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {workout.exercises.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <Dumbbell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            Drag an exercise here or click the button below
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                              setTargetWorkoutId(workout.id);
                              setSelectedExercise(null);
                            }}
                          >
                            Add Exercise
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {workout.exercises.map((exercise, index) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                                <div>
                                  <div className="font-medium text-gray-900 mb-1">
                                    {exercise.exerciseName}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.weight > 0 && ` @ ${exercise.weight}lbs`}
                                  </div>
                                  {exercise.notes && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {exercise.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExercise(workout.id, exercise.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        onClick={() => {
                          setTargetWorkoutId(workout.id);
                          setSelectedExercise(null);
                        }}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddWorkoutModal
        open={showAddWorkoutModal}
        onOpenChange={setShowAddWorkoutModal}
        programId={program.id}
      />

      <ExerciseDetailsModal
        open={selectedExercise !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
            setTargetWorkoutId(null);
          }
        }}
        exercise={selectedExercise}
        onSubmit={addExerciseToWorkout}
      />
    </div>
  );
};
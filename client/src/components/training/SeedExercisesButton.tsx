import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Download } from "lucide-react";

const defaultExercises = [
  { name: "Belt Squat", muscleGroup: "Legs" },
  { name: "Pull-Ups", muscleGroup: "Back" },
  { name: "Sit-Ups", muscleGroup: "Abs" },
  { name: "Bicycle Crunches", muscleGroup: "Abs" },
  { name: "Leg Raises", muscleGroup: "Abs" },
  { name: "Cable Crunches", muscleGroup: "Abs" },
  { name: "Deadlifts", muscleGroup: "Back" },
  { name: "DB Rows", muscleGroup: "Back" },
  { name: "Lat Pulldowns", muscleGroup: "Back" },
  { name: "Seated Rows", muscleGroup: "Back" },
  { name: "BB Rows", muscleGroup: "Back" },
  { name: "Tbar Rows", muscleGroup: "Back" },
  { name: "Assisted Pullups", muscleGroup: "Back" },
  { name: "DB Curls", muscleGroup: "Biceps" },
  { name: "Cable Curls", muscleGroup: "Biceps" },
  { name: "Hammer Curls", muscleGroup: "Biceps" },
  { name: "Spider Curls", muscleGroup: "Biceps" },
  { name: "Preacher Curls", muscleGroup: "Biceps" },
  { name: "BB Bench", muscleGroup: "Chest" },
  { name: "Machine Press", muscleGroup: "Chest" },
  { name: "DB Bench", muscleGroup: "Chest" },
  { name: "Smith Bench", muscleGroup: "Chest" },
  { name: "Rope Chest Press", muscleGroup: "Chest" },
  { name: "Pec Deck", muscleGroup: "Chest" },
  { name: "DB Squats", muscleGroup: "Legs" },
  { name: "DB Lunges", muscleGroup: "Legs" },
  { name: "Leg Extensions", muscleGroup: "Legs" },
  { name: "BB Squats", muscleGroup: "Legs" },
  { name: "Hyperextensions", muscleGroup: "Back" },
  { name: "Leg Curls", muscleGroup: "Legs" },
  { name: "Leg Press", muscleGroup: "Legs" },
  { name: "V-Squat", muscleGroup: "Legs" },
  { name: "RDL", muscleGroup: "Legs" },
  { name: "Hipthrusts", muscleGroup: "Legs" },
  { name: "Hack Squats", muscleGroup: "Legs" },
  { name: "Bulgarian Split Squats", muscleGroup: "Legs" },
  { name: "Smith Squats", muscleGroup: "Legs" },
  { name: "BB Shoulder Press", muscleGroup: "Shoulders" },
  { name: "DB Shoulder Press", muscleGroup: "Shoulders" },
  { name: "Arnold Press", muscleGroup: "Shoulders" },
  { name: "Machine Lateral Raise", muscleGroup: "Shoulders" },
  { name: "DB Lateral Raise", muscleGroup: "Shoulders" },
  { name: "Rope Lateral Raise", muscleGroup: "Shoulders" },
  { name: "Face Pulls", muscleGroup: "Shoulders" },
  { name: "Machine Shoulder Press", muscleGroup: "Shoulders" },
  { name: "Rope Pushdowns", muscleGroup: "Triceps" },
  { name: "Single Arm Pushdowns", muscleGroup: "Triceps" },
  { name: "Tricep overhead extension", muscleGroup: "Triceps" },
  { name: "Bar Pushdowns", muscleGroup: "Triceps" }
];

export const SeedExercisesButton = () => {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleSeedExercises = async () => {
    if (!user?.uid) return;

    setSeeding(true);
    try {
      const exercisesRef = collection(db, 'coaches', user.uid, 'exercises');
      
      // Check if exercises already exist
      const existingExercises = await getDocs(exercisesRef);
      if (existingExercises.size > 0) {
        alert('Exercises already exist in your library');
        setSeeding(false);
        return;
      }

      // Add all default exercises
      for (const exercise of defaultExercises) {
        await addDoc(exercisesRef, {
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          description: '',
          createdAt: serverTimestamp()
        });
      }

      alert(`Successfully added ${defaultExercises.length} exercises to your library!`);
    } catch (error) {
      console.error('Error seeding exercises:', error);
      alert('Error adding exercises. Please try again.');
    }
    setSeeding(false);
  };

  return (
    <Button
      onClick={handleSeedExercises}
      disabled={seeding}
      variant="outline"
      size="sm"
      className="border-blue-600 text-blue-600 hover:bg-blue-50"
    >
      {seeding ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding Exercises...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Load Default Exercises
        </>
      )}
    </Button>
  );
};
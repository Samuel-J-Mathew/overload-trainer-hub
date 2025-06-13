import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dumbbell, Loader2 } from "lucide-react";

interface AddExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddExerciseModal = ({ open, onOpenChange }: AddExerciseModalProps) => {
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [description, setDescription] = useState("");

  const muscleGroups = [
    "Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Abs", "Core", "Cardio"
  ];

  const handleSubmit = async () => {
    if (!exerciseName.trim() || !muscleGroup || !user?.uid) return;

    setCreating(true);
    try {
      const exercisesRef = collection(db, 'coaches', user.uid, 'exercises');
      
      await addDoc(exercisesRef, {
        name: exerciseName.trim(),
        muscleGroup: muscleGroup,
        description: description.trim(),
        createdAt: serverTimestamp()
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
    setCreating(false);
  };

  const resetForm = () => {
    setExerciseName("");
    setMuscleGroup("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Dumbbell className="h-5 w-5" />
            Add New Exercise
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Add a new exercise to your library.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="exerciseName" className="text-gray-900">Exercise Name</Label>
            <Input
              id="exerciseName"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Barbell Bench Press"
              className="border-gray-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="muscleGroup" className="text-gray-900">Muscle Group</Label>
            <Select value={muscleGroup} onValueChange={setMuscleGroup}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Select muscle group" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {muscleGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-gray-900">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exercise instructions or notes..."
              className="border-gray-300 min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!exerciseName.trim() || !muscleGroup || creating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Exercise'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
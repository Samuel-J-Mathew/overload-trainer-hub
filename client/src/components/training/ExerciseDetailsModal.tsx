import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2 } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
}

interface ExerciseDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
  onSubmit: (details: {
    sets: number;
    reps: number;
    weight: number;
    notes?: string;
  }) => Promise<void>;
}

export const ExerciseDetailsModal = ({ 
  open, 
  onOpenChange, 
  exercise, 
  onSubmit 
}: ExerciseDetailsModalProps) => {
  const [adding, setAdding] = useState(false);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!exercise) return;

    setAdding(true);
    try {
      await onSubmit({
        sets,
        reps,
        weight,
        notes: notes.trim()
      });

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
    setAdding(false);
  };

  const resetForm = () => {
    setSets(3);
    setReps(10);
    setWeight(0);
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
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

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Dumbbell className="h-5 w-5" />
            {exercise.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge className={getMuscleGroupColor(exercise.muscleGroup)}>
              {exercise.muscleGroup}
            </Badge>
            <span className="text-gray-600">Add to workout</span>
          </DialogDescription>
        </DialogHeader>

        {exercise.description && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            {exercise.description}
          </div>
        )}

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sets" className="text-gray-900">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                min="1"
                className="border-gray-300"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reps" className="text-gray-900">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                min="1"
                className="border-gray-300"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weight" className="text-gray-900">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                min="0"
                step="5"
                className="border-gray-300"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-gray-900">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Exercise instructions or modifications..."
              className="border-gray-300 min-h-[60px]"
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
            disabled={sets < 1 || reps < 1 || adding}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
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
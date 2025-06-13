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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, Loader2 } from "lucide-react";

interface AddWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
}

export const AddWorkoutModal = ({ open, onOpenChange, programId }: AddWorkoutModalProps) => {
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [workoutName, setWorkoutName] = useState("");

  const handleSubmit = async () => {
    if (!workoutName.trim() || !user?.uid) return;

    setCreating(true);
    try {
      const workoutsRef = collection(db, 'coaches', user.uid, 'Programs', programId, 'workouts');
      
      await addDoc(workoutsRef, {
        name: workoutName.trim(),
        exercises: [],
        createdAt: serverTimestamp()
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating workout:', error);
    }
    setCreating(false);
  };

  const resetForm = () => {
    setWorkoutName("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="h-5 w-5" />
            Add Workout Day
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new workout day for this program.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workoutName" className="text-gray-900">Workout Name</Label>
            <Input
              id="workoutName"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Push Day, Pull Day, Leg Day"
              className="border-gray-300"
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
            disabled={!workoutName.trim() || creating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Workout'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
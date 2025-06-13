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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dumbbell, Loader2 } from "lucide-react";

interface AddProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddProgramModal = ({ open, onOpenChange }: AddProgramModalProps) => {
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");

  const handleSubmit = async () => {
    if (!programName.trim() || !user?.uid) return;

    setCreating(true);
    try {
      const programsRef = collection(db, 'coaches', user.uid, 'Programs');
      
      await addDoc(programsRef, {
        name: programName.trim(),
        description: programDescription.trim(),
        createdAt: serverTimestamp()
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating program:', error);
    }
    setCreating(false);
  };

  const resetForm = () => {
    setProgramName("");
    setProgramDescription("");
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
            Add New Program
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new training program with workouts and exercises.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="programName" className="text-gray-900">Program Name</Label>
            <Input
              id="programName"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., 12-Week Strength Program"
              className="border-gray-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-gray-900">Description</Label>
            <Textarea
              id="description"
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              placeholder="Describe the goals and structure of this program..."
              className="border-gray-300 min-h-[100px]"
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
            disabled={!programName.trim() || creating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Program'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
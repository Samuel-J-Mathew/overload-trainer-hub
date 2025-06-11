import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Target, Loader2 } from "lucide-react";

interface TotalMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface AddMacrosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  clientId: string;
  currentMacros: TotalMacros | null;
}

export const AddMacrosModal = ({ open, onOpenChange, planId, clientId, currentMacros }: AddMacrosModalProps) => {
  const { user } = useAuth();
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentMacros) {
      setCalories(currentMacros.calories.toString());
      setProtein(currentMacros.protein.toString());
      setCarbs(currentMacros.carbs.toString());
      setFats(currentMacros.fats.toString());
    }
  }, [currentMacros, open]);

  const handleSubmit = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const planRef = doc(db, 'coaches', user.uid, 'clients', clientId, 'nutrition', 'plans', planId);
      await updateDoc(planRef, {
        macros: {
          calories: calories ? parseInt(calories) : 0,
          protein: protein ? parseInt(protein) : 0,
          carbs: carbs ? parseInt(carbs) : 0,
          fats: fats ? parseInt(fats) : 0
        }
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving macros:', error);
    }
    setSaving(false);
  };

  const handleClose = () => {
    if (!currentMacros) {
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            {currentMacros ? 'Edit Daily Targets' : 'Set Daily Targets'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                placeholder="2400"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="180"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="250"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fats">Fats (g)</Label>
              <Input
                id="fats"
                type="number"
                placeholder="70"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {calories || 0}
                </div>
                <div className="text-xs text-gray-500">Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {protein || 0}g
                </div>
                <div className="text-xs text-gray-500">Protein</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {carbs || 0}g
                </div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {fats || 0}g
                </div>
                <div className="text-xs text-gray-500">Fats</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={saving}
          >
            Close
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Targets'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
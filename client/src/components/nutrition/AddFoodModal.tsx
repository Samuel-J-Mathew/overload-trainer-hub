import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Apple, Loader2 } from "lucide-react";

interface AddFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddFoodModal = ({ open, onOpenChange }: AddFoodModalProps) => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  // Form states
  const [foodName, setFoodName] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState("grams");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fats, setFats] = useState("");
  const [notes, setNotes] = useState("");

  const servingUnits = [
    { value: "grams", label: "grams" },
    { value: "oz", label: "oz" },
    { value: "cups", label: "cups" },
    { value: "pieces", label: "pieces" },
    { value: "slices", label: "slices" },
    { value: "tablespoons", label: "tablespoons" },
    { value: "teaspoons", label: "teaspoons" }
  ];

  const calculateCalories = () => {
    const proteinCals = (parseFloat(protein) || 0) * 4;
    const carbsCals = (parseFloat(carbs) || 0) * 4;
    const fatsCals = (parseFloat(fats) || 0) * 9;
    return Math.round(proteinCals + carbsCals + fatsCals);
  };

  const handleSubmit = async () => {
    if (!foodName.trim() || !user?.uid) return;

    setCreating(true);
    try {
      const foodsRef = collection(db, 'coaches', user.uid, 'nutritionFoods');
      await addDoc(foodsRef, {
        name: foodName.trim(),
        servingSize: parseFloat(servingSize) || 1,
        servingUnit: servingUnit,
        calories: calculateCalories(),
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        notes: notes.trim(),
        timestamp: serverTimestamp()
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating food:', error);
    }
    setCreating(false);
  };

  const resetForm = () => {
    setFoodName("");
    setServingSize("");
    setServingUnit("grams");
    setCarbs("");
    setProtein("");
    setFats("");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const getPercentage = (macro: string) => {
    const totalCals = calculateCalories();
    if (totalCals === 0) return 0;
    
    const macroValue = parseFloat(macro) || 0;
    const macroCals = macro === fats ? macroValue * 9 : macroValue * 4;
    return Math.round((macroCals / totalCals) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Apple className="w-4 h-4 text-white" />
            </div>
            New Food
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="foodName">Food Name *</Label>
            <Input
              id="foodName"
              placeholder="Name of the food e.g. Chicken"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="servingSize">Serving Size *</Label>
              <Input
                id="servingSize"
                type="number"
                placeholder="Enter serving size"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servingUnit">Serving Unit *</Label>
              <Select value={servingUnit} onValueChange={setServingUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {servingUnits.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs *</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="Enter amount"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein *</Label>
              <Input
                id="protein"
                type="number"
                placeholder="Enter amount"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fats">Fats *</Label>
              <Input
                id="fats"
                type="number"
                placeholder="Enter amount"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter any additional info"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Macro breakdown preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-center mb-3">
              <div className="text-2xl font-bold text-gray-900">{calculateCalories()}</div>
              <div className="text-sm text-gray-500">kcals</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-medium text-green-600">Carbs</div>
                <div className="text-xs text-gray-500">{carbs || 0}g - {getPercentage(carbs)}%</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">Protein</div>
                <div className="text-xs text-gray-500">{protein || 0}g - {getPercentage(protein)}%</div>
              </div>
              <div>
                <div className="font-medium text-purple-600">Fats</div>
                <div className="text-xs text-gray-500">{fats || 0}g - {getPercentage(fats)}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={creating}
          >
            Close
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!foodName.trim() || creating}
            className="bg-primary hover:bg-primary/90"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Food'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChefHat, Loader2, Utensils } from "lucide-react";

interface AddMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  clientId: string;
  planType: "mealPlan" | "totalMacros" | "macrosByMeal";
}

export const AddMealModal = ({ open, onOpenChange, planId, clientId, planType }: AddMealModalProps) => {
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);

  // Form states
  const [mealName, setMealName] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [mealInstructions, setMealInstructions] = useState("");
  const [mealNotes, setMealNotes] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const handleSubmit = async () => {
    if (!mealName.trim() || !user?.uid) return;

    setCreating(true);
    try {
      const mealsRef = collection(db, 'coaches', user.uid, 'nutritionPlans', planId, 'meals');
      
      const mealData: any = {
        name: mealName.trim(),
        createdAt: serverTimestamp()
      };

      if (planType === 'mealPlan') {
        mealData.description = mealDescription.trim();
        mealData.instructions = mealInstructions.trim();
      } else if (planType === 'macrosByMeal') {
        mealData.notes = mealNotes.trim();
        mealData.protein = protein ? parseInt(protein) : 0;
        mealData.carbs = carbs ? parseInt(carbs) : 0;
        mealData.fats = fats ? parseInt(fats) : 0;
      }

      await addDoc(mealsRef, mealData);

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating meal:', error);
    }
    setCreating(false);
  };

  const resetForm = () => {
    setMealName("");
    setMealDescription("");
    setMealInstructions("");
    setMealNotes("");
    setProtein("");
    setCarbs("");
    setFats("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const renderMealPlanForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mealName">Meal Name *</Label>
        <Input
          id="mealName"
          placeholder="Name of the meal e.g. Breakfast"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mealDescription">Meal Description</Label>
        <Textarea
          id="mealDescription"
          placeholder="Enter any additional info"
          value={mealDescription}
          onChange={(e) => setMealDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mealInstructions">Meal Instructions</Label>
        <Textarea
          id="mealInstructions"
          placeholder="Enter any additional info"
          value={mealInstructions}
          onChange={(e) => setMealInstructions(e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );

  const renderMacrosByMealForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mealName">Meal Name *</Label>
        <Input
          id="mealName"
          placeholder="Name of the meal e.g. Lunch"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mealNotes">Notes</Label>
        <Textarea
          id="mealNotes"
          placeholder="High-carb, post-workout meal"
          value={mealNotes}
          onChange={(e) => setMealNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
        <div>0g - 0%</div>
        <div>0g - 0%</div>
        <div>0g - 0%</div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              {planType === 'macrosByMeal' ? (
                <Utensils className="w-4 h-4 text-white" />
              ) : (
                <ChefHat className="w-4 h-4 text-white" />
              )}
            </div>
            {planType === 'macrosByMeal' ? 'Add Macros Goal' : 'Add Meal'}
          </DialogTitle>
        </DialogHeader>

        {planType === 'mealPlan' && (
          <div className="py-4">
            {renderMealPlanForm()}
          </div>
        )}

        {planType === 'macrosByMeal' && (
          <div className="py-4">
            {renderMacrosByMealForm()}
          </div>
        )}

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
            disabled={!mealName.trim() || creating}
            className="bg-primary hover:bg-primary/90"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              planType === 'macrosByMeal' ? 'Add Meal' : 'Add Meal'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
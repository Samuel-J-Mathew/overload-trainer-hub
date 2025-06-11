import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChefHat, Target, Utensils, Loader2 } from "lucide-react";

interface AddPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const AddPlanModal = ({ open, onOpenChange, clientId }: AddPlanModalProps) => {
  const { user } = useAuth();
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planType, setPlanType] = useState<"mealPlan" | "totalMacros" | "macrosByMeal">("mealPlan");
  const [creating, setCreating] = useState(false);

  const planTypes = [
    {
      id: "mealPlan",
      label: "Meal Plan",
      description: "Complete meal plans with recipes and instructions",
      icon: <ChefHat className="w-6 h-6" />,
      color: "bg-blue-500"
    },
    {
      id: "totalMacros", 
      label: "Total Macros",
      description: "Daily macro targets without specific meals",
      icon: <Target className="w-6 h-6" />,
      color: "bg-green-500"
    },
    {
      id: "macrosByMeal",
      label: "Macros by Meal", 
      description: "Macro targets broken down by individual meals",
      icon: <Utensils className="w-6 h-6" />,
      color: "bg-purple-500"
    }
  ];

  const handleSubmit = async () => {
    if (!planName.trim() || !user?.uid) return;

    setCreating(true);
    try {
      const plansRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'nutrition', 'plans');
      await addDoc(plansRef, {
        name: planName.trim(),
        description: planDescription.trim(),
        type: planType,
        createdAt: serverTimestamp()
      });

      // Reset form
      setPlanName("");
      setPlanDescription("");
      setPlanType("mealPlan");
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            Add Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name *</Label>
            <Input
              id="planName"
              placeholder="Name of the plan e.g. 2000kcal Plan"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="planDescription">Plan Description</Label>
            <Textarea
              id="planDescription"
              placeholder="Enter any additional info"
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Plan Type *</Label>
            <div className="grid grid-cols-1 gap-3">
              {planTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    planType === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPlanType(type.id as any)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center text-white`}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      planType === type.id
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {planType === type.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Close
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!planName.trim() || creating}
            className="bg-primary hover:bg-primary/90"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Plan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChefHat, Loader2 } from "lucide-react";

interface AddStandaloneMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const AddStandaloneMealModal = ({ open, onOpenChange, clientId }: AddStandaloneMealModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("create");
  const [creating, setCreating] = useState(false);

  // Form states
  const [mealName, setMealName] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [mealInstructions, setMealInstructions] = useState("");

  const handleSubmit = async () => {
    if (!mealName.trim() || !user?.uid) return;

    setCreating(true);
    try {
      const mealsRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'nutrition', 'meals');
      await addDoc(mealsRef, {
        name: mealName.trim(),
        description: mealDescription.trim(),
        instructions: mealInstructions.trim(),
        createdAt: serverTimestamp()
      });

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
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            Add Meal
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hubfit">HubFit Recipes</TabsTrigger>
            <TabsTrigger value="ai">Meal AI</TabsTrigger>
            <TabsTrigger value="create" className="bg-primary text-white">Create New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hubfit" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              HubFit recipes integration coming soon
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              AI meal generation coming soon
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
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
          </TabsContent>
        </Tabs>

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
              'Add Meal'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
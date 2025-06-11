import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Plus, Loader2, Target, ChefHat, Utensils } from "lucide-react";
import { AddMealModal } from "./AddMealModal";
import { AddMacrosModal } from "./AddMacrosModal";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Plan {
  id: string;
  name: string;
  description: string;
  type: "mealPlan" | "totalMacros" | "macrosByMeal";
  createdAt: any;
  clientId?: string;
  mealCount?: number;
}

interface Meal {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  notes?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface TotalMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface PlanBuilderProps {
  plan: Plan;
  onBack: () => void;
  onUpdate: (plan: Plan) => void;
}

export const PlanBuilder = ({ plan, onBack, onUpdate }: PlanBuilderProps) => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totalMacros, setTotalMacros] = useState<TotalMacros | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showAddMacrosModal, setShowAddMacrosModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState(plan.name);
  const [planDescription, setPlanDescription] = useState(plan.description);

  // Load plan data from Firebase
  useEffect(() => {
    if (!user?.uid || !plan.clientId) return;

    if (plan.type === 'mealPlan' || plan.type === 'macrosByMeal') {
      // Load meals
      const mealsRef = collection(db, 'coaches', user.uid, 'clients', plan.clientId, 'nutrition', 'plans', plan.id, 'meals');
      const unsubscribe = onSnapshot(mealsRef, (snapshot) => {
        const loadedMeals: Meal[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          loadedMeals.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            instructions: data.instructions,
            notes: data.notes,
            protein: data.protein,
            carbs: data.carbs,
            fats: data.fats
          });
        });
        
        setMeals(loadedMeals);
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (plan.type === 'totalMacros') {
      // Load total macros from plan document
      const planRef = doc(db, 'coaches', user.uid, 'clients', plan.clientId, 'nutrition', 'plans', plan.id);
      const unsubscribe = onSnapshot(planRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data.macros) {
            setTotalMacros(data.macros);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user?.uid, plan.id, plan.clientId, plan.type]);

  const updatePlanDetails = async () => {
    if (!user?.uid || !plan.clientId) return;

    try {
      const planRef = doc(db, 'coaches', user.uid, 'clients', plan.clientId, 'nutrition', 'plans', plan.id);
      await updateDoc(planRef, {
        name: planName,
        description: planDescription
      });
      
      onUpdate({
        ...plan,
        name: planName,
        description: planDescription
      });
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const renderPlanContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading plan details...</p>
        </div>
      );
    }

    switch (plan.type) {
      case 'mealPlan':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Meals</h3>
              <Button
                onClick={() => setShowAddMealModal(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Button>
            </div>

            {meals.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <ChefHat className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-2">No meals added yet</p>
                <Button
                  onClick={() => setShowAddMealModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Add Your First Meal
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {meals.map((meal) => (
                  <Card key={meal.id}>
                    <CardHeader>
                      <h4 className="font-medium text-gray-900">{meal.name}</h4>
                      {meal.description && (
                        <p className="text-sm text-gray-600">{meal.description}</p>
                      )}
                    </CardHeader>
                    {meal.instructions && (
                      <CardContent>
                        <div className="text-sm text-gray-600">
                          <strong>Instructions:</strong> {meal.instructions}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'totalMacros':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Daily Macro Targets</h3>
              <Button
                onClick={() => setShowAddMacrosModal(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Target className="w-4 h-4 mr-2" />
                {totalMacros ? 'Edit Macros' : 'Add Macros'}
              </Button>
            </div>

            {!totalMacros ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-2">No macro targets set</p>
                <Button
                  onClick={() => setShowAddMacrosModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Set Daily Targets
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{totalMacros.calories}</div>
                      <div className="text-sm text-gray-500">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalMacros.protein}g</div>
                      <div className="text-sm text-gray-500">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalMacros.carbs}g</div>
                      <div className="text-sm text-gray-500">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{totalMacros.fats}g</div>
                      <div className="text-sm text-gray-500">Fats</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'macrosByMeal':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Meals with Macro Targets</h3>
              <Button
                onClick={() => setShowAddMealModal(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Macro Goal
              </Button>
            </div>

            {meals.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Utensils className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-2">No meal targets set</p>
                <Button
                  onClick={() => setShowAddMealModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Add Your First Meal
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {meals.map((meal) => (
                  <Card key={meal.id}>
                    <CardHeader>
                      <h4 className="font-medium text-gray-900">{meal.name}</h4>
                      {meal.notes && (
                        <p className="text-sm text-gray-600">{meal.notes}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-600">{meal.protein || 0}g</div>
                          <div className="text-xs text-gray-500">Protein</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">{meal.carbs || 0}g</div>
                          <div className="text-xs text-gray-500">Carbs</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-600">{meal.fats || 0}g</div>
                          <div className="text-xs text-gray-500">Fats</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return <div>Plan type not supported</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            onBlur={updatePlanDetails}
            className="text-xl font-semibold border-none px-0 focus-visible:ring-0"
          />
        </div>
      </div>

      <div>
        <Textarea
          value={planDescription}
          onChange={(e) => setPlanDescription(e.target.value)}
          onBlur={updatePlanDetails}
          placeholder="Add a description for this nutrition plan"
          className="border-none px-0 resize-none focus-visible:ring-0"
          rows={2}
        />
      </div>

      {renderPlanContent()}

      <AddMealModal
        open={showAddMealModal}
        onOpenChange={setShowAddMealModal}
        planId={plan.id}
        clientId={plan.clientId || ""}
        planType={plan.type}
      />

      <AddMacrosModal
        open={showAddMacrosModal}
        onOpenChange={setShowAddMacrosModal}
        planId={plan.id}
        clientId={plan.clientId || ""}
        currentMacros={totalMacros}
      />
    </div>
  );
};
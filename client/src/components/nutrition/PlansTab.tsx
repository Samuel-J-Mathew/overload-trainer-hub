import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, FileText, Loader2, ChefHat, Target, Utensils } from "lucide-react";
import { AddPlanModal } from "./AddPlanModal";
import { PlanBuilder } from "./PlanBuilder";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
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

export const PlansTab = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // For demo purposes, using a default client ID - in real app this would come from selected client
  const defaultClientId = "demo-client-123";

  // Load plans from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const clientId = selectedClientId || defaultClientId;
    const plansRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'nutrition', 'plans');
    
    const unsubscribe = onSnapshot(plansRef, async (snapshot) => {
      const loadedPlans: Plan[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Count meals for meal-based plans
        let mealCount = 0;
        if (data.type === 'mealPlan' || data.type === 'macrosByMeal') {
          const mealsRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'nutrition', 'plans', docSnapshot.id, 'meals');
          const mealsSnapshot = await getDocs(mealsRef);
          mealCount = mealsSnapshot.size;
        }
        
        loadedPlans.push({
          id: docSnapshot.id,
          name: data.name,
          description: data.description,
          type: data.type,
          createdAt: data.createdAt,
          clientId: clientId,
          mealCount
        });
      }
      
      setPlans(loadedPlans);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, selectedClientId]);

  const updatePlan = (updatedPlan: Plan) => {
    setPlans(plans.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan));
    setSelectedPlan(updatedPlan);
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'mealPlan':
        return <ChefHat className="w-5 h-5 text-white" />;
      case 'totalMacros':
        return <Target className="w-5 h-5 text-white" />;
      case 'macrosByMeal':
        return <Utensils className="w-5 h-5 text-white" />;
      default:
        return <FileText className="w-5 h-5 text-white" />;
    }
  };

  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case 'mealPlan':
        return 'Meal Plan';
      case 'totalMacros':
        return 'Total Macros';
      case 'macrosByMeal':
        return 'Macros by Meal';
      default:
        return type;
    }
  };

  if (selectedPlan) {
    return (
      <PlanBuilder 
        plan={selectedPlan} 
        onBack={() => setSelectedPlan(null)}
        onUpdate={updatePlan}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Nutrition Plans</h2>
          <p className="text-gray-600">Create and manage nutrition plans for your clients</p>
        </div>
        <Button 
          onClick={() => setShowAddPlanModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading plans...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      {getPlanIcon(plan.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getPlanTypeLabel(plan.type)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {plan.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {plan.type === 'totalMacros' ? 'Daily targets' : `${plan.mealCount || 0} meals`}
                    </span>
                    <span>
                      {plan.createdAt?.toDate ? plan.createdAt.toDate().toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plans yet</h3>
              <p className="text-gray-500 mb-4">Create your first nutrition plan to get started</p>
              <Button 
                onClick={() => setShowAddPlanModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </div>
          )}
        </>
      )}

      <AddPlanModal
        open={showAddPlanModal}
        onOpenChange={setShowAddPlanModal}
        clientId={selectedClientId || defaultClientId}
      />
    </div>
  );
};
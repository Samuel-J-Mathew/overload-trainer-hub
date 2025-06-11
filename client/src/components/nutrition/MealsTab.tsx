import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, ChefHat, Loader2 } from "lucide-react";
import { AddStandaloneMealModal } from "./AddStandaloneMealModal";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Meal {
  id: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: any;
  clientId?: string;
}

export const MealsTab = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // For demo purposes, using a default client ID - in real app this would come from selected client
  const defaultClientId = "demo-client-123";

  // Load standalone meals from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const clientId = selectedClientId || defaultClientId;
    const mealsRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'nutrition', 'meals');
    
    const unsubscribe = onSnapshot(mealsRef, (snapshot) => {
      const loadedMeals: Meal[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedMeals.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          createdAt: data.createdAt,
          clientId: clientId
        });
      });
      
      setMeals(loadedMeals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, selectedClientId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Standalone Meals</h2>
          <p className="text-gray-600">Create and manage individual meals for your clients</p>
        </div>
        <Button 
          onClick={() => setShowAddMealModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading meals...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal) => (
              <Card 
                key={meal.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {meal.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Standalone meal
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {meal.description}
                  </p>
                  {meal.instructions && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      <strong>Instructions:</strong> {meal.instructions}
                    </p>
                  )}
                  <div className="text-xs text-gray-400">
                    Created {meal.createdAt?.toDate ? meal.createdAt.toDate().toLocaleDateString() : 'Recently'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {meals.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meals yet</h3>
              <p className="text-gray-500 mb-4">Create your first standalone meal to get started</p>
              <Button 
                onClick={() => setShowAddMealModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Button>
            </div>
          )}
        </>
      )}

      <AddStandaloneMealModal
        open={showAddMealModal}
        onOpenChange={setShowAddMealModal}
        clientId={selectedClientId || defaultClientId}
      />
    </div>
  );
};
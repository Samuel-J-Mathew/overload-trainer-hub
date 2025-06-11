import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Plus, Search, Apple, Loader2, Calendar } from "lucide-react";
import { AddFoodModal } from "./AddFoodModal";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface FoodEntry {
  id: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
  timestamp: any;
  date: string;
}

export const FoodsTab = () => {
  const { user } = useAuth();
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodEntry[]>([]);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");


  // For demo purposes, using a default client ID - in real app this would come from selected client
  const defaultClientId = "demo-client-123";

  // Load foods from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    // Load from food library (foods created by coach)
    const foodsRef = collection(db, 'coaches', user.uid, 'nutritionFoods');
    const foodsQuery = query(foodsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(foodsQuery, (snapshot) => {
      const loadedFoods: FoodEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedFoods.push({
          id: doc.id,
          name: data.name,
          servingSize: data.servingSize,
          servingUnit: data.servingUnit,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fats: data.fats,
          notes: data.notes,
          timestamp: data.timestamp,
          date: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleDateString() : 'Recently'
        });
      });
      
      setFoods(loadedFoods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter foods based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFoods(foods);
    } else {
      const filtered = foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFoods(filtered);
    }
  }, [foods, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Food Library</h2>
          <p className="text-gray-600">Manage food entries and client food logs</p>
        </div>
        <Button 
          onClick={() => setShowAddFoodModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Food
        </Button>
      </div>

      <div className="mt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search food"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Button 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              variant="outline"
            >
              New
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading food library...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {filteredFoods.map((food) => (
                  <Card key={food.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                              <Apple className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{food.name}</h3>
                              <p className="text-sm text-gray-500">
                                {food.servingSize} {food.servingUnit}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 mb-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              🔥 {food.calories} kcal
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {food.protein}g Protein
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {food.carbs}g Carbs
                            </Badge>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {food.fats}g Fats
                            </Badge>
                          </div>

                          {food.notes && (
                            <p className="text-sm text-gray-600 mb-2">{food.notes}</p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{food.date}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Add Food
                          </Button>
                          <Button size="sm" variant="outline">
                            📋
                          </Button>
                          <Button size="sm" variant="outline">
                            ⋯
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredFoods.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Apple className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No foods found' : 'No foods in library'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Create your first food entry to get started'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowAddFoodModal(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Food
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      <AddFoodModal
        open={showAddFoodModal}
        onOpenChange={setShowAddFoodModal}
        clientId={selectedClientId || defaultClientId}
      />
    </div>
  );
};
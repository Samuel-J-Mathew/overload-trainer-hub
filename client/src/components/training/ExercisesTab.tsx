import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddExerciseModal } from "./AddExerciseModal";
import { SeedExercisesButton } from "./SeedExercisesButton";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Search, Dumbbell } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
  createdAt: Timestamp;
}

export const ExercisesTab = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load exercises from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const exercisesRef = collection(db, 'coaches', user.uid, 'exercises');
    const exercisesQuery = query(exercisesRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
      const loadedExercises: Exercise[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedExercises.push({
          id: doc.id,
          name: data.name,
          muscleGroup: data.muscleGroup,
          description: data.description,
          createdAt: data.createdAt
        });
      });
      
      setExercises(loadedExercises);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter exercises
  useEffect(() => {
    const filtered = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [exercises, searchQuery]);

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors: { [key: string]: string } = {
      "Chest": "bg-red-100 text-red-800",
      "Back": "bg-blue-100 text-blue-800",
      "Legs": "bg-green-100 text-green-800",
      "Shoulders": "bg-yellow-100 text-yellow-800",
      "Arms": "bg-purple-100 text-purple-800",
      "Biceps": "bg-purple-100 text-purple-800",
      "Triceps": "bg-purple-100 text-purple-800",
      "Abs": "bg-orange-100 text-orange-800",
      "Core": "bg-orange-100 text-orange-800",
      "Cardio": "bg-pink-100 text-pink-800"
    };
    return colors[muscleGroup] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Exercise Library</h2>
          <p className="text-sm text-gray-600">Manage your exercise database</p>
        </div>
        <div className="flex gap-2">
          <SeedExercisesButton />
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-gray-300"
        />
      </div>

      {/* Exercises Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="text-gray-600 font-medium">Name ({filteredExercises.length})</TableHead>
              <TableHead className="text-gray-600 font-medium">Primary Focus</TableHead>
              <TableHead className="text-gray-600 font-medium">Type</TableHead>
              <TableHead className="text-gray-600 font-medium">Level</TableHead>
              <TableHead className="text-gray-600 font-medium">Custom</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredExercises.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500">
                    {searchQuery ? "No exercises found" : "No exercises yet"}
                  </div>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowAddModal(true)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Exercise
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredExercises.map((exercise) => (
                <TableRow key={exercise.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{exercise.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMuscleGroupColor(exercise.muscleGroup)}>
                      {exercise.muscleGroup}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">Strength</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      Beginner
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-400">•</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddExerciseModal 
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
};
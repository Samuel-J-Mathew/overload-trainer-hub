import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProgramModal } from "./AddProgramModal";
import { ProgramBuilder } from "./ProgramBuilder";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Dumbbell, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp | null;
}

export const ProgramsTab = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Load programs from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const programsRef = collection(db, 'coaches', user.uid, 'Programs');
    const programsQuery = query(programsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(programsQuery, (snapshot) => {
      const loadedPrograms: Program[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedPrograms.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          createdAt: data.createdAt || null
        });
      });
      
      setPrograms(loadedPrograms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (selectedProgram) {
    // Convert to ProgramBuilder format with safe timestamp handling
    const programForBuilder = {
      ...selectedProgram,
      createdAt: selectedProgram.createdAt || Timestamp.now()
    };
    
    return (
      <ProgramBuilder 
        program={programForBuilder}
        onBack={() => setSelectedProgram(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Training Programs</h2>
          <p className="text-sm text-gray-600">Create and manage your training programs</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No programs yet</h3>
          <p className="text-gray-500 mb-4">Create your first training program to get started</p>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Program
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card 
              key={program.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedProgram(program)}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {program.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {program.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created {program.createdAt ? format(program.createdAt.toDate(), "MMM d, yyyy") : "Just now"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProgramModal 
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
};
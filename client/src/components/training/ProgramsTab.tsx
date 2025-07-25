import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProgramModal } from "./AddProgramModal";
import { ProgramBuilder } from "./ProgramBuilder";
import { collection, onSnapshot, orderBy, query, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Dumbbell, Calendar, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [deletingProgram, setDeletingProgram] = useState<string | null>(null);

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

  const handleDeleteProgram = async (programId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent card click when clicking delete
    }
    
    if (!user?.uid) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this program? This action cannot be undone.');
    if (!confirmDelete) return;

    setDeletingProgram(programId);
    try {
      const programRef = doc(db, 'coaches', user.uid, 'Programs', programId);
      await deleteDoc(programRef);
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Error deleting program. Please try again.');
    }
    setDeletingProgram(null);
  };

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
          className="bg-black hover:bg-gray-800 text-white"
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
            className="bg-black hover:bg-gray-800 text-white"
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
              className="cursor-pointer hover:shadow-lg transition-shadow relative"
              onClick={() => setSelectedProgram(program)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {program.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {program.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-gray-200">
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteProgram(program.id, e)}
                        disabled={deletingProgram === program.id}
                        className="text-red-600 hover:text-red-700 focus:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingProgram === program.id ? 'Deleting...' : 'Delete Program'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
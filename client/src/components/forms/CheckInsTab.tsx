import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, FileText, Loader2 } from "lucide-react";
import { CheckInBuilder } from "./CheckInBuilder";
import { useAuth } from "@/hooks/useAuth";
import { collection, doc, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CheckIn {
  id: string;
  formName: string;
  createdAt: any;
  updatedAt: any;
  questions: Question[];
}

interface Question {
  id: string;
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
  createdAt: any;
}

export const CheckInsTab = () => {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newCheckInName, setNewCheckInName] = useState("");
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load check-ins from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const checkInsRef = collection(db, 'coaches', user.uid, 'checkins');
    const unsubscribe = onSnapshot(checkInsRef, (snapshot) => {
      const loadedCheckIns: CheckIn[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedCheckIns.push({
          id: doc.id,
          formName: data.formName,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          questions: []
        });
      });
      
      setCheckIns(loadedCheckIns);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreateCheckIn = async () => {
    if (!newCheckInName.trim() || !user?.uid) return;
    
    setCreating(true);
    try {
      const checkInsRef = collection(db, 'coaches', user.uid, 'checkins');
      const docRef = await addDoc(checkInsRef, {
        formName: newCheckInName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Optimistic update
      const newCheckIn: CheckIn = {
        id: docRef.id,
        formName: newCheckInName.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: []
      };
      
      setNewCheckInName("");
      setShowNameInput(false);
    } catch (error) {
      console.error('Error creating check-in:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCheckIn();
    }
  };

  const updateCheckIn = (updatedCheckIn: CheckIn) => {
    setCheckIns(checkIns.map(ci => 
      ci.id === updatedCheckIn.id ? updatedCheckIn : ci
    ));
    setSelectedCheckIn(updatedCheckIn);
  };

  if (selectedCheckIn) {
    return (
      <CheckInBuilder 
        checkIn={selectedCheckIn}
        onBack={() => setSelectedCheckIn(null)}
        onUpdate={updateCheckIn}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Check-Ins</h2>
        <Button 
          onClick={() => setShowNameInput(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Check-In
        </Button>
      </div>

      {showNameInput && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter check-in form name..."
                value={newCheckInName}
                onChange={(e) => setNewCheckInName(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
                className="flex-1"
              />
              <Button 
                onClick={handleCreateCheckIn}
                disabled={!newCheckInName.trim() || creating}
                size="sm"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowNameInput(false);
                  setNewCheckInName("");
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

{loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading check-ins...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkIns.map((checkIn) => (
              <Card 
                key={checkIn.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCheckIn(checkIn)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {checkIn.formName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        0 questions
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-400">
                    Created {checkIn.createdAt?.toDate ? checkIn.createdAt.toDate().toLocaleDateString() : 'Recently'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {checkIns.length === 0 && !showNameInput && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No check-ins yet</h3>
              <p className="text-gray-500 mb-4">Create your first check-in form to get started</p>
              <Button 
                onClick={() => setShowNameInput(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Check-In
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
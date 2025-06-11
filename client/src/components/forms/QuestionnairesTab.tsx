import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, FileText, Loader2, Sparkles } from "lucide-react";
import { QuestionnaireBuilder } from "./QuestionnaireBuilder";
import { TemplatesModal } from "./TemplatesModal";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Questionnaire {
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

export const QuestionnairesTab = () => {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newQuestionnaireName, setNewQuestionnaireName] = useState("");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Load questionnaires from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const questionnairesRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires');
    const unsubscribe = onSnapshot(questionnairesRef, (snapshot) => {
      const loadedQuestionnaires: Questionnaire[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedQuestionnaires.push({
          id: doc.id,
          formName: data.formName,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          questions: []
        });
      });
      
      setQuestionnaires(loadedQuestionnaires);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreateQuestionnaire = async () => {
    if (!newQuestionnaireName.trim() || !user?.uid) return;
    
    setCreating(true);
    try {
      const questionnairesRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires');
      await addDoc(questionnairesRef, {
        formName: newQuestionnaireName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setNewQuestionnaireName("");
      setShowNameInput(false);
    } catch (error) {
      console.error('Error creating questionnaire:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateQuestionnaire();
    }
  };

  const updateQuestionnaire = (updatedQuestionnaire: Questionnaire) => {
    setQuestionnaires(questionnaires.map(q => 
      q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q
    ));
    setSelectedQuestionnaire(updatedQuestionnaire);
  };

  if (selectedQuestionnaire) {
    return (
      <QuestionnaireBuilder 
        questionnaire={selectedQuestionnaire}
        onBack={() => setSelectedQuestionnaire(null)}
        onUpdate={updateQuestionnaire}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Questionnaires</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="border-primary text-primary hover:bg-primary/5"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button 
            onClick={() => setShowNameInput(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Questionnaire
          </Button>
        </div>
      </div>

      {showNameInput && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter questionnaire name..."
                value={newQuestionnaireName}
                onChange={(e) => setNewQuestionnaireName(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
                className="flex-1"
              />
              <Button 
                onClick={handleCreateQuestionnaire}
                disabled={!newQuestionnaireName.trim() || creating}
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
                  setNewQuestionnaireName("");
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
          <p className="text-gray-500">Loading questionnaires...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionnaires.map((questionnaire) => (
              <Card 
                key={questionnaire.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedQuestionnaire(questionnaire)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {questionnaire.formName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        0 questions
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-400">
                    Created {questionnaire.createdAt?.toDate ? questionnaire.createdAt.toDate().toLocaleDateString() : 'Recently'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {questionnaires.length === 0 && !showNameInput && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires yet</h3>
              <p className="text-gray-500 mb-4">Create your first questionnaire or use a template</p>
              <div className="flex items-center justify-center space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowTemplates(true)}
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Templates
                </Button>
                <Button 
                  onClick={() => setShowNameInput(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Questionnaire
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <TemplatesModal
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onTemplateSelect={(template: any) => {
          // Template creation will be handled in the modal
          setShowTemplates(false);
        }}
      />
    </div>
  );
};
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, User, Activity, MessageSquare, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  createdAt: any;
}

interface TemplateQuestion {
  id: string;
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
}

interface TemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: any) => void;
}

export const TemplatesModal = ({ open, onOpenChange, onTemplateSelect }: TemplatesModalProps) => {
  const [using, setUsing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const { user } = useAuth();

  // Load global templates from Firebase
  useEffect(() => {
    const templatesRef = collection(db, 'questionnaireTemplates');
    const templatesQuery = query(templatesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
      const loadedTemplates: Template[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Add icons based on template title
        let icon = <FileText className="w-6 h-6" />;
        let color = "bg-gray-500";
        
        if (data.title.toLowerCase().includes('initial') || data.title.toLowerCase().includes('assessment')) {
          icon = <User className="w-6 h-6" />;
          color = "bg-blue-500";
        } else if (data.title.toLowerCase().includes('par-q') || data.title.toLowerCase().includes('health')) {
          icon = <Activity className="w-6 h-6" />;
          color = "bg-purple-500";
        } else if (data.title.toLowerCase().includes('feedback') || data.title.toLowerCase().includes('survey')) {
          icon = <MessageSquare className="w-6 h-6" />;
          color = "bg-yellow-500";
        }
        
        loadedTemplates.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          icon,
          color,
          createdAt: data.createdAt
        });
      });
      
      setTemplates(loadedTemplates);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUseTemplate = async (template: Template) => {
    if (!user?.uid) return;
    
    setUsing(true);
    
    try {
      // Get template questions from the global template
      const questionsRef = collection(db, 'questionnaireTemplates', template.id, 'questions');
      const questionsQuery = query(questionsRef, orderBy('order', 'asc'));
      const questionsSnapshot = await getDocs(questionsQuery);
      
      const templateQuestions: TemplateQuestion[] = [];
      questionsSnapshot.forEach((questionDoc) => {
        const questionData = questionDoc.data();
        templateQuestions.push({
          id: questionDoc.id,
          questionText: questionData.questionText,
          responseType: questionData.responseType,
          required: questionData.required,
          order: questionData.order
        });
      });

      // Create a new questionnaire under coach's collection
      const questionnaireRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires', 'questionnaires');
      const newQuestionnaireDoc = await addDoc(questionnaireRef, {
        formName: template.title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add all questions to the new questionnaire
      const newQuestionsRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires', 'questionnaires', newQuestionnaireDoc.id, 'questions');
      
      for (const question of templateQuestions) {
        await addDoc(newQuestionsRef, {
          questionText: question.questionText,
          responseType: question.responseType,
          required: question.required,
          order: question.order,
          createdAt: serverTimestamp()
        });
      }

      // Create the questionnaire object for the parent component
      const newQuestionnaire = {
        id: newQuestionnaireDoc.id,
        formName: template.title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        questions: templateQuestions.map(q => ({
          id: '', // Will be populated when loaded from Firebase
          questionText: q.questionText,
          responseType: q.responseType,
          required: q.required,
          order: q.order,
          createdAt: serverTimestamp()
        }))
      };

      onTemplateSelect(newQuestionnaire);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating questionnaire from template:', error);
    } finally {
      setUsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Choose a Template</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading templates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${template.color} text-white flex-shrink-0`}>
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2">{template.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.description}</p>
                      <Button
                        onClick={() => handleUseTemplate(template)}
                        disabled={using}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {using ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Using Template...
                          </>
                        ) : (
                          'Use Template'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
            <p className="text-gray-500">Global questionnaire templates will appear here when they are created.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Eye, Calendar, MoreHorizontal } from "lucide-react";
import { AddQuestionModal } from "./AddQuestionModal";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, onSnapshot, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Question {
  id: string;
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
  createdAt: any;
}

interface Questionnaire {
  id: string;
  formName: string;
  createdAt: any;
  updatedAt: any;
  questions: Question[];
}

interface QuestionnaireBuilderProps {
  questionnaire: Questionnaire;
  onBack: () => void;
  onUpdate: (questionnaire: Questionnaire) => void;
}

export const QuestionnaireBuilder = ({ questionnaire, onBack, onUpdate }: QuestionnaireBuilderProps) => {
  const { user } = useAuth();
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Load questions from Firebase
  useEffect(() => {
    if (!user?.uid || !questionnaire.id) return;

    const questionsRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires', questionnaire.id, 'questions');
    const unsubscribe = onSnapshot(questionsRef, (snapshot) => {
      const loadedQuestions: Question[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedQuestions.push({
          id: doc.id,
          questionText: data.questionText,
          responseType: data.responseType,
          required: data.required,
          order: data.order,
          createdAt: data.createdAt
        });
      });
      
      // Sort by order
      loadedQuestions.sort((a, b) => a.order - b.order);
      setQuestions(loadedQuestions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, questionnaire.id]);

  const addQuestion = async (newQuestion: Omit<Question, "id" | "order" | "createdAt">) => {
    if (!user?.uid || !questionnaire.id) return;
    
    try {
      const questionsRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires', questionnaire.id, 'questions');
      await addDoc(questionsRef, {
        ...newQuestion,
        order: questions.length,
        createdAt: serverTimestamp()
      });

      // Update the questionnaire's updatedAt timestamp
      const questionnaireRef = doc(db, 'coaches', user.uid, 'forms', 'questionnaires', questionnaire.id);
      await updateDoc(questionnaireRef, {
        updatedAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const getResponseTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      text: "Text",
      number: "Number",
      multipleChoice: "Multiple Choice",
      scale: "Scale",
      yesNo: "Yes/No",
      media: "Media",
      date: "Date",
      starRating: "Star Rating",
      progressPhotos: "Progress Photos",
      metric: "Metric"
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Feedback Survey
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Reposition
          </Button>
          <Button 
            onClick={() => setShowAddQuestionModal(true)}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            Add Question
          </Button>
        </div>
      </div>

      {/* Form Name */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{questionnaire.formName}</h1>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500">
            <div>Question</div>
            <div>Type</div>
            <div>Required</div>
          </div>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No data</p>
            </div>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="px-6 py-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-gray-900">{question.questionText}</div>
                  <div className="text-gray-600">{getResponseTypeDisplay(question.responseType)}</div>
                  <div className="text-gray-600">{question.required ? "Yes" : "No"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddQuestionModal
        open={showAddQuestionModal}
        onOpenChange={setShowAddQuestionModal}
        onAddQuestion={addQuestion}
      />
    </div>
  );
};
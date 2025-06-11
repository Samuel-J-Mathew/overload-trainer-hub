import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Eye, Calendar, MoreHorizontal } from "lucide-react";
import { AddQuestionModal } from "./AddQuestionModal";

interface Question {
  id: string;
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
}

interface CheckIn {
  id: string;
  formName: string;
  createdAt: Date;
  questions: Question[];
}

interface CheckInBuilderProps {
  checkIn: CheckIn;
  onBack: () => void;
  onUpdate: (checkIn: CheckIn) => void;
}

export const CheckInBuilder = ({ checkIn, onBack, onUpdate }: CheckInBuilderProps) => {
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  const addQuestion = (newQuestion: Omit<Question, "id" | "order">) => {
    const question: Question = {
      ...newQuestion,
      id: Date.now().toString(),
      order: checkIn.questions.length
    };
    
    const updatedCheckIn = {
      ...checkIn,
      questions: [...checkIn.questions, question]
    };
    
    onUpdate(updatedCheckIn);
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
            Check in
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
        <h1 className="text-2xl font-semibold text-gray-900">{checkIn.formName}</h1>
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
          {checkIn.questions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No data</p>
            </div>
          ) : (
            checkIn.questions.map((question) => (
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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
  createdAt: any;
}

interface FormPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  formName: string;
  formType: "checkin" | "questionnaire";
}

export const FormPreview = ({ open, onOpenChange, questions, formName, formType }: FormPreviewProps) => {
  const [responses, setResponses] = useState<Record<string, any>>({});

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderQuestionInput = (question: Question) => {
    const value = responses[question.id] || "";

    switch (question.responseType) {
      case "text":
        return (
          <Input
            placeholder="Enter your answer..."
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="mt-2"
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder="Enter your answer..."
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="mt-2"
            rows={3}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder="Enter a number..."
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="mt-2"
          />
        );

      case "rating":
        return (
          <div className="mt-2">
            <RadioGroup
              value={value}
              onValueChange={(val) => handleResponseChange(question.id, val)}
              className="flex space-x-4"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                  <Label htmlFor={`${question.id}-${rating}`}>{rating}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "scale":
        return (
          <div className="mt-2 space-y-2">
            <Slider
              value={[value || 5]}
              onValueChange={(val) => handleResponseChange(question.id, val[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span className="font-medium">Current: {value || 5}</span>
              <span>10</span>
            </div>
          </div>
        );

      case "boolean":
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => handleResponseChange(question.id, val)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`${question.id}-yes`} />
              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </RadioGroup>
        );

      default:
        return (
          <Input
            placeholder="Enter your answer..."
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="mt-2"
          />
        );
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Preview: {formName}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-sm text-gray-600">
            This is how your {formType} will appear to clients. All fields are interactive for testing.
          </div>

          {sortedQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Add some questions to see the preview.
            </div>
          ) : (
            sortedQuestions.map((question) => (
              <div key={question.id} className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Label className="text-sm font-medium text-gray-900">
                    {question.questionText}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
                {renderQuestionInput(question)}
              </div>
            ))
          )}

          {sortedQuestions.length > 0 && (
            <div className="pt-4 border-t">
              <Button className="w-full bg-black hover:bg-gray-800 text-white">
                Submit {formType === "checkin" ? "Check-in" : "Questionnaire"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
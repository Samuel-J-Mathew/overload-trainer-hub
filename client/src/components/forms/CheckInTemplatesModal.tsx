import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface CheckInTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TemplateQuestion {
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  questions: TemplateQuestion[];
}

const checkInTemplates: Template[] = [
  {
    id: "daily-checkin",
    name: "Daily Check-In",
    description: "Quick daily tracking of physical and mental state, exercise, and progress",
    category: "Daily Tracking",
    questionCount: 8,
    questions: [
      {
        questionText: "How are you feeling today physically and mentally?",
        responseType: "text",
        required: true,
        order: 1
      },
      {
        questionText: "How many minutes did you exercise today?",
        responseType: "number",
        required: true,
        order: 2
      },
      {
        questionText: "Did you stick to your meal plan today?",
        responseType: "boolean",
        required: true,
        order: 3
      },
      {
        questionText: "How would you rate your energy levels on a scale of 1-10?",
        responseType: "scale",
        required: true,
        order: 4
      },
      {
        questionText: "What is today's date?",
        responseType: "text",
        required: true,
        order: 5
      },
      {
        questionText: "Rate your overall satisfaction with today's progress",
        responseType: "rating",
        required: true,
        order: 6
      },
      {
        questionText: "What is your current weight?",
        responseType: "number",
        required: true,
        order: 7
      },
      {
        questionText: "Do you feel sore or fatigued in any particular areas?",
        responseType: "textarea",
        required: false,
        order: 8
      }
    ]
  },
  {
    id: "weekly-checkin",
    name: "Weekly Check-In",
    description: "Comprehensive weekly progress tracking with workouts, metrics, and reflection",
    category: "Progress Tracking",
    questionCount: 11,
    questions: [
      {
        questionText: "What was your biggest win this week?",
        responseType: "text",
        required: true,
        order: 1
      },
      {
        questionText: "How many workouts did you complete this week?",
        responseType: "number",
        required: true,
        order: 2
      },
      {
        questionText: "Did you follow your nutrition plan this week?",
        responseType: "boolean",
        required: true,
        order: 3
      },
      {
        questionText: "How would you rate your overall progress this week on a scale of 1-10?",
        responseType: "scale",
        required: true,
        order: 4
      },
      {
        questionText: "On which date this week did you feel most energized and productive?",
        responseType: "text", // Using text as date input type
        required: true,
        order: 5
      },
      {
        questionText: "Rate your overall satisfaction with this week's progress",
        responseType: "rating",
        required: true,
        order: 6
      },
      {
        questionText: "Upload your progress photos for this week",
        responseType: "text", // Using text for now as media upload would need special handling
        required: true,
        order: 7
      },
      {
        questionText: "What was your average daily step count this week?",
        responseType: "number",
        required: true,
        order: 8
      },
      {
        questionText: "What was your weight at the end of this week?",
        responseType: "number",
        required: true,
        order: 9
      },
      {
        questionText: "On average, how many hours of sleep did you get per night this week?",
        responseType: "number",
        required: true,
        order: 10
      },
      {
        questionText: "Reflect on your overall progress and feelings about the past week",
        responseType: "textarea",
        required: false,
        order: 11
      }
    ]
  }
];

export const CheckInTemplatesModal = ({ open, onOpenChange }: CheckInTemplatesModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);

  const handleUseTemplate = async (template: Template) => {
    if (!user?.uid) return;

    setCreatingTemplate(template.id);

    try {
      // Create the check-in
      const checkInsRef = collection(db, 'coaches', user.uid, 'checkins');
      const checkInDoc = await addDoc(checkInsRef, {
        formName: template.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add all questions to the check-in
      const questionsRef = collection(db, 'coaches', user.uid, 'checkins', checkInDoc.id, 'questions');
      
      for (const question of template.questions) {
        await addDoc(questionsRef, {
          questionText: question.questionText,
          responseType: question.responseType,
          required: question.required,
          order: question.order,
          createdAt: serverTimestamp()
        });
      }

      toast({
        title: "Success",
        description: `${template.name} template created successfully`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create check-in from template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Check-in Templates</DialogTitle>
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
            Choose from pre-built check-in templates to get started quickly.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkInTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {template.questionCount} questions
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Preview Questions:</h4>
                      <div className="space-y-1">
                        {template.questions.slice(0, 3).map((question, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3" />
                            <span className="truncate">{question.questionText}</span>
                          </div>
                        ))}
                        {template.questions.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{template.questions.length - 3} more questions
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUseTemplate(template)}
                      disabled={creatingTemplate === template.id}
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      {creatingTemplate === template.id ? (
                        "Creating..."
                      ) : (
                        "Use This Template"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
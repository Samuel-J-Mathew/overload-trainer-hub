import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, User, Activity, MessageSquare, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  questions: Array<{
    questionText: string;
    responseType: string;
    required: boolean;
  }>;
}

interface TemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: Template) => void;
}

const templates: Template[] = [
  {
    id: "initial-assessment",
    name: "Initial Questionnaire",
    description: "A form to collect information from the user to personalize programs",
    icon: <User className="w-6 h-6" />,
    color: "bg-blue-500",
    questions: [
      { questionText: "What are your primary fitness goals?", responseType: "text", required: true },
      { questionText: "How many days per week can you commit to training?", responseType: "number", required: true },
      { questionText: "Do you have any injuries or physical limitations?", responseType: "text", required: false },
      { questionText: "What is your current activity level?", responseType: "scale", required: true },
      { questionText: "How would you rate your nutrition habits?", responseType: "starRating", required: true },
      { questionText: "What time of day do you prefer to work out?", responseType: "text", required: false },
      { questionText: "Do you have access to a gym?", responseType: "yesNo", required: true },
      { questionText: "What is your experience with weight training?", responseType: "scale", required: true },
      { questionText: "How much time can you dedicate per workout session?", responseType: "number", required: true },
      { questionText: "What motivates you to stay consistent?", responseType: "text", required: false },
      { questionText: "Any additional comments or questions?", responseType: "text", required: false }
    ]
  },
  {
    id: "par-q",
    name: "PAR-Q",
    description: "A form to assess the user's physical activity readiness",
    icon: <Activity className="w-6 h-6" />,
    color: "bg-purple-500",
    questions: [
      { questionText: "Has your doctor ever said that you have a heart condition?", responseType: "yesNo", required: true },
      { questionText: "Do you feel pain in your chest when you do physical activity?", responseType: "yesNo", required: true },
      { questionText: "In the past month, have you had chest pain when not doing physical activity?", responseType: "yesNo", required: true },
      { questionText: "Do you lose your balance because of dizziness or do you ever lose consciousness?", responseType: "yesNo", required: true },
      { questionText: "Do you have a bone or joint problem that could be made worse by physical activity?", responseType: "yesNo", required: true },
      { questionText: "Is your doctor currently prescribing drugs for blood pressure or heart condition?", responseType: "yesNo", required: true },
      { questionText: "Do you know of any other reason you should not do physical activity?", responseType: "yesNo", required: true },
      { questionText: "What is your age?", responseType: "number", required: true },
      { questionText: "Do you smoke?", responseType: "yesNo", required: true },
      { questionText: "Are you currently taking any medications?", responseType: "text", required: false },
      { questionText: "Emergency contact name and phone number", responseType: "text", required: true }
    ]
  },
  {
    id: "feedback-survey",
    name: "Feedback Form",
    description: "A form to collect user's feedback & satisfaction",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "bg-yellow-500",
    questions: [
      { questionText: "How satisfied are you with the coaching sessions?", responseType: "starRating", required: true },
      { questionText: "Please rate your overall progress since starting the coaching.", responseType: "scale", required: true },
      { questionText: "What aspect of the coaching did you find most beneficial?", responseType: "text", required: true },
      { questionText: "What areas could be improved in the coaching process?", responseType: "text", required: false },
      { questionText: "Would you recommend this coaching service to others?", responseType: "yesNo", required: true },
      { questionText: "Please upload your latest physique (optional).", responseType: "progressPhotos", required: false },
      { questionText: "Can your physique be shared on social media?", responseType: "yesNo", required: false },
      { questionText: "Please share any additional comments or feedback.", responseType: "text", required: false },
      { questionText: "Leave a testimonial (optional).", responseType: "text", required: false }
    ]
  }
];

export const TemplatesModal = ({ open, onOpenChange, onTemplateSelect }: TemplatesModalProps) => {
  const { user } = useAuth();
  const [creating, setCreating] = useState<string | null>(null);

  const handleUseTemplate = async (template: Template) => {
    if (!user?.uid) return;
    
    setCreating(template.id);
    try {
      // Create the questionnaire document
      const questionnairesRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires');
      const questionnaireDoc = await addDoc(questionnairesRef, {
        formName: template.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add all questions from the template
      const questionsRef = collection(db, 'coaches', user.uid, 'forms', 'questionnaires', questionnaireDoc.id, 'questions');
      
      for (let i = 0; i < template.questions.length; i++) {
        const question = template.questions[i];
        await addDoc(questionsRef, {
          ...question,
          order: i,
          createdAt: serverTimestamp()
        });
      }

      onTemplateSelect(template);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setCreating(null);
    }
  };

  const handleClose = () => {
    if (creating) return; // Prevent closing while creating
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-gray-900 text-white border-gray-700" aria-describedby="templates-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-white">
              <FileText className="w-5 h-5" />
              <span>Questionnaire Templates</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-auto p-1 text-gray-400 hover:text-white"
              disabled={!!creating}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div id="templates-description" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
              >
                {/* Template Preview Image */}
                <div className={`${template.color} h-32 p-4 flex items-center justify-center`}>
                  <div className="bg-white rounded-lg p-4 shadow-lg w-24 h-20 flex items-center justify-center">
                    <div className="text-gray-600">
                      {template.icon}
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-6">
                  <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {template.questions.length} Questions
                    </span>
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      disabled={!!creating}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {creating === template.id ? "Creating..." : "Use Template"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-start pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={!!creating}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Type, Hash, List, ToggleLeft, Image, Calendar, Star, Camera, BarChart3 } from "lucide-react";

interface Question {
  questionText: string;
  responseType: string;
  required: boolean;
}

interface AddQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuestion: (question: Question) => void;
}

interface QuestionType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const questionTypes: QuestionType[] = [
  {
    id: "text",
    label: "Text",
    description: "Small or long text like title or description",
    icon: <Type className="w-5 h-5" />,
    color: "bg-green-100 text-green-600"
  },
  {
    id: "number",
    label: "Number",
    description: "Numbers (integer, float, decimal)",
    icon: <Hash className="w-5 h-5" />,
    color: "bg-red-100 text-red-600"
  },
  {
    id: "multipleChoice",
    label: "Multiple Choice",
    description: "Give multiple options to choose from",
    icon: <List className="w-5 h-5" />,
    color: "bg-yellow-100 text-yellow-600"
  },
  {
    id: "scale",
    label: "Scale",
    description: "A scale from 1 to 10",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: "yesNo",
    label: "Yes/No",
    description: "Yes or no",
    icon: <ToggleLeft className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-600"
  },
  {
    id: "media",
    label: "Media",
    description: "One image or video",
    icon: <Image className="w-5 h-5" />,
    color: "bg-green-100 text-green-600"
  },
  {
    id: "date",
    label: "Date",
    description: "Select a specific date",
    icon: <Calendar className="w-5 h-5" />,
    color: "bg-gray-100 text-gray-600"
  },
  {
    id: "starRating",
    label: "Star Rating",
    description: "Star rating from 1 to 5",
    icon: <Star className="w-5 h-5" />,
    color: "bg-yellow-100 text-yellow-600"
  },
  {
    id: "progressPhotos",
    label: "Progress Photos",
    description: "Sync 'Front, Back, Side' photos to gallery",
    icon: <Camera className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: "metric",
    label: "Metric",
    description: "Sync to Metrics section automatically",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "bg-pink-100 text-pink-600"
  }
];

export const AddQuestionModal = ({ open, onOpenChange, onAddQuestion }: AddQuestionModalProps) => {
  const [questionText, setQuestionText] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [required, setRequired] = useState(false);

  const handleSave = () => {
    if (questionText.trim() && selectedType) {
      onAddQuestion({
        questionText: questionText.trim(),
        responseType: selectedType,
        required
      });
      
      // Reset form
      setQuestionText("");
      setSelectedType("");
      setRequired(false);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setQuestionText("");
    setSelectedType("");
    setRequired(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <List className="w-5 h-5" />
              <span>Add Question</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-auto p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question *
            </label>
            <Input
              placeholder="Your question e.g. How are you feeling today?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Required Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked as boolean)}
            />
            <label htmlFor="required" className="text-sm text-gray-700">
              Required?
            </label>
          </div>

          {/* Question Types Grid */}
          <div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {questionTypes.slice(0, 6).map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${type.color}`}>
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{type.label}</h4>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Synced Questions Section */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Synced Questions</h4>
              <div className="grid grid-cols-2 gap-3">
                {questionTypes.slice(6).map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{type.label}</h4>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!questionText.trim() || !selectedType}
            className="bg-primary hover:bg-primary/90"
          >
            Add Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
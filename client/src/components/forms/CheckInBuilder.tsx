import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Eye, Calendar, Clock, X } from "lucide-react";
import { AddQuestionModal } from "./AddQuestionModal";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, onSnapshot, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
  createdAt: any;
}

interface CheckIn {
  id: string;
  formName: string;
  createdAt: any;
  updatedAt: any;
  questions: Question[];
}

interface CheckInBuilderProps {
  checkIn: CheckIn;
  onBack: () => void;
  onUpdate: (checkIn: CheckIn) => void;
}

export const CheckInBuilder = ({ checkIn, onBack, onUpdate }: CheckInBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewResponses, setPreviewResponses] = useState<Record<string, any>>({});
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState("09:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Load questions from Firebase
  useEffect(() => {
    if (!user?.uid || !checkIn.id) return;

    const questionsRef = collection(db, 'coaches', user.uid, 'checkins', checkIn.id, 'questions');
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
  }, [user?.uid, checkIn.id]);

  const addQuestion = async (newQuestion: Omit<Question, "id" | "order" | "createdAt">) => {
    if (!user?.uid || !checkIn.id) return;
    
    try {
      const questionsRef = collection(db, 'coaches', user.uid, 'checkins', checkIn.id, 'questions');
      await addDoc(questionsRef, {
        ...newQuestion,
        order: questions.length,
        createdAt: serverTimestamp()
      });

      // Update the check-in's updatedAt timestamp
      const checkInRef = doc(db, 'coaches', user.uid, 'checkins', checkIn.id);
      await updateDoc(checkInRef, {
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
            Check in
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSchedule(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
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

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Preview: {checkIn.formName}</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-sm text-gray-600">
              This is how your check-in will appear to clients. All fields are interactive for testing.
            </div>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions added yet. Add some questions to see the preview.
              </div>
            ) : (
              questions.sort((a, b) => a.order - b.order).map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">
                    {question.questionText}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {question.responseType === "text" && (
                    <Input placeholder="Enter your answer..." className="mt-2" />
                  )}
                  {question.responseType === "textarea" && (
                    <Textarea placeholder="Enter your answer..." className="mt-2" rows={3} />
                  )}
                  {question.responseType === "number" && (
                    <Input type="number" placeholder="Enter a number..." className="mt-2" />
                  )}
                  {question.responseType === "rating" && (
                    <RadioGroup className="flex space-x-4 mt-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                          <Label htmlFor={`${question.id}-${rating}`}>{rating}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {question.responseType === "scale" && (
                    <div className="mt-2 space-y-2">
                      <Slider defaultValue={[5]} max={10} min={1} step={1} className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1</span>
                        <span className="font-medium">Current: 5</span>
                        <span>10</span>
                      </div>
                    </div>
                  )}
                  {question.responseType === "boolean" && (
                    <RadioGroup className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                        <Label htmlFor={`${question.id}-yes`}>Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`${question.id}-no`} />
                        <Label htmlFor={`${question.id}-no`}>No</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              ))
            )}
            {questions.length > 0 && (
              <div className="pt-4 border-t">
                <Button className="w-full bg-black hover:bg-gray-800 text-white">
                  Submit Check-in
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Schedule Check-in</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSchedule(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Scheduling: {checkIn.formName}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-name">Schedule Name *</Label>
              <Input
                id="schedule-name"
                placeholder="e.g., Weekly Check-in, Monthly Progress Review"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(frequency === "weekly" || frequency === "biweekly") && (
              <div className="space-y-2">
                <Label>Days of the Week</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "monday", label: "Monday" },
                    { value: "tuesday", label: "Tuesday" },
                    { value: "wednesday", label: "Wednesday" },
                    { value: "thursday", label: "Thursday" },
                    { value: "friday", label: "Friday" },
                    { value: "saturday", label: "Saturday" },
                    { value: "sunday", label: "Sunday" },
                  ].map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => {
                          setSelectedDays(prev => 
                            prev.includes(day.value) 
                              ? prev.filter(d => d !== day.value)
                              : [...prev, day.value]
                          );
                        }}
                      />
                      <Label htmlFor={day.value} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date (Optional)</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSchedule(false)} disabled={scheduleLoading}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!user?.uid || !scheduleName.trim()) {
                    toast({
                      title: "Error",
                      description: "Please fill in all required fields",
                      variant: "destructive",
                    });
                    return;
                  }
                  setScheduleLoading(true);
                  try {
                    const scheduleData = {
                      formId: checkIn.id,
                      formName: checkIn.formName,
                      formType: "checkin",
                      scheduleName: scheduleName.trim(),
                      frequency,
                      selectedDays,
                      time,
                      startDate: startDate || null,
                      endDate: endDate || null,
                      isActive: true,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    };
                    await addDoc(collection(db, 'coaches', user.uid, 'schedules'), scheduleData);
                    toast({
                      title: "Success",
                      description: "Check-in scheduled successfully",
                    });
                    setScheduleName("");
                    setFrequency("weekly");
                    setSelectedDays([]);
                    setTime("09:00");
                    setStartDate("");
                    setEndDate("");
                    setShowSchedule(false);
                  } catch (error) {
                    console.error("Error scheduling form:", error);
                    toast({
                      title: "Error",
                      description: "Failed to schedule form. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setScheduleLoading(false);
                  }
                }}
                disabled={scheduleLoading || !scheduleName.trim()}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {scheduleLoading ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
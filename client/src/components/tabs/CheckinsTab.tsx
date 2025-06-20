import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Eye, FileText, Calendar, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, getDocs, setDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface CheckinsTabProps {
  clientId: string;
}

interface Submission {
  id: string;
  formName: string;
  answers: { question: string; response: string }[];
  submittedAt: any;
}

interface AssignedForm {
  id: string;
  formName: string;
  assignedAt: any;
  schedule?: string;
  questions: { questionText: string; responseType: string; required: boolean }[];
}

interface CoachForm {
  id: string;
  formName: string;
  createdAt: any;
  questionCount: number;
}

export const CheckinsTab = ({ clientId }: CheckinsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("submissions");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignedForms, setAssignedForms] = useState<AssignedForm[]>([]);
  const [coachForms, setCoachForms] = useState<CoachForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedForm, setSelectedForm] = useState<AssignedForm | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Load submissions from Firebase
  useEffect(() => {
    if (!user?.uid || !clientId) return;

    const submissionsRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'submissions');
    const submissionsQuery = query(submissionsRef, orderBy('submittedAt', 'desc'));
    
    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
      const loadedSubmissions: Submission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedSubmissions.push({
          id: doc.id,
          formName: data.formName,
          answers: data.answers || [],
          submittedAt: data.submittedAt
        });
      });
      setSubmissions(loadedSubmissions);
    });

    return () => unsubscribe();
  }, [user?.uid, clientId]);

  // Load assigned forms from Firebase
  useEffect(() => {
    if (!user?.uid || !clientId) return;

    const assignedRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'assignedForms');
    const unsubscribe = onSnapshot(assignedRef, (snapshot) => {
      const loadedForms: AssignedForm[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedForms.push({
          id: doc.id,
          formName: data.formName,
          assignedAt: data.assignedAt,
          schedule: data.schedule,
          questions: data.questions || []
        });
      });
      setAssignedForms(loadedForms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, clientId]);

  // Load coach's form library when assign modal opens
  useEffect(() => {
    if (!showAssignModal || !user?.uid) return;

    const loadCoachForms = async () => {
      try {
        const formsRef = collection(db, 'coaches', user.uid, 'checkins');
        const snapshot = await getDocs(formsRef);
        const forms: CoachForm[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          // Count questions for each form
          const questionsRef = collection(db, 'coaches', user.uid, 'checkins', docSnapshot.id, 'questions');
          const questionsSnapshot = await getDocs(questionsRef);
          
          forms.push({
            id: docSnapshot.id,
            formName: data.formName,
            createdAt: data.createdAt,
            questionCount: questionsSnapshot.size
          });
        }
        
        setCoachForms(forms);
      } catch (error) {
        console.error('Error loading coach forms:', error);
      }
    };

    loadCoachForms();
  }, [showAssignModal, user?.uid]);

  const handleAssignForm = async (formId: string) => {
    if (!user?.uid || !clientId) return;

    setAssigning(true);
    try {
      // Get the form details and questions
      const formDoc = coachForms.find(f => f.id === formId);
      if (!formDoc) return;

      // Get questions for this form
      const questionsRef = collection(db, 'coaches', user.uid, 'checkins', formId, 'questions');
      const questionsSnapshot = await getDocs(questionsRef);
      const questions: any[] = [];
      
      questionsSnapshot.forEach((doc) => {
        const data = doc.data();
        questions.push({
          questionText: data.questionText,
          responseType: data.responseType,
          required: data.required
        });
      });

      // Save to assigned forms
      const assignedRef = doc(db, 'coaches', user.uid, 'clients', clientId, 'assignedForms', formId);
      await setDoc(assignedRef, {
        formName: formDoc.formName,
        assignedAt: serverTimestamp(),
        schedule: "Manual", // Default, can be updated later
        questions: questions
      });

      toast({
        title: "Success",
        description: `${formDoc.formName} assigned successfully`,
      });

      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning form:', error);
      toast({
        title: "Error",
        description: "Failed to assign form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredCoachForms = coachForms.filter(form =>
    form.formName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading check-ins...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Check-Ins</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="assigned">Assigned Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                <p className="text-gray-500">Client submissions will appear here when forms are completed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{submission.formName}</CardTitle>
                        <p className="text-sm text-gray-500">
                          Submitted {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowSubmissionModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {submission.answers.length} responses submitted
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Assigned Check-In Forms</h4>
            <Button
              onClick={() => setShowAssignModal(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Check-In
            </Button>
          </div>

          {assignedForms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms assigned</h3>
                <p className="text-gray-500 mb-4">Assign check-in forms to this client to get started</p>
                <Button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign First Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignedForms.map((form) => (
                <Card key={form.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{form.formName}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Assigned {formatDate(form.assignedAt)}</span>
                          {form.schedule && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {form.schedule}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedForm(form);
                          setShowQuestionsModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Questions
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {form.questions.length} questions included
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Form Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Assign Check-In Form</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Forms</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search check-in forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredCoachForms.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No forms found</p>
                </div>
              ) : (
                filteredCoachForms.map((form) => (
                  <Card key={form.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{form.formName}</h4>
                          <p className="text-sm text-gray-500">
                            {form.questionCount} questions • Created {formatDate(form.createdAt)}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAssignForm(form.id)}
                          disabled={assigning || assignedForms.some(af => af.id === form.id)}
                          className="bg-black hover:bg-gray-800 text-white"
                        >
                          {assignedForms.some(af => af.id === form.id) ? "Already Assigned" : "Assign"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Submission Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedSubmission?.formName} - Submission</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSubmissionModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-gray-600">
                Submitted {formatDate(selectedSubmission.submittedAt)}
              </div>
              <div className="space-y-4">
                {selectedSubmission.answers.map((answer, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <h4 className="font-medium text-gray-900 mb-2">{answer.question}</h4>
                    <p className="text-gray-700">{answer.response}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Questions Modal */}
      <Dialog open={showQuestionsModal} onOpenChange={setShowQuestionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedForm?.formName} - Questions</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowQuestionsModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-gray-600">
                Assigned {formatDate(selectedForm.assignedAt)}
              </div>
              <div className="space-y-4">
                {selectedForm.questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{question.questionText}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {question.responseType}
                          </Badge>
                          {question.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
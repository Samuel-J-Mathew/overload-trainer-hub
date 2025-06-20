import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Submission {
  id: string;
  formName: string;
  clientId: string;
  clientName: string;
  answers: { question: string; response: string }[];
  submittedAt: any;
  reviewed: boolean;
}

export default function CheckIns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [markingReviewed, setMarkingReviewed] = useState(false);

  // Load unreviewed submissions from all clients
  useEffect(() => {
    if (!user?.uid) return;

    const clientsRef = collection(db, 'coaches', user.uid, 'clients');
    
    const unsubscribe = onSnapshot(clientsRef, async (clientsSnapshot) => {
      const allSubmissions: Submission[] = [];
      
      // Get all clients first
      const clientPromises = clientsSnapshot.docs.map(async (clientDoc) => {
        const clientData = clientDoc.data();
        const clientId = clientDoc.id;
        
        // Get submissions for this client
        const submissionsRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'submissions');
        const submissionsQuery = query(submissionsRef, orderBy('submittedAt', 'desc'));
        
        return new Promise<void>((resolve) => {
          const unsubscribeSubmissions = onSnapshot(submissionsQuery, (submissionsSnapshot) => {
            submissionsSnapshot.forEach((submissionDoc) => {
              const submissionData = submissionDoc.data();
              
              // Only include unreviewed submissions
              if (!submissionData.reviewed) {
                allSubmissions.push({
                  id: submissionDoc.id,
                  formName: submissionData.formName,
                  clientId: clientId,
                  clientName: clientData.name,
                  answers: submissionData.answers || [],
                  submittedAt: submissionData.submittedAt,
                  reviewed: submissionData.reviewed || false
                });
              }
            });
            resolve();
          });
        });
      });

      await Promise.all(clientPromises);
      
      // Sort all submissions by date
      allSubmissions.sort((a, b) => {
        if (!a.submittedAt || !b.submittedAt) return 0;
        return b.submittedAt.toMillis() - a.submittedAt.toMillis();
      });
      
      setSubmissions(allSubmissions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleMarkReviewed = async (submission: Submission) => {
    if (!user?.uid) return;

    setMarkingReviewed(true);
    try {
      const submissionRef = doc(db, 'coaches', user.uid, 'clients', submission.clientId, 'submissions', submission.id);
      await updateDoc(submissionRef, {
        reviewed: true,
        reviewedAt: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Check-in marked as reviewed",
      });

      setShowSubmissionModal(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error marking submission as reviewed:', error);
      toast({
        title: "Error",
        description: "Failed to mark as reviewed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingReviewed(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Check Ins</h1>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading check-ins...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Check Ins</h1>
          <div className="text-sm text-gray-600">
            {submissions.length} unreviewed submission{submissions.length !== 1 ? 's' : ''}
          </div>
        </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No check ins found</h3>
            <p className="text-gray-500">You don't have any check-in submissions yet. Check back later!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={`${submission.clientId}-${submission.id}`} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">{submission.formName}</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {submission.clientName}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSubmission(submission)}
                    className="border-black text-black hover:bg-black hover:text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Submitted {formatDate(submission.submittedAt)}</span>
                  <span className="font-medium">{getTimeAgo(submission.submittedAt)}</span>
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  {submission.answers.length} response{submission.answers.length !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Submission Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {selectedSubmission?.formName} - {selectedSubmission?.clientName}
              </DialogTitle>
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
              
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleMarkReviewed(selectedSubmission)}
                  disabled={markingReviewed}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {markingReviewed ? "Marking as Reviewed..." : "Mark as Reviewed"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
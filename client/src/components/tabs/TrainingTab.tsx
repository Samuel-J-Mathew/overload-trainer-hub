import { useCollection } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { where, orderBy } from "firebase/firestore";

interface TrainingTabProps {
  clientId: string;
}

export const TrainingTab = ({ clientId }: TrainingTabProps) => {
  const { data: workouts, loading } = useCollection("workouts", [
    where("clientId", "==", clientId),
    orderBy("date", "desc")
  ]);

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading training data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Training Programs</h3>
        <Button className="hubfit-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* Current Program */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Full Body</h4>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">Chest & Shoulders</Badge>
                <Badge variant="secondary">Back</Badge>
                <Badge variant="secondary">Arms</Badge>
                <Badge variant="secondary">Legs</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No workouts recorded yet</p>
              <p className="text-sm mt-2">Workouts will appear here when the client logs them</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {workouts.map((workout: any) => (
                <div key={workout.id} className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{workout.name}</h5>
                    <span className="text-sm text-gray-500">{formatDate(workout.date)}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      Duration: <span className="font-medium">{workout.duration || 0} mins</span>
                    </div>
                    <div>
                      Exercises: <span className="font-medium">{workout.exercises?.length || 0}</span>
                    </div>
                    <div>
                      Total Sets: <span className="font-medium">{workout.totalSets || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

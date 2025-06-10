import { useCollection } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Star, StarOff } from "lucide-react";
import { where, orderBy } from "firebase/firestore";

interface CheckinsTabProps {
  clientId: string;
}

export const CheckinsTab = ({ clientId }: CheckinsTabProps) => {
  const { data: checkins, loading } = useCollection("checkins", [
    where("clientId", "==", clientId),
    orderBy("date", "desc")
  ]);

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < rating ? (
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      ) : (
        <StarOff key={i} className="w-4 h-4 text-yellow-400" />
      )
    ));
  };

  if (loading) {
    return <div className="text-center py-8">Loading check-ins...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Check-ins</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="hubfit-primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Check-in
          </Button>
        </div>
      </div>
      
      {/* Check-in Cards */}
      <div className="space-y-4">
        {checkins.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <p>No check-ins yet</p>
                <p className="text-sm mt-2">Check-ins will appear here when the client submits them</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          checkins.map((checkin: any) => (
            <Card key={checkin.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Weekly Check-in</h4>
                    <p className="text-sm text-gray-500">{formatDate(checkin.date)}</p>
                  </div>
                  <Badge variant={checkin.reviewed ? "default" : "secondary"}>
                    {checkin.reviewed ? "Reviewed" : "Pending"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {checkin.workoutsCompleted || 0}
                    </p>
                    <p className="text-sm text-gray-500">Workouts Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {checkin.weight ? `${checkin.weight}kg` : 'No data'}
                    </p>
                    <p className="text-sm text-gray-500">Current Weight</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      {renderStars(checkin.satisfactionRating || 0)}
                    </div>
                    <p className="text-sm text-gray-500">Satisfaction Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {checkin.energyLevel ? `${checkin.energyLevel}/10` : 'No data'}
                    </p>
                    <p className="text-sm text-gray-500">Energy Level</p>
                  </div>
                </div>

                {checkin.reflection && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">{checkin.reflection}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

import { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, TrendingUp, Activity, Camera } from "lucide-react";

interface OverviewTabProps {
  client: Client;
}

export const OverviewTab = ({ client }: OverviewTabProps) => {
  const formatDate = (date?: any) => {
    if (!date) return "Never";
    
    // Handle Firestore Timestamp objects
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Client Details Card */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{client.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Check-in</span>
              <span className="font-medium">{formatDate(client.lastCheckin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Active</span>
              <span className="font-medium">{formatDate(client.lastActive)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <Badge variant={client.duration === 'active' ? 'default' : 'secondary'}>
                {client.duration || 'New'}
              </Badge>
            </div>
            {client.tag && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tags</span>
                <Badge variant={client.tag === 'in-person' ? 'default' : 'secondary'}>
                  {client.tag.replace('-', ' ')}
                </Badge>
              </div>
            )}

            {/* Goal Section */}
            {client.goal && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Goal</h4>
                <p className="text-gray-600 text-sm">{client.goal}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>15 November 2022</span>
                  <span className="mx-2 px-2 py-1 bg-gray-200 text-gray-700 rounded">PRIVATE</span>
                </div>
              </div>
            )}

            {/* Injuries Section */}
            {client.injuries && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Injuries</h4>
                <p className="text-gray-600 text-sm">{client.injuries}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>15 November 2022</span>
                  <span className="mx-2 px-2 py-1 bg-gray-200 text-gray-700 rounded">PRIVATE</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metrics and Activity */}
      <div className="lg:col-span-2 space-y-6">
        {/* Metrics Avg Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Metrics Avg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Weight</span>
                  <span className="text-red-500 text-sm">-22%</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {client.currentWeight ? `${client.currentWeight} kg` : 'No data'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Body Fat</span>
                  <span className="text-red-500 text-sm">-36%</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {client.bodyFat ? `${client.bodyFat}%` : 'No data'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here when the client starts using the app</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Photos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Recent Photos
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No photos yet</p>
              <p className="text-sm">Progress photos will appear here when uploaded</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

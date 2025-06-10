import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Camera, Expand } from "lucide-react";

interface PhotosTabProps {
  clientId: string;
}

export const PhotosTab = ({ clientId }: PhotosTabProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Progress Photos</h3>
        <Button className="hubfit-primary">
          <Plus className="w-4 h-4 mr-2" />
          Upload Photos
        </Button>
      </div>

      {/* Photo Gallery */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500 py-12">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No progress photos yet</p>
            <p className="text-sm">
              Progress photos will appear here when the client uploads them or when you add them manually.
            </p>
            <Button className="hubfit-primary mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Upload First Photo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";
import { CheckInBuilder } from "./CheckInBuilder";

interface CheckIn {
  id: string;
  formName: string;
  createdAt: Date;
  questions: Question[];
}

interface Question {
  id: string;
  questionText: string;
  responseType: string;
  required: boolean;
  order: number;
}

export const CheckInsTab = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newCheckInName, setNewCheckInName] = useState("");
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);

  const handleCreateCheckIn = () => {
    if (newCheckInName.trim()) {
      const newCheckIn: CheckIn = {
        id: Date.now().toString(),
        formName: newCheckInName.trim(),
        createdAt: new Date(),
        questions: []
      };
      setCheckIns([...checkIns, newCheckIn]);
      setNewCheckInName("");
      setShowNameInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCheckIn();
    }
  };

  const updateCheckIn = (updatedCheckIn: CheckIn) => {
    setCheckIns(checkIns.map(ci => 
      ci.id === updatedCheckIn.id ? updatedCheckIn : ci
    ));
    setSelectedCheckIn(updatedCheckIn);
  };

  if (selectedCheckIn) {
    return (
      <CheckInBuilder 
        checkIn={selectedCheckIn}
        onBack={() => setSelectedCheckIn(null)}
        onUpdate={updateCheckIn}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Check-Ins</h2>
        <Button 
          onClick={() => setShowNameInput(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Check-In
        </Button>
      </div>

      {showNameInput && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter check-in form name..."
                value={newCheckInName}
                onChange={(e) => setNewCheckInName(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
                className="flex-1"
              />
              <Button 
                onClick={handleCreateCheckIn}
                disabled={!newCheckInName.trim()}
                size="sm"
              >
                Create
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowNameInput(false);
                  setNewCheckInName("");
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checkIns.map((checkIn) => (
          <Card 
            key={checkIn.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCheckIn(checkIn)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {checkIn.formName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {checkIn.questions.length} questions
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-400">
                Created {checkIn.createdAt.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {checkIns.length === 0 && !showNameInput && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No check-ins yet</h3>
          <p className="text-gray-500 mb-4">Create your first check-in form to get started</p>
          <Button 
            onClick={() => setShowNameInput(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Check-In
          </Button>
        </div>
      )}
    </div>
  );
};
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ProgramsTab } from "@/components/training/ProgramsTab";
import { WorkoutsTab } from "@/components/training/WorkoutsTab";
import { ExercisesTab } from "@/components/training/ExercisesTab";
import { Dumbbell, FileText, Users } from "lucide-react";

export default function Training() {
  const [activeTab, setActiveTab] = useState("programs");

  const tabs = [
    { id: "programs", label: "Programs", icon: Dumbbell },
    { id: "workouts", label: "Workouts", icon: FileText },
    { id: "exercises", label: "Exercises", icon: Users }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "programs":
        return <ProgramsTab />;
      case "workouts":
        return <WorkoutsTab />;
      case "exercises":
        return <ExercisesTab />;
      default:
        return <ProgramsTab />;
    }
  };

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Training</h1>
            
            {/* Custom Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-1 py-2 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
            
            <div className="mt-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
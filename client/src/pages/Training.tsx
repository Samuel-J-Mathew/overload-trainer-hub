import { useState } from "react";
import { Layout } from "@/components/Layout";
import { TabNavigation } from "@/components/TabNavigation";
import { ProgramsTab } from "@/components/training/ProgramsTab";
import { WorkoutsTab } from "@/components/training/WorkoutsTab";
import { ExercisesTab } from "@/components/training/ExercisesTab";

export default function Training() {
  const [activeTab, setActiveTab] = useState("programs");

  const tabs = [
    { id: "programs", label: "Programs" },
    { id: "workouts", label: "Workouts" },
    { id: "exercises", label: "Exercises" }
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
            
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            
            <div className="mt-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
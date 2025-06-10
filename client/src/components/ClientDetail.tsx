import { useState } from "react";
import { Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, MessageSquare, X } from "lucide-react";
import { TabNavigation } from "./TabNavigation";
import { OverviewTab } from "./tabs/OverviewTab";
import { CheckinsTab } from "./tabs/CheckinsTab";
import { TrainingTab } from "./tabs/TrainingTab";
import { NutritionTab } from "./tabs/NutritionTab";
import { HabitsTab } from "./tabs/HabitsTab";
import { MetricsTab } from "./tabs/MetricsTab";
import { PhotosTab } from "./tabs/PhotosTab";

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

export const ClientDetail = ({ client, onBack }: ClientDetailProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBanner, setShowBanner] = useState(true);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    const colors = [
      'bg-orange-500',
      'bg-pink-500', 
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500'
    ];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab client={client} />;
      case 'checkins':
        return <CheckinsTab clientId={client.id} />;
      case 'training':
        return <TrainingTab clientId={client.id} />;
      case 'nutrition':
        return <NutritionTab clientId={client.id} />;
      case 'habits':
        return <HabitsTab clientId={client.id} />;
      case 'metrics':
        return <MetricsTab clientId={client.id} />;
      case 'photos':
        return <PhotosTab clientId={client.id} />;
      default:
        return <OverviewTab client={client} />;
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{client.name || "Unknown Client"}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Client Header Card */}
        <div className="hubfit-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 ${getAvatarColor(client.name)} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold text-xl">
                  {getInitials(client.name)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{client.name || "Unknown Client"}</h2>
                <p className="text-gray-500">{client.email || "No email"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button className="hubfit-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          </div>

          {/* Blue Banner */}
          {showBanner && (
            <div className="bg-primary text-primary-foreground p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Try the App out as this client</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                <span className="mr-2">Show me how</span>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="hubfit-card p-6">
          {renderTabContent()}
        </div>
      </main>
    </>
  );
};

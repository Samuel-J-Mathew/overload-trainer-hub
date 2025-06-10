import { Button } from "@/components/ui/button";
import { 
  Eye, 
  ClipboardCheck, 
  Dumbbell, 
  Apple, 
  CheckCircle, 
  TrendingUp, 
  Camera 
} from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'checkins', label: 'Check Ins', icon: ClipboardCheck },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'habits', label: 'Habits', icon: CheckCircle },
  { id: 'metrics', label: 'Metrics', icon: TrendingUp },
  { id: 'photos', label: 'Photos', icon: Camera },
];

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="hubfit-card mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

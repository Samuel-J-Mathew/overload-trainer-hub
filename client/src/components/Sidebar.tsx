import { 
  Home, 
  Users, 
  ClipboardCheck, 
  CheckSquare, 
  MessageSquare, 
  Package, 
  UserCheck, 
  Users2, 
  Apple, 
  FileText, 
  BarChart3,
  Dumbbell,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";

const navigation = [
  { name: "Main", icon: Home, href: "#", current: false },
  { name: "Clients", icon: Users, href: "#", current: true },
  { name: "Check Ins", icon: ClipboardCheck, href: "#", current: false },
  { name: "Tasks", icon: CheckSquare, href: "#", current: false },
  { name: "Messages", icon: MessageSquare, href: "#", current: false },
  { name: "Packages", icon: Package, href: "#", current: false },
  { name: "Community", icon: UserCheck, href: "#", current: false },
  { name: "Teams", icon: Users2, href: "#", current: false },
  { name: "Nutrition", icon: Apple, href: "#", current: false },
  { name: "Forms", icon: FileText, href: "#", current: false },
  { name: "Metrics", icon: BarChart3, href: "#", current: false },
];

export const Sidebar = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Overload</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={`w-full justify-start ${
                item.current 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || "C"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || "Coach Name"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-400 hover:text-gray-600"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

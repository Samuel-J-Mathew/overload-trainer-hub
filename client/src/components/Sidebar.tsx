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
  { name: "Clients", icon: Users, href: "#", current: true },
  { name: "Check Ins", icon: ClipboardCheck, href: "#", current: false },
  { name: "Tasks", icon: CheckSquare, href: "#", current: false },
  { name: "Messages", icon: MessageSquare, href: "#", current: false },
  { name: "Packages", icon: Package, href: "#", current: false },
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
    <div className="w-64 bg-sidebar shadow-sm border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">Overload</span>
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
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || "C"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email || "Coach Name"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-sidebar-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

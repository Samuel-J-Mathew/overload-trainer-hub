import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import CheckIns from "@/pages/CheckIns";
import Forms from "@/pages/Forms";
import Messages from "@/pages/Messages";
import Nutrition from "@/pages/Nutrition";
import Packages from "@/pages/Packages";
import Tasks from "@/pages/Tasks";
import Training from "@/pages/Training";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/checkins" component={CheckIns} />
      <Route path="/forms" component={Forms} />
      <Route path="/messages" component={Messages} />
      <Route path="/nutrition" component={Nutrition} />
      <Route path="/packages" component={Packages} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/training" component={Training} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

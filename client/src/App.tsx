import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Meals from "@/pages/Meals";
import Stats from "@/pages/Stats";
import Exercises from "@/pages/Exercises";
import Restaurants from "@/pages/Restaurants";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        {/* Redirect any other route to landing for unauthenticated users */}
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/meals" component={Meals} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/stats" component={Stats} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

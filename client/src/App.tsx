import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Meals from "@/pages/Meals";
import Stats from "@/pages/Stats";
import Exercises from "@/pages/Exercises";
import Restaurants from "@/pages/Restaurants";
import HealthConnect from "@/pages/HealthConnect";
import Friends from "@/pages/Friends";
import Organizer from "@/pages/Organizer";
import { ReminderWatcher } from "@/components/organizer/ReminderWatcher";
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center" dir="rtl">
        <WifiOff className="w-10 h-10 text-muted-foreground" />
        <p className="font-medium">تعذّر الاتصال بالخادم</p>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <>
    <ReminderWatcher />
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/meals" component={Meals} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/stats" component={Stats} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/settings" component={Settings} />
      <Route path="/health-connect" component={HealthConnect} />
      <Route path="/friends" component={Friends} />
      <Route path="/organizer" component={Organizer} />
      <Route component={NotFound} />
    </Switch>
    </>
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

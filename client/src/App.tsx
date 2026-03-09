import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { LoginRegistration } from "@/pages/LoginRegistration";
import DashboardScreen from "@/pages/DashboardScreen";
import DogSearchScreen from "@/pages/DogSearchScreen";
import DogProfileScreen from "@/pages/DogProfileScreen";
import BreederDirectoryScreen from "@/pages/BreederDirectoryScreen";
import BreederProfileScreen from "@/pages/BreederProfileScreen";
import ShowsScreen from "@/pages/ShowsScreen";
import ShowResultsScreen from "@/pages/ShowResultsScreen";
import ProfileScreen from "@/pages/ProfileScreen";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginRegistration} />
      <Route path="/" component={DashboardScreen} />
      <Route path="/dogs" component={DogSearchScreen} />
      <Route path="/dogs/:id" component={DogProfileScreen} />
      <Route path="/breeders" component={BreederDirectoryScreen} />
      <Route path="/breeders/:id" component={BreederProfileScreen} />
      <Route path="/shows" component={ShowsScreen} />
      <Route path="/shows/:id" component={ShowResultsScreen} />
      <Route path="/profile" component={ProfileScreen} />
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

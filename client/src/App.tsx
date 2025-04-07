import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MyAutomations from "@/pages/MyAutomations";
import AutomationBuilder from "@/pages/AutomationBuilder";
import AutomationDetails from "@/pages/AutomationDetails";
import AIServices from "@/pages/AIServices";
import AppConnections from "@/pages/AppConnections";
import Settings from "@/pages/Settings";
import MainLayout from "@/layouts/MainLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/automations" component={MyAutomations} />
      <Route path="/automations/:id" component={AutomationDetails} />
      <Route path="/builder" component={AutomationBuilder} />
      <Route path="/builder/:id" component={AutomationBuilder} />
      <Route path="/app-connections" component={AppConnections} />
      <Route path="/ai-services" component={AIServices} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

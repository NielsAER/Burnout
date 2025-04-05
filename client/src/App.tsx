import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MyAutomations from "@/pages/MyAutomations";
import AutomationBuilder from "@/pages/AutomationBuilder";
import MainLayout from "@/layouts/MainLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/automations" component={MyAutomations} />
      <Route path="/builder" component={AutomationBuilder} />
      <Route path="/builder/:id" component={AutomationBuilder} />
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

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MyAutomations from "@/pages/MyAutomations";
import AutomationBuilder from "@/pages/AutomationBuilder";
import AutomationDetails from "@/pages/AutomationDetails";
import Templates from "@/pages/Templates";
import AIServices from "@/pages/AIServices";
import AppConnections from "@/pages/AppConnections";
import Settings from "@/pages/Settings";
import UserProfile from "@/pages/UserProfile";
import AuthPage from "@/pages/auth-page";
import MainLayout from "@/layouts/MainLayout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AIAssistantProvider } from "@/contexts/AIAssistantContext";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/automations" component={MyAutomations} />
      <ProtectedRoute path="/automations/:id" component={AutomationDetails} />
      <ProtectedRoute path="/templates" component={Templates} />
      <ProtectedRoute path="/builder" component={AutomationBuilder} />
      <ProtectedRoute path="/builder/:id" component={AutomationBuilder} />
      <ProtectedRoute path="/app-connections" component={AppConnections} />
      <ProtectedRoute path="/ai-services" component={AIServices} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/profile" component={UserProfile} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <ThemeProvider>
          <AuthProvider>
            <AIAssistantProvider>
              <MainLayout>
                <Router />
              </MainLayout>
              <Toaster />
            </AIAssistantProvider>
          </AuthProvider>
        </ThemeProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}

export default App;

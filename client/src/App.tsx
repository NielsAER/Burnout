import { Switch, Route, useLocation } from "wouter";
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

// Customer Portal Pages
import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import CustomerHistory from "@/pages/customer/CustomerHistory";
import CustomerAutomationDetails from "@/pages/customer/CustomerAutomationDetails";
import CustomerAIServices from "@/pages/customer/CustomerAIServices";
import CustomerProfile from "@/pages/customer/CustomerProfile";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import CustomerLayout from "@/layouts/CustomerLayout";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AIAssistantProvider } from "@/contexts/AIAssistantContext";

// Customer Portal Protected Route
const CustomerProtectedRoute = ({ path, component: Component }: { path: string, component: () => React.JSX.Element }) => {
  return (
    <ProtectedRoute
      path={path}
      component={() => (
        <CustomerLayout>
          <Component />
        </CustomerLayout>
      )}
    />
  );
};

// Developer Portal Router
function DeveloperRouter() {
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
    </Switch>
  );
}

// Customer Portal Router
function CustomerRouter() {
  return (
    <Switch>
      <CustomerProtectedRoute path="/customer/dashboard" component={CustomerDashboard} />
      <CustomerProtectedRoute path="/customer/history" component={CustomerHistory} />
      <CustomerProtectedRoute path="/customer/automations/:id" component={CustomerAutomationDetails} />
      <CustomerProtectedRoute path="/customer/ai-services" component={CustomerAIServices} />
      <CustomerProtectedRoute path="/customer/profile" component={CustomerProfile} />
    </Switch>
  );
}

// Main Router
function Router() {
  const [location] = useLocation();
  
  // Render the appropriate router based on the current location
  if (location.startsWith("/customer")) {
    return <CustomerRouter />;
  }
  
  return (
    <Switch>
      <Route>
        <MainLayout>
          <DeveloperRouter />
        </MainLayout>
      </Route>
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
              <Router />
              <Toaster />
            </AIAssistantProvider>
          </AuthProvider>
        </ThemeProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}

export default App;

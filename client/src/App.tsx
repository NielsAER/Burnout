import { Switch, Route, useLocation, Redirect } from "wouter";
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
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";

// Customer Portal Pages
import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import CustomerHistory from "@/pages/customer/CustomerHistory";
import CustomerAutomationDetails from "@/pages/customer/CustomerAutomationDetails";
import CustomerAIServices from "@/pages/customer/CustomerAIServices";
import CustomerProfile from "@/pages/customer/CustomerProfile";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import CustomerLayout from "@/layouts/CustomerLayout";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute, ResearcherRoute, CustomerRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AIAssistantProvider } from "@/contexts/AIAssistantContext";

// Customer Portal Protected Route
const CustomerProtectedRoute = ({ path, component: Component }: { path: string, component: () => React.JSX.Element }) => {
  return (
    <CustomerRoute
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
      <ResearcherRoute path="/" component={Dashboard} />
      <ResearcherRoute path="/automations" component={MyAutomations} />
      <ResearcherRoute path="/automations/:id" component={AutomationDetails} />
      <ResearcherRoute path="/templates" component={Templates} />
      <ResearcherRoute path="/builder" component={AutomationBuilder} />
      <ResearcherRoute path="/builder/:id" component={AutomationBuilder} />
      <ResearcherRoute path="/app-connections" component={AppConnections} />
      <ResearcherRoute path="/ai-services" component={AIServices} />
      <ResearcherRoute path="/settings" component={Settings} />
      <ResearcherRoute path="/profile" component={UserProfile} />
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
  const { user, userRole } = useAuth();
  
  // Auth, forgot password, and reset password pages should be accessible without authentication
  if (location === "/auth") {
    return <AuthPage />;
  }
  
  if (location === "/forgot-password") {
    return <ForgotPasswordPage />;
  }
  
  if (location.startsWith("/reset-password")) {
    return <ResetPasswordPage />;
  }
  
  // If not on auth-related pages, check if user exists and redirect accordingly
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Render the appropriate router based on user role or current location
  const savedRole = sessionStorage.getItem('userRole');
  
  // If user is a customer, always use the customer router
  if (userRole === "customer" || savedRole === "customer") {
    // If they're not already on a customer route, redirect them
    if (!location.startsWith("/customer")) {
      return <Redirect to="/customer/dashboard" />;
    }
    return <CustomerRouter />;
  }
  
  // For researchers, if they somehow end up on a customer route, redirect them
  if (location.startsWith("/customer")) {
    return <Redirect to="/" />;
  }
  
  // Default to developer/researcher view
  return (
    <MainLayout>
      <DeveloperRouter />
    </MainLayout>
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

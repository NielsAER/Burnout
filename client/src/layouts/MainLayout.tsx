import { FC, ReactNode, useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAIAssistant } from "@/contexts/AIAssistantContext";
import { AIAssistantTooltip } from "@/components/ui/ai-assistant-tooltip";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const [location, navigate] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { currentContext, assistantEnabled } = useAIAssistant();
  const isDarkMode = resolvedTheme === "dark";

  // Determine page title based on current route
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/automations":
        return "My Automations";
      case "/builder":
        return "Create Automation";
      case "/ai-services":
        return "AI Services";
      default:
        if (location.startsWith("/builder/")) {
          return "Edit Automation";
        }
        return "BRNOUT";
    }
  };

  const handleCreateAutomation = () => {
    navigate("/builder");
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f0f]">
      {/* Sidebar for desktop */}
      <div className={`${mobileSidebarOpen ? 'fixed inset-0 z-50' : 'hidden'} md:relative md:flex`}>
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button 
          size="icon" 
          className="rounded-sm shadow-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={toggleMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0f0f0f]">
        {/* Header */}
        <header className="bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#2a2a2a] shadow-sm">
          <div className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center">
              <Logo size="md" className="mr-4 hidden md:block" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your automation workflows</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!location.includes("/builder") && (
                <Button 
                  onClick={handleCreateAutomation}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-sm px-3 py-2 text-sm h-9"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Automation
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-sm"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-sm"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        {children}
        
        {/* AI Assistant */}
        {assistantEnabled && (
          <AIAssistantTooltip 
            contextId={currentContext} 
            position="bottom-right"
          />
        )}
      </main>
    </div>
  );
};

export default MainLayout;

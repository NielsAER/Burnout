import { FC, ReactNode, useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const [location, navigate] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { resolvedTheme } = useTheme();
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
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Sidebar for desktop */}
      <div className={`${mobileSidebarOpen ? 'fixed inset-0 z-50' : 'hidden'} md:relative md:flex`}>
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button 
          size="icon" 
          className="rounded-full shadow-lg bg-coral-500 text-white hover:bg-coral-600"
          onClick={toggleMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-zinc-900">
        {/* Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 shadow-md">
          <div className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center">
              <Logo size="md" className="mr-4 hidden md:block" />
              <div>
                <h1 className="text-2xl font-semibold text-white">{getPageTitle()}</h1>
                <p className="text-sm text-zinc-400">Manage your automation workflows</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!location.includes("/builder") && (
                <Button 
                  onClick={handleCreateAutomation}
                  className="bg-coral-500 hover:bg-coral-600 text-white border-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Automation
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-700"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-700"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        {children}
      </main>
    </div>
  );
};

export default MainLayout;

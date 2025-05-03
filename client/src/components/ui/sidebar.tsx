import { FC } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ChartGantt, 
  AppWindow, 
  History, 
  Settings, 
  LogOut,
  BrainCircuit,
  ExternalLink,
  User
} from "lucide-react";


interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ onClose }) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-full md:w-64 flex flex-col z-20 h-full bg-white dark:bg-[#181818] border-r border-gray-200 dark:border-[#2a2a2a] transition-colors duration-200">
      {/* Logo and Close Button */}
      <div className="p-3 md:p-4 border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-base md:text-lg font-semibold">Researcher Portal</span>
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden rounded-full p-1 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="space-y-1">
          <Link 
            href="/" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              isActive("/") 
                ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border-l-[3px] border-blue-600" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            )}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link 
            href="/automations" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              isActive("/automations") 
                ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border-l-[3px] border-blue-600" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            )}
          >
            <ChartGantt className="mr-3 h-5 w-5" />
            My Automations
          </Link>
          <Link 
            href="/app-connections" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              isActive("/app-connections") 
                ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border-l-[3px] border-blue-600" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            )}
          >
            <ExternalLink className="mr-3 h-5 w-5" />
            App Connections
          </Link>
          <Link 
            href="/history" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              isActive("/history") 
                ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border-l-[3px] border-blue-600" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            )}
          >
            <History className="mr-3 h-5 w-5" />
            Execution History
          </Link>
          <Link 
            href="/ai-services" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              isActive("/ai-services") 
                ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border-l-[3px] border-blue-600" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            )}
          >
            <BrainCircuit className="mr-3 h-5 w-5" />
            AI Services
          </Link>
          <Link 
            href="/settings" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              isActive("/settings") 
                ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border-l-[3px] border-blue-600" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            )}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Recent Templates
          </h3>
          <div className="mt-2 space-y-1">
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
              <span className="truncate">Gmail to Slack Notifications</span>
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
              <span className="truncate">Twitter to CRM Lead</span>
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
              <span className="truncate">Form Submission to Google Sheet</span>
            </a>
          </div>
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4 transition-colors duration-200">
        {user && (
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-600/20">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {user.fullName 
                  ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  : user.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || user.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pro Plan</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Link 
                href="/profile"
                className="p-1 rounded-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <User className="h-4 w-4" />
              </Link>
              <button 
                className="p-1 rounded-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

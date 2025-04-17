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
import { Logo } from "./logo";

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
    <aside className="w-64 flex flex-col z-20 h-full bg-[#181818] border-r border-[#2a2a2a] transition-colors duration-200">
      {/* Logo */}
      <div className="p-4 border-b border-[#2a2a2a] transition-colors duration-200">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <Link 
            href="/" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              isActive("/") 
                ? "bg-[#2a2a2a] text-white border-l-[3px] border-blue-600" 
                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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
                ? "bg-[#2a2a2a] text-white border-l-[3px] border-blue-600" 
                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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
                ? "bg-[#2a2a2a] text-white border-l-[3px] border-blue-600" 
                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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
                ? "bg-[#2a2a2a] text-white border-l-[3px] border-blue-600" 
                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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
                ? "bg-[#2a2a2a] text-white border-l-[3px] border-blue-600" 
                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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
                ? "bg-[#2a2a2a] text-white border-l-[3px] border-blue-600" 
                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            )}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Recent Templates
          </h3>
          <div className="mt-2 space-y-1">
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
              <span className="truncate">Gmail to Slack Notifications</span>
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
              <span className="truncate">Twitter to CRM Lead</span>
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
              <span className="truncate">Form Submission to Google Sheet</span>
            </a>
          </div>
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="border-t border-[#2a2a2a] p-4 transition-colors duration-200">
        {user && (
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-blue-600/20">
              <span className="text-sm font-medium text-blue-400">
                {user.fullName 
                  ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  : user.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.fullName || user.username}</p>
              <p className="text-xs text-gray-400">Pro Plan</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Link 
                href="/profile"
                className="p-1 rounded-sm text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              >
                <User className="h-4 w-4" />
              </Link>
              <button 
                className="p-1 rounded-sm text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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

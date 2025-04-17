import { FC } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <ChartGantt className="h-5 w-5 text-white" />
          </div>
          <h1 className="ml-2 text-xl font-semibold">BRNOUT</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <Link href="/" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive("/") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </a>
          </Link>
          <Link href="/automations" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive("/automations") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <ChartGantt className="mr-3 h-5 w-5" />
              My Automations
            </a>
          </Link>
          <Link href="/app-connections" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive("/app-connections") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <ExternalLink className="mr-3 h-5 w-5" />
              App Connections
            </a>
          </Link>
          <Link href="/history" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive("/history") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <History className="mr-3 h-5 w-5" />
              Execution History
            </a>
          </Link>
          <Link href="/ai-services" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive("/ai-services") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <BrainCircuit className="mr-3 h-5 w-5" />
              AI Services
            </a>
          </Link>
          <Link href="/settings" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive("/settings") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </a>
          </Link>
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent Templates
          </h3>
          <div className="mt-2 space-y-1">
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              <span className="truncate">Gmail to Slack Notifications</span>
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              <span className="truncate">Twitter to CRM Lead</span>
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              <span className="truncate">Form Submission to Google Sheet</span>
            </a>
          </div>
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        {user && (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user.fullName 
                  ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  : user.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.fullName || user.username}</p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Link href="/profile">
                <button className="text-gray-400 hover:text-gray-500">
                  <User className="h-4 w-4" />
                </button>
              </Link>
              <button 
                className="text-gray-400 hover:text-gray-500"
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

import { FC } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ChartGantt, 
  AppWindow, 
  History, 
  Settings, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ onClose }) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <ChartGantt className="h-5 w-5 text-white" />
          </div>
          <h1 className="ml-2 text-xl font-semibold">FlowConnect</h1>
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
          <Link href="/connections" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive("/connections") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <AppWindow className="mr-3 h-5 w-5" />
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
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">JS</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">John Smith</p>
            <p className="text-xs text-gray-500">Pro Plan</p>
          </div>
          <button className="ml-auto text-gray-400 hover:text-gray-500">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

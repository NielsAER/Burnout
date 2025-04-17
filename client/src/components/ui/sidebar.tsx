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
    <aside className="w-64 flex flex-col z-20 h-full bg-zinc-950 border-r border-zinc-800 transition-colors duration-200">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800 transition-colors duration-200">
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
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/") 
                ? "bg-coral-500/20 text-coral-400 border-l-3 border-coral-500" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link 
            href="/automations" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/automations") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : cn(
                  isDarkMode
                    ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )
            )}
          >
            <ChartGantt className="mr-3 h-5 w-5" />
            My Automations
          </Link>
          <Link 
            href="/app-connections" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/app-connections") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : cn(
                  isDarkMode
                    ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )
            )}
          >
            <ExternalLink className="mr-3 h-5 w-5" />
            App Connections
          </Link>
          <Link 
            href="/history" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/history") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : cn(
                  isDarkMode
                    ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )
            )}
          >
            <History className="mr-3 h-5 w-5" />
            Execution History
          </Link>
          <Link 
            href="/ai-services" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/ai-services") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : cn(
                  isDarkMode
                    ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )
            )}
          >
            <BrainCircuit className="mr-3 h-5 w-5" />
            AI Services
          </Link>
          <Link 
            href="/settings" 
            onClick={onClose}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/settings") 
                ? "bg-primary/10 text-primary border-l-3 border-primary" 
                : cn(
                  isDarkMode
                    ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )
            )}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </div>
        
        <div className="mt-8">
          <h3 className={cn(
            "px-3 text-xs font-semibold uppercase tracking-wider",
            isDarkMode ? "text-muted-foreground" : "text-gray-500"
          )}>
            Recent Templates
          </h3>
          <div className="mt-2 space-y-1">
            <a href="#" className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isDarkMode
                ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}>
              <span className="truncate">Gmail to Slack Notifications</span>
            </a>
            <a href="#" className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isDarkMode
                ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}>
              <span className="truncate">Twitter to CRM Lead</span>
            </a>
            <a href="#" className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isDarkMode
                ? "text-foreground/70 hover:text-foreground hover:bg-muted" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}>
              <span className="truncate">Form Submission to Google Sheet</span>
            </a>
          </div>
        </div>
      </nav>
      
      {/* User Profile */}
      <div className={cn(
        "border-t p-4 transition-colors duration-200",
        isDarkMode ? "border-border" : "border-gray-200"
      )}>
        {user && (
          <div className="flex items-center">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              isDarkMode ? "bg-muted" : "bg-gray-200"
            )}>
              <span className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-muted-foreground" : "text-gray-600"
              )}>
                {user.fullName 
                  ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  : user.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.fullName || user.username}</p>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-muted-foreground" : "text-gray-500"
              )}>Pro Plan</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Link 
                href="/profile"
                className={cn(
                  "p-1 rounded-full",
                  isDarkMode 
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                    : "text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                )}
              >
                <User className="h-4 w-4" />
              </Link>
              <button 
                className={cn(
                  "p-1 rounded-full",
                  isDarkMode 
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                    : "text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                )}
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

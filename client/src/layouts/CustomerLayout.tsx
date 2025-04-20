import { FC, ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { AiAssistantButton } from "@/components/assistant/AiAssistantButton";
import { useAIAssistant } from "@/contexts/AIAssistantContext";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu,
  X,
  LayoutDashboard,
  History,
  Bot,
  ExternalLink,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CustomerLayoutProps {
  children: ReactNode;
}

const CustomerLayout: FC<CustomerLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { currentContext, assistantEnabled } = useAIAssistant();
  const { user, logoutMutation } = useAuth();
  const isDarkMode = resolvedTheme === "dark";

  const navItems = [
    {
      name: "Dashboard",
      path: "/customer/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Execution History",
      path: "/customer/history",
      icon: <History className="w-5 h-5" />,
    },
    {
      name: "AI Services",
      path: "/customer/ai-services",
      icon: <Bot className="w-5 h-5" />,
    },
    {
      name: "My Profile",
      path: "/customer/profile",
      icon: <User className="w-5 h-5" />,
    },
    {
      name: "Go to Full Platform",
      path: "/",
      icon: <ExternalLink className="w-5 h-5" />,
    }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/customer/dashboard">
                <a className="flex items-center">
                  <Logo size="sm" />
                </a>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <a
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      location === item.path
                        ? "text-primary bg-primary/10"
                        : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </a>
                </Link>
              ))}
            </nav>

            {/* User menu and mobile menu button */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />

              <div className="hidden md:block">
                <Button variant="ghost" onClick={handleLogout} size="sm">
                  Log out
                </Button>
              </div>

              <div className="md:hidden">
                <button
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">Open menu</span>
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute z-30 inset-x-0 top-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <a
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium",
                    location === item.path
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </div>
                </a>
              </Link>
            ))}
            <button
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              onClick={handleLogout}
            >
              <div className="flex items-center">
                <LogOut className="w-5 h-5" />
                <span className="ml-3">Log out</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* AI Assistant Button */}
      <AiAssistantButton />
    </div>
  );
};

export default CustomerLayout;
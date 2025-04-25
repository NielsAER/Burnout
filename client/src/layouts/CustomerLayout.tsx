import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Home, History, Bot, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Customer layout for simplified interface

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/customer/dashboard",
      icon: Home,
      current: location === "/customer/dashboard",
    },
    {
      name: "Execution History",
      href: "/customer/history",
      icon: History,
      current: location === "/customer/history",
    },
    {
      name: "AI Services",
      href: "/customer/ai-services",
      icon: Bot,
      current: location === "/customer/ai-services",
    },
    {
      name: "Profile",
      href: "/customer/profile",
      icon: User,
      current: location === "/customer/profile",
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Function to render the sidebar navigation
  const renderSidebar = () => (
    <div className="hidden md:flex flex-col h-screen w-64 bg-background border-r border-border">
      <div className="p-4 flex justify-center">
        <Link to="/customer/dashboard">
          <span className="text-lg font-semibold">Customer Portal</span>
        </Link>
      </div>
      
      <Separator />
      
      <div className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
          >
            <Button
              variant={item.current ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Button>
          </Link>
        ))}
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">Customer</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <LogOut className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );

  // Function to render the mobile header and navigation
  const renderMobileHeader = () => (
    <div className="md:hidden border-b border-border p-4 flex items-center justify-between">
      <Link to="/customer/dashboard">
        <span className="text-lg font-semibold">Customer Portal</span>
      </Link>
      
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Customer Portal</SheetTitle>
              <SheetDescription>
                {user.username} - Customer
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                >
                  <Button
                    variant={item.current ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              ))}
              
              <Separator />
              
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="mr-3 h-5 w-5" />
                )}
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {renderSidebar()}
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {renderMobileHeader()}
        
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
        
        <div className="md:hidden flex items-center justify-center p-4 border-t border-border bg-background">
          <div className="flex space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button variant="ghost" size="icon">
                  <item.icon className={`h-6 w-6 ${item.current ? 'text-primary' : ''}`} />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      <div className="hidden md:block absolute top-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
import { useState, useEffect, useMemo } from "react";
import { APPS, AppId } from "@/lib/constants";
import AppIconMap from "@/components/automation/AppIconMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Categorize apps by type
type AppCategory = "social" | "productivity" | "communication" | "marketing" | "analytics" | "payments" | "ai";

const APP_CATEGORIES: Record<AppCategory, { title: string; description: string; apps: AppId[] }> = {
  social: {
    title: "Social Media",
    description: "Connect your social media accounts",
    apps: ["instagram", "linkedin", "twitter", "facebook-ads", "youtube"]
  },
  productivity: {
    title: "Productivity",
    description: "Connect your productivity tools",
    apps: ["notion", "trello", "google-drive", "google-calendar", "google-sheets", "google-forms", "microsoft"]
  },
  communication: {
    title: "Communication",
    description: "Connect your communication platforms",
    apps: ["gmail", "slack", "discord", "teams"]
  },
  marketing: {
    title: "Marketing",
    description: "Connect your marketing tools",
    apps: ["mailchimp", "hubspot", "crm"]
  },
  analytics: {
    title: "Analytics",
    description: "Connect your analytics platforms",
    apps: ["google-ads"]
  },
  payments: {
    title: "Payments",
    description: "Connect your payment platforms",
    apps: ["stripe"]
  },
  ai: {
    title: "AI Services",
    description: "Connect your AI service accounts",
    apps: ["openai", "anthropic", "ollama", "perplexity", "text-processor"]
  }
};

interface ConnectionStatus {
  connected: boolean;
  username?: string;
  lastConnected?: string;
  permissions?: string[];
}

export default function AppConnections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<AppCategory>("social");
  const [connectingApp, setConnectingApp] = useState<string | null>(null);

  // Fetch connection statuses
  const { data: connections, isLoading } = useQuery<any[]>({
    queryKey: ['/api/app-connections'],
    // Default to an empty array if no data exists yet
    initialData: []
  });
  
  // Convert to a more usable format with appId as key
  // Check for OAuth callback response parameters
  useEffect(() => {
    // Get URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success) {
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: "Connection Successful",
        description: `Your ${success} account has been connected successfully!`,
      });
      
      // Refresh the connections data
      queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
    } else if (error) {
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: "Connection Failed",
        description: "There was an error connecting your account. Please try again.",
        variant: "destructive",
      });
    }
  }, []);
  
  const connectionMap = useMemo(() => {
    const formatted: Record<string, ConnectionStatus> = {};
    
    // If data is available, process it
    if (Array.isArray(connections)) {
      connections.forEach((connection: any) => {
        formatted[connection.appId] = {
          connected: true,
          username: connection.username || 'Connected account',
          lastConnected: new Date(connection.createdAt).toLocaleDateString(),
          permissions: connection.permissions || []
        };
      });
    }
    return formatted;
  }, [connections]);

  // Mutation for connecting an app
  const connectMutation = useMutation({
    mutationFn: async (appId: string) => {
      // This would normally redirect to the OAuth page, but for now we'll mock it
      return await apiRequest({
        method: "POST",
        url: `/api/app-connections/${appId}/connect`,
        data: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
      toast({
        title: "Successfully connected!",
        description: "Your account has been connected successfully.",
      });
      setConnectingApp(null);
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: `${error}`,
        variant: "destructive",
      });
      setConnectingApp(null);
    }
  });

  // Mutation for disconnecting an app
  const disconnectMutation = useMutation({
    mutationFn: async (appId: string) => {
      return await apiRequest({
        method: "DELETE",
        url: `/api/app-connections/${appId}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
      toast({
        title: "Account disconnected",
        description: "Your account has been disconnected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection failed",
        description: `${error}`,
        variant: "destructive",
      });
    }
  });

  // Event listener for OAuth popup messages
  useEffect(() => {
    // Create message event handler
    const handleOAuthMessage = (event: MessageEvent) => {
      // Check if this is an OAuth message
      if (event.data && (event.data.type === 'oauth-success' || event.data.type === 'oauth-error')) {
        console.log("Received OAuth message:", event.data);
        
        if (event.data.type === 'oauth-success') {
          // Handle successful OAuth
          toast({
            title: "Connection Successful",
            description: `Your ${event.data.service} account has been connected successfully!`,
          });
          
          // Refresh the connections data
          queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
          setConnectingApp(null);
        } else {
          // Handle OAuth error
          toast({
            title: "Connection Failed",
            description: event.data.error || "There was an error connecting your account.",
            variant: "destructive",
          });
          setConnectingApp(null);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('message', handleOAuthMessage);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [toast, queryClient]);
  
  // Auth flow for connecting apps
  const startOAuthFlow = async (appId: string) => {
    setConnectingApp(appId);
    try {
      // Check if this is an API service that doesn't need OAuth
      const isApiService = ['openai', 'anthropic', 'perplexity', 'ollama', 'text-processor'].includes(appId);
      
      if (isApiService) {
        // For API services, connect directly without OAuth
        await apiRequest({
          method: "POST",
          url: `/api/app-connections/${appId}/connect`,
          data: { apiIntegration: true },
        });
        
        // Show success message
        toast({
          title: "API Service Connected",
          description: `${appId.charAt(0).toUpperCase() + appId.slice(1)} API service has been connected successfully.`,
        });
        
        // Refresh the connections data
        queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
        setConnectingApp(null);
        return;
      }
      
      // Map app IDs to OAuth service names
      const serviceMap: Record<string, string> = {
        'instagram': 'instagram',
        'linkedin': 'linkedin',
        'twitter': 'twitter',
        'google-drive': 'google',
        'google-calendar': 'google',
        'google-sheets': 'google',
        'gmail': 'google',
        'youtube': 'google'
      };
      
      // Get the corresponding OAuth service name
      const service = serviceMap[appId];
      
      if (!service) {
        throw new Error(`OAuth not supported for ${appId}`);
      }
      
      // For development/testing, use simulated login if not in production
      // In a real application, you would need to set up proper OAuth credentials
      const isProduction = false; // Set to true in production
      
      if (!isProduction) {
        // In development, use simulated login for testing
        console.log(`Using simulated login for ${service}`);
        window.location.href = `/api/simulated-login?service=${service}`;
      } else {
        // In production, use real OAuth
        const authResponse = await fetch(`/api/auth/${service}`);
        const authData = await authResponse.json();
        
        if (authData.oauthUrl) {
          window.location.href = authData.oauthUrl;
        } else {
          throw new Error("Failed to get authorization URL");
        }
      }
      
    } catch (error) {
      console.error("OAuth error:", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not start authorization process",
        variant: "destructive",
      });
      setConnectingApp(null);
    }
  };
  
  const handleConnect = (appId: string) => {
    startOAuthFlow(appId);
  };

  const handleDisconnect = (appId: string) => {
    disconnectMutation.mutate(appId);
  };

  const isConnected = (appId: string): boolean => {
    return !!connectionMap[appId]?.connected;
  };

  const renderConnectionStatus = (appId: string) => {
    if (connectingApp === appId) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isConnected(appId)) {
      return (
        <div className="flex items-center">
          <Check className="h-4 w-4 text-green-500 mr-2" />
          <span className="text-sm">{connectionMap[appId]?.username || 'Connected'}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Not connected</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">App Connections</h1>
        <p className="text-muted-foreground mt-2">
          Connect your accounts to various services to enable automations and workflows
        </p>
      </div>

      <Tabs defaultValue="social" value={activeCategory} onValueChange={(value) => setActiveCategory(value as AppCategory)}>
        <TabsList className="mb-4">
          {Object.entries(APP_CATEGORIES).map(([key, category]) => (
            <TabsTrigger key={key} value={key}>
              {category.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(APP_CATEGORIES).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.apps.map(appId => {
                const app = APPS[appId];
                
                if (!app) return null;
                
                return (
                  <Card key={appId} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <AppIconMap appId={appId} />
                      <div>
                        <CardTitle>{app.name}</CardTitle>
                        <CardDescription>{app.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <div className="text-sm font-medium mb-1">Connection Status</div>
                          {renderConnectionStatus(appId)}
                        </div>
                        <div>
                          {isConnected(appId) && (
                            <Badge variant="outline" className="ml-2">
                              {connectionMap[appId]?.permissions?.length} permissions
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {isConnected(appId) ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(appId)}
                          className="w-full"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          onClick={() => handleConnect(appId)}
                          className="w-full"
                          disabled={connectingApp === appId}
                        >
                          Connect <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
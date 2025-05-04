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
import { ToastAction } from "@/components/ui/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useLinkedInDirectToken } from "@/lib/useLinkedInDirectToken";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// Categorize apps by type
type AppCategory = "social" | "productivity" | "communication" | "marketing" | "analytics" | "payments";

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
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<AppCategory>("social");
  const [connectingApp, setConnectingApp] = useState<string | null>(null);
  const [linkedInToken, setLinkedInToken] = useState<string>("AQUHxDdRo_UARMzpDENsl8OeX_RZ1cSVvra-reQNrUX4pR3YNyMUtQAI8y-3EKm_2iiGvkoaC-k-jF3KtlXRJU0VGWsojM_trWLzzmaf6e31sV4CTSGxlhArPfsWrkkKlpRHn-GzryVWBtrfMWtSqta1XYtcETU2BQEvFU6c2c3bbmnZN1Yj0Vs08eXMJ5eHQfptTzJCkiwju7uwos4-rM7GL3d7WBYcR_f6UWiNtQN82-6YL_CJbX2k_xsPott1rHWyy13ubS1l1zzm5pkbsjcbWluoErONQOnGksTh7E-iid0nxH3_pJTTpT-mNZT-HZyBqAWmXuSMvwDUbd2oooXMUN5FKQ");
  const { connectWithToken, isConnecting: isConnectingLinkedIn } = useLinkedInDirectToken();

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
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
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
    } else if (code && state) {
      // This is a direct OAuth redirect from Instagram
      console.log('Detected direct OAuth redirect with code:', code.substring(0, 10) + '...');
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Handle the Instagram direct OAuth callback
      const handleInstagramRedirect = async () => {
        try {
          setConnectingApp('instagram');
          
          const response = await fetch(`/api/callback/instagram?code=${code}&state=${state}`);
          
          if (response.ok) {
            toast({
              title: "Connection Successful",
              description: "Your Instagram account has been connected successfully!",
            });
            
            // Refresh the connections data
            queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
          } else {
            const errorData = await response.json();
            toast({
              title: "Connection Failed",
              description: errorData.message || "There was an error connecting your Instagram account. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error handling Instagram redirect:', error);
          toast({
            title: "Connection Failed",
            description: "There was an error processing your Instagram connection. Please try again.",
            variant: "destructive",
          });
        } finally {
          setConnectingApp(null);
        }
      };
      
      handleInstagramRedirect();
    }
  }, [queryClient, toast]);
  
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
    if (!appId) {
      toast({
        title: "Connection failed",
        description: "Invalid app ID",
        variant: "destructive",
      });
      return;
    }
    
    setConnectingApp(appId);
    
    try {
      // Check if this is an API service that doesn't need OAuth
      const isApiService = ['openai', 'anthropic', 'perplexity', 'ollama', 'text-processor'].includes(appId);
      
      if (isApiService) {
        // Redirect users to settings page for AI services
        setConnectingApp(null);
        toast({
          title: "Configure API Key",
          description: `To use ${appId.charAt(0).toUpperCase() + appId.slice(1)}, please configure your API key in the Settings page.`,
          action: (
            <ToastAction altText="Go to Settings" onClick={() => navigate('/settings')}>
              Go to Settings
            </ToastAction>
          ),
        });
        return;
      }
      
      // Safe service mapping - some services may not need OAuth
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
      
      // Get the corresponding OAuth service name with a fallback
      const service = serviceMap[appId] || appId;
      
      // For direct connection or simulated login
      const useSimulatedLogin = () => {
        console.log(`Using simulated login for ${service}`);
        // Use the original appId for the simulated login to ensure correct routing
        window.location.href = `/api/simulated-login?service=${service}`;
      };
      
      // Try to get the OAuth URL from the server
      try {
        const authResponse = await fetch(`/api/app-connections/${appId}/auth`);
        const authData = await authResponse.json();
        
        if (!authResponse.ok) {
          if (authResponse.status === 400 && authData.requiredSecrets) {
            // Missing OAuth credentials
            setConnectingApp(null);
            
            toast({
              title: "OAuth Credentials Required",
              description: `To connect to ${appId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}, you need to provide OAuth credentials: ${authData.requiredSecrets.join(', ')}`,
              variant: "destructive",
              action: (
                <ToastAction altText="Go to Settings" onClick={() => navigate('/settings')}>
                  Go to Settings
                </ToastAction>
              ),
            });
            return;
          } else {
            throw new Error(`Failed to get authorization URL: ${authResponse.status} - ${authData.error || 'Unknown error'}`);
          }
        }
        
        if (authData && authData.oauthUrl) {
          console.log(`Starting OAuth flow for ${appId} with URL: ${authData.oauthUrl}`);
          // Open in a popup window for better UX
          const width = 600;
          const height = 700;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          
          const popup = window.open(
            authData.oauthUrl, 
            `${appId}_oauth`,
            `width=${width},height=${height},left=${left},top=${top}`
          );
          
          // If popup was blocked, redirect in the same window
          if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            console.log("Popup blocked, redirecting in same window");
            window.location.href = authData.oauthUrl;
          }
        } else {
          // No OAuth URL returned
          throw new Error("No OAuth URL returned from server");
        }
      } catch (error) {
        console.error("Error starting OAuth flow:", error);
        setConnectingApp(null);
        
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to start OAuth flow",
          variant: "destructive",
        });
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
    <div className="container mx-auto py-6 pl-6 md:pl-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">App Connections</h1>
        <p className="text-muted-foreground mt-2">
          Connect your accounts to various services to enable automations and workflows.
        </p>
      </div>

      <Tabs defaultValue="social" value={activeCategory} onValueChange={(value) => setActiveCategory(value as AppCategory)}>
        <TabsList className="mb-6 mt-2">
          {Object.entries(APP_CATEGORIES).map(([key, category]) => (
            <TabsTrigger key={key} value={key} className="px-4 py-2">
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
                  <Card key={appId} className="overflow-hidden border-2 hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center gap-4 pb-3">
                      <div className="p-1 bg-primary/5 rounded-full">
                        <AppIconMap appId={appId} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <CardDescription>{app.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center py-2 border-t pt-3">
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
                    <CardFooter className="pt-2">
                      {isConnected(appId) ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(appId)}
                          className="w-full"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        // For LinkedIn, just use standard OAuth connection
                        appId === 'linkedin' ? (
                          <Button
                            variant="default"
                            onClick={() => handleConnect(appId)}
                            className="w-full"
                            disabled={connectingApp === appId}
                          >
                            {connectingApp === appId ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>Connect <ChevronRight className="ml-2 h-4 w-4" /></>
                            )}
                          </Button>
                        ) : (
                          // For other services, use standard OAuth approach
                          <Button
                            variant="default"
                            onClick={() => handleConnect(appId)}
                            className="w-full"
                            disabled={connectingApp === appId}
                          >
                            {connectingApp === appId ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>Connect <ChevronRight className="ml-2 h-4 w-4" /></>
                            )}
                          </Button>
                        )
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
import { useState } from "react";
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
  const { data: connections, isLoading } = useQuery<any[], unknown, Record<string, ConnectionStatus>>({
    queryKey: ['/api/app-connections'],
    onSettled: (data, error) => {
      if (error) {
        console.error("Error fetching connections:", error);
        toast({
          title: "Error fetching connections",
          description: "Could not load your app connections",
          variant: "destructive",
        });
      }
    },
    select: (data) => {
      // Convert to a more usable format with appId as key
      const formatted: Record<string, ConnectionStatus> = {};
      // If data is available, process it
      if (Array.isArray(data)) {
        data.forEach((connection: any) => {
          formatted[connection.appId] = {
            connected: true,
            username: connection.username || 'Connected account',
            lastConnected: new Date(connection.createdAt).toLocaleDateString(),
            permissions: connection.permissions || []
          };
        });
      }
      return formatted;
    },
    // Default to an empty array if no data exists yet
    initialData: []
  });

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

  const handleConnect = (appId: string) => {
    setConnectingApp(appId);
    connectMutation.mutate(appId);
  };

  const handleDisconnect = (appId: string) => {
    disconnectMutation.mutate(appId);
  };

  const isConnected = (appId: string): boolean => {
    return !!connections?.[appId]?.connected;
  };

  const renderConnectionStatus = (appId: string) => {
    if (connectingApp === appId) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isConnected(appId)) {
      return (
        <div className="flex items-center">
          <Check className="h-4 w-4 text-green-500 mr-2" />
          <span className="text-sm">{connections?.[appId]?.username || 'Connected'}</span>
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
                              {connections?.[appId]?.permissions?.length} permissions
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
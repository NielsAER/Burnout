import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, History, Bot, AlertCircle } from "lucide-react";
import { Automation } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomerDashboard() {
  const { toast } = useToast();
  
  const {
    data: automations,
    isLoading,
    error,
  } = useQuery<Automation[]>({
    queryKey: ["/api/automations"],
  });

  const {
    data: executionHistory,
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ["/api/execution-history"],
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load automations",
      variant: "destructive",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Customer Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your automation dashboard. View your active automations and recent execution history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Automations</CardTitle>
            <CardDescription>Your currently running automations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="text-2xl font-bold">
                {automations?.filter(a => a.active).length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Recent workflow runs</CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="text-2xl font-bold">
                {executionHistory?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>AI Tools</CardTitle>
            <CardDescription>Intelligent tools at your disposal</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/customer/ai-services">
                <Bot className="mr-2 h-4 w-4" />
                Access AI Services
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="automations">
        <TabsList>
          <TabsTrigger value="automations">Your Automations</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="automations" className="space-y-4">
          <h2 className="text-xl font-semibold mt-2">Your Automations</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : automations && automations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {automations.map((automation) => (
                <Card key={automation.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">{automation.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Status: {automation.active ? 
                            <span className="text-green-600 dark:text-green-400">Active</span> : 
                            <span className="text-gray-500">Inactive</span>}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/customer/automations/${automation.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No automations found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don't have any automations set up yet.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="recent">
          <h2 className="text-xl font-semibold mt-2">Recent Activity</h2>
          
          {isHistoryLoading ? (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : executionHistory && executionHistory.length > 0 ? (
            <div className="mt-4 space-y-4">
              <Button variant="outline" size="sm" className="mb-4" asChild>
                <Link to="/customer/history">
                  <History className="mr-2 h-4 w-4" />
                  View Full History
                </Link>
              </Button>
              
              {executionHistory.slice(0, 5).map((history: any) => (
                <Card key={history.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-md font-medium">{history.automationName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(history.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        history.status === "success" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}>
                        {history.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center mt-4">
              <History className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No recent activity</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There is no recent execution history to display.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
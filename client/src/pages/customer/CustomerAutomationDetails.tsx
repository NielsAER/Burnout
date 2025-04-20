import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, AlertCircle, Clock, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { WorkflowHealthCard } from "@/components/workflow-health/WorkflowHealthCard";
import { Automation, ExecutionHistory } from "@shared/schema";

export default function CustomerAutomationDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const automationId = parseInt(id || "0");
  
  const {
    data: automation,
    isLoading,
    error,
  } = useQuery<Automation>({
    queryKey: [`/api/automations/${automationId}`],
    enabled: !!automationId,
  });
  
  const {
    data: executionHistory,
    isLoading: isHistoryLoading,
  } = useQuery<ExecutionHistory[]>({
    queryKey: [`/api/execution-history/automation/${automationId}`],
    enabled: !!automationId,
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load automation details",
      variant: "destructive",
    });
  }

  const successfulExecutions = executionHistory?.filter(
    (history) => history.status === "success"
  ).length || 0;
  
  const failedExecutions = executionHistory?.filter(
    (history) => history.status === "failed"
  ).length || 0;
  
  const totalExecutions = (executionHistory?.length || 0);
  const successRate = totalExecutions > 0 
    ? Math.round((successfulExecutions / totalExecutions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/customer/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            automation?.name || "Automation Not Found"
          )}
        </h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Overview</CardTitle>
              <CardDescription>General information about this automation</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : automation ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <div>
                        {automation.active ? (
                          <Badge variant="default" className="mt-1 bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{new Date(automation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Run</h3>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>
                          {automation.lastRunAt
                            ? new Date(automation.lastRunAt).toLocaleString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Trigger</h3>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-base font-medium">{automation.triggerAppId}</span>
                          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                          <span className="text-base font-medium">{automation.actionAppId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Automation not found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The requested automation does not exist or you don't have permission to view it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Execution Statistics</CardTitle>
              <CardDescription>Performance metrics for this automation</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || isHistoryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (executionHistory && executionHistory.length > 0) ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="flex flex-col text-center">
                      <span className="text-3xl font-bold">{totalExecutions}</span>
                      <span className="text-sm text-muted-foreground">Total Runs</span>
                    </div>
                    <div className="flex flex-col text-center">
                      <span className="text-3xl font-bold text-green-600 dark:text-green-400">{successfulExecutions}</span>
                      <span className="text-sm text-muted-foreground">Successful</span>
                    </div>
                    <div className="flex flex-col text-center">
                      <span className="text-3xl font-bold text-red-600 dark:text-red-400">{failedExecutions}</span>
                      <span className="text-sm text-muted-foreground">Failed</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm font-medium">{successRate}%</span>
                    </div>
                    <Progress value={successRate} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <History className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No execution data</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This automation hasn't been run yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-1/3 space-y-6">
          {automationId && <WorkflowHealthCard automationId={automationId} />}
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Latest runs of this automation</CardDescription>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : executionHistory && executionHistory.length > 0 ? (
                <div className="space-y-3">
                  {executionHistory.slice(0, 5).map((history) => (
                    <div 
                      key={history.id} 
                      className="flex items-center justify-between p-2 text-sm border rounded-md"
                    >
                      <div className="flex items-center">
                        <div 
                          className={`w-2 h-2 rounded-full mr-2 ${
                            history.status === "success" ? "bg-green-500" : "bg-red-500"
                          }`} 
                        />
                        <span>{new Date(history.timestamp).toLocaleString()}</span>
                      </div>
                      <Badge 
                        variant={history.status === "success" ? "default" : "destructive"}
                      >
                        {history.status}
                      </Badge>
                    </div>
                  ))}
                  
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/customer/history">
                      <History className="mr-2 h-4 w-4" />
                      View Full History
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No execution history yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, RefreshCw, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWorkflowHealth } from "@/hooks/use-workflow-health";
import { Achievement } from "@shared/schema";
import { AchievementsPanel } from "@/components/achievements/AchievementsPanel";

interface WorkflowHealthCardProps {
  automationId: number;
  className?: string;
}

export function WorkflowHealthCard({ automationId, className }: WorkflowHealthCardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("health");

  // Fetch workflow health data
  const {
    score,
    complexity,
    status,
    statusColor,
    recommendation,
    reliability,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useWorkflowHealth(automationId);

  // Fetch unlocked achievements
  const {
    data: unlockedAchievements,
    isLoading: achievementsLoading,
    refetch: refetchAchievements,
  } = useQuery<Achievement[]>({
    queryKey: [`/api/automations/${automationId}/achievements/unlocked`],
    enabled: !!automationId,
  });

  // Function to refresh health score and recalculate
  const handleRefreshHealth = async () => {
    try {
      await apiRequest("POST", `/api/automations/${automationId}/refresh-health`);
      refetchHealth();
      toast({
        title: "Health score refreshed",
        description: "The workflow health score has been recalculated.",
      });
    } catch (error) {
      toast({
        title: "Failed to refresh health score",
        description: "An error occurred while refreshing the workflow health score.",
        variant: "destructive",
      });
    }
  };

  // Calculate color class based on health score
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  // Get progress color class for score visualization
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-blue-600";
    if (score >= 40) return "bg-yellow-600"; 
    return "bg-red-600";
  };

  // Calculate complexity level label
  const getComplexityLabel = (complexity: number) => {
    if (complexity >= 8) return "Advanced";
    if (complexity >= 5) return "Intermediate";
    if (complexity >= 3) return "Basic";
    return "Simple";
  };

  // Calculate success rate percentage
  const successRate = reliability?.successRate 
    ? Math.round(reliability.successRate * 100) 
    : 0;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Workflow Performance
        </CardTitle>
        <CardDescription>
          Health metrics and achievements for this automation
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="health" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="health">Health Score</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="health" className="m-0 p-0">
          <CardContent className="pt-4">
            {healthLoading ? (
              <div className="flex flex-col gap-4 items-center justify-center py-8">
                <div className="animate-pulse w-24 h-24 rounded-full border-8 border-gray-200"></div>
                <p className="text-muted-foreground">Loading health data...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Health Score Display */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center mb-4">
                    <div className="w-32 h-32 rounded-full flex items-center justify-center border-8 border-gray-200">
                      <div className={`text-4xl font-bold ${getHealthScoreColor(score)}`}>
                        {score}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 bg-white dark:bg-gray-700 px-3 py-1 rounded-full border dark:border-gray-500 shadow-sm text-sm font-medium dark:text-white">
                      {status}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-2">Workflow Complexity</h3>
                  <div className="w-full mt-1 mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{getComplexityLabel(complexity)}</span>
                      <span className="font-medium">{complexity}/10</span>
                    </div>
                    <Progress value={complexity * 10} className="h-2" />
                  </div>
                  
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshHealth}
                    className="mt-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Health
                  </Button>
                </div>
                
                {/* Health Details */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Reliability</h3>
                    <div className="flex items-center mb-1">
                      <div className="w-full">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Success Rate</span>
                          <span className="font-medium">{successRate}%</span>
                        </div>
                        <Progress value={successRate} className={`h-2 ${getProgressColor(successRate)}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                        <div className="text-sm text-gray-500 dark:text-gray-300">Total Runs</div>
                        <div className="font-medium dark:text-white">{reliability?.totalRuns || 0}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                        <div className="text-sm text-gray-500 dark:text-gray-300">Errors</div>
                        <div className="font-medium dark:text-white">{reliability?.errorCount || 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Recommendation</h3>
                    <div className="bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/20 dark:to-transparent p-3 rounded-lg border dark:border-primary/30">
                      <p className="text-sm dark:text-white">{recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="achievements" className="m-0 p-0">
          <CardContent className="pt-4">
            <AchievementsPanel automationId={automationId} />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
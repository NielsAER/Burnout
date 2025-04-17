import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useWorkflowHealth } from "@/hooks/use-workflow-health";
import { AchievementsPanel } from "@/components/achievements/AchievementsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Award, BarChart, BrainCircuit, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WorkflowHealthCardProps {
  automationId: number;
  className?: string;
}

export function WorkflowHealthCard({ automationId, className }: WorkflowHealthCardProps) {
  const [activeTab, setActiveTab] = useState('health');
  const { score, complexity, status, statusColor, recommendation, reliability } = useWorkflowHealth(automationId);

  const progressColor = score < 40 
    ? "bg-red-500" 
    : score < 70 
      ? "bg-yellow-500" 
      : score < 90 
        ? "bg-blue-500" 
        : "bg-green-500";
  
  const complexityLabel = complexity <= 1 
    ? "Basic" 
    : complexity <= 3 
      ? "Standard" 
      : complexity <= 5 
        ? "Advanced" 
        : complexity <= 8 
          ? "Complex" 
          : "Expert";
  
  const complexityColor = complexity <= 1 
    ? "bg-slate-100 text-slate-800" 
    : complexity <= 3 
      ? "bg-blue-100 text-blue-800" 
      : complexity <= 5 
        ? "bg-purple-100 text-purple-800" 
        : complexity <= 8 
          ? "bg-amber-100 text-amber-800" 
          : "bg-fuchsia-100 text-fuchsia-800";

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Workflow Analytics</CardTitle>
            <CardDescription>Health metrics and achievements</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "font-normal", 
              complexityColor
            )}
          >
            <BrainCircuit className="mr-1 h-3 w-3" />
            {complexityLabel} · Level {complexity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="health" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="health" className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              <span>Health Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center">
              <Award className="mr-2 h-4 w-4" />
              <span>Achievements</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="health" className="mt-0">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Health Score</span>
                  <span className="text-sm font-medium">{score}%</span>
                </div>
                <Progress value={score} className={cn("h-2", progressColor)} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-medium">{reliability.successRate}%</span>
                </div>
                <Progress 
                  value={reliability.successRate} 
                  className={cn(
                    "h-2", 
                    reliability.successRate < 90 ? "bg-yellow-500" : "bg-green-500"
                  )} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col border rounded-md p-3">
                  <span className="text-sm text-muted-foreground">Error count</span>
                  <span className="text-2xl font-bold">{reliability.errorCount}</span>
                </div>
                <div className="flex flex-col border rounded-md p-3">
                  <span className="text-sm text-muted-foreground">Total runs</span>
                  <span className="text-2xl font-bold">{reliability.totalRuns}</span>
                </div>
              </div>
              
              <Alert variant="default" className="bg-slate-50 dark:bg-slate-950">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-medium">{status}</AlertTitle>
                <AlertDescription>
                  {recommendation}
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-0">
            <AchievementsPanel automationId={automationId} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setActiveTab('health')}>
          <BarChart className="mr-2 h-4 w-4" />
          <span>View Health</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('achievements')}>
          <Award className="mr-2 h-4 w-4" />
          <span>View Achievements</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
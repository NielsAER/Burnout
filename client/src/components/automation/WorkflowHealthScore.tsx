import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle, Lightbulb, ArrowRightCircle, Award } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface Reliability {
  successRate: number;
  errorCount: number;
  totalRuns: number;
}

interface WorkflowHealthProps {
  score: number;
  reliability: Reliability;
  complexity: number;
  improvementSuggestions: Suggestion[];
  automationId: number;
  onRefresh?: () => void;
}

export function WorkflowHealthScore({ 
  score, 
  reliability, 
  complexity, 
  improvementSuggestions,
  automationId,
  onRefresh 
}: WorkflowHealthProps) {
  const { toast } = useToast();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  // Function to unlock an achievement
  const unlockAchievement = async (achievementId: number) => {
    setIsUnlocking(true);
    try {
      await apiRequest(
        'POST', 
        `/api/automations/${automationId}/unlock-achievement`,
        { achievementId }
      );
      
      toast({
        title: "Achievement unlocked!",
        description: "Congratulations! New achievement unlocked.",
      });
      
      // Refresh achievements data
      queryClient.invalidateQueries({ queryKey: [`/api/automations/${automationId}/achievements`] });
    } catch (error) {
      toast({
        title: "Failed to unlock achievement",
        description: "There was an error unlocking the achievement.",
        variant: "destructive",
      });
    } finally {
      setIsUnlocking(false);
    }
  };
  
  // Determine health status color
  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };
  
  // Get progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <ArrowRightCircle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get priority class
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-amber-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-300';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Workflow Health</CardTitle>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="text-xs"
            >
              Refresh
            </Button>
          )}
        </div>
        <CardDescription>Ensuring your workflow is reliable and efficient</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Health Score */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Health Score</h3>
            <span className={`text-2xl font-bold ${getHealthColor(score)}`}>{score}%</span>
          </div>
          <Progress value={score} className={`h-2 ${getProgressColor(score)}`} />
          
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-xs uppercase text-muted-foreground">Reliability</h4>
              <p className="text-lg font-bold">{reliability.successRate}%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-xs uppercase text-muted-foreground">Complexity</h4>
              <p className="text-lg font-bold">{complexity}</p>
              <p className="text-xs text-muted-foreground">Factor</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-xs uppercase text-muted-foreground">Runs</h4>
              <p className="text-lg font-bold">{reliability.totalRuns}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          
          {/* Improvement Suggestions */}
          {improvementSuggestions.length > 0 && (
            <Accordion type="single" collapsible className="w-full" defaultValue={showSuggestions ? "suggestions" : undefined}>
              <AccordionItem value="suggestions">
                <AccordionTrigger className="text-sm">
                  Improvement Suggestions
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {improvementSuggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border-l-2 bg-muted/50 rounded-r-md ${getPriorityClass(suggestion.priority)}`}
                      >
                        <div className="flex gap-2 items-start">
                          {getPriorityIcon(suggestion.priority)}
                          <div>
                            <p className="text-sm">{suggestion.message}</p>
                            <p className="text-xs text-muted-foreground capitalize">{suggestion.category}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center px-6 pt-0 pb-4">
        <div className="grid grid-cols-2 gap-4 w-full">
          {reliability.successRate >= 95 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => unlockAchievement(2)}
              disabled={isUnlocking}
            >
              <Award className="h-4 w-4" />
              <span>100% Uptime</span>
            </Button>
          )}
          
          {complexity >= 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => unlockAchievement(3)}
              disabled={isUnlocking}
            >
              <Award className="h-4 w-4" />
              <span>Workflow Architect</span>
            </Button>
          )}
          
          {reliability.totalRuns > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2" 
              onClick={() => unlockAchievement(1)}
              disabled={isUnlocking}
            >
              <Award className="h-4 w-4" />
              <span>Workflow Pioneer</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
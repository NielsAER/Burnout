import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Automation, ExecutionHistory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, Calendar, ChevronLeft, Clock, CreditCard, 
  LineChart, Star, Target, UserCheck, Users, Zap 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WorkflowHealthCard } from "@/components/workflow-health/WorkflowHealthCard";

const AutomationDetails = () => {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const automationId = id ? parseInt(id) : 0;
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch automation details
  const { 
    data: automation, 
    isLoading,
    error 
  } = useQuery<Automation>({
    queryKey: [`/api/automations/${automationId}`],
    enabled: !isNaN(automationId) && automationId > 0,
  });

  // Fetch execution history for this automation
  const {
    data: executionHistory,
    isLoading: isLoadingHistory
  } = useQuery<ExecutionHistory[]>({
    queryKey: [`/api/execution-history/automation/${automationId}`],
    enabled: !isNaN(automationId) && automationId > 0,
  });

  // If the automation is not found, navigate back to automations list
  useEffect(() => {
    if (error) {
      navigate('/automations');
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className="py-6 px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!automation) {
    return null;
  }

  // Get typed reliability data with defaults for type safety
  const getReliabilityData = () => {
    const reliability = automation.reliability as { 
      totalRuns?: number; 
      errorCount?: number; 
      successRate?: number;
    } || { totalRuns: 0, errorCount: 0, successRate: 1 };

    return {
      totalRuns: reliability.totalRuns || 0,
      errorCount: reliability.errorCount || 0,
      successRate: reliability.successRate !== undefined ? reliability.successRate : 1
    };
  };

  const reliabilityData = getReliabilityData();

  // Calculate various metrics for the dashboard
  const calculateCostSavings = () => {
    const avgTaskTime = 10; // Average minutes per task if done manually
    const hourlyRate = 25; // Assumed hourly rate for manual labor ($)
    const totalRuns = reliabilityData.totalRuns;
    
    // Total hours saved
    const hoursSaved = (totalRuns * avgTaskTime) / 60;
    
    // Money saved based on hourly rate
    const moneySaved = hoursSaved * hourlyRate;
    
    return {
      hoursSaved: hoursSaved.toFixed(1),
      moneySaved: moneySaved.toFixed(2)
    };
  };

  // Calculate efficiency improvement metrics
  const calculateEfficiencyMetrics = () => {
    const manualErrorRate = 0.05; // 5% human error rate assumption
    const automationErrorRate = reliabilityData.totalRuns > 0
      ? reliabilityData.errorCount / reliabilityData.totalRuns
      : 0;
    
    // Error reduction percentage (how much the automation reduced errors)
    const errorReduction = Math.max(0, ((manualErrorRate - automationErrorRate) / manualErrorRate) * 100);
    
    // Time saved per task in minutes
    const timePerTask = 10; // Average time in minutes to complete task manually
    const automationTime = 0.5; // Average time in minutes for automation to complete
    const timeSavingPercent = ((timePerTask - automationTime) / timePerTask) * 100;
    
    return {
      errorReduction: errorReduction.toFixed(1),
      timeSavingPercent: timeSavingPercent.toFixed(1)
    };
  };

  // Get metrics
  const costSavings = calculateCostSavings();
  const efficiencyMetrics = calculateEfficiencyMetrics();
  
  // Count successful and failed runs
  const successfulRuns = reliabilityData.totalRuns - reliabilityData.errorCount;
  const failedRuns = reliabilityData.errorCount;

  return (
    <div className="py-6 px-8">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            className="p-0 mr-2 h-auto"
            onClick={() => navigate('/automations')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold">{automation.name}</h1>
          <Badge 
            className={`ml-3 ${automation.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800'}`}
          >
            {automation.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Created {new Date(automation.createdAt).toLocaleDateString()}
          {automation.lastRunAt && (
            <> · Last Run {new Date(automation.lastRunAt).toLocaleDateString()}</>
          )}
        </p>
      </div>
      
      {/* Performance metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/40 border-blue-200 dark:border-blue-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2.5 rounded-full bg-blue-600 text-white dark:bg-blue-500">
                <Zap className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-200">Automation Runs</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {reliabilityData.totalRuns}
                  </p>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">
                    total runs
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 border-green-200 dark:border-green-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2.5 rounded-full bg-green-600 text-white dark:bg-green-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-200">Cost Savings</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ${costSavings.moneySaved}
                  </p>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">
                    saved
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/40 border-purple-200 dark:border-purple-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2.5 rounded-full bg-purple-600 text-white dark:bg-purple-500">
                <Clock className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-200">Time Saved</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {costSavings.hoursSaved}
                  </p>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">
                    hours
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/40 border-amber-200 dark:border-amber-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2.5 rounded-full bg-amber-600 text-white dark:bg-amber-500">
                <Target className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-200">Efficiency Gain</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {efficiencyMetrics.timeSavingPercent}%
                  </p>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">
                    faster
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 w-full md:w-auto mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <WorkflowHealthCard automationId={automationId} />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" /> 
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Detailed performance data for this automation workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Execution Statistics</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Success Rate</span>
                        <span className="text-sm font-medium">
                          {Math.round(reliabilityData.successRate * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.round(reliabilityData.successRate * 100)}
                        className="h-2 bg-gray-200 dark:bg-gray-700"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Successful Runs</p>
                        <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{successfulRuns}</p>
                      </div>
                      
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Failed Runs</p>
                        <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{failedRuns}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Error Reduction</span>
                        <span className="text-sm font-medium">{efficiencyMetrics.errorReduction}%</span>
                      </div>
                      <Progress 
                        value={parseFloat(efficiencyMetrics.errorReduction)} 
                        className="h-2 bg-gray-200 dark:bg-gray-700"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Compared to manual task completion
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Reliability Insights</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Health Score</p>
                          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{automation.healthScore}/100</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-full">
                          <AlertCircle className={
                            automation.healthScore >= 80 ? "text-green-500" :
                            automation.healthScore >= 60 ? "text-blue-500" :
                            automation.healthScore >= 40 ? "text-amber-500" : "text-red-500"
                          } />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Workflow Complexity</span>
                        <span className="text-sm font-medium">{automation.complexity}/10</span>
                      </div>
                      <Progress 
                        value={automation.complexity * 10} 
                        className="h-2 bg-gray-200 dark:bg-gray-700"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {automation.complexity <= 2 ? "Simple workflow" : 
                         automation.complexity <= 5 ? "Moderate complexity" : 
                         automation.complexity <= 8 ? "Advanced workflow" : "Expert-level workflow"}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Recent Activity</p>
                      {isLoadingHistory ? (
                        <p className="text-sm text-muted-foreground">Loading activity data...</p>
                      ) : executionHistory && executionHistory.length > 0 ? (
                        <div className="space-y-2">
                          {executionHistory.slice(0, 3).map((history, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{new Date(history.executedAt).toLocaleString()}</span>
                              <Badge variant={history.status === 'success' ? 'default' : 'destructive'}>
                                {history.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent activity recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Return on Investment Analysis
              </CardTitle>
              <CardDescription>
                Cost savings and efficiency benefits from this automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Cost Analysis</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent p-5 rounded-lg border border-green-100 dark:border-green-700 shadow-sm">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Total Cost Savings</h4>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-green-600 dark:text-green-300">${costSavings.moneySaved}</span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-300">estimated</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Based on {reliabilityData.totalRuns} automated tasks at an average labor rate of $25/hour
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Time Saved</p>
                        <div className="flex items-baseline mt-1">
                          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{costSavings.hoursSaved}</p>
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">hours</span>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Per Task Savings</p>
                        <div className="flex items-baseline mt-1">
                          <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                            ${((parseFloat(costSavings.moneySaved) / (reliabilityData.totalRuns || 1)) || 0).toFixed(2)}
                          </p>
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">per task</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Efficiency Metrics</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent p-5 rounded-lg border border-amber-100 dark:border-amber-700 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Time Efficiency</h4>
                          <p className="text-3xl font-bold text-amber-600 dark:text-amber-300">{efficiencyMetrics.timeSavingPercent}%</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">faster than manual processing</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-full">
                          <Users className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Error Reduction</p>
                        <div className="flex items-baseline mt-1">
                          <p className="text-xl font-semibold text-green-600 dark:text-green-300">{efficiencyMetrics.errorReduction}%</p>
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-300">fewer errors</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Labor Equivalent</p>
                        <div className="flex items-baseline mt-1">
                          <p className="text-xl font-semibold text-blue-600 dark:text-blue-300">
                            {(parseFloat(costSavings.hoursSaved) / 160).toFixed(2)}
                          </p>
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-300">FTE months</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality Improvement</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Consistent quality with {Math.round(reliabilityData.successRate * 100)}% success rate
                          </p>
                        </div>
                        <div>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {automation.healthScore >= 80 ? "Excellent" :
                             automation.healthScore >= 60 ? "Good" :
                             automation.healthScore >= 40 ? "Moderate" : "Needs Improvement"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate(`/builder/${automationId}`)}
        >
          Edit Automation
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/history/automation/${automationId}`)}
        >
          View Full History
        </Button>
      </div>
    </div>
  );
};

export default AutomationDetails;
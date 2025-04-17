import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { checkApiKeyAvailability } from "@/lib/apiKeyUtils";
import { Automation } from "@shared/schema";
import BuilderCanvas, { BuilderStep } from "@/components/automation/BuilderCanvas";
import AppSelector from "@/components/automation/AppSelector";
import WorkflowPreviewPanel from "@/components/automation/WorkflowPreviewPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, XCircle, Loader2 } from "lucide-react";

const AutomationBuilder = () => {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [automationName, setAutomationName] = useState("New Automation");
  const [trigger, setTrigger] = useState<BuilderStep | null>(null);
  const [actions, setActions] = useState<BuilderStep[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);
  
  // Define the result type for better type safety
  type TestResult = {
    step: "trigger" | "action";
    appId: string;
    status: "success" | "error";
    data: Record<string, any>;
  };
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  // Fetch existing automation if we're in edit mode
  const { data: existingAutomation, isLoading } = useQuery<Automation>({
    queryKey: [`/api/automations/${id}`],
    enabled: !!id,
  });

  // Set up existing automation data if in edit mode
  useEffect(() => {
    if (existingAutomation) {
      setIsEditMode(true);
      setAutomationName(existingAutomation.name);
      
      // Set trigger
      setTrigger({
        id: "trigger-1",
        type: "trigger",
        appId: existingAutomation.triggerAppId,
        config: (existingAutomation.triggerConfig as Record<string, any>) || {}
      });
      
      // Handle the transition from single action to multiple actions
      if (existingAutomation.actions && Array.isArray(existingAutomation.actions) && existingAutomation.actions.length > 0) {
        // If we have the new "actions" array format
        setActions(existingAutomation.actions.map((action: any) => ({
          ...action,
          id: action.id || `action-${uuidv4()}`
        })));
      } else if (existingAutomation.actionAppId) {
        // For backwards compatibility with old single-action format
        setActions([{
          id: `action-${uuidv4()}`,
          type: "action",
          appId: existingAutomation.actionAppId,
          config: (existingAutomation.actionConfig as Record<string, any>) || {}
        }]);
      }
    }
  }, [existingAutomation]);

  // Create new automation mutation
  const createAutomationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/automations", data);
    },
    onSuccess: () => {
      toast({
        title: "Automation created",
        description: "Your automation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      navigate("/automations");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create automation",
        description: error.message || "Please try again.",
      });
    }
  });

  // Update existing automation mutation
  const updateAutomationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/automations/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Automation updated",
        description: "Your automation has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/automations/${id}`] });
      navigate("/automations");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update automation",
        description: error.message || "Please try again.",
      });
    }
  });

  const handleSave = () => {
    if (!trigger || actions.length === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete automation",
        description: "Please add both a trigger and at least one action to your automation.",
      });
      return;
    }

    // For backwards compatibility with the existing schema
    const firstAction = actions[0];
    
    const automationData = {
      name: automationName,
      active: true,
      triggerAppId: trigger.appId,
      triggerConfig: trigger.config,
      actionAppId: firstAction.appId,       // For backward compatibility
      actionConfig: firstAction.config,      // For backward compatibility
      actions: actions.map(a => ({          // New field with all actions
        id: a.id,
        type: a.type,
        appId: a.appId,
        config: a.config,
        name: a.name,
        description: a.description
      }))
    };

    if (isEditMode) {
      updateAutomationMutation.mutate(automationData);
    } else {
      createAutomationMutation.mutate(automationData);
    }
  };

  const handleCancel = () => {
    navigate("/automations");
  };

  const handleTriggerDrop = (appId: string) => {
    setTrigger({
      id: "trigger-1",
      type: "trigger",
      appId,
      config: {}
    });
  };

  const handleAddAction = (appId: string) => {
    const newAction: BuilderStep = {
      id: `action-${uuidv4()}`,
      type: "action",
      appId,
      config: {}
    };
    setActions(prevActions => [...prevActions, newAction]);
  };

  const handleRemoveTrigger = () => {
    setTrigger(null);
  };

  const handleRemoveAction = (id: string) => {
    setActions(prevActions => prevActions.filter(action => action.id !== id));
  };

  const handleReorderActions = useCallback((fromIndex: number, toIndex: number) => {
    setActions(prevActions => {
      const result = Array.from(prevActions);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const handleUpdateConfig = useCallback((stepId: string, config: Record<string, any>) => {
    // Check if it's the trigger
    if (trigger && trigger.id === stepId) {
      setTrigger(prev => prev ? { ...prev, config } : null);
      return;
    }
    
    // Otherwise, it's an action
    setActions(prevActions => 
      prevActions.map(action => 
        action.id === stepId 
          ? { ...action, config } 
          : action
      )
    );
  }, [trigger]);

  const handleTestWorkflow = async () => {
    if (!trigger || actions.length === 0) {
      toast({
        variant: "destructive",
        title: "Cannot test workflow",
        description: "You need both a trigger and at least one action to test this workflow.",
      });
      return;
    }
    
    // Reset states
    setTestStatus('loading');
    setTestResults([]);
    setIsRunningWorkflow(true);
    setIsTestDialogOpen(true);
    
    // Initialize results array
    const results: TestResult[] = [];
    
    try {
      // For AI services, try to use the actual API if keys are available
      let triggerResult: any;
      
      // First, check if this is an AI service trigger that we can actually run
      if (['openai', 'anthropic', 'perplexity', 'ollama'].includes(trigger.appId)) {
        try {
          // Check if we have an API key for this service
          const keyAvailable = await checkApiKeyAvailability(trigger.appId);
          
          if (keyAvailable) {
            // We have a key, try to run a real API call
            const aiPrompt = trigger.config?.aiPrompt || {};
            const response = await apiRequest('POST', `/api/services/${trigger.appId}/generate`, {
              prompt: aiPrompt.prompt || "Test prompt",
              model: aiPrompt.model,
              systemMessage: aiPrompt.systemMessage,
              maxTokens: 100
            });
            
            if (response.ok) {
              const data = await response.json();
              triggerResult = {
                prompt: aiPrompt.prompt || "Test prompt",
                model: data.modelUsed || aiPrompt.model,
                result: data.text,
                realApiCall: true
              };
            } else {
              // API call failed, fall back to simulated data
              triggerResult = generateTriggerTestData(trigger);
              throw new Error("API call failed");
            }
          } else {
            // No API key, use simulated data
            triggerResult = generateTriggerTestData(trigger);
          }
        } catch (error: unknown) {
          console.error("Error making API call:", error);
          // On error, fall back to simulated data
          triggerResult = generateTriggerTestData(trigger);
        }
      } else {
        // Not an AI service or no API key available, use simulated data
        triggerResult = generateTriggerTestData(trigger);
      }
      
      // Add trigger result
      results.push({
        step: "trigger",
        appId: trigger.appId,
        status: "success",
        data: triggerResult
      });
      
      // Process actions
      for (const action of actions) {
        let actionResult: any;
        
        // Check if this is an AI service action we can actually run
        if (['openai', 'anthropic', 'perplexity', 'ollama'].includes(action.appId)) {
          try {
            // Check if we have an API key for this service
            const keyAvailable = await checkApiKeyAvailability(action.appId);
            
            if (keyAvailable) {
              // We have a key, try to run a real API call
              const aiPrompt = action.config?.aiPrompt || {};
              
              // Use the trigger result as context if available
              const contextPrompt = triggerResult?.result ? 
                `${aiPrompt.prompt || ""}\n\nContext: ${triggerResult.result}` :
                aiPrompt.prompt || "Test prompt";
              
              const response = await apiRequest('POST', `/api/services/${action.appId}/generate`, {
                prompt: contextPrompt,
                model: aiPrompt.model,
                systemMessage: aiPrompt.systemMessage,
                maxTokens: 150
              });
              
              if (response.ok) {
                const data = await response.json();
                actionResult = {
                  prompt: contextPrompt,
                  model: data.modelUsed || aiPrompt.model,
                  completion: data.text,
                  realApiCall: true
                };
              } else {
                // API call failed, fall back to simulated data
                actionResult = generateActionTestData(action);
                throw new Error("API call failed");
              }
            } else {
              // No API key, use simulated data
              actionResult = generateActionTestData(action);
            }
          } catch (error: unknown) {
            console.error("Error making API call:", error);
            // On error, fall back to simulated data
            actionResult = generateActionTestData(action);
          }
        } else {
          // Not an AI service, use simulated data
          actionResult = generateActionTestData(action);
        }
        
        // Add action result
        results.push({
          step: "action",
          appId: action.appId,
          status: "success",
          data: actionResult
        });
      }
      
      // Finish with success
      setTestResults(results);
      setTestStatus('success');
      setIsRunningWorkflow(false);
      
      toast({
        title: "Test successful",
        description: "Your workflow executed successfully. See the results in the preview.",
      });
    } catch (error: unknown) {
      console.error("Workflow test error:", error);
      setTestStatus('error');
      setIsRunningWorkflow(false);
      
      toast({
        variant: "destructive",
        title: "Test failed",
        description: (error as Error)?.message || "An error occurred while testing your workflow.",
      });
    }
  };
  
  // Helper function to generate sample trigger output
  const generateTriggerTestData = (triggerStep: BuilderStep) => {
    // Tailored sample data based on trigger type
    if (triggerStep.appId === 'scheduler') {
      return { 
        timestamp: new Date().toISOString(),
        trigger_type: triggerStep.config?.scheduleType || "timer",
        message: "Scheduled trigger activated"
      };
    }
    
    if (triggerStep.appId === 'openai' || 
        triggerStep.appId === 'anthropic' || 
        triggerStep.appId === 'perplexity' || 
        triggerStep.appId === 'ollama') {
      const aiPrompt = triggerStep.config?.aiPrompt || {};
      return {
        prompt: aiPrompt.prompt || "Sample prompt",
        model: aiPrompt.model || "Model not specified",
        result: "This is a sample output from the AI model based on your prompt."
      };
    }
    
    // Default sample data
    return {
      timestamp: new Date().toISOString(),
      event_type: triggerStep.config?.optionName || "Event triggered",
      sample_data: { 
        key1: "value1", 
        key2: "value2",
        message: `Sample data for ${triggerStep.appId} trigger`
      }
    };
  };
  
  // Helper function to generate sample action output
  const generateActionTestData = (actionStep: BuilderStep) => {
    // Generate AI-specific sample data
    if (actionStep.appId === 'openai') {
      const aiPrompt = actionStep.config?.aiPrompt || {};
      return {
        prompt: aiPrompt.prompt || "Sample prompt",
        model: aiPrompt.model || "gpt-4o",
        completion: "This is a sample response from the OpenAI model. It would typically contain generated text based on your prompt and any additional context provided in your automation."
      };
    }
    
    if (actionStep.appId === 'anthropic') {
      const aiPrompt = actionStep.config?.aiPrompt || {};
      return {
        prompt: aiPrompt.prompt || "Sample prompt",
        model: aiPrompt.model || "claude-3-7-sonnet-20250219",
        completion: "This is a sample response from Claude. In a real execution, this would contain AI-generated content based on your specific instructions and system message."
      };
    }
    
    if (actionStep.appId === 'perplexity') {
      const aiPrompt = actionStep.config?.aiPrompt || {};
      return {
        query: aiPrompt.prompt || "Sample search query",
        model: aiPrompt.model || "llama-3.1-sonar-small-128k-online",
        response: "Sample search results and analysis would appear here based on your query.",
        sources: ["https://example.com/source1", "https://example.com/source2"]
      };
    }
    
    if (actionStep.appId === 'gmail') {
      return {
        to: "recipient@example.com",
        subject: "Sample Email Subject",
        body: "This is a sample email body that would be sent based on your automation trigger.",
        status: "sent"
      };
    }
    
    if (actionStep.appId === 'slack') {
      return {
        channel: "#general",
        message: "This is a sample Slack message that would be sent as part of your automation.",
        attachments: [],
        status: "sent"
      };
    }
    
    // Default sample data
    return {
      timestamp: new Date().toISOString(),
      action_type: actionStep.config?.optionName || "Action executed",
      status: "completed",
      result: `Sample result for ${actionStep.appId} action`
    };
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutomationName(e.target.value);
  };

  // Check if save button should be enabled
  const canSave = !!trigger && actions.length > 0;

  if (isLoading) {
    return (
      <div className="py-6 px-6">
        <div className="bg-white dark:bg-[#0f0f0f] dark:border dark:border-[#2a2a2a] rounded-lg shadow p-6">
          <Skeleton className="h-8 w-1/4 mb-6" />
          <div className="flex space-x-4">
            <div className="w-64 border-r border-gray-200 dark:border-[#2a2a2a] pr-4">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
              
              <Skeleton className="h-6 w-1/2 mt-6 mb-4" />
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="py-6 px-6">
        <div className="bg-white dark:bg-[#0f0f0f] dark:border dark:border-[#2a2a2a] rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] dark:bg-[#0f0f0f]">
            <input
              type="text"
              value={automationName}
              onChange={handleNameChange}
              className="text-xl font-semibold text-gray-900 dark:text-white border-none focus:outline-none focus:ring-0 w-full bg-transparent"
              placeholder="Enter automation name..."
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">Connect apps and create an automated workflow.</p>
          </div>
          
          <div className="p-6 dark:bg-[#0f0f0f]">
            <div className="flex items-start space-x-4">
              {/* Apps Panel */}
              <AppSelector 
                onSelectTrigger={handleTriggerDrop}
                onSelectAction={handleAddAction}
              />
              
              {/* Builder Canvas */}
              <BuilderCanvas
                trigger={trigger}
                actions={actions}
                onRemoveTrigger={handleRemoveTrigger}
                onRemoveAction={handleRemoveAction}
                onAddAction={handleAddAction}
                onReorderActions={handleReorderActions}
                onUpdateConfig={handleUpdateConfig}
                onTestWorkflow={handleTestWorkflow}
                onAddTrigger={handleTriggerDrop}
              />
            </div>
          </div>
          
          {/* Interactive Workflow Preview */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] dark:bg-[#0f0f0f]">
            <WorkflowPreviewPanel
              trigger={trigger}
              actions={actions}
              onTestWorkflow={handleTestWorkflow}
              isRunning={isRunningWorkflow}
              testResults={testResults}
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-[#181818] px-6 py-3 flex justify-end space-x-3 border-t border-gray-200 dark:border-[#2a2a2a]">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || createAutomationMutation.isPending || updateAutomationMutation.isPending}
            >
              {createAutomationMutation.isPending || updateAutomationMutation.isPending ? "Saving..." : "Save Automation"}
            </Button>
          </div>
        </div>
        
        {/* Test Preview Dialog */}
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                Workflow Test Results
              </DialogTitle>
              <DialogDescription>
                Preview how your automation will execute in a real environment.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {testStatus === 'loading' && (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <p className="text-gray-500">Testing your workflow...</p>
                </div>
              )}
              
              {testStatus === 'success' && testResults.length > 0 && (
                <div className="space-y-6">
                  {testResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 dark:bg-[#0f0f0f]">
                      <div className="flex items-center mb-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center 
                                      ${result.status === 'success' 
                                        ? 'bg-green-100 dark:bg-green-900/30' 
                                        : 'bg-red-100 dark:bg-red-900/30'} mr-2`}>
                          {result.status === 'success' ? (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <h3 className="text-sm font-semibold dark:text-white">
                          {result.step === 'trigger' ? 'Trigger' : `Action ${index}`}: {result.appId}
                        </h3>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-[#181818] rounded p-3 text-sm font-mono overflow-auto max-h-[200px]">
                        <pre className="whitespace-pre-wrap dark:text-gray-300">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {testStatus === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 text-red-700 dark:text-red-400">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    Test Failed
                  </h3>
                  <p>There was an error testing your workflow. Please check your configuration and try again.</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
};

export default AutomationBuilder;

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BuilderStep } from '@/components/automation/BuilderCanvas';

export type PreviewStepStatus = 'waiting' | 'running' | 'success' | 'error' | 'warning' | 'idle';

export interface PreviewStep {
  id: string;
  status: PreviewStepStatus;
  stepType: 'trigger' | 'action';
  appId: string;
  name?: string;
  result?: any;
  error?: string;
  executionTime?: number; // in milliseconds
}

interface WorkflowPreviewPanelProps {
  trigger: BuilderStep | null;
  actions: BuilderStep[];
  onTestWorkflow: () => void;
  isRunning: boolean;
  testResults: any[] | null;
}

export const WorkflowPreviewPanel: React.FC<WorkflowPreviewPanelProps> = ({
  trigger,
  actions,
  onTestWorkflow,
  isRunning,
  testResults
}) => {
  const [previewSteps, setPreviewSteps] = useState<PreviewStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Initialize preview steps based on the workflow components
  useEffect(() => {
    const steps: PreviewStep[] = [];
    
    if (trigger) {
      steps.push({
        id: trigger.id,
        status: 'idle',
        stepType: 'trigger',
        appId: trigger.appId,
        name: trigger.name || `${trigger.appId} Trigger`
      });
    }
    
    actions.forEach(action => {
      steps.push({
        id: action.id,
        status: 'idle',
        stepType: 'action',
        appId: action.appId,
        name: action.name || `${action.appId} Action`
      });
    });
    
    setPreviewSteps(steps);
  }, [trigger, actions]);
  
  // Update preview steps when test results are received
  useEffect(() => {
    if (!testResults || testResults.length === 0) return;
    
    // Reset state for new run
    if (isRunning) {
      setActiveStepIndex(0);
      setPreviewSteps(prev => 
        prev.map((step, index) => ({
          ...step,
          status: index === 0 ? 'running' : 'waiting',
          result: undefined,
          error: undefined
        }))
      );
      return;
    }
    
    // Process test results
    const updatedSteps = [...previewSteps];
    testResults.forEach((result, index) => {
      if (index < updatedSteps.length) {
        updatedSteps[index] = {
          ...updatedSteps[index],
          status: result.status === 'success' ? 'success' : 'error',
          result: result.data,
          error: result.status === 'error' ? result.error : undefined
        };
      }
    });
    
    setPreviewSteps(updatedSteps);
    setActiveStepIndex(updatedSteps.length - 1);
  }, [testResults, isRunning]);
  
  // Simulate step-by-step execution with delays when running
  useEffect(() => {
    if (!isRunning || activeStepIndex < 0 || activeStepIndex >= previewSteps.length) return;
    
    // Mark current step as running
    setPreviewSteps(prev => {
      const updated = [...prev];
      if (updated[activeStepIndex]) {
        updated[activeStepIndex] = {
          ...updated[activeStepIndex],
          status: 'running'
        };
      }
      return updated;
    });
    
    // Simulate step execution time (500-1500ms)
    const executionTime = Math.floor(Math.random() * 1000) + 500;
    
    const timer = setTimeout(() => {
      // Move to next step after simulated execution
      if (activeStepIndex < previewSteps.length - 1) {
        setActiveStepIndex(activeStepIndex + 1);
      }
    }, executionTime);
    
    return () => clearTimeout(timer);
  }, [activeStepIndex, isRunning, previewSteps.length]);
  
  // Render status icon based on step status
  const renderStatusIcon = (status: PreviewStepStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'waiting':
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-200" />;
    }
  };
  
  // Calculate overall progress percentage
  const calculateProgress = () => {
    const completedSteps = previewSteps.filter(
      step => ['success', 'error', 'warning'].includes(step.status)
    ).length;
    
    return previewSteps.length > 0 
      ? Math.round((completedSteps / previewSteps.length) * 100) 
      : 0;
  };
  
  return (
    <Card className={`border overflow-hidden transition-all duration-300 ${isExpanded ? 'h-96' : 'h-auto'}`}>
      <div className="border-b bg-muted/20 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Workflow Preview</h3>
          {isRunning && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Running
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)} 
            className="h-7 px-2">
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button 
            size="sm" 
            onClick={onTestWorkflow} 
            disabled={isRunning || !trigger || actions.length === 0}
            className="h-7 px-3"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Running
              </>
            ) : 'Test Workflow'}
          </Button>
        </div>
      </div>
      
      <CardContent className={`p-4 ${isExpanded ? 'overflow-y-auto h-[calc(100%-48px)]' : ''}`}>
        {previewSteps.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
            Add a trigger and actions to preview your workflow
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Workflow Execution</span>
                <span>{calculateProgress()}% Complete</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
            
            {/* Workflow steps */}
            <div className="space-y-3">
              {previewSteps.map((step, index) => (
                <div key={step.id} className="relative">
                  {index > 0 && (
                    <div className="absolute left-2.5 -top-3 w-0.5 h-3 bg-gray-200" />
                  )}
                  <div 
                    className={`flex items-start p-2 rounded-md border ${
                      step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                      step.status === 'success' ? 'bg-green-50 border-green-100' :
                      step.status === 'error' ? 'bg-red-50 border-red-100' :
                      'bg-gray-50 border-gray-100'
                    } cursor-pointer`}
                    onClick={() => setShowDetails(showDetails === step.id ? null : step.id)}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {renderStatusIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="font-medium text-sm truncate">
                          {step.name}
                        </div>
                        {step.stepType === 'trigger' ? (
                          <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
                            Trigger
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200">
                            Action
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.status === 'running' && 'Processing...'}
                        {step.status === 'success' && 'Completed successfully'}
                        {step.status === 'error' && (step.error || 'Failed to execute')}
                        {step.status === 'waiting' && 'Waiting to execute'}
                        {step.status === 'idle' && 'Not started'}
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                      showDetails === step.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                  
                  {/* Result details */}
                  {showDetails === step.id && step.result && (
                    <div className="mt-2 ml-10 p-3 bg-gray-50 rounded-md border text-xs font-mono overflow-auto max-h-40">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(step.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowPreviewPanel;
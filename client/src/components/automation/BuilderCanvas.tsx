import { FC, useState, useRef } from "react";
import { useDrop, useDrag } from "react-dnd";
import { ArrowDown, PlusIcon, Settings, X, Plus, Play, MoreHorizontal, Copy, Clock, Calendar, Zap, Timer as TimerIcon } from "lucide-react";
import AppIconMap from "@/components/automation/AppIconMap";
import { APPS, AppId } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimerConfigForm, { TimerConfig } from "./TimerConfigForm";
import AIPromptConfig, { AIPromptConfigType } from "./AIPromptConfig";

export type BuilderStep = {
  id: string;
  type: "trigger" | "action";
  appId: string;
  config: Record<string, any>;
  name?: string;
  description?: string;
};

interface BuilderCanvasProps {
  trigger: BuilderStep | null;
  actions: BuilderStep[];
  onRemoveTrigger: () => void;
  onRemoveAction: (id: string) => void;
  onAddAction: (appId: string) => void;
  onReorderActions: (fromIndex: number, toIndex: number) => void;
  onUpdateConfig: (stepId: string, config: Record<string, any>) => void;
  onTestWorkflow: () => void;
  onAddTrigger?: (appId: string) => void; // Optional method to add trigger
}

// Define our drop/drag types
const ItemTypes = {
  APP: "app",
  ACTION: "action"
} as const;

interface DraggableActionProps {
  action: BuilderStep;
  index: number;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onConfigure: (id: string) => void;
}

const DraggableAction: FC<DraggableActionProps> = ({
  action,
  index,
  onRemove,
  onReorder,
  onConfigure
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ACTION,
    item: { id: action.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.ACTION,
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onReorder(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  
  const appDetails = (action.appId in APPS) 
    ? APPS[action.appId as AppId] 
    : {
        name: action.appId,
        description: "Do this..."
      };
  
  drag(drop(ref));

  return (
    <div 
      ref={ref} 
      className={`workflow-step w-full p-5 mb-5 bg-white dark:bg-[#181818] border-2
          ${isDragging ? 'border-dashed border-primary/80 dark:border-blue-600' : 'border-gray-200 dark:border-[#2a2a2a]'} 
          rounded-xl shadow-md transition-all duration-300 
          ${isOver ? 'border-primary dark:border-blue-600 bg-primary/5 dark:bg-blue-900/20' : ''} 
          ${isDragging 
            ? 'shadow-lg ring-2 ring-primary/20 dark:ring-blue-600/30 scale-[1.02] -rotate-1' 
            : 'hover:border-primary/30 hover:shadow-md hover:scale-[1.01]'}`}
      style={{ opacity }}
    >
      <div className="flex items-center mb-4">
        <div className="cursor-move p-1.5 mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 group">
          <MoreHorizontal className="h-4 w-4 group-hover:animate-pulse" />
        </div>
        
        <div className="flex items-center">
          <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${isDragging ? 'animate-pulse' : ''}`}>
            <AppIconMap appId={action.appId} />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium dark:text-gray-300 group-hover:text-primary transition-colors">{appDetails.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {action.description || "Do this..."}
            </p>
          </div>
        </div>
        
        <div className="ml-auto flex space-x-2">
          <button 
            className="text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-full transition-colors" 
            onClick={() => onConfigure(action.id)}
            aria-label="Configure"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-1.5 rounded-full transition-colors" 
            onClick={() => onRemove(action.id)}
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {action.config && Object.keys(action.config).length > 0 ? (
        <div className="mt-3 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-800">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <div className="flex-1 font-medium">
              {action.config.optionName 
                ? action.config.optionName
                : action.name || 'Configured action'}
            </div>
            <div className="ml-2 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-[10px] border border-green-100 dark:border-green-800 font-medium">
              Configured
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs px-3 py-2.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg border-2 border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center">
          <span className="flex-1 font-medium">Click to configure this action...</span>
          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 rounded text-[10px] border border-orange-200 dark:border-orange-800 font-medium">
            Required
          </span>
        </div>
      )}
    </div>
  );
};

const BuilderCanvas: FC<BuilderCanvasProps> = ({
  trigger,
  actions,
  onRemoveTrigger,
  onRemoveAction,
  onAddAction,
  onReorderActions,
  onUpdateConfig,
  onTestWorkflow,
  onAddTrigger
}) => {
  const { toast } = useToast();
  const [configStepId, setConfigStepId] = useState<string | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<Record<string, any>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Find the step being configured
  const getStepById = (id: string): BuilderStep | null => {
    if (trigger && trigger.id === id) return trigger;
    return actions.find(a => a.id === id) || null;
  };

  const handleConfigureStep = (stepId: string) => {
    const step = getStepById(stepId);
    if (step) {
      setConfigStepId(stepId);
      setCurrentConfig(step.config || {});
      setIsConfigDialogOpen(true);
      
      // If it's a service with options, pre-select the current one
      const appDetails = (step.appId in APPS) ? APPS[step.appId as AppId] : undefined;
      if (appDetails) {
        const options = step.type === 'trigger' ? appDetails.triggerOptions : appDetails.actionOptions;
        if (options && options.length > 0) {
          setSelectedOption(step.config?.optionName || options[0].name);
        }
      }
    }
  };

  const handleSaveConfig = () => {
    if (configStepId) {
      const step = getStepById(configStepId);
      if (step) {
        // Add the selected option and any AI config to the config
        const updatedConfig: Record<string, any> = { 
          ...currentConfig,
          optionName: selectedOption 
        };
        
        // Check if this was an AI service and update the description
        const isAIAction = (step.appId === 'openai' || step.appId === 'anthropic' || 
                          step.appId === 'perplexity' || step.appId === 'ollama');
                          
        if (isAIAction && currentConfig.aiPrompt) {
          const aiPrompt = currentConfig.aiPrompt as AIPromptConfigType;
          
          // Add a description based on the prompt
          if (aiPrompt.prompt) {
            const promptPreview = aiPrompt.prompt.length > 30 
              ? aiPrompt.prompt.substring(0, 30) + '...' 
              : aiPrompt.prompt;
              
            updatedConfig.description = `Custom prompt: "${promptPreview}"`;
            
            // Add model info if available
            if (aiPrompt.model) {
              updatedConfig.description += ` using ${aiPrompt.model}`;
            }
          }
        }
        
        onUpdateConfig(configStepId, updatedConfig);
        setIsConfigDialogOpen(false);
        
        toast({
          title: "Configuration saved",
          description: `${step.type === 'trigger' ? 'Trigger' : 'Action'} configuration has been updated.`
        });
      }
    }
  };

  const handleTestWorkflow = () => {
    if (!trigger) {
      toast({
        variant: "destructive",
        title: "Trigger required",
        description: "Please add a trigger before testing the workflow."
      });
      return;
    }
    
    if (actions.length === 0) {
      toast({
        variant: "destructive",
        title: "Action required",
        description: "Please add at least one action before testing the workflow."
      });
      return;
    }
    
    onTestWorkflow();
  };

  // Drop target for triggers
  const [{ isOverTrigger, canDropTrigger }, dropTrigger] = useDrop({
    accept: ItemTypes.APP,
    drop: (item: { id: string; type: string }) => {
      if (item.type === 'trigger') {
        handleTriggerDrop(item.id);
      }
    },
    collect: (monitor) => ({
      isOverTrigger: monitor.isOver(),
      canDropTrigger: monitor.canDrop(),
    }),
  });

  // Helper method to handle trigger drop
  const handleTriggerDrop = (appId: string) => {
    if (onAddTrigger) {
      // If we have a dedicated trigger handler, use it
      onAddTrigger(appId);
    } else {
      // Fallback for backward compatibility
      onRemoveTrigger(); // Remove any existing trigger first
      onAddAction(appId); // Use the existing action add function as trigger
    }
  };

  // Render trigger or an empty drop zone
  const renderTriggerZone = () => {
    if (!trigger) {
      return (
        <div 
          ref={dropTrigger}
          className={`drop-zone w-full mb-6 border-2 border-dashed ${isOverTrigger && canDropTrigger 
            ? 'border-primary dark:border-blue-600 bg-primary/5 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-[#2a2a2a]'} 
            rounded-xl flex flex-col items-center justify-center h-64 transition-all duration-300
            ${isOverTrigger && canDropTrigger ? 'shadow-lg shadow-primary/10' : 'hover:border-primary/50 hover:shadow-sm'}`}
        >
          <div className="p-8 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full 
              ${isOverTrigger && canDropTrigger 
                ? 'bg-primary/10 dark:bg-blue-900/20 scale-110' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-900/20'} 
              flex items-center justify-center transition-all duration-300 relative group`}>
              
              <div className={`absolute inset-0 rounded-full ${isOverTrigger && canDropTrigger ? 'animate-ping bg-primary/10 opacity-70' : ''}`} 
                style={{animationDuration: '3s'}} />
              
              <PlusIcon className={`h-8 w-8 
                ${isOverTrigger && canDropTrigger 
                  ? 'text-primary dark:text-blue-400 animate-pulse' 
                  : 'text-blue-500/70 dark:text-blue-400/70 group-hover:text-primary/80'} 
                transition-colors duration-300`} />
            </div>
            
            <h4 className={`mt-4 text-base font-medium 
              ${isOverTrigger && canDropTrigger 
                ? 'text-primary dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-300'} 
              transition-colors`}>
              {isOverTrigger && canDropTrigger ? 'Drop here to add trigger' : 'Start with a trigger'}
            </h4>
            
            <p className={`mt-2 text-sm
              ${isOverTrigger && canDropTrigger 
                ? 'text-primary/70 dark:text-blue-400/70' 
                : 'text-gray-500 dark:text-gray-400'} 
              transition-colors max-w-xs mx-auto`}>
              {isOverTrigger && canDropTrigger 
                ? 'Release to set up this trigger' 
                : 'Drag a trigger from the apps panel or select one below'}
            </p>
            
            {!isOverTrigger && (
              <div className="mt-7">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="text-sm font-medium border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:border-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/40 dark:text-blue-300 rounded-md px-5 py-2 h-10 shadow-sm">
                      <Plus className="h-4 w-4 mr-2" /> 
                      Select Trigger
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="center" className="w-80 p-0 dark:bg-[#181818] dark:border-[#2a2a2a] rounded-xl border-2 border-gray-200 dark:border-gray-800 shadow-xl">
                    <div className="py-3 border-b-2 border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-gray-900/30 rounded-t-lg">
                      <h4 className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Select a Trigger</h4>
                      <p className="px-4 text-xs text-gray-500 dark:text-gray-400 mt-1">Choose what starts your automation</p>
                    </div>
                    <div className="py-2 max-h-[300px] overflow-y-auto">
                      {Object.keys(APPS)
                        .filter(appId => {
                          const app = APPS[appId as AppId];
                          return app.triggerOptions && app.triggerOptions.length > 0;
                        })
                        .map(appId => {
                          const app = APPS[appId as AppId];
                          return (
                            <div
                              key={appId}
                              className="flex items-center px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer group border-b border-gray-100 dark:border-gray-800/50"
                              onClick={() => handleTriggerDrop(appId)}
                            >
                              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors shadow-sm">
                                <AppIconMap appId={appId} size="sm" />
                              </div>
                              <div className="ml-3">
                                <span className="text-sm font-medium dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{app.name}</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">When something happens in {app.name}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Special case for time trigger
    if (trigger.appId === 'scheduler' || 
        (trigger.config && (trigger.config.scheduleType || trigger.config.time || trigger.config.frequency))) {
      return (
        <div className="workflow-step w-full p-5 mb-6 bg-white dark:bg-[#181818] border-2 border-blue-200 dark:border-blue-800/50 rounded-xl shadow-md transition-all hover:shadow-lg">
          <div className="flex items-center mb-4">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 mr-3">
              <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="ml-1">
              <h4 className="text-sm font-medium dark:text-gray-300">Time Trigger</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {trigger.config?.scheduleType === 'recurring' ? 'Recurring schedule' : 
                 trigger.config?.scheduleType === 'timer' ? 'Timer interval' : 'One-time schedule'}
              </p>
            </div>
            <div className="ml-auto flex space-x-2">
              <button 
                className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded-full transition-colors" 
                onClick={() => handleConfigureStep(trigger.id)}
                aria-label="Configure"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button 
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-1.5 rounded-full transition-colors" 
                onClick={onRemoveTrigger}
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="text-xs bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border-2 border-blue-100 dark:border-blue-800/50 flex items-center dark:text-gray-300 font-medium">
            {trigger.config?.scheduleType === 'timer' ? (
              <>
                <TimerIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-2" />
                {trigger.config.timerConfig ? (
                  <span>
                    Every {trigger.config.timerConfig.interval} {trigger.config.timerConfig.unit}
                  </span>
                ) : (
                  <span>Click to configure timer...</span>
                )}
              </>
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-2" />
                {trigger.config && trigger.config.time ? (
                  <span>
                    {trigger.config.frequency === 'daily' && `Every day at ${trigger.config.time}`}
                    {trigger.config.frequency === 'weekly' && `Every ${trigger.config.dayOfWeek || 'Monday'} at ${trigger.config.time}`}
                    {trigger.config.frequency === 'monthly' && `Every month on day ${trigger.config.dayOfMonth || '1'} at ${trigger.config.time}`}
                    {!trigger.config.frequency && trigger.config.scheduleType !== 'timer' && `One time at ${trigger.config.time} on ${trigger.config.date || 'today'}`}
                  </span>
                ) : (
                  <span>Click to configure timer...</span>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    const appDetails = (trigger.appId in APPS) 
      ? APPS[trigger.appId as AppId] 
      : {
          name: trigger.appId,
          description: "When this happens..."
        };

    return (
      <div className="workflow-step w-full p-5 mb-6 bg-white dark:bg-[#181818] border-2 border-blue-200 dark:border-blue-800/30 rounded-xl shadow-md transition-all hover:shadow-lg">
        <div className="flex items-center mb-4">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 mr-3">
            <AppIconMap appId={trigger.appId} />
          </div>
          <div className="ml-1">
            <h4 className="text-sm font-medium dark:text-gray-300">{appDetails.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {trigger.description || "When this happens..."}
            </p>
          </div>
          <div className="ml-auto flex space-x-2">
            <button 
              className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded-full transition-colors" 
              onClick={() => handleConfigureStep(trigger.id)}
              aria-label="Configure"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button 
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-1.5 rounded-full transition-colors" 
              onClick={onRemoveTrigger}
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {trigger.config && Object.keys(trigger.config).length > 0 ? (
          <div className="mt-3 text-xs px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-100 dark:border-blue-800/50 flex items-center dark:text-gray-300 font-medium">
            <div className="flex-1">
              {trigger.config.optionName 
                ? trigger.config.optionName 
                : trigger.name || 'Configured trigger'}
            </div>
            <div className="ml-2 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-[10px] border border-green-100 dark:border-green-800 font-medium">
              Configured
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs px-3 py-2.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg border-2 border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center">
            <span className="flex-1 font-medium">Click to configure this trigger...</span>
            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 rounded text-[10px] border border-orange-200 dark:border-orange-800 font-medium">
              Required
            </span>
          </div>
        )}
      </div>
    );
  };

  // Drop target for actions
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.APP,
    drop: (item: { id: string; type: string }) => {
      if (item.type === 'action') {
        onAddAction(item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Render the config dialog based on the selected step
  const renderConfigDialog = () => {
    if (!configStepId) return null;
    
    const step = getStepById(configStepId);
    if (!step) return null;
    
    const stepType = step.type === 'trigger' ? 'Trigger' : 'Action';
    const appDetails = (step.appId in APPS) ? APPS[step.appId as AppId] : undefined;
    const options = step.type === 'trigger' 
      ? appDetails?.triggerOptions 
      : appDetails?.actionOptions;
    
    const isTimeBasedTrigger = step.type === 'trigger' && 
      (step.appId === 'scheduler' || 
      (step.config && (step.config.scheduleType || step.config.time || step.config.frequency)));
    
    // Check if this is an AI-related action
    const isAIAction = step.type === 'action' && 
      (step.appId === 'openai' || step.appId === 'anthropic' || 
       step.appId === 'perplexity' || step.appId === 'ollama');
    
    return (
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isTimeBasedTrigger ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Configure Time Trigger
                </div>
              ) : (
                `Configure ${stepType}`
              )}
            </DialogTitle>
            <DialogDescription>
              {isTimeBasedTrigger ? 
                "Set when your automation should run" : 
                `Customize how this ${stepType.toLowerCase()} will work`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Time-based trigger configuration */}
            {isTimeBasedTrigger && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Schedule Type:
                  </label>
                  <div className="space-y-2">
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        currentConfig.scheduleType === 'once' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentConfig({...currentConfig, scheduleType: 'once'})}
                    >
                      <div className="font-medium">One-time</div>
                      <div className="text-sm text-gray-500">Run once at a specific date and time</div>
                    </div>
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        currentConfig.scheduleType === 'recurring' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentConfig({...currentConfig, scheduleType: 'recurring'})}
                    >
                      <div className="font-medium">Recurring</div>
                      <div className="text-sm text-gray-500">Run on a regular calendar schedule</div>
                    </div>
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        currentConfig.scheduleType === 'timer' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentConfig({...currentConfig, scheduleType: 'timer'})}
                    >
                      <div className="font-medium">Timer</div>
                      <div className="text-sm text-gray-500">Run at regular intervals (e.g., every 15 minutes)</div>
                    </div>
                  </div>
                </div>
                
                {currentConfig.scheduleType === 'timer' ? (
                  // Timer options - regular intervals
                  <div className="mb-4">
                    <TimerConfigForm
                      onSave={(timerConfig: TimerConfig) => {
                        setCurrentConfig({
                          ...currentConfig,
                          timerConfig
                        });
                      }}
                      initialConfig={currentConfig.timerConfig}
                    />
                  </div>
                ) : currentConfig.scheduleType === 'recurring' ? (
                  // Recurring schedule options
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Frequency:
                      </label>
                      <Select 
                        value={currentConfig.frequency || 'daily'} 
                        onValueChange={(value) => setCurrentConfig({...currentConfig, frequency: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {currentConfig.frequency === 'weekly' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Day of Week:
                        </label>
                        <Select 
                          value={currentConfig.dayOfWeek || 'Monday'} 
                          onValueChange={(value) => setCurrentConfig({...currentConfig, dayOfWeek: value})}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                            <SelectItem value="Saturday">Saturday</SelectItem>
                            <SelectItem value="Sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {currentConfig.frequency === 'monthly' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Day of Month:
                        </label>
                        <Select 
                          value={currentConfig.dayOfMonth || '1'} 
                          onValueChange={(value) => setCurrentConfig({...currentConfig, dayOfMonth: value})}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                              <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                ) : (
                  // One-time schedule options
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Date:
                    </label>
                    <Input
                      type="date"
                      value={currentConfig.date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCurrentConfig({...currentConfig, date: e.target.value})}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Time input for one-time and recurring only */}
                {currentConfig.scheduleType !== 'timer' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Time:
                    </label>
                    <Input
                      type="time"
                      value={currentConfig.time || '08:00'}
                      onChange={(e) => setCurrentConfig({...currentConfig, time: e.target.value})}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Trigger Name:
                  </label>
                  <Input
                    type="text"
                    value={currentConfig.name || ''}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, name: e.target.value })}
                    className="w-full"
                    placeholder="E.g., Daily Morning Report"
                  />
                </div>
              </>
            )}
            
            {/* Standard app options if they exist */}
            {!isTimeBasedTrigger && options && options.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select an option:
                </label>
                <div className="space-y-2">
                  {options.map((option: { name: string; description: string }, idx: number) => (
                    <div 
                      key={idx} 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedOption === option.name ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedOption(option.name)}
                    >
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* AI Prompt Config section for AI services */}
            {isAIAction && selectedOption && (
              <div className="mt-4 mb-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium mb-2">Configure AI Prompt</h4>
                <AIPromptConfig
                  serviceId={step.appId as AppId}
                  initialConfig={currentConfig.aiPrompt as AIPromptConfigType}
                  onSave={(aiPromptConfig) => {
                    setCurrentConfig({
                      ...currentConfig,
                      aiPrompt: aiPromptConfig
                    });
                  }}
                />
              </div>
            )}
            
            {/* Simple name input for standard steps */}
            {!isTimeBasedTrigger && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {step.type === 'trigger' ? 'Trigger' : 'Action'} Name:
                </label>
                <Input
                  type="text"
                  value={currentConfig.name || ''}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, name: e.target.value })}
                  className="w-full"
                  placeholder={`Enter custom name for this ${step.type}`}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex-1">
      <div className="bg-white dark:bg-[#111111] border border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-xl p-6 min-h-[500px] relative flex flex-col shadow-sm workflow-canvas">
        {/* Top toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 rounded-full flex items-center justify-center mr-3">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Workflow Builder</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Connect apps to automate your tasks</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              onClick={handleTestWorkflow}
              className="bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-md hover:shadow-primary/20 transition-all duration-300 group"
            >
              <Play className="h-3.5 w-3.5 mr-1.5 group-hover:animate-pulse" />
              Test Workflow
            </Button>
          </div>
        </div>
        
        {/* Title Text if no trigger or actions */}
        {!trigger && actions.length === 0 && (
          <div className="text-center rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 shadow-sm mb-6">
            <div className="bg-white dark:bg-[#181818] rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Start building your workflow</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">First add a trigger, then connect actions to automate tasks</p>
            </div>
          </div>
        )}
        
        {/* Trigger Drop Zone */}
        {renderTriggerZone()}
        
        {/* Simplified connector with Then Do label */}
        {trigger && (
          <div className="mb-6 flex items-center justify-center group connector-group">
            {/* Animated vertical connector with arrow */}
            <div className="relative h-12 w-0.5 connector-line bg-gradient-to-b from-primary/20 to-primary/60 dark:from-primary/30 dark:to-primary/70 transition-colors duration-300">
              {/* Animated pulse element */}
              <div className="absolute inset-0 pulse-animation bg-primary/10 dark:bg-primary/20 opacity-0 transition-opacity duration-300"></div>
              
              {/* Arrow at the bottom with animation */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center transition-transform duration-300 arrow-container">
                <div className="w-3.5 h-3.5 rotate-45 border-r-2 border-b-2 border-primary dark:border-primary/80 arrow-head transition-all duration-300"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions Section */}
        <div 
          ref={drop} 
          className={`flex-1 ${actions.length === 0 ? 'flex items-center justify-center' : ''} 
            ${isOver && canDrop ? 'bg-primary/5 dark:bg-blue-900/20 border-2 border-dashed border-primary dark:border-blue-600 rounded-lg' : ''}`}
        >
          {actions.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-xl w-full transform transition-all duration-300 group hover:border-primary/50 hover:shadow-sm">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                <div className="absolute inset-0 rounded-full bg-primary/5 dark:bg-blue-900/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity" style={{animationDuration: '3s'}} />
                <Plus className="h-8 w-8 text-blue-500/70 dark:text-blue-400/70 group-hover:text-primary transition-colors duration-300" />
              </div>
              
              <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-2 text-lg group-hover:text-primary transition-colors duration-300">Add an action</h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                Now that you have a trigger set up, add one or more actions that will run when the trigger is activated
              </p>
              
              <div className="flex flex-col items-center space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="text-sm font-medium border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg px-4 py-2 h-10 shadow-sm">
                      <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Add Action
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="center" className="w-80 p-0 dark:bg-[#181818] dark:border-[#2a2a2a] rounded-xl border-2 border-gray-200 dark:border-gray-800 shadow-xl">
                    <div className="py-3 border-b-2 border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-gray-900/30 rounded-t-lg">
                      <h4 className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Select an Action</h4>
                      <p className="px-4 text-xs text-gray-500 dark:text-gray-400 mt-1">Choose what happens when your trigger activates</p>
                    </div>
                    <ScrollArea className="max-h-[400px]">
                      <div className="py-2">
                        {Object.keys(APPS)
                          .filter(appId => {
                            const app = APPS[appId as AppId];
                            return app.actionOptions && app.actionOptions.length > 0;
                          })
                          .map(appId => {
                            const app = APPS[appId as AppId];
                            return (
                              <div
                                key={appId}
                                className="flex items-center px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer group border-b border-gray-100 dark:border-gray-800/50"
                                onClick={() => onAddAction(appId)}
                              >
                                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors shadow-sm">
                                  <AppIconMap appId={appId} />
                                </div>
                                <div className="ml-3">
                                  <span className="text-sm font-medium dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{app.name}</span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Perform actions in {app.name}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                    <div className="p-3 border-t-2 border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#151515] text-xs text-gray-500 dark:text-gray-400 rounded-b-xl">
                      You can also drag apps from the left panel directly into this area
                    </div>
                  </PopoverContent>
                </Popover>
                
                <p className="text-xs text-gray-400 dark:text-gray-500">or</p>
                
                <Button variant="outline" size="sm" onClick={() => window.open('https://docs.brnout.app/actions', '_blank')} className="text-xs border-2 border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg">
                  Browse Action Documentation
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 relative">
              {/* Render actions with proper connector arrows between them */}
              {actions.map((action, index) => (
                <div key={action.id}>
                  {/* Render action component */}
                  <DraggableAction
                    action={action}
                    index={index}
                    onRemove={onRemoveAction}
                    onReorder={onReorderActions}
                    onConfigure={() => handleConfigureStep(action.id)}
                  />
                  
                  {/* If there's a next action, render animated connector between them */}
                  {index < actions.length - 1 && (
                    <div className="h-10 my-3 flex items-center justify-center group connector-group">
                      {/* Animated vertical connector with arrow */}
                      <div className="relative h-full w-0.5 connector-line bg-gradient-to-b from-primary/20 to-primary/60 dark:from-primary/30 dark:to-primary/70 transition-colors duration-300">
                        {/* Animated pulse element */}
                        <div className="absolute inset-0 pulse-animation bg-primary/10 dark:bg-primary/20 opacity-0 transition-opacity duration-300"></div>
                        
                        {/* Arrow at the bottom with animation */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center transition-transform duration-300 arrow-container">
                          <div className="w-3.5 h-3.5 rotate-45 border-r-2 border-b-2 border-primary dark:border-primary/80 arrow-head transition-all duration-300"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add action button at the end */}
              <div className="mt-6 flex justify-center pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-800">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size="sm" 
                      className="text-sm font-medium border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg px-4 py-2 h-10 shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Add Another Action
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="center" className="w-80 p-0 dark:bg-[#181818] dark:border-[#2a2a2a] rounded-xl border-2 border-gray-200 dark:border-gray-800 shadow-xl">
                    <div className="py-3 border-b-2 border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-gray-900/30 rounded-t-lg">
                      <h4 className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Add Next Action</h4>
                      <p className="px-4 text-xs text-gray-500 dark:text-gray-400 mt-1">Chain multiple actions to create complex workflows</p>
                    </div>
                    <ScrollArea className="max-h-[400px]">
                      <div className="py-2">
                        {Object.keys(APPS)
                          .filter(appId => {
                            const app = APPS[appId as AppId];
                            return app.actionOptions && app.actionOptions.length > 0;
                          })
                          .map(appId => {
                            const app = APPS[appId as AppId];
                            return (
                              <div
                                key={appId}
                                className="flex items-center px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer group border-b border-gray-100 dark:border-gray-800/50"
                                onClick={() => onAddAction(appId)}
                              >
                                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors shadow-sm">
                                  <AppIconMap appId={appId} />
                                </div>
                                <div className="ml-3">
                                  <span className="text-sm font-medium dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{app.name}</span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Perform actions in {app.name}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                    <div className="p-3 border-t-2 border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#151515] text-xs text-gray-500 dark:text-gray-400 rounded-b-xl">
                      Create powerful workflows by chaining multiple actions together
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Dialog */}
      {renderConfigDialog()}
    </div>
  );
};

export default BuilderCanvas;

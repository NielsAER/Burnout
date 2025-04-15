import { FC, useState, useRef } from "react";
import { useDrop, useDrag } from "react-dnd";
import { ArrowDown, PlusIcon, Settings, X, Plus, Play, MoreHorizontal, Copy } from "lucide-react";
import AppIconMap from "@/components/automation/AppIconMap";
import { APPS, AppId } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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

type ItemTypes = {
  APP: "app";
  ACTION: "action";
};

// Define our drop/drag types
export const ItemTypes: ItemTypes = {
  APP: "app",
  ACTION: "action"
};

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
      className={`workflow-step w-full p-4 mb-4 bg-white border ${isDragging ? 'border-dashed border-primary' : 'border-gray-200'} 
                 rounded-lg shadow-sm transition-all duration-200 ${isOver ? 'border-primary' : ''} 
                 ${isDragging ? 'shadow-md ring-2 ring-primary/20' : 'hover:shadow'}`}
      style={{ opacity }}
    >
      <div className="flex items-center mb-3">
        <div className="cursor-move p-1 mr-2 text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-4 w-4" />
        </div>
        <AppIconMap appId={action.appId} />
        <div className="ml-3">
          <h4 className="text-sm font-medium">{appDetails.name}</h4>
          <p className="text-xs text-gray-500">
            {action.description || "Do this..."}
          </p>
        </div>
        <div className="ml-auto flex space-x-2">
          <button 
            className="text-gray-400 hover:text-gray-600" 
            onClick={() => onConfigure(action.id)}
            aria-label="Configure"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-400 hover:text-red-500" 
            onClick={() => onRemove(action.id)}
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-500 italic">
        {action.config && Object.keys(action.config).length > 0 
          ? `${
              action.config.optionName 
                ? action.config.optionName
                : action.name || 'Configured action'
            }`
          : "Click to configure..."}
      </div>
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
        // Add the selected option to the config
        const updatedConfig = { 
          ...currentConfig,
          optionName: selectedOption 
        };
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
          className={`drop-zone w-full mb-6 border-2 border-dashed ${isOverTrigger && canDropTrigger ? 'border-primary bg-primary/5' : 'border-gray-300'} 
                     rounded-lg flex flex-col items-center justify-center h-32 transition-all duration-200`}
        >
          <div className="p-4 text-center">
            <div className={`w-12 h-12 mx-auto rounded-full ${isOverTrigger && canDropTrigger ? 'bg-primary/10' : 'bg-gray-100'} 
                            flex items-center justify-center transition-all duration-200`}>
              <PlusIcon className={`h-5 w-5 ${isOverTrigger && canDropTrigger ? 'text-primary' : 'text-gray-400'} transition-colors`} />
            </div>
            <p className={`mt-2 text-sm ${isOverTrigger && canDropTrigger ? 'text-primary' : 'text-gray-500'} transition-colors`}>
              {isOverTrigger && canDropTrigger ? 'Drop trigger here' : 'Add a trigger to start'}
            </p>
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
      <div className="workflow-step w-full p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all hover:shadow">
        <div className="flex items-center mb-3">
          <AppIconMap appId={trigger.appId} />
          <div className="ml-3">
            <h4 className="text-sm font-medium">{appDetails.name}</h4>
            <p className="text-xs text-gray-500">
              {trigger.description || "When this happens..."}
            </p>
          </div>
          <div className="ml-auto flex space-x-2">
            <button 
              className="text-gray-400 hover:text-gray-600" 
              onClick={() => handleConfigureStep(trigger.id)}
              aria-label="Configure"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button 
              className="text-gray-400 hover:text-red-500" 
              onClick={onRemoveTrigger}
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 italic">
          {trigger.config && Object.keys(trigger.config).length > 0 
            ? `${
                trigger.config.optionName 
                ? trigger.config.optionName 
                : trigger.name || 'Configured trigger'
              }`
            : "Click to configure..."}
        </div>
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
    
    return (
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure {stepType}</DialogTitle>
            <DialogDescription>
              Customize how this {stepType.toLowerCase()} will work
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Show available options if they exist */}
            {options && options.length > 0 && (
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
            
            {/* Simple mock input for demonstration */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {step.type === 'trigger' ? 'Trigger' : 'Action'} Name:
              </label>
              <input
                type="text"
                value={currentConfig.name || ''}
                onChange={(e) => setCurrentConfig({ ...currentConfig, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder={`Enter custom name for this ${step.type}`}
              />
            </div>
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
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 min-h-[500px] relative flex flex-col">
        {/* Top toolbar */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-medium text-gray-700">Workflow Builder</h3>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTestWorkflow}
              className="flex items-center"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Test Workflow
            </Button>
          </div>
        </div>
        
        {/* Title Text if no trigger or actions */}
        {!trigger && actions.length === 0 && (
          <div className="text-center text-sm text-gray-500 mb-6">
            <p>Start by adding a trigger, then add one or more actions</p>
          </div>
        )}
        
        {/* Trigger Drop Zone */}
        {renderTriggerZone()}
        
        {/* Connector */}
        {trigger && (
          <div className="h-8 w-px bg-gray-300 relative self-center">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-primary bg-white">
              <ArrowDown className="h-3 w-3 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
        
        {/* Actions Section */}
        <div 
          ref={drop} 
          className={`flex-1 ${actions.length === 0 ? 'flex items-center justify-center' : ''} 
            ${isOver && canDrop ? 'bg-primary/5 border-2 border-dashed border-primary' : ''}`}
        >
          {actions.length === 0 ? (
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg w-full">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-2 text-sm text-gray-500">Drag actions here or click to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((action, index) => (
                <DraggableAction
                  key={action.id}
                  action={action}
                  index={index}
                  onRemove={onRemoveAction}
                  onReorder={onReorderActions}
                  onConfigure={() => handleConfigureStep(action.id)}
                />
              ))}
              
              {/* Add action button at the end */}
              <div className="mt-4 flex justify-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Action
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-1.5">
                      {Object.keys(APPS)
                        .filter(appId => {
                          const app = APPS[appId as AppId];
                          return app.actionOptions && app.actionOptions.length > 0;
                        })
                        .slice(0, 6) // Limit for demo purposes
                        .map(appId => {
                          const app = APPS[appId as AppId];
                          return (
                            <div
                              key={appId}
                              className="flex items-center p-1.5 rounded-md hover:bg-gray-100 cursor-pointer"
                              onClick={() => onAddAction(appId)}
                            >
                              <AppIconMap appId={appId} size="sm" />
                              <span className="ml-2 text-sm">{app.name}</span>
                            </div>
                          );
                        })}
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

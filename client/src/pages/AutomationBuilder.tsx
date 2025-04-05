import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Automation } from "@shared/schema";
import BuilderCanvas from "@/components/automation/BuilderCanvas";
import AppSelector from "@/components/automation/AppSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type BuilderStep = {
  id: string;
  type: "trigger" | "action";
  appId: string;
  config: Record<string, any>;
};

const AutomationBuilder = () => {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [automationName, setAutomationName] = useState("New Automation");
  const [trigger, setTrigger] = useState<BuilderStep | null>(null);
  const [action, setAction] = useState<BuilderStep | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
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
      setTrigger({
        id: "trigger-1",
        type: "trigger",
        appId: existingAutomation.triggerAppId,
        config: existingAutomation.triggerConfig
      });
      setAction({
        id: "action-1",
        type: "action",
        appId: existingAutomation.actionAppId,
        config: existingAutomation.actionConfig
      });
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
    if (!trigger || !action) {
      toast({
        variant: "destructive",
        title: "Incomplete automation",
        description: "Please add both a trigger and an action to your automation.",
      });
      return;
    }

    const automationData = {
      name: automationName,
      active: true,
      triggerAppId: trigger.appId,
      triggerConfig: trigger.config,
      actionAppId: action.appId,
      actionConfig: action.config
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

  const handleActionDrop = (appId: string) => {
    setAction({
      id: "action-1",
      type: "action",
      appId,
      config: {}
    });
  };

  const handleRemoveTrigger = () => {
    setTrigger(null);
  };

  const handleRemoveAction = () => {
    setAction(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutomationName(e.target.value);
  };

  // Check if save button should be enabled
  const canSave = !!trigger && !!action;

  if (isLoading) {
    return (
      <div className="py-6 px-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-8 w-1/4 mb-6" />
          <div className="flex space-x-4">
            <div className="w-64 border-r border-gray-200 pr-4">
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
    <div className="py-6 px-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            value={automationName}
            onChange={handleNameChange}
            className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 w-full"
            placeholder="Enter automation name..."
          />
          <p className="text-sm text-gray-500">Connect apps and create an automated workflow.</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Apps Panel */}
            <AppSelector 
              onSelectTrigger={handleTriggerDrop}
              onSelectAction={handleActionDrop}
            />
            
            {/* Builder Canvas */}
            <BuilderCanvas
              trigger={trigger}
              action={action}
              onRemoveTrigger={handleRemoveTrigger}
              onRemoveAction={handleRemoveAction}
            />
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
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
    </div>
  );
};

export default AutomationBuilder;

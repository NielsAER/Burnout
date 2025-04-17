import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Automation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Star, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowHealthCard } from "@/components/workflow-health/WorkflowHealthCard";

const AutomationDetails = () => {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const automationId = id ? parseInt(id) : 0;

  // Fetch automation details
  const { 
    data: automation, 
    isLoading,
    error 
  } = useQuery<Automation>({
    queryKey: [`/api/automations/${automationId}`],
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
        </div>
        <p className="text-muted-foreground">
          Created {new Date(automation.createdAt).toLocaleDateString()}
          {automation.lastRunAt && (
            <> · Last Run {new Date(automation.lastRunAt).toLocaleDateString()}</>
          )}
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10">
              <Zap className="text-primary h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-500">Total Runs</h3>
              <p className="text-2xl font-semibold">{automation.runsToday * 7}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10">
              <Clock className="text-primary h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-500">Today</h3>
              <p className="text-2xl font-semibold">{automation.runsToday}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10">
              <Star className="text-primary h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="text-2xl font-semibold">
                {automation.active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-gray-400">Inactive</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* New WorkflowHealthCard (includes achievements) */}
      <div className="mb-6">
        <WorkflowHealthCard automationId={automationId} />
      </div>
      
      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/builder/${automationId}`)}
        >
          Edit Automation
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/history/automation/${automationId}`)}
        >
          View Execution History
        </Button>
      </div>
    </div>
  );
};

export default AutomationDetails;
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Automation } from "@shared/schema";
import AutomationCard from "@/components/automation/AutomationCard";
import { useToast } from "@/hooks/use-toast";
import { 
  Filter, 
  PlusIcon, 
  SortAsc,
  Clock,
  AlignStartHorizontal,
  Layers,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "recent" | "oldest" | "alphabetical" | "lastRun";

const MyAutomations = () => {
  const [location, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showActive, setShowActive] = useState<boolean | null>(null);
  const { toast } = useToast();

  const { data: automations, isLoading, error } = useQuery<Automation[]>({
    queryKey: ["/api/automations"],
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/automations/${id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to toggle automation");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
    },
  });
  
  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({
        title: "Success",
        description: "Automation has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete automation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (id: number) => {
    toggleAutomationMutation.mutate(id);
  };
  
  const handleDeleteAutomation = (id: number) => {
    deleteAutomationMutation.mutate(id);
  };

  const handleCreateNew = () => {
    navigate("/builder");
  };

  const getSortedAutomations = () => {
    if (!automations) return [];
    
    let filtered = [...automations];
    
    // Apply active filter if set
    if (showActive !== null) {
      filtered = filtered.filter(a => a.active === showActive);
    }
    
    // Apply sorting
    switch (sortBy) {
      case "recent":
        return filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return filtered.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "alphabetical":
        return filtered.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      case "lastRun":
        return filtered.sort((a, b) => {
          if (!a.lastRunAt && !b.lastRunAt) return 0;
          if (!a.lastRunAt) return 1;
          if (!b.lastRunAt) return -1;
          return new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime();
        });
      default:
        return filtered;
    }
  };

  const sortedAutomations = getSortedAutomations();

  const renderSortIcon = () => {
    switch (sortBy) {
      case "recent":
      case "lastRun":
        return <Clock className="mr-1.5 h-4 w-4" />;
      case "oldest":
        return <Clock className="mr-1.5 h-4 w-4" />;
      case "alphabetical":
        return <AlignStartHorizontal className="mr-1.5 h-4 w-4" />;
      default:
        return <SortAsc className="mr-1.5 h-4 w-4" />;
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "recent": return "Recent";
      case "oldest": return "Oldest";
      case "alphabetical": return "Alphabetical";
      case "lastRun": return "Last Run";
      default: return "Sort";
    }
  };

  const handleFilterClick = () => {
    // Cycle through filter states: null (all) -> true (active) -> false (inactive) -> null (all)
    if (showActive === null) setShowActive(true);
    else if (showActive === true) setShowActive(false);
    else setShowActive(null);
  };

  const getFilterLabel = () => {
    if (showActive === null) return "All";
    return showActive ? "Active Only" : "Inactive Only";
  };

  return (
    <div className="py-4 px-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">My Automations</h2>
        <div className="flex">
          <Button 
            variant="outline" 
            className="flex items-center mr-2"
            onClick={handleFilterClick}
          >
            <Filter className="mr-1.5 h-4 w-4" />
            {getFilterLabel()}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                {renderSortIcon()}
                {getSortLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("recent")}>
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                Oldest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("alphabetical")}>
                Alphabetical
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("lastRun")}>
                Last Run
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <Skeleton className="h-6 w-3/4" />
              </div>
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-5 mx-3" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAutomations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onToggleStatus={handleToggleStatus}
            />
          ))}
          
          {/* Add New Automation Card */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition cursor-pointer"
            onClick={handleCreateNew}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <PlusIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-gray-900">Create New Automation</h3>
            <p className="mt-1 text-xs text-gray-500 text-center">Connect your apps and automate workflows</p>
          </div>
        </div>
      )}
      
      {automations && automations.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FlowChart className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No automations yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Create your first automation to start connecting your apps and automating your workflows.
          </p>
          <Button onClick={handleCreateNew} className="mt-6">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
        </div>
      )}
    </div>
  );
};

// Helper component for icon
const FlowChart = (props: any) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      width="24" 
      height="24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 5v16M19 5v9" />
      <rect x="1" y="3" width="8" height="4" rx="1" />
      <rect x="15" y="3" width="8" height="4" rx="1" />
      <rect x="15" y="12" width="8" height="4" rx="1" />
      <path d="M8 7h8M12 7v5h3" />
    </svg>
  );
};

export default MyAutomations;

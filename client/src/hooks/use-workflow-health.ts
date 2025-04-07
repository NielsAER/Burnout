import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Suggestion {
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Reliability {
  successRate: number;
  errorCount: number;
  totalRuns: number;
}

export interface HealthReport {
  score: number;
  reliability: Reliability;
  complexity: number;
  lastCheckedAt: string;
  improvementSuggestions: Suggestion[];
}

interface UseWorkflowHealthOptions {
  automationId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useWorkflowHealth({ 
  automationId, 
  autoRefresh = false, 
  refreshInterval = 60000 
}: UseWorkflowHealthOptions) {
  const { toast } = useToast();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  
  // Fetch health report
  const { 
    data: healthReport,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery<HealthReport>({
    queryKey: [`/api/automations/${automationId}/health`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/automations/${automationId}/health`);
      return res.json();
    },
    refetchInterval: autoRefreshEnabled ? refreshInterval : false,
  });
  
  // Update health score mutation
  const updateHealthScoreMutation = useMutation({
    mutationFn: async (healthScore: number) => {
      const res = await apiRequest(
        'PATCH', 
        `/api/automations/${automationId}/health-score`,
        { healthScore }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/automations/${automationId}/health`] });
      queryClient.invalidateQueries({ queryKey: [`/api/automations/${automationId}`] });
      toast({
        title: "Health score updated",
        description: "The workflow health score has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update health score",
        description: "There was an error updating the health score",
        variant: "destructive",
      });
    }
  });
  
  // Update complexity mutation
  const updateComplexityMutation = useMutation({
    mutationFn: async (complexity: number) => {
      const res = await apiRequest(
        'PATCH', 
        `/api/automations/${automationId}/complexity`,
        { complexity }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/automations/${automationId}/health`] });
      queryClient.invalidateQueries({ queryKey: [`/api/automations/${automationId}`] });
      toast({
        title: "Complexity updated",
        description: "The workflow complexity has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update complexity",
        description: "There was an error updating the complexity",
        variant: "destructive",
      });
    }
  });
  
  // Automatically check which achievements are unlocked based on health metrics
  useEffect(() => {
    if (!healthReport) return;
    
    const checkAchievements = async () => {
      // This would typically make API calls to check if new achievements
      // should be unlocked based on the health metrics
      
      // For example, if reliability is high, unlock the reliability achievement
      if (healthReport.reliability.successRate >= 95) {
        try {
          // Find the achievement ID for 100% uptime (you would need to fetch all achievements first)
          // For now, we'll assume the ID is 2 based on our seeded data
          await apiRequest(
            'POST',
            `/api/automations/${automationId}/unlock-achievement`,
            { achievementId: 2 }
          );
        } catch (error) {
          // Silent error - may already be unlocked
        }
      }
      
      // If complexity is high enough, unlock the complexity achievement
      if (healthReport.complexity >= 3) {
        try {
          // For workflow architect achievement (ID 3 in our seed data)
          await apiRequest(
            'POST',
            `/api/automations/${automationId}/unlock-achievement`,
            { achievementId: 3 }
          );
        } catch (error) {
          // Silent error - may already be unlocked
        }
      }
    };
    
    // Automatically check achievements when health report changes
    checkAchievements();
  }, [healthReport, automationId]);
  
  // Helper to toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => !prev);
  };
  
  return {
    healthReport,
    isLoading,
    error,
    isRefetching,
    refetchHealth: refetch,
    updateHealthScore: updateHealthScoreMutation.mutate,
    updateComplexity: updateComplexityMutation.mutate,
    autoRefreshEnabled,
    toggleAutoRefresh
  };
}
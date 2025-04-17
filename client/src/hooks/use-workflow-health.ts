import { useState, useEffect } from 'react';
import { Automation } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface WorkflowHealthResult {
  score: number;
  complexity: number;
  status: string;
  statusColor: string;
  recommendation: string;
  reliability: {
    successRate: number;
    errorCount: number;
    totalRuns: number;
  };
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook to calculate and track automation workflow health
 * 
 * @param automationId The ID of the automation to analyze
 * @returns WorkflowHealth object with score, complexity, recommendations and refetch function
 */
export function useWorkflowHealth(automationId?: number): WorkflowHealthResult {
  // Default health state
  const [health, setHealth] = useState({
    score: 0,
    complexity: 0,
    status: 'Unknown',
    statusColor: 'bg-slate-300',
    recommendation: 'Loading workflow data...',
    reliability: {
      successRate: 0,
      errorCount: 0,
      totalRuns: 0
    }
  });
  
  // Fetch automation data
  const { 
    data: automation, 
    isLoading, 
    refetch: refetchAutomation 
  } = useQuery<Automation>({
    queryKey: [`/api/automations/${automationId}`],
    enabled: !!automationId,
  });
  
  // Fetch execution history for this automation
  const { 
    data: executionHistory,
    refetch: refetchHistory
  } = useQuery<any[]>({
    queryKey: [`/api/execution-history/automation/${automationId}`],
    enabled: !!automationId,
  });
  
  // Fetch achievements for this automation
  const { 
    data: achievements,
    refetch: refetchAchievements 
  } = useQuery<any[]>({
    queryKey: [`/api/automations/${automationId}/achievements/unlocked`],
    enabled: !!automationId,
  });

  useEffect(() => {
    if (!automation) return;
    
    // Get basic health metrics from the automation
    const healthScore = automation.healthScore || 0;
    const complexity = automation.complexity || 1;
    const reliability = automation.reliability || {
      successRate: 100,
      errorCount: 0,
      totalRuns: 0
    };
    
    // Determine status based on health score
    let status = 'Excellent';
    let statusColor = 'bg-green-500';
    let recommendation = 'Your workflow is running optimally.';
    
    if (healthScore < 40) {
      status = 'Critical';
      statusColor = 'bg-red-500';
      recommendation = 'This workflow needs immediate attention. Check error logs and fix configuration issues.';
    } else if (healthScore < 70) {
      status = 'Warning';
      statusColor = 'bg-yellow-500';
      recommendation = 'Your workflow is experiencing some issues. Consider reviewing the error logs.';
    } else if (healthScore < 90) {
      status = 'Good';
      statusColor = 'bg-blue-500';
      recommendation = 'Your workflow is functioning well but could be improved.';
    }
    
    // Add achievement-specific recommendations
    if (achievements && achievements.length > 0) {
      // Has unlocked achievements
      if (complexity < 5 && !achievements.some(a => a.name === "Complexity Wizard")) {
        recommendation += ' Try adding more complexity to your workflow to unlock achievements.';
      }
    } else {
      // No achievements unlocked yet
      recommendation += ' This workflow hasn\'t unlocked any achievements yet. Add more complexity to earn them.';
    }
    
    // Special recommendations based on execution history
    if (executionHistory && executionHistory.length > 0) {
      const recentErrors = executionHistory.filter(h => h.status === 'error').slice(0, 3);
      if (recentErrors.length > 0) {
        recommendation += ' Review recent errors to improve reliability.';
      }
    }
    
    setHealth({
      score: healthScore,
      complexity,
      status,
      statusColor,
      recommendation,
      reliability
    });
  }, [automation, executionHistory, achievements]);
  
  // Create a refetch function that refetches all the related data
  const refetch = () => {
    refetchAutomation();
    refetchHistory();
    refetchAchievements();
  };

  // Return the health data along with loading state and refetch function
  return {
    ...health,
    isLoading,
    refetch
  };
}
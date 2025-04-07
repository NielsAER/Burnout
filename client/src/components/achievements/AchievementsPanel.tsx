import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AchievementCard } from './AchievementCard';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  threshold: number;
  unlockedAt: string | null;
  createdAt: string;
}

interface AchievementsPanelProps {
  automationId: number;
}

export function AchievementsPanel({ automationId }: AchievementsPanelProps) {
  const { toast } = useToast();
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  
  // Get unlocked achievements for this automation
  const { 
    data: unlockedAchievements = [], 
    isLoading: loadingUnlocked,
    refetch: refetchUnlocked 
  } = useQuery<Achievement[]>({
    queryKey: [`/api/automations/${automationId}/achievements`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/automations/${automationId}/achievements`);
      return res.json();
    }
  });
  
  // Get all possible achievements when viewing all
  const { 
    data: allAchievements = [], 
    isLoading: loadingAll 
  } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/achievements');
      return res.json();
    },
    enabled: showAllAchievements, // Only fetch when viewing all
  });
  
  // Mutation for unlocking achievements
  const unlockMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      const res = await apiRequest(
        'POST', 
        `/api/automations/${automationId}/unlock-achievement`,
        { achievementId }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Achievement unlocked!",
        description: "You've unlocked a new achievement for this workflow.",
      });
      // Refresh the unlocked achievements
      refetchUnlocked();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/automations/${automationId}/achievements`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to unlock achievement",
        description: "There was an error unlocking the achievement.",
        variant: "destructive",
      });
    }
  });
  
  const handleUnlock = (achievementId: number) => {
    unlockMutation.mutate(achievementId);
  };
  
  // Calculate which achievements to show based on current view
  const displayedAchievements = showAllAchievements ? allAchievements : unlockedAchievements;
  const isLoading = showAllAchievements ? loadingAll : loadingUnlocked;
  
  // Get the unlocked achievement IDs for filtering when viewing all
  const unlockedIds = unlockedAchievements.map(a => a.id);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Achievements</CardTitle>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowAllAchievements(!showAllAchievements)}
          >
            {showAllAchievements ? 'Show Unlocked' : 'Show All'}
          </Button>
        </div>
        <CardDescription>
          {showAllAchievements 
            ? 'All possible achievements for your automations' 
            : 'Achievements unlocked by this automation workflow'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : displayedAchievements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showAllAchievements 
              ? 'No achievements available yet.'
              : 'No achievements unlocked yet. Keep improving your workflow!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAchievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                {...achievement}
                showUnlockButton={showAllAchievements && !unlockedIds.includes(achievement.id)}
                onUnlock={handleUnlock}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AchievementCard } from "./AchievementCard";
import { Achievement } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy } from "lucide-react";

interface AchievementsPanelProps {
  automationId?: number;
  className?: string;
}

export function AchievementsPanel({ automationId, className }: AchievementsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("unlocked");
  
  // Fetch all achievements
  const { data: allAchievements, isLoading: loadingAll } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    enabled: true,
  });
  
  // Fetch unlocked achievements for this automation
  const { data: unlockedAchievements, isLoading: loadingUnlocked } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements/automation", automationId],
    enabled: !!automationId,
  });
  
  // If no automation is selected, only show all achievements in one tab
  useEffect(() => {
    if (!automationId) {
      setActiveTab("all");
    }
  }, [automationId]);
  
  // Loading state
  if (loadingAll || (loadingUnlocked && automationId)) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }
  
  // Check if achievements are present
  const hasAchievements = allAchievements && allAchievements.length > 0;
  
  // If no automation is selected or no unlocked achievements, show all achievements
  const lockedAchievements = automationId && allAchievements && unlockedAchievements
    ? allAchievements.filter(
        achievement => !unlockedAchievements.some(ua => ua.id === achievement.id)
      )
    : [];
  
  // If there are no achievements at all
  if (!hasAchievements) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center p-4">
        <Trophy className="text-muted-foreground w-12 h-12 mb-4" />
        <h3 className="text-lg font-semibold">No Achievements Available</h3>
        <p className="text-muted-foreground text-sm">
          Achievement system is being set up. Check back soon!
        </p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        {automationId && (
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="unlocked">
              Unlocked ({unlockedAchievements?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="locked">
              Locked ({lockedAchievements.length})
            </TabsTrigger>
          </TabsList>
        )}
        
        {!automationId && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All Platform Achievements</h2>
            <div className="text-sm text-muted-foreground">
              Total: {allAchievements?.length || 0}
            </div>
          </div>
        )}
        
        {automationId && (
          <>
            <TabsContent value="unlocked" className="mt-0">
              {unlockedAchievements?.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <Trophy className="text-muted-foreground w-12 h-12 mb-4" />
                  <h3 className="text-lg font-semibold">No Achievements Unlocked Yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Enhance your workflow to unlock achievements!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unlockedAchievements?.map((achievement) => (
                      <AchievementCard 
                        key={achievement.id} 
                        achievement={achievement} 
                        unlocked={true}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            
            <TabsContent value="locked" className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lockedAchievements.map((achievement) => (
                    <AchievementCard 
                      key={achievement.id} 
                      achievement={achievement} 
                      unlocked={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </>
        )}
        
        {!automationId && (
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAchievements?.map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  unlocked={false}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </Tabs>
    </div>
  );
}
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Achievement } from "@shared/schema";
import { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Map category to color
const categoryColors: Record<string, string> = {
  innovation: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  reliability: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  complexity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  volume: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
};

interface AchievementCardProps {
  achievement: Achievement;
  unlocked?: boolean;
  className?: string;
}

export function AchievementCard({ achievement, unlocked = false, className }: AchievementCardProps) {
  // Dynamically get icon from Lucide
  const IconComponent = (LucideIcons as Record<string, LucideIcon>)[
    achievement.icon.charAt(0).toUpperCase() + achievement.icon.slice(1)
  ] || LucideIcons.Award;

  return (
    <Card 
      className={cn(
        "transition-all duration-300 h-full flex flex-col",
        unlocked 
          ? "border-2 border-primary shadow-md" 
          : "opacity-75 grayscale hover:opacity-90 hover:grayscale-[0.5]",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{achievement.name}</CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "ml-2 font-normal", 
              categoryColors[achievement.category] || "bg-slate-100"
            )}
          >
            {achievement.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-muted-foreground">{achievement.description}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <div 
              className={cn(
                "p-2 rounded-full mr-2", 
                unlocked 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}
            >
              <IconComponent size={18} />
            </div>
            <div>
              <p className="text-xs font-medium">
                {unlocked ? "Unlocked" : "Locked"}
              </p>
              {achievement.unlockedAt && (
                <p className="text-xs text-muted-foreground">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          {achievement.threshold && (
            <Badge variant={unlocked ? "default" : "outline"}>
              {unlocked ? "Complete" : `Threshold: ${achievement.threshold}`}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
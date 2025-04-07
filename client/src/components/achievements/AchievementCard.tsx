import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Unlock, Lock, Rocket, BadgeCheck, GitBranch, Zap, Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface AchievementCardProps {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  threshold: number;
  unlockedAt: string | null;
  showUnlockButton?: boolean;
  onUnlock?: (achievementId: number) => void;
}

export function AchievementCard({ 
  id,
  name, 
  description, 
  category, 
  icon, 
  threshold,
  unlockedAt,
  showUnlockButton = false,
  onUnlock
}: AchievementCardProps) {
  
  // Get icon component based on icon name
  const getIconComponent = () => {
    switch (icon) {
      case 'rocket':
        return <Rocket className="h-6 w-6" />;
      case 'badge-check':
        return <BadgeCheck className="h-6 w-6" />;
      case 'git-branch':
        return <GitBranch className="h-6 w-6" />;
      case 'zap':
        return <Zap className="h-6 w-6" />;
      case 'clock':
        return <Clock className="h-6 w-6" />;
      default:
        return <Rocket className="h-6 w-6" />;
    }
  };
  
  // Get category color
  const getCategoryColor = () => {
    switch (category) {
      case 'innovation':
        return 'bg-blue-500';
      case 'reliability':
        return 'bg-green-500';
      case 'complexity':
        return 'bg-purple-500';
      case 'volume':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Format unlocked date
  const getUnlockedDate = () => {
    if (!unlockedAt) return null;
    
    try {
      return formatDistanceToNow(new Date(unlockedAt), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };
  
  const isUnlocked = !!unlockedAt;
  
  return (
    <Card className={`border ${isUnlocked ? 'border-primary/50' : 'border-muted/50'} overflow-hidden transition-all duration-200 hover:shadow-md relative`}>
      <div className={`absolute top-0 right-0 w-16 h-16 ${isUnlocked ? 'bg-primary/10' : 'bg-muted/10'} rounded-bl-full flex items-start justify-end pt-2 pr-2`}>
        {isUnlocked ? (
          <Unlock className="h-4 w-4 text-primary" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-primary/10' : 'bg-muted'}`}>
            {getIconComponent()}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{name}</h3>
              <Badge variant="outline" className={`${getCategoryColor()} text-white text-xs capitalize`}>
                {category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            
            {isUnlocked && (
              <p className="text-xs text-primary font-medium pt-1">
                Unlocked {getUnlockedDate()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      
      {showUnlockButton && onUnlock && (
        <CardFooter className="pt-0 pb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onUnlock(id)}
          >
            <Unlock className="h-3 w-3 mr-1" />
            Unlock Achievement
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
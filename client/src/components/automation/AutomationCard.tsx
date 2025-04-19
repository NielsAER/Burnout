import { FC, useState } from "react";
import { Automation } from "@shared/schema";
import { Toggle } from "@/components/ui/toggle";
import { Edit, History, MoreHorizontal, Info, Trash2, Play, Pause, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import AppIconMap from "@/components/automation/AppIconMap";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AutomationCardProps {
  automation: Automation;
  onToggleStatus?: (id: number) => void;
  onDeleteAutomation?: (id: number) => void;
}

const AutomationCard: FC<AutomationCardProps> = ({ automation, onToggleStatus, onDeleteAutomation }) => {
  const [location, navigate] = useLocation();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { toast } = useToast();
  const { id, name, active, triggerAppId, actionAppId, lastRunAt, runsToday, healthScore = 0, complexity = 0 } = automation;

  const handleEdit = () => {
    navigate(`/builder/${id}`);
  };

  const handleHistory = () => {
    navigate(`/history/automation/${id}`);
  };
  
  const handleViewDetails = () => {
    navigate(`/automations/${id}`);
  };

  const handleToggleStatus = () => {
    if (onToggleStatus) {
      onToggleStatus(id);
    }
  };

  const formatLastRun = () => {
    if (!lastRunAt) return "Never";
    return formatDistanceToNow(new Date(lastRunAt), { addSuffix: true });
  };
  
  const handleDelete = () => {
    if (onDeleteAutomation) {
      onDeleteAutomation(id);
      toast({
        title: "Automation deleted",
        description: `"${name}" has been successfully removed.`,
      });
    }
    setIsDeleteAlertOpen(false);
  };
  
  // Calculate the health score percentage for visualization
  const healthPercentage = Math.min(100, Math.max(0, healthScore * 10));
  const complexityDisplay = complexity > 7 ? "Complex" : complexity > 4 ? "Medium" : "Simple";
  const complexityColor = complexity > 7 ? "text-orange-500" : complexity > 4 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/20 flex items-center justify-between relative">
        <div className="flex items-center">
          <span className={`inline-flex h-3 w-3 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'} mr-2`}></span>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">{name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 w-7 p-0 rounded-full ${active ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30' : 'text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'}`}
            onClick={handleToggleStatus}
          >
            {active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Toggle 
            checked={active} 
            onCheckedChange={handleToggleStatus}
            className="data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:bg-emerald-600"
          />
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex flex-col gap-4">
          {/* Flow visualization */}
          <div className="flex items-center justify-center gap-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="relative h-14 w-14 flex items-center justify-center rounded-lg p-2 bg-primary/10 text-primary">
              <AppIconMap appId={triggerAppId} />
              <div className="absolute -bottom-1 -right-1 text-[0.65rem] font-semibold bg-primary/80 text-white px-1 rounded-sm">
                TRIGGER
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 to-primary transform -translate-y-1/2"></div>
              <Zap className="h-6 w-6 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1 rounded-full text-primary z-10" />
            </div>
            
            <div className="relative h-14 w-14 flex items-center justify-center rounded-lg p-2 bg-primary/10 text-primary">
              <AppIconMap appId={actionAppId} />
              <div className="absolute -bottom-1 -right-1 text-[0.65rem] font-semibold bg-primary/80 text-white px-1 rounded-sm">
                ACTION
              </div>
            </div>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Health</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                <div 
                  className={`h-1.5 rounded-full ${
                    healthPercentage > 70 ? 'bg-emerald-500' : 
                    healthPercentage > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className={
                  healthPercentage > 70 ? 'text-emerald-500' : 
                  healthPercentage > 40 ? 'text-yellow-500' : 'text-red-500'
                }>
                  {healthPercentage}%
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Runs</div>
              <div className="font-semibold">{runsToday}</div>
              <div className="text-gray-400 text-[0.65rem]">today</div>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="text-gray-500 dark:text-gray-400 mb-1">Complexity</div>
              <div className={`font-semibold ${complexityColor}`}>{complexityDisplay}</div>
              <div className="text-gray-400 text-[0.65rem]">level</div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
            <div>Last run: {formatLastRun()}</div>
            <div className={active ? 'text-emerald-500' : 'text-gray-500'}>
              {active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 flex justify-between items-center">
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-950/50">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">Delete Automation</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                Are you sure you want to delete "{name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800" onClick={handleViewDetails}>
            <Info className="h-3.5 w-3.5 mr-1" />
            Details
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800" onClick={handleEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800" onClick={handleHistory}>
            <History className="h-3.5 w-3.5 mr-1" />
            History
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper Arrow Icon
const ArrowRightIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default AutomationCard;

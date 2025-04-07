import { FC, useState } from "react";
import { Automation } from "@shared/schema";
import { Toggle } from "@/components/ui/toggle";
import { Edit, History, MoreHorizontal, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import AppIconMap from "@/components/automation/AppIconMap";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AutomationCardProps {
  automation: Automation;
  onToggleStatus?: (id: number) => void;
}

const AutomationCard: FC<AutomationCardProps> = ({ automation, onToggleStatus }) => {
  const [location, navigate] = useLocation();
  const { id, name, active, triggerAppId, actionAppId, lastRunAt, runsToday } = automation;

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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <span className={`inline-flex h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'} mr-2`}></span>
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
        </div>
        <Toggle 
          checked={active} 
          onCheckedChange={handleToggleStatus}
        />
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center">
          <AppIconMap appId={triggerAppId} />
          <div className="mx-3 text-gray-500">
            <ArrowRightIcon className="h-4 w-4" />
          </div>
          <AppIconMap appId={actionAppId} />
        </div>
        <p className="mt-3 text-sm text-gray-500">
          {`Send data from ${triggerAppId} to ${actionAppId}`}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">Last run: {formatLastRun()}</div>
          <div className={`text-xs font-medium ${active ? 'text-emerald-500' : 'text-gray-500'}`}>
            {active ? `${runsToday} runs today` : 'Inactive'}
          </div>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
        <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900" onClick={handleViewDetails}>
          <Info className="h-3.5 w-3.5 mr-1" />
          Details
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900" onClick={handleEdit}>
          <Edit className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900" onClick={handleHistory}>
          <History className="h-3.5 w-3.5 mr-1" />
          History
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewDetails}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={handleHistory}>View History</DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleStatus}>
              {active ? "Disable" : "Enable"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

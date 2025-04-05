import { FC } from "react";
import { ExecutionHistory, Automation } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Rocket, Drill, AlertTriangle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityFeedProps {
  activities: ExecutionHistory[];
  automations: Automation[];
  limit?: number;
}

const ActivityFeed: FC<ActivityFeedProps> = ({ activities, automations, limit }) => {
  const sortedActivities = [...activities]
    .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
    .slice(0, limit || activities.length);

  const getAutomationName = (automationId: number): string => {
    const automation = automations.find(a => a.id === automationId);
    return automation?.name || "Unknown Automation";
  };

  const formatTime = (date: string): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const renderActivityIcon = (status: string, index: number, total: number) => {
    switch (status) {
      case "success":
        return (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-white">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
        );
      case "error":
        return (
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center ring-8 ring-white">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
        );
      case "update":
        return (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-white">
            <Drill className="h-5 w-5 text-primary" />
          </div>
        );
      case "create":
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
            <PlusCircle className="h-5 w-5 text-green-600" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
            <Rocket className="h-5 w-5 text-gray-600" />
          </div>
        );
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <History className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedActivities.map((activity, idx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {idx !== sortedActivities.length - 1 && (
                <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
              )}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  {renderActivityIcon(activity.status, idx, sortedActivities.length)}
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {getAutomationName(activity.automationId)}
                      </span>
                      <span className="text-gray-500">
                        {activity.status === "success" ? " automation ran successfully" : 
                         activity.status === "error" ? " automation failed" : 
                         " was updated"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{formatTime(activity.executedAt)}</p>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{activity.message}</p>
                  </div>
                  {activity.status === "error" && (
                    <div className="mt-2">
                      <Button variant="default" size="sm">
                        Fix Issue
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper History Icon
const History = (props: any) => (
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
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

export default ActivityFeed;

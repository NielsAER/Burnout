import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: "primary" | "success" | "error" | "secondary";
  change?: number;
  changeDirection?: "up" | "down";
  link?: string;
  linkText?: string;
  isLoading?: boolean;
}

const StatsCard: FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  change,
  changeDirection,
  link,
  linkText,
  isLoading = false
}) => {
  const colorMap = {
    primary: {
      bg: "bg-blue-900/30",
      text: "text-blue-400"
    },
    success: {
      bg: "bg-emerald-900/30",
      text: "text-emerald-400"
    },
    error: {
      bg: "bg-red-900/30",
      text: "text-red-400"
    },
    secondary: {
      bg: "bg-purple-900/30",
      text: "text-purple-400"
    }
  };

  const renderIcon = () => {
    switch (icon) {
      case "rocket":
        return <RocketIcon className={`text-xl ${colorMap[color].text}`} />;
      case "task":
        return <TaskIcon className={`text-xl ${colorMap[color].text}`} />;
      case "apps":
        return <AppsIcon className={`text-xl ${colorMap[color].text}`} />;
      case "error":
        return <AlertTriangleIcon className={`text-xl ${colorMap[color].text}`} />;
      default:
        return <RocketIcon className={`text-xl ${colorMap[color].text}`} />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-[#0f0f0f] overflow-hidden shadow border border-gray-200 dark:border-[#2a2a2a] rounded-lg dark:rounded-sm">
        <div className="p-5">
          <div className="flex items-center">
            <Skeleton className="flex-shrink-0 rounded-md dark:rounded-sm p-3 h-12 w-12" />
            <div className="ml-5 w-0 flex-1">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-[#181818] border-t border-gray-200 dark:border-[#2a2a2a] px-5 py-3">
          <Skeleton className="h-5 w-16" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-[#0f0f0f] overflow-hidden shadow border border-gray-200 dark:border-[#2a2a2a] rounded-lg dark:rounded-sm">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorMap[color].bg} rounded-md dark:rounded-sm p-3`}>
            {renderIcon()}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeDirection === "up" ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  }`}>
                    {changeDirection === "up" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">{changeDirection === "up" ? "Increased" : "Decreased"} by</span>
                    {change}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {link && linkText && (
        <div className="bg-gray-50 dark:bg-[#181818] border-t border-gray-200 dark:border-[#2a2a2a] px-5 py-3">
          <div className="text-sm">
            <Link href={link} className="font-medium text-primary dark:text-blue-400 hover:text-primary/90 dark:hover:text-blue-300">
              {linkText}
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
};

// Helper Icons
const RocketIcon = (props: any) => (
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
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const TaskIcon = (props: any) => (
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
    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AppsIcon = (props: any) => (
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
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const AlertTriangleIcon = (props: any) => (
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
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export default StatsCard;

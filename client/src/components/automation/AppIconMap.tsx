import { FC } from "react";
import { APPS, AppId } from "@/lib/constants";
import { 
  Mail, 
  Twitter, 
  FileText, 
  Slack, 
  FileSpreadsheet, 
  Users, 
  HardDrive,
  Calendar,
  Instagram,
  Globe,
  CalendarDays,
  Bell,
  Brain,
  Bot,
  BookOpenText,
  Search,
  SparkleIcon,
  MessagesSquare
} from "lucide-react";

interface AppIconMapProps {
  appId: string;
  size?: "sm" | "md" | "lg";
}

const AppIconMap: FC<AppIconMapProps> = ({ appId, size = "md" }) => {
  const app = APPS[appId as AppId];
  if (!app) {
    return (
      <div className={`${getSizeClass(size)} bg-gray-100 flex items-center justify-center rounded-full`}>
        <div className="text-gray-400 text-xs">{appId.substring(0, 2).toUpperCase()}</div>
      </div>
    );
  }

  const { bgColor, iconColor } = app;

  const renderIcon = () => {
    switch (appId) {
      case "openai":
        return <SparkleIcon className={iconColor} />;
      case "anthropic":
        return <Brain className={iconColor} />;
      case "ollama":
        return <Bot className={iconColor} />;
      case "perplexity":
        return <Search className={iconColor} />;
      case "text-processor":
        return <BookOpenText className={iconColor} />;
      case "gmail":
        return <Mail className={iconColor} />;
      case "twitter":
        return <Twitter className={iconColor} />;
      case "form":
        return <FileText className={iconColor} />;
      case "slack":
        return <Slack className={iconColor} />;
      case "google-sheets":
        return <FileSpreadsheet className={iconColor} />;
      case "crm":
        return <Users className={iconColor} />;
      case "google-drive":
        return <HardDrive className={iconColor} />;
      case "google-calendar":
        return <Calendar className={iconColor} />;
      case "instagram":
        return <Instagram className={iconColor} />;
      case "wordpress":
        return <Globe className={iconColor} />;
      case "events":
        return <CalendarDays className={iconColor} />;
      case "notification":
        return <Bell className={iconColor} />;
      default:
        return <div className="text-gray-600">{appId.substring(0, 2).toUpperCase()}</div>;
    }
  };

  return (
    <div className={`${getSizeClass(size)} ${bgColor} flex items-center justify-center rounded-full`}>
      {renderIcon()}
    </div>
  );
};

function getSizeClass(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm": return "w-8 h-8";
    case "lg": return "w-12 h-12";
    case "md":
    default:
      return "w-10 h-10";
  }
}

export default AppIconMap;

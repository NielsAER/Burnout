import { FC, useState } from "react";
import { APPS, TRIGGER_APPS, ACTION_APPS } from "@/lib/constants";
import AppIconMap from "@/components/automation/AppIconMap";
import { useDrag } from "react-dnd";
import { AppId } from "@/lib/constants";
import { ArrowRight, Search, Zap, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

// Define drag types locally (must match the ones in BuilderCanvas)
const ITEM_TYPES = {
  APP: "app",
  ACTION: "action"
};

interface AppSelectorProps {
  onSelectTrigger: (appId: string) => void;
  onSelectAction: (appId: string) => void;
}

// Draggable App Component
interface DraggableAppProps {
  appId: string;
  type: 'trigger' | 'action';
  onClick: () => void;
}

const DraggableApp: FC<DraggableAppProps> = ({ appId, type, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPES.APP,
    item: { id: appId, type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  const app = APPS[appId as AppId];
  
  return (
    <div
      ref={drag}
      className={`p-2 bg-gray-50 dark:bg-[#181818] rounded border ${isDragging ? 'border-primary dark:border-blue-600 shadow-md' : 'border-gray-200 dark:border-[#2a2a2a]'} 
                 flex items-center cursor-move hover:bg-gray-100 dark:hover:bg-[#21212b] transition-all duration-200
                 ${isDragging ? 'opacity-50 ring-2 ring-primary/20 dark:ring-blue-600/20' : 'opacity-100'}`}
      onClick={onClick}
    >
      <AppIconMap appId={appId} />
      <span className="ml-2 text-sm flex-1 text-gray-900 dark:text-gray-300">{app.name}</span>
      <ArrowRight className="h-3.5 w-3.5 text-gray-400 ml-1.5" />
    </div>
  );
};

// Categories for services
const CATEGORIES = {
  COMMUNICATION: "Communication",
  PRODUCTIVITY: "Productivity",
  AI: "AI Services",
  SOCIAL: "Social Media",
  ANALYTICS: "Analytics",
  OTHER: "Other"
};

// Helper to get category for an app
const getAppCategory = (appId: string): string => {
  // Map apps to categories (simplified for demo)
  const categoryMap: Record<string, string> = {
    gmail: CATEGORIES.COMMUNICATION,
    slack: CATEGORIES.COMMUNICATION,
    discord: CATEGORIES.COMMUNICATION,
    openai: CATEGORIES.AI,
    anthropic: CATEGORIES.AI,
    perplexity: CATEGORIES.AI,
    ollama: CATEGORIES.AI,
    instagram: CATEGORIES.SOCIAL,
    twitter: CATEGORIES.SOCIAL,
    linkedin: CATEGORIES.SOCIAL,
    google: CATEGORIES.PRODUCTIVITY,
    github: CATEGORIES.PRODUCTIVITY,
    stripe: CATEGORIES.PRODUCTIVITY,
    sheets: CATEGORIES.PRODUCTIVITY,
    analytics: CATEGORIES.ANALYTICS
  };
  
  return categoryMap[appId] || CATEGORIES.OTHER;
};

const AppSelector: FC<AppSelectorProps> = ({ onSelectTrigger, onSelectAction }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"triggers" | "actions">("triggers");
  
  // Filter apps based on search term
  const filteredTriggerApps = TRIGGER_APPS.filter(appId => {
    const app = APPS[appId as AppId];
    return app.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const filteredActionApps = ACTION_APPS.filter(appId => {
    const app = APPS[appId as AppId];
    return app.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Group apps by category
  const triggerAppsByCategory = filteredTriggerApps.reduce<Record<string, string[]>>((acc, appId) => {
    const category = getAppCategory(appId);
    if (!acc[category]) acc[category] = [];
    acc[category].push(appId);
    return acc;
  }, {});
  
  const actionAppsByCategory = filteredActionApps.reduce<Record<string, string[]>>((acc, appId) => {
    const category = getAppCategory(appId);
    if (!acc[category]) acc[category] = [];
    acc[category].push(appId);
    return acc;
  }, {});
  
  return (
    <div className="w-72 border-r border-gray-200 dark:border-[#2a2a2a] pr-4">
      {/* Search input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search apps..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-sm bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#2a2a2a] dark:placeholder:text-gray-500"
        />
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "triggers" | "actions")}>
        <TabsList className="w-full mb-4 dark:bg-[#1f1f1f]">
          <TabsTrigger value="triggers" className="flex-1 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#181818]">
            <Zap className="h-4 w-4" />
            Triggers
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex-1 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#181818]">
            <Layers className="h-4 w-4" />
            Actions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="triggers" className="m-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Drag or click an app to add as a trigger
          </p>
          <ScrollArea className="h-[calc(100vh-280px)] pr-3">
            {Object.entries(triggerAppsByCategory).map(([category, appIds]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {appIds.map(appId => (
                    <DraggableApp
                      key={`trigger-${appId}`}
                      appId={appId}
                      type="trigger"
                      onClick={() => onSelectTrigger(appId)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(triggerAppsByCategory).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No matching triggers found</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="actions" className="m-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Drag or click an app to add as an action
          </p>
          <ScrollArea className="h-[calc(100vh-280px)] pr-3">
            {Object.entries(actionAppsByCategory).map(([category, appIds]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {appIds.map(appId => (
                    <DraggableApp
                      key={`action-${appId}`}
                      appId={appId}
                      type="action"
                      onClick={() => onSelectAction(appId)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(actionAppsByCategory).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No matching actions found</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppSelector;

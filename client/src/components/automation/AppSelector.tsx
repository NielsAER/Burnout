import { FC, useState } from "react";
import { APPS, TRIGGER_APPS, ACTION_APPS } from "@/lib/constants";
import AppIconMap from "@/components/automation/AppIconMap";
import { useDrag } from "react-dnd";
import { AppId } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

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
      className={`p-2 bg-gray-50 rounded border ${isDragging ? 'border-primary shadow-md' : 'border-gray-200'} 
                 flex items-center cursor-move hover:bg-gray-100 transition-all duration-200
                 ${isDragging ? 'opacity-50 ring-2 ring-primary/20' : 'opacity-100'}`}
      onClick={onClick}
    >
      <AppIconMap appId={appId} />
      <span className="ml-2 text-sm flex-1">{app.name}</span>
      <ArrowRight className="h-3.5 w-3.5 text-gray-400 ml-1.5" />
    </div>
  );
};

const AppSelector: FC<AppSelectorProps> = ({ onSelectTrigger, onSelectAction }) => {
  return (
    <div className="w-64 border-r border-gray-200 pr-4">
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
          Triggers
        </h4>
        <p className="text-xs text-gray-500 mb-2">Drag or click to add a trigger</p>
        <div className="space-y-2">
          {TRIGGER_APPS.map(appId => (
            <DraggableApp
              key={`trigger-${appId}`}
              appId={appId}
              type="trigger"
              onClick={() => onSelectTrigger(appId)}
            />
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          Actions
        </h4>
        <p className="text-xs text-gray-500 mb-2">Drag or click to add an action</p>
        <div className="space-y-2">
          {ACTION_APPS.map(appId => (
            <DraggableApp
              key={`action-${appId}`}
              appId={appId}
              type="action"
              onClick={() => onSelectAction(appId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppSelector;

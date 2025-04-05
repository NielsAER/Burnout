import { FC } from "react";
import { APPS, TRIGGER_APPS, ACTION_APPS } from "@/lib/constants";
import AppIconMap from "@/components/automation/AppIconMap";

interface AppSelectorProps {
  onSelectTrigger: (appId: string) => void;
  onSelectAction: (appId: string) => void;
}

const AppSelector: FC<AppSelectorProps> = ({ onSelectTrigger, onSelectAction }) => {
  return (
    <div className="w-64 border-r border-gray-200 pr-4">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Triggers</h4>
        <div className="space-y-2">
          {TRIGGER_APPS.map(appId => {
            const app = APPS[appId];
            return (
              <div
                key={`trigger-${appId}`}
                className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center cursor-pointer hover:bg-gray-100"
                onClick={() => onSelectTrigger(appId)}
              >
                <AppIconMap appId={appId} />
                <span className="ml-2 text-sm">{app.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
        <div className="space-y-2">
          {ACTION_APPS.map(appId => {
            const app = APPS[appId];
            return (
              <div
                key={`action-${appId}`}
                className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center cursor-pointer hover:bg-gray-100"
                onClick={() => onSelectAction(appId)}
              >
                <AppIconMap appId={appId} />
                <span className="ml-2 text-sm">{app.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppSelector;

import { FC } from "react";
import { ArrowDown, PlusIcon, Settings, X } from "lucide-react";
import AppIconMap from "@/components/automation/AppIconMap";
import { APPS } from "@/lib/constants";

type BuilderStep = {
  id: string;
  type: "trigger" | "action";
  appId: string;
  config: Record<string, any>;
};

interface BuilderCanvasProps {
  trigger: BuilderStep | null;
  action: BuilderStep | null;
  onRemoveTrigger: () => void;
  onRemoveAction: () => void;
}

const BuilderCanvas: FC<BuilderCanvasProps> = ({
  trigger,
  action,
  onRemoveTrigger,
  onRemoveAction
}) => {
  const renderDropZone = (type: "trigger" | "action", step: BuilderStep | null, onRemove: () => void) => {
    if (!step) {
      return (
        <div className="drop-zone w-full mb-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
          <div className="p-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <PlusIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500">Drag a {type} here</p>
          </div>
        </div>
      );
    }

    const appDetails = APPS[step.appId] || {
      name: step.appId,
      description: `${type === "trigger" ? "When this happens..." : "Do this..."}`
    };

    return (
      <div className="workflow-step w-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center mb-3">
          <AppIconMap appId={step.appId} />
          <div className="ml-3">
            <h4 className="text-sm font-medium">{appDetails.name}</h4>
            <p className="text-xs text-gray-500">
              {type === "trigger" ? "When this happens..." : "Do this..."}
            </p>
          </div>
          <button className="ml-auto text-gray-400 hover:text-gray-600" aria-label="Configure">
            <Settings className="h-4 w-4" />
          </button>
          <button 
            className="ml-2 text-gray-400 hover:text-red-500" 
            onClick={onRemove}
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 italic">Click to configure...</div>
      </div>
    );
  };

  return (
    <div className="flex-1">
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 min-h-[400px] relative flex flex-col items-center">
        {/* Title Text if no trigger or action */}
        {!trigger && !action && (
          <div className="text-center text-sm text-gray-500 mb-6 w-full">
            <p>Start by adding a trigger</p>
          </div>
        )}
        
        {/* Trigger Drop Zone */}
        {renderDropZone("trigger", trigger, onRemoveTrigger)}
        
        {/* Connector */}
        <div className="h-8 w-px bg-gray-300 relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-primary">
            <ArrowDown className="h-3 w-3 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
        
        {/* Action Drop Zone */}
        {renderDropZone("action", action, onRemoveAction)}
      </div>
    </div>
  );
};

export default BuilderCanvas;

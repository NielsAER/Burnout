import { FC } from "react";
import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import AppIconMap from "@/components/automation/AppIconMap";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TemplateCardProps {
  template: Template;
}

const TemplateCard: FC<TemplateCardProps> = ({ template }) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { id, name, description, triggerAppId, actionAppId, templateConfig } = template;

  const createFromTemplateMutation = useMutation({
    mutationFn: async () => {
      const automationData = {
        name,
        active: true,
        triggerAppId,
        triggerConfig: templateConfig.triggerOptions || {},
        actionAppId,
        actionConfig: templateConfig.actionOptions || {}
      };
      
      return await apiRequest("POST", "/api/automations", automationData);
    },
    onSuccess: () => {
      toast({
        title: "Template applied",
        description: `"${name}" automation has been created`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      navigate("/automations");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to apply template",
        description: error.message || "Please try again.",
      });
    }
  });

  const handleUseTemplate = () => {
    createFromTemplateMutation.mutate();
  };

  return (
    <div className="border border-[#2a2a2a] bg-[#181818] rounded-sm overflow-hidden hover:shadow-sm transition">
      <div className="px-4 py-3 bg-[#1f1f1f] border-b border-[#2a2a2a]">
        <h3 className="text-sm font-medium text-white">{name}</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center mb-3">
          <AppIconMap appId={triggerAppId} size="sm" />
          <div className="mx-2 text-gray-400">
            <ArrowRightIcon className="h-3 w-3" />
          </div>
          <AppIconMap appId={actionAppId} size="sm" />
        </div>
        <p className="text-xs text-gray-400">{description}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full text-blue-400 border-blue-900 hover:bg-blue-900/20 hover:text-blue-300"
          onClick={handleUseTemplate}
          disabled={createFromTemplateMutation.isPending}
        >
          {createFromTemplateMutation.isPending ? "Creating..." : "Use Template"}
        </Button>
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

export default TemplateCard;

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { HelpCircle, Wand2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppId } from "@/lib/constants";

interface AIPromptConfigProps {
  serviceId: AppId;
  onSave: (config: AIPromptConfigType) => void;
  initialConfig?: AIPromptConfigType;
}

export type AIPromptConfigType = {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  additionalInstructions?: string;
  promptTemplate?: string;
};

const AIPromptConfig: React.FC<AIPromptConfigProps> = ({ 
  serviceId, 
  onSave, 
  initialConfig = {
    prompt: "",
    model: "",
    temperature: 0.7,
    maxTokens: 500,
    systemMessage: "",
    additionalInstructions: "",
    promptTemplate: ""
  } 
}) => {
  const [config, setConfig] = useState<AIPromptConfigType>(initialConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setConfig({ ...config, [name]: value });
  };

  const handleSliderChange = (name: string, value: number[]) => {
    setConfig({ ...config, [name]: value[0] });
  };

  const handleSave = () => {
    onSave(config);
  };

  const getModelOptions = () => {
    switch (serviceId) {
      case "openai":
        return [
          { value: "gpt-4o", label: "GPT-4o (Most Capable)" },
          { value: "gpt-4", label: "GPT-4" },
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Fastest)" }
        ];
      case "anthropic":
        return [
          { value: "claude-3-7-sonnet-20250219", label: "Claude 3 Sonnet (Latest)" },
          { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Fast)" },
          { value: "claude-2.1", label: "Claude 2.1" }
        ];
      case "perplexity":
        return [
          { value: "llama-3.1-sonar-small-128k-online", label: "Llama 3.1 Sonar Small" },
          { value: "llama-3.1-sonar-large-128k-online", label: "Llama 3.1 Sonar Large" },
          { value: "mixtral-8x7b-instruct", label: "Mixtral 8x7B" }
        ];
      case "ollama":
        return [
          { value: "llama3", label: "Llama 3" },
          { value: "llama2", label: "Llama 2" },
          { value: "mistral", label: "Mistral" },
          { value: "mixtral", label: "Mixtral" }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt" className="text-sm font-medium">
          Prompt
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 ml-1 inline text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Your main instruction to the AI model. Be specific to get better results.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Textarea
          id="prompt"
          name="prompt"
          value={config.prompt}
          onChange={handleChange}
          placeholder={`Enter your prompt for ${serviceId}...`}
          className="mt-1 min-h-[120px]"
        />
      </div>

      <div>
        <Label htmlFor="model" className="text-sm font-medium">Model</Label>
        <Select
          value={config.model}
          onValueChange={(value) => handleSelectChange('model', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {getModelOptions().map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="temperature" className="text-sm font-medium">
            Temperature: {config.temperature?.toFixed(1)}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 ml-1 inline text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Controls randomness: lower values are more deterministic, higher values more creative.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
        </div>
        <Slider
          id="temperature" 
          defaultValue={[config.temperature || 0.7]} 
          max={1} 
          min={0} 
          step={0.1}
          onValueChange={(value) => handleSliderChange('temperature', value)}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full mt-2"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "Hide" : "Show"} Advanced Options
      </Button>

      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <div>
            <Label htmlFor="maxTokens" className="text-sm font-medium">
              Max Tokens: {config.maxTokens}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 inline text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Maximum number of tokens in the response. Higher values allow longer responses.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Slider
              id="maxTokens" 
              defaultValue={[config.maxTokens || 500]} 
              max={2000} 
              min={50} 
              step={50}
              onValueChange={(value) => handleSliderChange('maxTokens', value)}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Shorter</span>
              <span>Longer</span>
            </div>
          </div>

          {(serviceId === "openai" || serviceId === "anthropic") && (
            <div>
              <Label htmlFor="systemMessage" className="text-sm font-medium">
                System Message
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-1 inline text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Instructions that define the AI's behavior and capabilities.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Textarea
                id="systemMessage"
                name="systemMessage"
                value={config.systemMessage}
                onChange={handleChange}
                placeholder="You are a helpful assistant..."
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="promptTemplate" className="text-sm font-medium">
              Prompt Template
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 inline text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Template with variables for dynamic prompts. Use {"{{variable}}"} syntax for placeholders.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Textarea
              id="promptTemplate"
              name="promptTemplate"
              value={config.promptTemplate}
              onChange={handleChange}
              placeholder="Analyze the following {{content_type}}: {{content}}"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="additionalInstructions" className="text-sm font-medium">
              Additional Instructions
            </Label>
            <Textarea
              id="additionalInstructions"
              name="additionalInstructions"
              value={config.additionalInstructions}
              onChange={handleChange}
              placeholder="Any additional instructions or constraints..."
              className="mt-1"
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        className="w-full flex items-center justify-center"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Save Configuration
      </Button>
    </div>
  );
};

export default AIPromptConfig;
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getApiKeyDocumentationUrl } from "@/lib/apiKeyUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ExternalLinkIcon, InfoIcon, KeyIcon, ShieldIcon, ServerIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Settings() {
  const { toast } = useToast();
  
  type ApiKeyType = {
    openai: string;
    anthropic: string;
    perplexity: string;
    ollama: string;
    [key: string]: string; // Add index signature
  };

  const [apiKeys, setApiKeys] = useState<ApiKeyType>({
    openai: "",
    anthropic: "",
    perplexity: "",
    ollama: "http://localhost:11434", // Default Ollama URL
  });

  // Load saved API keys on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem("api_keys");
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(prevKeys => ({
          ...prevKeys,
          ...parsedKeys
        }));
      } catch (error) {
        console.error("Error parsing saved API keys:", error);
        // No need to show toast for this error as it's not user-facing
      }
    }
  }, []);

  const saveApiKeys = () => {
    try {
      localStorage.setItem("api_keys", JSON.stringify(apiKeys));
      toast({
        title: "Settings saved",
        description: "Your API keys have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast({
        title: "Error saving settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (service: string, value: string) => {
    setApiKeys(prevKeys => ({
      ...prevKeys,
      [service]: value
    }));
  };

  const openDocumentation = (service: string) => {
    const url = getApiKeyDocumentationUrl(service);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container py-6 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Configure your FlowConnect settings and API keys
        </p>
      </header>

      <Tabs defaultValue="api-keys" className="space-y-8">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <KeyIcon className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <ServerIcon className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Service API Keys</CardTitle>
              <CardDescription>
                Add your API keys to enable AI features. Your keys are stored locally and never sent to our servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openai-key" className="font-medium flex items-center gap-2">
                    OpenAI API Key
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Required for GPT-4o text analysis, DALL-E image generation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 gap-1 text-xs"
                    onClick={() => openDocumentation("openai")}
                  >
                    Get Key <ExternalLinkIcon className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKeys.openai}
                  onChange={(e) => handleInputChange("openai", e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="anthropic-key" className="font-medium flex items-center gap-2">
                    Anthropic API Key
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Required for Claude AI text analysis and entity extraction</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 gap-1 text-xs"
                    onClick={() => openDocumentation("anthropic")}
                  >
                    Get Key <ExternalLinkIcon className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKeys.anthropic}
                  onChange={(e) => handleInputChange("anthropic", e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="perplexity-key" className="font-medium flex items-center gap-2">
                    Perplexity API Key
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Required for web search and research capabilities</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 gap-1 text-xs"
                    onClick={() => openDocumentation("perplexity")}
                  >
                    Get Key <ExternalLinkIcon className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id="perplexity-key"
                  type="password"
                  placeholder="pplx-..."
                  value={apiKeys.perplexity}
                  onChange={(e) => handleInputChange("perplexity", e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ollama-url" className="font-medium flex items-center gap-2">
                    Ollama URL
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">URL for local Ollama instance (default: http://localhost:11434)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 gap-1 text-xs"
                    onClick={() => openDocumentation("ollama")}
                  >
                    Learn More <ExternalLinkIcon className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id="ollama-url"
                  type="text"
                  placeholder="http://localhost:11434"
                  value={apiKeys.ollama}
                  onChange={(e) => handleInputChange("ollama", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveApiKeys} className="ml-auto">
                Save API Keys
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  defaultValue="User"
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  defaultValue="user@example.com"
                  placeholder="Your email"
                  type="email"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save Account Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="UTC"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                  <option value="Europe/Paris">Central European Time (CET)</option>
                  <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save General Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
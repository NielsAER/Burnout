import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, Bot, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CustomerAIServices() {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState("");
  const [currentTab, setCurrentTab] = useState("text-analysis");
  
  const {
    data: apiKeysStatus,
    isLoading: isCheckingKeys,
  } = useQuery({
    queryKey: ["/api/settings/api-keys-status"],
  });

  const textAnalysisMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/ai/text-analysis", { text });
      return res.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to analyze text. Please try again.",
        variant: "destructive",
      });
    },
  });

  const chatCompletionMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/ai/chat", { message });
      return res.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    if (currentTab === "text-analysis") {
      textAnalysisMutation.mutate(textInput);
    } else if (currentTab === "chat") {
      chatCompletionMutation.mutate(textInput);
    }
  };

  const renderServiceCard = (
    title: string,
    description: string,
    provider: string,
    status: boolean | undefined,
    isLoading: boolean
  ) => (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm">
          <span className="font-medium">Provider:</span> {provider}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : status ? (
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Available
            </div>
          ) : (
            <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Not available in customer portal
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  const getAvailableServices = () => {
    if (!apiKeysStatus || isCheckingKeys) return [];
    
    const services = [];
    
    if (apiKeysStatus.services.openai?.hasKey) {
      services.push("openai");
    }
    
    if (apiKeysStatus.services.anthropic?.hasKey) {
      services.push("anthropic");
    }
    
    return services;
  };

  const availableServices = getAvailableServices();
  const hasAvailableServices = availableServices.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Services</h1>
        <p className="text-muted-foreground">
          Access advanced AI tools to help analyze and generate content
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderServiceCard(
          "OpenAI",
          "GPT language models for text generation and analysis",
          "OpenAI",
          apiKeysStatus?.services.openai?.hasKey,
          isCheckingKeys
        )}
        
        {renderServiceCard(
          "Anthropic Claude",
          "Claude models for advanced reasoning and text generation",
          "Anthropic",
          apiKeysStatus?.services.anthropic?.hasKey,
          isCheckingKeys
        )}
        
        {renderServiceCard(
          "Perplexity",
          "Perplexity AI for real-time information retrieval",
          "Perplexity AI",
          apiKeysStatus?.services.perplexity?.hasKey,
          isCheckingKeys
        )}
      </div>

      {hasAvailableServices ? (
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="pt-4"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="text-analysis">Text Analysis</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text-analysis" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Text Analysis
                </CardTitle>
                <CardDescription>
                  Analyze text to extract insights, sentiment, and key information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text to analyze..."
                    className="min-h-32"
                  />
                  <Button 
                    type="submit" 
                    disabled={!textInput.trim() || textAnalysisMutation.isPending}
                    className="w-full"
                  >
                    {textAnalysisMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Analyze Text
                  </Button>
                </form>
                
                {textAnalysisMutation.data && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Analysis Results</h3>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-sm whitespace-pre-wrap">
                        {typeof textAnalysisMutation.data === 'string' 
                          ? textAnalysisMutation.data 
                          : JSON.stringify(textAnalysisMutation.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  AI Chat Assistant
                </CardTitle>
                <CardDescription>
                  Chat with an AI assistant to get help or generate content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-32"
                  />
                  <Button 
                    type="submit" 
                    disabled={!textInput.trim() || chatCompletionMutation.isPending}
                    className="w-full"
                  >
                    {chatCompletionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Message
                  </Button>
                </form>
                
                {chatCompletionMutation.data && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Response</h3>
                    <div className="rounded-md bg-muted p-4">
                      <div className="text-sm whitespace-pre-wrap">
                        {typeof chatCompletionMutation.data === 'string' 
                          ? chatCompletionMutation.data 
                          : chatCompletionMutation.data.message || JSON.stringify(chatCompletionMutation.data, null, 2)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No AI Services Available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no AI services currently enabled. Please contact your administrator to enable AI services.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoIcon, SparklesIcon, ImageIcon, TextIcon, SearchIcon } from "lucide-react";
import { Link } from "wouter";
import { TextAnalyzer } from "@/components/llm/TextAnalyzer";
import { WebSearch } from "@/components/llm/WebSearch";
import { useEffect, useState } from "react";
import { checkApiKeyAvailability } from "@/lib/apiKeyUtils";

export default function AIServices() {
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const [hasAnthropic, setHasAnthropic] = useState(false);
  const [hasPerplexity, setHasPerplexity] = useState(false);
  const [hasOllama, setHasOllama] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiKeys = async () => {
      setLoading(true);
      const openaiAvailable = await checkApiKeyAvailability('openai');
      const anthropicAvailable = await checkApiKeyAvailability('anthropic');
      const perplexityAvailable = await checkApiKeyAvailability('perplexity');
      const ollamaAvailable = await checkApiKeyAvailability('ollama');
      
      setHasOpenAI(openaiAvailable);
      setHasAnthropic(anthropicAvailable);
      setHasPerplexity(perplexityAvailable);
      setHasOllama(ollamaAvailable);
      setLoading(false);
    };

    checkApiKeys();
  }, []);

  return (
    <div className="container py-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Services</h1>
        <p className="text-muted-foreground text-lg">
          Integrate powerful AI capabilities into your automations
        </p>
      </header>

      {(!hasOpenAI && !hasAnthropic && !hasPerplexity && !hasOllama) && !loading ? (
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>No API keys configured</AlertTitle>
          <AlertDescription>
            To use AI services, you need to configure API keys in the settings. 
            <Button asChild variant="link" className="h-auto p-0 ml-2">
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="text-analysis" className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TabsTrigger value="text-analysis" className="flex gap-2 data-[state=active]:bg-primary/10">
            <TextIcon className="h-4 w-4" />
            Text Analysis
          </TabsTrigger>
          <TabsTrigger value="image-generation" className="flex gap-2" disabled={!hasOpenAI}>
            <ImageIcon className="h-4 w-4" />
            Image Generation
          </TabsTrigger>
          <TabsTrigger value="search" className="flex gap-2" disabled={!hasPerplexity}>
            <SearchIcon className="h-4 w-4" />
            Web Search
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex gap-2">
            <SparklesIcon className="h-4 w-4" />
            LLM Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text-analysis" className="space-y-4">
          <div className="grid place-items-center py-4">
            <TextAnalyzer />
          </div>
        </TabsContent>

        <TabsContent value="image-generation" className="py-4">
          <div className="grid place-items-center">
            <Card className="w-full max-w-3xl">
              <CardHeader>
                <CardTitle>Image Generation</CardTitle>
              </CardHeader>
              <CardContent className="py-4 text-center">
                <p className="text-muted-foreground">
                  Coming soon! Generate images with DALL-E from OpenAI
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="py-4">
          <div className="grid place-items-center">
            {!hasPerplexity ? (
              <Card className="w-full max-w-3xl">
                <CardHeader>
                  <CardTitle>Web Search</CardTitle>
                </CardHeader>
                <CardContent className="py-4 text-center">
                  <Alert className="mb-4">
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Perplexity API Key Required</AlertTitle>
                    <AlertDescription>
                      To use web search capabilities, you need to configure a Perplexity API key in the settings.
                      <Button asChild variant="link" className="h-auto p-0 ml-2">
                        <Link to="/settings">Go to Settings</Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                  <p className="text-muted-foreground">
                    Research and retrieve information from the web with Perplexity
                  </p>
                </CardContent>
              </Card>
            ) : (
              <WebSearch />
            )}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Text Summarization</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Create concise summaries of long-form content for easy consumption
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button variant="outline" className="w-full" disabled={!hasAnthropic}>
                  {hasAnthropic ? "Use in Automations" : "Requires Anthropic API Key"}
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Content Rewriting</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Rewrite content to match a specific tone, style, or format
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button variant="outline" className="w-full" disabled={!hasAnthropic && !hasOpenAI}>
                  {hasAnthropic || hasOpenAI ? "Use in Automations" : "Requires API Key"}
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Content Generation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Generate new content based on your specifications and requirements
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button variant="outline" className="w-full" disabled={!hasOpenAI && !hasAnthropic}>
                  {hasOpenAI || hasAnthropic ? "Use in Automations" : "Requires API Key"}
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Translation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Translate content between multiple languages while preserving context
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button variant="outline" className="w-full">
                  Use in Automations
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Determine the sentiment and emotional tone of text content
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button variant="outline" className="w-full" disabled={!hasOpenAI}>
                  {hasOpenAI ? "Use in Automations" : "Requires OpenAI API Key"}
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Entity Extraction</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Extract people, organizations, locations, and other entities from text
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button variant="outline" className="w-full" disabled={!hasAnthropic}>
                  {hasAnthropic ? "Use in Automations" : "Requires Anthropic API Key"}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Languages, MessageCircleHeart, ListTree, Building, BookOpen, LanguagesIcon, Globe } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLLMServices } from "@/hooks/use-llm-services";
import { checkApiKeyAvailability, getApiKeyErrorMessage } from "@/lib/apiKeyUtils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

type AnalysisType = 
  | "sentiment" 
  | "summary" 
  | "keywords" 
  | "entities" 
  | "topics" 
  | "language-detection"
  | "translate";

interface AnalysisOption {
  id: AnalysisType;
  name: string;
  description: string;
  provider: "openai" | "anthropic" | "ollama" | "perplexity" | "text-processor";
  icon: React.ReactNode;
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: "sentiment",
    name: "Sentiment Analysis",
    description: "Detect the sentiment and emotion in text",
    provider: "openai",
    icon: <MessageCircleHeart className="h-4 w-4" />
  },
  {
    id: "summary",
    name: "Summarization",
    description: "Create a concise summary of longer text",
    provider: "anthropic",
    icon: <ListTree className="h-4 w-4" />
  },
  {
    id: "keywords",
    name: "Extract Keywords",
    description: "Extract key phrases and concepts from text",
    provider: "ollama",
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: "entities",
    name: "Entity Extraction",
    description: "Identify people, places, organizations in text",
    provider: "anthropic",
    icon: <Building className="h-4 w-4" />
  },
  {
    id: "topics",
    name: "Topic Analysis",
    description: "Identify main topics discussed in text",
    provider: "perplexity",
    icon: <BookOpen className="h-4 w-4" />
  },
  {
    id: "language-detection",
    name: "Language Detection",
    description: "Detect the language of the text",
    provider: "openai",
    icon: <LanguagesIcon className="h-4 w-4" />
  },
  {
    id: "translate",
    name: "Translation",
    description: "Translate text to another language",
    provider: "text-processor",
    icon: <Globe className="h-4 w-4" />
  }
];

const LANGUAGES = [
  "Spanish", "French", "German", "Italian", "Portuguese", "Russian", 
  "Japanese", "Chinese", "Korean", "Arabic", "Hindi", "Dutch"
];

export function TextAnalyzer() {
  const [inputText, setInputText] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("sentiment");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const { 
    analyzeTextOpenAI, 
    analyzeTextAnthropic, 
    analyzeTextOllama,
    analyzeTopic,
    translateText 
  } = useLLMServices();

  const selectedOption = ANALYSIS_OPTIONS.find(option => option.id === analysisType);

  const analyzeText = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check if API key is available for the selected analysis type
      const provider = selectedOption?.provider || "openai";
      const hasApiKey = await checkApiKeyAvailability(provider);
      
      if (!hasApiKey) {
        setError(getApiKeyErrorMessage(provider));
        setLoading(false);
        return;
      }

      let response;
      switch (analysisType) {
        case "sentiment":
          response = await analyzeTextOpenAI(inputText, "sentiment_analysis");
          setResult(response.result);
          break;
        
        case "summary":
          response = await analyzeTextAnthropic(inputText, "summarize");
          setResult({ summary: response.result.summary });
          break;
        
        case "keywords":
          response = await analyzeTextOllama(inputText, "extract_keywords");
          setResult({ keywords: Array.isArray(response.result) ? response.result : response.result.keywords });
          break;
        
        case "entities":
          response = await analyzeTextAnthropic(inputText, "extract_entities");
          setResult(response.result);
          break;
        
        case "topics":
          response = await analyzeTopic(inputText);
          setResult({ topics: response.text.split('\n\n')[0], analysis: response.text.split('\n\n')[1] });
          break;
        
        case "language-detection":
          response = await analyzeTextOpenAI(inputText, "language_detection");
          setResult({ language: response.result.language, confidence: response.result.confidence });
          break;
        
        case "translate":
          response = await translateText(inputText, targetLanguage);
          setResult({ translated: response.processedText });
          break;
        
        default:
          setError("Unknown analysis type");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  const renderResultSection = () => {
    if (error) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!result) {
      return null;
    }

    const renderContent = () => {
      switch (analysisType) {
        case "sentiment":
          return (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium">Sentiment:</span>
                <Badge variant={
                  result.sentiment === "positive" ? "default" : 
                  result.sentiment === "negative" ? "destructive" : 
                  "outline"
                }>
                  {result.sentiment || "Unknown"}
                </Badge>
              </div>
              {result.confidence && (
                <div>
                  <span className="text-lg font-medium">Confidence: </span>
                  <span>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              )}
              {result.emotions && (
                <div className="space-y-2">
                  <span className="text-lg font-medium">Emotions:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.emotions).map(([emotion, score]: [string, any]) => (
                      <Badge key={emotion} variant="outline">
                        {emotion}: {(score * 100).toFixed(0)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
          
        case "summary":
          return (
            <div className="space-y-4">
              <span className="text-lg font-medium">Summary:</span>
              <p className="whitespace-pre-wrap">{result.summary}</p>
            </div>
          );
          
        case "keywords":
          return (
            <div className="space-y-4">
              <span className="text-lg font-medium">Keywords:</span>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(result.keywords) ? 
                  result.keywords.map((keyword: string, index: number) => (
                    <Badge key={index}>{keyword}</Badge>
                  )) : 
                  <p>No keywords found</p>
                }
              </div>
            </div>
          );
          
        case "entities":
          return (
            <div className="space-y-4">
              <span className="text-lg font-medium">Extracted Entities:</span>
              <Tabs defaultValue="people">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="people">People</TabsTrigger>
                  <TabsTrigger value="organizations">Organizations</TabsTrigger>
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
                <TabsContent value="people" className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {result.people && result.people.length > 0 ? 
                      result.people.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">{item}</Badge>
                      )) : 
                      <p className="text-muted-foreground">No people found</p>
                    }
                  </div>
                </TabsContent>
                <TabsContent value="organizations" className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {result.organizations && result.organizations.length > 0 ? 
                      result.organizations.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">{item}</Badge>
                      )) : 
                      <p className="text-muted-foreground">No organizations found</p>
                    }
                  </div>
                </TabsContent>
                <TabsContent value="locations" className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {result.locations && result.locations.length > 0 ? 
                      result.locations.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">{item}</Badge>
                      )) : 
                      <p className="text-muted-foreground">No locations found</p>
                    }
                  </div>
                </TabsContent>
                <TabsContent value="other" className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {result.other && result.other.length > 0 ? 
                      result.other.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">{item}</Badge>
                      )) : 
                      <p className="text-muted-foreground">No other entities found</p>
                    }
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          );
          
        case "topics":
          return (
            <div className="space-y-4">
              <span className="text-lg font-medium">Main Topics:</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {result.topics ? (
                  <p className="whitespace-pre-wrap">{result.topics}</p>
                ) : (
                  <p className="text-muted-foreground">No topics found</p>
                )}
              </div>
              {result.analysis && (
                <>
                  <span className="text-lg font-medium">Analysis:</span>
                  <p className="whitespace-pre-wrap">{result.analysis}</p>
                </>
              )}
            </div>
          );
          
        case "language-detection":
          return (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium">Detected Language:</span>
                <Badge>{result.language || "Unknown"}</Badge>
              </div>
              {result.confidence && (
                <div>
                  <span className="text-lg font-medium">Confidence: </span>
                  <span>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          );
          
        case "translate":
          return (
            <div className="space-y-4">
              <span className="text-lg font-medium">Translation ({targetLanguage}):</span>
              <p className="whitespace-pre-wrap">{result.translated}</p>
            </div>
          );
          
        default:
          return <p>No result to display</p>;
      }
    };

    return (
      <div className="mt-6 p-4 border rounded-md bg-muted/50">
        <h3 className="font-semibold text-lg mb-4">Results</h3>
        {renderContent()}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Text Analysis</span>
          <Badge variant="outline" className="ml-2">
            Beta
          </Badge>
        </CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="md:w-3/4">
            <Select
              value={analysisType}
              onValueChange={(value) => setAnalysisType(value as AnalysisType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                {ANALYSIS_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center">
                      {option.icon}
                      <span className="ml-2">{option.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedOption?.description}
            </p>
          </div>
          
          {analysisType === "translate" && (
            <div className="md:w-1/4">
              <Select
                value={targetLanguage}
                onValueChange={setTargetLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Target language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Target language
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter text to analyze..."
          className="min-h-[200px] resize-none"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        {renderResultSection()}
      </CardContent>
      <CardFooter className="justify-between border-t px-6 py-4">
        <div className="text-sm text-muted-foreground">
          Powered by {selectedOption?.provider === "text-processor" ? "Text Processor" : selectedOption?.provider}
        </div>
        <Button onClick={analyzeText} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Text
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
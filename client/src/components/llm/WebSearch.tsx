import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLLMServices } from "@/hooks/use-llm-services";
import { Loader2, SearchIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function WebSearch() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"search" | "research" | "analyze">("search");
  const [searchRecency, setSearchRecency] = useState<"day" | "week" | "month">("week");
  const [result, setResult] = useState<{ text: string; citations?: string[] } | null>(null);
  const { 
    loading, 
    error,
    // Using OpenAI search functions instead of Perplexity
    performSearchOpenAI,
    researchQuestionOpenAI,
    analyzeTopicOpenAI
  } = useLLMServices();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    try {
      let searchResult;
      
      switch (searchType) {
        case "search":
          searchResult = await performSearchOpenAI(query, {
            maxTokens: 1000
          });
          break;
        case "research":
          searchResult = await researchQuestionOpenAI(query, {
            maxTokens: 1000
          });
          break;
        case "analyze":
          searchResult = await analyzeTopicOpenAI(query, {
            maxTokens: 1000
          });
          break;
      }
      
      setResult(searchResult);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="search">Basic Search</SelectItem>
                  <SelectItem value="research">Research Question</SelectItem>
                  <SelectItem value="analyze">Analyze Topic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="searchRecency">Time Period</Label>
              <Select value={searchRecency} onValueChange={(value: any) => setSearchRecency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 hours</SelectItem>
                  <SelectItem value="week">Last week</SelectItem>
                  <SelectItem value="month">Last month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="query">
                {searchType === "search" 
                  ? "Search Query" 
                  : searchType === "research" 
                  ? "Research Question" 
                  : "Topic to Analyze"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="query"
                  placeholder={
                    searchType === "search"
                      ? "Enter your search query..."
                      : searchType === "research"
                      ? "Enter your research question..."
                      : "Enter topic to analyze..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <SearchIcon className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="whitespace-pre-wrap text-sm">{result.text}</div>
            
            {result.citations && result.citations.length > 0 && (
              <div className="mt-4">
                <Separator className="my-4" />
                <p className="text-sm font-medium mb-2">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {result.citations.map((citation, index) => (
                    <Badge variant="outline" key={index} className="text-xs overflow-hidden">
                      <a 
                        href={citation} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline truncate max-w-[300px]"
                      >
                        {citation}
                      </a>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
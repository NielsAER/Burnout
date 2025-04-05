import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

// Response interfaces
interface TextGenerationResponse {
  text: string;
  modelUsed: string;
}

interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

interface TextAnalysisResponse {
  result: any;
  modelUsed: string;
}

interface ContentRewriteResponse {
  text: string;
  modelUsed: string;
}

interface SearchResponse {
  text: string;
  modelUsed: string;
  citations?: string[];
  searchResults?: any[];
}

interface TextProcessingResponse {
  processedText: string;
  original: string;
  processingType: string;
  extracted?: Record<string, string[]>;
}

// Option interfaces
interface OpenAIOptions {
  maxTokens?: number;
  temperature?: number;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
}

interface AnthropicOptions {
  maxTokens?: number;
  temperature?: number;
}

interface OllamaOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface PerplexityOptions {
  model?: string;
  searchDomain?: string[];
  searchRecency?: "hour" | "day" | "week" | "month" | "year";
  temperature?: number;
  maxTokens?: number;
}

interface TextProcessorSummarizeOptions {
  length?: "short" | "medium" | "long";
  format?: "paragraph" | "bullets";
  focusOn?: string;
}

interface TextProcessorFormatOptions {
  includeHeadings?: boolean;
  includeLists?: boolean;
  indentationSpaces?: number;
}

interface TextProcessorTranslateOptions {
  preserveFormatting?: boolean;
  toneStyle?: "formal" | "casual" | "technical" | "simple";
}

interface UseLLMServicesReturn {
  loading: boolean;
  error: string | null;
  
  // OpenAI functions
  generateTextOpenAI: (prompt: string, options?: OpenAIOptions) => Promise<TextGenerationResponse>;
  generateImageOpenAI: (prompt: string, options?: OpenAIOptions) => Promise<ImageGenerationResponse>;
  analyzeTextOpenAI: (text: string, task: string) => Promise<TextAnalysisResponse>;
  
  // Anthropic functions
  generateTextAnthropic: (prompt: string, options?: AnthropicOptions) => Promise<TextGenerationResponse>;
  analyzeTextAnthropic: (text: string, task: string) => Promise<TextAnalysisResponse>;
  rewriteContentAnthropic: (text: string, instructions: string) => Promise<ContentRewriteResponse>;
  
  // Ollama functions
  generateTextOllama: (prompt: string, options?: OllamaOptions) => Promise<TextGenerationResponse>;
  completeTextOllama: (text: string, options?: OllamaOptions) => Promise<TextGenerationResponse>;
  analyzeTextOllama: (text: string, task: string, options?: OllamaOptions) => Promise<TextAnalysisResponse>;
  
  // Perplexity functions
  performSearch: (query: string, options?: PerplexityOptions) => Promise<SearchResponse>;
  analyzeTopic: (topic: string, options?: PerplexityOptions) => Promise<SearchResponse>;
  researchQuestion: (question: string, options?: PerplexityOptions) => Promise<SearchResponse>;
  
  // Text Processor functions
  summarizeText: (text: string, options?: TextProcessorSummarizeOptions) => Promise<TextProcessingResponse>;
  formatText: (text: string, targetFormat: "markdown" | "html" | "plain" | "json", options?: TextProcessorFormatOptions) => Promise<TextProcessingResponse>;
  extractFromText: (text: string, extractionTypes: string[], customPattern?: string) => Promise<TextProcessingResponse>;
  translateText: (text: string, targetLanguage: string, options?: TextProcessorTranslateOptions) => Promise<TextProcessingResponse>;
}

export function useLLMServices(): UseLLMServicesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utility function to handle API errors
  const handleApiError = (error: unknown): string => {
    console.error("API Error:", error);
    
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return "An unknown error occurred";
    }
  };

  // OpenAI functions
  const generateTextOpenAI = async (prompt: string, options?: OpenAIOptions): Promise<TextGenerationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextGenerationResponse>({
        method: "POST",
        url: "/api/services/openai/generate-text",
        data: {
          prompt,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateImageOpenAI = async (prompt: string, options?: OpenAIOptions): Promise<ImageGenerationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<ImageGenerationResponse>({
        method: "POST",
        url: "/api/services/openai/generate-image",
        data: {
          prompt,
          size: options?.size || "1024x1024",
          quality: options?.quality || "standard"
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTextOpenAI = async (text: string, task: string): Promise<TextAnalysisResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextAnalysisResponse>({
        method: "POST",
        url: "/api/services/openai/analyze-text",
        data: { text, task }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Anthropic functions
  const generateTextAnthropic = async (prompt: string, options?: AnthropicOptions): Promise<TextGenerationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextGenerationResponse>({
        method: "POST",
        url: "/api/services/anthropic/generate-text",
        data: {
          prompt,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTextAnthropic = async (text: string, task: string): Promise<TextAnalysisResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextAnalysisResponse>({
        method: "POST",
        url: "/api/services/anthropic/analyze-text",
        data: { text, task }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const rewriteContentAnthropic = async (text: string, instructions: string): Promise<ContentRewriteResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<ContentRewriteResponse>({
        method: "POST",
        url: "/api/services/anthropic/rewrite-content",
        data: { text, instructions }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Ollama functions
  const generateTextOllama = async (prompt: string, options?: OllamaOptions): Promise<TextGenerationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextGenerationResponse>({
        method: "POST",
        url: "/api/services/ollama/generate-text",
        data: {
          prompt,
          model: options?.model,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeTextOllama = async (text: string, options?: OllamaOptions): Promise<TextGenerationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextGenerationResponse>({
        method: "POST",
        url: "/api/services/ollama/complete-text",
        data: {
          text,
          model: options?.model,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTextOllama = async (text: string, task: string, options?: OllamaOptions): Promise<TextAnalysisResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextAnalysisResponse>({
        method: "POST",
        url: "/api/services/ollama/analyze-text",
        data: {
          text,
          task,
          model: options?.model,
          temperature: options?.temperature
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Perplexity functions
  const performSearch = async (query: string, options?: PerplexityOptions): Promise<SearchResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<SearchResponse>({
        method: "POST",
        url: "/api/services/perplexity/search",
        data: {
          query,
          model: options?.model,
          searchDomain: options?.searchDomain,
          searchRecency: options?.searchRecency,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTopic = async (topic: string, options?: PerplexityOptions): Promise<SearchResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<SearchResponse>({
        method: "POST",
        url: "/api/services/perplexity/analyze-topic",
        data: {
          topic,
          model: options?.model,
          searchRecency: options?.searchRecency,
          temperature: options?.temperature
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const researchQuestion = async (question: string, options?: PerplexityOptions): Promise<SearchResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<SearchResponse>({
        method: "POST",
        url: "/api/services/perplexity/research-question",
        data: {
          question,
          model: options?.model,
          searchRecency: options?.searchRecency,
          temperature: options?.temperature
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Text Processor functions
  const summarizeText = async (text: string, options?: TextProcessorSummarizeOptions): Promise<TextProcessingResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextProcessingResponse>({
        method: "POST",
        url: "/api/services/text-processor/summarize",
        data: {
          text,
          length: options?.length,
          format: options?.format,
          focusOn: options?.focusOn
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatText = async (
    text: string, 
    targetFormat: "markdown" | "html" | "plain" | "json", 
    options?: TextProcessorFormatOptions
  ): Promise<TextProcessingResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextProcessingResponse>({
        method: "POST",
        url: "/api/services/text-processor/format",
        data: {
          text,
          targetFormat,
          includeHeadings: options?.includeHeadings,
          includeLists: options?.includeLists,
          indentationSpaces: options?.indentationSpaces
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const extractFromText = async (
    text: string,
    extractionTypes: string[],
    customPattern?: string
  ): Promise<TextProcessingResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextProcessingResponse>({
        method: "POST",
        url: "/api/services/text-processor/extract",
        data: {
          text,
          extractionTypes,
          customPattern
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const translateText = async (
    text: string,
    targetLanguage: string,
    options?: TextProcessorTranslateOptions
  ): Promise<TextProcessingResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<TextProcessingResponse>({
        method: "POST",
        url: "/api/services/text-processor/translate",
        data: {
          text,
          targetLanguage,
          preserveFormatting: options?.preserveFormatting,
          toneStyle: options?.toneStyle
        }
      });
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    
    // OpenAI functions
    generateTextOpenAI,
    generateImageOpenAI,
    analyzeTextOpenAI,
    
    // Anthropic functions
    generateTextAnthropic,
    analyzeTextAnthropic,
    rewriteContentAnthropic,
    
    // Ollama functions
    generateTextOllama,
    completeTextOllama,
    analyzeTextOllama,
    
    // Perplexity functions
    performSearch,
    analyzeTopic,
    researchQuestion,
    
    // Text Processor functions
    summarizeText,
    formatText,
    extractFromText,
    translateText
  };
}
import OpenAI from "openai";
import { Request } from "express";

// Create OpenAI instance with a function to get it when needed
let openaiInstance: OpenAI | null = null;

export function getOpenAIInstance(req?: Request): OpenAI {
  // Check for API key in request session first, then environment variable
  const apiKeys = req?.session?.apiKeys || {};
  const apiKey = apiKeys.openai || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key is not set. Please provide an API key via settings.");
  }
  
  // Always create a fresh instance if we have a request with session key
  // This ensures we always use the most current key from the session
  if (req?.session?.apiKeys?.openai) {
    console.log("Using OpenAI API key from session");
    return new OpenAI({ apiKey: req.session.apiKeys.openai });
  }
  
  // For environment variable keys, use/create a singleton instance for efficiency
  if (!openaiInstance && process.env.OPENAI_API_KEY) {
    console.log("Creating new OpenAI instance with environment key");
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openaiInstance;
  } else if (openaiInstance && process.env.OPENAI_API_KEY === apiKey) {
    // Return existing instance if the environment key hasn't changed
    return openaiInstance;
  }
  
  // If we got here, we have no cached instance or the key has changed
  console.log("Creating new OpenAI instance with provided key");
  return new OpenAI({ apiKey });
}

// Define response interfaces
interface TextGenerationResponse {
  text: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
}

interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

interface TextAnalysisResponse {
  result: any;
  modelUsed: string;
}

// Text generation with flexible model selection and system message
export async function generateText(
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.7,
  model: string = "gpt-4o",
  systemMessage?: string,
  req?: Request
): Promise<TextGenerationResponse> {
  try {
    const openai = getOpenAIInstance(req);
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const messages = [];
    
    // Add system message if provided
    if (systemMessage) {
      messages.push({ role: "system" as const, content: systemMessage });
    }
    
    // Add user prompt
    messages.push({ role: "user" as const, content: prompt });
    
    const response = await openai.chat.completions.create({
      model: model || "gpt-4o", // Default to gpt-4o if no model specified
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    });

    return {
      text: response.choices[0].message.content || "",
      modelUsed: response.model,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
    };
  } catch (error: any) {
    console.error("OpenAI text generation error:", error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

// Image generation with DALL-E 3
export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024",
  quality: "standard" | "hd" = "standard",
  req?: Request
): Promise<ImageGenerationResponse> {
  try {
    const openai = getOpenAIInstance(req);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality,
    });

    return {
      imageUrl: response.data[0].url || "",
      revisedPrompt: response.data[0].revised_prompt,
    };
  } catch (error: any) {
    console.error("OpenAI image generation error:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// Analyze text content (sentiment, classification, etc.)
export async function analyzeText(
  text: string,
  task: string,
  req?: Request
): Promise<TextAnalysisResponse> {
  try {
    const openai = getOpenAIInstance(req);
    
    // Construct a system message based on the task
    let systemMessage = "You are a helpful assistant.";
    
    switch (task.toLowerCase()) {
      case "sentiment":
        systemMessage = "Analyze the sentiment of the following text and return a JSON with keys 'sentiment' (positive, negative, or neutral) and 'confidence' (0-1).";
        break;
      case "classification":
        systemMessage = "Classify the following text and return a JSON with keys 'category' and 'confidence' (0-1).";
        break;
      case "entities":
        systemMessage = "Extract named entities from the following text and return a JSON array with keys 'entity', 'type', and 'confidence' (0-1).";
        break;
      case "summary":
        systemMessage = "Summarize the following text and return a JSON with key 'summary' containing a concise summary.";
        break;
      default:
        systemMessage = `Perform ${task} analysis on the following text and return the result as JSON.`;
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system" as const, content: systemMessage },
        { role: "user" as const, content: text }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    // Parse the JSON response
    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      result,
      modelUsed: response.model,
    };
  } catch (error: any) {
    console.error("OpenAI text analysis error:", error);
    throw new Error(`Failed to analyze text: ${error.message}`);
  }
}

// Moderate content
export async function moderateContent(text: string, req?: Request): Promise<any> {
  try {
    const openai = getOpenAIInstance(req);
    
    const response = await openai.moderations.create({
      input: text,
    });

    return {
      flagged: response.results[0].flagged,
      categories: response.results[0].categories,
      categoryScores: response.results[0].category_scores,
    };
  } catch (error: any) {
    console.error("OpenAI moderation error:", error);
    throw new Error(`Failed to moderate content: ${error.message}`);
  }
}

// Web search interface
interface SearchResponse {
  text: string;
  modelUsed: string;
  citations: string[];
}

// Perform web search using OpenAI
export async function performSearch(
  query: string,
  options: {
    searchRecency?: "day" | "week" | "month";
    temperature?: number;
    maxTokens?: number;
    systemMessage?: string;
  } = {},
  req?: Request
): Promise<SearchResponse> {
  try {
    const openai = getOpenAIInstance(req);
    
    // Set default options
    const {
      searchRecency = "week",
      temperature = 0.2,
      maxTokens = 1000,
      systemMessage = "You are a helpful assistant that provides accurate information with relevant sources. Always include citations to websites where the information was found. If you don't know or can't find appropriate information, admit it."
    } = options;

    // Add recency guidance to system message
    let timeframeMessage = "";
    if (searchRecency === "day") {
      timeframeMessage = "Focus on information from the last 24 hours.";
    } else if (searchRecency === "week") {
      timeframeMessage = "Focus on information from the last week.";
    } else if (searchRecency === "month") {
      timeframeMessage = "Focus on information from the last month.";
    }

    const enhancedSystemMessage = `${systemMessage} ${timeframeMessage} After your response, list all sources with URLs in a section titled "SOURCES:" with each source on a new line.`;
    
    // Add search instruction to query
    const enhancedQuery = `Please search the web for information about: ${query}`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: enhancedSystemMessage },
        { role: "user", content: enhancedQuery }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    });

    const content = response.choices[0].message.content || "";
    
    // Extract citations from the content
    const citations: string[] = [];
    const sourcesMatch = content.match(/SOURCES:[\s\S]*$/i);
    
    let cleanedContent = content;
    
    if (sourcesMatch) {
      const sourcesSection = sourcesMatch[0];
      // Extract URLs from the sources section
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let match;
      while ((match = urlRegex.exec(sourcesSection)) !== null) {
        citations.push(match[1]);
      }
      
      // Remove the sources section from the content
      cleanedContent = content.replace(/SOURCES:[\s\S]*$/i, "").trim();
    }

    return {
      text: cleanedContent,
      modelUsed: response.model,
      citations: citations
    };
  } catch (error: any) {
    console.error("OpenAI search error:", error);
    throw new Error(`Failed to perform search: ${error.message}`);
  }
}

// Analyze a topic with OpenAI
export async function analyzeTopic(
  topic: string,
  options: {
    searchRecency?: "day" | "week" | "month";
    temperature?: number;
    maxTokens?: number;
    systemMessage?: string;
  } = {},
  req?: Request
): Promise<SearchResponse> {
  try {
    const systemMessage = options.systemMessage || 
      "You are a helpful assistant that provides detailed analysis on topics. Include relevant sources and citations.";
    
    return await performSearch(`Provide a detailed analysis of the following topic: ${topic}`, {
      ...options,
      systemMessage
    }, req);
  } catch (error: any) {
    console.error("Topic analysis error:", error);
    throw new Error(`Failed to analyze topic: ${error.message}`);
  }
}

// Research a specific question with OpenAI
export async function researchQuestion(
  question: string,
  options: {
    searchRecency?: "day" | "week" | "month";
    temperature?: number;
    maxTokens?: number;
    systemMessage?: string;
  } = {},
  req?: Request
): Promise<SearchResponse> {
  try {
    const systemMessage = options.systemMessage || 
      "You are a research assistant that provides detailed, factual answers to questions. Include relevant sources and citations.";
    
    return await performSearch(`Research and provide a detailed answer to the following question: ${question}`, {
      ...options,
      systemMessage
    }, req);
  } catch (error: any) {
    console.error("Question research error:", error);
    throw new Error(`Failed to research question: ${error.message}`);
  }
}
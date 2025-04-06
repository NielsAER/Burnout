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
  
  // If we have a request with a session key, always create a fresh instance
  // to use the session-provided key
  if (req?.session?.apiKeys?.openai) {
    return new OpenAI({ apiKey });
  }
  
  // Otherwise, use/create the singleton instance with the env variable
  if (!openaiInstance && process.env.OPENAI_API_KEY) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openaiInstance;
  } else if (openaiInstance) {
    return openaiInstance;
  }
  
  // Fallback to creating a new instance with the key we found
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

// Text generation with gpt-4o model
export async function generateText(
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.7,
  req?: Request
): Promise<TextGenerationResponse> {
  try {
    const openai = getOpenAIInstance(req);
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
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
        { role: "system", content: systemMessage },
        { role: "user", content: text }
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
import Anthropic from "@anthropic-ai/sdk";

// Create Anthropic instance with a function to get it when needed
let anthropicInstance: Anthropic | null = null;

function getAnthropicInstance(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key is not set. Please provide an API key via settings.");
  }
  
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  return anthropicInstance;
}

// Define response interfaces
interface TextGenerationResponse {
  text: string;
  modelUsed: string;
}

interface TextAnalysisResponse {
  result: any;
  modelUsed: string;
}

// Text generation with Claude models
export async function generateText(
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.7,
  model: string = "claude-3-7-sonnet-20250219",
  systemMessage?: string
): Promise<TextGenerationResponse> {
  try {
    const anthropic = getAnthropicInstance();
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const message = await anthropic.messages.create({
      model: model || "claude-3-7-sonnet-20250219",
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemMessage,
      messages: [{ role: "user", content: prompt }],
    });

    // Handle the content safely with type checking
    const content = message.content[0];
    const responseText = 'text' in content ? content.text : JSON.stringify(content);

    return {
      text: responseText,
      modelUsed: message.model,
    };
  } catch (error: any) {
    console.error("Anthropic text generation error:", error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

// Text content analysis with Claude
export async function analyzeText(
  text: string,
  task: string
): Promise<TextAnalysisResponse> {
  try {
    const anthropic = getAnthropicInstance();
    
    // Construct a system message based on the task
    let systemPrompt = "You are a helpful assistant.";
    
    switch (task.toLowerCase()) {
      case "sentiment":
        systemPrompt = "Analyze the sentiment of the text. Return a JSON with keys 'sentiment' (positive, negative, or neutral) and 'confidence' (0-1).";
        break;
      case "classification":
        systemPrompt = "Classify the text. Return a JSON with keys 'category' and 'confidence' (0-1).";
        break;
      case "entities":
        systemPrompt = "Extract named entities from the text. Return a JSON array with keys 'entity', 'type', and 'confidence' (0-1).";
        break;
      case "summary":
        systemPrompt = "Summarize the text. Return a JSON with key 'summary' containing a concise summary.";
        break;
      default:
        systemPrompt = `Perform ${task} analysis on the text. Return the result as JSON.`;
    }

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: systemPrompt,
      max_tokens: 1024,
      messages: [
        { role: "user", content: text }
      ],
    });

    // Handle the content safely with type checking
    const content = response.content[0];
    let resultText = 'text' in content ? content.text : JSON.stringify(content);
    
    // Parse the JSON response
    const jsonStartIndex = resultText.indexOf('{');
    const jsonEndIndex = resultText.lastIndexOf('}') + 1;
    const jsonStr = jsonStartIndex >= 0 ? resultText.substring(jsonStartIndex, jsonEndIndex) : '{}';
    const result = JSON.parse(jsonStr);

    return {
      result,
      modelUsed: response.model,
    };
  } catch (error: any) {
    console.error("Anthropic text analysis error:", error);
    throw new Error(`Failed to analyze text: ${error.message}`);
  }
}

// Content rewriting with Claude
export async function rewriteContent(
  text: string,
  instructions: string
): Promise<TextGenerationResponse> {
  try {
    const anthropic = getAnthropicInstance();
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      messages: [
        { 
          role: "user", 
          content: `Rewrite the following text according to these instructions: ${instructions}\n\nText to rewrite:\n${text}` 
        }
      ],
    });

    // Handle the content safely with type checking
    const content = response.content[0];
    const responseText = 'text' in content ? content.text : JSON.stringify(content);
    
    return {
      text: responseText,
      modelUsed: response.model,
    };
  } catch (error: any) {
    console.error("Anthropic content rewriting error:", error);
    throw new Error(`Failed to rewrite content: ${error.message}`);
  }
}
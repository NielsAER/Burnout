// Connection URL for Ollama
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Define response interfaces
interface TextGenerationResponse {
  text: string;
  modelUsed: string;
}

interface TextAnalysisResponse {
  result: any;
  modelUsed: string;
}

// Supported models - can be expanded as needed
const SUPPORTED_MODELS = [
  "llama3",
  "llama3:8b",
  "llama3:70b",
  "mistral",
  "mistral:7b",
  "phi3",
  "phi3:mini",
  "phi3:small",
  "phi3:medium"
];

// Get default model or validate requested model
function getModelName(requestedModel?: string): string {
  if (!requestedModel) {
    return "llama3"; // Default model
  }
  
  // Check if the requested model is supported
  if (SUPPORTED_MODELS.includes(requestedModel)) {
    return requestedModel;
  }
  
  // If not supported, log a warning and return the default
  console.warn(`Requested model ${requestedModel} is not supported. Using llama3 instead.`);
  return "llama3";
}

// Text generation with Ollama models
export async function generateText(
  prompt: string,
  model: string = "llama3",
  maxTokens: number = 500,
  temperature: number = 0.7
): Promise<TextGenerationResponse> {
  try {
    const modelName = getModelName(model);
    
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        options: {
          num_predict: maxTokens,
          temperature: temperature
        }
      })
    }).then(res => res.json());

    return {
      text: response.message.content,
      modelUsed: modelName,
    };
  } catch (error: any) {
    console.error("Ollama text generation error:", error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

// Text completion with Ollama models
export async function completeText(
  text: string,
  model: string = "llama3",
  maxTokens: number = 100,
  temperature: number = 0.7
): Promise<TextGenerationResponse> {
  try {
    const modelName = getModelName(model);
    
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: text,
        options: {
          num_predict: maxTokens,
          temperature: temperature
        }
      })
    }).then(res => res.json());

    return {
      text: response.response,
      modelUsed: modelName,
    };
  } catch (error: any) {
    console.error("Ollama text completion error:", error);
    throw new Error(`Failed to complete text: ${error.message}`);
  }
}

// Text analysis with Ollama models
export async function analyzeText(
  text: string,
  task: string,
  model: string = "llama3"
): Promise<TextAnalysisResponse> {
  try {
    const modelName = getModelName(model);
    
    // Construct a prompt based on the task
    let prompt = "";
    
    switch (task.toLowerCase()) {
      case "sentiment":
        prompt = `Analyze the sentiment of the following text and return only a JSON object with keys 'sentiment' (positive, negative, or neutral) and 'confidence' (0-1).\n\nText: ${text}`;
        break;
      case "classification":
        prompt = `Classify the following text and return only a JSON object with keys 'category' and 'confidence' (0-1).\n\nText: ${text}`;
        break;
      case "entities":
        prompt = `Extract named entities from the following text and return only a JSON array with keys 'entity', 'type', and 'confidence' (0-1).\n\nText: ${text}`;
        break;
      case "summary":
        prompt = `Summarize the following text and return only a JSON object with key 'summary' containing a concise summary.\n\nText: ${text}`;
        break;
      default:
        prompt = `Perform ${task} analysis on the following text and return the result as a JSON object.\n\nText: ${text}`;
    }

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        options: {
          temperature: 0.2
        }
      })
    }).then(res => res.json());

    // Try to extract JSON from the response
    const responseText = response.message.content;
    
    // Attempt to find JSON in the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let result;
    
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.warn("Could not parse JSON from response, returning raw text");
        result = { raw: responseText };
      }
    } else {
      result = { raw: responseText };
    }

    return {
      result,
      modelUsed: modelName,
    };
  } catch (error: any) {
    console.error("Ollama text analysis error:", error);
    throw new Error(`Failed to analyze text: ${error.message}`);
  }
}
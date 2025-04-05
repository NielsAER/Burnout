// Function to get Perplexity API key
function getPerplexityApiKey(): string {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("Perplexity API key is not set. Please provide an API key via settings.");
  }
  return apiKey;
}

// Define interfaces for response types
interface PerplexityResponse {
  text: string;
  modelUsed: string;
  citations?: string[];
}

interface SearchResponse extends PerplexityResponse {
  searchResults: any[];
}

// Main search and query function for Perplexity
export async function performSearch(
  query: string,
  options: {
    model?: string;
    searchDomain?: string[];
    searchRecency?: "hour" | "day" | "week" | "month" | "year";
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<SearchResponse> {
  try {
    // Get API key
    const apiKey = getPerplexityApiKey();

    // Set default options
    const {
      model = "llama-3.1-sonar-small-128k-online",
      searchDomain = [],
      searchRecency = "month",
      temperature = 0.2,
      maxTokens = 500
    } = options;

    // Construct the API request
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides accurate and relevant information."
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: maxTokens,
        temperature,
        search_domain_filter: searchDomain.length > 0 ? searchDomain : undefined,
        search_recency_filter: searchRecency,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    return {
      text: data.choices[0].message.content,
      modelUsed: data.model,
      citations: data.citations || [],
      searchResults: data.search_results || []
    };
  } catch (error: any) {
    console.error("Perplexity API error:", error);
    throw new Error(`Failed to perform search: ${error.message}`);
  }
}

// Analyze a topic with Perplexity AI
export async function analyzeTopic(
  topic: string,
  options: {
    model?: string;
    searchRecency?: "hour" | "day" | "week" | "month" | "year";
    temperature?: number;
  } = {}
): Promise<PerplexityResponse> {
  try {
    const query = `Provide a detailed analysis of the following topic: ${topic}`;
    const response = await performSearch(query, options);
    
    return {
      text: response.text,
      modelUsed: response.modelUsed,
      citations: response.citations
    };
  } catch (error: any) {
    console.error("Topic analysis error:", error);
    throw new Error(`Failed to analyze topic: ${error.message}`);
  }
}

// Research a specific question with Perplexity AI
export async function researchQuestion(
  question: string,
  options: {
    model?: string;
    searchRecency?: "hour" | "day" | "week" | "month" | "year";
    temperature?: number;
  } = {}
): Promise<PerplexityResponse> {
  try {
    const query = `Research and provide a detailed answer to the following question: ${question}`;
    const response = await performSearch(query, options);
    
    return {
      text: response.text,
      modelUsed: response.modelUsed,
      citations: response.citations
    };
  } catch (error: any) {
    console.error("Question research error:", error);
    throw new Error(`Failed to research question: ${error.message}`);
  }
}
/**
 * Checks if an API key is available for a given service
 * @param service Name of the service (openai, anthropic, perplexity, ollama) 
 * @returns Boolean indicating if a key exists
 */
export async function checkApiKeyAvailability(service: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/settings/check-api-key?service=${service}`);
    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error(`Error checking ${service} API key:`, error);
    return false;
  }
}

/**
 * Returns a user-friendly error message for missing API keys
 * @param service Name of the service (openai, anthropic, perplexity, ollama)
 * @returns String with instructions
 */
export function getApiKeyErrorMessage(service: string): string {
  const serviceMap: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    perplexity: "Perplexity",
    ollama: "Ollama",
    "text-processor": "Text Processor"
  };

  const serviceName = serviceMap[service] || service;
  
  return `This feature requires a ${serviceName} API key. Please add your API key in the Settings page.`;
}

/**
 * Returns URL to service's API documentation
 * @param service Name of the service
 * @returns URL string to documentation
 */
export function getApiKeyDocumentationUrl(service: string): string {
  switch (service) {
    case 'openai':
      return 'https://platform.openai.com/api-keys';
    case 'anthropic':
      return 'https://console.anthropic.com/keys';
    case 'perplexity':
      return 'https://docs.perplexity.ai/docs/getting-started';
    case 'ollama':
      return 'https://ollama.com/download';
    default:
      return '#';
  }
}
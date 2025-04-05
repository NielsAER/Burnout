import { useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  perplexity?: string;
  ollama?: string;
  [key: string]: string | undefined;
}

export function useApiKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get API keys from session storage first (if any)
  const [localKeys, setLocalKeys] = useState<ApiKeys>(() => {
    const savedKeys = sessionStorage.getItem('api_keys');
    return savedKeys ? JSON.parse(savedKeys) : {};
  });
  
  useEffect(() => {
    // Save keys to session storage whenever they change
    sessionStorage.setItem('api_keys', JSON.stringify(localKeys));
  }, [localKeys]);
  
  // Query to get API key status from the server
  const { data: keyStatus, isLoading } = useQuery({
    queryKey: ['/api/settings/api-keys-status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings/api-keys-status');
      return await res.json();
    },
  });
  
  // Mutation to save API keys
  const saveKeysMutation = useMutation({
    mutationFn: async (keys: ApiKeys) => {
      const res = await apiRequest('POST', '/api/settings/api-keys', keys);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "API keys saved",
        description: "Your API keys have been securely saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/api-keys-status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save API keys",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to save a specific key
  const saveApiKey = (service: string, apiKey: string) => {
    const updatedKeys = {
      ...localKeys,
      [service]: apiKey,
    };
    
    setLocalKeys(updatedKeys);
    saveKeysMutation.mutate(updatedKeys);
  };
  
  // Function to remove a specific key
  const removeApiKey = (service: string) => {
    const updatedKeys = { ...localKeys };
    delete updatedKeys[service];
    
    setLocalKeys(updatedKeys);
    saveKeysMutation.mutate(updatedKeys);
  };
  
  // Function to check if a key exists for a service
  const hasApiKey = (service: string): boolean => {
    return keyStatus?.services?.[service]?.hasKey || false;
  };
  
  return {
    apiKeys: localKeys,
    keyStatus: keyStatus?.services || {},
    isLoading,
    saveApiKey,
    removeApiKey,
    hasApiKey,
    isPending: saveKeysMutation.isPending,
  };
}
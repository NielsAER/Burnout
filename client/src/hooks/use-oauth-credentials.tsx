import { useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export interface OAuthCredentials {
  instagram_client_id?: string;
  instagram_client_secret?: string;
  linkedin_client_id?: string;
  linkedin_client_secret?: string;
  twitter_client_id?: string;
  twitter_client_secret?: string;
  google_client_id?: string;
  google_client_secret?: string;
  slack_client_id?: string;
  slack_client_secret?: string;
  [key: string]: string | undefined;
}

export function useOAuthCredentials() {
  const { toast } = useToast();
  
  // Get OAuth credentials from session storage first (if any)
  const [localCredentials, setLocalCredentials] = useState<OAuthCredentials>(() => {
    const savedCredentials = sessionStorage.getItem('oauth_credentials');
    return savedCredentials ? JSON.parse(savedCredentials) : {};
  });
  
  useEffect(() => {
    // Save credentials to session storage whenever they change
    sessionStorage.setItem('oauth_credentials', JSON.stringify(localCredentials));
  }, [localCredentials]);
  
  // Mutation to save OAuth credentials
  const saveCredentialsMutation = useMutation({
    mutationFn: async (credentials: OAuthCredentials) => {
      const res = await apiRequest('POST', '/api/settings/oauth-credentials', credentials);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "OAuth credentials saved",
        description: "Your OAuth credentials have been securely saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save OAuth credentials",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to save a specific credential pair
  const saveOAuthCredentials = (service: string, clientId: string, clientSecret: string) => {
    const updatedCredentials = {
      ...localCredentials,
      [`${service}_client_id`]: clientId,
      [`${service}_client_secret`]: clientSecret,
    };
    
    setLocalCredentials(updatedCredentials);
    saveCredentialsMutation.mutate(updatedCredentials);
  };
  
  // Function to remove a specific credential pair
  const removeOAuthCredentials = (service: string) => {
    const updatedCredentials = { ...localCredentials };
    delete updatedCredentials[`${service}_client_id`];
    delete updatedCredentials[`${service}_client_secret`];
    
    setLocalCredentials(updatedCredentials);
    saveCredentialsMutation.mutate(updatedCredentials);
  };
  
  // Function to check if credentials exist for a service
  const hasOAuthCredentials = (service: string): boolean => {
    return !!localCredentials[`${service}_client_id`] && 
           !!localCredentials[`${service}_client_secret`];
  };
  
  // Function to get a specific client ID
  const getClientId = (service: string): string | undefined => {
    return localCredentials[`${service}_client_id`];
  };
  
  // Function to get a specific client secret
  const getClientSecret = (service: string): string | undefined => {
    return localCredentials[`${service}_client_secret`];
  };
  
  return {
    oauthCredentials: localCredentials,
    saveOAuthCredentials,
    removeOAuthCredentials,
    hasOAuthCredentials,
    getClientId,
    getClientSecret,
    isPending: saveCredentialsMutation.isPending,
  };
}
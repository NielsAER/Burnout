import { useState, useCallback } from 'react';
import { apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for connecting LinkedIn directly with a token
 */
export function useLinkedInDirectToken() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectWithToken = useCallback(async (token: string) => {
    if (!token) {
      toast({
        title: 'Invalid Token',
        description: 'Please provide a valid LinkedIn access token',
        variant: 'destructive',
      });
      return false;
    }

    setIsConnecting(true);

    try {
      const response = await apiRequest({
        method: 'POST',
        url: '/api/direct-token-connect/linkedin',
        data: { token },
      });

      // Success!
      toast({
        title: 'LinkedIn Connected',
        description: 'Your LinkedIn account has been connected successfully',
      });

      // Refresh app connections data
      queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
      
      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error('LinkedIn connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect LinkedIn account',
        variant: 'destructive',
      });
      setIsConnecting(false);
      return false;
    }
  }, [toast, queryClient]);

  return {
    connectWithToken,
    isConnecting,
  };
}
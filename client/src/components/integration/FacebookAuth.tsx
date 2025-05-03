import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Define the window with FB global
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
    statusChangeCallback: ((response: any) => void) | (() => void);
  }
}

interface FacebookAuthProps {
  onLoginSuccess?: (response: any) => void;
  onLoginFailure?: (error: any) => void;
  buttonText?: string;
  serviceType?: 'instagram' | 'facebook-ads';
}

export function FacebookAuth({
  onLoginSuccess,
  onLoginFailure,
  buttonText = 'Connect with Facebook',
  serviceType = 'instagram'
}: FacebookAuthProps) {
  const { toast } = useToast();

  // Handle the status change callback from FB.getLoginStatus
  const statusChangeCallback = useCallback((response: any) => {
    console.log('Facebook status change:', response);
    
    if (response.status === 'connected') {
      // Logged into Facebook and app
      console.log('Facebook login successful');
      console.log('Access token:', response.authResponse?.accessToken);
      
      // Call onLoginSuccess if provided
      if (onLoginSuccess) {
        onLoginSuccess(response);
      }
      
      // Send the token to your backend to complete the Instagram authorization
      handleFacebookToken(response.authResponse);
    } else if (response.status === 'not_authorized') {
      // Logged into Facebook but not your app
      console.log('User is logged into Facebook but has not authorized your app');
      toast({
        title: 'Authorization Required',
        description: 'Please authorize our app to access your Instagram account',
        variant: 'default'
      });
      
      if (onLoginFailure) {
        onLoginFailure({ message: 'Not authorized for app' });
      }
    } else {
      // Not logged into Facebook
      console.log('User is not logged into Facebook');
      if (onLoginFailure) {
        onLoginFailure({ message: 'Not logged into Facebook' });
      }
    }
  }, [onLoginSuccess, onLoginFailure, toast]);

  // Save the callback to window for FB SDK to access
  useEffect(() => {
    // Set the global callback function
    window.statusChangeCallback = statusChangeCallback;
    
    // Clean up
    return () => {
      // Create an empty function to avoid type errors
      window.statusChangeCallback = () => {};
    };
  }, [statusChangeCallback]);

  // Handle the Facebook token by sending it to your backend
  const handleFacebookToken = async (authResponse: any) => {
    if (!authResponse || !authResponse.accessToken) {
      console.error('No access token available');
      return;
    }
    
    try {
      // Send the token to your backend
      const response = await apiRequest('POST', '/api/facebook-auth', {
        accessToken: authResponse.accessToken,
        userID: authResponse.userID,
        serviceType: serviceType
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Connection Successful',
          description: `Successfully connected to ${serviceType === 'instagram' ? 'Instagram' : 'Facebook Ads'}`,
          variant: 'default'
        });
        
        // Invalidate connections cache to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
      } else {
        toast({
          title: 'Connection Failed',
          description: data.error || 'Failed to connect to the service',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending token to backend:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to process authentication',
        variant: 'destructive'
      });
    }
  };

  // Handle the login button click
  const handleLoginClick = useCallback(() => {
    if (window.FB) {
      window.FB.login(function(response: any) {
        if (response.authResponse) {
          console.log('Facebook login successful via button click');
          statusChangeCallback(response);
        } else {
          console.log('User cancelled login or did not fully authorize');
          if (onLoginFailure) {
            onLoginFailure({ message: 'Login cancelled' });
          }
        }
      }, { scope: 'instagram_basic,instagram_content_publish,pages_show_list' });
    } else {
      console.error('Facebook SDK not loaded');
      toast({
        title: 'Facebook SDK Error',
        description: 'Facebook authentication is not available right now',
        variant: 'destructive'
      });
    }
  }, [statusChangeCallback, onLoginFailure, toast]);

  return (
    <Button 
      onClick={handleLoginClick}
      className="w-full"
      variant="default"
    >
      {buttonText}
    </Button>
  );
}
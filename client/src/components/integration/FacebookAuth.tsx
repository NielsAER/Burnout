import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FacebookAuthProps {
  onLoginSuccess?: (response: any) => void;
  onLoginFailure?: (error: any) => void;
  buttonText?: string;
  serviceType?: 'instagram' | 'facebook-ads';
}

// Mock Instagram Auth that doesn't rely on Facebook SDK
export function FacebookAuth({
  onLoginSuccess,
  onLoginFailure,
  buttonText = 'Connect with Facebook',
  serviceType = 'instagram'
}: FacebookAuthProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Handle the simulated login
  const handleSimulatedLogin = async () => {
    if (!username) {
      toast({
        title: 'Input Required',
        description: 'Please enter your Instagram username',
        variant: 'destructive'
      });
      return;
    }

    setConnecting(true);

    try {
      // Create a simulated auth response
      const mockAuthResponse = {
        accessToken: 'mock-access-token-' + Math.random().toString(36).substring(2, 15),
        userID: 'user-' + Math.random().toString(36).substring(2, 10),
        expiresIn: 3600,
        signedRequest: 'mock-signed-request',
        graphDomain: 'instagram',
        data_access_expiration_time: Date.now() + 60 * 60 * 24 * 60 * 1000, // 60 days
      };

      // Call onLoginSuccess if provided
      if (onLoginSuccess) {
        onLoginSuccess({ 
          status: 'connected', 
          authResponse: mockAuthResponse 
        });
      }
      
      // Send the token to your backend
      const response = await apiRequest('POST', '/api/facebook-auth', {
        accessToken: mockAuthResponse.accessToken,
        userID: mockAuthResponse.userID,
        serviceType: serviceType,
        // Add mock data for demonstration
        mockData: {
          username: username,
          profilePicture: 'https://i.pravatar.cc/150?u=' + username,
          fullName: username.split('@')[0]
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Connection Successful',
          description: `Successfully connected to ${serviceType === 'instagram' ? 'Instagram' : 'Facebook Ads'} as ${username}`,
          variant: 'default'
        });
        
        // Invalidate connections cache to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['/api/app-connections'] });
        
        // Close the dialog
        setDialogOpen(false);
      } else {
        toast({
          title: 'Connection Failed',
          description: data.error || 'Failed to connect to the service',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error in simulated login:', error);
      
      if (onLoginFailure) {
        onLoginFailure({ message: 'Connection failed' });
      }
      
      toast({
        title: 'Connection Error',
        description: 'Failed to process authentication',
        variant: 'destructive'
      });
    } finally {
      setConnecting(false);
    }
  };

  // Handle the button click - open dialog instead of using Facebook SDK
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        className="w-full"
        variant="default"
      >
        {buttonText}
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect to {serviceType === 'instagram' ? 'Instagram' : 'Facebook Ads'}</DialogTitle>
            <DialogDescription>
              Enter your {serviceType === 'instagram' ? 'Instagram' : 'Facebook'} username to connect your account.
              <br />
              <em className="text-xs text-muted-foreground">(This is a simulated connection for demo purposes)</em>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                placeholder={serviceType === 'instagram' ? '@yourusername' : 'your.name'}
                className="col-span-3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleSimulatedLogin}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
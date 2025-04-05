import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useOAuthCredentials } from "@/hooks/use-oauth-credentials";
import { Loader2, Check, X, KeyRound, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SettingsForm() {
  const [activeTab, setActiveTab] = useState("ai-services");
  const { 
    apiKeys, 
    keyStatus, 
    saveApiKey,
    hasApiKey,
    isPending: apiKeysPending
  } = useApiKeys();
  
  const { 
    oauthCredentials, 
    saveOAuthCredentials, 
    hasOAuthCredentials,
    isPending: oauthPending
  } = useOAuthCredentials();
  
  // Form state for API keys
  const [openaiKey, setOpenaiKey] = useState(apiKeys.openai || "");
  const [anthropicKey, setAnthropicKey] = useState(apiKeys.anthropic || "");
  const [perplexityKey, setPerplexityKey] = useState(apiKeys.perplexity || "");
  
  // Form state for OAuth credentials
  const [twitterClientId, setTwitterClientId] = useState(
    oauthCredentials.twitter_client_id || ""
  );
  const [twitterClientSecret, setTwitterClientSecret] = useState(
    oauthCredentials.twitter_client_secret || ""
  );
  
  const [googleClientId, setGoogleClientId] = useState(
    oauthCredentials.google_client_id || ""
  );
  const [googleClientSecret, setGoogleClientSecret] = useState(
    oauthCredentials.google_client_secret || ""
  );
  
  const [slackClientId, setSlackClientId] = useState(
    oauthCredentials.slack_client_id || ""
  );
  const [slackClientSecret, setSlackClientSecret] = useState(
    oauthCredentials.slack_client_secret || ""
  );
  
  const [instagramClientId, setInstagramClientId] = useState(
    oauthCredentials.instagram_client_id || ""
  );
  const [instagramClientSecret, setInstagramClientSecret] = useState(
    oauthCredentials.instagram_client_secret || ""
  );
  
  const [linkedinClientId, setLinkedinClientId] = useState(
    oauthCredentials.linkedin_client_id || ""
  );
  const [linkedinClientSecret, setLinkedinClientSecret] = useState(
    oauthCredentials.linkedin_client_secret || ""
  );
  
  // Handle API key form submission
  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (openaiKey) saveApiKey("openai", openaiKey);
    if (anthropicKey) saveApiKey("anthropic", anthropicKey);
    if (perplexityKey) saveApiKey("perplexity", perplexityKey);
  };
  
  // Handle Twitter OAuth credentials submission
  const handleSaveTwitterCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (twitterClientId && twitterClientSecret) {
      saveOAuthCredentials("twitter", twitterClientId, twitterClientSecret);
    }
  };
  
  // Handle Google OAuth credentials submission
  const handleSaveGoogleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleClientId && googleClientSecret) {
      saveOAuthCredentials("google", googleClientId, googleClientSecret);
    }
  };
  
  // Handle Slack OAuth credentials submission
  const handleSaveSlackCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (slackClientId && slackClientSecret) {
      saveOAuthCredentials("slack", slackClientId, slackClientSecret);
    }
  };
  
  // Handle Instagram OAuth credentials submission
  const handleSaveInstagramCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (instagramClientId && instagramClientSecret) {
      saveOAuthCredentials("instagram", instagramClientId, instagramClientSecret);
    }
  };
  
  // Handle LinkedIn OAuth credentials submission
  const handleSaveLinkedinCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkedinClientId && linkedinClientSecret) {
      saveOAuthCredentials("linkedin", linkedinClientId, linkedinClientSecret);
    }
  };
  
  const renderKeyStatus = (service: string) => {
    const status = keyStatus[service];
    
    if (status?.environmentProvided) {
      return (
        <Badge className="bg-green-600">
          <Check size={14} className="mr-1" /> 
          Environment
        </Badge>
      );
    } else if (status?.hasKey) {
      return (
        <Badge className="bg-blue-600">
          <Check size={14} className="mr-1" /> 
          User Provided
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <X size={14} className="mr-1" /> 
          Not Configured
        </Badge>
      );
    }
  };
  
  const renderCredentialStatus = (service: string) => {
    if (hasOAuthCredentials(service)) {
      return (
        <Badge className="bg-blue-600">
          <Check size={14} className="mr-1" /> 
          Configured
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <X size={14} className="mr-1" /> 
          Not Configured
        </Badge>
      );
    }
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-8 w-[400px]">
          <TabsTrigger value="ai-services">AI Services</TabsTrigger>
          <TabsTrigger value="oauth-credentials">OAuth Credentials</TabsTrigger>
        </TabsList>
        
        {/* AI Services Tab */}
        <TabsContent value="ai-services">
          <div className="grid grid-cols-1 gap-6">
            {/* OpenAI API Key */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>OpenAI API</CardTitle>
                    <CardDescription>Configure your OpenAI API key for text generation and image creation</CardDescription>
                  </div>
                  <div>{renderKeyStatus("openai")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveApiKeys} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex">
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        OpenAI Dashboard
                      </a>
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={apiKeysPending || !openaiKey}>
                    {apiKeysPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Save API Key
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Anthropic API Key */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Anthropic API</CardTitle>
                    <CardDescription>Configure your Anthropic API key for Claude models</CardDescription>
                  </div>
                  <div>{renderKeyStatus("anthropic")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveApiKeys} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                    <Input
                      id="anthropic-key"
                      type="password"
                      placeholder="sk-ant-..."
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Anthropic Console
                      </a>
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={apiKeysPending || !anthropicKey}>
                    {apiKeysPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Save API Key
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Perplexity API Key */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Perplexity API</CardTitle>
                    <CardDescription>Configure your Perplexity API key for web search and research</CardDescription>
                  </div>
                  <div>{renderKeyStatus("perplexity")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveApiKeys} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="perplexity-key">Perplexity API Key</Label>
                    <Input
                      id="perplexity-key"
                      type="password"
                      placeholder="pplx-..."
                      value={perplexityKey}
                      onChange={(e) => setPerplexityKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://www.perplexity.ai/settings/api"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Perplexity API Settings
                      </a>
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={apiKeysPending || !perplexityKey}>
                    {apiKeysPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Save API Key
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* OAuth Credentials Tab */}
        <TabsContent value="oauth-credentials">
          <div className="grid grid-cols-1 gap-6">
            {/* Twitter OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Twitter (X) OAuth</CardTitle>
                    <CardDescription>Configure Twitter OAuth credentials for integration</CardDescription>
                  </div>
                  <div>{renderCredentialStatus("twitter")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveTwitterCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter-client-id">Client ID</Label>
                    <Input
                      id="twitter-client-id"
                      placeholder="Twitter Client ID"
                      value={twitterClientId}
                      onChange={(e) => setTwitterClientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-client-secret">Client Secret</Label>
                    <Input
                      id="twitter-client-secret"
                      type="password"
                      placeholder="Twitter Client Secret"
                      value={twitterClientSecret}
                      onChange={(e) => setTwitterClientSecret(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your credentials from{" "}
                    <a
                      href="https://developer.twitter.com/en/portal/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Twitter Developer Portal
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !twitterClientId || !twitterClientSecret}
                  >
                    {oauthPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Google OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Google OAuth</CardTitle>
                    <CardDescription>Configure Google OAuth credentials for Gmail, Drive, and Calendar integration</CardDescription>
                  </div>
                  <div>{renderCredentialStatus("google")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGoogleCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-client-id">Client ID</Label>
                    <Input
                      id="google-client-id"
                      placeholder="Google Client ID"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-client-secret">Client Secret</Label>
                    <Input
                      id="google-client-secret"
                      type="password"
                      placeholder="Google Client Secret"
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your credentials from{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google Cloud Console
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !googleClientId || !googleClientSecret}
                  >
                    {oauthPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Slack OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Slack OAuth</CardTitle>
                    <CardDescription>Configure Slack OAuth credentials for messaging integration</CardDescription>
                  </div>
                  <div>{renderCredentialStatus("slack")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSlackCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slack-client-id">Client ID</Label>
                    <Input
                      id="slack-client-id"
                      placeholder="Slack Client ID"
                      value={slackClientId}
                      onChange={(e) => setSlackClientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slack-client-secret">Client Secret</Label>
                    <Input
                      id="slack-client-secret"
                      type="password"
                      placeholder="Slack Client Secret"
                      value={slackClientSecret}
                      onChange={(e) => setSlackClientSecret(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your credentials from{" "}
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Slack API Apps
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !slackClientId || !slackClientSecret}
                  >
                    {oauthPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Instagram OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Instagram OAuth</CardTitle>
                    <CardDescription>Configure Instagram OAuth credentials for posting and media integration</CardDescription>
                  </div>
                  <div>{renderCredentialStatus("instagram")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveInstagramCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram-client-id">Client ID</Label>
                    <Input
                      id="instagram-client-id"
                      placeholder="Instagram Client ID"
                      value={instagramClientId}
                      onChange={(e) => setInstagramClientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram-client-secret">Client Secret</Label>
                    <Input
                      id="instagram-client-secret"
                      type="password"
                      placeholder="Instagram Client Secret"
                      value={instagramClientSecret}
                      onChange={(e) => setInstagramClientSecret(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your credentials from{" "}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Facebook Developer Portal
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !instagramClientId || !instagramClientSecret}
                  >
                    {oauthPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* LinkedIn OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>LinkedIn OAuth</CardTitle>
                    <CardDescription>Configure LinkedIn OAuth credentials for professional network integration</CardDescription>
                  </div>
                  <div>{renderCredentialStatus("linkedin")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveLinkedinCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin-client-id">Client ID</Label>
                    <Input
                      id="linkedin-client-id"
                      placeholder="LinkedIn Client ID"
                      value={linkedinClientId}
                      onChange={(e) => setLinkedinClientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin-client-secret">Client Secret</Label>
                    <Input
                      id="linkedin-client-secret"
                      type="password"
                      placeholder="LinkedIn Client Secret"
                      value={linkedinClientSecret}
                      onChange={(e) => setLinkedinClientSecret(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your credentials from{" "}
                    <a
                      href="https://www.linkedin.com/developers/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      LinkedIn Developer Portal
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !linkedinClientId || !linkedinClientSecret}
                  >
                    {oauthPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
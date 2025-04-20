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
        <TabsList className="grid grid-cols-2 mb-8 w-[400px] bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
          <TabsTrigger 
            value="ai-services" 
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0f0f0f] data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-800 dark:text-white transition-all"
          >
            AI Services
          </TabsTrigger>
          <TabsTrigger 
            value="oauth-credentials" 
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0f0f0f] data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-800 dark:text-white transition-all"
          >
            OAuth Credentials
          </TabsTrigger>
        </TabsList>
        
        {/* AI Services Tab */}
        <TabsContent value="ai-services">
          <div className="grid grid-cols-1 gap-6">
            {/* OpenAI API Key */}
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">OpenAI API</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure your OpenAI API key for text generation and image creation</CardDescription>
                  </div>
                  <div>{renderKeyStatus("openai")}</div>
                </div>
              </CardHeader>
              <CardContent className="text-gray-900 dark:text-white">
                <form onSubmit={handleSaveApiKeys} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key" className="text-gray-900 dark:text-white">OpenAI API Key</Label>
                    <div className="flex">
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="flex-1 bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get your API key from{" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        OpenAI Dashboard
                      </a>
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={apiKeysPending || !openaiKey}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
                  >
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
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Anthropic API</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure your Anthropic API key for Claude models</CardDescription>
                  </div>
                  <div>{renderKeyStatus("anthropic")}</div>
                </div>
              </CardHeader>
              <CardContent className="text-gray-900 dark:text-white">
                <form onSubmit={handleSaveApiKeys} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key" className="text-gray-900 dark:text-white">Anthropic API Key</Label>
                    <Input
                      id="anthropic-key"
                      type="password"
                      placeholder="sk-ant-..."
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get your API key from{" "}
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Anthropic Console
                      </a>
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={apiKeysPending || !anthropicKey}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
                  >
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
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Perplexity API</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure your Perplexity API key for web search and research</CardDescription>
                  </div>
                  <div>{renderKeyStatus("perplexity")}</div>
                </div>
              </CardHeader>
              <CardContent className="text-gray-900 dark:text-white">
                <form onSubmit={handleSaveApiKeys} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="perplexity-key" className="text-gray-900 dark:text-white">Perplexity API Key</Label>
                    <Input
                      id="perplexity-key"
                      type="password"
                      placeholder="pplx-..."
                      value={perplexityKey}
                      onChange={(e) => setPerplexityKey(e.target.value)}
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get your API key from{" "}
                      <a
                        href="https://www.perplexity.ai/settings/api"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Perplexity API Settings
                      </a>
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={apiKeysPending || !perplexityKey}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
                  >
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
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Twitter (X) OAuth</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure Twitter OAuth credentials for integration</CardDescription>
                  </div>
                  <div>{renderCredentialStatus("twitter")}</div>
                </div>
              </CardHeader>
              <CardContent className="text-gray-900 dark:text-white">
                <form onSubmit={handleSaveTwitterCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter-client-id" className="text-gray-900 dark:text-white">Client ID</Label>
                    <Input
                      id="twitter-client-id"
                      placeholder="Twitter Client ID"
                      value={twitterClientId}
                      onChange={(e) => setTwitterClientId(e.target.value)}
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-client-secret" className="text-gray-900 dark:text-white">Client Secret</Label>
                    <Input
                      id="twitter-client-secret"
                      type="password"
                      placeholder="Twitter Client Secret"
                      value={twitterClientSecret}
                      onChange={(e) => setTwitterClientSecret(e.target.value)}
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your credentials from{" "}
                    <a
                      href="https://developer.twitter.com/en/portal/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Twitter Developer Portal
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !twitterClientId || !twitterClientSecret}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
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
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Google OAuth</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure Google OAuth credentials for Gmail, Drive, and Calendar integration</CardDescription>
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your credentials from{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Google Cloud Console
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !googleClientId || !googleClientSecret}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
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
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Slack OAuth</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure Slack OAuth credentials for messaging integration</CardDescription>
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your credentials from{" "}
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Slack API Apps
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !slackClientId || !slackClientSecret}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
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
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Instagram OAuth</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure Instagram OAuth credentials for posting and media integration</CardDescription>
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your credentials from{" "}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Facebook Developer Portal
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !instagramClientId || !instagramClientSecret}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
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
            <Card className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">LinkedIn OAuth</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Configure LinkedIn OAuth credentials for professional network integration</CardDescription>
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
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
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a] rounded-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your credentials from{" "}
                    <a
                      href="https://www.linkedin.com/developers/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      LinkedIn Developer Portal
                    </a>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={oauthPending || !linkedinClientId || !linkedinClientSecret}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-sm"
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
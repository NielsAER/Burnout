import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAutomationSchema, insertExecutionHistorySchema } from "@shared/schema";
import { z } from "zod";

// Import LLM service modules
import * as openaiService from "./services/openai";
import * as anthropicService from "./services/anthropic";
import * as ollamaService from "./services/ollama";
import * as perplexityService from "./services/perplexity";
import * as textProcessorService from "./services/text-processor";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/automations - Get all automations
  app.get("/api/automations", async (req, res) => {
    try {
      const automations = await storage.getAllAutomations();
      res.json(automations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automations" });
    }
  });

  // GET /api/automations/:id - Get automation by ID
  app.get("/api/automations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }

      const automation = await storage.getAutomation(id);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      res.json(automation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation" });
    }
  });

  // POST /api/automations - Create a new automation
  app.post("/api/automations", async (req, res) => {
    try {
      const validatedData = insertAutomationSchema.parse(req.body);
      const newAutomation = await storage.createAutomation(validatedData);
      res.status(201).json(newAutomation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid automation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create automation" });
    }
  });

  // PATCH /api/automations/:id - Update automation
  app.patch("/api/automations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }

      // Partial validation of update data
      const validatedData = insertAutomationSchema.partial().parse(req.body);
      const updatedAutomation = await storage.updateAutomation(id, validatedData);

      if (!updatedAutomation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      res.json(updatedAutomation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid automation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update automation" });
    }
  });

  // DELETE /api/automations/:id - Delete automation
  app.delete("/api/automations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }

      const success = await storage.deleteAutomation(id);
      if (!success) {
        return res.status(404).json({ message: "Automation not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete automation" });
    }
  });

  // POST /api/automations/:id/toggle - Toggle automation status
  app.post("/api/automations/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }

      const updatedAutomation = await storage.toggleAutomationStatus(id);
      if (!updatedAutomation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      res.json(updatedAutomation);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle automation status" });
    }
  });

  // GET /api/execution-history - Get all execution histories
  app.get("/api/execution-history", async (req, res) => {
    try {
      const histories = await storage.getAllExecutionHistories();
      res.json(histories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch execution histories" });
    }
  });

  // GET /api/execution-history/automation/:automationId - Get execution histories for an automation
  app.get("/api/execution-history/automation/:automationId", async (req, res) => {
    try {
      const automationId = parseInt(req.params.automationId);
      if (isNaN(automationId)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }

      const histories = await storage.getExecutionHistoriesByAutomationId(automationId);
      res.json(histories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch execution histories" });
    }
  });

  // POST /api/execution-history - Create a new execution history
  app.post("/api/execution-history", async (req, res) => {
    try {
      const validatedData = insertExecutionHistorySchema.parse(req.body);
      const newHistory = await storage.createExecutionHistory(validatedData);
      
      // Increment runs count for the associated automation
      await storage.incrementAutomationRuns(validatedData.automationId);
      
      res.status(201).json(newHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid execution history data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create execution history" });
    }
  });

  // GET /api/templates - Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // GET /api/templates/popular - Get popular templates
  app.get("/api/templates/popular", async (req, res) => {
    try {
      const templates = await storage.getPopularTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular templates" });
    }
  });

  // Mock route for running an automation
  app.post("/api/automations/:id/run", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }

      const automation = await storage.getAutomation(id);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      if (!automation.active) {
        return res.status(400).json({ message: "Cannot run inactive automation" });
      }

      // Create a success execution history
      const executionHistory = await storage.createExecutionHistory({
        automationId: id,
        status: "success",
        message: `Automation "${automation.name}" ran successfully`,
        data: { executedAt: new Date() }
      });

      // Update the automation's lastRunAt and runsToday
      const updatedAutomation = await storage.incrementAutomationRuns(id);

      res.json({
        automation: updatedAutomation,
        execution: executionHistory
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to run automation" });
    }
  });

  // API key availability check routes
  app.get("/api/services/openai/check-key", (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    res.json({ available: !!apiKey });
  });
  
  app.get("/api/services/anthropic/check-key", (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    res.json({ available: !!apiKey });
  });
  
  app.get("/api/services/perplexity/check-key", (req, res) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    res.json({ available: !!apiKey });
  });
  
  app.get("/api/services/ollama/check-key", (req, res) => {
    // Ollama typically runs locally, so we're checking if the service is available
    // This could be enhanced to actually ping the Ollama server
    const ollamaHost = process.env.OLLAMA_HOST;
    res.json({ available: !!ollamaHost });
  });
  
  // Generic API key check endpoint
  app.get("/api/settings/check-api-key", (req, res) => {
    const service = req.query.service as string;
    
    if (!service) {
      return res.status(400).json({ message: "Service parameter is required" });
    }
    
    let available = false;
    
    switch (service) {
      case 'openai':
        available = !!process.env.OPENAI_API_KEY;
        break;
      case 'anthropic':
        available = !!process.env.ANTHROPIC_API_KEY;
        break;
      case 'perplexity':
        available = !!process.env.PERPLEXITY_API_KEY;
        break;
      case 'ollama':
        available = !!process.env.OLLAMA_HOST;
        break;
      case 'text-processor':
        // Text processor uses other services, so it's available if at least one LLM is available
        available = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
        break;
      default:
        return res.status(400).json({ message: "Unknown service" });
    }
    
    res.json({ available });
  });
  
  // App Connections Routes
  
  // GET /api/app-connections - Get all app connections
  app.get("/api/app-connections", async (req, res) => {
    try {
      const connections = await storage.getAllAppConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch app connections" });
    }
  });
  
  // GET /api/app-connections/:id - Get app connection by ID
  app.get("/api/app-connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getAppConnection(id);
      if (!connection) {
        return res.status(404).json({ message: "App connection not found" });
      }
      
      res.json(connection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch app connection" });
    }
  });
  
  // POST /api/settings/oauth-credentials - Save OAuth credentials
  app.post("/api/settings/oauth-credentials", (req, res) => {
    try {
      // Save the credentials in session storage
      if (!req.session.oauthCredentials) {
        req.session.oauthCredentials = {};
      }
      
      // Merge the new credentials with any existing ones
      req.session.oauthCredentials = {
        ...req.session.oauthCredentials,
        ...req.body
      };
      
      res.status(200).json({ message: "OAuth credentials saved successfully" });
    } catch (error) {
      console.error("Error saving OAuth credentials:", error);
      res.status(500).json({ message: "Failed to save OAuth credentials" });
    }
  });
  
  // POST /api/settings/api-keys - Save API keys
  app.post("/api/settings/api-keys", (req, res) => {
    try {
      // Save the API keys in session storage
      if (!req.session.apiKeys) {
        req.session.apiKeys = {};
      }
      
      // Merge the new API keys with any existing ones
      req.session.apiKeys = {
        ...req.session.apiKeys,
        ...req.body
      };
      
      res.status(200).json({ message: "API keys saved successfully" });
    } catch (error) {
      console.error("Error saving API keys:", error);
      res.status(500).json({ message: "Failed to save API keys" });
    }
  });
  
  // GET /api/settings/api-keys-status - Check API key status
  app.get("/api/settings/api-keys-status", (req, res) => {
    try {
      const apiKeys = req.session.apiKeys || {};
      
      // Create a status object for each API service
      const services = {
        openai: {
          hasKey: !!apiKeys.openai || !!process.env.OPENAI_API_KEY,
          environmentProvided: !!process.env.OPENAI_API_KEY
        },
        anthropic: {
          hasKey: !!apiKeys.anthropic || !!process.env.ANTHROPIC_API_KEY,
          environmentProvided: !!process.env.ANTHROPIC_API_KEY
        },
        perplexity: {
          hasKey: !!apiKeys.perplexity || !!process.env.PERPLEXITY_API_KEY,
          environmentProvided: !!process.env.PERPLEXITY_API_KEY
        },
        ollama: {
          hasKey: !!apiKeys.ollama || true, // Ollama is locally hosted, so it doesn't require a key
          environmentProvided: true
        }
      };
      
      res.json({ services });
    } catch (error) {
      console.error("Error checking API key status:", error);
      res.status(500).json({ message: "Failed to check API key status" });
    }
  });
  
  // GET /api/app-connections/:appId/auth - Start OAuth flow for an app
  app.get("/api/app-connections/:appId/auth", (req, res) => {
    try {
      const { appId } = req.params;
      
      // Get the host from the request to create proper redirect URLs
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.secure ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      
      // Get the OAuth credentials from session storage
      const oauthCredentials = req.session.oauthCredentials || {};
      let oauthUrl = '';
      
      switch (appId) {
        case 'instagram':
          const instagramClientId = oauthCredentials.instagram_client_id || process.env.INSTAGRAM_CLIENT_ID;
          if (!instagramClientId) {
            return res.status(400).json({ 
              message: "Missing Instagram client ID", 
              missingCredential: true, 
              service: "instagram" 
            });
          }
          oauthUrl = `https://www.instagram.com/oauth/authorize?client_id=${instagramClientId}&redirect_uri=${baseUrl}/api/callback/instagram&response_type=code&scope=user_profile,user_media`;
          break;
          
        case 'linkedin':
          const linkedinClientId = oauthCredentials.linkedin_client_id || process.env.LINKEDIN_CLIENT_ID;
          if (!linkedinClientId) {
            return res.status(400).json({ 
              message: "Missing LinkedIn client ID", 
              missingCredential: true, 
              service: "linkedin" 
            });
          }
          oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${linkedinClientId}&redirect_uri=${baseUrl}/api/callback/linkedin&response_type=code&scope=r_liteprofile,r_emailaddress,w_member_social`;
          break;
          
        case 'google-drive':
        case 'gmail':
        case 'google-sheets':
        case 'google-calendar':
          const googleClientId = oauthCredentials.google_client_id || process.env.GOOGLE_CLIENT_ID;
          if (!googleClientId) {
            return res.status(400).json({ 
              message: "Missing Google client ID", 
              missingCredential: true, 
              service: "google" 
            });
          }
          oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${baseUrl}/api/callback/google&response_type=code&scope=https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.readonly`;
          break;
          
        case 'slack':
          const slackClientId = oauthCredentials.slack_client_id || process.env.SLACK_CLIENT_ID;
          if (!slackClientId) {
            return res.status(400).json({ 
              message: "Missing Slack client ID", 
              missingCredential: true, 
              service: "slack" 
            });
          }
          oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&redirect_uri=${baseUrl}/api/callback/slack&scope=channels:read,chat:write`;
          break;
          
        case 'twitter':
          const twitterClientId = oauthCredentials.twitter_client_id || process.env.TWITTER_CLIENT_ID;
          if (!twitterClientId) {
            return res.status(400).json({ 
              message: "Missing Twitter client ID", 
              missingCredential: true, 
              service: "twitter" 
            });
          }
          oauthUrl = `https://twitter.com/i/oauth2/authorize?client_id=${twitterClientId}&redirect_uri=${baseUrl}/api/callback/twitter&response_type=code&scope=tweet.read,tweet.write,users.read`;
          break;
          
        case 'openai':
        case 'anthropic':
        case 'perplexity':
        case 'ollama':
        case 'text-processor':
          // For AI services, we'd typically use API keys not OAuth, so we'll use a custom flow
          oauthUrl = `${baseUrl}/api/callback/${appId}?code=direct_api_integration&api_integration=true`;
          break;
          
        default:
          // For other services, create a generic error response
          return res.status(400).json({ 
            message: `No OAuth configuration available for ${appId}`, 
            missingCredential: true,
            service: appId 
          });
      }
      
      // Return the OAuth URL to the client so it can redirect
      res.json({ oauthUrl });
    } catch (error) {
      console.error("OAuth URL generation error:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });
  
  // POST /api/app-connections/:appId/connect - Connect an app
  app.post("/api/app-connections/:appId/connect", async (req, res) => {
    try {
      const { appId } = req.params;
      const { code, apiIntegration } = req.body;
      
      let username = '';
      let permissions = ["read", "write"];
      
      // For AI services, we set specific usernames and permissions
      if (apiIntegration) {
        switch (appId) {
          case 'openai':
            username = 'OpenAI API';
            permissions = ["text-generation", "image-generation", "text-analysis"];
            break;
          case 'anthropic':
            username = 'Anthropic Claude API';
            permissions = ["text-generation", "text-analysis"];
            break;
          case 'perplexity':
            username = 'Perplexity API';
            permissions = ["search", "research"];
            break;
          case 'ollama':
            username = 'Ollama API';
            permissions = ["text-generation", "text-completion"];
            break;
          case 'text-processor':
            username = 'Text Processing Service';
            permissions = ["summarize", "format", "extract", "translate"];
            break;
          default:
            username = `${appId.charAt(0).toUpperCase() + appId.slice(1)} API`;
        }
      } else {
        // For OAuth services, we'd normally use the profile info from the OAuth provider
        username = `user@${appId}.com`;
      }
      
      // For demo purposes, we'll create a connection
      const newConnection = await storage.createAppConnection({
        appId,
        username,
        permissions,
        credentials: { token: apiIntegration ? "api-key-integration" : "mock-token" }
      } as any);
      
      res.json(newConnection);
    } catch (error) {
      console.error("App connection error:", error);
      res.status(500).json({ message: "Failed to connect app" });
    }
  });
  
  // GET /api/callback/:service - Handle OAuth callback 
  app.get("/api/callback/:service", async (req, res) => {
    try {
      const { service } = req.params;
      const { code } = req.query; // Auth code from OAuth provider
      const { error: oauthError, api_integration: apiIntegration } = req.query;
      
      // Check for OAuth errors
      if (oauthError) {
        return res.redirect(`/app-connections?error=${oauthError}`);
      }
      
      if (!code) {
        return res.redirect(`/app-connections?error=no_auth_code`);
      }
      
      // Get host information for redirect URIs
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.secure ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      
      // Get the OAuth credentials from session
      const oauthCredentials = req.session.oauthCredentials || {};
      
      let accessToken = "mock-token-for-demo";
      let username = `user@${service}.com`;
      let permissions = ["read", "write"];
      
      // In a real application, we would exchange this code for an access token
      // Here we'd use the client secret to make the token exchange
      if (apiIntegration !== 'true') {
        try {
          // Determine which client secret to use
          let clientId;
          let clientSecret;
          
          switch(service) {
            case 'instagram':
              clientId = oauthCredentials.instagram_client_id || process.env.INSTAGRAM_CLIENT_ID;
              clientSecret = oauthCredentials.instagram_client_secret || process.env.INSTAGRAM_CLIENT_SECRET;
              break;
            case 'linkedin':
              clientId = oauthCredentials.linkedin_client_id || process.env.LINKEDIN_CLIENT_ID;
              clientSecret = oauthCredentials.linkedin_client_secret || process.env.LINKEDIN_CLIENT_SECRET;
              break;
            case 'google':
              clientId = oauthCredentials.google_client_id || process.env.GOOGLE_CLIENT_ID;
              clientSecret = oauthCredentials.google_client_secret || process.env.GOOGLE_CLIENT_SECRET;
              break;
            case 'slack':
              clientId = oauthCredentials.slack_client_id || process.env.SLACK_CLIENT_ID;
              clientSecret = oauthCredentials.slack_client_secret || process.env.SLACK_CLIENT_SECRET;
              break;
            case 'twitter':
              clientId = oauthCredentials.twitter_client_id || process.env.TWITTER_CLIENT_ID;
              clientSecret = oauthCredentials.twitter_client_secret || process.env.TWITTER_CLIENT_SECRET;
              break;
          }
          
          // For a real implementation, we would make an API call to exchange the code for a token
          // For example with fetch:
          /*
          const tokenResponse = await fetch(`https://${service}.com/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              code: code,
              redirect_uri: `${baseUrl}/api/callback/${service}`,
              grant_type: 'authorization_code'
            })
          });
          
          if (!tokenResponse.ok) {
            throw new Error(`Failed to exchange code for token: ${tokenResponse.statusText}`);
          }
          
          const tokenData = await tokenResponse.json();
          accessToken = tokenData.access_token;
          */
        } catch (tokenError) {
          console.error("Token exchange error:", tokenError);
          // In a real app, we'd handle this error and show a specific message
          // For our demo, we'll continue with the mock token
        }
      }
      
      // Create the app connection
      const newConnection = await storage.createAppConnection({
        appId: service,
        username,
        permissions,
        credentials: { token: accessToken }
      } as any);
      
      // Return successful response with HTML that will close the popup and signal success
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <script>
            // Signal to opener that auth was successful and close this window
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth-success',
                service: '${service}'
              }, '*');
              window.close();
            } else {
              // If the opener is gone, redirect to the app
              window.location.href = '/app-connections?success=${service}';
            }
          </script>
        </head>
        <body>
          <h3>Authentication Successful!</h3>
          <p>You can close this window and return to the application.</p>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth callback error:", error);
      
      // Return error page that will close the popup and signal failure
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Failed</title>
          <script>
            // Signal to opener that auth failed and close this window
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth-error',
                error: 'Authentication failed'
              }, '*');
              window.close();
            } else {
              // If the opener is gone, redirect to the app
              window.location.href = '/app-connections?error=auth_failed';
            }
          </script>
        </head>
        <body>
          <h3>Authentication Failed</h3>
          <p>There was an error during authentication. You can close this window and try again.</p>
        </body>
        </html>
      `);
    }
  });
  
  // DELETE /api/app-connections/:appId - Disconnect an app
  app.delete("/api/app-connections/:appId", async (req, res) => {
    try {
      const { appId } = req.params;
      
      // Get all connections
      const connections = await storage.getAllAppConnections();
      
      // Find the connection with the matching appId
      const connectionToDelete = connections.find(conn => conn.appId === appId);
      
      if (!connectionToDelete) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // For a real app, we'd also revoke the token with the provider
      // For now, we'll just remove the connection from our storage
      await storage.deleteAppConnection(connectionToDelete.id);
      
      res.json({ success: true, message: "App disconnected successfully" });
    } catch (error) {
      console.error("App disconnection error:", error);
      res.status(500).json({ message: "Failed to disconnect app" });
    }
  });

  // OpenAI Service Routes
  app.post("/api/services/openai/generate-text", async (req, res) => {
    try {
      const { prompt, maxTokens, temperature } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await openaiService.generateText(
        prompt, 
        maxTokens || 500, 
        temperature || 0.7
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("OpenAI text generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/openai/generate-image", async (req, res) => {
    try {
      const { prompt, size, quality } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await openaiService.generateImage(prompt, size, quality);
      res.json(result);
    } catch (error: any) {
      console.error("OpenAI image generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate image", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/openai/analyze-text", async (req, res) => {
    try {
      const { text, task } = req.body;
      if (!text || !task) {
        return res.status(400).json({ message: "Text and task are required" });
      }
      
      const result = await openaiService.analyzeText(text, task);
      res.json(result);
    } catch (error: any) {
      console.error("OpenAI text analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze text", 
        error: error.message 
      });
    }
  });

  // Anthropic Service Routes
  app.post("/api/services/anthropic/generate-text", async (req, res) => {
    try {
      const { prompt, maxTokens, temperature } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await anthropicService.generateText(
        prompt, 
        maxTokens || 500, 
        temperature || 0.7
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Anthropic text generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/anthropic/analyze-text", async (req, res) => {
    try {
      const { text, task } = req.body;
      if (!text || !task) {
        return res.status(400).json({ message: "Text and task are required" });
      }
      
      const result = await anthropicService.analyzeText(text, task);
      res.json(result);
    } catch (error: any) {
      console.error("Anthropic text analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/anthropic/rewrite-content", async (req, res) => {
    try {
      const { text, instructions } = req.body;
      if (!text || !instructions) {
        return res.status(400).json({ message: "Text and instructions are required" });
      }
      
      const result = await anthropicService.rewriteContent(text, instructions);
      res.json(result);
    } catch (error: any) {
      console.error("Anthropic content rewriting error:", error);
      res.status(500).json({ 
        message: "Failed to rewrite content", 
        error: error.message 
      });
    }
  });

  // Ollama Service Routes
  app.post("/api/services/ollama/generate-text", async (req, res) => {
    try {
      const { prompt, model, maxTokens, temperature } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await ollamaService.generateText(
        prompt, 
        model || "llama3", 
        maxTokens || 500, 
        temperature || 0.7
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Ollama text generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/ollama/complete-text", async (req, res) => {
    try {
      const { text, model, maxTokens, temperature } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const result = await ollamaService.completeText(
        text, 
        model || "llama3", 
        maxTokens || 100, 
        temperature || 0.7
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Ollama text completion error:", error);
      res.status(500).json({ 
        message: "Failed to complete text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/ollama/analyze-text", async (req, res) => {
    try {
      const { text, task, model } = req.body;
      if (!text || !task) {
        return res.status(400).json({ message: "Text and task are required" });
      }
      
      const result = await ollamaService.analyzeText(text, task, model || "llama3");
      res.json(result);
    } catch (error: any) {
      console.error("Ollama text analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze text", 
        error: error.message 
      });
    }
  });

  // Perplexity Service Routes
  app.post("/api/services/perplexity/search", async (req, res) => {
    try {
      const { query, model, searchDomain, searchRecency, temperature, maxTokens } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const result = await perplexityService.performSearch(query, {
        model,
        searchDomain,
        searchRecency,
        temperature,
        maxTokens
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Perplexity search error:", error);
      res.status(500).json({ 
        message: "Failed to perform search", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/perplexity/analyze-topic", async (req, res) => {
    try {
      const { topic, model, searchRecency, temperature } = req.body;
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      const result = await perplexityService.analyzeTopic(topic, {
        model,
        searchRecency,
        temperature
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Perplexity topic analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze topic", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/perplexity/research-question", async (req, res) => {
    try {
      const { question, model, searchRecency, temperature } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const result = await perplexityService.researchQuestion(question, {
        model,
        searchRecency,
        temperature
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Perplexity question research error:", error);
      res.status(500).json({ 
        message: "Failed to research question", 
        error: error.message 
      });
    }
  });

  // Text Processor Service Routes
  app.post("/api/services/text-processor/summarize", async (req, res) => {
    try {
      const { text, length, format, focusOn } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const result = await textProcessorService.summarizeText(text, {
        length,
        format,
        focusOn
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Text summarization error:", error);
      res.status(500).json({ 
        message: "Failed to summarize text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/text-processor/format", async (req, res) => {
    try {
      const { text, targetFormat, includeHeadings, includeLists, indentationSpaces } = req.body;
      if (!text || !targetFormat) {
        return res.status(400).json({ 
          message: "Text and target format are required" 
        });
      }
      
      const result = await textProcessorService.formatText(
        text, 
        targetFormat, 
        {
          includeHeadings,
          includeLists,
          indentationSpaces
        }
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Text formatting error:", error);
      res.status(500).json({ 
        message: "Failed to format text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/text-processor/extract", async (req, res) => {
    try {
      const { text, extractionTypes, customPattern } = req.body;
      if (!text || !extractionTypes || !extractionTypes.length) {
        return res.status(400).json({ 
          message: "Text and extraction types are required" 
        });
      }
      
      const result = await textProcessorService.extractFromText(
        text, 
        extractionTypes, 
        customPattern
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Text extraction error:", error);
      res.status(500).json({ 
        message: "Failed to extract from text", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/text-processor/translate", async (req, res) => {
    try {
      const { text, targetLanguage, preserveFormatting, toneStyle } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ 
          message: "Text and target language are required" 
        });
      }
      
      const result = await textProcessorService.translateText(
        text, 
        targetLanguage, 
        {
          preserveFormatting,
          toneStyle
        }
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Text translation error:", error);
      res.status(500).json({ 
        message: "Failed to translate text", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

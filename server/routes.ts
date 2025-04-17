import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAutomationSchema, insertExecutionHistorySchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Import LLM service modules
import * as openaiService from "./services/openai";
import * as anthropicService from "./services/anthropic";
import * as ollamaService from "./services/ollama";
import * as perplexityService from "./services/perplexity";
import * as textProcessorService from "./services/text-processor";
import * as googleDocsService from "./services/google-docs";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
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
  
  // Unified AI service endpoint for easier automation usage
  app.post("/api/services/:service/generate", async (req, res) => {
    try {
      const { service } = req.params;
      const { prompt, systemMessage, model, maxTokens = 500, temperature = 0.7 } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      let result;
      
      switch (service) {
        case "openai":
          result = await openaiService.generateText(
            prompt, 
            maxTokens, 
            temperature, 
            model || "gpt-4o", 
            systemMessage,
            req
          );
          break;
          
        case "anthropic":
          result = await anthropicService.generateText(
            prompt,
            model || "claude-3-7-sonnet-20250219",
            maxTokens,
            temperature,
            systemMessage,
            req
          );
          break;
          
        case "perplexity":
          // For perplexity, we'll use the research question function which is most similar
          result = await perplexityService.researchQuestion(
            prompt,
            model || "llama-3.1-sonar-small-128k-online",
            maxTokens,
            req
          );
          break;
          
        case "ollama":
          result = await ollamaService.generateText(
            prompt,
            model || "llama2",
            maxTokens,
            temperature,
            req
          );
          break;
          
        default:
          return res.status(400).json({ message: "Unknown AI service" });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error(`Error in /${req.params.service}/generate:`, error);
      res.status(500).json({ 
        message: error.message || "An error occurred during text generation",
        service: req.params.service
      });
    }
  });
  
  // Generic API key check endpoint
  app.get("/api/settings/check-api-key", (req, res) => {
    const service = req.query.service as string;
    
    if (!service) {
      return res.status(400).json({ message: "Service parameter is required" });
    }
    
    // Get API keys from session
    const apiKeys = req.session.apiKeys || {};
    let available = false;
    
    switch (service) {
      case 'openai':
        available = !!process.env.OPENAI_API_KEY || !!apiKeys.openai;
        break;
      case 'anthropic':
        available = !!process.env.ANTHROPIC_API_KEY || !!apiKeys.anthropic;
        break;
      case 'perplexity':
        available = !!process.env.PERPLEXITY_API_KEY || !!apiKeys.perplexity;
        break;
      case 'ollama':
        available = !!process.env.OLLAMA_HOST || !!apiKeys.ollama;
        break;
      case 'text-processor':
        // Text processor uses other services, so it's available if at least one LLM is available
        available = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY || 
                    !!apiKeys.openai || !!apiKeys.anthropic;
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
  app.post("/api/settings/api-keys", async (req, res) => {
    try {
      // Initialize API keys in session if needed
      if (!req.session.apiKeys) {
        req.session.apiKeys = {};
      }
      
      const newKeys = req.body;
      const validationResults = {};
      
      // Validate OpenAI key if provided
      if (newKeys.openai && newKeys.openai !== req.session.apiKeys.openai) {
        try {
          const openai = new OpenAI({ apiKey: newKeys.openai });
          // Try a simple request to verify the key
          await openai.models.list();
          validationResults['openai'] = 'valid';
        } catch (error) {
          console.error("Invalid OpenAI API key:", error);
          validationResults['openai'] = 'invalid';
          return res.status(400).json({ 
            message: "Invalid OpenAI API key. Please check your key and try again.",
            service: "openai" 
          });
        }
      }
      
      // Validate Anthropic key if provided
      if (newKeys.anthropic && newKeys.anthropic !== req.session.apiKeys.anthropic) {
        try {
          const anthropic = new Anthropic({ apiKey: newKeys.anthropic });
          // Simple request to verify key
          await anthropic.models.list();
          validationResults['anthropic'] = 'valid';
        } catch (error) {
          console.error("Invalid Anthropic API key:", error);
          validationResults['anthropic'] = 'invalid';
          return res.status(400).json({ 
            message: "Invalid Anthropic API key. Please check your key and try again.",
            service: "anthropic" 
          });
        }
      }
      
      // Perplexity API validation
      if (newKeys.perplexity && newKeys.perplexity !== req.session.apiKeys.perplexity) {
        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newKeys.perplexity}`
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
              messages: [{ role: 'user', content: 'Hello' }],
              max_tokens: 5
            })
          });
          
          if (!response.ok) {
            validationResults['perplexity'] = 'invalid';
            return res.status(400).json({ 
              message: "Invalid Perplexity API key. Please check your key and try again.",
              service: "perplexity" 
            });
          }
          
          validationResults['perplexity'] = 'valid';
        } catch (error) {
          console.error("Invalid Perplexity API key:", error);
          validationResults['perplexity'] = 'invalid';
          return res.status(400).json({ 
            message: "Invalid Perplexity API key. Please check your key and try again.",
            service: "perplexity" 
          });
        }
      }
      
      // Merge the new validated API keys with existing ones
      req.session.apiKeys = {
        ...req.session.apiKeys,
        ...newKeys
      };
      
      res.status(200).json({ 
        message: "API keys saved successfully",
        validationResults: validationResults
      });
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
      const redirectUri = `${baseUrl}/api/callback/${appId}`;
      
      // Generate appropriate OAuth URLs for each supported service
      let oauthUrl = '';
      let useSimulatedLogin = false;

      // Check if we're in development mode or if secrets are missing
      // This helps avoid API errors when credentials aren't fully set up
      const inDevelopmentMode = true; // Set to false in production
      
      // Handle different OAuth providers
      switch (appId) {
        case 'instagram':
          if (inDevelopmentMode || !process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
            // Use simulated login for development or when credentials aren't available
            useSimulatedLogin = true;
          } else {
            // Instagram OAuth URL
            oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile&response_type=code`;
          }
          break;
          
        case 'linkedin':
          if (inDevelopmentMode || !process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
            useSimulatedLogin = true;
          } else {
            // LinkedIn OAuth URL
            oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_liteprofile%20r_emailaddress%20w_member_social&response_type=code`;
          }
          break;
          
        case 'twitter':
          if (inDevelopmentMode || !process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
            useSimulatedLogin = true;
          } else {
            // Twitter OAuth 2.0 URL
            oauthUrl = `https://twitter.com/i/oauth2/authorize?client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read&response_type=code&state=state&code_challenge=challenge&code_challenge_method=plain`;
          }
          break;
          
        case 'google-drive':
        case 'gmail':
        case 'google-sheets':
        case 'google-calendar':
          if (inDevelopmentMode || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            useSimulatedLogin = true;
          } else {
            // Google OAuth URL with appropriate scopes
            let scopes = 'https://www.googleapis.com/auth/userinfo.profile';
            
            if (appId === 'gmail') {
              scopes += ' https://www.googleapis.com/auth/gmail.readonly';
            } else if (appId === 'google-drive') {
              scopes += ' https://www.googleapis.com/auth/drive.file';
            } else if (appId === 'google-sheets') {
              scopes += ' https://www.googleapis.com/auth/spreadsheets';
            } else if (appId === 'google-calendar') {
              scopes += ' https://www.googleapis.com/auth/calendar';
            }
            
            oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent`;
          }
          break;
          
        case 'slack':
          if (inDevelopmentMode || !process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET) {
            useSimulatedLogin = true;
          } else {
            // Slack OAuth URL
            oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=channels:read,chat:write&user_scope=`;
          }
          break;
          
        case 'facebook-ads':
          if (inDevelopmentMode || !process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
            useSimulatedLogin = true;
          } else {
            // Facebook OAuth URL
            oauthUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_management,ads_read&response_type=code`;
          }
          break;
          
        case 'trello':
          if (inDevelopmentMode || !process.env.TRELLO_CLIENT_ID || !process.env.TRELLO_CLIENT_SECRET) {
            useSimulatedLogin = true;
          } else {
            // Trello OAuth URL
            oauthUrl = `https://trello.com/1/authorize?expiration=never&name=FlowConnect&scope=read,write&response_type=code&client_id=${process.env.TRELLO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
          }
          break;
          
        case 'openai':
        case 'anthropic':
        case 'perplexity':
        case 'ollama':
        case 'text-processor':
          // For API services, we'll use API keys directly, no need for OAuth
          // Call the callback endpoint directly with a special flag
          return res.json({
            oauthUrl: `${baseUrl}/api/callback/${appId}?code=direct_api_integration&api_integration=true`
          });
          
        default:
          // For services that we don't have specific OAuth implementations for yet
          useSimulatedLogin = true;
      }
      
      // Use simulated login for development mode or when credentials are missing
      if (useSimulatedLogin) {
        console.log(`Using simulated login for ${appId} as we're in development mode or OAuth credentials are missing`);
        oauthUrl = `${baseUrl}/api/simulated-login?service=${appId}&redirect=${encodeURIComponent(`${baseUrl}/api/callback/${appId}`)}`;
      }
      
      // Return the OAuth URL to the client for redirect
      res.json({ oauthUrl });
      
    } catch (error) {
      console.error("OAuth URL generation error:", error);
      res.status(500).json({ message: "Failed to generate OAuth URL" });
    }
  });
  
  // GET /api/simulated-login - Simulated OAuth login page for services without implemented OAuth
  app.get("/api/simulated-login", (req, res) => {
    const { service, redirect } = req.query;
    
    if (!service || !redirect) {
      return res.status(400).send("Missing required parameters");
    }
    
    // Return a simple HTML login form
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login to ${service}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 500px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #2d3748;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
          }
          form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          input {
            padding: 0.5rem;
            border: 1px solid #cbd5e0;
            border-radius: 0.25rem;
          }
          button {
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.25rem;
            padding: 0.5rem 1rem;
            cursor: pointer;
            font-weight: 500;
          }
          button:hover {
            background-color: #4338ca;
          }
          .logo {
            width: 50px;
            height: 50px;
            margin: 0 auto 1rem;
            display: block;
          }
          .hint {
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #718096;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <img src="https://placehold.co/50x50/4f46e5/white?text=${service as string ? (service as string).charAt(0).toUpperCase() : 'S'}" class="logo" alt="${service} logo">
          <h1>Sign in to ${service}</h1>
          <form action="${redirect}" method="GET">
            <input type="text" name="username" placeholder="Username or Email" required>
            <input type="password" name="password" placeholder="Password" required>
            <input type="hidden" name="service" value="${service}">
            <button type="submit">Sign In</button>
          </form>
          <p class="hint">
            This is a simulated login for demonstration purposes only.
            <br>No actual authentication will take place.
          </p>
        </div>
      </body>
      </html>
    `);
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
            username = `${typeof appId === 'string' ? appId.charAt(0).toUpperCase() + appId.slice(1) : 'Unknown'} API`;
        }
      } else {
        // For OAuth services, we'd normally use the profile info from the OAuth provider
        username = `user@${typeof appId === 'string' ? appId : 'app'}.com`;
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
      
      // Exchange the authorization code for an access token
      if (apiIntegration !== 'true') {
        try {
          // Determine which client secret and token endpoint to use
          let clientId, clientSecret, tokenUrl, requestBody, requestHeaders;
          const redirectUri = `${baseUrl}/api/callback/${service}`;
          
          switch(service) {
            case 'instagram':
              clientId = process.env.INSTAGRAM_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Instagram token exchange via POST to access_token endpoint
              tokenUrl = 'https://api.instagram.com/oauth/access_token';
              
              // Instagram requires form-urlencoded body
              requestBody = new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code.toString()
              });
              
              requestHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded'
              };
              break;
              
            case 'linkedin':
              clientId = process.env.LINKEDIN_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.LINKEDIN_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // LinkedIn token exchange
              tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
              
              // LinkedIn also requires form-urlencoded
              requestBody = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code.toString(),
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret
              });
              
              requestHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded'
              };
              break;
              
            case 'google-drive':
            case 'gmail':
            case 'google-sheets':
            case 'google-calendar':
              clientId = process.env.GOOGLE_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Google token exchange
              tokenUrl = 'https://oauth2.googleapis.com/token';
              
              // Google requires form-urlencoded
              requestBody = new URLSearchParams({
                code: code.toString(),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
              });
              
              requestHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded'
              };
              break;
              
            case 'slack':
              clientId = process.env.SLACK_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.SLACK_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Slack token exchange
              tokenUrl = 'https://slack.com/api/oauth.v2.access';
              
              // Slack requires form-urlencoded
              requestBody = new URLSearchParams({
                code: code.toString(),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri
              });
              
              requestHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded'
              };
              break;
              
            case 'twitter':
              clientId = process.env.TWITTER_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.TWITTER_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Twitter token exchange
              tokenUrl = 'https://api.twitter.com/2/oauth2/token';
              
              // Twitter requires form-urlencoded with basic auth
              requestBody = new URLSearchParams({
                code: code.toString(),
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code_verifier: 'challenge'  // This should be the original code verifier used in the request
              });
              
              // Twitter uses Basic auth with client ID and secret
              const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
              requestHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
              };
              break;
              
            case 'facebook-ads':
              clientId = process.env.FACEBOOK_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.FACEBOOK_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Facebook token exchange
              tokenUrl = 'https://graph.facebook.com/v16.0/oauth/access_token';
              
              // Facebook can accept query parameters
              tokenUrl += `?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
              
              // This will be a GET request, so body is empty
              requestBody = null;
              requestHeaders = {};
              break;
              
            default:
              // For other services where we don't have specific code, use a mock token
              console.log(`Using mock token for ${service} as no token exchange implementation exists`);
              break;
          }
          
          // If we have token URL and headers set up, make the token exchange request
          if (tokenUrl && requestHeaders) {
            try {
              console.log(`Exchanging code for token with ${service}...`);
              
              // Make the token request
              const method = requestBody ? 'POST' : 'GET';
              const tokenResponse = await fetch(tokenUrl, {
                method,
                headers: requestHeaders,
                body: requestBody
              });
              
              if (!tokenResponse.ok) {
                console.error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
                throw new Error(`Failed to exchange code for token: ${tokenResponse.statusText}`);
              }
              
              const tokenData = await tokenResponse.json();
              console.log(`Token received for ${service}:`, tokenData);
              
              // Store the token
              accessToken = tokenData.access_token;
              
              // If we have a user info endpoint, fetch the user profile
              if (accessToken) {
                let userEndpoint;
                let userHeaders = { 'Authorization': `Bearer ${accessToken}` };
                
                switch(service) {
                  case 'instagram':
                    userEndpoint = 'https://graph.instagram.com/me?fields=id,username';
                    break;
                  case 'linkedin':
                    userEndpoint = 'https://api.linkedin.com/v2/me';
                    break;
                  case 'google-drive':
                  case 'gmail':
                  case 'google-sheets':
                  case 'google-calendar':
                    userEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
                    break;
                  case 'slack':
                    userEndpoint = 'https://slack.com/api/users.identity';
                    break;
                  case 'twitter':
                    userEndpoint = 'https://api.twitter.com/2/users/me';
                    break;
                }
                
                // If we have a user endpoint, make the request
                if (userEndpoint) {
                  const userResponse = await fetch(userEndpoint, {
                    headers: userHeaders
                  });
                  
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    console.log(`User data received for ${service}:`, userData);
                    
                    // Extract the username based on the service
                    if (userData) {
                      if (service === 'instagram' && userData.username) {
                        username = userData.username;
                      } else if (service === 'linkedin' && userData.localizedFirstName) {
                        username = `${userData.localizedFirstName} ${userData.localizedLastName || ''}`;
                      } else if ((service.startsWith('google') || service === 'gmail') && userData.email) {
                        username = userData.email;
                      } else if (service === 'slack' && userData.user && userData.user.name) {
                        username = userData.user.name;
                      } else if (service === 'twitter' && userData.data && userData.data.username) {
                        username = userData.data.username;
                      }
                    }
                  } else {
                    console.error(`Failed to get user profile: ${userResponse.status} ${userResponse.statusText}`);
                  }
                }
              }
            } catch (error) {
              console.error(`Error exchanging token for ${service}:`, error);
              // Continue with mock token for demo purposes
            }
          }
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
      const { prompt, maxTokens, temperature, model, systemMessage } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await openaiService.generateText(
        prompt, 
        maxTokens || 500, 
        temperature || 0.7,
        model || "gpt-4o",
        systemMessage,
        req
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
      
      const result = await openaiService.generateImage(prompt, size, quality, req);
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
      
      const result = await openaiService.analyzeText(text, task, req);
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
      const { prompt, maxTokens, temperature, model, systemMessage } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await anthropicService.generateText(
        prompt, 
        maxTokens || 500, 
        temperature || 0.7,
        model || "claude-3-7-sonnet-20250219",
        systemMessage
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
      const { query, model, searchDomain, searchRecency, temperature, maxTokens, systemMessage } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const result = await perplexityService.performSearch(query, {
        model,
        searchDomain,
        searchRecency,
        temperature,
        maxTokens,
        systemMessage
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
      const { topic, model, searchRecency, temperature, systemMessage, maxTokens } = req.body;
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      const result = await perplexityService.analyzeTopic(topic, {
        model,
        searchRecency,
        temperature,
        systemMessage,
        maxTokens
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
      const { question, model, searchRecency, temperature, systemMessage, maxTokens } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const result = await perplexityService.researchQuestion(question, {
        model,
        searchRecency,
        temperature,
        systemMessage,
        maxTokens
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
      
      // Update OpenAI implementation to use session API key if available
      openaiService.getOpenAIInstance(req);
      
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
      
      // Update OpenAI implementation to use session API key if available
      openaiService.getOpenAIInstance(req);
      
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
      
      // Update OpenAI implementation to use session API key if available
      openaiService.getOpenAIInstance(req);
      
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
      
      // Update OpenAI implementation to use session API key if available
      openaiService.getOpenAIInstance(req);
      
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

  // Health score and achievement routes
  app.get("/api/automations/:id/health", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }
      
      const automation = await storage.getAutomation(id);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      // Get execution histories to compute metrics
      const histories = await storage.getExecutionHistoriesByAutomationId(id);
      
      // Build health report with improvement suggestions
      const healthReport = {
        score: automation.healthScore,
        reliability: automation.reliability,
        complexity: automation.complexity,
        lastCheckedAt: new Date(),
        improvementSuggestions: []
      };
      
      // Add improvement suggestions based on metrics
      if (histories.length > 0) {
        const errors = histories.filter(h => h.status === 'error');
        const errorRate = errors.length / histories.length;
        
        if (errorRate > 0.1) {
          healthReport.improvementSuggestions.push({
            category: 'reliability',
            message: 'Add error handling to improve workflow reliability',
            priority: 'high'
          });
        }
      }
      
      if (automation.complexity < 2) {
        healthReport.improvementSuggestions.push({
          category: 'complexity',
          message: 'Add conditional steps to make your workflow more sophisticated',
          priority: 'medium'
        });
      }
      
      if (!automation.triggerConfig || Object.keys(automation.triggerConfig).length < 2) {
        healthReport.improvementSuggestions.push({
          category: 'configuration',
          message: 'Add more specific trigger conditions to reduce false positives',
          priority: 'low'
        });
      }
      
      res.json(healthReport);
    } catch (error) {
      console.error("Error generating automation health report:", error);
      res.status(500).json({ message: "Failed to get automation health" });
    }
  });
  
  app.patch("/api/automations/:id/health-score", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }
      
      const { healthScore } = req.body;
      if (typeof healthScore !== 'number' || healthScore < 0 || healthScore > 100) {
        return res.status(400).json({ message: "Health score must be a number between 0 and 100" });
      }
      
      const automation = await storage.updateAutomationHealthScore(id, healthScore);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      res.json(automation);
    } catch (error) {
      console.error("Error updating automation health score:", error);
      res.status(500).json({ message: "Failed to update health score" });
    }
  });
  
  app.patch("/api/automations/:id/complexity", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }
      
      const { complexity } = req.body;
      if (typeof complexity !== 'number' || complexity < 1) {
        return res.status(400).json({ message: "Complexity must be a positive number" });
      }
      
      const automation = await storage.updateAutomationComplexity(id, complexity);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      res.json(automation);
    } catch (error) {
      console.error("Error updating automation complexity:", error);
      res.status(500).json({ message: "Failed to update complexity" });
    }
  });
  
  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  app.get("/api/automations/:id/achievements", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }
      
      const automation = await storage.getAutomation(id);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      const achievements = await storage.getUnlockedAchievements(id);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching automation achievements:", error);
      res.status(500).json({ message: "Failed to fetch automation achievements" });
    }
  });
  
  app.post("/api/automations/:id/unlock-achievement", async (req, res) => {
    try {
      const automationId = parseInt(req.params.id);
      if (isNaN(automationId)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }
      
      const { achievementId } = req.body;
      if (typeof achievementId !== 'number' || isNaN(achievementId)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }
      
      const automation = await storage.getAutomation(automationId);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      const achievement = await storage.getAchievement(achievementId);
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      const userAchievement = await storage.unlockAchievement(automationId, achievementId);
      res.status(201).json(userAchievement);
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      res.status(500).json({ message: "Failed to unlock achievement" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

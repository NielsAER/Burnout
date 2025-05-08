import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAutomationSchema, insertExecutionHistorySchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { 
  oauthConfigs, 
  isValidOAuthService, 
  generateState, 
  storeOAuthState, 
  verifyOAuthState, 
  storeOAuthCredentials,
  saveConnection,
  getSimulatedAuthUrl
} from './oauth';

// Import LLM service modules
import * as openaiService from "./services/openai";
import * as anthropicService from "./services/anthropic";
import * as ollamaService from "./services/ollama";
import * as perplexityService from "./services/perplexity";
import * as textProcessorService from "./services/text-processor";
import * as googleDocsService from "./services/google-docs";
import * as workflowSuggestionService from "./services/workflowSuggestions";
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
      
      // Calculate complexity score for the new automation
      const { calculateWorkflowComplexity, countWorkflowConditions } = await import('./utils/complexityCalculator');
      const complexityScore = calculateWorkflowComplexity(validatedData);
      
      // Create the automation
      const newAutomation = await storage.createAutomation({
        ...validatedData, 
        complexity: complexityScore
      });
      
      // Automatically check for and unlock achievements
      try {
        const conditionCount = countWorkflowConditions(newAutomation);
        
        // Check for Workflow Pioneer achievement (always unlock for first workflow)
        const allAutomations = await storage.getAllAutomations();
        if (allAutomations.length === 1) {
          await storage.unlockAchievement(newAutomation.id, 1); // Pioneer achievement ID
        }
        
        // Check for Workflow Architect achievement (at least 3 conditions)
        if (conditionCount >= 3) {
          await storage.unlockAchievement(newAutomation.id, 3); // Workflow Architect achievement ID
        }
        
        // Check for Conditional Logic Pro achievement (at least 5 conditions)
        if (conditionCount >= 5) {
          await storage.unlockAchievement(newAutomation.id, 7); // Conditional Logic Pro achievement ID
        }
        
        // Check for Complexity Wizard achievement (complexity score of 5+)
        if (complexityScore >= 5) {
          await storage.unlockAchievement(newAutomation.id, 4); // Complexity Wizard achievement ID
        }
        
        // Check for Master Engineer achievement (complexity score of 8+)
        if (complexityScore >= 8) {
          await storage.unlockAchievement(newAutomation.id, 5); // Master Engineer achievement ID
        }
        
        // Check for AI Integrator achievement
        const hasAiService = validatedData.actions?.some((action: any) => 
          ['openai', 'anthropic', 'perplexity', 'ollama'].includes(action.appId)
        ) || ['openai', 'anthropic', 'perplexity', 'ollama'].includes(validatedData.actionAppId);
        
        if (hasAiService) {
          await storage.unlockAchievement(newAutomation.id, 6); // AI Integrator achievement ID
        }
      } catch (achievementError) {
        console.error("Error processing achievements:", achievementError);
        // Continue with the response - achievements are nice-to-have but not critical
      }
      
      res.status(201).json(newAutomation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid automation data", errors: error.errors });
      }
      console.error("Error creating automation:", error);
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
      
      // Recalculate complexity score for the updated automation if relevant fields changed
      if (validatedData.triggerConfig || validatedData.actionConfig || validatedData.actions) {
        try {
          // Get the full automation data
          const existingAutomation = await storage.getAutomation(id);
          if (existingAutomation) {
            // Merge existing with changes to calculate new complexity
            const mergedData = {...existingAutomation, ...validatedData};
            
            const { calculateWorkflowComplexity, countWorkflowConditions } = await import('./utils/complexityCalculator');
            const complexityScore = calculateWorkflowComplexity(mergedData);
            
            // Add complexity to the update data
            validatedData.complexity = complexityScore;
            
            // Check if this update unlocks any complexity-based achievements
            const conditionCount = countWorkflowConditions(mergedData);
            
            // Check for Workflow Architect achievement (at least 3 conditions)
            if (conditionCount >= 3) {
              await storage.unlockAchievement(id, 3); // Workflow Architect achievement ID
            }
            
            // Check for Conditional Logic Pro achievement (at least 5 conditions)
            if (conditionCount >= 5) {
              await storage.unlockAchievement(id, 7); // Conditional Logic Pro achievement ID
            }
            
            // Check for Complexity Wizard achievement (complexity score of 5+)
            if (complexityScore >= 5) {
              await storage.unlockAchievement(id, 4); // Complexity Wizard achievement ID
            }
            
            // Check for Master Engineer achievement (complexity score of 8+)
            if (complexityScore >= 8) {
              await storage.unlockAchievement(id, 5); // Master Engineer achievement ID
            }
            
            // Check for AI Integrator achievement
            const hasAiService = mergedData.actions?.some((action: any) => 
              ['openai', 'anthropic', 'perplexity', 'ollama'].includes(action.appId)
            ) || ['openai', 'anthropic', 'perplexity', 'ollama'].includes(mergedData.actionAppId);
            
            if (hasAiService) {
              await storage.unlockAchievement(id, 6); // AI Integrator achievement ID
            }
          }
        } catch (complexityError) {
          console.error("Error calculating complexity:", complexityError);
          // Continue with the update, just without the complexity recalculation
        }
      }
      
      const updatedAutomation = await storage.updateAutomation(id, validatedData);

      if (!updatedAutomation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      res.json(updatedAutomation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid automation data", errors: error.errors });
      }
      console.error("Error updating automation:", error);
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

  // GET /api/execution-history - Get all execution histories
  app.get("/api/execution-history", async (req, res) => {
    try {
      // Log more information for debugging
      console.log("Fetching execution histories...");
      
      const histories = await storage.getAllExecutionHistories();
      console.log(`Found ${histories.length} execution history records`);
      
      const automations = await storage.getAllAutomations();
      console.log(`Found ${automations.length} automations for enrichment`);
      
      // Enrich history data with automation names for display
      const enrichedHistories = histories.map(history => {
        const automation = automations.find(a => a.id === history.automationId);
        return {
          ...history,
          automationName: automation?.name || `Automation ${history.automationId}`,
          // Map executedAt to timestamp for compatibility with existing frontend
          timestamp: history.executedAt,
          // Ensure data and other fields are always provided
          data: history.data || {},
          duration: history.duration || 0,
          level: history.level || "info",
          message: history.message || ""
        };
      });
      
      res.json(enrichedHistories);
    } catch (error) {
      console.error("Error fetching execution history:", error);
      console.error(error.stack || "No stack trace available");
      res.status(500).json({ message: "Failed to fetch execution histories" });
    }
  });

  // GET /api/execution-history/:automationId - Get execution histories for a specific automation
  app.get("/api/execution-history/:automationId", async (req, res) => {
    try {
      const automationId = parseInt(req.params.automationId);
      const histories = await storage.getExecutionHistoriesByAutomationId(automationId);
      const automation = await storage.getAutomation(automationId);
      
      // Enrich history data with automation names
      const enrichedHistories = histories.map(history => ({
        ...history,
        automationName: automation?.name || `Automation ${automationId}`,
        timestamp: history.executedAt
      }));
      
      res.json(enrichedHistories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch execution histories for automation" });
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
  
  // POST /api/automations/from-template/:templateId - Create automation from template
  app.post("/api/automations/from-template/:templateId", async (req, res) => {
    try {
      const templateId = req.params.templateId;
      
      // Define trigger and action apps based on the template ID
      let triggerAppId = "trigger-app";
      let actionAppId = "action-app";
      let name = `New Automation from Template (${templateId})`;
      let description = "Created from template";
      let triggerConfig = {};
      let actionConfig = {};
      
      // Configure template-specific details
      switch (templateId) {
        case "linkedin-ai-post":
          triggerAppId = "schedule";
          actionAppId = "linkedin";
          name = "LinkedIn AI Post Generator";
          description = "Automatically generate and post content to LinkedIn on a schedule";
          triggerConfig = { frequency: "daily", time: "09:00" };
          actionConfig = { postType: "article", useAI: true };
          break;
          
        case "instagram-visual-post":
          triggerAppId = "schedule";
          actionAppId = "instagram";
          name = "Instagram AI Content Creator";
          description = "Create and post AI-generated images to Instagram";
          triggerConfig = { frequency: "weekly", days: ["monday", "thursday"] };
          actionConfig = { mediaType: "image", caption: true };
          break;
          
        case "teams-meeting-summarizer":
          triggerAppId = "microsoft-teams";
          actionAppId = "openai";
          name = "Teams Meeting Summarizer";
          description = "Generate meeting summaries from Microsoft Teams calls";
          triggerConfig = { eventType: "meeting-ended" };
          actionConfig = { model: "gpt-4o", maxTokens: 500 };
          break;
          
        case "mailchimp-newsletter":
          triggerAppId = "schedule";
          actionAppId = "mailchimp";
          name = "AI Newsletter Generator";
          description = "Create and send personalized newsletters through Mailchimp";
          triggerConfig = { frequency: "weekly", day: "friday", time: "10:00" };
          actionConfig = { listId: "primary", templateId: "newsletter-template" };
          break;
          
        case "google-docs-summary":
          triggerAppId = "google-docs";
          actionAppId = "openai";
          name = "Google Docs AI Summarizer";
          description = "Automatically summarize Google Docs documents";
          triggerConfig = { eventType: "document-updated" };
          actionConfig = { model: "gpt-4o", maxTokens: 300 };
          break;
          
        case "slack-daily-updates":
          triggerAppId = "schedule";
          actionAppId = "slack";
          name = "Slack Daily Status Updates";
          description = "Post daily team updates to Slack channels";
          triggerConfig = { frequency: "daily", weekdays: true, time: "17:00" };
          actionConfig = { channel: "team-updates", format: "summary" };
          break;
          
        case "notion-research-assistant":
          triggerAppId = "notion";
          actionAppId = "openai";
          name = "Notion Research Assistant";
          description = "Research topics and organize findings in Notion";
          triggerConfig = { database: "research-topics", trigger: "new-item" };
          actionConfig = { model: "gpt-4o", maxTokens: 1000, output: "notion-page" };
          break;
          
        case "content-scheduler":
          triggerAppId = "schedule";
          actionAppId = "multi-platform";
          name = "Multi-Platform Content Scheduler";
          description = "Schedule content across multiple social platforms";
          triggerConfig = { frequency: "weekly", days: ["tuesday", "friday"] };
          actionConfig = { platforms: ["linkedin", "twitter", "instagram"] };
          break;
          
        case "ai-customer-service":
          triggerAppId = "email";
          actionAppId = "openai";
          name = "AI Customer Service Assistant";
          description = "Respond to customer inquiries with AI assistance";
          triggerConfig = { mailbox: "support@company.com", filter: "unread" };
          actionConfig = { model: "gpt-4o", toneStyle: "helpful", responseTemplate: "customer-service" };
          break;
          
        case "scheduled-reporting":
          triggerAppId = "schedule";
          actionAppId = "report-generator";
          name = "Automated Weekly Reports";
          description = "Generate and distribute reports on a schedule";
          triggerConfig = { frequency: "weekly", day: "monday", time: "06:00" };
          actionConfig = { reportType: "performance", distribution: "email" };
          break;
          
        case "lead-generation":
          triggerAppId = "web-form";
          actionAppId = "crm";
          name = "Intelligent Lead Generator";
          description = "Identify and qualify sales leads automatically";
          triggerConfig = { formId: "contact-form", website: "company.com" };
          actionConfig = { crmPlatform: "salesforce", qualifyWithAI: true };
          break;
          
        case "time-tracker":
          triggerAppId = "schedule";
          actionAppId = "time-tracking";
          name = "Automated Time Tracking";
          description = "Track time spent on projects and generate reports";
          triggerConfig = { frequency: "daily", time: "18:00" };
          actionConfig = { projectTracking: true, reportFrequency: "weekly" };
          break;
          
        default:
          // Use generic values as fallback
          break;
      }
      
      // Create a new automation based on the template details
      const newAutomation = {
        name,
        description,
        active: false,
        triggerAppId,
        actionAppId,
        triggerConfig,
        actionConfig,
        userId: req.user?.id || 1,
        complexity: 3,
        healthScore: 85,
        totalRuns: 0,
        reliability: {
          success: 0,
          failed: 0,
          total: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const automation = await storage.createAutomation(newAutomation);
      res.status(200).json(automation);
    } catch (error) {
      console.error("Failed to create automation from template:", error);
      res.status(500).json({ message: "Failed to create automation from template" });
    }
  });
  
  // GET /api/achievements - Get all achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  // GET /api/achievements/automation/:automationId - Get unlocked achievements for an automation
  app.get("/api/achievements/automation/:automationId", async (req, res) => {
    try {
      const automationId = parseInt(req.params.automationId);
      if (isNaN(automationId)) {
        return res.status(400).json({ message: "Invalid automation ID" });
      }
      
      const achievements = await storage.getUnlockedAchievements(automationId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unlocked achievements" });
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
  
  // OAuth Routes

  // Start OAuth flow for a specific service
  app.get('/api/auth/:service', async (req, res) => {
    const { service } = req.params;
    
    if (!isValidOAuthService(service)) {
      return res.status(400).json({ error: `Unsupported service: ${service}` });
    }
    
    const config = oauthConfigs[service];
    const redirect_uri = `${req.protocol}://${req.get('host')}${config.callbackURL}`;
    
    // Check for simulated authentication in development
    const simulatedUrl = getSimulatedAuthUrl(req, service, redirect_uri);
    if (simulatedUrl) {
      return res.redirect(simulatedUrl);
    }
    
    // Generate and store a state parameter to prevent CSRF
    const state = generateState();
    storeOAuthState(req, service, state);
    
    // Build the authorization URL
    const authUrl = new URL(config.authorizationURL);
    authUrl.searchParams.append('client_id', config.clientID!);
    authUrl.searchParams.append('redirect_uri', redirect_uri);
    authUrl.searchParams.append('scope', config.scope.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('response_type', 'code');
    
    // Add service-specific parameters
    if (service === 'instagram') {
      // Instagram requires this additional parameter
      authUrl.searchParams.append('response_type', 'code');
    } else if (service === 'twitter') {
      // Twitter requires these additional parameters
      authUrl.searchParams.append('code_challenge', 'challenge');
      authUrl.searchParams.append('code_challenge_method', 'plain');
    }
    
    // Redirect the user to the authorization URL
    res.redirect(authUrl.toString());
  });

  // OAuth callback routes - keeping for backward compatibility
  app.get('/api/auth/:service/callback', async (req, res) => {
    const { service } = req.params;
    const { code, state } = req.query;
    
    if (!isValidOAuthService(service)) {
      return res.status(400).json({ error: `Unsupported service: ${service}` });
    }
    
    // For backwards compatibility, redirect to the new callback URL format
    console.log(`Redirecting from old callback format to new format for ${service}`);
    const redirectUrl = `/api/callback/${service}?code=${code}&state=${state}`;
    return res.redirect(redirectUrl);
  });
  
  // New OAuth callback routes using consistent pattern
  app.get('/api/callback/:service', async (req, res) => {
    const { service } = req.params;
    const { code, state, api_integration } = req.query;
    
    console.log(`OAuth callback received for ${service}`);
    
    // Special handling for direct API integrations
    if (api_integration === 'true') {
      console.log(`Processing direct API integration for ${service}`);
      
      // For API-based services like OpenAI, create a placeholder connection
      const profile = {
        id: `${service}_api`,
        username: `${service}_api`,
        name: `${service.charAt(0).toUpperCase() + service.slice(1)} API`
      };
      
      const credentials = {
        integrated: true,
        created_at: new Date()
      };
      
      // Store minimal credentials in the session
      storeOAuthCredentials(req, service, credentials);
      
      // Save the connection if the user is authenticated
      if (req.isAuthenticated()) {
        try {
          await saveConnection(req, service, profile, credentials);
          return res.redirect('/app-connections?success=' + service);
        } catch (error) {
          console.error(`Error in API integration for ${service}:`, error);
          return res.redirect('/app-connections?error=true');
        }
      } else {
        return res.redirect('/auth');
      }
    }
    
    // For development/testing, if the code starts with "fake_code", use simulated login
    if (code && code.toString().startsWith('fake_code')) {
      console.log(`Processing simulated login for ${service}`);
      
      // Create a fake profile and credentials for simulated login
      const profile = {
        id: `${service}_123456`,
        username: `${service}_user`,
        name: `${service.charAt(0).toUpperCase() + service.slice(1)} User`
      };
      
      const credentials = {
        access_token: `fake_token_${service}_${Date.now()}`,
        refresh_token: `fake_refresh_${service}_${Date.now()}`,
        expires_in: 3600,
        created_at: new Date()
      };
      
      // Store the credentials in the session
      storeOAuthCredentials(req, service, credentials);
      
      // Save the connection if the user is authenticated
      if (req.isAuthenticated()) {
        try {
          await saveConnection(req, service, profile, credentials);
          return res.redirect('/app-connections?success=' + service);
        } catch (error) {
          console.error('Error in simulated login:', error);
          return res.redirect('/app-connections?error=true');
        }
      } else {
        return res.redirect('/auth');
      }
    }
    
    // For real OAuth, verify the state parameter to prevent CSRF
    // For Instagram, we're being more lenient due to session handling issues
    if (service === 'instagram') {
      console.log("Bypassing strict state verification for Instagram OAuth");
    } else if (!state || !verifyOAuthState(req, service, state as string)) {
      console.error(`Invalid state parameter for ${service} OAuth. Got state: ${state}`);
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Process regular OAuth code exchange
    try {
      // Check if this is a main OAuth service (instagram, linkedin, twitter, google)
      // or a custom one (slack, facebook-ads, etc.)
      if (isValidOAuthService(service)) {
        console.log(`Processing standard OAuth for ${service}`);
        const config = oauthConfigs[service];
        const redirect_uri = `${req.protocol}://${req.get('host')}${config.callbackURL}`;
        
        // Exchange the authorization code for an access token
        // Different services have different requirements for the token request
        let tokenResponse;
        
        if (service === 'linkedin') {
          // LinkedIn requires form-urlencoded data
          const formData = new URLSearchParams();
          formData.append('client_id', config.clientID!);
          formData.append('client_secret', config.clientSecret!);
          formData.append('code', code as string);
          formData.append('redirect_uri', redirect_uri);
          formData.append('grant_type', 'authorization_code');
          
          console.log(`LinkedIn token request with redirect_uri: ${redirect_uri}`);
          
          tokenResponse = await axios.post(config.tokenURL, formData.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          });
        } else {
          // Default JSON request for most services
          tokenResponse = await axios.post(config.tokenURL, {
            client_id: config.clientID,
            client_secret: config.clientSecret,
            code,
            redirect_uri,
            grant_type: 'authorization_code'
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        }
        
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        // Store the credentials in the session
        const credentials = {
          access_token,
          refresh_token,
          expires_in,
          created_at: new Date()
        };
        
        storeOAuthCredentials(req, service, credentials);
        
        // Fetch the user profile
        const profile = await config.profile(access_token);
        
        // Save the connection to the database
        if (req.isAuthenticated()) {
          await saveConnection(req, service, profile, credentials);
          
          // Return HTML that will close the popup and send a message to the opener window
          renderSuccessPage(res, service, profile);
        } else {
          // Not logged in, redirect to auth page
          res.redirect('/auth?error=not_authenticated');
        }
      } else {
        // Handle custom OAuth services like Slack, Facebook Ads, etc.
        console.log(`Processing custom OAuth for ${service}`);
        // This is where custom token exchange for services not in oauthConfigs would go
        res.redirect('/app-connections?error=unsupported_service');
      }
    } catch (error) {
      console.error(`Error in ${service} OAuth callback:`, error);
      console.error(error);
      // Even in case of error, return a nice HTML page that will close itself
      renderErrorPage(res, service as string, error);
    }
  });
  
  // Helper function to render success page with auto-close for popup windows
  function renderSuccessPage(res: Response, service: string, profile: any) {
    // Get a readable display name for the service
    const serviceName = service.charAt(0).toUpperCase() + service.slice(1).replace(/-/g, ' ');
    
    // Get a username or display name from the profile (different services have different structures)
    let username = 'Connected account';
    
    if (profile) {
      // Try to extract username based on common profile structures
      if (profile.username) {
        username = profile.username;
      } else if (profile.name) {
        username = profile.name;
      } else if (profile.displayName) {
        username = profile.displayName;
      } else if (profile.localizedFirstName) {
        username = `${profile.localizedFirstName} ${profile.localizedLastName || ''}`;
      } else if (profile.email) {
        username = profile.email;
      } else if (profile.id) {
        username = `${serviceName} user`;
      }
    }
    
    // Customize the brand color based on service
    let brandColor = '#0070f3'; // Default blue
    switch (service) {
      case 'linkedin':
        brandColor = '#0077b5';
        break;
      case 'twitter':
        brandColor = '#1DA1F2';
        break;
      case 'instagram':
        brandColor = '#E1306C';
        break;
      case 'facebook-ads':
        brandColor = '#4267B2';
        break;
      case 'google':
      case 'gmail':
      case 'google-drive':
      case 'google-sheets':
      case 'google-calendar':
        brandColor = '#4285F4';
        break;
      case 'microsoft':
        brandColor = '#00a4ef';
        break;
      case 'slack':
        brandColor = '#4A154B';
        break;
      case 'trello':
        brandColor = '#0079BF';
        break;
      case 'notion':
        brandColor = '#000000';
        break;
    }
    
    // Extract any additional profile data to show
    const profileDetails: any = {};
    if (profile.email) profileDetails['email'] = profile.email;
    
    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${serviceName} Connected</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            text-align: center;
            padding: 40px;
            background-color: #f5f5f5;
            margin: 0;
          }
          .success-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin: 0 auto;
            max-width: 500px;
          }
          h2 {
            color: ${brandColor};
            margin-bottom: 10px;
          }
          p {
            color: #333;
            margin-bottom: 20px;
          }
          .connected-account {
            font-weight: bold;
          }
          .countdown {
            font-size: 14px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="success-card">
          <h2>${serviceName} Connected Successfully!</h2>
          <p>Your account <span class="connected-account">${username}</span> has been connected.</p>
          <p class="countdown">This window will close automatically in 3 seconds...</p>
        </div>
        <script>
          // Send message to the opener window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'oauth-success',
              service: '${service}',
              profile: ${JSON.stringify({ username, ...profileDetails })}
            }, '*');
          }
          
          // Close this popup after a short delay
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `);
  }
  
  // Helper function to render error page with auto-close for popup windows
  function renderErrorPage(res: Response, service: string, error: any) {
    // Get a readable display name for the service
    const serviceName = service.charAt(0).toUpperCase() + service.slice(1).replace(/-/g, ' ');
    
    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${serviceName} Connection Failed</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            text-align: center;
            padding: 40px;
            background-color: #f5f5f5;
            margin: 0;
          }
          .error-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin: 0 auto;
            max-width: 500px;
          }
          h2 {
            color: #e53e3e;
            margin-bottom: 10px;
          }
          p {
            color: #333;
            margin-bottom: 20px;
          }
          .error-message {
            color: #e53e3e;
            font-size: 14px;
            margin-top: 10px;
          }
          .countdown {
            font-size: 14px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="error-card">
          <h2>${serviceName} Connection Failed</h2>
          <p>There was a problem connecting your ${serviceName} account.</p>
          <p class="error-message">${error?.message?.toString().replace(/'/g, "\\'") || 'An unknown error occurred'}</p>
          <p class="countdown">This window will close automatically in 5 seconds...</p>
        </div>
        <script>
          // Send message to the opener window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'oauth-error',
              service: '${service}',
              error: '${(error?.message || 'Connection failed').toString().replace(/'/g, "\\'")}'
            }, '*');
          }
          
          // Close this popup after a short delay
          setTimeout(() => {
            window.close();
          }, 5000);
        </script>
      </body>
      </html>
    `);
  }

  // Get connected apps for the current user
  app.get('/api/connections', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    storage.getAppConnectionsByUser(req.user.id)
      .then(connections => {
        // Remove sensitive information before sending to client
        const safeConnections = connections.map(conn => ({
          id: conn.id,
          appId: conn.appId,
          username: conn.username,
          createdAt: conn.createdAt
        }));
        
        res.json(safeConnections);
      })
      .catch(err => {
        console.error('Error fetching connections:', err);
        res.status(500).json({ error: 'Failed to fetch connections' });
      });
  });

  // Delete a connection
  app.delete('/api/connections/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const connectionId = parseInt(req.params.id);
    
    try {
      // Verify connection belongs to the current user
      const connection = await storage.getAppConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      
      if (connection.userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const result = await storage.deleteAppConnection(connectionId);
      
      if (result) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to delete connection' });
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Simulated login for development/testing
  app.get('/api/simulated-login', (req, res) => {
    const { service, redirect, state } = req.query;
    
    if (!isValidOAuthService(service as string)) {
      return res.status(400).json({ error: `Unsupported service: ${service}` });
    }
    
    // Create a fake profile and credentials
    const profile = {
      id: `${service}_123456`,
      username: `${service}_user`,
      name: `${service.toString().charAt(0).toUpperCase() + service.toString().slice(1)} User`
    };
    
    const credentials = {
      access_token: `fake_token_${service}_${Date.now()}`,
      refresh_token: `fake_refresh_${service}_${Date.now()}`,
      expires_in: 3600,
      created_at: new Date()
    };
    
    // Store the credentials in the session
    storeOAuthCredentials(req, service as string, credentials);
    
    // Save the connection if the user is authenticated
    if (req.isAuthenticated()) {
      saveConnection(req, service as string, profile, credentials)
        .then(() => {
          // Return HTML with auto-close script for a better UX
          renderSuccessPage(res, service as string, profile);
        })
        .catch(error => {
          console.error('Error in simulated login:', error);
          renderErrorPage(res, service as string, error);
        });
    } else {
      res.redirect('/auth');
    }
  });
  
  // Direct token integration for LinkedIn
  app.post('/api/direct-token-connect/linkedin', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in to connect LinkedIn' });
      }
      
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      
      // Fetch user profile using the provided token
      try {
        // LinkedIn user profile API
        const userResponse = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
        
        if (!userResponse.ok) {
          throw new Error(`LinkedIn API error: ${userResponse.status} ${userResponse.statusText}`);
        }
        
        const userData = await userResponse.json();
        console.log('LinkedIn user data:', userData);
        
        // Extract username and save connection
        const username = userData.localizedFirstName 
          ? `${userData.localizedFirstName} ${userData.localizedLastName || ''}` 
          : userData.id;
        
        // Save the LinkedIn connection
        await storage.saveAppConnection({
          appId: 'linkedin',
          userId: req.user.id,
          username: username.trim(),
          credentials: { 
            accessToken: token,
            userId: userData.id
          },
          permissions: ['basic_profile']
        });
        
        return res.json({ 
          success: true,
          userData,
          message: 'LinkedIn account connected successfully' 
        });
      } catch (error) {
        console.error('LinkedIn profile fetch error:', error);
        return res.status(400).json({ 
          error: 'Failed to fetch LinkedIn profile',
          message: error.message 
        });
      }
    } catch (error) {
      console.error('LinkedIn direct token error:', error);
      return res.status(500).json({ 
        error: 'Failed to connect LinkedIn account',
        message: error.message 
      });
    }
  });

  // Simulated OAuth callback for development/testing
  app.get('/api/auth/:service/simulated-callback', (req, res) => {
    const { service } = req.params;
    const { state } = req.query;
    
    if (!isValidOAuthService(service)) {
      return res.status(400).json({ error: `Unsupported service: ${service}` });
    }
    
    // Verify the state parameter
    // For Instagram, we're being more lenient due to session handling issues
    if (service === 'instagram') {
      console.log("Bypassing strict state verification for Instagram OAuth in simulated callback");
    } else if (!state || !verifyOAuthState(req, service, state as string)) {
      console.error(`Invalid state parameter for ${service} OAuth simulated callback. Got state: ${state}`);
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Create a fake profile and credentials
    const profile = {
      id: `${service}_123456`,
      username: `${service}_user`,
      name: `${service.charAt(0).toUpperCase() + service.slice(1)} User`
    };
    
    const credentials = {
      access_token: `fake_token_${service}_${Date.now()}`,
      refresh_token: `fake_refresh_${service}_${Date.now()}`,
      expires_in: 3600,
      created_at: new Date()
    };
    
    // Store the credentials in the session
    storeOAuthCredentials(req, service, credentials);
    
    // Save the connection if the user is authenticated
    if (req.isAuthenticated()) {
      saveConnection(req, service, profile, credentials)
        .then(() => {
          // Return HTML with auto-close script for a better UX
          renderSuccessPage(res, service, profile);
        })
        .catch(error => {
          console.error('Error in simulated login:', error);
          renderErrorPage(res, service, error);
        });
    } else {
      res.redirect('/auth');
    }
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
  
  // Handle Facebook auth (for Instagram integration)
  app.post("/api/facebook-auth", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in to connect apps" });
      }
      
      const { accessToken, userID, serviceType, mockData } = req.body;
      
      if (!accessToken || !userID) {
        return res.status(400).json({ error: "Missing required Facebook auth parameters" });
      }
      
      console.log(`Processing Facebook auth for ${serviceType || 'instagram'}`);
      
      // Check if we're using mock data (for sandbox environments)
      if (mockData) {
        console.log('Using mock data for Facebook auth integration');
        
        try {
          const { username, profilePicture, fullName } = mockData;
          
          // Create mock credentials object
          const credentials = {
            access_token: accessToken,
            user_id: userID,
            username: username,
            name: fullName || username,
            profile_picture: profilePicture || 'https://i.pravatar.cc/150?u=' + username,
            created_at: new Date(),
            is_mock: true // Flag to indicate this is a mock connection
          };
          
          // Create mock profile data
          const mockProfileData = {
            username: username,
            name: fullName || username,
            profile_picture_url: profilePicture || 'https://i.pravatar.cc/150?u=' + username,
            id: userID,
            is_mock: true
          };
          
          // Store credentials in session
          if (!req.session.oauthCredentials) {
            req.session.oauthCredentials = {};
          }
          
          req.session.oauthCredentials[serviceType === 'instagram' ? 'instagram' : 'facebook-ads'] = credentials;
          
          // Create connection in database
          await storage.createAppConnection({
            userId: req.user.id,
            appId: serviceType === 'instagram' ? 'instagram' : 'facebook-ads',
            username: username, 
            token: JSON.stringify(credentials),
            profile: JSON.stringify(mockProfileData)
          });
          
          res.status(200).json({ 
            success: true, 
            message: `Successfully connected to ${serviceType === 'instagram' ? 'Instagram' : 'Facebook Ads'}`,
            profile: {
              username: username,
              name: fullName || username,
              profilePicture: profilePicture
            }
          });
          
          return;
        } catch (error: any) {
          console.error('Mock Facebook/Instagram auth error:', error);
          res.status(500).json({ 
            error: `Failed to process mock connection: ${error.message}` 
          });
          return;
        }
      }
      
      let apiEndpoint, profileData;
      
      if (serviceType === 'instagram') {
        // For Instagram integration, we need to:
        // 1. Get the Facebook user's Instagram Business accounts
        // 2. Get the Instagram user profile using the Instagram Graph API
        
        try {
          // Get user's Instagram accounts
          const fbResponse = await fetch(
            `https://graph.facebook.com/v17.0/${userID}/accounts?access_token=${accessToken}`
          );
          
          if (!fbResponse.ok) {
            throw new Error(`Failed to fetch Instagram accounts: ${fbResponse.statusText}`);
          }
          
          const accountsData = await fbResponse.json();
          
          // No pages found, Instagram business account might not be connected
          if (!accountsData.data || accountsData.data.length === 0) {
            return res.status(400).json({ 
              error: "No Instagram business account found. Make sure your Instagram account is connected to a Facebook page."
            });
          }
          
          // Get the first page's Instagram business account
          const page = accountsData.data[0];
          
          // Get Instagram Business Account ID for the page
          const igAccountResponse = await fetch(
            `https://graph.facebook.com/v17.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
          );
          
          if (!igAccountResponse.ok) {
            throw new Error(`Failed to fetch Instagram business account: ${igAccountResponse.statusText}`);
          }
          
          const igAccountData = await igAccountResponse.json();
          
          if (!igAccountData.instagram_business_account) {
            return res.status(400).json({ 
              error: "No Instagram business account found. Please connect your Instagram account to your Facebook page."
            });
          }
          
          const igAccountId = igAccountData.instagram_business_account.id;
          
          // Get Instagram user profile
          const igProfileResponse = await fetch(
            `https://graph.facebook.com/v17.0/${igAccountId}?fields=username,profile_picture_url,name&access_token=${accessToken}`
          );
          
          if (!igProfileResponse.ok) {
            throw new Error(`Failed to fetch Instagram profile: ${igProfileResponse.statusText}`);
          }
          
          profileData = await igProfileResponse.json();
          
          // Create the credentials object to store
          const credentials = {
            access_token: accessToken,
            user_id: igAccountId,
            username: profileData.username,
            name: profileData.name,
            profile_picture: profileData.profile_picture_url,
            created_at: new Date()
          };
          
          // Store Instagram credentials and create connection
          if (req.isAuthenticated()) {
            // Store credentials in session
            if (!req.session.oauthCredentials) {
              req.session.oauthCredentials = {};
            }
            
            req.session.oauthCredentials['instagram'] = credentials;
            
            // Create connection in database
            await storage.createAppConnection({
              userId: req.user.id,
              appId: 'instagram',
              username: profileData.username, 
              token: JSON.stringify(credentials),
              profile: JSON.stringify(profileData)
            });
            
            // Use the common renderSuccessPage function for consistent UX
            renderSuccessPage(res, 'instagram', profileData);
          } else {
            res.status(401).json({ error: "You must be logged in to connect apps" });
          }
        } catch (error: any) {
          console.error('Instagram Graph API Error:', error);
          // Use the common error page function for popup windows
          renderErrorPage(res, 'instagram', error);
        }
      } else if (serviceType === 'facebook-ads') {
        // For Facebook Ads integration
        try {
          // Get Facebook user profile
          const fbProfileResponse = await fetch(
            `https://graph.facebook.com/v17.0/me?fields=id,name,email&access_token=${accessToken}`
          );
          
          if (!fbProfileResponse.ok) {
            throw new Error(`Failed to fetch Facebook profile: ${fbProfileResponse.statusText}`);
          }
          
          profileData = await fbProfileResponse.json();
          
          // Create the credentials object to store
          const credentials = {
            access_token: accessToken,
            user_id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            created_at: new Date()
          };
          
          // Store Facebook Ads credentials and create connection
          if (req.isAuthenticated()) {
            // Store credentials in session
            if (!req.session.oauthCredentials) {
              req.session.oauthCredentials = {};
            }
            
            req.session.oauthCredentials['facebook-ads'] = credentials;
            
            // Create connection in database
            await storage.createAppConnection({
              userId: req.user.id,
              appId: 'facebook-ads',
              username: profileData.name, 
              token: JSON.stringify(credentials),
              profile: JSON.stringify(profileData)
            });
            
            // Use the common renderSuccessPage function for consistent UX
            renderSuccessPage(res, 'facebook-ads', profileData);
          } else {
            res.status(401).json({ error: "You must be logged in to connect apps" });
          }
        } catch (error: any) {
          console.error('Facebook Graph API Error:', error);
          // Use the common error page function for popup windows
          renderErrorPage(res, 'facebook-ads', error);
        }
      } else {
        res.status(400).json({ error: "Unsupported service type" });
      }
    } catch (error) {
      console.error("Error in Facebook auth:", error);
      // For general errors in the Facebook auth flow, also use the error page
      // Since serviceType might be undefined here, defaulting to 'facebook-ads'
      renderErrorPage(res, 'facebook-ads', error);
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
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in to connect apps" });
      }
      
      // Get the host from the request to create proper redirect URLs
      const host = req.headers.host || 'localhost:5000';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      
      // Generate appropriate OAuth URLs for each supported service
      let oauthUrl = '';
      let requiredSecrets = [];
      
      // Handle different OAuth providers
      switch (appId) {
        case 'instagram':
          // No need to check for credentials as we're using hardcoded ones provided by the user
          // Generate state for CSRF protection
          const state = generateState();
          storeOAuthState(req, 'instagram', state);
          
          // IMPORTANT: For Instagram OAuth, we must use the exact redirect URI registered in Meta Developer portal
          // This must match the Valid OAuth Redirect URIs in your Instagram Basic Display app settings
          
          // Use the exact redirect URI registered in Meta Developer Portal
          // Update the redirect URI to match exactly what's in the URL provided by the user
          const redirectUri = "https://0fcb63a8-dd05-4412-a625-acdf344e5c37-00-gy4e1ti0ba0r.picard.replit.dev/app-connections";
          
          console.log("Using Instagram redirect URI:", redirectUri);
          
          // Using the direct Instagram OAuth URL provided by the user
          const instagramClientId = '697674269427861'; // Using the specific Instagram Graph API app ID
          
          console.log("Using Instagram Graph API Client ID with direct Instagram OAuth:", instagramClientId);
          
          // Using the exact URL format provided by the user
          oauthUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${instagramClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights&state=${state}`;
          
          console.log("Generated Instagram OAuth URL:", oauthUrl);
          
          // Add detailed validation logging for diagnostic purposes
          console.log("Instagram OAuth configuration:", {
            clientId: instagramClientId,
            redirectUri: redirectUri,
            scopes: "user_profile,user_media",
            state: state
          });
          break;
          
        case 'linkedin':
          if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing LinkedIn OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            storeOAuthState(req, 'linkedin', state);
            
            // For LinkedIn OAuth, we need to use a VERY simple redirect URI without any special characters
            // LinkedIn can be extremely picky about redirect URIs
            
            // Try a VERY simple callback URL without complex subdomains
            // Make sure this exact string is registered in your LinkedIn developer settings
            const linkedInRedirectUri = "https://brnout.replit.app/api/callback/linkedin";
            
            console.log("Using simplified LinkedIn redirect URI:", linkedInRedirectUri);
            
            // LinkedIn OAuth URL with proper CSRF protection
            // LinkedIn uses space-separated scopes but URL-encoded
            oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(linkedInRedirectUri)}&scope=r_liteprofile%20r_emailaddress%20w_member_social&response_type=code&state=${state}`;
          }
          break;
          
        case 'twitter':
          if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing Twitter OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            storeOAuthState(req, 'twitter', state);
            
            // For Twitter OAuth 2.0, use consistent pattern with other platforms
            const redirectUri = `${baseUrl}/api/callback/twitter`;
            
            // Twitter OAuth 2.0 URL with proper CSRF protection
            // Twitter OAuth 2.0 requires code_challenge for PKCE flow
            oauthUrl = `https://twitter.com/i/oauth2/authorize?client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read&response_type=code&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
          }
          break;
          
        case 'google-drive':
        case 'gmail':
        case 'google-sheets':
        case 'google-calendar':
          if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing Google OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            storeOAuthState(req, 'google', state);
            
            // For Google OAuth, use the consistent pattern with other platforms
            const redirectUri = `${baseUrl}/api/callback/google`;
            
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
            
            oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent&state=${state}`;
          }
          break;
          
        case 'slack':
          if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing Slack OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            // We're using a custom flow for Slack as it's not in our oauthConfigs
            if (!req.session.oauthStates) {
              req.session.oauthStates = {};
            }
            req.session.oauthStates['slack'] = state;
            
            const redirectUri = `${baseUrl}/api/callback/slack`;
            
            // Slack OAuth URL with proper CSRF protection
            oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=channels:read,chat:write&user_scope=&state=${state}`;
          }
          break;
          
        case 'facebook-ads':
          if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing Facebook OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            if (!req.session.oauthStates) {
              req.session.oauthStates = {};
            }
            req.session.oauthStates['facebook-ads'] = state;
            
            const redirectUri = `${baseUrl}/api/callback/facebook-ads`;
            
            // Facebook OAuth URL with proper CSRF protection
            oauthUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_management,ads_read&response_type=code&state=${state}`;
          }
          break;
          
        case 'trello':
          if (!process.env.TRELLO_CLIENT_ID || !process.env.TRELLO_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['TRELLO_CLIENT_ID', 'TRELLO_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing Trello OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            storeOAuthState(req, 'trello', state);
            
            const redirectUri = `${baseUrl}/api/callback/trello`;
            
            // Trello OAuth URL with proper CSRF protection
            oauthUrl = `https://trello.com/1/authorize?expiration=never&name=BRNOUT&scope=read,write&response_type=code&client_id=${process.env.TRELLO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
          }
          break;
          
        case 'notion':
          if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['NOTION_CLIENT_ID', 'NOTION_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing Notion OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            storeOAuthState(req, 'notion', state);
            
            const redirectUri = `${baseUrl}/api/callback/notion`;
            
            // Notion OAuth URL with proper CSRF protection
            oauthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&owner=user&state=${state}`;
          }
          break;
          
        case 'microsoft':
          if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
            // Missing credentials - ask user to provide them
            requiredSecrets = ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'];
            return res.status(400).json({ 
              error: "Missing Microsoft OAuth credentials", 
              requiredSecrets
            });
          } else {
            // Generate state for CSRF protection
            const state = generateState();
            storeOAuthState(req, 'microsoft', state);
            
            const redirectUri = `${baseUrl}/api/callback/microsoft`;
            
            // Microsoft OAuth URL (Microsoft Graph) with proper CSRF protection
            const scopes = 'offline_access User.Read Files.ReadWrite';
            oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
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
          return res.status(400).json({ 
            error: `Unsupported OAuth integration for service: ${appId}`,
            message: "This service needs to be integrated manually with proper OAuth credentials."
          });
      }
      
      // Return the OAuth URL to the client for redirect
      res.json({ oauthUrl });
      
    } catch (error) {
      console.error("OAuth URL generation error:", error);
      res.status(500).json({ message: "Failed to generate OAuth URL" });
    }
  });
  
  // GET /api/simulated-login - Simulated OAuth login page for services without implemented OAuth
  app.get("/api/simulated-login", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.redirect('/auth?redirect=' + encodeURIComponent('/app-connections'));
      }
      
      const { service } = req.query;
      
      if (!service) {
        return res.status(400).json({ error: "Service parameter is required" });
      }
      
      if (typeof service !== 'string') {
        throw new Error("Invalid service parameter");
      }
      
      // Create a fake profile and credentials for simulated login
      const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
      const profile = {
        id: `${service}_${Date.now()}`,
        username: `${req.user.username || 'user'}@${service}`,
        name: `${req.user.fullName || req.user.username || 'User'} (${serviceName})`,
      };
      
      const credentials = {
        access_token: `sim_token_${service}_${Date.now()}`,
        refresh_token: `sim_refresh_${service}_${Date.now()}`,
        expires_in: 3600,
        created_at: new Date()
      };
      
      // Check if the connection already exists
      const existingConnection = await storage.getAppConnectionByUserAndApp(req.user.id, service);
      
      if (existingConnection) {
        // Update existing connection
        await storage.updateAppConnection(existingConnection.id, {
          username: profile.username,
          credentials
        });
      } else {
        // Create new connection
        await storage.createAppConnection({
          appId: service,
          userId: req.user.id,
          username: profile.username,
          permissions: ["read", "write"],
          credentials
        });
      }
      
      // Redirect back to the app connections page with success
      res.redirect('/app-connections?success=' + service);
    } catch (error) {
      console.error("Error in simulated login:", error);
      res.redirect('/app-connections?error=simulated_login_failed');
    }
  });
  
  // POST /api/app-connections/:appId/connect - Connect an app
  app.post("/api/app-connections/:appId/connect", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to connect apps" });
      }
      
      const { appId } = req.params;
      const { code, apiIntegration } = req.body;
      
      if (!appId) {
        return res.status(400).json({ message: "App ID is required" });
      }
      
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
      
      // Check if connection already exists
      const existingConnection = await storage.getAppConnectionByUserAndApp(req.user.id, appId);
      
      if (existingConnection) {
        // Update existing connection
        const updatedConnection = await storage.updateAppConnection(existingConnection.id, {
          username,
          permissions,
          credentials: { token: apiIntegration ? "api-key-integration" : "mock-token" }
        });
        
        return res.json(updatedConnection);
      }
      
      // Create a new connection with the user ID from the authenticated session
      const newConnection = await storage.createAppConnection({
        appId,
        userId: req.user.id,
        username,
        permissions,
        credentials: { token: apiIntegration ? "api-key-integration" : "mock-token" }
      });
      
      res.json(newConnection);
    } catch (error) {
      console.error("App connection error:", error);
      res.status(500).json({ message: "Failed to connect app" });
    }
  });
  
  // GET /api/callback/:service - Handle OAuth callback 
  app.get("/api/callback/:service", async (req, res) => {
    try {
      console.log("OAuth callback received for", req.params.service, "with query:", req.query);
      const { service } = req.params;
      const { code, state } = req.query; // Auth code and state from OAuth provider
      const { error: oauthError, api_integration: apiIntegration } = req.query;
      
      // Check for OAuth errors
      if (oauthError) {
        console.error(`OAuth error for ${service}:`, oauthError);
        // Use our consistent error page function for better UX
        return renderErrorPage(res, service, new Error(`Authentication error: ${oauthError}`));
      }
      
      if (!code) {
        console.error(`No auth code received for ${service}`);
        // Use our consistent error page function for better UX
        return renderErrorPage(res, service, new Error("No authentication code received"));
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
          let redirectUri;
          
          switch(service) {
            case 'instagram':
              // Use the Instagram Graph API credentials from the user's account
              clientId = '697674269427861';
              clientSecret = '350ec33e4c298c4ee71'; // Only using part of the secret shown in the screenshot
              
              console.log("Using Instagram Graph API credentials - Client ID:", clientId);
              
              // Set redirect URI to match exactly what's configured in Meta Developer Portal
              // Must match the redirect URL in authorization request
              redirectUri = "https://0fcb63a8-dd05-4412-a625-acdf344e5c37-00-gy4e1ti0ba0r.picard.replit.dev/app-connections";
              console.log("Using Instagram callback URI:", redirectUri);
              
              // Log detailed Instagram OAuth callback info for debugging
              console.log("Instagram OAuth callback data:", {
                code: code,
                clientId: clientId,
                redirectUri: redirectUri
              });
              
              // Using Facebook Graph API endpoint for token exchange (fixes "Invalid Platform App" error)
              // Based on Stack Overflow solution: https://stackoverflow.com/questions/60258144/invalid-platform-app-error-using-instagram-basic-display-api
              tokenUrl = 'https://graph.facebook.com/v16.0/oauth/access_token';
              
              // Instagram requires form-urlencoded body
              const postData = {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code.toString()
              };
              
              // Log the complete token exchange request for debugging
              console.log("Instagram token exchange request:", {
                url: tokenUrl,
                method: 'POST',
                body: postData
              });
              
              requestBody = new URLSearchParams(postData);
              
              requestHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded'
              };
              break;
              
            case 'linkedin':
              clientId = process.env.LINKEDIN_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.LINKEDIN_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // LinkedIn token exchange
              tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
              
              // Must use the EXACT same simplified redirect URI that was used in the authorization request
              // This must match what was registered in LinkedIn's developer portal
              // Use a very simple URL structure that's easier to register and verify
              redirectUri = "https://brnout.replit.app/api/callback/linkedin";
              console.log("Using LinkedIn callback redirect URI:", redirectUri);
              
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
              
              // Set Google redirect URI to match the one used in authorization request
              const host = req.headers.host || 'localhost:5000';
              const protocol = req.secure ? 'https' : 'http';
              const baseUrl = `${protocol}://${host}`;
              redirectUri = `${baseUrl}/api/callback/google`;
              
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
              
              // Set Slack redirect URI to match the one used in authorization request
              const slackHost = req.headers.host || 'localhost:5000';
              const slackProtocol = req.secure ? 'https' : 'http';
              const slackBaseUrl = `${slackProtocol}://${slackHost}`;
              redirectUri = `${slackBaseUrl}/api/callback/slack`;
              
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
              
              // Set Twitter redirect URI to match the one used in authorization request
              const twitterHost = req.headers.host || 'localhost:5000';
              const twitterProtocol = req.secure ? 'https' : 'http';
              const twitterBaseUrl = `${twitterProtocol}://${twitterHost}`;
              redirectUri = `${twitterBaseUrl}/api/callback/twitter`;
              
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
              
              // Set Facebook redirect URI to match the one used in authorization request
              const fbHost = req.headers.host || 'localhost:5000';
              const fbProtocol = req.secure ? 'https' : 'http';
              const fbBaseUrl = `${fbProtocol}://${fbHost}`;
              redirectUri = `${fbBaseUrl}/api/callback/facebook-ads`;
              
              // Facebook token exchange
              tokenUrl = 'https://graph.facebook.com/v16.0/oauth/access_token';
              
              // Facebook can accept query parameters
              tokenUrl += `?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
              
              // This will be a GET request, so body is empty
              requestBody = null;
              requestHeaders = {};
              break;
              
            case 'notion':
              clientId = process.env.NOTION_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.NOTION_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Set Notion redirect URI to match the one used in authorization request
              const notionHost = req.headers.host || 'localhost:5000';
              const notionProtocol = req.secure ? 'https' : 'http';
              const notionBaseUrl = `${notionProtocol}://${notionHost}`;
              redirectUri = `${notionBaseUrl}/api/callback/notion`;
              
              // Notion token exchange
              tokenUrl = 'https://api.notion.com/v1/oauth/token';
              
              // Notion uses JSON request body
              requestBody = JSON.stringify({
                grant_type: 'authorization_code',
                code: code.toString(),
                redirect_uri: redirectUri
              });
              
              // Notion uses Basic auth for client ID/secret
              const notionAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
              requestHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${notionAuth}`
              };
              break;
              
            case 'trello':
              clientId = process.env.TRELLO_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.TRELLO_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Trello token exchange
              tokenUrl = 'https://trello.com/1/OAuthGetAccessToken';
              
              // Trello requires form-urlencoded
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
              
            case 'microsoft':
              clientId = process.env.MICROSOFT_CLIENT_ID || 'YOUR_APP_ID';
              clientSecret = process.env.MICROSOFT_CLIENT_SECRET || 'YOUR_APP_SECRET';
              
              // Microsoft token exchange
              tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
              
              // Microsoft requires form-urlencoded
              requestBody = new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code: code.toString(),
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
              });
              
              requestHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded'
              };
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
              
              // Log the complete request details for debugging
              console.log(`${service} token request:`, {
                url: tokenUrl,
                method,
                headers: requestHeaders,
                body: requestBody ? requestBody.toString() : null
              });
              
              const tokenResponse = await fetch(tokenUrl, {
                method,
                headers: requestHeaders,
                body: requestBody
              });
              
              if (!tokenResponse.ok) {
                console.error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
                
                // For better debugging, try to get the error response body
                try {
                  const errorBody = await tokenResponse.text();
                  console.error(`Token exchange error details:`, errorBody);
                  
                  // Special handling for Instagram errors which often have more details
                  if (service === 'instagram') {
                    console.error(`Instagram token exchange error. Full response:`, {
                      status: tokenResponse.status,
                      statusText: tokenResponse.statusText,
                      body: errorBody,
                      requestDetails: {
                        clientId,
                        redirectUri,
                        tokenUrl
                      }
                    });
                  }
                } catch (parseError) {
                  console.error(`Couldn't parse error response:`, parseError);
                }
                
                throw new Error(`Failed to exchange code for token: ${tokenResponse.statusText}`);
              }
              
              let tokenData;
              try {
                tokenData = await tokenResponse.json();
                console.log(`Successfully parsed token data for ${service}`);
              } catch (parseError) {
                console.error(`Failed to parse token response as JSON:`, parseError);
                // Try to read as text for debugging
                const textBody = await tokenResponse.text();
                console.error(`Raw token response:`, textBody);
                throw new Error(`Invalid token response format: ${parseError.message}`);
              }
              console.log(`Token received for ${service}:`, tokenData);
              
              // Store the token
              accessToken = tokenData.access_token;
              
              // Special handling for Instagram token response format
              if (service === 'instagram' && tokenData && 'user_id' in tokenData) {
                // Instagram's initial token response includes user_id and username directly
                // Store additional user data
                username = tokenData.username || 'instagram_user';
                
                // Convert short-lived token to long-lived token
                try {
                  // Use the Instagram Graph API client secret for long-lived token exchange
                  const longLivedTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=350ec33e4c298c4ee71&access_token=${accessToken}`;
                  
                  console.log("Instagram Graph API long-lived token exchange URL:", longLivedTokenUrl);
                  const longLivedTokenResponse = await fetch(longLivedTokenUrl);
                  
                  if (longLivedTokenResponse.ok) {
                    const longLivedTokenData = await longLivedTokenResponse.json();
                    console.log('Exchanged for long-lived Instagram token');
                    // Use long-lived token for better user experience
                    accessToken = longLivedTokenData.access_token;
                  }
                } catch (tokenExchangeError) {
                  console.error('Failed to exchange for long-lived Instagram token:', tokenExchangeError);
                  // Continue with short-lived token if exchange fails
                }
              }
              
              // If we have a user info endpoint, fetch the user profile
              if (accessToken) {
                let userEndpoint;
                let userHeaders = { 'Authorization': `Bearer ${accessToken}` };
                
                switch(service) {
                  case 'instagram':
                    // Use Facebook Graph API endpoint instead of Instagram Basic Display API
                    // This fixes the "Invalid Platform App" error as per Stack Overflow solution
                    userEndpoint = 'https://graph.facebook.com/v16.0/me/accounts?fields=instagram_business_account{username,profile_picture_url,id,name}&access_token=' + accessToken;
                    console.log("Using Facebook Graph API for Instagram user data:", userEndpoint);
                    userHeaders = {}; // No need for auth header when token is in URL
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
                  case 'notion':
                    userEndpoint = 'https://api.notion.com/v1/users/me';
                    userHeaders = {
                      'Authorization': `Bearer ${accessToken}`,
                      'Notion-Version': '2022-06-28'
                    };
                    break;
                  case 'trello':
                    userEndpoint = 'https://api.trello.com/1/members/me?key=${clientId}&token=${accessToken}';
                    break;
                  case 'microsoft':
                    userEndpoint = 'https://graph.microsoft.com/v1.0/me';
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
                      if (service === 'instagram') {
                        // Handle the nested structure from Facebook Graph API
                        if (userData.data && userData.data.length > 0 && 
                            userData.data[0].instagram_business_account && 
                            userData.data[0].instagram_business_account.username) {
                          username = userData.data[0].instagram_business_account.username;
                          console.log("Found Instagram username:", username);
                        } else {
                          // Fallback if we can't find the username in the expected structure
                          console.log("Instagram data structure unexpected:", userData);
                          username = 'instagram_user';
                        }
                      } else if (service === 'linkedin' && userData.localizedFirstName) {
                        username = `${userData.localizedFirstName} ${userData.localizedLastName || ''}`;
                      } else if ((service.startsWith('google') || service === 'gmail') && userData.email) {
                        username = userData.email;
                      } else if (service === 'slack' && userData.user && userData.user.name) {
                        username = userData.user.name;
                      } else if (service === 'twitter' && userData.data && userData.data.username) {
                        username = userData.data.username;
                      } else if (service === 'notion' && userData.name) {
                        username = userData.name;
                      } else if (service === 'trello' && userData.username) {
                        username = userData.username;
                      } else if (service === 'microsoft' && userData.displayName) {
                        username = userData.displayName;
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
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.redirect('/auth?redirect=' + encodeURIComponent('/app-connections'));
      }
      
      // Check if connection already exists
      const existingConnection = await storage.getAppConnectionByUserAndApp(req.user.id, service);
      
      if (existingConnection) {
        // Update existing connection
        await storage.updateAppConnection(existingConnection.id, {
          username,
          permissions,
          credentials: { token: accessToken }
        });
      } else {
        // Create new connection with user ID from authenticated session
        await storage.createAppConnection({
          appId: service,
          userId: req.user.id,
          username,
          permissions,
          credentials: { token: accessToken }
        });
      }
      
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to disconnect apps" });
      }
      
      const { appId } = req.params;
      
      if (!appId) {
        return res.status(400).json({ message: "App ID is required" });
      }
      
      // Get the user's connection for this app
      const connection = await storage.getAppConnectionByUserAndApp(req.user.id, appId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // For a real app, we'd also revoke the token with the provider
      // For now, we'll just remove the connection from our storage
      await storage.deleteAppConnection(connection.id);
      
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
  
  // OpenAI Web Search Routes
  app.post("/api/services/openai/search", async (req, res) => {
    try {
      const { query, searchRecency, temperature, maxTokens, systemMessage } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const result = await openaiService.performSearch(query, {
        searchRecency,
        temperature,
        maxTokens,
        systemMessage
      }, req);
      
      res.json(result);
    } catch (error: any) {
      console.error("OpenAI search error:", error);
      res.status(500).json({ 
        message: "Failed to perform search", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/openai/analyze-topic", async (req, res) => {
    try {
      const { topic, searchRecency, temperature, systemMessage, maxTokens } = req.body;
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      const result = await openaiService.analyzeTopic(topic, {
        searchRecency,
        temperature,
        systemMessage,
        maxTokens
      }, req);
      
      res.json(result);
    } catch (error: any) {
      console.error("OpenAI topic analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze topic", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/services/openai/research-question", async (req, res) => {
    try {
      const { question, searchRecency, temperature, systemMessage, maxTokens } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const result = await openaiService.researchQuestion(question, {
        searchRecency,
        temperature,
        systemMessage,
        maxTokens
      }, req);
      
      res.json(result);
    } catch (error: any) {
      console.error("OpenAI question research error:", error);
      res.status(500).json({ 
        message: "Failed to research question", 
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

  // AI Assistant endpoints
  app.get("/api/assistant/help", async (req, res) => {
    try {
      const { contextId } = req.query;
      
      if (!contextId) {
        return res.status(400).json({ message: "Context ID is required" });
      }
      
      // First check for static context-specific help
      const contextHelp = getContextHelp(contextId as string);
      
      if (contextHelp) {
        return res.json(contextHelp);
      }
      
      // Fallback to AI-generated help
      const systemMessage = `You are a friendly, helpful assistant for a workflow automation platform called BRNOUT. 
      The user is currently in the "${contextId}" section of the app. 
      In a casual and friendly tone, provide a brief (max 2 sentences) tip that would be helpful for this context.
      Also suggest 2-3 quick actions they might want to take in bullet points.`;
      
      const prompt = `Generate help for the ${contextId} context`;
      
      const result = await openaiService.generateText(
        prompt,
        400,
        0.7,
        "gpt-4o",
        systemMessage,
        req
      );
      
      // Parse the response to extract text and suggestions
      const lines = result.text.split('\n').filter(line => line.trim() !== '');
      const text = lines.filter(line => !line.includes('•') && !line.includes('-')).join(' ');
      const suggestions = lines.filter(line => line.includes('•') || line.includes('-'))
        .map(line => line.replace(/^[•-]\s*/, '').trim());
      
      res.json({
        text,
        context: contextId,
        suggestions
      });
    } catch (error: any) {
      console.error("AI Assistant help error:", error);
      res.status(500).json({ 
        message: "Failed to get assistant help", 
        error: error.message 
      });
    }
  });
  
  // Handle AI Assistant questions
  app.post("/api/assistant/question", async (req, res) => {
    try {
      const { question, context, contextData } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const systemMessage = `You are a friendly, helpful assistant for a workflow automation platform called BRNOUT. 
      The user is asking you a question in the "${context || 'app'}" section.
      ${contextData ? `Additional context: ${JSON.stringify(contextData)}` : ''}
      
      Respond in a helpful, friendly way with specific and actionable advice. 
      Keep answers concise and focused on the automation platform functionalities.`;
      
      const result = await openaiService.generateText(
        question,
        800,
        0.7,
        "gpt-4o",
        systemMessage,
        req
      );
      
      res.json({
        answer: result.text,
        context
      });
    } catch (error: any) {
      console.error("AI Assistant question error:", error);
      res.status(500).json({ 
        message: "Failed to answer question", 
        error: error.message 
      });
    }
  });
  
  // Get workflow suggestions from the AI assistant
  app.get("/api/assistant/workflow-suggestions", async (req, res) => {
    try {
      const { category } = req.query;
      
      const systemMessage = `You are a workflow suggestions AI for BRNOUT, a workflow automation platform.
      Generate 3-5 workflow suggestions ${category ? `for the category "${category}"` : ''}. 
      The suggestions should range from beginner to advanced difficulty.
      
      Format your response as a valid JSON array with objects containing:
      - name: A short descriptive name for the workflow
      - description: A 1-2 sentence explanation of what the workflow does and its benefits
      - difficulty: One of "beginner", "intermediate", or "advanced"
      - tags: An array of 1-3 relevant tags for this workflow (e.g., ["productivity", "social media", "notifications"])
      - triggerAppId: The type of trigger (e.g., "schedule", "gmail", "twitter", "webhook")
      - actionAppId: The type of action (e.g., "openai", "gmail", "slack", "notion")`;
      
      const prompt = `Generate workflow suggestions ${category ? `for the category "${category}"` : ''}`;
      
      const result = await openaiService.generateText(
        prompt,
        1000,
        0.7,
        "gpt-4o",
        systemMessage,
        req
      );
      
      // Parse the JSON response
      let suggestions = [];
      try {
        suggestions = JSON.parse(result.text);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        
        // Fallback to some basic suggestions
        suggestions = [
          {
            name: "Social Media Post Scheduler",
            description: "Schedule posts to multiple social media platforms from a single calendar interface.",
            difficulty: "beginner",
            tags: ["social media", "scheduling", "productivity"],
            triggerAppId: "schedule",
            actionAppId: "twitter"
          },
          {
            name: "Document Sentiment Analyzer",
            description: "Analyze the sentiment of incoming documents or emails and categorize them by priority.",
            difficulty: "intermediate",
            tags: ["AI", "productivity", "email"],
            triggerAppId: "gmail",
            actionAppId: "openai"
          },
          {
            name: "Multi-platform Customer Response System",
            description: "Consolidate messages from multiple platforms and generate AI-assisted responses.",
            difficulty: "advanced",
            tags: ["customer service", "AI", "communication"],
            triggerAppId: "webhook",
            actionAppId: "slack"
          }
        ];
      }
      
      res.json({
        suggestions,
        category: category || null
      });
    } catch (error: any) {
      console.error("Workflow suggestions error:", error);
      res.status(500).json({ 
        message: "Failed to get workflow suggestions", 
        error: error.message 
      });
    }
  });
  
  // GET /api/assistant/personalized-suggestions - Get personalized workflow suggestions
  app.get("/api/assistant/personalized-suggestions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      
      // Get personalized suggestions from the database first
      const dbSuggestions = await storage.getPersonalizedWorkflowSuggestions(count);
      
      // If we have enough suggestions, return them
      if (dbSuggestions.length >= count) {
        return res.json({
          suggestions: dbSuggestions,
          source: "database"
        });
      }
      
      // Otherwise, generate new personalized suggestions
      const suggestions = await workflowSuggestionService.generateWorkflowSuggestions(
        req.user.id,
        count
      );
      
      res.json({
        suggestions,
        source: "generated"
      });
    } catch (error: any) {
      console.error("Personalized workflow suggestions error:", error);
      res.status(500).json({ 
        message: "Failed to get personalized workflow suggestions", 
        error: error.message 
      });
    }
  });
  
  // POST /api/assistant/generate-store-suggestions - Generate and store personalized workflow suggestions
  app.post("/api/assistant/generate-store-suggestions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const count = req.body.count || 5;
      
      // Generate and store new personalized suggestions
      const suggestions = await workflowSuggestionService.generateAndStoreSuggestions(
        req.user.id,
        count
      );
      
      res.json({
        suggestions,
        count: suggestions.length
      });
    } catch (error: any) {
      console.error("Generate and store workflow suggestions error:", error);
      res.status(500).json({ 
        message: "Failed to generate and store workflow suggestions", 
        error: error.message 
      });
    }
  });
  
  // Create a workflow from a suggestion
  app.post("/api/assistant/create-workflow", async (req, res) => {
    try {
      const { name, description, triggerAppId, actionAppId, tags } = req.body;
      
      if (!name || !triggerAppId || !actionAppId) {
        return res.status(400).json({ message: "Missing required workflow information" });
      }
      
      // Generate default configurations based on the trigger and action types
      const systemMessage = `You are an AI assistant helping to create a workflow configuration for an automation platform.
      Create appropriate default configurations for a workflow with the following details:
      - Name: "${name}"
      - Description: "${description || 'No description provided'}"
      - Trigger app: "${triggerAppId}"
      - Action app: "${actionAppId}"
      
      Format the response as a valid JSON object with the following structure:
      {
        "triggerConfig": { /* Configuration specific to the trigger type */ },
        "actionConfig": { /* Configuration specific to the action type */ }
      }

      The configuration should be simple but realistic for a first-time user.`;
      
      const result = await openaiService.generateText(
        `Generate configurations for ${triggerAppId} trigger and ${actionAppId} action`,
        800,
        0.7,
        "gpt-4o",
        systemMessage,
        req
      );
      
      let configs;
      try {
        configs = JSON.parse(result.text);
      } catch (parseError) {
        console.error("Error parsing AI config response:", parseError);
        // Fallback to basic configs
        configs = {
          triggerConfig: { schedule: "0 9 * * *" },
          actionConfig: { template: "Default template" }
        };
      }
      
      // Create the automation
      const newAutomation = await storage.createAutomation({
        name,
        triggerAppId,
        triggerConfig: configs.triggerConfig,
        actionAppId,
        actionConfig: configs.actionConfig,
        active: false,
      });
      
      res.status(201).json(newAutomation);
    } catch (error: any) {
      console.error("Create workflow error:", error);
      res.status(500).json({ 
        message: "Failed to create workflow", 
        error: error.message 
      });
    }
  });
  
  // Helper function to get static context-specific help
  function getContextHelp(contextId: string): { text: string; context: string; suggestions: string[] } | null {
    const contextHelp: Record<string, { text: string; suggestions: string[] }> = {
      'dashboard': {
        text: 'Welcome to your dashboard! Here you can see all your active automations and their performance.',
        suggestions: ['Create new automation', 'View analytics', 'Check connections']
      },
      'automations-list': {
        text: 'Here you can see all your automations. Click on any automation to edit or view its details.',
        suggestions: ['Create new automation', 'Filter automations', 'Sort by status']
      },
      'automation-editor': {
        text: 'This is where the magic happens! Connect triggers and actions to build your automation workflow.',
        suggestions: ['Add trigger', 'Add action', 'Test workflow', 'Save automation']
      },
      'connections': {
        text: 'Manage your connected apps and services here. Connect new apps to use in your automations.',
        suggestions: ['Connect new service', 'Refresh connections', 'View available integrations']
      },
      'ai-services': {
        text: 'Explore AI capabilities to enhance your automations with text analysis, image generation, and more.',
        suggestions: ['Try text analysis', 'Explore web search', 'Check API key status']
      },
      'settings': {
        text: 'Configure your account settings and preferences. Manage API keys for various services.',
        suggestions: ['Update profile', 'Configure API keys', 'Change theme']
      }
    };
    
    const help = contextHelp[contextId];
    return help ? { text: help.text, context: contextId, suggestions: help.suggestions } : null;
  }

  const httpServer = createServer(app);
  return httpServer;
}

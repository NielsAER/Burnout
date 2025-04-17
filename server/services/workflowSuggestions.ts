import OpenAI from "openai";
import { storage } from "../storage";
import { Automation, AppConnection } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Types for suggestion system
 */
export interface WorkflowSuggestion {
  name: string;
  description: string;
  triggerAppId: string;
  actionAppId: string;
  complexity: number;
  triggerConfigTemplate: Record<string, any>;
  actionConfigTemplate: Record<string, any>;
  matchScore: number;  // How well this suggestion matches the user's needs (0-100)
  category: string;    // e.g., "productivity", "social media", "communication", etc.
  tags: string[];      // Additional metadata tags
  benefits: string[];  // List of benefits this workflow provides
}

interface UserContext {
  connectedApps: string[];
  existingWorkflows: Automation[];
  totalWorkflows: number;
  workflowCategories: Record<string, number>; // Category distribution
  userPreferences?: Record<string, any>;
  recentActivity?: Record<string, any>;
}

/**
 * Generate personalized workflow suggestions based on user's context
 */
export async function generateWorkflowSuggestions(
  userId: number,
  count: number = 3,
  category?: string
): Promise<WorkflowSuggestion[]> {
  try {
    // Get user's context
    const userContext = await getUserContext(userId);
    
    // Generate suggestions using OpenAI
    const suggestions = await generateSuggestionsWithAI(userContext, count, category);
    
    return suggestions;
  } catch (error: any) {
    console.error("Error generating workflow suggestions:", error);
    throw new Error(`Failed to generate workflow suggestions: ${error.message}`);
  }
}

/**
 * Get detailed suggestion for a specific workflow
 */
export async function getDetailedSuggestion(
  userId: number,
  suggestionId: string
): Promise<WorkflowSuggestion> {
  try {
    // This would typically fetch from a database, but for now we'll regenerate
    // In a production system, suggestions would be stored with IDs
    
    // Get user's context
    const userContext = await getUserContext(userId);
    
    // Generate a detailed suggestion using OpenAI
    const suggestion = await generateDetailedSuggestionWithAI(userContext, suggestionId);
    
    return suggestion;
  } catch (error: any) {
    console.error("Error getting detailed workflow suggestion:", error);
    throw new Error(`Failed to get detailed workflow suggestion: ${error.message}`);
  }
}

/**
 * Get user's context for AI suggestion generation
 */
async function getUserContext(userId: number): Promise<UserContext> {
  // Get user's connected apps
  const appConnections = await storage.getAppConnectionsByUser(userId);
  const connectedApps = appConnections.map(connection => connection.appId);
  
  // Get user's existing workflows
  const automations = await storage.getAllAutomations();
  
  // Calculate category distribution
  const workflowCategories: Record<string, number> = {};
  automations.forEach(automation => {
    const category = getCategoryFromAutomation(automation);
    workflowCategories[category] = (workflowCategories[category] || 0) + 1;
  });
  
  return {
    connectedApps,
    existingWorkflows: automations,
    totalWorkflows: automations.length,
    workflowCategories,
  };
}

/**
 * Generate workflow suggestions using OpenAI's API
 */
async function generateSuggestionsWithAI(
  userContext: UserContext,
  count: number,
  category?: string
): Promise<WorkflowSuggestion[]> {
  try {
    // Create the prompt for OpenAI
    const systemMessage = `You are an expert workflow automation assistant that provides highly personalized automation suggestions. 
Consider the user's connected apps, existing workflows, and preferences to suggest new automation workflows that would be valuable.
Your suggestions should be creative yet practical, focusing on real productivity benefits.
I'll provide you with information about the user's current context, and you should respond with JSON containing an array of workflow suggestions.`;

    const userMessage = `Based on the following user context, generate ${count} personalized workflow automation suggestions${category ? ` in the "${category}" category` : ''}:

User Context:
- Connected Apps: ${userContext.connectedApps.join(", ")}
- Total Existing Workflows: ${userContext.totalWorkflows}
- Workflow Categories: ${JSON.stringify(userContext.workflowCategories)}

For each suggestion, provide the following in JSON format:
- name: A clear, concise name for the workflow
- description: A helpful description explaining what the workflow does and its benefits
- triggerAppId: The app that triggers the workflow (must be one of the connected apps)
- actionAppId: The app that performs the action (must be one of the connected apps)
- complexity: Estimated complexity score (1-10)
- category: The category this workflow belongs to
- tags: Array of relevant tags
- benefits: Array of specific benefits this workflow provides
- matchScore: How well this matches the user's needs (0-100)

Only include suggestions that involve apps the user has connected.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const content = response.choices[0].message.content;
    const suggestionsData = JSON.parse(content || "{}");
    
    if (!suggestionsData.suggestions || !Array.isArray(suggestionsData.suggestions)) {
      return [];
    }
    
    // Add template configurations
    const completeSuggestions = suggestionsData.suggestions.map((suggestion: any) => ({
      ...suggestion,
      triggerConfigTemplate: generateConfigTemplate(suggestion.triggerAppId, "trigger"),
      actionConfigTemplate: generateConfigTemplate(suggestion.actionAppId, "action")
    }));
    
    return completeSuggestions;
  } catch (error: any) {
    console.error("OpenAI suggestion generation error:", error);
    throw new Error(`Failed to generate suggestions with AI: ${error.message}`);
  }
}

/**
 * Generate a detailed suggestion for a specific workflow
 */
async function generateDetailedSuggestionWithAI(
  userContext: UserContext,
  suggestionId: string
): Promise<WorkflowSuggestion> {
  try {
    // For now, we'll generate a generic detailed suggestion
    // In a production system, this would fetch from a database
    
    const systemMessage = `You are an expert workflow automation assistant that provides detailed workflow configurations.
Based on the workflow ID and user context, generate a complete workflow configuration with specific trigger and action settings.
Your configuration should be detailed and ready for implementation.`;

    const userMessage = `Generate a detailed workflow configuration for workflow ID "${suggestionId}".
The user has the following connected apps: ${userContext.connectedApps.join(", ")}.
Provide a complete JSON configuration including:
- Detailed trigger and action configurations with all necessary fields
- Explanations for each configuration option
- Reasonable default values for all fields`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    // Parse the response
    const content = response.choices[0].message.content;
    const detailedSuggestion = JSON.parse(content || "{}");
    
    return {
      name: detailedSuggestion.name || "Unnamed Workflow",
      description: detailedSuggestion.description || "",
      triggerAppId: detailedSuggestion.triggerAppId || "",
      actionAppId: detailedSuggestion.actionAppId || "",
      complexity: detailedSuggestion.complexity || 5,
      triggerConfigTemplate: detailedSuggestion.triggerConfig || {},
      actionConfigTemplate: detailedSuggestion.actionConfig || {},
      matchScore: detailedSuggestion.matchScore || 75,
      category: detailedSuggestion.category || "general",
      tags: detailedSuggestion.tags || [],
      benefits: detailedSuggestion.benefits || []
    };
  } catch (error: any) {
    console.error("OpenAI detailed suggestion error:", error);
    throw new Error(`Failed to generate detailed suggestion with AI: ${error.message}`);
  }
}

/**
 * Generate a template configuration for an app
 */
function generateConfigTemplate(appId: string, type: "trigger" | "action"): Record<string, any> {
  // In a real implementation, this would be based on app-specific templates
  // For now, providing basic templates
  
  // Common templates based on app ID
  const templates: Record<string, Record<string, any>> = {
    "gmail": {
      trigger: {
        event: "new_email",
        filters: {
          from: "",
          subject: "",
          hasAttachment: false
        }
      },
      action: {
        operation: "send_email",
        to: "",
        subject: "",
        body: ""
      }
    },
    "google-calendar": {
      trigger: {
        event: "new_event",
        calendar: "primary"
      },
      action: {
        operation: "create_event",
        title: "",
        start: "",
        end: "",
        attendees: []
      }
    },
    "google-sheets": {
      trigger: {
        event: "sheet_updated",
        spreadsheetId: "",
        sheetName: ""
      },
      action: {
        operation: "append_row",
        spreadsheetId: "",
        sheetName: "",
        values: []
      }
    },
    "slack": {
      trigger: {
        event: "new_message",
        channel: "",
        contains: ""
      },
      action: {
        operation: "post_message",
        channel: "",
        message: ""
      }
    },
    "twitter": {
      trigger: {
        event: "new_tweet",
        from: "",
        contains: ""
      },
      action: {
        operation: "post_tweet",
        message: ""
      }
    },
    "instagram": {
      trigger: {
        event: "new_post",
        hashtag: ""
      },
      action: {
        operation: "create_post",
        image: "",
        caption: ""
      }
    },
    "openai": {
      trigger: {
        event: "scheduled",
        frequency: "daily"
      },
      action: {
        operation: "generate_text",
        prompt: "",
        maxTokens: 500,
        temperature: 0.7
      }
    },
    "anthropic": {
      trigger: {
        event: "scheduled",
        frequency: "daily"
      },
      action: {
        operation: "generate_text",
        prompt: "",
        maxTokens: 500,
        temperature: 0.7
      }
    },
    "google-drive": {
      trigger: {
        event: "new_file",
        folder: ""
      },
      action: {
        operation: "create_file",
        name: "",
        content: "",
        mimeType: "text/plain"
      }
    },
    "dropbox": {
      trigger: {
        event: "file_changed",
        path: ""
      },
      action: {
        operation: "upload_file",
        path: "",
        content: ""
      }
    },
    "notion": {
      trigger: {
        event: "new_database_item",
        databaseId: ""
      },
      action: {
        operation: "create_page",
        parentId: "",
        title: "",
        content: ""
      }
    }
  };
  
  // Return the template if available, otherwise an empty object
  return (templates[appId] && templates[appId][type]) || {};
}

/**
 * Determine category from an automation
 */
function getCategoryFromAutomation(automation: Automation): string {
  // Map common apps to categories
  const appCategories: Record<string, string> = {
    "gmail": "email",
    "google-calendar": "calendar",
    "google-sheets": "data",
    "google-docs": "documents",
    "slack": "communication",
    "twitter": "social_media",
    "instagram": "social_media",
    "facebook": "social_media",
    "linkedin": "professional",
    "openai": "ai",
    "anthropic": "ai",
    "perplexity": "ai",
    "ollama": "ai",
    "google-drive": "storage",
    "dropbox": "storage",
    "notion": "productivity",
    "trello": "project_management",
    "jira": "project_management",
  };
  
  // Try to determine category from trigger app
  const triggerCategory = appCategories[automation.triggerAppId] || "other";
  
  // If trigger is time-based, try to determine from action app
  if (automation.triggerAppId === "scheduler" || automation.triggerAppId === "cron") {
    return appCategories[automation.actionAppId] || triggerCategory;
  }
  
  return triggerCategory;
}
import {
  Automation,
  InsertAutomation,
  ExecutionHistory,
  InsertExecutionHistory,
  AppConnection,
  InsertAppConnection,
  Template,
  InsertTemplate,
  Achievement,
  InsertAchievement,
  UserAchievement,
  InsertUserAchievement,
  WorkflowSuggestion,
  InsertWorkflowSuggestion,
  users,
  automations,
  executionHistories,
  appConnections,
  templates,
  achievements,
  userAchievements,
  workflowSuggestions,
  type User,
  type InsertUser
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<Omit<User, 'id' | 'password'>>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<boolean>;
  getPasswordResetToken(token: string): Promise<{ userId: number, expiresAt: Date } | undefined>;
  deletePasswordResetToken(token: string): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
  
  // Automation methods
  getAllAutomations(): Promise<Automation[]>;
  getAutomation(id: number): Promise<Automation | undefined>;
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  updateAutomation(id: number, data: Partial<InsertAutomation>): Promise<Automation | undefined>;
  deleteAutomation(id: number): Promise<boolean>;
  toggleAutomationStatus(id: number): Promise<Automation | undefined>;
  incrementAutomationRuns(id: number): Promise<Automation | undefined>;
  updateAutomationHealthScore(id: number, score: number): Promise<Automation | undefined>;
  updateAutomationComplexity(id: number, complexity: number): Promise<Automation | undefined>;
  updateAutomationReliability(id: number, reliability: any): Promise<Automation | undefined>;
  
  // Execution history methods
  getAllExecutionHistories(): Promise<ExecutionHistory[]>;
  getExecutionHistoriesByAutomationId(automationId: number): Promise<ExecutionHistory[]>;
  createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory>;
  
  // App connection methods
  getAllAppConnections(): Promise<AppConnection[]>;
  getAppConnection(id: number): Promise<AppConnection | undefined>;
  getAppConnectionsByUser(userId: number): Promise<AppConnection[]>;
  getAppConnectionByUserAndApp(userId: number, appId: string): Promise<AppConnection | undefined>;
  createAppConnection(connection: InsertAppConnection): Promise<AppConnection>;
  updateAppConnection(id: number, data: Partial<InsertAppConnection>): Promise<AppConnection | undefined>;
  deleteAppConnection(id: number): Promise<boolean>;
  
  // Template methods
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  getPopularTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  
  // Achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUnlockedAchievements(automationId: number): Promise<Achievement[]>;
  unlockAchievement(automationId: number, achievementId: number): Promise<UserAchievement>;

  // Workflow suggestion methods
  getAllWorkflowSuggestions(): Promise<WorkflowSuggestion[]>;
  getPersonalizedWorkflowSuggestions(limit?: number): Promise<WorkflowSuggestion[]>;
  getWorkflowSuggestionsByCategory(category: string, limit?: number): Promise<WorkflowSuggestion[]>;
  createWorkflowSuggestion(suggestion: InsertWorkflowSuggestion): Promise<WorkflowSuggestion>;
  updateWorkflowSuggestion(id: number, data: Partial<InsertWorkflowSuggestion>): Promise<WorkflowSuggestion | undefined>;
  deleteWorkflowSuggestion(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private automations: Map<number, Automation>;
  private executionHistories: Map<number, ExecutionHistory>;
  private appConnections: Map<number, AppConnection>;
  private templates: Map<number, Template>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private workflowSuggestions: Map<number, WorkflowSuggestion>;
  private passwordResetTokens: Map<string, { userId: number, expiresAt: Date }>;
  private currentUserId: number;
  private currentAutomationId: number;
  private currentExecutionHistoryId: number;
  private currentAppConnectionId: number;
  private currentTemplateId: number;
  private currentAchievementId: number;
  private currentUserAchievementId: number;
  private currentWorkflowSuggestionId: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.automations = new Map();
    this.executionHistories = new Map();
    this.appConnections = new Map();
    this.templates = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.workflowSuggestions = new Map();
    this.passwordResetTokens = new Map();
    this.currentUserId = 1;
    this.currentAutomationId = 1;
    this.currentExecutionHistoryId = 1;
    this.currentAppConnectionId = 1;
    this.currentTemplateId = 1;
    this.currentAchievementId = 1;
    this.currentUserAchievementId = 1;
    this.currentWorkflowSuggestionId = 1;
    
    // Initialize the session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Seed templates data
    this.seedTemplates();
    // Seed automations data for demo
    this.seedAutomations();
    // Seed execution history data
    this.seedExecutionHistories();
    // Seed achievements
    this.seedAchievements();
    // Seed workflow suggestions
    this.seedWorkflowSuggestions();
  }
  
  // Health score and achievement methods
  async updateAutomationHealthScore(id: number, score: number): Promise<Automation | undefined> {
    const automation = this.automations.get(id);
    if (!automation) return undefined;
    
    const updatedAutomation = { ...automation, healthScore: score };
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }
  
  async updateAutomationComplexity(id: number, complexity: number): Promise<Automation | undefined> {
    const automation = this.automations.get(id);
    if (!automation) return undefined;
    
    const updatedAutomation = { ...automation, complexity };
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }
  
  async updateAutomationReliability(id: number, reliability: any): Promise<Automation | undefined> {
    const automation = this.automations.get(id);
    if (!automation) return undefined;
    
    const updatedAutomation = { ...automation, reliability };
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }
  
  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    return this.achievements.get(id);
  }
  
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const newAchievement: Achievement = {
      ...achievement,
      id,
      unlockedAt: null,
      createdAt: new Date()
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }
  
  async getUnlockedAchievements(automationId: number): Promise<Achievement[]> {
    const userAchievements = Array.from(this.userAchievements.values())
      .filter(ua => ua.automationId === automationId);
      
    // Map user achievements to their achievement details with correct unlocked time
    const result: Achievement[] = [];
    
    for (const ua of userAchievements) {
      const achievement = this.achievements.get(ua.achievementId);
      if (achievement) {
        // Create a copy with the unlocked timestamp from the user achievement
        result.push({
          ...achievement,
          unlockedAt: ua.unlockedAt
        });
      }
    }
    
    return result;
  }
  
  async unlockAchievement(automationId: number, achievementId: number): Promise<UserAchievement> {
    // Check if this achievement is already unlocked for this automation
    const existingUserAchievement = Array.from(this.userAchievements.values())
      .find(ua => ua.automationId === automationId && ua.achievementId === achievementId);
      
    if (existingUserAchievement) {
      return existingUserAchievement; // Already unlocked
    }
    
    const id = this.currentUserAchievementId++;
    const now = new Date();
    
    const userAchievement: UserAchievement = {
      id,
      automationId,
      achievementId,
      unlockedAt: now
    };
    
    this.userAchievements.set(id, userAchievement);
    
    // Note: We no longer update the original achievement as that caused issues
    // Instead, we just store the unlocked timestamp in the userAchievement
    
    return userAchievement;
  }
  
  // Seed achievements
  private seedAchievements() {
    const achievements: InsertAchievement[] = [
      {
        name: "Workflow Pioneer",
        description: "Created your first automation workflow",
        category: "innovation",
        icon: "rocket",
        threshold: 1,
      },
      {
        name: "100% Uptime",
        description: "Maintained perfect reliability for 7 days",
        category: "reliability",
        icon: "badge-check",
        threshold: 7,
      },
      {
        name: "Workflow Architect",
        description: "Created a workflow with at least 3 conditions",
        category: "complexity",
        icon: "git-branch",
        threshold: 3,
      },
      {
        name: "Complexity Wizard",
        description: "Built a workflow with complexity score of 5+",
        category: "complexity",
        icon: "brain",
        threshold: 5,
      },
      {
        name: "Master Engineer",
        description: "Created a workflow with complexity score of 8+",
        category: "complexity",
        icon: "cog",
        threshold: 8,
      },
      {
        name: "AI Integrator",
        description: "Successfully integrated AI services in your workflow",
        category: "complexity",
        icon: "sparkles",
        threshold: 1,
      },
      {
        name: "Conditional Logic Pro",
        description: "Created a workflow with at least 5 conditions",
        category: "complexity",
        icon: "git-merge",
        threshold: 5,
      },
      {
        name: "Automation Master",
        description: "Created 10 or more automations",
        category: "volume",
        icon: "zap",
        threshold: 10,
      },
      {
        name: "Efficiency Expert",
        description: "Saved over 5 hours with automations",
        category: "volume",
        icon: "clock",
        threshold: 5,
      }
    ];
    
    achievements.forEach(achievement => {
      const id = this.currentAchievementId++;
      this.achievements.set(id, {
        ...achievement,
        id, 
        unlockedAt: null,
        createdAt: new Date()
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, password: newPassword };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<boolean> {
    try {
      this.passwordResetTokens.set(token, { userId, expiresAt });
      return true;
    } catch (error) {
      console.error("Failed to create password reset token:", error);
      return false;
    }
  }
  
  async getPasswordResetToken(token: string): Promise<{ userId: number, expiresAt: Date } | undefined> {
    const result = this.passwordResetTokens.get(token);
    
    // Check if token exists and hasn't expired
    if (result && result.expiresAt > new Date()) {
      return result;
    }
    
    // Delete expired token if found
    if (result) {
      this.passwordResetTokens.delete(token);
    }
    
    return undefined;
  }
  
  async deletePasswordResetToken(token: string): Promise<boolean> {
    return this.passwordResetTokens.delete(token);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      lastLoginAt: now,
      fullName: insertUser.fullName || null,
      bio: insertUser.bio || null,
      avatarUrl: insertUser.avatarUrl || null,
      email: insertUser.email || null,
      role: insertUser.role || "user"
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id' | 'password'>>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Automation methods
  async getAllAutomations(): Promise<Automation[]> {
    return Array.from(this.automations.values());
  }

  async getAutomation(id: number): Promise<Automation | undefined> {
    return this.automations.get(id);
  }

  async createAutomation(insertAutomation: InsertAutomation): Promise<Automation> {
    const id = this.currentAutomationId++;
    const now = new Date();
    const automation: Automation = {
      ...insertAutomation,
      id,
      createdAt: now,
      lastRunAt: null,
      runsToday: 0,
      healthScore: 100,
      complexity: 1,
      reliability: {
        successRate: 100,
        errorCount: 0,
        totalRuns: 0
      }
    };
    this.automations.set(id, automation);
    return automation;
  }

  async updateAutomation(id: number, data: Partial<InsertAutomation>): Promise<Automation | undefined> {
    const automation = this.automations.get(id);
    if (!automation) return undefined;

    const updatedAutomation = { ...automation, ...data };
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }

  async deleteAutomation(id: number): Promise<boolean> {
    return this.automations.delete(id);
  }

  async toggleAutomationStatus(id: number): Promise<Automation | undefined> {
    const automation = this.automations.get(id);
    if (!automation) return undefined;

    const updatedAutomation = { ...automation, active: !automation.active };
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }

  async incrementAutomationRuns(id: number): Promise<Automation | undefined> {
    const automation = this.automations.get(id);
    if (!automation) return undefined;

    const now = new Date();
    const updatedAutomation = { 
      ...automation, 
      lastRunAt: now, 
      runsToday: automation.runsToday + 1 
    };
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }

  // Execution history methods
  async getAllExecutionHistories(): Promise<ExecutionHistory[]> {
    return Array.from(this.executionHistories.values());
  }

  async getExecutionHistoriesByAutomationId(automationId: number): Promise<ExecutionHistory[]> {
    return Array.from(this.executionHistories.values())
      .filter(history => history.automationId === automationId)
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  }

  async createExecutionHistory(insertHistory: InsertExecutionHistory): Promise<ExecutionHistory> {
    const id = this.currentExecutionHistoryId++;
    const now = new Date();
    const history: ExecutionHistory = {
      ...insertHistory,
      id,
      executedAt: now
    };
    this.executionHistories.set(id, history);
    return history;
  }

  // App connection methods
  async getAllAppConnections(): Promise<AppConnection[]> {
    return Array.from(this.appConnections.values());
  }

  async getAppConnection(id: number): Promise<AppConnection | undefined> {
    return this.appConnections.get(id);
  }

  async getAppConnectionsByUser(userId: number): Promise<AppConnection[]> {
    return Array.from(this.appConnections.values())
      .filter(conn => conn.userId === userId);
  }

  async getAppConnectionByUserAndApp(userId: number, appId: string): Promise<AppConnection | undefined> {
    return Array.from(this.appConnections.values())
      .find(conn => conn.userId === userId && conn.appId === appId);
  }

  async createAppConnection(insertConnection: InsertAppConnection): Promise<AppConnection> {
    const id = this.currentAppConnectionId++;
    const now = new Date();
    const connection: AppConnection = {
      ...insertConnection,
      id,
      createdAt: now
    };
    this.appConnections.set(id, connection);
    return connection;
  }
  
  async updateAppConnection(id: number, data: Partial<InsertAppConnection>): Promise<AppConnection | undefined> {
    const connection = this.appConnections.get(id);
    if (!connection) return undefined;

    const updatedConnection = { ...connection, ...data };
    this.appConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async deleteAppConnection(id: number): Promise<boolean> {
    return this.appConnections.delete(id);
  }

  // Template methods
  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getPopularTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => template.popular);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const template: Template = {
      ...insertTemplate,
      id
    };
    this.templates.set(id, template);
    return template;
  }
  
  // Workflow Suggestion methods
  async getAllWorkflowSuggestions(): Promise<WorkflowSuggestion[]> {
    return Array.from(this.workflowSuggestions.values());
  }
  
  async getPersonalizedWorkflowSuggestions(limit: number = 10): Promise<WorkflowSuggestion[]> {
    return Array.from(this.workflowSuggestions.values())
      .filter(suggestion => suggestion.personalized)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  async getWorkflowSuggestionsByCategory(category: string, limit: number = 10): Promise<WorkflowSuggestion[]> {
    return Array.from(this.workflowSuggestions.values())
      .filter(suggestion => suggestion.category === category)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  async createWorkflowSuggestion(insertSuggestion: InsertWorkflowSuggestion): Promise<WorkflowSuggestion> {
    const id = this.currentWorkflowSuggestionId++;
    const now = new Date();
    const suggestion: WorkflowSuggestion = {
      ...insertSuggestion,
      id,
      createdAt: now,
      personalized: insertSuggestion.personalized || false,
      relevanceScore: insertSuggestion.relevanceScore || 50,
    };
    this.workflowSuggestions.set(id, suggestion);
    return suggestion;
  }
  
  async updateWorkflowSuggestion(id: number, data: Partial<InsertWorkflowSuggestion>): Promise<WorkflowSuggestion | undefined> {
    const suggestion = this.workflowSuggestions.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = { ...suggestion, ...data };
    this.workflowSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }
  
  async deleteWorkflowSuggestion(id: number): Promise<boolean> {
    return this.workflowSuggestions.delete(id);
  }
  
  // Seed method for workflow suggestions
  private seedWorkflowSuggestions() {
    const suggestions: InsertWorkflowSuggestion[] = [
      {
        name: "Daily Social Media Summary",
        description: "Get a daily summary of your social media posts and engagement",
        triggerAppId: "schedule",
        actionAppId: "openai",
        config: {
          triggers: {
            schedule: {
              frequency: "daily",
              time: "18:00"
            }
          },
          actions: {
            openai: {
              model: "gpt-4o",
              prompt: "Summarize my social media activities for today"
            }
          }
        },
        category: "social",
        personalized: true,
        relevanceScore: 85
      },
      {
        name: "Tweet When Blog Published",
        description: "Automatically create a tweet when you publish a new blog post",
        triggerAppId: "rss",
        actionAppId: "twitter",
        config: {
          triggers: {
            rss: {
              url: "https://yourblog.com/feed"
            }
          },
          actions: {
            twitter: {
              message: "New blog post: {{title}} {{url}}"
            }
          }
        },
        category: "social",
        personalized: false,
        relevanceScore: 75
      },
      {
        name: "Email Summarizer",
        description: "Automatically summarize long emails for quick review",
        triggerAppId: "gmail",
        actionAppId: "openai",
        config: {
          triggers: {
            gmail: {
              label: "inbox",
              filter: "from:important OR subject:urgent"
            }
          },
          actions: {
            openai: {
              model: "gpt-4o",
              prompt: "Summarize this email in 3 bullet points: {{email_body}}"
            }
          }
        },
        category: "productivity",
        personalized: true,
        relevanceScore: 90
      },
      {
        name: "Meeting Notes to Notion",
        description: "Send meeting notes to your Notion workspace",
        triggerAppId: "googlecalendar",
        actionAppId: "notion",
        config: {
          triggers: {
            googlecalendar: {
              eventType: "ended"
            }
          },
          actions: {
            notion: {
              database: "Meeting Notes",
              properties: {
                title: "{{event_title}}",
                date: "{{event_date}}",
                participants: "{{attendees}}"
              }
            }
          }
        },
        category: "productivity",
        personalized: false,
        relevanceScore: 80
      },
      {
        name: "Content Idea Generator",
        description: "Generate content ideas based on trending topics",
        triggerAppId: "schedule",
        actionAppId: "anthropic",
        config: {
          triggers: {
            schedule: {
              frequency: "weekly",
              day: "Monday",
              time: "09:00"
            }
          },
          actions: {
            anthropic: {
              model: "claude-3-7-sonnet-20250219",
              prompt: "Generate 5 content ideas for {{industry}} based on current trends"
            }
          }
        },
        category: "content",
        personalized: true,
        relevanceScore: 85
      }
    ];
    
    suggestions.forEach(suggestion => {
      const id = this.currentWorkflowSuggestionId++;
      this.workflowSuggestions.set(id, {
        ...suggestion,
        id,
        createdAt: new Date(),
        personalized: suggestion.personalized || false,
        relevanceScore: suggestion.relevanceScore || 50
      });
    });
  }

  // Seed methods for initial data
  private seedTemplates() {
    const templates: InsertTemplate[] = [
      {
        name: "New Lead Notifications",
        description: "Get notified when new leads are added to your CRM",
        triggerAppId: "crm",
        actionAppId: "notification",
        templateConfig: {
          triggerOptions: { event: "new_lead" },
          actionOptions: { notificationType: "email" }
        },
        popular: true
      },
      {
        name: "Save Attachments to Drive",
        description: "Save email attachments to Google Drive automatically",
        triggerAppId: "gmail",
        actionAppId: "google-drive",
        templateConfig: {
          triggerOptions: { includeAttachments: true },
          actionOptions: { folder: "Email Attachments" }
        },
        popular: true
      },
      {
        name: "Social Media to WordPress",
        description: "Post Instagram photos to WordPress automatically",
        triggerAppId: "instagram",
        actionAppId: "wordpress",
        templateConfig: {
          triggerOptions: { mediaType: "photo" },
          actionOptions: { postType: "post", category: "Social Media" }
        },
        popular: true
      },
      {
        name: "Event to Calendar",
        description: "Add new events to your Google Calendar",
        triggerAppId: "events",
        actionAppId: "google-calendar",
        templateConfig: {
          triggerOptions: { eventType: "all" },
          actionOptions: { calendar: "Main" }
        },
        popular: true
      }
    ];

    templates.forEach(template => {
      const id = this.currentTemplateId++;
      this.templates.set(id, { ...template, id });
    });
  }

  private seedAutomations() {
    const automations: InsertAutomation[] = [
      {
        name: "Gmail to Slack Notifications",
        active: true,
        triggerAppId: "gmail",
        triggerConfig: { 
          event: "new_email",
          filter: "important",
          keywords: ["urgent", "priority", "asap"]
        },
        actionAppId: "slack",
        actionConfig: {
          channel: "notifications",
          messageTemplate: "New email from {{sender}}: {{subject}}"
        }
      },
      {
        name: "Twitter Mentions to CRM",
        active: true,
        triggerAppId: "twitter",
        triggerConfig: {
          event: "mention",
          includeRetweets: true
        },
        actionAppId: "crm",
        actionConfig: {
          leadSource: "Twitter",
          createContact: true
        }
      },
      {
        name: "Form to Google Sheet",
        active: false,
        triggerAppId: "form",
        triggerConfig: {
          formId: "contact-form",
          includeAllFields: true
        },
        actionAppId: "google-sheets",
        actionConfig: {
          spreadsheetId: "1234",
          sheetName: "Form Submissions"
        }
      }
    ];

    automations.forEach(automation => {
      const id = this.currentAutomationId++;
      const now = new Date();
      
      // Add different timestamps and run counts
      let lastRunAt = null;
      let runsToday = 0;
      
      if (automation.active) {
        lastRunAt = new Date(now.getTime() - Math.floor(Math.random() * 5000000));
        runsToday = automation.name === "Gmail to Slack Notifications" ? 243 : 56;
      } else {
        lastRunAt = new Date(now.getTime() - 172800000); // 2 days ago
      }
      
      this.automations.set(id, { 
        ...automation, 
        id,
        createdAt: new Date(now.getTime() - 604800000), // 1 week ago
        lastRunAt,
        runsToday,
        healthScore: Math.floor(Math.random() * 30) + 70, // 70-100 score range
        complexity: Math.floor(Math.random() * 3) + 1, // 1-3 complexity
        reliability: {
          successRate: Math.floor(Math.random() * 15) + 85, // 85-100% success rate
          errorCount: Math.floor(Math.random() * 5),
          totalRuns: Math.floor(Math.random() * 50) + 50
        }
      });
    });
  }

  private seedExecutionHistories() {
    const now = new Date();
    
    // Create detailed success histories for automation 1 (Gmail to Slack)
    const automation1Histories: InsertExecutionHistory[] = [
      {
        automationId: 1,
        status: "success",
        message: "Processed 3 new emails matching filter criteria",
        duration: 2135, // milliseconds
        level: "info",
        data: { 
          emailCount: 3, 
          matchedEmails: ["urgent meeting", "priority task", "asap review"],
          steps: [
            {
              name: "Fetch Emails",
              status: "success",
              description: "Retrieved emails from Gmail API",
              duration: 430,
              input: { query: "is:unread label:important" },
              output: { totalEmails: 15, matchedEmails: 3 }
            },
            {
              name: "Filter Content",
              status: "success",
              description: "Applied keyword filters to emails",
              duration: 125,
              input: { emails: ["Email 1", "Email 2", "Email 3"] },
              output: { filteredEmails: ["Email 1", "Email 2", "Email 3"] }
            },
            {
              name: "Format Content",
              status: "success",
              description: "Formatted email content for Slack",
              duration: 180,
              input: { emails: ["Email 1", "Email 2", "Email 3"] },
              output: { formattedMessages: ["Message 1", "Message 2", "Message 3"] }
            },
            {
              name: "Send to Slack",
              status: "success",
              description: "Posted messages to Slack channel",
              duration: 1400,
              input: { channel: "#notifications", messages: ["Message 1", "Message 2", "Message 3"] },
              output: { messageIds: ["m1", "m2", "m3"] }
            }
          ],
          request: {
            method: "POST",
            url: "https://slack.com/api/chat.postMessage",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer [REDACTED]" },
            body: { channel: "#notifications", text: "3 new urgent emails" }
          },
          response: {
            status: 200,
            body: { ok: true, channel: "C123456", ts: "1627084800.000001" }
          }
        }
      },
      {
        automationId: 1,
        status: "success",
        message: "Processed 1 new email matching filter criteria",
        duration: 1845,
        level: "info",
        data: { 
          emailCount: 1, 
          matchedEmails: ["urgent invoice"],
          steps: [
            {
              name: "Fetch Emails",
              status: "success",
              description: "Retrieved emails from Gmail API",
              duration: 412,
              input: { query: "is:unread label:important" },
              output: { totalEmails: 7, matchedEmails: 1 }
            },
            {
              name: "Filter Content",
              status: "success",
              description: "Applied keyword filters to emails",
              duration: 98,
              input: { emails: ["Email 1"] },
              output: { filteredEmails: ["Email 1"] }
            },
            {
              name: "Format Content",
              status: "success",
              description: "Formatted email content for Slack",
              duration: 135,
              input: { emails: ["Email 1"] },
              output: { formattedMessages: ["Message 1"] }
            },
            {
              name: "Send to Slack",
              status: "success",
              description: "Posted message to Slack channel",
              duration: 1200,
              input: { channel: "#notifications", messages: ["Message 1"] },
              output: { messageIds: ["m1"] }
            }
          ]
        }
      }
    ];
    
    // Create detailed success history for automation 2 (Twitter to CRM)
    const automation2Histories: InsertExecutionHistory[] = [
      {
        automationId: 2,
        status: "success",
        message: "Created 2 new contacts from Twitter mentions",
        duration: 3150,
        level: "info",
        data: { 
          mentionCount: 2,
          steps: [
            {
              name: "Search Twitter",
              status: "success",
              description: "Retrieved recent mentions from Twitter API",
              duration: 1250,
              input: { query: "@companyname", count: 100 },
              output: { totalMentions: 12, relevantMentions: 2 }
            },
            {
              name: "Extract Contact Data",
              status: "success",
              description: "Extracted user profiles from mentions",
              duration: 350,
              input: { mentions: ["Mention 1", "Mention 2"] },
              output: { userProfiles: ["User 1", "User 2"] }
            },
            {
              name: "Create CRM Records",
              status: "success",
              description: "Created new contact records in CRM",
              duration: 1550,
              input: { profiles: ["User 1", "User 2"] },
              output: { contactIds: ["c1", "c2"] }
            }
          ],
          request: {
            method: "POST",
            url: "https://api.crm.com/contacts/batch",
            headers: { "Content-Type": "application/json", "Authorization": "ApiKey [REDACTED]" },
            body: { contacts: [{ name: "John Doe" }, { name: "Jane Smith" }] }
          },
          response: {
            status: 201,
            body: { success: true, created: 2, ids: ["c1", "c2"] }
          }
        }
      }
    ];
    
    // Create detailed error history for automation 3 (Form to Sheets)
    const automation3Histories: InsertExecutionHistory[] = [
      {
        automationId: 3,
        status: "failed",
        message: "Authentication error: Google Sheets API access token expired",
        duration: 1520,
        level: "error",
        data: { 
          errorCode: "auth_expired",
          error: {
            message: "Authentication error: Google Sheets API access token expired",
            code: "401",
            location: "GoogleSheetsAction.appendRow",
            timestamp: new Date(now.getTime() - (2 * 60 * 60 * 1000)).toISOString()
          },
          steps: [
            {
              name: "Fetch Form Submissions",
              status: "success",
              description: "Retrieved form submissions from database",
              duration: 320,
              input: { formId: "contact-form", limit: 10 },
              output: { submissions: ["Submission 1", "Submission 2"] }
            },
            {
              name: "Format Data",
              status: "success",
              description: "Formatted form data for Google Sheets",
              duration: 180,
              input: { submissions: ["Submission 1", "Submission 2"] },
              output: { rows: ["Row 1", "Row 2"] }
            },
            {
              name: "Append to Sheet",
              status: "failed",
              description: "Appended rows to Google Sheet",
              duration: 1020,
              input: { sheetId: "1AbCdEfGhIjKlMnOpQrStUvWxYz", rows: ["Row 1", "Row 2"] },
              error: {
                message: "Request had invalid authentication credentials. Expected OAuth 2 access token.",
                code: 401,
                stack: "Error: Request had invalid authentication credentials\n    at GoogleSheetsAction.appendRow (googleSheets.ts:124)\n    at processFormSubmission (formProcessing.ts:85)\n    at runAutomation (automation.ts:47)"
              }
            }
          ],
          request: {
            method: "POST",
            url: "https://sheets.googleapis.com/v4/spreadsheets/1AbCdEfGhIjKlMnOpQrStUvWxYz/values/Sheet1!A1:append",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer [EXPIRED_TOKEN]" },
            body: { values: [["John Doe", "john@example.com", "Product inquiry"]] }
          },
          response: {
            status: 401,
            body: { 
              error: {
                code: 401,
                message: "Request had invalid authentication credentials. Expected OAuth 2 access token.",
                status: "UNAUTHENTICATED"
              }
            }
          }
        }
      }
    ];
    
    // Create a few more sample execution histories with varying statuses
    const additionalHistories: InsertExecutionHistory[] = [
      {
        automationId: 4,
        status: "success",
        message: "Generated daily sales report",
        duration: 2845,
        level: "info",
        data: {
          steps: [
            {
              name: "Fetch Sales Data",
              status: "success",
              description: "Retrieved daily sales data from database",
              duration: 845,
              input: { date: new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0] },
              output: { totalSales: 42, revenue: "$3,240.50" }
            },
            {
              name: "Generate Report",
              status: "success",
              description: "Created PDF report",
              duration: 1200,
              input: { data: { totalSales: 42, revenue: "$3,240.50" } },
              output: { reportUrl: "https://storage.cloud.example.com/reports/daily-sales-20230615.pdf" }
            },
            {
              name: "Email Report",
              status: "success",
              description: "Sent report to subscribers",
              duration: 800,
              input: { recipients: ["team@example.com"], reportUrl: "https://storage.cloud.example.com/reports/daily-sales-20230615.pdf" },
              output: { messageId: "msg123456", status: "sent" }
            }
          ]
        }
      },
      {
        automationId: 5,
        status: "failed",
        message: "Failed to process payment",
        duration: 1650,
        level: "error",
        data: {
          error: {
            message: "Payment processing failed: Card declined",
            code: "card_declined",
            location: "StripeAction.processPayment",
            timestamp: new Date(now.getTime() - (4 * 60 * 60 * 1000)).toISOString()
          },
          steps: [
            {
              name: "Fetch Order",
              status: "success",
              description: "Retrieved order details from database",
              duration: 215,
              input: { orderId: "ORD-12345" },
              output: { order: { id: "ORD-12345", amount: 99.95, customer: "cust_123" } }
            },
            {
              name: "Process Payment",
              status: "failed",
              description: "Process payment via Stripe",
              duration: 1435,
              input: { amount: 99.95, currency: "usd", customerId: "cust_123" },
              error: {
                message: "Your card was declined. Your request was in test mode, but used a non test card.",
                code: "card_declined",
                decline_code: "generic_decline",
                stack: "Error: Your card was declined\n    at StripeAction.processPayment (stripe.ts:87)\n    at processOrder (orderProcessing.ts:124)\n    at runAutomation (automation.ts:47)"
              }
            }
          ],
          request: {
            method: "POST",
            url: "https://api.stripe.com/v1/payment_intents",
            headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Bearer [REDACTED]" },
            body: { amount: 9995, currency: "usd", customer: "cust_123", payment_method_types: ["card"] }
          },
          response: {
            status: 402,
            body: { 
              error: {
                type: "card_error",
                code: "card_declined",
                decline_code: "generic_decline",
                message: "Your card was declined."
              }
            }
          }
        }
      }
    ];
    
    // Add all histories with appropriate timestamps
    let timeOffset = 5 * 60 * 1000; // 5 minutes
    
    automation1Histories.forEach(history => {
      const id = this.currentExecutionHistoryId++;
      this.executionHistories.set(id, {
        ...history,
        id,
        executedAt: new Date(now.getTime() - timeOffset)
      });
      timeOffset += 30 * 60 * 1000; // add 30 more minutes
    });
    
    timeOffset = 17 * 60 * 1000; // 17 minutes for second automation
    
    automation2Histories.forEach(history => {
      const id = this.currentExecutionHistoryId++;
      this.executionHistories.set(id, {
        ...history,
        id,
        executedAt: new Date(now.getTime() - timeOffset)
      });
      timeOffset += 45 * 60 * 1000;
    });
    
    timeOffset = 2 * 60 * 60 * 1000; // 2 hours for third automation
    
    automation3Histories.forEach(history => {
      const id = this.currentExecutionHistoryId++;
      this.executionHistories.set(id, {
        ...history,
        id,
        executedAt: new Date(now.getTime() - timeOffset)
      });
    });
    
    timeOffset = 3 * 60 * 60 * 1000; // 3 hours for additional histories
    
    additionalHistories.forEach(history => {
      const id = this.currentExecutionHistoryId++;
      this.executionHistories.set(id, {
        ...history,
        id,
        executedAt: new Date(now.getTime() - timeOffset)
      });
      timeOffset += 60 * 60 * 1000; // add 1 hour
    });
  }
}

// Database storage class that implements IStorage interface using Drizzle ORM
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize the PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // Password reset methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<boolean> {
    try {
      // Create the password_reset_tokens table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          expires_at TIMESTAMP NOT NULL
        )
      `);
      
      // Insert the new token
      await db.execute(sql`
        INSERT INTO password_reset_tokens (token, user_id, expires_at)
        VALUES (${token}, ${userId}, ${expiresAt})
      `);
      
      return true;
    } catch (error) {
      console.error('Failed to create password reset token:', error);
      return false;
    }
  }
  
  async getPasswordResetToken(token: string): Promise<{ userId: number, expiresAt: Date } | undefined> {
    try {
      // Get token if it exists and hasn't expired
      const result = await db.execute<{ user_id: number, expires_at: Date }>(sql`
        SELECT user_id, expires_at 
        FROM password_reset_tokens 
        WHERE token = ${token} AND expires_at > NOW()
      `);
      
      if (!result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      return {
        userId: result.rows[0].user_id,
        expiresAt: result.rows[0].expires_at
      };
    } catch (error) {
      console.error('Failed to get password reset token:', error);
      return undefined;
    }
  }
  
  async deletePasswordResetToken(token: string): Promise<boolean> {
    try {
      await db.execute(sql`
        DELETE FROM password_reset_tokens 
        WHERE token = ${token}
      `);
      return true;
    } catch (error) {
      console.error('Failed to delete password reset token:', error);
      return false;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const userData = {
      ...insertUser,
      createdAt: now,
      lastLoginAt: now,
      fullName: insertUser.fullName || null,
      bio: insertUser.bio || null,
      avatarUrl: insertUser.avatarUrl || null,
      email: insertUser.email || null,
      role: insertUser.role || "user"
    };
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<Omit<User, 'id' | 'password'>>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Automation methods
  async getAllAutomations(): Promise<Automation[]> {
    return await db.select().from(automations);
  }

  async getAutomation(id: number): Promise<Automation | undefined> {
    const [automation] = await db.select().from(automations).where(eq(automations.id, id));
    return automation;
  }

  async createAutomation(insertAutomation: InsertAutomation): Promise<Automation> {
    const [automation] = await db.insert(automations).values(insertAutomation).returning();
    return automation;
  }

  async updateAutomation(id: number, data: Partial<InsertAutomation>): Promise<Automation | undefined> {
    const [automation] = await db
      .update(automations)
      .set(data)
      .where(eq(automations.id, id))
      .returning();
    return automation;
  }

  async deleteAutomation(id: number): Promise<boolean> {
    const result = await db.delete(automations).where(eq(automations.id, id));
    return result.rowCount > 0;
  }

  async toggleAutomationStatus(id: number): Promise<Automation | undefined> {
    const [automation] = await db.select().from(automations).where(eq(automations.id, id));
    if (!automation) return undefined;

    const [updatedAutomation] = await db
      .update(automations)
      .set({ active: !automation.active })
      .where(eq(automations.id, id))
      .returning();
    
    return updatedAutomation;
  }

  async incrementAutomationRuns(id: number): Promise<Automation | undefined> {
    const [automation] = await db.select().from(automations).where(eq(automations.id, id));
    if (!automation) return undefined;

    const [updatedAutomation] = await db
      .update(automations)
      .set({ 
        lastRunAt: new Date(),
        runsToday: automation.runsToday + 1
      })
      .where(eq(automations.id, id))
      .returning();
    
    return updatedAutomation;
  }

  async updateAutomationHealthScore(id: number, score: number): Promise<Automation | undefined> {
    const [updatedAutomation] = await db
      .update(automations)
      .set({ healthScore: score })
      .where(eq(automations.id, id))
      .returning();
    
    return updatedAutomation;
  }

  async updateAutomationComplexity(id: number, complexity: number): Promise<Automation | undefined> {
    const [updatedAutomation] = await db
      .update(automations)
      .set({ complexity })
      .where(eq(automations.id, id))
      .returning();
    
    return updatedAutomation;
  }

  async updateAutomationReliability(id: number, reliability: any): Promise<Automation | undefined> {
    const [updatedAutomation] = await db
      .update(automations)
      .set({ reliability })
      .where(eq(automations.id, id))
      .returning();
    
    return updatedAutomation;
  }

  // Execution history methods
  async getAllExecutionHistories(): Promise<ExecutionHistory[]> {
    return await db.select().from(executionHistories).orderBy(desc(executionHistories.executedAt));
  }

  async getExecutionHistoriesByAutomationId(automationId: number): Promise<ExecutionHistory[]> {
    return await db
      .select()
      .from(executionHistories)
      .where(eq(executionHistories.automationId, automationId))
      .orderBy(desc(executionHistories.executedAt));
  }

  async createExecutionHistory(insertHistory: InsertExecutionHistory): Promise<ExecutionHistory> {
    const [history] = await db
      .insert(executionHistories)
      .values(insertHistory)
      .returning();
    
    return history;
  }

  // App connection methods
  async getAllAppConnections(): Promise<AppConnection[]> {
    return await db.select().from(appConnections);
  }

  async getAppConnection(id: number): Promise<AppConnection | undefined> {
    const [connection] = await db
      .select()
      .from(appConnections)
      .where(eq(appConnections.id, id));
    
    return connection;
  }

  async getAppConnectionsByUser(userId: number): Promise<AppConnection[]> {
    return await db
      .select()
      .from(appConnections)
      .where(eq(appConnections.userId, userId));
  }

  async getAppConnectionByUserAndApp(userId: number, appId: string): Promise<AppConnection | undefined> {
    const [connection] = await db
      .select()
      .from(appConnections)
      .where(and(
        eq(appConnections.userId, userId),
        eq(appConnections.appId, appId)
      ));
    
    return connection;
  }

  async createAppConnection(insertConnection: InsertAppConnection): Promise<AppConnection> {
    const [connection] = await db
      .insert(appConnections)
      .values(insertConnection)
      .returning();
    
    return connection;
  }

  async updateAppConnection(id: number, data: Partial<InsertAppConnection>): Promise<AppConnection | undefined> {
    const [updatedConnection] = await db
      .update(appConnections)
      .set(data)
      .where(eq(appConnections.id, id))
      .returning();
    
    return updatedConnection;
  }

  async deleteAppConnection(id: number): Promise<boolean> {
    const result = await db
      .delete(appConnections)
      .where(eq(appConnections.id, id));
    
    return result.rowCount! > 0;
  }

  // Template methods
  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id));
    
    return template;
  }

  async getPopularTemplates(): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.popular, true));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    
    return template;
  }

  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id));
    
    return achievement;
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
    
    return achievement;
  }

  async getUnlockedAchievements(automationId: number): Promise<Achievement[]> {
    // Join userAchievements and achievements tables to get all unlocked achievements for an automation
    const result = await db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        category: achievements.category,
        icon: achievements.icon,
        threshold: achievements.threshold,
        unlockedAt: userAchievements.unlockedAt,
        createdAt: achievements.createdAt
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.automationId, automationId));
    
    return result;
  }

  async unlockAchievement(automationId: number, achievementId: number): Promise<UserAchievement> {
    // Check if already unlocked
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.automationId, automationId))
      .where(eq(userAchievements.achievementId, achievementId));
    
    if (existing) {
      return existing;
    }
    
    // Create new user achievement record
    const [userAchievement] = await db
      .insert(userAchievements)
      .values({
        automationId,
        achievementId
      })
      .returning();
    
    return userAchievement;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

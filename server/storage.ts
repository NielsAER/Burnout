import {
  Automation,
  InsertAutomation,
  ExecutionHistory,
  InsertExecutionHistory,
  AppConnection,
  InsertAppConnection,
  Template,
  InsertTemplate,
  users,
  type User,
  type InsertUser
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Automation methods
  getAllAutomations(): Promise<Automation[]>;
  getAutomation(id: number): Promise<Automation | undefined>;
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  updateAutomation(id: number, data: Partial<InsertAutomation>): Promise<Automation | undefined>;
  deleteAutomation(id: number): Promise<boolean>;
  toggleAutomationStatus(id: number): Promise<Automation | undefined>;
  incrementAutomationRuns(id: number): Promise<Automation | undefined>;
  
  // Execution history methods
  getAllExecutionHistories(): Promise<ExecutionHistory[]>;
  getExecutionHistoriesByAutomationId(automationId: number): Promise<ExecutionHistory[]>;
  createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory>;
  
  // App connection methods
  getAllAppConnections(): Promise<AppConnection[]>;
  getAppConnection(id: number): Promise<AppConnection | undefined>;
  createAppConnection(connection: InsertAppConnection): Promise<AppConnection>;
  deleteAppConnection(id: number): Promise<boolean>;
  
  // Template methods
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  getPopularTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private automations: Map<number, Automation>;
  private executionHistories: Map<number, ExecutionHistory>;
  private appConnections: Map<number, AppConnection>;
  private templates: Map<number, Template>;
  private currentUserId: number;
  private currentAutomationId: number;
  private currentExecutionHistoryId: number;
  private currentAppConnectionId: number;
  private currentTemplateId: number;

  constructor() {
    this.users = new Map();
    this.automations = new Map();
    this.executionHistories = new Map();
    this.appConnections = new Map();
    this.templates = new Map();
    this.currentUserId = 1;
    this.currentAutomationId = 1;
    this.currentExecutionHistoryId = 1;
    this.currentAppConnectionId = 1;
    this.currentTemplateId = 1;
    
    // Seed templates data
    this.seedTemplates();
    // Seed automations data for demo
    this.seedAutomations();
    // Seed execution history data
    this.seedExecutionHistories();
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
      runsToday: 0
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
        runsToday
      });
    });
  }

  private seedExecutionHistories() {
    const now = new Date();
    
    // Create some execution histories for automation 1 (Gmail to Slack)
    const automation1Histories: InsertExecutionHistory[] = [
      {
        automationId: 1,
        status: "success",
        message: "Processed 3 new emails matching filter criteria",
        data: { emailCount: 3, matchedEmails: ["urgent meeting", "priority task", "asap review"] }
      },
      {
        automationId: 1,
        status: "success",
        message: "Processed 1 new email matching filter criteria",
        data: { emailCount: 1, matchedEmails: ["urgent invoice"] }
      }
    ];
    
    // Create some execution histories for automation 2 (Twitter to CRM)
    const automation2Histories: InsertExecutionHistory[] = [
      {
        automationId: 2,
        status: "success",
        message: "Created 2 new contacts from Twitter mentions",
        data: { mentionCount: 2 }
      }
    ];
    
    // Create error history for automation 3 (Form to Sheets)
    const automation3Histories: InsertExecutionHistory[] = [
      {
        automationId: 3,
        status: "error",
        message: "Authentication error: Google Sheets API access token expired",
        data: { errorCode: "auth_expired" }
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
  }
}

export const storage = new MemStorage();

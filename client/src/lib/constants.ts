export type AppId = 
  | "gmail" 
  | "slack" 
  | "twitter" 
  | "form" 
  | "google-sheets" 
  | "crm" 
  | "google-drive" 
  | "google-calendar" 
  | "instagram" 
  | "wordpress" 
  | "events" 
  | "notification"
  | "openai"
  | "anthropic"
  | "ollama"
  | "perplexity"
  | "text-processor";

export interface AppDefinition {
  id: AppId;
  name: string;
  description: string;
  iconColor: string;
  bgColor: string;
  triggerOptions?: {
    name: string;
    description: string;
  }[];
  actionOptions?: {
    name: string;
    description: string;
  }[];
}

export const APPS: Record<AppId, AppDefinition> = {
  "openai": {
    id: "openai",
    name: "OpenAI",
    description: "Connect to OpenAI API for AI capabilities",
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    actionOptions: [
      { name: "Text Generation", description: "Generate text using GPT models" },
      { name: "Image Generation", description: "Create images with DALL-E models" },
      { name: "Text Analysis", description: "Analyze sentiment, extract information, or classify text" },
      { name: "Content Moderation", description: "Filter and moderate content" }
    ]
  },
  "anthropic": {
    id: "anthropic",
    name: "Anthropic",
    description: "Connect to Anthropic's Claude for AI capabilities",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    actionOptions: [
      { name: "Text Generation", description: "Generate text using Claude models" },
      { name: "Text Analysis", description: "Analyze sentiment, extract information, or classify text" },
      { name: "Content Rewriting", description: "Rewrite or edit existing content" }
    ]
  },
  "ollama": {
    id: "ollama",
    name: "Ollama",
    description: "Connect to local Ollama models",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100",
    actionOptions: [
      { name: "Text Generation", description: "Generate text using local LLM models" },
      { name: "Text Completion", description: "Complete text using local LLM models" },
      { name: "Text Analysis", description: "Analyze text using local LLM models" }
    ]
  },
  "perplexity": {
    id: "perplexity",
    name: "Perplexity",
    description: "Connect to Perplexity for advanced search and AI insights",
    iconColor: "text-indigo-600", 
    bgColor: "bg-indigo-100",
    actionOptions: [
      { name: "Web Search", description: "Search the web with AI-enhanced results" },
      { name: "Research Questions", description: "Get detailed answers to complex research questions" },
      { name: "Topic Analysis", description: "Analyze topics with up-to-date information" }
    ]
  },
  "text-processor": {
    id: "text-processor",
    name: "Text Processor",
    description: "Process and transform text content",
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-100",
    triggerOptions: [
      { name: "Text Input", description: "Process when text is provided" }
    ],
    actionOptions: [
      { name: "Summarize", description: "Create a concise summary of text" },
      { name: "Format", description: "Format text (Markdown, HTML, etc.)" },
      { name: "Extract", description: "Extract data from text (emails, dates, etc.)" },
      { name: "Translate", description: "Translate text to another language" }
    ]
  },
  "gmail": {
    id: "gmail",
    name: "Gmail",
    description: "Connect to your Gmail account",
    iconColor: "text-red-600",
    bgColor: "bg-red-100",
    triggerOptions: [
      { name: "New Email", description: "Trigger when a new email is received" },
      { name: "Email Matching Search", description: "Trigger when an email matches a search" },
      { name: "New Thread", description: "Trigger when a new email thread is created" },
    ]
  },
  "slack": {
    id: "slack",
    name: "Slack",
    description: "Connect to your Slack workspace",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100",
    actionOptions: [
      { name: "Send Message", description: "Send a message to a channel" },
      { name: "Create Channel", description: "Create a new channel" },
      { name: "Send Direct Message", description: "Send a direct message to a user" },
    ]
  },
  "twitter": {
    id: "twitter",
    name: "Twitter",
    description: "Connect to your Twitter account",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "New Tweet", description: "Trigger when you post a new tweet" },
      { name: "New Mention", description: "Trigger when someone mentions you" },
      { name: "New Follower", description: "Trigger when someone follows you" },
    ],
    actionOptions: [
      { name: "Post Tweet", description: "Post a new tweet" },
      { name: "Send Direct Message", description: "Send a direct message" },
      { name: "Like Tweet", description: "Like a tweet" },
    ]
  },
  "form": {
    id: "form",
    name: "Form",
    description: "Connect to web forms",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    triggerOptions: [
      { name: "Form Submission", description: "Trigger when a form is submitted" },
      { name: "Specific Field Submitted", description: "Trigger when a specific field is submitted" },
    ]
  },
  "google-sheets": {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Connect to Google Sheets",
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    actionOptions: [
      { name: "Add Row", description: "Add a row to a sheet" },
      { name: "Update Row", description: "Update a row in a sheet" },
      { name: "Get Row", description: "Get a row from a sheet" },
    ]
  },
  "crm": {
    id: "crm",
    name: "CRM",
    description: "Connect to your CRM system",
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    triggerOptions: [
      { name: "New Lead", description: "Trigger when a new lead is created" },
      { name: "Deal Stage Changed", description: "Trigger when a deal changes stage" },
    ],
    actionOptions: [
      { name: "Create Lead", description: "Create a new lead" },
      { name: "Update Contact", description: "Update a contact" },
      { name: "Create Task", description: "Create a new task" },
    ]
  },
  "google-drive": {
    id: "google-drive",
    name: "Google Drive",
    description: "Connect to Google Drive",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    actionOptions: [
      { name: "Upload File", description: "Upload a file to Google Drive" },
      { name: "Create Folder", description: "Create a new folder" },
      { name: "Copy File", description: "Copy a file to another location" },
    ]
  },
  "google-calendar": {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Connect to Google Calendar",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    actionOptions: [
      { name: "Create Event", description: "Create a new calendar event" },
      { name: "Update Event", description: "Update an existing event" },
      { name: "Delete Event", description: "Delete a calendar event" },
    ]
  },
  "instagram": {
    id: "instagram",
    name: "Instagram",
    description: "Connect to Instagram",
    iconColor: "text-pink-600",
    bgColor: "bg-pink-100",
    triggerOptions: [
      { name: "New Post", description: "Trigger when a new post is published" },
      { name: "New Follower", description: "Trigger when you get a new follower" },
    ]
  },
  "wordpress": {
    id: "wordpress",
    name: "WordPress",
    description: "Connect to WordPress",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    actionOptions: [
      { name: "Create Post", description: "Create a new WordPress post" },
      { name: "Create Page", description: "Create a new WordPress page" },
      { name: "Update Post", description: "Update an existing post" },
    ]
  },
  "events": {
    id: "events",
    name: "Events",
    description: "Connect to event services",
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-100",
    triggerOptions: [
      { name: "New Event", description: "Trigger when a new event is created" },
      { name: "Event Registration", description: "Trigger when someone registers for an event" },
    ]
  },
  "notification": {
    id: "notification",
    name: "Notification",
    description: "Send notifications",
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    actionOptions: [
      { name: "Send Email", description: "Send an email notification" },
      { name: "Send SMS", description: "Send an SMS notification" },
      { name: "Send Push Notification", description: "Send a push notification" },
    ]
  }
};

export const TRIGGER_APPS: AppId[] = Object.keys(APPS)
  .filter(appId => !!APPS[appId as AppId].triggerOptions?.length)
  .map(appId => appId as AppId);

export const ACTION_APPS: AppId[] = Object.keys(APPS)
  .filter(appId => !!APPS[appId as AppId].actionOptions?.length)
  .map(appId => appId as AppId);

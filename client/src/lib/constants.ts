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
  | "text-processor"
  | "linkedin"
  | "microsoft"
  | "discord"
  | "teams"
  | "stripe"
  | "google-forms"
  | "facebook-ads"
  | "mailchimp"
  | "hubspot"
  | "trello"
  | "google-ads"
  | "zoom"
  | "youtube"
  | "notion"
  | "scheduler";

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
  "scheduler": {
    id: "scheduler",
    name: "Time Scheduler",
    description: "Schedule automations to run at specific times",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    triggerOptions: [
      { name: "One-time Schedule", description: "Run once at a specific date and time" },
      { name: "Daily Schedule", description: "Run every day at a specific time" },
      { name: "Weekly Schedule", description: "Run on specific days of the week" },
      { name: "Monthly Schedule", description: "Run on specific days of the month" },
      { name: "Timer", description: "Run at regular intervals (minutes, hours)" }
    ]
  },
  "linkedin": {
    id: "linkedin",
    name: "LinkedIn",
    description: "Connect to your LinkedIn account",
    iconColor: "text-blue-700",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "New Connection", description: "Trigger when you receive a new connection" },
      { name: "New Message", description: "Trigger when you receive a new message" },
      { name: "Job Application", description: "Trigger when someone applies to your job posting" }
    ],
    actionOptions: [
      { name: "Post Update", description: "Post an update to your LinkedIn profile" },
      { name: "Send Message", description: "Send a message to a connection" },
      { name: "Create Job Posting", description: "Create a new job posting" }
    ]
  },
  "microsoft": {
    id: "microsoft",
    name: "Microsoft",
    description: "Connect to Microsoft services",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    actionOptions: [
      { name: "Create OneDrive File", description: "Create a file in OneDrive" },
      { name: "Create Outlook Event", description: "Create an event in Outlook calendar" },
      { name: "Send Outlook Email", description: "Send an email through Outlook" }
    ]
  },
  "discord": {
    id: "discord",
    name: "Discord",
    description: "Connect to Discord servers",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    triggerOptions: [
      { name: "New Message", description: "Trigger when a new message is posted" },
      { name: "User Joined", description: "Trigger when a user joins the server" }
    ],
    actionOptions: [
      { name: "Send Message", description: "Send a message to a channel" },
      { name: "Create Channel", description: "Create a new channel" },
      { name: "Add Role to User", description: "Add a role to a user" }
    ]
  },
  "teams": {
    id: "teams",
    name: "Microsoft Teams",
    description: "Connect to Microsoft Teams",
    iconColor: "text-purple-600", 
    bgColor: "bg-purple-100",
    triggerOptions: [
      { name: "New Channel Message", description: "Trigger when a new message is posted in a channel" },
      { name: "New Meeting", description: "Trigger when a new meeting is scheduled" }
    ],
    actionOptions: [
      { name: "Send Message", description: "Send a message to a channel" },
      { name: "Create Meeting", description: "Schedule a new meeting" },
      { name: "Create Channel", description: "Create a new channel" }
    ]
  },
  "stripe": {
    id: "stripe",
    name: "Stripe",
    description: "Connect to Stripe for payment processing",
    iconColor: "text-blue-700",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "New Payment", description: "Trigger when a new payment is received" },
      { name: "New Subscription", description: "Trigger when a new subscription is created" },
      { name: "Failed Payment", description: "Trigger when a payment fails" }
    ],
    actionOptions: [
      { name: "Create Customer", description: "Create a new customer in Stripe" },
      { name: "Create Invoice", description: "Create a new invoice" },
      { name: "Create Payment Link", description: "Generate a payment link" }
    ]
  },
  "google-forms": {
    id: "google-forms",
    name: "Google Forms",
    description: "Connect to Google Forms",
    iconColor: "text-purple-700",
    bgColor: "bg-purple-100",
    triggerOptions: [
      { name: "New Form Response", description: "Trigger when a new form response is submitted" }
    ],
    actionOptions: [
      { name: "Create Form", description: "Create a new Google Form" },
      { name: "Add Question", description: "Add a question to a form" }
    ]
  },
  "facebook-ads": {
    id: "facebook-ads",
    name: "Facebook Ads",
    description: "Connect to Facebook Ads Manager",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "Campaign Performance Update", description: "Trigger when campaign performance changes significantly" },
      { name: "Ad Rejected", description: "Trigger when an ad is rejected" }
    ],
    actionOptions: [
      { name: "Create Ad", description: "Create a new Facebook ad" },
      { name: "Update Campaign Budget", description: "Update a campaign's budget" },
      { name: "Pause Campaign", description: "Pause an active campaign" }
    ]
  },
  "mailchimp": {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Connect to Mailchimp email marketing",
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-100",
    triggerOptions: [
      { name: "New Subscriber", description: "Trigger when someone subscribes to a list" },
      { name: "Email Opened", description: "Trigger when an email is opened" },
      { name: "Link Clicked", description: "Trigger when a link in an email is clicked" }
    ],
    actionOptions: [
      { name: "Add Subscriber", description: "Add a new subscriber to a list" },
      { name: "Create Campaign", description: "Create a new email campaign" },
      { name: "Send Campaign", description: "Send an existing campaign" }
    ]
  },
  "hubspot": {
    id: "hubspot",
    name: "HubSpot",
    description: "Connect to HubSpot CRM",
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100",
    triggerOptions: [
      { name: "New Contact", description: "Trigger when a new contact is created" },
      { name: "Deal Stage Change", description: "Trigger when a deal changes stage" },
      { name: "Form Submission", description: "Trigger when a form is submitted" }
    ],
    actionOptions: [
      { name: "Create Contact", description: "Create a new contact" },
      { name: "Create Deal", description: "Create a new deal" },
      { name: "Create Task", description: "Create a new task" }
    ]
  },
  "trello": {
    id: "trello",
    name: "Trello",
    description: "Connect to Trello project management",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "New Card", description: "Trigger when a new card is created" },
      { name: "Card Moved", description: "Trigger when a card is moved to a different list" },
      { name: "Due Date Approaching", description: "Trigger when a card's due date is approaching" }
    ],
    actionOptions: [
      { name: "Create Card", description: "Create a new card" },
      { name: "Add Comment", description: "Add a comment to a card" },
      { name: "Move Card", description: "Move a card to a different list" }
    ]
  },
  "google-ads": {
    id: "google-ads",
    name: "Google Ads",
    description: "Connect to Google Ads",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "Budget Threshold Reached", description: "Trigger when campaign budget reaches a threshold" },
      { name: "Performance Change", description: "Trigger when ad performance changes significantly" }
    ],
    actionOptions: [
      { name: "Create Campaign", description: "Create a new ad campaign" },
      { name: "Update Bid", description: "Update bid amount for keywords" },
      { name: "Pause Campaign", description: "Pause an active campaign" }
    ]
  },
  "zoom": {
    id: "zoom",
    name: "Zoom",
    description: "Connect to Zoom meetings",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "Meeting Started", description: "Trigger when a meeting starts" },
      { name: "Meeting Ended", description: "Trigger when a meeting ends" },
      { name: "New Registration", description: "Trigger when someone registers for a meeting" }
    ],
    actionOptions: [
      { name: "Create Meeting", description: "Schedule a new Zoom meeting" },
      { name: "Update Meeting", description: "Update an existing meeting" },
      { name: "Send Invitation", description: "Send a meeting invitation" }
    ]
  },
  "youtube": {
    id: "youtube",
    name: "YouTube",
    description: "Connect to YouTube",
    iconColor: "text-red-600",
    bgColor: "bg-red-100",
    triggerOptions: [
      { name: "New Video", description: "Trigger when a new video is uploaded" },
      { name: "New Comment", description: "Trigger when a new comment is posted" },
      { name: "Subscriber Milestone", description: "Trigger when subscriber count reaches a milestone" }
    ],
    actionOptions: [
      { name: "Upload Video", description: "Upload a new video" },
      { name: "Update Description", description: "Update a video's description" },
      { name: "Add to Playlist", description: "Add a video to a playlist" }
    ]
  },
  "notion": {
    id: "notion",
    name: "Notion",
    description: "Connect to Notion workspaces",
    iconColor: "text-gray-800",
    bgColor: "bg-gray-100",
    triggerOptions: [
      { name: "Page Updated", description: "Trigger when a page is updated" },
      { name: "New Database Item", description: "Trigger when a new item is added to a database" }
    ],
    actionOptions: [
      { name: "Create Page", description: "Create a new page" },
      { name: "Update Page", description: "Update an existing page" },
      { name: "Add Database Item", description: "Add an item to a database" }
    ]
  },
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
      { name: "New Thread", description: "Trigger when a new email thread is created" }
    ],
    actionOptions: [
      { name: "Send Email", description: "Send an email" },
      { name: "Create Draft", description: "Create a draft email" },
      { name: "Add Label", description: "Add a label to an email" }
    ]
  },
  "slack": {
    id: "slack",
    name: "Slack",
    description: "Connect to your Slack workspace",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100",
    triggerOptions: [
      { name: "New Message", description: "Trigger when a new message is posted" },
      { name: "Message Containing", description: "Trigger when a message contains specific text" },
      { name: "Channel Created", description: "Trigger when a new channel is created" }
    ],
    actionOptions: [
      { name: "Send Message", description: "Send a message to a channel" },
      { name: "Create Channel", description: "Create a new channel" },
      { name: "Send Direct Message", description: "Send a direct message to a user" }
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
      { name: "New Follower", description: "Trigger when someone follows you" }
    ],
    actionOptions: [
      { name: "Post Tweet", description: "Post a new tweet" },
      { name: "Send Direct Message", description: "Send a direct message" },
      { name: "Like Tweet", description: "Like a tweet" }
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
      { name: "Specific Field Submitted", description: "Trigger when a specific field is submitted" }
    ],
    actionOptions: [
      { name: "Create Form", description: "Create a new form" },
      { name: "Update Form", description: "Update an existing form" }
    ]
  },
  "google-sheets": {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Connect to Google Sheets",
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    triggerOptions: [
      { name: "New Row", description: "Trigger when a new row is added" },
      { name: "Updated Row", description: "Trigger when a row is updated" }
    ],
    actionOptions: [
      { name: "Add Row", description: "Add a row to a sheet" },
      { name: "Update Row", description: "Update a row in a sheet" },
      { name: "Get Row", description: "Get a row from a sheet" }
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
      { name: "Deal Stage Changed", description: "Trigger when a deal changes stage" }
    ],
    actionOptions: [
      { name: "Create Lead", description: "Create a new lead" },
      { name: "Update Contact", description: "Update a contact" },
      { name: "Create Task", description: "Create a new task" }
    ]
  },
  "google-drive": {
    id: "google-drive",
    name: "Google Drive",
    description: "Connect to Google Drive",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "New File", description: "Trigger when a new file is created" },
      { name: "Updated File", description: "Trigger when a file is updated" }
    ],
    actionOptions: [
      { name: "Upload File", description: "Upload a file to Google Drive" },
      { name: "Create Folder", description: "Create a new folder" },
      { name: "Copy File", description: "Copy a file to another location" }
    ]
  },
  "google-calendar": {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Connect to Google Calendar",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    triggerOptions: [
      { name: "New Event", description: "Trigger when a new event is created" },
      { name: "Event Starting", description: "Trigger when an event is about to start" }
    ],
    actionOptions: [
      { name: "Create Event", description: "Create a new calendar event" },
      { name: "Update Event", description: "Update an existing event" },
      { name: "Delete Event", description: "Delete a calendar event" }
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
      { name: "New Follower", description: "Trigger when you get a new follower" }
    ],
    actionOptions: [
      { name: "Create Post", description: "Create a new post" },
      { name: "Post Story", description: "Post a new story" },
      { name: "Send DM", description: "Send a direct message" }
    ]
  },
  "wordpress": {
    id: "wordpress",
    name: "WordPress",
    description: "Connect to WordPress",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    triggerOptions: [
      { name: "New Post", description: "Trigger when a new post is published" },
      { name: "New Comment", description: "Trigger when a new comment is posted" }
    ],
    actionOptions: [
      { name: "Create Post", description: "Create a new WordPress post" },
      { name: "Create Page", description: "Create a new WordPress page" },
      { name: "Update Post", description: "Update an existing post" }
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
      { name: "Event Registration", description: "Trigger when someone registers for an event" }
    ],
    actionOptions: [
      { name: "Create Event", description: "Create a new event" },
      { name: "Update Event", description: "Update an existing event" },
      { name: "Send Invitations", description: "Send invitations for an event" }
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
      { name: "Send Push Notification", description: "Send a push notification" }
    ]
  }
};

export const TRIGGER_APPS: AppId[] = Object.keys(APPS)
  .filter(appId => !!APPS[appId as AppId].triggerOptions?.length)
  .map(appId => appId as AppId);

export const ACTION_APPS: AppId[] = Object.keys(APPS)
  .filter(appId => !!APPS[appId as AppId].actionOptions?.length)
  .map(appId => appId as AppId);
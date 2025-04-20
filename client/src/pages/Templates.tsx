import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  SiLinkedin, 
  SiInstagram, 
  SiMailchimp, 
  SiGoogle, 
  SiSlack, 
  SiNotion
} from "react-icons/si";
import { 
  ArrowRight, 
  GitBranch, 
  Star, 
  Calendar, 
  MessageSquare, 
  Clock, 
  Users, 
  FileText, 
  Zap, 
  Sparkles, 
  BrainCircuit, 
  Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Template types
type TemplateCategory = "social" | "productivity" | "communication" | "data" | "all";

interface Template {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  icon: JSX.Element;
  difficulty: "beginner" | "intermediate" | "advanced";
  popularity: number; // 1-10 scale
  steps: {
    from: string;
    to: string;
    description: string;
  }[];
  tags: string[];
}

const Templates = () => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("all");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest("POST", `/api/automations/from-template/${templateId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({
        title: "Template created!",
        description: "Your new automation has been created from the template.",
      });
      navigate(`/builder/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUseTemplate = (templateId: string) => {
    createFromTemplateMutation.mutate(templateId);
  };

  // Template data
  const templates: Template[] = [
    {
      id: "linkedin-ai-post",
      title: "LinkedIn AI Post Generator",
      description: "Automatically create engaging LinkedIn posts using AI, then publish them to your LinkedIn profile.",
      category: "social",
      icon: <SiLinkedin className="h-10 w-10 text-[#0077B5]" />,
      difficulty: "beginner",
      popularity: 9,
      steps: [
        {
          from: "AI Generator",
          to: "LinkedIn",
          description: "Generate professional content with OpenAI, then post directly to LinkedIn."
        }
      ],
      tags: ["social media", "content generation", "ai", "linkedin"]
    },
    {
      id: "instagram-visual-post",
      title: "Instagram AI Content Creator",
      description: "Generate images with AI and create engaging captions, then post directly to Instagram.",
      category: "social",
      icon: <SiInstagram className="h-10 w-10 text-[#E1306C]" />,
      difficulty: "intermediate",
      popularity: 8,
      steps: [
        {
          from: "AI Image Generator",
          to: "Instagram",
          description: "Create images with AI, write captions, and schedule posts to Instagram."
        }
      ],
      tags: ["instagram", "social media", "image generation", "scheduling"]
    },
    {
      id: "teams-meeting-summarizer",
      title: "Teams Meeting Summarizer",
      description: "Automatically create and share meeting summaries from Microsoft Teams calls.",
      category: "communication",
      icon: <MessageSquare className="h-10 w-10 text-[#6264A7]" />,
      difficulty: "intermediate",
      popularity: 7,
      steps: [
        {
          from: "Microsoft Teams",
          to: "AI Summary",
          description: "Extract meeting transcripts from Teams and generate concise summaries with AI."
        }
      ],
      tags: ["microsoft teams", "meetings", "transcription", "summaries"]
    },
    {
      id: "mailchimp-newsletter",
      title: "AI Newsletter Generator",
      description: "Create and send personalized newsletters through Mailchimp using AI-generated content.",
      category: "communication",
      icon: <SiMailchimp className="h-10 w-10 text-[#FFE01B]" />,
      difficulty: "intermediate",
      popularity: 8,
      steps: [
        {
          from: "Content Sources",
          to: "Mailchimp",
          description: "Gather content from various sources, format with AI, and distribute through Mailchimp."
        }
      ],
      tags: ["email marketing", "newsletters", "content generation", "mailchimp"]
    },
    {
      id: "google-docs-summary",
      title: "Google Docs AI Summarizer",
      description: "Automatically summarize long Google Docs documents and create executive summaries.",
      category: "productivity",
      icon: <SiGoogle className="h-10 w-10 text-[#4285F4]" />,
      difficulty: "beginner",
      popularity: 7,
      steps: [
        {
          from: "Google Docs",
          to: "AI Summary",
          description: "Extract content from Google Docs and create concise summaries with AI."
        }
      ],
      tags: ["google docs", "summarization", "productivity", "ai"]
    },
    {
      id: "slack-daily-updates",
      title: "Slack Daily Status Updates",
      description: "Automatically collect team updates and post daily summaries to Slack channels.",
      category: "communication",
      icon: <SiSlack className="h-10 w-10 text-[#4A154B]" />,
      difficulty: "beginner",
      popularity: 9,
      steps: [
        {
          from: "Task Trackers",
          to: "Slack",
          description: "Gather updates from project management tools and post daily summaries to Slack."
        }
      ],
      tags: ["slack", "team communication", "daily updates", "project management"]
    },
    {
      id: "notion-research-assistant",
      title: "Notion Research Assistant",
      description: "Automatically research topics and organize findings in Notion databases.",
      category: "productivity",
      icon: <SiNotion className="h-10 w-10 text-black dark:text-white" />,
      difficulty: "advanced",
      popularity: 6,
      steps: [
        {
          from: "Web Research",
          to: "Notion",
          description: "Research topics with AI, organize findings, and save to structured Notion databases."
        }
      ],
      tags: ["notion", "research", "knowledge management", "ai"]
    },
    {
      id: "content-scheduler",
      title: "Multi-Platform Content Scheduler",
      description: "Create content once and schedule it across multiple social media platforms.",
      category: "social",
      icon: <Calendar className="h-10 w-10 text-indigo-500" />,
      difficulty: "intermediate",
      popularity: 9,
      steps: [
        {
          from: "Content Creation",
          to: "Multiple Platforms",
          description: "Create content once and distribute to LinkedIn, Twitter, Instagram and Facebook."
        }
      ],
      tags: ["social media", "scheduling", "content distribution", "multi-platform"]
    },
    {
      id: "ai-customer-service",
      title: "AI Customer Service Assistant",
      description: "AI-powered responses to common customer inquiries across multiple channels.",
      category: "communication",
      icon: <MessageSquare className="h-10 w-10 text-green-500" />,
      difficulty: "advanced",
      popularity: 7,
      steps: [
        {
          from: "Customer Inquiries",
          to: "AI Responses",
          description: "Process customer questions with AI and provide helpful, personalized responses."
        }
      ],
      tags: ["customer service", "ai", "chat automation", "support"]
    },
    {
      id: "scheduled-reporting",
      title: "Automated Weekly Reports",
      description: "Generate and distribute professional reports on a weekly schedule.",
      category: "data",
      icon: <FileText className="h-10 w-10 text-blue-500" />,
      difficulty: "intermediate",
      popularity: 8,
      steps: [
        {
          from: "Data Sources",
          to: "Reports",
          description: "Collect data from multiple sources, generate reports, and distribute automatically."
        }
      ],
      tags: ["reporting", "data analysis", "scheduling", "automation"]
    },
    {
      id: "lead-generation",
      title: "Intelligent Lead Generator",
      description: "Automatically identify and qualify sales leads from multiple sources.",
      category: "data",
      icon: <Users className="h-10 w-10 text-purple-500" />,
      difficulty: "advanced",
      popularity: 8,
      steps: [
        {
          from: "Lead Sources",
          to: "CRM",
          description: "Identify potential leads, qualify with AI, and add to your CRM system."
        }
      ],
      tags: ["sales", "leads", "crm", "ai qualification"]
    },
    {
      id: "time-tracker",
      title: "Automated Time Tracking",
      description: "Track time spent on projects and generate detailed reports automatically.",
      category: "productivity",
      icon: <Clock className="h-10 w-10 text-orange-500" />,
      difficulty: "beginner",
      popularity: 7,
      steps: [
        {
          from: "Activity Tracking",
          to: "Reports",
          description: "Automatically track time spent on applications and generate detailed reports."
        }
      ],
      tags: ["time tracking", "productivity", "reporting", "work analysis"]
    },
  ];

  const filteredTemplates = activeCategory === "all" 
    ? templates 
    : templates.filter(template => template.category === activeCategory);

  return (
    <div className="container py-8 mx-auto">
      <div className="mb-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Automation Templates</h1>
        <p className="text-muted-foreground max-w-2xl">
          Choose from our pre-built templates to quickly create powerful automations for your workflows.
          Each template can be customized to fit your specific needs.
        </p>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value as TemplateCategory)}
        className="mb-8"
      >
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="all" className="px-4">All</TabsTrigger>
            <TabsTrigger value="social" className="px-4">Social</TabsTrigger>
            <TabsTrigger value="productivity" className="px-4">Productivity</TabsTrigger>
            <TabsTrigger value="communication" className="px-4">Communication</TabsTrigger>
            <TabsTrigger value="data" className="px-4">Data</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeCategory} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden group border-muted-foreground/20 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-4 relative">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      {template.icon}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {template.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {template.popularity}/10
                      </Badge>
                    </div>
                  </div>
                  <CardTitle>{template.title}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex flex-col items-center gap-3">
                      {template.steps.map((step, index) => (
                        <div key={index} className="w-full">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400">
                              <Zap className="h-3.5 w-3.5" />
                            </div>
                            <span>{step.from}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <span>{step.to}</span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground pl-8">
                            {step.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1.5 mb-3 w-full">
                    {template.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-900/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={createFromTemplateMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {createFromTemplateMutation.isPending ? (
                      <span className="flex items-center">
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Use Template <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-8 rounded-xl border border-blue-100 dark:border-blue-900">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-full">
            <BrainCircuit className="h-12 w-12 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Looking for something specific?</h3>
            <p className="text-muted-foreground mb-4">
              We can help you create custom automations tailored to your unique workflow needs.
              Our AI can suggest personalized templates based on your description.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate('/automations')}>
                Create Custom Workflow
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/assistant')}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Get AI Suggestions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Templates;
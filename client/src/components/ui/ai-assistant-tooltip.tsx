import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Bot, Send, PanelRightOpen, Maximize, Minimize, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useLLMServices } from "@/hooks/use-llm-services";
import { Input } from "@/components/ui/input";
import { useAIAssistant } from "@/contexts/AIAssistantContext";
import { useToast } from "@/hooks/use-toast";

interface AIAssistantTooltipProps {
  contextId: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
  children?: React.ReactNode;
}

interface AIAssistantResponse {
  text: string;
  context: string;
  suggestions?: string[];
}

// This interface is specifically for API responses to ensure proper typing
interface AIAssistantAPIResponse extends Record<string, any> {
  text: string;
  context: string;
  suggestions?: string[];
}

const characterStates = {
  idle: {
    animation: {
      y: [0, -5, 0],
      transition: {
        y: {
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      },
    },
    expression: "😊",
  },
  thinking: {
    animation: {
      rotate: [0, 10, -10, 10, 0],
      transition: {
        rotate: {
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      },
    },
    expression: "🤔",
  },
  excited: {
    animation: {
      scale: [1, 1.1, 1],
      transition: {
        scale: {
          duration: 0.5,
          repeat: 3,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      },
    },
    expression: "🎉",
  },
  confused: {
    animation: {
      x: [0, 5, -5, 5, 0],
      transition: {
        x: {
          duration: 0.5,
          repeat: 2,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      },
    },
    expression: "😕",
  },
};

export function AIAssistantTooltip({
  contextId,
  position = "bottom-right",
  className,
  children,
}: AIAssistantTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [response, setResponse] = useState<AIAssistantResponse | null>(null);
  const [characterState, setCharacterState] = useState<keyof typeof characterStates>("idle");
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [showingWorkflowSuggestions, setShowingWorkflowSuggestions] = useState(false);
  const [workflowSuggestions, setWorkflowSuggestions] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { generateTextOpenAI, loading } = useLLMServices();
  const { 
    askQuestion, 
    getWorkflowSuggestions, 
    getPersonalizedSuggestions,
    generatePersonalizedSuggestions 
  } = useAIAssistant();
  const { toast } = useToast();

  const positionClasses = {
    "bottom-right": "bottom-20 right-6",
    "bottom-left": "bottom-20 left-6",
    "top-right": "top-20 right-6",
    "top-left": "top-20 left-6",
  };

  useEffect(() => {
    if (isOpen && !response) {
      fetchAssistantResponse();
    }
  }, [isOpen, contextId]);

  const fetchAssistantResponse = async () => {
    setCharacterState("thinking");
    
    try {
      // First try to get context-specific help from our API
      try {
        const response = await fetch(`/api/assistant/help?contextId=${contextId}`);
        const result = await response.json();
        
        if (result && typeof result === 'object' && 'context' in result) {
          setResponse({
            text: result.text || "",
            context: result.context || contextId,
            suggestions: result.suggestions || []
          });
          setCharacterState("excited");
        }
      } catch (apiError) {
        console.log("API error, falling back to OpenAI:", apiError);
        
        // Fallback to OpenAI for generic help based on contextId
        const prompt = `You are a helpful AI assistant for a workflow automation tool called BRNOUT. 
        The user is currently in the "${contextId}" section of the app. 
        Provide a brief (2-3 sentences), friendly tip or explanation about this section. 
        Also suggest 2-3 quick actions they might want to take.`;
        
        const result = await generateTextOpenAI(prompt, { temperature: 0.7 });
        
        // Parse the response into text and suggestions
        const lines = result.text.split('\n').filter(line => line.trim() !== '');
        const text = lines.filter(line => !line.includes('•') && !line.includes('-')).join(' ');
        const suggestions = lines.filter(line => line.includes('•') || line.includes('-'))
          .map(line => line.replace(/^[•-]\s*/, '').trim());
        
        setResponse({
          text,
          context: contextId,
          suggestions
        });
        setCharacterState("idle");
      }
    } catch (error) {
      console.error("Error fetching assistant response:", error);
      setResponse({
        text: "I'm having trouble connecting right now. Please try again later!",
        context: contextId,
      });
      setCharacterState("confused");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Handle specific suggestion actions
    if (suggestion.toLowerCase().includes('workflow') || 
        suggestion.toLowerCase().includes('automation')) {
      fetchWorkflowSuggestions();
    } else {
      // Set the suggestion as a question and ask it
      setQuestion(suggestion);
      handleAskQuestion(suggestion);
    }
  };
  
  const handleAskQuestion = async (questionText: string = question) => {
    if (!questionText.trim()) return;
    
    setIsAsking(true);
    setCharacterState("thinking");
    setAnswer(null);
    
    try {
      const result = await askQuestion(questionText);
      setAnswer(result);
      setCharacterState("excited");
    } catch (error) {
      console.error("Error asking question:", error);
      setAnswer("I encountered an error processing your question. Please try again later.");
      setCharacterState("confused");
    } finally {
      setIsAsking(false);
      setQuestion("");
    }
  };
  
  const fetchWorkflowSuggestions = async (category?: string) => {
    setShowingWorkflowSuggestions(true);
    setCharacterState("thinking");
    
    try {
      const suggestions = await getWorkflowSuggestions(category);
      setWorkflowSuggestions(suggestions);
      setCharacterState("excited");
    } catch (error) {
      console.error("Error fetching workflow suggestions:", error);
      setWorkflowSuggestions([]);
      setCharacterState("confused");
    }
  };
  
  const handleCreateWorkflow = async (suggestion: any) => {
    try {
      setIsCreatingWorkflow(true);
      setCharacterState("thinking");
      
      const response = await apiRequest("POST", "/api/assistant/create-workflow", {
        name: suggestion.name,
        description: suggestion.description,
        triggerAppId: suggestion.triggerAppId || "schedule",
        actionAppId: suggestion.actionAppId || "openai",
        tags: suggestion.tags || []
      });
      
      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }
      
      const workflow = await response.json();
      
      toast({
        title: "Workflow Created",
        description: `"${suggestion.name}" was successfully created!`,
        variant: "default",
      });
      
      setCharacterState("excited");
      setTimeout(() => {
        resetAssistant();
        setIsOpen(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast({
        title: "Creation Failed",
        description: `Could not create "${suggestion.name}". Please try again.`,
        variant: "destructive",
      });
      setCharacterState("confused");
    } finally {
      setIsCreatingWorkflow(false);
    }
  };
  
  const resetAssistant = () => {
    setAnswer(null);
    setShowingWorkflowSuggestions(false);
    setWorkflowSuggestions([]);
  };

  const toggleTooltip = () => {
    if (isOpen) {
      setIsOpen(false);
      // Reset to default state after closing
      setTimeout(() => {
        setCharacterState("idle");
        resetAssistant();
      }, 500);
    } else {
      setIsOpen(true);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAskQuestion();
    }
  };

  const currentState = characterStates[characterState];

  return (
    <>
      {children}
      <div className={cn("fixed z-50", positionClasses[position], className)}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className={cn(
                "bg-card text-card-foreground border rounded-xl shadow-lg p-4 mb-3 transition-all duration-300",
                isExpanded ? "w-96 md:w-[500px] h-[400px] overflow-y-auto" : "w-80"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-sm flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Assistant
                </h4>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? 
                      <Minimize className="h-3.5 w-3.5" /> : 
                      <Maximize className="h-3.5 w-3.5" />
                    }
                    <span className="sr-only">{isExpanded ? "Collapse" : "Expand"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={toggleTooltip}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
              
              {loading || isAsking || isCreatingWorkflow ? (
                <div className="text-sm text-center py-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {isCreatingWorkflow ? "Creating workflow..." : isAsking ? "Finding answer..." : "Thinking..."}
                  </p>
                </div>
              ) : showingWorkflowSuggestions ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">Workflow Suggestions</h5>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={resetAssistant}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {workflowSuggestions.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {workflowSuggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="rounded-md border p-3 text-xs relative hover:border-primary transition-colors group cursor-pointer"
                          onClick={() => handleCreateWorkflow(suggestion)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium pr-6">{suggestion.name}</div>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full",
                              suggestion.difficulty === "beginner" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              suggestion.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            )}>
                              {suggestion.difficulty}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1 leading-relaxed">{suggestion.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-wrap gap-1">
                              {suggestion.tags.map((tag: string, tagIndex: number) => (
                                <span key={tagIndex} className="bg-muted text-[10px] px-1.5 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateWorkflow(suggestion);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          </div>
                          <div className="absolute top-0 right-0 bottom-0 left-0 bg-primary hover:bg-opacity-5 opacity-0 group-hover:opacity-100 transition-opacity rounded pointer-events-none"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No workflow suggestions available.</p>
                  )}
                </div>
              ) : answer ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">Answer</h5>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={resetAssistant}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    {answer.split('\n').map((line, i) => {
                      // Format code blocks
                      if (line.trim().startsWith('```') && line.trim().length > 3) {
                        const language = line.trim().substring(3);
                        return (
                          <div key={i} className="mt-2 font-mono text-xs">
                            <div className="bg-muted text-muted-foreground px-2 py-1 rounded-t-md text-[10px]">
                              {language}
                            </div>
                          </div>
                        );
                      } else if (line.trim() === '```') {
                        return null; // Skip the closing code block markers
                      } else if (line.startsWith('> ')) {
                        // Format blockquotes
                        return (
                          <blockquote key={i} className="border-l-2 border-muted pl-4 text-muted-foreground italic">
                            {line.substring(2)}
                          </blockquote>
                        );
                      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                        // Format list items
                        return (
                          <div key={i} className="flex space-x-2">
                            <span>•</span>
                            <p>{line.trim().substring(2)}</p>
                          </div>
                        );
                      } else if (line.trim() === '') {
                        // Add spacing for empty lines
                        return <div key={i} className="h-2"></div>;
                      } else {
                        // Regular text
                        return <p key={i}>{line}</p>;
                      }
                    })}
                  </div>
                </div>
              ) : response ? (
                <div className="space-y-3">
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    {response.text.split('\n').map((line, i) => 
                      line.trim() === '' ? 
                        <div key={i} className="h-2"></div> : 
                        <p key={i}>{line}</p>
                    )}
                  </div>
                  
                  {response.suggestions && response.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {response.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t mt-3">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        className="text-xs h-8"
                      />
                      <Button 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleAskQuestion()}
                        disabled={!question.trim()}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs text-muted-foreground mt-1 h-auto p-0"
                      onClick={() => fetchWorkflowSuggestions()}
                    >
                      <PanelRightOpen className="h-3 w-3 mr-1" />
                      Show workflow suggestions
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={currentState.animation}
          onClick={toggleTooltip}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg cursor-pointer"
        >
          <div className="relative">
            <Bot className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 text-xs">
              {currentState.expression}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
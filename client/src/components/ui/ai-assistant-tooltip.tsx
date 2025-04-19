import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useLLMServices } from "@/hooks/use-llm-services";

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
  const { generateTextOpenAI, loading } = useLLMServices();

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
    // Here we would handle suggestion actions
    console.log("Suggestion clicked:", suggestion);
    // Future implementation: trigger actions based on suggestion content
  };

  const toggleTooltip = () => {
    if (isOpen) {
      setIsOpen(false);
      // Reset to default state after closing
      setTimeout(() => {
        setCharacterState("idle");
      }, 500);
    } else {
      setIsOpen(true);
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
              className="bg-card text-card-foreground border rounded-xl shadow-lg p-4 mb-3 w-80"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-sm flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Assistant
                </h4>
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
              
              {loading ? (
                <div className="text-sm text-center py-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                  </div>
                  <p className="mt-2 text-muted-foreground">Thinking...</p>
                </div>
              ) : response ? (
                <div className="space-y-3">
                  <p className="text-sm">{response.text}</p>
                  
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
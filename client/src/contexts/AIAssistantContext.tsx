import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface WorkflowSuggestion {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface AIAssistantContextType {
  currentContext: string;
  contextData: Record<string, any>;
  updateContext: (contextId: string, data?: any) => void;
  assistantEnabled: boolean;
  toggleAssistant: () => void;
  askQuestion: (question: string) => Promise<string>;
  getWorkflowSuggestions: (category?: string) => Promise<WorkflowSuggestion[]>;
  showAssistant: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

// Map routes to context IDs
const routeToContextMap: Record<string, string> = {
  '/': 'dashboard',
  '/automations': 'automations-list',
  '/automations/new': 'automation-editor',
  '/automations/edit': 'automation-editor',
  '/analytics': 'analytics',
  '/connections': 'connections',
  '/ai-services': 'ai-services',
  '/settings': 'settings',
};

export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();
  const [currentContext, setCurrentContext] = useState<string>('dashboard');
  const [contextData, setContextData] = useState<Record<string, any>>({});
  const [assistantEnabled, setAssistantEnabled] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Update context based on route changes
  useEffect(() => {
    // Get the base path (e.g., /automations/123 -> /automations)
    const basePath = '/' + location.split('/').slice(1, 2).join('/');
    
    // Find matching context or default to current path
    const newContext = routeToContextMap[location] || 
                     routeToContextMap[basePath] || 
                     'unknown';
    
    setCurrentContext(newContext);
  }, [location]);

  const updateContext = (contextId: string, data?: any) => {
    setCurrentContext(contextId);
    if (data) {
      setContextData(prev => ({
        ...prev,
        [contextId]: {
          ...(prev[contextId] || {}),
          ...data
        }
      }));
    }
  };

  const toggleAssistant = () => {
    setAssistantEnabled(prev => !prev);
    // Store preference in localStorage
    localStorage.setItem('assistantEnabled', (!assistantEnabled).toString());
  };

  // Load assistant preference from localStorage on mount
  useEffect(() => {
    const storedPreference = localStorage.getItem('assistantEnabled');
    if (storedPreference !== null) {
      setAssistantEnabled(storedPreference === 'true');
    }
  }, []);

  // Ask a question to the AI assistant
  const askQuestion = async (question: string): Promise<string> => {
    try {
      const response = await fetch('/api/assistant/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context: currentContext,
          contextData: contextData[currentContext] || {}
        }),
      });
      
      const data = await response.json();
      return data.answer || "I'm sorry, I couldn't find an answer to that question.";
    } catch (error) {
      console.error('Error asking assistant question:', error);
      return "Sorry, I encountered an error while processing your question.";
    }
  };
  
  // Get workflow suggestions based on category
  const getWorkflowSuggestions = async (category?: string): Promise<WorkflowSuggestion[]> => {
    try {
      const url = category 
        ? `/api/assistant/workflow-suggestions?category=${encodeURIComponent(category)}` 
        : '/api/assistant/workflow-suggestions';
        
      const response = await fetch(url);
      const data = await response.json();
      
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting workflow suggestions:', error);
      return [];
    }
  };
  
  // Show the AI assistant and optionally set a specific context
  const showAssistant = () => {
    setIsVisible(true);
    
    // Find the assistant component and dispatch an event if needed
    const assistantElement = document.getElementById('ai-assistant');
    if (assistantElement) {
      // Create a custom event to notify the assistant component
      const event = new CustomEvent('show-assistant', { 
        detail: { context: currentContext }
      });
      assistantElement.dispatchEvent(event);
    }
  };

  return (
    <AIAssistantContext.Provider
      value={{
        currentContext,
        contextData,
        updateContext,
        assistantEnabled,
        toggleAssistant,
        askQuestion,
        getWorkflowSuggestions,
        showAssistant
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  
  return context;
};
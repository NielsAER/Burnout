import { Automation } from "@shared/schema";

interface BuilderStep {
  id: string;
  type: string;
  appId: string;
  config: Record<string, any>;
  name?: string;
  description?: string;
}

/**
 * Calculates the complexity score of an automation workflow
 * Complexity is based on:
 * - Number of actions (more actions = more complex)
 * - Presence of conditional logic
 * - Number of configuration parameters
 * - Use of advanced features like AI services
 * - Data transformation steps
 * 
 * @param automation The automation data
 * @returns A complexity score (1-10)
 */
export function calculateWorkflowComplexity(automation: Partial<Automation>): number {
  let complexityScore = 1; // Base score
  
  // Array of actions (from new schema format)
  const actions = automation.actions as BuilderStep[] || [];
  
  // Check trigger configuration complexity
  if (automation.triggerConfig) {
    const triggerConfig = automation.triggerConfig as Record<string, any>;
    
    // More configured parameters = more complexity
    const configParams = Object.keys(triggerConfig).length;
    complexityScore += Math.min(configParams / 2, 1); // Max +1 for trigger params
    
    // Check for advanced trigger options (schedule, filters, etc)
    if (triggerConfig.frequency || triggerConfig.filters || triggerConfig.conditions) {
      complexityScore += 1;
    }
  }
  
  // Each action adds to complexity
  complexityScore += Math.min(actions.length, 3); // Max +3 for number of actions
  
  // Analyze each action for complexity
  for (const action of actions) {
    if (!action.config) continue;
    
    // AI service actions are more complex
    if (['openai', 'anthropic', 'perplexity', 'ollama'].includes(action.appId)) {
      complexityScore += 1;
      
      // Custom prompts with variables add complexity
      if (action.config.aiPrompt?.prompt && 
          (action.config.aiPrompt.prompt.includes('{{') || 
           action.config.aiPrompt.prompt.includes('${'))) {
        complexityScore += 1;
      }
    }
    
    // Data transformation steps
    if (action.appId === 'transform' || 
        action.config.transformation || 
        action.config.dataMapping) {
      complexityScore += 1;
    }
    
    // Conditional logic
    if (action.config.conditions && Array.isArray(action.config.conditions) && 
        action.config.conditions.length > 0) {
      complexityScore += 1;
      
      // Multiple conditions add more complexity
      if (action.config.conditions.length > 1) {
        complexityScore += 0.5;
      }
    }
    
    // Error handling
    if (action.config.errorHandling || action.config.retryOnFailure) {
      complexityScore += 0.5;
    }
  }
  
  // Cap the score at 10
  return Math.min(Math.round(complexityScore), 10);
}

/**
 * Checks if an automation has conditional logic
 * 
 * @param automation The automation data
 * @returns The number of conditions found
 */
export function countWorkflowConditions(automation: Partial<Automation>): number {
  let conditionCount = 0;
  
  // Array of actions
  const actions = automation.actions as BuilderStep[] || [];
  
  // Check trigger conditions
  if (automation.triggerConfig) {
    const triggerConfig = automation.triggerConfig as Record<string, any>;
    if (triggerConfig.conditions && Array.isArray(triggerConfig.conditions)) {
      conditionCount += triggerConfig.conditions.length;
    }
    if (triggerConfig.filters && Array.isArray(triggerConfig.filters)) {
      conditionCount += triggerConfig.filters.length;
    }
  }
  
  // Check each action for conditions
  for (const action of actions) {
    if (!action.config) continue;
    
    if (action.config.conditions && Array.isArray(action.config.conditions)) {
      conditionCount += action.config.conditions.length;
    }
    
    if (action.config.filters && Array.isArray(action.config.filters)) {
      conditionCount += action.config.filters.length;
    }
    
    // Check for conditional branches
    if (action.config.branches && Array.isArray(action.config.branches)) {
      conditionCount += action.config.branches.length;
    }
  }
  
  return conditionCount;
}
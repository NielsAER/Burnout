/**
 * Complexity Calculator Utility
 * 
 * This utility calculates the complexity of a workflow automation based on various factors:
 * - Number of trigger conditions
 * - Number of action steps
 * - Configuration complexity
 * - Data transformations
 * - Conditional logic
 * - Error handling
 */

// Types for calculator
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface AutomationConfig {
  triggerConfig?: Json;
  actionConfig?: Json;
  actions?: Json;
  [key: string]: any;
}

/**
 * Calculate the complexity score of an automation workflow
 * 
 * @param automation The automation configuration to analyze
 * @returns A complexity score from 1-10, with 1 being simplest and 10 being most complex
 */
export function calculateWorkflowComplexity(automation: AutomationConfig): number {
  if (!automation) return 1;

  let complexityScore = 1; // Base score

  // Check trigger complexity
  const triggerComplexity = calculateTriggerComplexity(automation.triggerConfig);
  complexityScore += triggerComplexity;

  // Check action complexity
  const actionComplexity = calculateActionComplexity(automation.actionConfig, automation.actions);
  complexityScore += actionComplexity;

  // Check for advanced features
  const advancedFeaturesScore = calculateAdvancedFeaturesScore(automation);
  complexityScore += advancedFeaturesScore;

  // Cap the score at 10 for sanity
  return Math.min(10, Math.max(1, Math.round(complexityScore)));
}

/**
 * Calculate trigger complexity based on configuration
 */
function calculateTriggerComplexity(triggerConfig?: Json): number {
  if (!triggerConfig) return 0;
  
  let score = 0;

  // Convert to object for easier handling if it's a string
  const config = typeof triggerConfig === 'string' 
    ? safelyParseJson(triggerConfig) 
    : triggerConfig;

  // Check for schedule-based triggers (more complex)
  if (hasScheduleConfig(config)) {
    score += 1;
  }

  // Check for webhook or API-based triggers (more complex)
  if (hasWebhookConfig(config)) {
    score += 1.5;
  }
  
  // Check for complex filtering conditions
  if (hasFilterConditions(config)) {
    score += 0.5;
    
    // Add more if there are multiple filter conditions
    const filterCount = countFilterConditions(config);
    if (filterCount > 2) {
      score += Math.min(1.5, filterCount * 0.3); // Cap at 1.5 additional points
    }
  }

  return score;
}

/**
 * Calculate action complexity based on configuration
 */
function calculateActionComplexity(actionConfig?: Json, actions?: Json): number {
  if (!actionConfig && !actions) return 0;
  
  let score = 0;
  
  // Convert to object for easier handling
  const config = typeof actionConfig === 'string' 
    ? safelyParseJson(actionConfig) 
    : actionConfig;
    
  const actionsArray = getActionsArray(actions);
  
  // Multiple actions increase complexity
  if (actionsArray && actionsArray.length > 1) {
    score += 0.5; // Base score for multiple actions
    score += Math.min(2, (actionsArray.length - 1) * 0.5); // Additional score based on count
  }
  
  // Check for data transformation
  if (hasDataTransformation(config) || actionsArray?.some(action => hasDataTransformation(action))) {
    score += 1;
  }
  
  // Check for conditional logic
  if (hasConditionalLogic(config) || actionsArray?.some(action => hasConditionalLogic(action))) {
    score += 1.5;
  }
  
  // Check for error handling
  if (hasErrorHandling(config) || actionsArray?.some(action => hasErrorHandling(action))) {
    score += 1;
  }
  
  // Check for API integrations
  if (hasApiIntegration(config) || actionsArray?.some(action => hasApiIntegration(action))) {
    score += 1;
  }
  
  return score;
}

/**
 * Calculate additional score for advanced features
 */
function calculateAdvancedFeaturesScore(automation: AutomationConfig): number {
  let score = 0;
  
  // Check if using AI services
  if (usesAiServices(automation)) {
    score += 1.5;
  }
  
  // Check for multi-step data processing
  if (hasMultiStepDataProcessing(automation)) {
    score += 1;
  }
  
  // Check for authentication/OAuth usage
  if (requiresAuthentication(automation)) {
    score += 0.5;
  }
  
  return score;
}

// Helper functions

function safelyParseJson(jsonString: any): any {
  if (typeof jsonString !== 'string') return jsonString;
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return {};
  }
}

function getActionsArray(actions: Json | undefined): any[] {
  if (!actions) return [];
  
  // If it's already an array, return it
  if (Array.isArray(actions)) return actions;
  
  // If it's a string, try to parse it
  if (typeof actions === 'string') {
    try {
      const parsed = JSON.parse(actions);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [];
    }
  }
  
  // If it's an object, wrap it in an array
  if (typeof actions === 'object' && actions !== null) {
    return [actions];
  }
  
  return [];
}

// Feature detection functions

function hasScheduleConfig(config: any): boolean {
  if (!config) return false;
  
  // Check for schedule, cron, interval, or time-related keywords
  return (
    hasProperty(config, 'schedule') ||
    hasProperty(config, 'cron') ||
    hasProperty(config, 'interval') ||
    hasProperty(config, 'time') ||
    hasProperty(config, 'frequency')
  );
}

function hasWebhookConfig(config: any): boolean {
  if (!config) return false;
  
  // Check for webhook, callback, or endpoint keywords
  return (
    hasProperty(config, 'webhook') ||
    hasProperty(config, 'endpoint') ||
    hasProperty(config, 'callback') ||
    hasProperty(config, 'url') ||
    (typeof config === 'object' && config !== null && 'method' in config && 'url' in config)
  );
}

function hasFilterConditions(config: any): boolean {
  if (!config) return false;
  
  // Check for filter, condition, or criteria keywords
  return (
    hasProperty(config, 'filter') ||
    hasProperty(config, 'filters') ||
    hasProperty(config, 'condition') ||
    hasProperty(config, 'conditions') ||
    hasProperty(config, 'criteria') ||
    hasProperty(config, 'rules')
  );
}

function countFilterConditions(config: any): number {
  if (!config) return 0;
  
  // Try to find array of conditions
  const possibleConditionArrays = [
    getPropertyValue(config, 'filters'),
    getPropertyValue(config, 'conditions'),
    getPropertyValue(config, 'criteria'),
    getPropertyValue(config, 'rules')
  ];
  
  // Find the first non-null array
  const conditionArray = possibleConditionArrays.find(arr => Array.isArray(arr));
  
  // Return the length if found, otherwise default to detecting single condition
  return conditionArray ? conditionArray.length : (hasFilterConditions(config) ? 1 : 0);
}

function hasDataTransformation(config: any): boolean {
  if (!config) return false;
  
  // Check for transform, map, format, or template keywords
  return (
    hasProperty(config, 'transform') ||
    hasProperty(config, 'transformation') ||
    hasProperty(config, 'mapping') ||
    hasProperty(config, 'map') ||
    hasProperty(config, 'format') ||
    hasProperty(config, 'template') ||
    hasProperty(config, 'formatter')
  );
}

function hasConditionalLogic(config: any): boolean {
  if (!config) return false;
  
  // Check for if, condition, when, case keywords
  return (
    hasProperty(config, 'if') ||
    hasProperty(config, 'condition') ||
    hasProperty(config, 'when') ||
    hasProperty(config, 'case') ||
    hasProperty(config, 'switch') ||
    hasProperty(config, 'branch')
  );
}

function hasErrorHandling(config: any): boolean {
  if (!config) return false;
  
  // Check for error, exception, fallback, retry keywords
  return (
    hasProperty(config, 'error') ||
    hasProperty(config, 'errorHandling') ||
    hasProperty(config, 'exception') ||
    hasProperty(config, 'fallback') ||
    hasProperty(config, 'retry') ||
    hasProperty(config, 'recovery')
  );
}

function hasApiIntegration(config: any): boolean {
  if (!config) return false;
  
  // Check for api, endpoint, request, http keywords
  return (
    hasProperty(config, 'api') ||
    hasProperty(config, 'endpoint') ||
    hasProperty(config, 'request') ||
    hasProperty(config, 'http') ||
    hasProperty(config, 'url') ||
    hasProperty(config, 'method')
  );
}

function usesAiServices(automation: AutomationConfig): boolean {
  // Check if any service is related to AI/ML
  const aiServiceIdentifiers = [
    'openai', 'anthropic', 'claude', 'gpt', 'perplexity', 'ollama', 'huggingface',
    'ai', 'ml', 'analyzesentiment', 'llm', 'text-generation', 'language-model'
  ];
  
  // Check in all possible configuration objects
  return (
    checkForAnyMatch(automation.triggerAppId, aiServiceIdentifiers) ||
    checkForAnyMatch(automation.actionAppId, aiServiceIdentifiers) ||
    checkConfigForAiServices(automation.triggerConfig, aiServiceIdentifiers) ||
    checkConfigForAiServices(automation.actionConfig, aiServiceIdentifiers) ||
    checkActionsForAiServices(automation.actions, aiServiceIdentifiers)
  );
}

function hasMultiStepDataProcessing(automation: AutomationConfig): boolean {
  // Check if there are multiple sequential operations on data
  const actions = getActionsArray(automation.actions);
  
  // If multiple actions, consider it multi-step
  if (actions.length > 2) {
    return true;
  }
  
  // Also check if there's data transformation followed by another operation
  if (actions.length > 1 && actions.some(action => hasDataTransformation(action))) {
    return true;
  }
  
  return false;
}

function requiresAuthentication(automation: AutomationConfig): boolean {
  // Check if OAuth or authentication is needed
  const authIdentifiers = [
    'auth', 'oauth', 'token', 'credentials', 'apiKey', 'secret', 'password',
    'authenticate', 'authorization', 'bearer'
  ];
  
  // Check in all possible configuration objects
  return (
    checkConfigForAuthServices(automation.triggerConfig, authIdentifiers) ||
    checkConfigForAuthServices(automation.actionConfig, authIdentifiers) ||
    checkActionsForAuthServices(automation.actions, authIdentifiers)
  );
}

/**
 * Count the number of filter conditions in a workflow configuration
 * This is used for achievement unlocking logic
 */
export function countWorkflowConditions(automation: AutomationConfig): number {
  if (!automation) return 0;
  
  let conditionCount = 0;
  
  // Check trigger config for conditions
  if (automation.triggerConfig) {
    const config = typeof automation.triggerConfig === 'string' 
      ? safelyParseJson(automation.triggerConfig) 
      : automation.triggerConfig;
    
    conditionCount += countFilterConditions(config);
  }
  
  // Check action config for conditions
  if (automation.actionConfig) {
    const config = typeof automation.actionConfig === 'string' 
      ? safelyParseJson(automation.actionConfig) 
      : automation.actionConfig;
    
    conditionCount += hasConditionalLogic(config) ? 1 : 0;
  }
  
  // Check individual actions for conditions
  if (automation.actions) {
    const actionsArray = getActionsArray(automation.actions);
    
    for (const action of actionsArray) {
      conditionCount += hasConditionalLogic(action) ? 1 : 0;
      conditionCount += hasFilterConditions(action) ? countFilterConditions(action) : 0;
    }
  }
  
  return conditionCount;
}

// Utility functions

function hasProperty(obj: any, property: string): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // Check direct property
  if (property in obj) return true;
  
  // Check nested properties one level deep
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && property in obj[key]) {
      return true;
    }
  }
  
  return false;
}

function getPropertyValue(obj: any, property: string): any {
  if (!obj || typeof obj !== 'object') return null;
  
  // Check direct property
  if (property in obj) return obj[property];
  
  // Check nested properties one level deep
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && property in obj[key]) {
      return obj[key][property];
    }
  }
  
  return null;
}

function checkForAnyMatch(value: any, identifiers: string[]): boolean {
  if (!value) return false;
  
  const stringValue = String(value).toLowerCase();
  return identifiers.some(id => stringValue.includes(id.toLowerCase()));
}

function checkConfigForAiServices(config: Json | undefined, identifiers: string[]): boolean {
  if (!config) return false;
  
  // Convert to string for easy searching
  const configStr = JSON.stringify(config).toLowerCase();
  return identifiers.some(id => configStr.includes(id.toLowerCase()));
}

function checkActionsForAiServices(actions: Json | undefined, identifiers: string[]): boolean {
  if (!actions) return false;
  
  const actionsArray = getActionsArray(actions);
  return actionsArray.some(action => {
    const actionStr = JSON.stringify(action).toLowerCase();
    return identifiers.some(id => actionStr.includes(id.toLowerCase()));
  });
}

function checkConfigForAuthServices(config: Json | undefined, identifiers: string[]): boolean {
  if (!config) return false;
  
  // Convert to string for easy searching
  const configStr = JSON.stringify(config).toLowerCase();
  return identifiers.some(id => configStr.includes(id.toLowerCase()));
}

function checkActionsForAuthServices(actions: Json | undefined, identifiers: string[]): boolean {
  if (!actions) return false;
  
  const actionsArray = getActionsArray(actions);
  return actionsArray.some(action => {
    const actionStr = JSON.stringify(action).toLowerCase();
    return identifiers.some(id => actionStr.includes(id.toLowerCase()));
  });
}
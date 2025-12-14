// Terminal Library Index - Export all modules

// Types
export * from './types';

// Store
export { 
  terminalStore, 
  DEFAULT_THEMES, 
  DEFAULT_TERMINAL_SETTINGS, 
  DEFAULT_SECURITY_SETTINGS 
} from './store';

// Security
export {
  filterPaste,
  maskSensitiveInfo,
  typingDetector,
  autoLockManager,
  generateWatermark,
  renderWatermarkCanvas,
  validateCommand,
} from './security';

// AI Analyzer
export {
  analyzeCommand,
  generateLogSummary,
} from './ai-analyzer';

// Automation
export {
  executeMacro,
  substituteVariables,
  extractVariables,
  executeBroadcast,
  aggregateBroadcastResults,
  parseSchedule,
  PRESET_MACROS,
} from './automation';

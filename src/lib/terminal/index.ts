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
  simulateDryRun,
  isDangerousCommand,
  requiresConfirmation,
} from './security';

export type { DryRunResult } from './security';

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

// Theme Manager (Phase 2)
export {
  themeManager,
  BUILT_IN_THEMES,
  THEME_PRESETS,
} from './theme-manager';

// Keyboard Shortcuts (Phase 2)
export {
  keyboardShortcutsManager,
  DEFAULT_SHORTCUTS,
  eventToShortcutString,
  matchesShortcut,
  useKeyboardShortcut,
} from './keyboard-shortcuts';

export type { KeyboardShortcut } from './keyboard-shortcuts';

// Terminal Enhancement System - Type Definitions

// ============================================
// Session Types
// ============================================

export interface TerminalTab {
  id: string;
  serverId: string;
  serverName: string;
  hostname: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isRecording: boolean;
  startedAt: Date;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SessionGroup {
  id: string;
  name: string;
  description?: string;
  serverIds: string[];
  color: string;
  icon: string;
  createdAt: Date;
}

export interface TerminalSplit {
  id: string;
  direction: 'horizontal' | 'vertical';
  ratio: number; // 0-100 for left/top panel percentage
  panels: [TerminalPanel, TerminalPanel];
}

export interface TerminalPanel {
  type: 'terminal' | 'split';
  tabId?: string;
  split?: TerminalSplit;
}

// ============================================
// Settings Types
// ============================================

export interface TerminalTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  bellStyle: 'none' | 'visual' | 'sound';
  theme: string;
  autoScroll: boolean;
  wordWrap: boolean;
}

// ============================================
// Command Types
// ============================================

export interface CommandFavorite {
  id: string;
  userId: string;
  command: string;
  description?: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommandTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface CommandHistoryItem {
  id: string;
  sessionId: string;
  serverId: string;
  command: string;
  output?: string;
  riskScore: number;
  blocked: boolean;
  executedAt: Date;
  duration?: number;
  tags: string[];
  comment?: string;
}

// ============================================
// Multi-Server Types
// ============================================

export interface BroadcastCommand {
  id: string;
  command: string;
  targetServers: string[];
  excludedServers: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: BroadcastResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface BroadcastResult {
  serverId: string;
  serverName: string;
  status: 'success' | 'failed' | 'skipped' | 'timeout';
  output?: string;
  error?: string;
  duration: number;
}

export interface ServerFilter {
  environments: ('PROD' | 'STAGE' | 'DEV')[];
  tags: string[];
  status: ('online' | 'offline' | 'maintenance')[];
  search: string;
}

// ============================================
// Security Types
// ============================================

export interface SecuritySettings {
  pasteFilterEnabled: boolean;
  typingSpeedDetection: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number; // seconds
  watermarkEnabled: boolean;
  readOnlyMode: boolean;
}

export interface PasteFilterResult {
  allowed: boolean;
  originalText: string;
  filteredText?: string;
  blockedPatterns: string[];
  riskScore: number;
}

export interface TypingPattern {
  avgSpeed: number;
  variance: number;
  isAnomaly: boolean;
  confidence: number;
}

// ============================================
// Collaboration Types
// ============================================

export interface SessionShare {
  id: string;
  sessionId: string;
  ownerId: string;
  sharedWith: SharedUser[];
  isPublic: boolean;
  permissions: SharePermission[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface SharedUser {
  userId: string;
  userName: string;
  permission: SharePermission;
  joinedAt: Date;
  isActive: boolean;
}

export type SharePermission = 'view' | 'interact' | 'control';

export interface SessionComment {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  replyTo?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system' | 'command';
}

// ============================================
// Automation Types
// ============================================

export interface Macro {
  id: string;
  userId: string;
  name: string;
  description?: string;
  steps: MacroStep[];
  variables: MacroVariable[];
  conditions: MacroCondition[];
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MacroStep {
  id: string;
  type: 'command' | 'wait' | 'condition' | 'prompt';
  command?: string;
  waitTime?: number;
  condition?: MacroCondition;
  prompt?: string;
  onSuccess?: string;
  onFailure?: string;
}

export interface MacroVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  defaultValue?: string;
  options?: string[];
  required: boolean;
  description?: string;
}

export interface MacroCondition {
  type: 'output_contains' | 'output_matches' | 'exit_code' | 'always';
  pattern?: string;
  value?: string | number;
}

export interface ScheduledTask {
  id: string;
  macroId: string;
  targetServers: string[];
  schedule: string; // cron expression
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
}

// ============================================
// AI Types
// ============================================

export interface AICommandAnalysis {
  command: string;
  explanation: string;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  alternatives: AlternativeCommand[];
  corrections: CommandCorrection[];
  estimatedDuration?: string;
}

export interface AlternativeCommand {
  command: string;
  description: string;
  riskScore: number;
  reason: string;
}

export interface CommandCorrection {
  type: 'typo' | 'option' | 'syntax' | 'path';
  original: string;
  corrected: string;
  confidence: number;
}

export interface LogSummary {
  sessionId: string;
  summary: string;
  keyActions: string[];
  warnings: string[];
  errors: string[];
  duration: string;
  commandCount: number;
}

// ============================================
// Audit Types
// ============================================

export interface CommandTimeline {
  sessionId: string;
  entries: TimelineEntry[];
  serverChanges: ServerChange[];
}

export interface TimelineEntry {
  id: string;
  type: 'command' | 'output' | 'error' | 'warning' | 'system';
  content: string;
  timestamp: Date;
  riskScore?: number;
  metadata?: Record<string, any>;
}

export interface ServerChange {
  id: string;
  type: 'file' | 'config' | 'service' | 'user' | 'permission';
  path: string;
  action: 'create' | 'modify' | 'delete';
  diff?: string;
  timestamp: Date;
  commandId: string;
}

export interface UserActivityAnalysis {
  userId: string;
  period: 'day' | 'week' | 'month';
  sessionCount: number;
  commandCount: number;
  avgSessionDuration: number;
  topCommands: { command: string; count: number }[];
  topServers: { serverId: string; name: string; count: number }[];
  riskEvents: number;
  blockedCommands: number;
}

export interface AuditReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: { start: Date; end: Date };
  summary: {
    totalSessions: number;
    totalCommands: number;
    blockedCommands: number;
    securityAlerts: number;
    uniqueUsers: number;
    uniqueServers: number;
  };
  topRiskUsers: { userId: string; name: string; riskEvents: number }[];
  topRiskServers: { serverId: string; name: string; riskEvents: number }[];
  generatedAt: Date;
}

// ============================================
// Connection Types
// ============================================

export interface ConnectionStatus {
  sessionId: string;
  status: 'connected' | 'reconnecting' | 'disconnected';
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  bandwidth?: number;
  lastPingAt: Date;
  reconnectAttempts: number;
}

export interface ResourceUsage {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  timestamp: Date;
}

// ============================================
// Role Types
// ============================================

export type TerminalRole = 'viewer' | 'operator' | 'admin' | 'auditor' | 'ai_bot';

export interface RolePermissions {
  role: TerminalRole;
  canExecute: boolean;
  canPaste: boolean;
  canAccessProd: boolean;
  canAccessDangerous: boolean;
  canViewRecordings: boolean;
  canExportLogs: boolean;
  canBroadcast: boolean;
  canShareSession: boolean;
  canInterrupt: boolean;
  readOnly: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<TerminalRole, RolePermissions> = {
  viewer: {
    role: 'viewer',
    canExecute: false,
    canPaste: false,
    canAccessProd: false,
    canAccessDangerous: false,
    canViewRecordings: false,
    canExportLogs: false,
    canBroadcast: false,
    canShareSession: false,
    canInterrupt: false,
    readOnly: true,
  },
  operator: {
    role: 'operator',
    canExecute: true,
    canPaste: true,
    canAccessProd: false,
    canAccessDangerous: false,
    canViewRecordings: false,
    canExportLogs: false,
    canBroadcast: false,
    canShareSession: false,
    canInterrupt: false,
    readOnly: false,
  },
  admin: {
    role: 'admin',
    canExecute: true,
    canPaste: true,
    canAccessProd: true,
    canAccessDangerous: true,
    canViewRecordings: true,
    canExportLogs: true,
    canBroadcast: true,
    canShareSession: true,
    canInterrupt: true,
    readOnly: false,
  },
  auditor: {
    role: 'auditor',
    canExecute: false,
    canPaste: false,
    canAccessProd: true,
    canAccessDangerous: false,
    canViewRecordings: true,
    canExportLogs: true,
    canBroadcast: false,
    canShareSession: false,
    canInterrupt: false,
    readOnly: true,
  },
  ai_bot: {
    role: 'ai_bot',
    canExecute: true,
    canPaste: true,
    canAccessProd: true,
    canAccessDangerous: false,
    canViewRecordings: true,
    canExportLogs: true,
    canBroadcast: true,
    canShareSession: false,
    canInterrupt: false,
    readOnly: false,
  },
};

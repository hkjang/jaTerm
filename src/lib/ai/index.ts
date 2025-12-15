// Core AI Components
export { CommandAnalyzer, commandAnalyzer } from './command-analyzer';
export type { RiskAnalysis } from './command-analyzer';

export { AnomalyDetector, anomalyDetector } from './anomaly-detector';
export type { AnomalyResult } from './anomaly-detector';

// AI Provider System
export { AIProviderAdapter } from './ai-provider-adapter';
export { AIProviderManager, aiProviderManager } from './ai-provider-manager';
export { OllamaConnector, VLLMConnector } from './connectors';

// AI Control Layer
export { PromptGateway, promptGateway } from './prompt-gateway';
export { AIPolicyEngine, aiPolicyEngine } from './ai-policy-engine';
export { AIAuditLogger, aiAuditLogger } from './ai-audit-logger';

// Terminal AI Service
export { TerminalAIService, terminalAIService } from './terminal-ai-service';

// Crypto Utils
export { encryptApiKey, decryptApiKey, hashPrompt, maskSensitiveData } from './crypto';

// Types
export type {
  AIProviderType,
  AIFeature,
  AIMessage,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig,
  ConnectionTestResult,
  AIModelInfo,
  RiskAnalysisResult,
  CommandExplanation,
  CommandGeneration,
  SessionSummary,
  AIAuditData,
  RateLimitResult,
  PolicyCheckResult,
} from './types';

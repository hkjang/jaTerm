/**
 * AI Provider Types and Interfaces
 * OpenAI Compatible API 규격을 기반으로 한 타입 정의
 */

// Provider 타입
export type AIProviderType = 'OLLAMA' | 'VLLM';

// AI 기능 타입
export type AIFeature = 'explain' | 'generate' | 'analyze' | 'summarize';

// OpenAI Compatible Message 형식
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// AI 완성 요청
export interface AICompletionRequest {
  model: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// AI 완성 응답
export interface AICompletionResponse {
  id: string;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | 'null';
}

// Provider 설정
export interface AIProviderConfig {
  id: string;
  name: string;
  type: AIProviderType;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  maxTokens: number;
  streaming: boolean;
}

// 연결 테스트 결과
export interface ConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  availableModels?: string[];
  error?: string;
}

// 모델 정보
export interface AIModelInfo {
  name: string;
  displayName?: string;
  description?: string;
  parameterSize?: string;
  contextLength?: number;
}

// 위험 분석 결과
export interface RiskAnalysisResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categories: string[];
  explanation: string;
  recommendation: 'allow' | 'warn' | 'block';
  alternativeCommands?: string[];
}

// 명령 설명 결과
export interface CommandExplanation {
  command: string;
  summary: string;
  details: string;
  components: Array<{
    part: string;
    explanation: string;
  }>;
  risks: string[];
  alternatives?: string[];
}

// 명령 생성 결과
export interface CommandGeneration {
  description: string;
  command: string;
  explanation: string;
  confidence: number;
  warnings?: string[];
}

// 세션 요약 결과
export interface SessionSummary {
  sessionId: string;
  duration: number;
  commandCount: number;
  summary: string;
  highlights: string[];
  riskyCommands: Array<{
    command: string;
    riskScore: number;
  }>;
  recommendations?: string[];
}

// AI 호출 로그용 데이터
export interface AIAuditData {
  userId: string;
  providerId?: string;
  providerName?: string;
  modelName?: string;
  feature: AIFeature;
  promptHash: string;
  promptLength: number;
  responseTokens?: number;
  durationMs?: number;
  status: 'success' | 'failed' | 'blocked';
  errorMessage?: string;
  ipAddress?: string;
}

// Rate Limit 결과
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// 정책 검증 결과
export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  rateLimit?: RateLimitResult;
}

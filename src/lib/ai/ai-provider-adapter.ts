/**
 * AI Provider Adapter 추상 클래스
 * OpenAI Compatible API 규격을 기반으로 한 추상화 레이어
 */

import {
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig,
  ConnectionTestResult,
  AIModelInfo,
} from './types';

/**
 * AI Provider 추상 어댑터
 * 모든 Provider (Ollama, vLLM 등)는 이 클래스를 상속
 */
export abstract class AIProviderAdapter {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * AI 완성 요청 (Chat Completion)
   * @param request 완성 요청
   * @returns 완성 응답
   */
  abstract complete(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * 스트리밍 완성 요청
   * @param request 완성 요청
   * @param onChunk 청크 콜백
   */
  abstract completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<AICompletionResponse>;

  /**
   * 연결 테스트
   * @returns 테스트 결과
   */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * 사용 가능한 모델 목록 조회
   * @returns 모델 정보 배열
   */
  abstract listModels(): Promise<AIModelInfo[]>;

  /**
   * Provider 타입 반환
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * Provider 이름 반환
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Base URL 반환
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * 타임아웃 설정 반환
   */
  getTimeout(): number {
    return this.config.timeout;
  }

  /**
   * HTTP 요청 헤더 생성
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * 에러 응답 처리
   */
  protected handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new Error(`[${this.config.name}] ${context}: ${error.message}`);
    }
    throw new Error(`[${this.config.name}] ${context}: Unknown error`);
  }
}

// Provider Factory 함수 타입
export type AIProviderFactory = (config: AIProviderConfig) => AIProviderAdapter;

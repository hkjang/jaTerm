/**
 * AI Provider Manager
 * Provider 생성, 관리, 연결 테스트 등 중앙 관리
 */

import { prisma } from '@/lib/db';
import { AIProviderAdapter } from './ai-provider-adapter';
import { OllamaConnector, VLLMConnector } from './connectors';
import { decryptApiKey } from './crypto';
import {
  AIProviderConfig,
  AIProviderType,
  ConnectionTestResult,
  AICompletionRequest,
  AICompletionResponse,
} from './types';

/**
 * Provider Manager - Provider 생성 및 관리
 */
export class AIProviderManager {
  private static instance: AIProviderManager;
  private adapters: Map<string, AIProviderAdapter> = new Map();
  private defaultProviderId: string | null = null;

  private constructor() {}

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  /**
   * Provider 어댑터 생성
   */
  private createAdapter(config: AIProviderConfig): AIProviderAdapter {
    switch (config.type) {
      case 'OLLAMA':
        return new OllamaConnector(config);
      case 'VLLM':
        return new VLLMConnector(config);
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  /**
   * DB에서 Provider 로드하여 어댑터 생성
   */
  async loadProvider(providerId: string): Promise<AIProviderAdapter | null> {
    // 캐시 확인
    if (this.adapters.has(providerId)) {
      return this.adapters.get(providerId)!;
    }

    // DB에서 로드
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.isActive) {
      return null;
    }

    const config: AIProviderConfig = {
      id: provider.id,
      name: provider.name,
      type: provider.type as AIProviderType,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey ? decryptApiKey(provider.apiKey) : undefined,
      timeout: provider.timeout,
      maxTokens: provider.maxTokens,
      streaming: provider.streaming,
    };

    const adapter = this.createAdapter(config);
    this.adapters.set(providerId, adapter);

    if (provider.isDefault) {
      this.defaultProviderId = providerId;
    }

    return adapter;
  }

  /**
   * 기본 Provider 가져오기
   */
  async getDefaultProvider(): Promise<AIProviderAdapter | null> {
    // 캐시된 기본 Provider 있으면 반환
    if (this.defaultProviderId && this.adapters.has(this.defaultProviderId)) {
      return this.adapters.get(this.defaultProviderId)!;
    }

    // DB에서 기본 Provider 찾기
    const defaultProvider = await prisma.aIProvider.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!defaultProvider) {
      // 기본이 없으면 첫 번째 활성 Provider
      const anyActive = await prisma.aIProvider.findFirst({
        where: { isActive: true },
      });
      if (anyActive) {
        return this.loadProvider(anyActive.id);
      }
      return null;
    }

    return this.loadProvider(defaultProvider.id);
  }

  /**
   * Provider 연결 테스트
   */
  async testConnection(providerId: string): Promise<ConnectionTestResult> {
    const adapter = await this.loadProvider(providerId);
    if (!adapter) {
      return {
        success: false,
        error: 'Provider not found or inactive',
      };
    }

    return adapter.testConnection();
  }

  /**
   * 특정 설정으로 연결 테스트 (저장 전 테스트용)
   */
  async testConnectionWithConfig(
    type: AIProviderType,
    baseUrl: string,
    apiKey?: string
  ): Promise<ConnectionTestResult> {
    const config: AIProviderConfig = {
      id: 'test',
      name: 'test',
      type,
      baseUrl,
      apiKey,
      timeout: 10000,
      maxTokens: 4096,
      streaming: false,
    };

    const adapter = this.createAdapter(config);
    return adapter.testConnection();
  }

  /**
   * AI 완성 요청 실행
   */
  async complete(
    request: AICompletionRequest,
    providerId?: string
  ): Promise<AICompletionResponse> {
    const adapter = providerId
      ? await this.loadProvider(providerId)
      : await this.getDefaultProvider();

    if (!adapter) {
      throw new Error('No active AI provider available');
    }

    return adapter.complete(request);
  }

  /**
   * 캐시 초기화 (Provider 설정 변경시 호출)
   */
  clearCache(providerId?: string) {
    if (providerId) {
      this.adapters.delete(providerId);
      if (this.defaultProviderId === providerId) {
        this.defaultProviderId = null;
      }
    } else {
      this.adapters.clear();
      this.defaultProviderId = null;
    }
  }

  /**
   * 모든 활성 Provider 목록
   */
  async getActiveProviders() {
    return prisma.aIProvider.findMany({
      where: { isActive: true },
      include: {
        models: {
          where: { isActive: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }
}

// 싱글톤 인스턴스 export
export const aiProviderManager = AIProviderManager.getInstance();

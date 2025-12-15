/**
 * vLLM Connector
 * vLLM OpenAI Compatible API 연동
 * 
 * vLLM은 OpenAI API 규격을 완전히 준수하므로 /v1/chat/completions 엔드포인트 사용
 */

import { AIProviderAdapter } from '../ai-provider-adapter';
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig,
  ConnectionTestResult,
  AIModelInfo,
} from '../types';

// OpenAI 형식 응답
interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

// 스트리밍 청크
interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * vLLM API Connector (OpenAI Compatible)
 */
export class VLLMConnector extends AIProviderAdapter {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  /**
   * Chat Completion 요청
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || 0.7,
          top_p: request.topP || 0.9,
          frequency_penalty: request.frequencyPenalty || 0,
          presence_penalty: request.presencePenalty || 0,
          stream: false,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`vLLM API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIChatResponse = await response.json();
      const choice = data.choices[0];

      return {
        id: data.id,
        model: data.model,
        content: choice?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: (choice?.finish_reason as 'stop' | 'length') || 'stop',
      };
    } catch (error) {
      this.handleError(error, 'Chat completion failed');
    }
  }

  /**
   * 스트리밍 Chat Completion
   */
  async completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<AICompletionResponse> {
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let modelName = request.model;
    let responseId = '';

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || 0.7,
          stream: true,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`vLLM API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const jsonStr = line.replace('data:', '').trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const data: OpenAIStreamChunk = JSON.parse(jsonStr);
            responseId = data.id;
            modelName = data.model;

            const delta = data.choices[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;
              onChunk(delta.content);
            }
          } catch (e) {
            // JSON 파싱 실패는 무시
          }
        }
      }

      // vLLM 스트리밍에서는 토큰 수를 추정
      completionTokens = Math.ceil(fullContent.length / 4);

      return {
        id: responseId || `vllm-stream-${Date.now()}`,
        model: modelName,
        content: fullContent,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        finishReason: 'stop',
      };
    } catch (error) {
      this.handleError(error, 'Streaming completion failed');
    }
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: OpenAIModelsResponse = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        latencyMs,
        availableModels: data.data?.map(m => m.id) || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * 사용 가능한 모델 목록
   */
  async listModels(): Promise<AIModelInfo[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OpenAIModelsResponse = await response.json();

      return data.data?.map(m => ({
        name: m.id,
        displayName: m.id,
        description: `vLLM model (${m.owned_by})`,
      })) || [];
    } catch (error) {
      console.error('Failed to list vLLM models:', error);
      return [];
    }
  }
}

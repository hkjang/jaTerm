/**
 * Ollama Connector
 * Ollama API를 OpenAI Compatible 인터페이스로 연동
 * 
 * Ollama API 문서: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import { AIProviderAdapter } from '../ai-provider-adapter';
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig,
  ConnectionTestResult,
  AIModelInfo,
} from '../types';

// Ollama 응답 형식
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaModelResponse {
  models: Array<{
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details?: {
      parent_model?: string;
      format?: string;
      family?: string;
      families?: string[];
      parameter_size?: string;
      quantization_level?: string;
    };
  }>;
}

/**
 * Ollama API Connector
 */
export class OllamaConnector extends AIProviderAdapter {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  /**
   * Chat Completion 요청
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: false,
          options: {
            num_predict: request.maxTokens || this.config.maxTokens,
            temperature: request.temperature || 0.7,
            top_p: request.topP || 0.9,
          },
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data: OllamaChatResponse = await response.json();
      const duration = Date.now() - startTime;

      return {
        id: `ollama-${Date.now()}`,
        model: data.model,
        content: data.message?.content || '',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done ? 'stop' : 'length',
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
    const startTime = Date.now();
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;
    
    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
          options: {
            num_predict: request.maxTokens || this.config.maxTokens,
            temperature: request.temperature || 0.7,
          },
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data: OllamaChatResponse = JSON.parse(line);
            if (data.message?.content) {
              fullContent += data.message.content;
              onChunk(data.message.content);
            }
            if (data.prompt_eval_count) promptTokens = data.prompt_eval_count;
            if (data.eval_count) completionTokens = data.eval_count;
          } catch (e) {
            // JSON 파싱 실패는 무시
          }
        }
      }

      return {
        id: `ollama-stream-${Date.now()}`,
        model: request.model,
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
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000), // 5초 타임아웃
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: OllamaModelResponse = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        latencyMs,
        availableModels: data.models?.map(m => m.name) || [],
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
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OllamaModelResponse = await response.json();

      return data.models?.map(m => ({
        name: m.name,
        displayName: m.name,
        description: `${m.details?.family || 'Unknown'} model`,
        parameterSize: m.details?.parameter_size,
      })) || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }
}

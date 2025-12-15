/**
 * AI Provider 연결 테스트 API
 * POST: Provider 연결 테스트
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiProviderManager } from '@/lib/ai/ai-provider-manager';
import { AIProviderType } from '@/lib/ai/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Provider 연결 테스트
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // 저장되지 않은 설정으로 테스트 (새 Provider 생성 전 테스트용)
    const body = await request.json().catch(() => ({}));
    
    if (body.type && body.baseUrl) {
      // 저장 전 테스트
      const result = await aiProviderManager.testConnectionWithConfig(
        body.type as AIProviderType,
        body.baseUrl,
        body.apiKey
      );

      return NextResponse.json({
        success: result.success,
        latencyMs: result.latencyMs,
        availableModels: result.availableModels,
        error: result.error,
      });
    }

    // 저장된 Provider 테스트
    const result = await aiProviderManager.testConnection(id);

    return NextResponse.json({
      success: result.success,
      latencyMs: result.latencyMs,
      availableModels: result.availableModels,
      error: result.error,
    });
  } catch (error) {
    console.error('Failed to test AI provider:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      },
      { status: 500 }
    );
  }
}

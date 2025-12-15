/**
 * AI Provider 관리 API
 * GET: Provider 목록 조회
 * POST: Provider 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encryptApiKey, decryptApiKey } from '@/lib/ai/crypto';
import { aiProviderManager } from '@/lib/ai/ai-provider-manager';

// Provider 목록 조회
export async function GET() {
  try {
    const providers = await prisma.aIProvider.findMany({
      include: {
        models: {
          select: {
            id: true,
            name: true,
            displayName: true,
            isActive: true,
            isDefault: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    // API Key 마스킹 (보안)
    const masked = providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? '***' : null,
      hasApiKey: !!p.apiKey,
    }));

    return NextResponse.json({ providers: masked });
  } catch (error) {
    console.error('Failed to fetch AI providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// Provider 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      baseUrl,
      apiKey,
      timeout = 30000,
      maxTokens = 4096,
      streaming = true,
      isActive = false,
      isDefault = false,
    } = body;

    // 필수 필드 검증
    if (!name || !type || !baseUrl) {
      return NextResponse.json(
        { error: 'name, type, baseUrl are required' },
        { status: 400 }
      );
    }

    // Type 검증
    if (!['OLLAMA', 'VLLM'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be OLLAMA or VLLM' },
        { status: 400 }
      );
    }

    // 중복 이름 체크
    const existing = await prisma.aIProvider.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Provider with this name already exists' },
        { status: 409 }
      );
    }

    // 기본 Provider로 설정시 기존 기본 해제
    if (isDefault) {
      await prisma.aIProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // API Key 암호화
    const encryptedApiKey = apiKey ? encryptApiKey(apiKey) : null;

    const provider = await prisma.aIProvider.create({
      data: {
        name,
        type,
        baseUrl,
        apiKey: encryptedApiKey,
        timeout,
        maxTokens,
        streaming,
        isActive,
        isDefault,
      },
    });

    // 캐시 클리어
    aiProviderManager.clearCache();

    return NextResponse.json({
      provider: {
        ...provider,
        apiKey: provider.apiKey ? '***' : null,
        hasApiKey: !!provider.apiKey,
      },
    });
  } catch (error) {
    console.error('Failed to create AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}

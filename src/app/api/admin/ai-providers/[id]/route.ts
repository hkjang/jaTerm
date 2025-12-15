/**
 * AI Provider 개별 관리 API
 * GET: Provider 상세 조회
 * PUT: Provider 수정
 * DELETE: Provider 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encryptApiKey } from '@/lib/ai/crypto';
import { aiProviderManager } from '@/lib/ai/ai-provider-manager';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Provider 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const provider = await prisma.aIProvider.findUnique({
      where: { id },
      include: {
        models: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      provider: {
        ...provider,
        apiKey: provider.apiKey ? '***' : null,
        hasApiKey: !!provider.apiKey,
      },
    });
  } catch (error) {
    console.error('Failed to fetch AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
}

// Provider 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      baseUrl,
      apiKey,
      timeout,
      maxTokens,
      streaming,
      isActive,
      isDefault,
    } = body;

    // 존재 확인
    const existing = await prisma.aIProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // 기본 Provider로 설정시 기존 기본 해제
    if (isDefault) {
      await prisma.aIProvider.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (timeout !== undefined) updateData.timeout = timeout;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (streaming !== undefined) updateData.streaming = streaming;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    // API Key는 새 값이 있을 때만 업데이트
    if (apiKey && apiKey !== '***') {
      updateData.apiKey = encryptApiKey(apiKey);
    }

    const provider = await prisma.aIProvider.update({
      where: { id },
      data: updateData,
    });

    // 캐시 클리어
    aiProviderManager.clearCache(id);

    return NextResponse.json({
      provider: {
        ...provider,
        apiKey: provider.apiKey ? '***' : null,
        hasApiKey: !!provider.apiKey,
      },
    });
  } catch (error) {
    console.error('Failed to update AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}

// Provider 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 존재 확인
    const existing = await prisma.aIProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    await prisma.aIProvider.delete({
      where: { id },
    });

    // 캐시 클리어
    aiProviderManager.clearCache(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
}

/**
 * AI Model 관리 API
 * GET: Model 목록 조회
 * POST: Model 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Model 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    const where = providerId ? { providerId } : {};

    const models = await prisma.aIModel.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Failed to fetch AI models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// Model 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      name,
      displayName,
      description,
      maxTokens = 4096,
      isActive = true,
      isDefault = false,
    } = body;

    // 필수 필드 검증
    if (!providerId || !name) {
      return NextResponse.json(
        { error: 'providerId and name are required' },
        { status: 400 }
      );
    }

    // Provider 존재 확인
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // 중복 체크
    const existing = await prisma.aIModel.findUnique({
      where: { providerId_name: { providerId, name } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Model with this name already exists for this provider' },
        { status: 409 }
      );
    }

    // 기본 Model로 설정시 기존 기본 해제
    if (isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await prisma.aIModel.create({
      data: {
        providerId,
        name,
        displayName: displayName || name,
        description,
        maxTokens,
        isActive,
        isDefault,
      },
      include: {
        provider: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Failed to create AI model:', error);
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    );
  }
}

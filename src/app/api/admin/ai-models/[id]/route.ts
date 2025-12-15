/**
 * AI Model 개별 관리 API
 * PUT: Model 수정
 * DELETE: Model 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Model 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      displayName,
      description,
      maxTokens,
      isActive,
      isDefault,
    } = body;

    // 존재 확인
    const existing = await prisma.aIModel.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // 기본 Model로 설정시 기존 기본 해제
    if (isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const model = await prisma.aIModel.update({
      where: { id },
      data: updateData,
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
    console.error('Failed to update AI model:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// Model 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 존재 확인
    const existing = await prisma.aIModel.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    await prisma.aIModel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete AI model:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}

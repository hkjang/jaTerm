/**
 * AI Policy 관리 API
 * GET: Policy 목록 조회
 * POST: Policy 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Policy 목록 조회
export async function GET() {
  try {
    const policies = await prisma.aIPolicy.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Failed to fetch AI policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

// Policy 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      allowedFeatures,
      rateLimit = 100,
      promptMaxLength = 2000,
      allowedRoles,
      riskThreshold = 0.7,
      autoBlock = false,
      resultMasking = false,
      timeRestriction,
      isActive = true,
    } = body;

    // 필수 필드 검증
    if (!name || !allowedFeatures || !allowedRoles) {
      return NextResponse.json(
        { error: 'name, allowedFeatures, allowedRoles are required' },
        { status: 400 }
      );
    }

    // 중복 이름 체크
    const existing = await prisma.aIPolicy.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Policy with this name already exists' },
        { status: 409 }
      );
    }

    const policy = await prisma.aIPolicy.create({
      data: {
        name,
        description,
        allowedFeatures: Array.isArray(allowedFeatures) 
          ? JSON.stringify(allowedFeatures) 
          : allowedFeatures,
        rateLimit,
        promptMaxLength,
        allowedRoles: Array.isArray(allowedRoles) 
          ? JSON.stringify(allowedRoles) 
          : allowedRoles,
        riskThreshold,
        autoBlock,
        resultMasking,
        timeRestriction: timeRestriction 
          ? JSON.stringify(timeRestriction) 
          : null,
        isActive,
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Failed to create AI policy:', error);
    return NextResponse.json(
      { error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}

/**
 * AI Prompt Template 관리 API
 * GET: Template 목록 조회
 * POST: Template 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Template 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};

    const templates = await prisma.promptTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch prompt templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Template 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      template,
      variables,
      allowedRoles,
      isActive = true,
    } = body;

    // 필수 필드 검증
    if (!name || !category || !template) {
      return NextResponse.json(
        { error: 'name, category, template are required' },
        { status: 400 }
      );
    }

    // Category 검증
    const validCategories = ['COMMAND_EXPLAIN', 'COMMAND_GENERATE', 'RISK_ANALYSIS', 'LOG_SUMMARY'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // 중복 이름 체크
    const existing = await prisma.promptTemplate.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      );
    }

    const promptTemplate = await prisma.promptTemplate.create({
      data: {
        name,
        category,
        template,
        variables: variables ? JSON.stringify(variables) : null,
        allowedRoles: allowedRoles ? JSON.stringify(allowedRoles) : null,
        isActive,
      },
    });

    return NextResponse.json({ template: promptTemplate });
  } catch (error) {
    console.error('Failed to create prompt template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

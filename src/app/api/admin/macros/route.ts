// Admin Macros API Routes
// Macro template management

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRole } from '@/lib/auth/otp-types';

// Helper to get current admin user
async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const userId = authHeader.replace('Bearer ', '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, name: true },
  });
  
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

// GET: List macros
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const shared = searchParams.get('shared');

    const where: Record<string, unknown> = {};
    if (shared === 'true') {
      where.isShared = true;
    }

    const [macros, total] = await Promise.all([
      prisma.macro.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.macro.count({ where }),
    ]);

    const macrosFormatted = macros.map(macro => ({
      id: macro.id,
      name: macro.name,
      description: macro.description,
      steps: macro.steps ? JSON.parse(macro.steps) : [],
      variables: macro.variables ? JSON.parse(macro.variables) : [],
      isShared: macro.isShared,
      createdBy: macro.userId,
      usageCount: 0, // TODO: track usage
      createdAt: macro.createdAt,
    }));

    return NextResponse.json({
      macros: macrosFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List macros error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create macro
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, steps, variables, isShared } = body;

    if (!name || !steps || steps.length === 0) {
      return NextResponse.json({ error: 'Name and steps are required' }, { status: 400 });
    }

    const macro = await prisma.macro.create({
      data: {
        name,
        description,
        steps: JSON.stringify(steps),
        variables: variables ? JSON.stringify(variables) : null,
        isShared: isShared || false,
        userId: admin.id,
      },
    });

    return NextResponse.json(macro, { status: 201 });
  } catch (error) {
    console.error('Create macro error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete macro
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Macro ID is required' }, { status: 400 });
    }

    await prisma.macro.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete macro error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

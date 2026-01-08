// Admin Command Policies API Routes
// Command policy management (blacklist/whitelist)

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
    select: { id: true, email: true, role: true },
  });
  
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

// GET: List command policies
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';

    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }

    const [policies, total] = await Promise.all([
      prisma.commandPolicy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commandPolicy.count({ where }),
    ]);

    const policiesFormatted = policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      type: policy.type,
      patterns: policy.patterns ? JSON.parse(policy.patterns) : [],
      isRegex: policy.isRegex,
      environment: policy.environment ? JSON.parse(policy.environment) : [],
      roles: policy.roles ? JSON.parse(policy.roles) : [],
      isActive: policy.isActive,
      version: policy.version,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    }));

    return NextResponse.json({
      policies: policiesFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List command policies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create command policy
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, patterns, isRegex, environment, roles } = body;

    if (!name || !patterns || patterns.length === 0) {
      return NextResponse.json({ error: 'Name and patterns are required' }, { status: 400 });
    }

    const policy = await prisma.commandPolicy.create({
      data: {
        name,
        description,
        type: type || 'BLACKLIST',
        patterns: JSON.stringify(patterns),
        isRegex: isRegex || false,
        environment: JSON.stringify(environment || []),
        roles: JSON.stringify(roles || []),
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Create command policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update command policy
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updateFields)) {
      if (['patterns', 'environment', 'roles'].includes(key)) {
        dataToUpdate[key] = JSON.stringify(value);
      } else {
        dataToUpdate[key] = value;
      }
    }

    // Increment version on update
    dataToUpdate.version = { increment: 1 };

    const policy = await prisma.commandPolicy.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Update command policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete command policy
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    await prisma.commandPolicy.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete command policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

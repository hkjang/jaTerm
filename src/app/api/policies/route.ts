import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/policies - List all policies
export async function GET(request: NextRequest) {
  try {
    const policies = await prisma.policy.findMany({
      include: {
        servers: {
          include: { server: true },
        },
        serverGroups: {
          include: { serverGroup: true },
        },
      },
      orderBy: { priority: 'desc' },
    });

    return NextResponse.json(policies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

// POST /api/policies - Create a new policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const policy = await prisma.policy.create({
      data: {
        name: body.name,
        description: body.description,
        priority: body.priority || 0,
        isActive: body.isActive ?? true,
        allowedDays: body.allowedDays ? JSON.stringify(body.allowedDays) : null,
        allowedStartTime: body.allowedStartTime,
        allowedEndTime: body.allowedEndTime,
        allowedRoles: body.allowedRoles ? JSON.stringify(body.allowedRoles) : null,
        commandMode: body.commandMode || 'BLACKLIST',
        commandPatterns: body.commandPatterns ? JSON.stringify(body.commandPatterns) : null,
        requireApproval: body.requireApproval ?? false,
        approverRoles: body.approverRoles ? JSON.stringify(body.approverRoles) : null,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}

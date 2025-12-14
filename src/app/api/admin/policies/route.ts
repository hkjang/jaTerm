// Admin Policies API Routes
// Full CRUD for access policy management

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logCreate, logUpdate, logDelete, getAuditContext } from '@/lib/audit/audit-logger';
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

// GET: List all policies
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const active = searchParams.get('active');

    const where: Record<string, unknown> = {};
    
    if (active !== null) {
      where.isActive = active === 'true';
    }

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        include: {
          servers: {
            include: {
              server: {
                select: { id: true, name: true, hostname: true },
              },
            },
          },
          serverGroups: {
            include: {
              serverGroup: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { priority: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.policy.count({ where }),
    ]);

    const policiesFormatted = policies.map(policy => ({
      ...policy,
      allowedDays: policy.allowedDays ? JSON.parse(policy.allowedDays) : [],
      allowedRoles: policy.allowedRoles ? JSON.parse(policy.allowedRoles) : [],
      commandPatterns: policy.commandPatterns ? JSON.parse(policy.commandPatterns) : [],
      approverRoles: policy.approverRoles ? JSON.parse(policy.approverRoles) : [],
      servers: policy.servers.map(s => s.server),
      serverGroups: policy.serverGroups.map(g => g.serverGroup),
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
    console.error('List policies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new policy
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      priority = 0,
      allowedDays = [],
      allowedStartTime,
      allowedEndTime,
      allowedRoles = [],
      commandMode = 'BLACKLIST',
      commandPatterns = [],
      requireApproval = false,
      approverRoles = [],
      serverIds = [],
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Policy name is required' }, { status: 400 });
    }

    // Create policy
    const policy = await prisma.policy.create({
      data: {
        name,
        description,
        priority,
        allowedDays: JSON.stringify(allowedDays),
        allowedStartTime,
        allowedEndTime,
        allowedRoles: JSON.stringify(allowedRoles),
        commandMode,
        commandPatterns: JSON.stringify(commandPatterns),
        requireApproval,
        approverRoles: JSON.stringify(approverRoles),
        servers: {
          create: serverIds.map((serverId: string) => ({
            serverId,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit log
    const context = getAuditContext(request);
    await logCreate('Policy', policy.id, 
      { name, commandMode, allowedRoles, requireApproval },
      { userId: admin.id, ...context }
    );

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Create policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update policy
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, serverIds, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    // Get current policy for audit
    const currentPolicy = await prisma.policy.findUnique({
      where: { id },
      select: { 
        name: true, 
        commandMode: true, 
        isActive: true,
        allowedRoles: true,
        requireApproval: true,
      },
    });

    if (!currentPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Handle JSON fields
    const dataToUpdate: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updateFields)) {
      if (['allowedDays', 'allowedRoles', 'commandPatterns', 'approverRoles'].includes(key)) {
        dataToUpdate[key] = JSON.stringify(value);
      } else {
        dataToUpdate[key] = value;
      }
    }

    // Update server associations if provided
    if (serverIds) {
      // Delete existing associations
      await prisma.policyServer.deleteMany({ where: { policyId: id } });
      
      // Create new associations
      await prisma.policyServer.createMany({
        data: serverIds.map((serverId: string) => ({
          policyId: id,
          serverId,
        })),
      });
    }

    // Update policy
    const updatedPolicy = await prisma.policy.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    const context = getAuditContext(request);
    await logUpdate('Policy', id, currentPolicy, updateFields, { userId: admin.id, ...context });

    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error('Update policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete policy
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

    // Get policy for audit
    const policy = await prisma.policy.findUnique({
      where: { id },
      select: { name: true, commandMode: true },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Delete policy (cascade will handle related records)
    await prisma.policy.delete({ where: { id } });

    // Audit log
    const context = getAuditContext(request);
    await logDelete('Policy', id, policy, { userId: admin.id, ...context });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin Emergency Access API Routes
// Break glass access management

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAudit, getAuditContext } from '@/lib/audit/audit-logger';
import { isAdminRole } from '@/lib/auth/otp-types';

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const userId = authHeader.replace('Bearer ', '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true },
  });
  
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [accesses, total] = await Promise.all([
      prisma.emergencyAccess.findMany({
        where,
        orderBy: { grantedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emergencyAccess.count({ where }),
    ]);

    // Fetch related data
    const accessesWithInfo = await Promise.all(
      accesses.map(async (access) => {
        const [requester, server, revokedBy] = await Promise.all([
          prisma.user.findUnique({
            where: { id: access.requesterId },
            select: { name: true, email: true, role: true },
          }),
          prisma.server.findUnique({
            where: { id: access.serverId },
            select: { name: true, environment: true },
          }),
          access.revokedById ? prisma.user.findUnique({
            where: { id: access.revokedById },
            select: { name: true },
          }) : null,
        ]);

        return {
          id: access.id,
          requester: {
            name: requester?.name || 'Unknown',
            email: requester?.email || '',
            role: requester?.role || '',
          },
          server: {
            name: server?.name || 'Unknown',
            environment: server?.environment || 'DEV',
          },
          reason: access.reason,
          status: access.status,
          grantedAt: access.grantedAt,
          expiresAt: access.expiresAt,
          revokedAt: access.revokedAt,
          revokedBy: revokedBy?.name || null,
          commandsExecuted: access.commandCount,
        };
      })
    );

    return NextResponse.json({
      accesses: accessesWithInfo,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List emergency access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, serverId, reason, durationMins } = body;

    if (!userId || !serverId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + (durationMins || 60) * 60 * 1000);

    const access = await prisma.emergencyAccess.create({
      data: {
        requesterId: userId,
        serverId,
        reason,
        expiresAt,
      },
    });

    const context = getAuditContext(request);
    await logAudit({
      action: 'EMERGENCY_ACCESS_GRANTED',
      resource: 'EmergencyAccess',
      resourceId: access.id,
      userId: admin.id,
      details: { targetUserId: userId, serverId, reason },
      ...context,
    });

    return NextResponse.json(access, { status: 201 });
  } catch (error) {
    console.error('Create emergency access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== 'revoke') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const access = await prisma.emergencyAccess.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedById: admin.id,
      },
    });

    const context = getAuditContext(request);
    await logAudit({
      action: 'EMERGENCY_ACCESS_REVOKED',
      resource: 'EmergencyAccess',
      resourceId: id,
      userId: admin.id,
      details: { revokedBy: admin.name },
      ...context,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update emergency access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

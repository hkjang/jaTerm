// Admin Alerts API Routes
// Security alerts CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAudit, getAuditContext } from '@/lib/audit/audit-logger';
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

// GET: List security alerts
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const severity = searchParams.get('severity') || '';
    const resolved = searchParams.get('resolved');
    const alertType = searchParams.get('type') || '';

    const where: Record<string, unknown> = {};
    
    if (severity) {
      where.severity = severity;
    }
    
    if (resolved !== null && resolved !== '') {
      where.isResolved = resolved === 'true';
    }
    
    if (alertType) {
      where.alertType = alertType;
    }

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        orderBy: [
          { isResolved: 'asc' },
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.securityAlert.count({ where }),
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Resolve/update alert
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const alert = await prisma.securityAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const context = getAuditContext(request);

    if (action === 'resolve') {
      await prisma.securityAlert.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: admin.id,
        },
      });

      await logAudit({
        action: 'UPDATE',
        resource: 'SecurityAlert',
        resourceId: id,
        userId: admin.id,
        details: { action: 'resolved', alertType: alert.alertType, severity: alert.severity },
        ...context,
      });

      return NextResponse.json({ success: true, action: 'resolved' });
    }

    if (action === 'reopen') {
      await prisma.securityAlert.update({
        where: { id },
        data: {
          isResolved: false,
          resolvedAt: null,
          resolvedBy: null,
        },
      });

      await logAudit({
        action: 'UPDATE',
        resource: 'SecurityAlert',
        resourceId: id,
        userId: admin.id,
        details: { action: 'reopened' },
        ...context,
      });

      return NextResponse.json({ success: true, action: 'reopened' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Update alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete alert (for cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER/ADMIN can delete alerts
    if (admin.role !== 'SUPER' && admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const alert = await prisma.securityAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    await prisma.securityAlert.delete({ where: { id } });

    const context = getAuditContext(request);
    await logAudit({
      action: 'DELETE',
      resource: 'SecurityAlert',
      resourceId: id,
      userId: admin.id,
      details: { alertType: alert.alertType, severity: alert.severity },
      ...context,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin Audit API Routes
// Audit log viewing, export, and retention management

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditContext, verifyAuditIntegrity } from '@/lib/audit/audit-logger';
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

// GET: List audit logs with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action') || '';
    const resource = searchParams.get('resource') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: Record<string, unknown> = {};
    
    if (action) {
      where.action = action;
    }
    
    if (resource) {
      where.resource = resource;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.timestamp as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parse details JSON
    const logsFormatted = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return NextResponse.json({
      logs: logsFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Export audit logs
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, action, resource, format = 'json' } = body;

    const where: Record<string, unknown> = {};
    
    if (action) where.action = action;
    if (resource) where.resource = resource;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.timestamp as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const logsFormatted = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      user: log.user?.email || 'System',
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details ? JSON.parse(log.details) : null,
      ipAddress: log.ipAddress,
    }));

    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address'];
      const rows = logsFormatted.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.resource,
        log.resourceId || '',
        log.ipAddress || '',
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      totalRecords: logs.length,
      logs: logsFormatted,
    });
  } catch (error) {
    console.error('Export audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Verify integrity of audit log
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { logId } = await request.json();

    if (!logId) {
      return NextResponse.json({ error: 'Log ID required' }, { status: 400 });
    }

    const isIntact = await verifyAuditIntegrity(logId);

    return NextResponse.json({
      logId,
      integrity: isIntact ? 'verified' : 'unknown',
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Verify audit integrity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete old audit logs (retention policy)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER admin can delete audit logs
    if (admin.role !== 'SUPER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { retentionDays } = await request.json();

    if (!retentionDays || retentionDays < 30) {
      return NextResponse.json(
        { error: 'Retention period must be at least 30 days' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    // Log this action itself
    const context = getAuditContext(request);
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'DELETE',
        resource: 'AuditLog',
        details: JSON.stringify({
          action: 'retention_cleanup',
          retentionDays,
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
        }),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error('Delete audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

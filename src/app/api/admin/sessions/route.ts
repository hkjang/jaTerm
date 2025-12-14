// Admin Sessions API Routes
// Session monitoring with command blocking and termination

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

// GET: List all sessions
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
    const userId = searchParams.get('userId') || '';

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const [sessions, total] = await Promise.all([
      prisma.terminalSession.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          server: {
            select: { id: true, name: true, hostname: true, environment: true },
          },
          _count: {
            select: { commandLogs: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.terminalSession.count({ where }),
    ]);

    // Get blocked command counts
    const sessionsWithBlocked = await Promise.all(
      sessions.map(async (session) => {
        const blockedCount = await prisma.commandLog.count({
          where: { sessionId: session.id, blocked: true },
        });
        return {
          ...session,
          commandCount: session._count.commandLogs,
          blockedCount,
        };
      })
    );

    return NextResponse.json({
      sessions: sessionsWithBlocked,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update session (block command, add comment, etc.)
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, content } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await prisma.terminalSession.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const context = getAuditContext(request);

    // Handle different actions
    if (action === 'add_comment') {
      await prisma.sessionComment.create({
        data: {
          sessionId: id,
          userId: admin.id,
          userName: admin.name || admin.email,
          content: content || '',
        },
      });

      await logAudit({
        action: 'CREATE',
        resource: 'TerminalSession',
        resourceId: id,
        userId: admin.id,
        details: { action: 'comment_added', content },
        ...context,
      });

      return NextResponse.json({ success: true, action: 'comment_added' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Terminate session
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, reason } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await prisma.terminalSession.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        server: { select: { name: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Terminate session
    await prisma.terminalSession.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        endedAt: new Date(),
      },
    });

    // Audit log
    const context = getAuditContext(request);
    await logAudit({
      action: 'SESSION_TERMINATED',
      resource: 'TerminalSession',
      resourceId: id,
      userId: admin.id,
      details: {
        reason,
        terminatedBy: admin.email,
        userEmail: session.user.email,
        serverName: session.server.name,
      },
      ...context,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Terminate session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

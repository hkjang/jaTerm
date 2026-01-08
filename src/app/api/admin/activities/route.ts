// Activities API Route
// Recent activities for admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRole } from '@/lib/auth/otp-types';

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const userId = authHeader.replace('Bearer ', '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const activities: Array<{
      id: string;
      type: string;
      action: string;
      actor: string;
      target: string;
      timestamp: Date;
      details?: string;
    }> = [];

    // Get recent sessions
    const recentSessions = await prisma.terminalSession.findMany({
      include: {
        user: { select: { name: true } },
        server: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: Math.ceil(limit / 3),
    });

    recentSessions.forEach(session => {
      activities.push({
        id: `session-${session.id}`,
        type: 'session',
        action: session.status === 'ACTIVE' ? '에 접속함' : '세션 종료',
        actor: session.user?.name || 'Unknown',
        target: session.server?.name || 'Unknown',
        timestamp: session.startedAt,
      });
    });

    // Get recent commands (blocked ones are more interesting)
    const recentCommands = await prisma.commandLog.findMany({
      include: {
        session: {
          include: {
            user: { select: { name: true } },
            server: { select: { name: true } },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: Math.ceil(limit / 3),
    });

    recentCommands.forEach(cmd => {
      activities.push({
        id: `cmd-${cmd.id}`,
        type: 'command',
        action: cmd.blocked ? '차단된 명령 실행 시도' : '명령 실행',
        actor: cmd.session?.user?.name || 'Unknown',
        target: cmd.session?.server?.name || 'Unknown',
        timestamp: cmd.timestamp,
        details: cmd.command.substring(0, 50) + (cmd.command.length > 50 ? '...' : ''),
      });
    });

    // Get recent alerts
    const recentAlerts = await prisma.securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 3),
    });

    recentAlerts.forEach(alert => {
      activities.push({
        id: `alert-${alert.id}`,
        type: 'alert',
        action: `${alert.severity} 알림`,
        actor: '시스템',
        target: alert.title,
        timestamp: alert.createdAt,
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: activities.slice(0, limit),
    });
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

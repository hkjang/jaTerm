// Admin Dashboard API Routes
// Real-time statistics for admin dashboard

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

// GET: Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's start (00:00:00)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Parallel queries for efficiency
    const [
      activeUsersResult,
      activeSessions,
      totalServers,
      blockedCommandsToday,
      unresolvedAlerts,
      pendingApprovals,
      commandsToday,
      recentSessions,
      recentAlerts,
    ] = await Promise.all([
      // Active users (logged in within last 24 hours)
      prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Active terminal sessions
      prisma.terminalSession.count({
        where: { status: 'ACTIVE' },
      }),
      // Total active servers
      prisma.server.count({
        where: { isActive: true },
      }),
      // Blocked commands today
      prisma.commandLog.count({
        where: {
          blocked: true,
          timestamp: { gte: todayStart },
        },
      }),
      // Unresolved security alerts
      prisma.securityAlert.count({
        where: { isResolved: false },
      }),
      // Pending approval requests
      prisma.approvalRequest.count({
        where: { status: 'PENDING' },
      }),
      // Total commands executed today
      prisma.commandLog.count({
        where: {
          timestamp: { gte: todayStart },
        },
      }),
      // Recent sessions (for dashboard table)
      prisma.terminalSession.findMany({
        where: {},
        include: {
          user: { select: { id: true, email: true, name: true } },
          server: { select: { id: true, name: true, hostname: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
      // Recent unresolved alerts
      prisma.securityAlert.findMany({
        where: { isResolved: false },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 5,
      }),
    ]);

    // Calculate additional metrics
    const avgResponseTime = 23; // Placeholder - would need actual metrics collection
    const serverLoad = Math.min(Math.round((activeSessions / Math.max(totalServers, 1)) * 100), 100);
    const slaCompliance = 99.7; // Placeholder - would need actual SLA tracking

    return NextResponse.json({
      stats: {
        activeUsers: activeUsersResult,
        activeSessions,
        totalServers,
        blockedCommands: blockedCommandsToday,
        securityAlerts: unresolvedAlerts,
        approvalsPending: pendingApprovals,
        commandsToday,
        avgResponseTime,
        serverLoad,
        slaCompliance,
      },
      recentSessions: recentSessions.map(session => ({
        id: session.id,
        user: session.user.email,
        userName: session.user.name,
        server: session.server.name,
        serverHostname: session.server.hostname,
        startedAt: session.startedAt,
        status: session.status,
      })),
      recentAlerts: recentAlerts.map(alert => ({
        id: alert.id,
        type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        title: alert.title,
        time: alert.createdAt,
      })),
      // Weekly command trend (last 7 days)
      commandTrend: await getWeeklyCommandTrend(),
      // Session distribution by environment
      sessionDistribution: await getSessionDistribution(),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get weekly command execution trend
async function getWeeklyCommandTrend() {
  const trend = [];
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const count = await prisma.commandLog.count({
      where: {
        timestamp: {
          gte: date,
          lt: nextDate,
        },
      },
    });
    
    trend.push({
      label: days[date.getDay()],
      value: count,
    });
  }
  
  return trend;
}

// Get session distribution by environment
async function getSessionDistribution() {
  const servers = await prisma.server.findMany({
    select: { id: true, environment: true },
  });
  
  const serverEnvMap = new Map(servers.map(s => [s.id, s.environment]));
  
  const sessions = await prisma.terminalSession.findMany({
    where: {
      startedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    select: { serverId: true },
  });
  
  const distribution: Record<string, number> = {
    PROD: 0,
    STAGE: 0,
    DEV: 0,
    OTHER: 0,
  };
  
  sessions.forEach(session => {
    const env = serverEnvMap.get(session.serverId) || 'OTHER';
    distribution[env] = (distribution[env] || 0) + 1;
  });
  
  return [
    { label: 'PROD', value: distribution.PROD, color: 'var(--color-danger)' },
    { label: 'STAGE', value: distribution.STAGE, color: 'var(--color-warning)' },
    { label: 'DEV', value: distribution.DEV, color: 'var(--color-success)' },
    { label: 'OTHER', value: distribution.OTHER, color: 'var(--color-info)' },
  ].filter(d => d.value > 0);
}

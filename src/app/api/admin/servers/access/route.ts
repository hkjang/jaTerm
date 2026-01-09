// Server Access Permissions API
// Manages user access permissions per server

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRole } from '@/lib/auth/otp-types';
import { logCreate, logDelete, getAuditContext } from '@/lib/audit/audit-logger';

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

// GET: List servers with access details
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serverId = searchParams.get('serverId');

    if (serverId) {
      // Get specific server with access details
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          terminalSessions: {
            orderBy: { startedAt: 'desc' },
            take: 20,
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
        },
      });

      if (!server) {
        return NextResponse.json({ error: 'Server not found' }, { status: 404 });
      }

      // Get unique users who accessed this server
      const accessedUsers = await prisma.terminalSession.groupBy({
        by: ['userId'],
        where: { serverId },
        _count: { id: true },
        _max: { startedAt: true },
      });

      const userDetails = await prisma.user.findMany({
        where: { id: { in: accessedUsers.map(u => u.userId) } },
        select: { id: true, name: true, email: true, role: true },
      });

      const usersWithStats = accessedUsers.map(u => ({
        ...userDetails.find(ud => ud.id === u.userId),
        sessionCount: u._count.id,
        lastAccess: u._max.startedAt,
      }));

      // Get policies that apply to this server
      const policies = await prisma.serverAccessPolicy.findMany({
        where: {
          OR: [
            { servers: { some: { id: serverId } } },
            { isGlobal: true },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          allowedRoles: true,
          commandMode: true,
          requireApproval: true,
          priority: true,
        },
        orderBy: { priority: 'asc' },
      });

      return NextResponse.json({
        server: {
          ...server,
          tags: server.tags ? JSON.parse(server.tags) : [],
        },
        recentSessions: server.terminalSessions,
        accessedUsers: usersWithStats,
        appliedPolicies: policies,
      });
    }

    // List all servers with basic access stats
    const servers = await prisma.server.findMany({
      select: {
        id: true,
        name: true,
        hostname: true,
        environment: true,
        isActive: true,
        _count: {
          select: { terminalSessions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get active session counts
    const activeSessions = await prisma.terminalSession.groupBy({
      by: ['serverId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    const activeSessionMap = new Map(activeSessions.map(s => [s.serverId, s._count.id]));

    const serversWithStats = servers.map(s => ({
      ...s,
      totalSessions: s._count.terminalSessions,
      activeSessions: activeSessionMap.get(s.id) || 0,
    }));

    return NextResponse.json({ servers: serversWithStats });
  } catch (error) {
    console.error('Server access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Grant access to server
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serverId, userId, expiresAt, note } = await request.json();

    if (!serverId || !userId) {
      return NextResponse.json({ error: 'serverId and userId are required' }, { status: 400 });
    }

    // Check if server and user exist
    const [server, user] = await Promise.all([
      prisma.server.findUnique({ where: { id: serverId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Create access grant record (using AuditLog for now)
    const context = getAuditContext(request);
    await logCreate('ServerAccessGrant', `${serverId}_${userId}`, {
      serverId,
      userId,
      serverName: server.name,
      userName: user.name || user.email,
      expiresAt,
      note,
      grantedBy: admin.email,
    }, { userId: admin.id, ...context });

    return NextResponse.json({ success: true, message: `${user.name || user.email}에게 ${server.name} 접근 권한이 부여되었습니다.` });
  } catch (error) {
    console.error('Grant access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Revoke access
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serverId, userId, reason } = await request.json();

    if (!serverId || !userId) {
      return NextResponse.json({ error: 'serverId and userId are required' }, { status: 400 });
    }

    const [server, user] = await Promise.all([
      prisma.server.findUnique({ where: { id: serverId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    // Log revocation
    const context = getAuditContext(request);
    await logDelete('ServerAccessGrant', `${serverId}_${userId}`, {
      serverId,
      userId,
      serverName: server?.name,
      userName: user?.name || user?.email,
      reason,
      revokedBy: admin.email,
    }, { userId: admin.id, ...context });

    return NextResponse.json({ success: true, message: '접근 권한이 취소되었습니다.' });
  } catch (error) {
    console.error('Revoke access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

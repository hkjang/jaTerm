// Admin Search API
// Global search across users, servers, sessions, alerts, policies

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

    const query = request.nextUrl.searchParams.get('q') || '';
    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.toLowerCase();
    const results: Array<{
      id: string;
      type: string;
      title: string;
      subtitle: string;
      url: string;
    }> = [];

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
        ],
      },
      take: 5,
      select: { id: true, name: true, email: true, role: true },
    });

    users.forEach(user => {
      results.push({
        id: `user-${user.id}`,
        type: 'user',
        title: user.name || user.email,
        subtitle: `${user.role} • ${user.email}`,
        url: `/admin/users?search=${encodeURIComponent(user.email)}`,
      });
    });

    // Search servers
    const servers = await prisma.server.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { hostname: { contains: searchTerm } },
        ],
      },
      take: 5,
      select: { id: true, name: true, hostname: true, environment: true },
    });

    servers.forEach(server => {
      results.push({
        id: `server-${server.id}`,
        type: 'server',
        title: server.name,
        subtitle: `${server.environment} • ${server.hostname}`,
        url: `/admin/servers?search=${encodeURIComponent(server.name)}`,
      });
    });

    // Search sessions
    const sessions = await prisma.terminalSession.findMany({
      where: {
        OR: [
          { user: { name: { contains: searchTerm } } },
          { server: { name: { contains: searchTerm } } },
        ],
      },
      include: {
        user: { select: { name: true } },
        server: { select: { name: true } },
      },
      take: 5,
      orderBy: { startedAt: 'desc' },
    });

    sessions.forEach(session => {
      results.push({
        id: `session-${session.id}`,
        type: 'session',
        title: `${session.user?.name || 'Unknown'} → ${session.server?.name || 'Unknown'}`,
        subtitle: `${session.status} • ${new Date(session.startedAt).toLocaleString()}`,
        url: `/admin/sessions?search=${session.id}`,
      });
    });

    // Search alerts
    const alerts = await prisma.securityAlert.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { message: { contains: searchTerm } },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    alerts.forEach(alert => {
      results.push({
        id: `alert-${alert.id}`,
        type: 'alert',
        title: alert.title,
        subtitle: `${alert.severity} • ${alert.isResolved ? '해결됨' : '미해결'}`,
        url: `/admin/alerts?search=${alert.id}`,
      });
    });

    // Search policies
    const policies = await prisma.policy.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      take: 5,
    });

    policies.forEach(policy => {
      results.push({
        id: `policy-${policy.id}`,
        type: 'policy',
        title: policy.name,
        subtitle: policy.description || '설명 없음',
        url: `/admin/policies?search=${encodeURIComponent(policy.name)}`,
      });
    });

    return NextResponse.json({ results: results.slice(0, 15) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

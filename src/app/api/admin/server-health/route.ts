// Server Health API Route
// Server health monitoring data

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

    const servers = await prisma.server.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get active session counts per server
    const sessionCounts = await prisma.terminalSession.groupBy({
      by: ['serverId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    const sessionCountMap = new Map(
      sessionCounts.map(s => [s.serverId, s._count.id])
    );

    // Generate simulated health metrics (in real app, this would come from monitoring)
    const healthData = servers.map(server => {
      // Simulate health metrics based on session count
      const activeSessions = sessionCountMap.get(server.id) || 0;
      const baseLoad = activeSessions * 10;
      
      return {
        id: server.id,
        name: server.name,
        hostname: server.hostname,
        environment: server.environment,
        status: server.isActive ? 'online' : 'offline' as const,
        responseTime: Math.floor(Math.random() * 50) + 10 + baseLoad,
        cpuUsage: Math.min(95, Math.floor(Math.random() * 30) + 15 + baseLoad),
        memoryUsage: Math.min(90, Math.floor(Math.random() * 25) + 30 + baseLoad / 2),
        activeSessions,
      };
    });

    return NextResponse.json({ servers: healthData });
  } catch (error) {
    console.error('Server health error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/terminal/sessions - List terminal sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const sessions = await prisma.terminalSession.findMany({
      where,
      include: {
        server: {
          select: {
            id: true,
            name: true,
            hostname: true,
            environment: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/terminal/sessions - Create new terminal session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, serverId, purpose, clientIp } = body;

    if (!userId || !serverId) {
      return NextResponse.json({ error: 'userId and serverId are required' }, { status: 400 });
    }

    // Check if server exists and is active
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server || !server.isActive) {
      return NextResponse.json({ error: 'Server not found or inactive' }, { status: 404 });
    }

    // Create session
    const session = await prisma.terminalSession.create({
      data: {
        userId,
        serverId,
        purpose,
        clientIp,
        status: 'CONNECTING',
      },
      include: {
        server: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log the session start
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SESSION_START',
        resource: 'TerminalSession',
        resourceId: session.id,
        details: JSON.stringify({ serverId, serverName: server.name }),
        ipAddress: clientIp,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

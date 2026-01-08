import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/terminal/sessions/[id] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.terminalSession.findUnique({
      where: { id: params.id },
      include: {
        server: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        commandLogs: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
        sessionRecording: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT /api/terminal/sessions/[id] - Update session status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, endedAt } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (endedAt) updateData.endedAt = new Date(endedAt);
    if (status === 'DISCONNECTED' || status === 'TERMINATED') {
      updateData.endedAt = new Date();
    }

    const session = await prisma.terminalSession.update({
      where: { id: params.id },
      data: updateData,
      include: {
        server: true,
      },
    });

    // Log status change
    if (status === 'ACTIVE') {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'SESSION_CONNECT',
          resource: 'TerminalSession',
          resourceId: session.id,
          details: JSON.stringify({ serverName: session.server.name }),
        },
      });
    } else if (status === 'DISCONNECTED' || status === 'TERMINATED') {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'SESSION_END',
          resource: 'TerminalSession',
          resourceId: session.id,
          details: JSON.stringify({ 
            serverName: session.server.name,
            duration: session.endedAt && session.startedAt 
              ? Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
              : null
          }),
        },
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE /api/terminal/sessions/[id] - Close/terminate session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.terminalSession.update({
      where: { id: params.id },
      data: {
        status: 'TERMINATED',
        endedAt: new Date(),
      },
      include: { server: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'SESSION_TERMINATE',
        resource: 'TerminalSession',
        resourceId: session.id,
        details: JSON.stringify({ serverName: session.server.name }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to terminate session:', error);
    return NextResponse.json({ error: 'Failed to terminate session' }, { status: 500 });
  }
}

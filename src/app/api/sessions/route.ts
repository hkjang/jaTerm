import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/sessions - List terminal sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const sessions = await prisma.terminalSession.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        server: {
          select: { id: true, name: true, hostname: true, environment: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const session = await prisma.terminalSession.create({
      data: {
        userId: body.userId,
        serverId: body.serverId,
        status: 'CONNECTING',
        clientIp: body.clientIp,
        purpose: body.purpose,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

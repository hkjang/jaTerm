import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/terminal/recordings - List session recordings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (userId) {
      where.session = { userId };
    }

    const recordings = await prisma.sessionRecording.findMany({
      where,
      include: {
        session: {
          include: {
            server: {
              select: { id: true, name: true, hostname: true, environment: true },
            },
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Format response (don't include raw data in list)
    const formattedRecordings = recordings.map(rec => ({
      id: rec.id,
      sessionId: rec.sessionId,
      format: rec.format,
      duration: rec.duration,
      createdAt: rec.createdAt,
      server: rec.session.server,
      user: rec.session.user,
      sessionStartedAt: rec.session.startedAt,
      sessionEndedAt: rec.session.endedAt,
    }));

    return NextResponse.json(formattedRecordings);
  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
  }
}

// Admin Recordings API Routes
// Session recording management

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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [recordings, total] = await Promise.all([
      prisma.sessionRecording.findMany({
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sessionRecording.count(),
    ]);

    // Get related session info
    const recordingsWithInfo = await Promise.all(
      recordings.map(async (rec) => {
        const session = await prisma.terminalSession.findUnique({
          where: { id: rec.sessionId },
          include: {
            user: { select: { name: true, email: true } },
            server: { select: { name: true, hostname: true, environment: true } },
          },
        });

        return {
          id: rec.id,
          sessionId: rec.sessionId,
          userName: session?.user?.name || 'Unknown',
          serverName: session?.server?.name || 'Unknown',
          environment: session?.server?.environment || 'DEV',
          duration: rec.duration || 0,
          size: rec.size || 0,
          checksum: rec.checksum,
          status: rec.status,
          startedAt: rec.startedAt,
          endedAt: rec.endedAt,
        };
      })
    );

    return NextResponse.json({
      recordings: recordingsWithInfo,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List recordings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin Access History API Routes
// Authentication logs from audit log

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

// GET: List access history (auth logs)
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action') || '';

    // Filter for auth-related actions
    const authActions = ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'OTP_SETUP', 'OTP_VERIFY', 'OTP_RESET', 'OTP_FAILED'];
    
    const where: Record<string, unknown> = {
      action: action ? action : { in: authActions },
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const logsFormatted = logs.map(log => {
      const details = log.details ? JSON.parse(log.details) : {};
      return {
        id: log.id,
        userId: log.userId,
        userName: log.user?.name || 'Unknown',
        email: log.user?.email || 'Unknown',
        action: log.action,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        location: details.location || null,
        timestamp: log.timestamp,
      };
    });

    return NextResponse.json({
      logs: logsFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Access history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

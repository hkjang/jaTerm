// Notifications API Route
// Notifications for admin notification center

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

    const notifications: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      severity: string;
      isRead: boolean;
      timestamp: Date;
      url?: string;
    }> = [];

    // Get unresolved security alerts
    const alerts = await prisma.securityAlert.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    alerts.forEach(alert => {
      notifications.push({
        id: `alert-${alert.id}`,
        type: 'alert',
        title: alert.title,
        message: alert.message.substring(0, 80) + (alert.message.length > 80 ? '...' : ''),
        severity: alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 
                  alert.severity === 'MEDIUM' ? 'warning' : 'info',
        isRead: false,
        timestamp: alert.createdAt,
        url: '/admin/alerts',
      });
    });

    // Get pending approvals
    const approvals = await prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        requester: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    approvals.forEach(approval => {
      notifications.push({
        id: `approval-${approval.id}`,
        type: 'approval',
        title: '승인 요청 대기 중',
        message: `${approval.requester?.name || 'Unknown'}님의 ${approval.accessType} 요청`,
        severity: 'warning',
        isRead: false,
        timestamp: approval.createdAt,
        url: '/admin/approvals',
      });
    });

    // Sort by timestamp
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      notifications: notifications.slice(0, 15),
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

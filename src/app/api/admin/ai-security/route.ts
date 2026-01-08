// Admin AI Security API Routes
// Anomaly detection rule management

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

    const [rules, total] = await Promise.all([
      prisma.anomalyRule.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.anomalyRule.count(),
    ]);

    // Get detection stats from security alerts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayDetections, todayBlocks] = await Promise.all([
      prisma.securityAlert.count({
        where: {
          alertType: 'ANOMALY_DETECTED',
          createdAt: { gte: todayStart },
        },
      }),
      prisma.securityAlert.count({
        where: {
          alertType: { in: ['DANGEROUS_COMMAND', 'POLICY_VIOLATION'] },
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    return NextResponse.json({
      rules,
      stats: {
        activeRules: rules.filter(r => r.isActive).length,
        todayDetections,
        todayBlocks,
      },
    });
  } catch (error) {
    console.error('List anomaly rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, threshold, isActive } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rule = await prisma.anomalyRule.create({
      data: {
        name,
        description,
        type,
        threshold: threshold || 0.8,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Create anomaly rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const rule = await prisma.anomalyRule.update({
      where: { id },
      data: updateFields,
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Update anomaly rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

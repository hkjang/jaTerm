// Admin Scheduled Tasks API Routes
// Schedule management

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
    select: { id: true, email: true, role: true, name: true },
  });
  
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

// GET: List scheduled tasks
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const active = searchParams.get('active');

    const where: Record<string, unknown> = {};
    if (active !== null && active !== '') {
      where.isActive = active === 'true';
    }

    const [tasks, total] = await Promise.all([
      prisma.scheduledTask.findMany({
        where,
        include: {
          macro: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scheduledTask.count({ where }),
    ]);

    const tasksFormatted = tasks.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      command: task.command,
      schedule: task.schedule,
      targetIds: task.targetIds ? JSON.parse(task.targetIds) : [],
      isActive: task.isActive,
      lastRunAt: task.lastRunAt,
      nextRunAt: task.nextRunAt,
      macro: task.macro,
      createdAt: task.createdAt,
    }));

    return NextResponse.json({
      tasks: tasksFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List schedules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create scheduled task
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, command, macroId, schedule, targetIds, isActive } = body;

    if (!name || !schedule) {
      return NextResponse.json({ error: 'Name and schedule are required' }, { status: 400 });
    }

    const task = await prisma.scheduledTask.create({
      data: {
        name,
        description,
        command,
        macroId,
        schedule,
        targetIds: JSON.stringify(targetIds || []),
        isActive: isActive !== false,
        userId: admin.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update scheduled task
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, targetIds, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = { ...updateFields };
    if (targetIds) {
      dataToUpdate.targetIds = JSON.stringify(targetIds);
    }

    const task = await prisma.scheduledTask.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete scheduled task
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await prisma.scheduledTask.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

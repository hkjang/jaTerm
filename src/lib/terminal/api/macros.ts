'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ============================================
// Macros
// ============================================

export async function getMacros(userId: string, includeShared = true) {
  const where = includeShared
    ? {
        OR: [{ userId }, { isShared: true }],
      }
    : { userId };

  return prisma.macro.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function getMacro(macroId: string) {
  return prisma.macro.findUnique({
    where: { id: macroId },
    include: {
      scheduledTasks: true,
    },
  });
}

export async function createMacro(
  userId: string,
  name: string,
  description: string | undefined,
  steps: object[],
  variables?: object[],
  conditions?: object[],
  isShared = false
) {
  const macro = await prisma.macro.create({
    data: {
      userId,
      name,
      description,
      steps: JSON.stringify(steps),
      variables: variables ? JSON.stringify(variables) : null,
      conditions: conditions ? JSON.stringify(conditions) : null,
      isShared,
    },
  });

  revalidatePath('/terminal');
  return macro;
}

export async function updateMacro(
  macroId: string,
  data: {
    name?: string;
    description?: string;
    steps?: object[];
    variables?: object[];
    conditions?: object[];
    isShared?: boolean;
    isActive?: boolean;
  }
) {
  const updateData: Record<string, unknown> = {};
  
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.steps) updateData.steps = JSON.stringify(data.steps);
  if (data.variables) updateData.variables = JSON.stringify(data.variables);
  if (data.conditions) updateData.conditions = JSON.stringify(data.conditions);
  if (data.isShared !== undefined) updateData.isShared = data.isShared;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const macro = await prisma.macro.update({
    where: { id: macroId },
    data: updateData,
  });

  revalidatePath('/terminal');
  return macro;
}

export async function deleteMacro(macroId: string) {
  await prisma.macro.delete({
    where: { id: macroId },
  });
  revalidatePath('/terminal');
}

// ============================================
// Scheduled Tasks
// ============================================

export async function getScheduledTasks(userId: string) {
  return prisma.scheduledTask.findMany({
    where: { userId },
    include: {
      macro: true,
    },
    orderBy: { nextRunAt: 'asc' },
  });
}

export async function createScheduledTask(
  userId: string,
  name: string,
  schedule: string,
  targetIds: string[],
  options: {
    description?: string;
    macroId?: string;
    command?: string;
  }
) {
  // Calculate next run time (simplified)
  const nextRunAt = calculateNextRun(schedule);

  const task = await prisma.scheduledTask.create({
    data: {
      userId,
      name,
      description: options.description,
      macroId: options.macroId,
      command: options.command,
      schedule,
      targetIds: JSON.stringify(targetIds),
      nextRunAt,
    },
    include: {
      macro: true,
    },
  });

  revalidatePath('/terminal');
  return task;
}

export async function updateScheduledTask(
  taskId: string,
  data: {
    name?: string;
    description?: string;
    schedule?: string;
    targetIds?: string[];
    isActive?: boolean;
  }
) {
  const updateData: Record<string, unknown> = {};
  
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.schedule) {
    updateData.schedule = data.schedule;
    updateData.nextRunAt = calculateNextRun(data.schedule);
  }
  if (data.targetIds) updateData.targetIds = JSON.stringify(data.targetIds);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const task = await prisma.scheduledTask.update({
    where: { id: taskId },
    data: updateData,
  });

  revalidatePath('/terminal');
  return task;
}

export async function deleteScheduledTask(taskId: string) {
  await prisma.scheduledTask.delete({
    where: { id: taskId },
  });
  revalidatePath('/terminal');
}

// Helper: Calculate next run time from cron expression (simplified)
function calculateNextRun(schedule: string): Date {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return new Date();

  const [minute, hour] = parts;
  const now = new Date();
  const next = new Date(now);

  if (minute !== '*') next.setMinutes(parseInt(minute));
  if (hour !== '*') next.setHours(parseInt(hour));
  next.setSeconds(0);
  next.setMilliseconds(0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

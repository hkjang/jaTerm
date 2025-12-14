'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ============================================
// Terminal Settings
// ============================================

export async function getSettings(userId: string) {
  let settings = await prisma.terminalSettings.findUnique({
    where: { userId },
  });

  // Return defaults if no settings exist
  if (!settings) {
    settings = await prisma.terminalSettings.create({
      data: { userId },
    });
  }

  return settings;
}

export async function updateSettings(
  userId: string,
  data: {
    theme?: string;
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    cursorStyle?: string;
    cursorBlink?: boolean;
    scrollback?: number;
    autoScroll?: boolean;
    wordWrap?: boolean;
    bellStyle?: string;
    pasteFilterEnabled?: boolean;
    typingDetection?: boolean;
    autoLockEnabled?: boolean;
    autoLockTimeout?: number;
    watermarkEnabled?: boolean;
    confirmDangerous?: boolean;
    maskSensitiveData?: boolean;
  }
) {
  const settings = await prisma.terminalSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  revalidatePath('/terminal');
  return settings;
}

// ============================================
// Session Groups
// ============================================

export async function getSessionGroups(userId: string) {
  return prisma.userSessionGroup.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
}

export async function createSessionGroup(
  userId: string,
  name: string,
  serverIds: string[],
  options?: {
    description?: string;
    color?: string;
    icon?: string;
  }
) {
  const group = await prisma.userSessionGroup.create({
    data: {
      userId,
      name,
      serverIds: JSON.stringify(serverIds),
      description: options?.description,
      color: options?.color,
      icon: options?.icon,
    },
  });

  revalidatePath('/terminal');
  return group;
}

export async function updateSessionGroup(
  groupId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    serverIds?: string[];
  }
) {
  const updateData: Record<string, unknown> = {};
  
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.color) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.serverIds) updateData.serverIds = JSON.stringify(data.serverIds);

  const group = await prisma.userSessionGroup.update({
    where: { id: groupId },
    data: updateData,
  });

  revalidatePath('/terminal');
  return group;
}

export async function deleteSessionGroup(groupId: string) {
  await prisma.userSessionGroup.delete({
    where: { id: groupId },
  });
  revalidatePath('/terminal');
}

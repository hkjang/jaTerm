'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ============================================
// Session Sharing
// ============================================

export async function getSessionShares(sessionId: string) {
  return prisma.sessionShare.findMany({
    where: { sessionId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function shareSession(
  sessionId: string,
  ownerId: string,
  sharedWith: string,
  permission: 'view' | 'interact' | 'control' = 'view',
  expiresAt?: Date
) {
  const share = await prisma.sessionShare.upsert({
    where: {
      sessionId_sharedWith: { sessionId, sharedWith },
    },
    update: { permission, isActive: true, expiresAt },
    create: {
      sessionId,
      ownerId,
      sharedWith,
      permission,
      expiresAt,
    },
  });

  revalidatePath('/terminal');
  return share;
}

export async function revokeSessionAccess(sessionId: string, sharedWith: string) {
  await prisma.sessionShare.updateMany({
    where: { sessionId, sharedWith },
    data: { isActive: false },
  });
  revalidatePath('/terminal');
}

export async function getSharedSessions(userId: string) {
  return prisma.sessionShare.findMany({
    where: { sharedWith: userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// Session Comments
// ============================================

export async function getSessionComments(sessionId: string) {
  return prisma.sessionComment.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });
}

export async function addSessionComment(
  sessionId: string,
  userId: string,
  userName: string,
  content: string
) {
  const comment = await prisma.sessionComment.create({
    data: {
      sessionId,
      userId,
      userName,
      content,
    },
  });

  revalidatePath('/terminal');
  return comment;
}

export async function deleteSessionComment(commentId: string) {
  await prisma.sessionComment.delete({
    where: { id: commentId },
  });
  revalidatePath('/terminal');
}

// ============================================
// Chat Messages
// ============================================

export async function getChatMessages(sessionId: string, limit = 100) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
    take: limit,
  });
}

export async function sendChatMessage(
  sessionId: string,
  userId: string,
  userName: string,
  content: string,
  type: 'text' | 'command' | 'system' = 'text'
) {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      userId,
      userName,
      content,
      type,
    },
  });

  return message;
}

// ============================================
// Broadcast Execution
// ============================================

export async function createBroadcastExecution(
  userId: string,
  command: string,
  targetServers: string[],
  excludedServers: string[] = []
) {
  return prisma.broadcastExecution.create({
    data: {
      userId,
      command,
      targetServers: JSON.stringify(targetServers),
      excludedServers: JSON.stringify(excludedServers),
    },
  });
}

export async function addBroadcastResult(
  executionId: string,
  serverId: string,
  serverName: string,
  status: 'success' | 'failed' | 'timeout' | 'skipped',
  output?: string,
  error?: string,
  duration = 0
) {
  return prisma.broadcastResult.create({
    data: {
      executionId,
      serverId,
      serverName,
      status,
      output,
      error,
      duration,
    },
  });
}

export async function completeBroadcastExecution(
  executionId: string,
  status: 'completed' | 'failed' | 'partial'
) {
  return prisma.broadcastExecution.update({
    where: { id: executionId },
    data: {
      status,
      completedAt: new Date(),
    },
    include: {
      results: true,
    },
  });
}

export async function getBroadcastHistory(userId: string, limit = 20) {
  return prisma.broadcastExecution.findMany({
    where: { userId },
    include: {
      results: true,
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
}

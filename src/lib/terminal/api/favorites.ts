'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ============================================
// Command Favorites
// ============================================

export async function getFavorites(userId: string) {
  return prisma.commandFavorite.findMany({
    where: { userId },
    include: {
      tags: {
        include: { tag: true },
      },
    },
    orderBy: { usageCount: 'desc' },
  });
}

export async function addFavorite(
  userId: string,
  command: string,
  description?: string,
  tagIds?: string[]
) {
  const favorite = await prisma.commandFavorite.create({
    data: {
      userId,
      command,
      description,
      tags: tagIds
        ? {
            create: tagIds.map(tagId => ({ tagId })),
          }
        : undefined,
    },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  revalidatePath('/terminal');
  return favorite;
}

export async function removeFavorite(favoriteId: string) {
  await prisma.commandFavorite.delete({
    where: { id: favoriteId },
  });
  revalidatePath('/terminal');
}

export async function incrementFavoriteUsage(favoriteId: string) {
  await prisma.commandFavorite.update({
    where: { id: favoriteId },
    data: {
      usageCount: { increment: 1 },
    },
  });
}

// ============================================
// Command Tags
// ============================================

export async function getTags() {
  return prisma.commandTag.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createTag(name: string, color: string) {
  return prisma.commandTag.create({
    data: { name, color },
  });
}

export async function deleteTag(tagId: string) {
  await prisma.commandTag.delete({
    where: { id: tagId },
  });
  revalidatePath('/terminal');
}

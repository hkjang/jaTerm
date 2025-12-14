import { prisma } from '@/lib/db';
import type { ApprovalStatus } from '@prisma/client';

export interface ApprovalRequestInput {
  requesterId: string;
  serverId: string;
  purpose: string;
  durationHours?: number;
}

export interface ApprovalAction {
  requestId: string;
  approverId: string;
  action: 'APPROVE' | 'REJECT';
  notes?: string;
}

/**
 * Create a new approval request
 */
export async function createApprovalRequest(
  input: ApprovalRequestInput
): Promise<string> {
  const durationHours = input.durationHours || 8;
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const request = await prisma.approvalRequest.create({
    data: {
      requesterId: input.requesterId,
      serverId: input.serverId,
      purpose: input.purpose,
      expiresAt,
      status: 'PENDING',
    },
  });

  // TODO: Send notification to approvers

  return request.id;
}

/**
 * Process approval action
 */
export async function processApproval(action: ApprovalAction): Promise<void> {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: action.requestId },
  });

  if (!request) {
    throw new Error('Approval request not found');
  }

  if (request.status !== 'PENDING') {
    throw new Error('Approval request is not pending');
  }

  const newStatus: ApprovalStatus = action.action === 'APPROVE' 
    ? 'APPROVED' 
    : 'REJECTED';

  await prisma.approvalRequest.update({
    where: { id: action.requestId },
    data: {
      status: newStatus,
      approverId: action.approverId,
      approvedAt: new Date(),
      notes: action.notes,
    },
  });

  // TODO: Send notification to requester
}

/**
 * Get pending approvals for an approver
 */
export async function getPendingApprovals(approverRole: string) {
  return prisma.approvalRequest.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    include: {
      requester: {
        select: { id: true, name: true, email: true, department: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get approval requests for a user
 */
export async function getUserApprovalRequests(userId: string) {
  return prisma.approvalRequest.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if user has valid approval for server
 */
export async function hasValidApproval(
  userId: string,
  serverId: string
): Promise<boolean> {
  const approval = await prisma.approvalRequest.findFirst({
    where: {
      requesterId: userId,
      serverId,
      status: 'APPROVED',
      expiresAt: { gt: new Date() },
    },
  });

  return approval !== null;
}

/**
 * Expire old approval requests
 */
export async function expireOldRequests(): Promise<number> {
  const result = await prisma.approvalRequest.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return result.count;
}

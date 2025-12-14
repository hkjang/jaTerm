import { prisma } from '@/lib/db';
import type { AlertType, Severity } from '@prisma/client';

export interface AuditEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit entry
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    },
  });
}

/**
 * Log user action
 */
export async function logUserAction(
  userId: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    action,
    resource: 'USER',
    resourceId: userId,
    details,
  });
}

/**
 * Log session action
 */
export async function logSessionAction(
  sessionId: string,
  userId: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    action,
    resource: 'SESSION',
    resourceId: sessionId,
    details,
  });
}

/**
 * Log command execution
 */
export async function logCommand(
  sessionId: string,
  command: string,
  output?: string,
  blocked: boolean = false,
  riskScore: number = 0,
  reason?: string
): Promise<void> {
  await prisma.commandLog.create({
    data: {
      sessionId,
      command,
      output: output?.substring(0, 10000), // Limit output size
      riskScore,
      blocked,
      reason,
    },
  });
}

/**
 * Create security alert
 */
export async function createAlert(
  alertType: AlertType,
  severity: Severity,
  title: string,
  message: string,
  sessionId?: string,
  userId?: string
): Promise<void> {
  await prisma.securityAlert.create({
    data: {
      alertType,
      severity,
      title,
      message,
      sessionId,
      userId,
    },
  });

  // In production: send to Slack, SMS, etc.
  console.warn(`[SECURITY ALERT] ${severity}: ${title}`);
}

/**
 * Search audit logs
 */
export async function searchAuditLogs(params: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = { contains: params.action };
  if (params.resource) where.resource = params.resource;
  if (params.startDate || params.endDate) {
    where.timestamp = {};
    if (params.startDate) where.timestamp.gte = params.startDate;
    if (params.endDate) where.timestamp.lte = params.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get command history for session
 */
export async function getSessionCommands(sessionId: string) {
  return prisma.commandLog.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });
}

/**
 * Get recent security alerts
 */
export async function getRecentAlerts(limit: number = 20) {
  return prisma.securityAlert.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Resolve security alert
 */
export async function resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
  await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    },
  });
}

// Unified Audit Logger for jaTerm
// Logs all CUD operations with diff tracking and integrity verification

import { prisma } from '@/lib/db';
import crypto from 'crypto';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'OTP_SETUP'
  | 'OTP_VERIFY'
  | 'OTP_FAILED'
  | 'OTP_RESET'
  | 'SESSION_START'
  | 'SESSION_END'
  | 'SESSION_TERMINATED'
  | 'COMMAND_EXECUTE'
  | 'COMMAND_BLOCKED'
  | 'POLICY_CHANGE'
  | 'ACCESS_DENIED';

export type AuditResource =
  | 'User'
  | 'Server'
  | 'Policy'
  | 'TerminalSession'
  | 'CommandLog'
  | 'Macro'
  | 'CommandFavorite'
  | 'ServerGroup'
  | 'ApprovalRequest';

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate a hash for audit log integrity verification
 */
function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create a diff between before and after states
 */
function createDiff(
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> | undefined {
  if (!before && !after) return undefined;
  if (!before) return undefined;
  if (!after) return undefined;
  
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        before: before[key],
        after: after[key],
      };
    }
  }
  
  return Object.keys(diff).length > 0 ? diff : undefined;
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<string> {
  const diff = createDiff(entry.before, entry.after);
  
  const details = {
    ...entry.details,
    ...(diff && { changes: diff }),
    ...(entry.before && { before: entry.before }),
    ...(entry.after && { after: entry.after }),
  };
  
  const detailsJson = JSON.stringify(details);
  const hash = generateHash(
    `${entry.userId}|${entry.action}|${entry.resource}|${entry.resourceId}|${detailsJson}|${new Date().toISOString()}`
  );
  
  const auditLog = await prisma.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      details: JSON.stringify({ ...details, hash: `sha256:${hash.substring(0, 12)}` }),
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
  
  return auditLog.id;
}

/**
 * Log a CREATE operation
 */
export async function logCreate(
  resource: AuditResource,
  resourceId: string,
  data: Record<string, unknown>,
  context: { userId?: string; ipAddress?: string; userAgent?: string }
): Promise<string> {
  return logAudit({
    action: 'CREATE',
    resource,
    resourceId,
    after: data,
    ...context,
  });
}

/**
 * Log an UPDATE operation
 */
export async function logUpdate(
  resource: AuditResource,
  resourceId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  context: { userId?: string; ipAddress?: string; userAgent?: string }
): Promise<string> {
  return logAudit({
    action: 'UPDATE',
    resource,
    resourceId,
    before,
    after,
    ...context,
  });
}

/**
 * Log a DELETE operation
 */
export async function logDelete(
  resource: AuditResource,
  resourceId: string,
  data: Record<string, unknown>,
  context: { userId?: string; ipAddress?: string; userAgent?: string }
): Promise<string> {
  return logAudit({
    action: 'DELETE',
    resource,
    resourceId,
    before: data,
    ...context,
  });
}

/**
 * Log authentication events
 */
export async function logAuth(
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'OTP_SETUP' | 'OTP_VERIFY' | 'OTP_FAILED' | 'OTP_RESET',
  userId: string,
  details: Record<string, unknown>,
  context: { ipAddress?: string; userAgent?: string }
): Promise<string> {
  return logAudit({
    action,
    resource: 'User',
    resourceId: userId,
    userId,
    details,
    ...context,
  });
}

/**
 * Verify audit log integrity
 */
export async function verifyAuditIntegrity(logId: string): Promise<boolean> {
  const log = await prisma.auditLog.findUnique({
    where: { id: logId },
  });
  
  if (!log || !log.details) return false;
  
  try {
    const details = JSON.parse(log.details);
    return details.hash?.startsWith('sha256:') ?? false;
  } catch {
    return false;
  }
}

/**
 * Get audit context from request headers
 */
export function getAuditContext(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

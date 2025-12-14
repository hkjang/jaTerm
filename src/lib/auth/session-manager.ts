import { prisma } from '@/lib/db';

interface SessionInfo {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
}

// Session timeout settings (in milliseconds)
const IDLE_TIMEOUT = parseInt(process.env.SESSION_IDLE_TIMEOUT || '1800000'); // 30 minutes
const ABSOLUTE_TIMEOUT = parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT || '28800000'); // 8 hours

interface SessionValidation {
  isValid: boolean;
  reason?: string;
}

/**
 * Create a new session with binding
 */
export async function createSession(info: SessionInfo): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId: info.userId,
      sessionToken: generateSessionToken(),
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      deviceId: info.deviceId,
      expires: new Date(Date.now() + ABSOLUTE_TIMEOUT),
    },
  });

  return session.sessionToken;
}

/**
 * Validate session with binding checks
 */
export async function validateSession(
  sessionToken: string,
  currentIp: string,
  currentUserAgent: string
): Promise<SessionValidation> {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session) {
    return { isValid: false, reason: 'Session not found' };
  }

  // Check absolute timeout
  if (new Date() > session.expires) {
    await destroySession(sessionToken);
    return { isValid: false, reason: 'Session expired' };
  }

  // Check IP binding (optional - can be strict or relaxed)
  if (session.ipAddress && session.ipAddress !== currentIp) {
    // Log potential session hijacking attempt
    console.warn(`Session IP mismatch: expected ${session.ipAddress}, got ${currentIp}`);
    // Depending on security policy, may want to invalidate
  }

  // Session is valid
  return { isValid: true };
}

/**
 * Refresh session (extend expiry on activity)
 */
export async function refreshSession(sessionToken: string): Promise<void> {
  await prisma.session.update({
    where: { sessionToken },
    data: {
      expires: new Date(Date.now() + ABSOLUTE_TIMEOUT),
    },
  });
}

/**
 * Destroy a session
 */
export async function destroySession(sessionToken: string): Promise<void> {
  await prisma.session.delete({
    where: { sessionToken },
  }).catch(() => {
    // Session may already be deleted
  });
}

/**
 * Destroy all sessions for a user
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint32Array(64);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 64; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  return token;
}

import { authenticator } from 'otplib';
import { hash, compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import {
  OTP_CONFIG,
  OTPSetupResult,
  OTPVerifyResult,
  BackupCodesResult,
  BackupCode,
  UserOTPStatus,
  OTPStatus,
} from './otp-types';

// Configure otplib
authenticator.options = {
  digits: OTP_CONFIG.DIGITS,
  step: OTP_CONFIG.STEP,
  window: OTP_CONFIG.WINDOW,
};

/**
 * Generate MFA secret and QR code URL for setup
 */
export function generateMFASecret(email: string): OTPSetupResult {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, OTP_CONFIG.ISSUER, secret);
  
  // Generate QR code URL using Google Charts API
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=${OTP_CONFIG.QR_SIZE}x${OTP_CONFIG.QR_SIZE}&cht=qr&chl=${encodeURIComponent(otpauthUrl)}`;
  
  return { secret, qrCodeUrl, otpauthUrl };
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Generate backup codes
 */
export async function generateBackupCodes(): Promise<BackupCodesResult> {
  const codes: string[] = [];
  const hashedCodes: BackupCode[] = [];
  
  for (let i = 0; i < OTP_CONFIG.BACKUP_CODE_COUNT; i++) {
    // Generate random alphanumeric code
    const code = crypto.randomBytes(OTP_CONFIG.BACKUP_CODE_LENGTH / 2)
      .toString('hex')
      .toUpperCase();
    
    const hashedCode = await hash(code, 10);
    
    codes.push(code);
    hashedCodes.push({
      code: '', // Don't store plain code
      hash: hashedCode,
      used: false,
    });
  }
  
  return { codes, hashedCodes };
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaBackupCodes: true },
  });
  
  if (!user?.mfaBackupCodes) return false;
  
  const backupCodes: BackupCode[] = JSON.parse(user.mfaBackupCodes);
  
  for (let i = 0; i < backupCodes.length; i++) {
    if (!backupCodes[i].used) {
      const isMatch = await compare(code.toUpperCase(), backupCodes[i].hash);
      if (isMatch) {
        // Mark code as used
        backupCodes[i].used = true;
        backupCodes[i].usedAt = new Date();
        
        await prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: JSON.stringify(backupCodes) },
        });
        
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Enable MFA for a user with backup codes
 */
export async function enableMFA(
  userId: string,
  secret: string,
  token: string
): Promise<{ success: boolean; backupCodes?: string[] }> {
  // Verify the token first
  if (!verifyTOTP(secret, token)) {
    return { success: false };
  }
  
  // Generate backup codes
  const { codes, hashedCodes } = await generateBackupCodes();
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: JSON.stringify(hashedCodes),
      mfaFailCount: 0,
      mfaLockedUntil: null,
      requireMfaSetup: false,
    },
  });

  return { success: true, backupCodes: codes };
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      mfaFailCount: 0,
      mfaLockedUntil: null,
    },
  });
}

/**
 * Record OTP failure and handle lockout
 */
export async function recordOTPFailure(userId: string): Promise<OTPVerifyResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaFailCount: true },
  });
  
  const newFailCount = (user?.mfaFailCount ?? 0) + 1;
  
  if (newFailCount >= OTP_CONFIG.MAX_FAIL_ATTEMPTS) {
    const lockedUntil = new Date(
      Date.now() + OTP_CONFIG.LOCK_DURATION_MINUTES * 60 * 1000
    );
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaFailCount: newFailCount,
        mfaLockedUntil: lockedUntil,
      },
    });
    
    return {
      success: false,
      error: 'Account locked due to too many failed attempts',
      remainingAttempts: 0,
      lockedUntil,
    };
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: { mfaFailCount: newFailCount },
  });
  
  return {
    success: false,
    error: 'Invalid OTP code',
    remainingAttempts: OTP_CONFIG.MAX_FAIL_ATTEMPTS - newFailCount,
  };
}

/**
 * Reset OTP failure count on successful verification
 */
export async function resetOTPFailCount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaFailCount: 0,
      mfaLockedUntil: null,
    },
  });
}

/**
 * Check if user is locked out
 */
export async function isUserLocked(userId: string): Promise<{ locked: boolean; until?: Date }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaLockedUntil: true },
  });
  
  if (!user?.mfaLockedUntil) {
    return { locked: false };
  }
  
  if (new Date() > user.mfaLockedUntil) {
    // Lock expired, reset
    await prisma.user.update({
      where: { id: userId },
      data: { mfaLockedUntil: null, mfaFailCount: 0 },
    });
    return { locked: false };
  }
  
  return { locked: true, until: user.mfaLockedUntil };
}

/**
 * Verify MFA for login with lockout check
 */
export async function verifyUserMFA(
  userId: string,
  token: string
): Promise<OTPVerifyResult> {
  // Check if locked
  const lockStatus = await isUserLocked(userId);
  if (lockStatus.locked) {
    return {
      success: false,
      error: 'Account is locked',
      lockedUntil: lockStatus.until,
      remainingAttempts: 0,
    };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true },
  });

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return { success: true }; // MFA not required
  }

  const isValid = verifyTOTP(user.mfaSecret, token);
  
  if (isValid) {
    await resetOTPFailCount(userId);
    return { success: true };
  }
  
  // Try backup code
  const backupValid = await verifyBackupCode(userId, token);
  if (backupValid) {
    await resetOTPFailCount(userId);
    return { success: true };
  }
  
  // Record failure
  return await recordOTPFailure(userId);
}

/**
 * Admin: Reset user's OTP
 */
export async function adminResetOTP(
  targetUserId: string,
  adminUserId: string
): Promise<void> {
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      mfaFailCount: 0,
      mfaLockedUntil: null,
      mfaResetAt: new Date(),
      mfaResetBy: adminUserId,
      requireMfaSetup: true,
    },
  });
}

/**
 * Get user's OTP status
 */
export async function getUserOTPStatus(userId: string): Promise<UserOTPStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled: true,
      mfaBackupCodes: true,
      mfaFailCount: true,
      mfaLockedUntil: true,
      mfaResetAt: true,
      mfaResetBy: true,
      requireMfaSetup: true,
    },
  });
  
  if (!user) return null;
  
  let status: OTPStatus = 'NOT_SETUP';
  
  if (user.mfaLockedUntil && new Date() < user.mfaLockedUntil) {
    status = 'LOCKED';
  } else if (user.requireMfaSetup) {
    status = 'RESET_REQUIRED';
  } else if (user.mfaEnabled) {
    status = 'ENABLED';
  }
  
  // Count remaining backup codes
  let backupCodesRemaining = 0;
  if (user.mfaBackupCodes) {
    const codes: BackupCode[] = JSON.parse(user.mfaBackupCodes);
    backupCodesRemaining = codes.filter(c => !c.used).length;
  }
  
  return {
    enabled: user.mfaEnabled,
    status,
    failCount: user.mfaFailCount,
    lockedUntil: user.mfaLockedUntil,
    lastResetAt: user.mfaResetAt,
    lastResetBy: user.mfaResetBy,
    backupCodesRemaining,
    requireSetup: user.requireMfaSetup,
  };
}

/**
 * Regenerate backup codes for a user
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const { codes, hashedCodes } = await generateBackupCodes();
  
  await prisma.user.update({
    where: { id: userId },
    data: { mfaBackupCodes: JSON.stringify(hashedCodes) },
  });
  
  return codes;
}

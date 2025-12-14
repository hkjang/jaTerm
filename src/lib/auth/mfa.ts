import { authenticator } from 'otplib';
import { prisma } from '@/lib/db';

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
}

/**
 * Generate MFA secret and QR code URL for setup
 */
export function generateMFASecret(email: string): MFASetupResult {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, 'jaTerm SSH Terminal', secret);
  
  // In production, generate actual QR code image
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(otpauth)}`;
  
  return { secret, qrCodeUrl };
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
 * Enable MFA for a user
 */
export async function enableMFA(userId: string, secret: string, token: string): Promise<boolean> {
  // Verify the token first
  if (!verifyTOTP(secret, token)) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
    },
  });

  return true;
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
    },
  });
}

/**
 * Verify MFA for login
 */
export async function verifyUserMFA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true },
  });

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return true; // MFA not required
  }

  return verifyTOTP(user.mfaSecret, token);
}

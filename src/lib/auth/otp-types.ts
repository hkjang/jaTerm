// OTP Types and Configuration
// Enterprise-level OTP management types for jaTerm

export const OTP_CONFIG = {
  // OTP settings
  ISSUER: 'jaTerm SSH Terminal',
  DIGITS: 6,
  STEP: 30, // seconds
  WINDOW: 1, // Allow 1 step before/after for clock skew
  
  // Backup codes
  BACKUP_CODE_COUNT: 10,
  BACKUP_CODE_LENGTH: 8,
  
  // Security settings
  MAX_FAIL_ATTEMPTS: 5,
  LOCK_DURATION_MINUTES: 15,
  
  // QR Code
  QR_SIZE: 200,
} as const;

export type OTPStatus = 
  | 'NOT_SETUP'      // OTP not configured
  | 'PENDING_SETUP'  // Setup initiated, not verified
  | 'ENABLED'        // OTP active
  | 'LOCKED'         // Too many failed attempts
  | 'RESET_REQUIRED'; // Admin reset, needs re-setup

export interface OTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

export interface OTPVerifyResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

export interface BackupCode {
  code: string;
  hash: string;
  used: boolean;
  usedAt?: Date;
}

export interface BackupCodesResult {
  codes: string[];
  hashedCodes: BackupCode[];
}

export interface UserOTPStatus {
  enabled: boolean;
  status: OTPStatus;
  failCount: number;
  lockedUntil: Date | null;
  lastResetAt: Date | null;
  lastResetBy: string | null;
  backupCodesRemaining: number;
  requireSetup: boolean;
}

// Role hierarchy for RBAC
export const ROLE_HIERARCHY = {
  SUPER: 5,
  ADMIN: 4,
  OPERATOR: 3,
  DEVELOPER: 2,
  VIEWER: 1,
  USER: 0,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

export function canManageOTP(role: string): boolean {
  const roleLevel = ROLE_HIERARCHY[role as UserRole] ?? 0;
  return roleLevel >= ROLE_HIERARCHY.ADMIN;
}

export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER';
}

export function mustHaveOTP(role: string): boolean {
  // Admin and Super roles must have OTP enabled
  return isAdminRole(role);
}

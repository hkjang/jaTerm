// OTP API Routes
// GET: Check OTP status
// POST: Setup OTP with QR code
// PUT: Verify and enable OTP
// DELETE: Admin OTP reset

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateMFASecret,
  enableMFA,
  adminResetOTP,
  getUserOTPStatus,
  regenerateBackupCodes,
} from '@/lib/auth/mfa';
import { logAuth, getAuditContext } from '@/lib/audit/audit-logger';
import { canManageOTP } from '@/lib/auth/otp-types';

// Temporary session check (in production, use proper session management)
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const userId = authHeader.replace('Bearer ', '');
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, name: true },
  });
}

// GET: Check OTP status
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requesting for another user (admin only)
    const userId = request.nextUrl.searchParams.get('userId') || user.id;
    
    if (userId !== user.id && !canManageOTP(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = await getUserOTPStatus(userId);
    if (!status) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('OTP status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Setup OTP (generate secret and QR code)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate new MFA secret
    const { secret, qrCodeUrl, otpauthUrl } = generateMFASecret(user.email);

    // Log the setup attempt
    const context = getAuditContext(request);
    await logAuth('OTP_SETUP', user.id, { action: 'initiated' }, context);

    return NextResponse.json({
      secret,
      qrCodeUrl,
      otpauthUrl,
      message: 'Scan the QR code with Google Authenticator and verify with a code',
    });
  } catch (error) {
    console.error('OTP setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Verify and enable OTP
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { secret, code, action } = body;

    const context = getAuditContext(request);

    // Handle backup code regeneration
    if (action === 'regenerate_backup_codes') {
      const newCodes = await regenerateBackupCodes(user.id);
      await logAuth('OTP_SETUP', user.id, { action: 'backup_codes_regenerated' }, context);
      
      return NextResponse.json({
        success: true,
        backupCodes: newCodes,
        message: 'Backup codes regenerated. Save these codes securely.',
      });
    }

    // Verify and enable OTP
    if (!secret || !code) {
      return NextResponse.json(
        { error: 'Secret and verification code required' },
        { status: 400 }
      );
    }

    const result = await enableMFA(user.id, secret, code);

    if (!result.success) {
      await logAuth('OTP_FAILED', user.id, { action: 'setup_verification_failed' }, context);
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    await logAuth('OTP_VERIFY', user.id, { action: 'setup_completed' }, context);

    return NextResponse.json({
      success: true,
      backupCodes: result.backupCodes,
      message: 'OTP enabled successfully. Save your backup codes securely.',
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Admin OTP reset
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageOTP(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset OTP
    await adminResetOTP(userId, admin.id);

    // Log the reset
    const context = getAuditContext(request);
    await logAuth('OTP_RESET', userId, {
      action: 'admin_reset',
      resetBy: admin.id,
      adminEmail: admin.email,
    }, context);

    return NextResponse.json({
      success: true,
      message: 'OTP reset successfully. User must set up OTP on next login.',
    });
  } catch (error) {
    console.error('OTP reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

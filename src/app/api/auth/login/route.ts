// Login API Route
// Handles user authentication with OTP verification

import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { verifyUserMFA, isUserLocked } from '@/lib/auth/mfa';
import { logAuth, getAuditContext } from '@/lib/audit/audit-logger';
import { mustHaveOTP } from '@/lib/auth/otp-types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, mfaCode } = await request.json();
    const context = getAuditContext(request);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        requireMfaSetup: true,
        mfaLockedUntil: true,
        loginFailCount: true,
      },
    });

    if (!user) {
      await logAuth('LOGIN_FAILED', '', { reason: 'user_not_found', email }, context);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      await logAuth('LOGIN_FAILED', user.id, { reason: 'account_inactive' }, context);
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Check if account is locked
    const lockStatus = await isUserLocked(user.id);
    if (lockStatus.locked) {
      return NextResponse.json(
        { error: 'Account is locked', locked: true, lockedUntil: lockStatus.until },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      // Increment login fail count
      await prisma.user.update({
        where: { id: user.id },
        data: { loginFailCount: { increment: 1 } },
      });
      
      await logAuth('LOGIN_FAILED', user.id, { reason: 'invalid_password' }, context);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if MFA is required but not set up
    if (user.requireMfaSetup || (mustHaveOTP(user.role) && !user.mfaEnabled)) {
      return NextResponse.json(
        { 
          requireMfaSetup: true, 
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        { status: 401 }
      );
    }

    // If MFA is enabled, verify OTP
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return NextResponse.json(
          { requireMfa: true, userId: user.id },
          { status: 401 }
        );
      }

      const mfaResult = await verifyUserMFA(user.id, mfaCode);
      
      if (!mfaResult.success) {
        await logAuth('OTP_FAILED', user.id, { 
          remainingAttempts: mfaResult.remainingAttempts 
        }, context);
        
        return NextResponse.json(
          { 
            error: mfaResult.error, 
            remainingAttempts: mfaResult.remainingAttempts,
            locked: !!mfaResult.lockedUntil,
            lockedUntil: mfaResult.lockedUntil,
          },
          { status: 401 }
        );
      }
    }

    // Update login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: context.ipAddress,
        loginFailCount: 0,
      },
    });

    await logAuth('LOGIN', user.id, { 
      method: user.mfaEnabled ? 'password+otp' : 'password' 
    }, context);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

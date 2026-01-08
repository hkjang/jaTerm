// MFA Settings API Routes
// Admin management of system-wide MFA policy

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { 
  getSystemMFASettings, 
  updateSystemMFASettings 
} from '@/lib/auth/mfa';
import { isAdminRole } from '@/lib/auth/otp-types';

// Helper to get current admin user (same pattern as other admin APIs)
async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const userId = authHeader.replace('Bearer ', '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, name: true },
  });
  
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

/**
 * GET /api/admin/settings/mfa
 * Get current system MFA policy settings
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await getSystemMFASettings();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching MFA settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MFA settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/mfa
 * Update system MFA policy settings
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate policy value
    const validPolicies = ['DISABLED', 'OPTIONAL', 'ROLE_BASED', 'REQUIRED'];
    if (body.policy && !validPolicies.includes(body.policy)) {
      return NextResponse.json(
        { error: 'Invalid MFA policy value' },
        { status: 400 }
      );
    }

    // Validate requiredRoles
    const validRoles = ['SUPER', 'ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER', 'USER'];
    if (body.requiredRoles && Array.isArray(body.requiredRoles)) {
      for (const role of body.requiredRoles) {
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: `Invalid role: ${role}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate gracePeriodDays
    if (body.gracePeriodDays !== undefined) {
      const days = Number(body.gracePeriodDays);
      if (isNaN(days) || days < 0 || days > 365) {
        return NextResponse.json(
          { error: 'Grace period must be between 0 and 365 days' },
          { status: 400 }
        );
      }
      body.gracePeriodDays = days;
    }

    // Validate enforcementDate
    if (body.enforcementDate) {
      const date = new Date(body.enforcementDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid enforcement date' },
          { status: 400 }
        );
      }
      body.enforcementDate = date;
    }

    const updatedSettings = await updateSystemMFASettings(
      body,
      admin.id
    );

    return NextResponse.json({
      message: 'MFA settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating MFA settings:', error);
    return NextResponse.json(
      { error: 'Failed to update MFA settings' },
      { status: 500 }
    );
  }
}

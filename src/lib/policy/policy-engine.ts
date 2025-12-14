import { prisma } from '@/lib/db';

// Local type definitions (matching Prisma schema if exists)
export type Role = 'ADMIN' | 'OPERATOR' | 'DEVELOPER' | 'VIEWER' | 'USER';
export type Environment = 'PROD' | 'STAGE' | 'DEV';

export interface AccessRequest {
  userId: string;
  userRole: Role;
  serverId: string;
  clientIp?: string;
  purpose?: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  requiresApproval: boolean;
  policyId?: string;
  restrictions?: {
    commandMode?: 'BLACKLIST' | 'WHITELIST';
    readOnly?: boolean;
  };
}

/**
 * Policy Engine - Makes access control decisions
 */
export class PolicyEngine {
  
  /**
   * Evaluate access request against policies
   */
  async evaluate(request: AccessRequest): Promise<AccessDecision> {
    // Get server information
    const server = await prisma.server.findUnique({
      where: { id: request.serverId },
      include: {
        policies: {
          include: {
            policy: true,
          },
        },
      },
    });

    if (!server) {
      return {
        allowed: false,
        reason: 'Server not found',
        requiresApproval: false,
      };
    }

    if (!server.isActive) {
      return {
        allowed: false,
        reason: 'Server is inactive',
        requiresApproval: false,
      };
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user || !user.isActive) {
      return {
        allowed: false,
        reason: 'User not found or inactive',
        requiresApproval: false,
      };
    }

    // Admin users have full access
    if (user.role === 'ADMIN') {
      return {
        allowed: true,
        requiresApproval: false,
      };
    }

    // Get applicable policies sorted by priority
    const policies = server.policies
      .map((ps) => ps.policy)
      .filter((p) => p.isActive)
      .sort((a, b) => b.priority - a.priority);

    if (policies.length === 0) {
      // No policies - deny by default
      return {
        allowed: false,
        reason: 'No access policy configured for this server',
        requiresApproval: false,
      };
    }

    // Evaluate each policy
    for (const policy of policies) {
      const decision = this.evaluatePolicy(policy, request, user.role as Role);
      if (decision !== null) {
        return decision;
      }
    }

    // Default deny
    return {
      allowed: false,
      reason: 'No matching policy found',
      requiresApproval: false,
    };
  }

  /**
   * Evaluate a single policy
   */
  private evaluatePolicy(
    policy: any,
    request: AccessRequest,
    userRole: Role
  ): AccessDecision | null {
    // Check role-based access
    if (policy.allowedRoles) {
      const allowedRoles: string[] = JSON.parse(policy.allowedRoles);
      if (!allowedRoles.includes(userRole)) {
        return null; // Policy doesn't apply to this role
      }
    }

    // Check time-based restrictions
    if (!this.isWithinAllowedTime(policy)) {
      return {
        allowed: false,
        reason: 'Access not allowed at this time',
        requiresApproval: false,
        policyId: policy.id,
      };
    }

    // Check if approval is required
    if (policy.requireApproval) {
      return {
        allowed: false,
        reason: 'Access requires prior approval',
        requiresApproval: true,
        policyId: policy.id,
      };
    }

    // Access granted
    return {
      allowed: true,
      requiresApproval: false,
      policyId: policy.id,
      restrictions: {
        commandMode: policy.commandMode,
      },
    };
  }

  /**
   * Check if current time is within allowed time window
   */
  private isWithinAllowedTime(policy: any): boolean {
    if (!policy.allowedDays && !policy.allowedStartTime) {
      return true; // No time restrictions
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check allowed days
    if (policy.allowedDays) {
      const allowedDays: number[] = JSON.parse(policy.allowedDays);
      if (!allowedDays.includes(currentDay)) {
        return false;
      }
    }

    // Check allowed time window
    if (policy.allowedStartTime && policy.allowedEndTime) {
      if (currentTime < policy.allowedStartTime || currentTime > policy.allowedEndTime) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user has pending approval for server
   */
  async hasPendingApproval(userId: string, serverId: string): Promise<boolean> {
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
   * Get environment access level for a role
   */
  getEnvironmentAccessLevel(role: Role): Environment[] {
    switch (role) {
      case 'ADMIN':
        return ['PROD', 'STAGE', 'DEV'];
      case 'OPERATOR':
        return ['PROD', 'STAGE', 'DEV'];
      case 'DEVELOPER':
        return ['STAGE', 'DEV'];
      case 'VIEWER':
        return ['DEV'];
      case 'USER':
        return [];
      default:
        return [];
    }
  }
}

// Export singleton instance
export const policyEngine = new PolicyEngine();

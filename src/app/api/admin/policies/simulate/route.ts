// Policy Simulation API
// Tests access decisions without actually connecting

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRole } from '@/lib/auth/otp-types';

// Helper to get current admin user
async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const userId = authHeader.replace('Bearer ', '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

// POST: Simulate policy evaluation
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, serverId, simulatedTime } = body;

    if (!userId || !serverId) {
      return NextResponse.json(
        { error: 'User ID and Server ID are required' },
        { status: 400 }
      );
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json({
        allowed: false,
        reason: '사용자를 찾을 수 없습니다.',
        requiresApproval: false,
        details: [],
      });
    }

    if (!user.isActive) {
      return NextResponse.json({
        allowed: false,
        reason: '비활성 사용자입니다.',
        requiresApproval: false,
        user: { name: user.name, email: user.email, role: user.role },
        details: [{ type: 'error', message: '사용자 계정이 비활성화되어 있습니다.' }],
      });
    }

    // Get server information
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        policies: {
          include: {
            policy: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json({
        allowed: false,
        reason: '서버를 찾을 수 없습니다.',
        requiresApproval: false,
        user: { name: user.name, email: user.email, role: user.role },
        details: [],
      });
    }

    if (!server.isActive) {
      return NextResponse.json({
        allowed: false,
        reason: '서버가 비활성 상태입니다.',
        requiresApproval: false,
        user: { name: user.name, email: user.email, role: user.role },
        server: { name: server.name, environment: server.environment },
        details: [{ type: 'error', message: '대상 서버가 비활성화되어 있습니다.' }],
      });
    }

    // Admin users have full access
    if (user.role === 'ADMIN') {
      return NextResponse.json({
        allowed: true,
        reason: '관리자 권한으로 접근 허용',
        requiresApproval: false,
        user: { name: user.name, email: user.email, role: user.role },
        server: { name: server.name, environment: server.environment },
        details: [{ type: 'success', message: 'ADMIN 역할은 모든 서버에 접근 가능합니다.' }],
      });
    }

    // Parse simulation time
    const evalTime = simulatedTime ? new Date(simulatedTime) : new Date();
    const currentDay = evalTime.getDay();
    const currentTimeStr = `${evalTime.getHours().toString().padStart(2, '0')}:${evalTime.getMinutes().toString().padStart(2, '0')}`;

    // Get applicable policies sorted by priority
    const policies = server.policies
      .map((ps) => ps.policy)
      .filter((p) => p.isActive)
      .sort((a, b) => b.priority - a.priority);

    const details: Array<{ type: string; message: string; policyName?: string }> = [];

    if (policies.length === 0) {
      details.push({ type: 'warning', message: '이 서버에 적용된 활성 정책이 없습니다.' });
      return NextResponse.json({
        allowed: false,
        reason: '적용된 정책 없음 (기본: 거부)',
        requiresApproval: false,
        user: { name: user.name, email: user.email, role: user.role },
        server: { name: server.name, environment: server.environment },
        details,
        evaluatedPolicies: [],
      });
    }

    details.push({ type: 'info', message: `${policies.length}개의 정책 평가 중...` });

    const evaluatedPolicies: Array<{
      name: string;
      priority: number;
      matched: boolean;
      matchReason: string;
    }> = [];

    for (const policy of policies) {
      const allowedRoles: string[] = policy.allowedRoles ? JSON.parse(policy.allowedRoles) : [];
      const allowedDays: number[] = policy.allowedDays ? JSON.parse(policy.allowedDays) : [];

      // Check role
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        evaluatedPolicies.push({
          name: policy.name,
          priority: policy.priority,
          matched: false,
          matchReason: `역할 불일치 (필요: ${allowedRoles.join(', ')})`,
        });
        continue;
      }

      // Check day
      if (allowedDays.length > 0 && !allowedDays.includes(currentDay)) {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        evaluatedPolicies.push({
          name: policy.name,
          priority: policy.priority,
          matched: false,
          matchReason: `요일 불일치 (허용: ${allowedDays.map(d => dayNames[d]).join(', ')})`,
        });
        continue;
      }

      // Check time
      if (policy.allowedStartTime && policy.allowedEndTime) {
        if (currentTimeStr < policy.allowedStartTime || currentTimeStr > policy.allowedEndTime) {
          evaluatedPolicies.push({
            name: policy.name,
            priority: policy.priority,
            matched: false,
            matchReason: `시간 불일치 (허용: ${policy.allowedStartTime} - ${policy.allowedEndTime})`,
          });
          continue;
        }
      }

      // Policy matches
      evaluatedPolicies.push({
        name: policy.name,
        priority: policy.priority,
        matched: true,
        matchReason: '모든 조건 충족',
      });

      if (policy.requireApproval) {
        // Check for existing approval
        const hasApproval = await prisma.approvalRequest.findFirst({
          where: {
            requesterId: userId,
            serverId,
            status: 'APPROVED',
            expiresAt: { gt: evalTime },
          },
        });

        if (hasApproval) {
          details.push({
            type: 'success',
            message: '승인된 접근 요청이 있습니다.',
            policyName: policy.name,
          });
          return NextResponse.json({
            allowed: true,
            reason: '사전 승인된 접근',
            requiresApproval: false,
            policyId: policy.id,
            policyName: policy.name,
            user: { name: user.name, email: user.email, role: user.role },
            server: { name: server.name, environment: server.environment },
            details,
            evaluatedPolicies,
            restrictions: { commandMode: policy.commandMode },
          });
        }

        details.push({
          type: 'warning',
          message: '이 정책은 사전 승인이 필요합니다.',
          policyName: policy.name,
        });
        return NextResponse.json({
          allowed: false,
          reason: '사전 승인 필요',
          requiresApproval: true,
          policyId: policy.id,
          policyName: policy.name,
          user: { name: user.name, email: user.email, role: user.role },
          server: { name: server.name, environment: server.environment },
          details,
          evaluatedPolicies,
        });
      }

      // Access granted
      details.push({
        type: 'success',
        message: `정책 "${policy.name}"에 의해 접근이 허용됩니다.`,
        policyName: policy.name,
      });
      return NextResponse.json({
        allowed: true,
        reason: '정책에 의해 허용',
        requiresApproval: false,
        policyId: policy.id,
        policyName: policy.name,
        user: { name: user.name, email: user.email, role: user.role },
        server: { name: server.name, environment: server.environment },
        details,
        evaluatedPolicies,
        restrictions: { commandMode: policy.commandMode },
      });
    }

    // No matching policy
    details.push({ type: 'error', message: '일치하는 정책이 없습니다.' });
    return NextResponse.json({
      allowed: false,
      reason: '일치하는 정책 없음',
      requiresApproval: false,
      user: { name: user.name, email: user.email, role: user.role },
      server: { name: server.name, environment: server.environment },
      details,
      evaluatedPolicies,
    });
  } catch (error) {
    console.error('Policy simulation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

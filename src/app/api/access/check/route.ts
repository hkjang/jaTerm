import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { policyEngine } from '@/lib/policy';

// POST /api/access/check - Check if user can access a server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const decision = await policyEngine.evaluate({
      userId: body.userId,
      userRole: body.userRole,
      serverId: body.serverId,
      clientIp: body.clientIp,
      purpose: body.purpose,
    });

    return NextResponse.json(decision);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
}

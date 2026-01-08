// Admin Approvals API Routes
// Approval request management

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAudit, getAuditContext } from '@/lib/audit/audit-logger';
import { isAdminRole } from '@/lib/auth/otp-types';

// Helper to get current admin user
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

// GET: List approval requests
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, email: true, role: true } },
          approver: { select: { id: true, name: true, email: true } },
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.approvalRequest.count({ where }),
    ]);

    // Format response
    const requestsFormatted = requests.map(req => ({
      id: req.id,
      requester: {
        name: req.requester.name || req.requester.email.split('@')[0],
        email: req.requester.email,
        role: req.requester.role,
      },
      server: {
        name: 'Server',
        hostname: '',
        environment: 'DEV',
      },
      purpose: req.purpose,
      requestType: 'PRIOR',
      status: req.status,
      approver: req.approver ? {
        name: req.approver.name || req.approver.email.split('@')[0],
        email: req.approver.email,
      } : null,
      requestedAt: req.createdAt,
      expiresAt: req.expiresAt,
      approvedAt: req.approvedAt,
      notes: req.notes,
    }));

    return NextResponse.json({
      requests: requestsFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List approvals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Approve or reject request
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { email: true } },
      },
    });

    if (!approvalRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (approvalRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    const context = getAuditContext(request);

    if (action === 'approve') {
      await prisma.approvalRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approverId: admin.id,
          approvedAt: new Date(),
          notes: notes || null,
        },
      });

      await logAudit({
        action: 'APPROVAL_APPROVED',
        resource: 'ApprovalRequest',
        resourceId: id,
        userId: admin.id,
        details: { 
          userEmail: approvalRequest.requester.email,
        },
        ...context,
      });

      return NextResponse.json({ success: true, action: 'approved' });
    }

    if (action === 'reject') {
      await prisma.approvalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approverId: admin.id,
          approvedAt: new Date(),
          notes: notes || null,
        },
      });

      await logAudit({
        action: 'APPROVAL_REJECTED',
        resource: 'ApprovalRequest',
        resourceId: id,
        userId: admin.id,
        details: { 
          userEmail: approvalRequest.requester.email,
          reason: notes,
        },
        ...context,
      });

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Update approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

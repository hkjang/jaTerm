// Admin Credential by ID - GET/PUT/DELETE
import { NextRequest, NextResponse } from 'next/server';

let credentials = [
  { id: '1', name: 'prod-db-root', type: 'PASSWORD', username: 'root', target: 'prod-db-*.internal', status: 'ACTIVE', createdAt: '2025-06-01', expiresAt: '2026-06-01', lastUsed: '2026-01-10', usedBy: ['김관리자', '이DBA'], rotationEnabled: true, rotationDays: 90, updatedAt: new Date().toISOString() },
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cred = credentials.find(c => c.id === id);
    if (!cred) {
      return NextResponse.json({ success: false, error: 'Credential not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cred });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch credential' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const index = credentials.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Credential not found' }, { status: 404 });
    }

    credentials[index] = { ...credentials[index], ...body, id, updatedAt: new Date().toISOString() };
    return NextResponse.json({ success: true, data: credentials[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update credential' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const index = credentials.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Credential not found' }, { status: 404 });
    }
    credentials.splice(index, 1);
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete credential' }, { status: 500 });
  }
}

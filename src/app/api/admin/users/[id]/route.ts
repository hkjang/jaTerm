// Admin User by ID - GET/PUT/DELETE
import { NextRequest, NextResponse } from 'next/server';

let users = [
  { id: '1', email: 'admin@company.com', name: '김관리자', role: 'ADMIN', department: '인프라팀', status: 'ACTIVE', mfaEnabled: true, lastLogin: '2026-01-10 14:30', createdAt: '2024-01-01', servers: 15, sessions: 45 },
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = users.find(u => u.id === id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    users[index] = { ...users[index], ...body, id };
    return NextResponse.json({ success: true, data: users[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    users.splice(index, 1);
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}

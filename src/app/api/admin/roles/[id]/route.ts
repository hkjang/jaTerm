// Admin Role by ID - GET/PUT/DELETE
import { NextRequest, NextResponse } from 'next/server';

let roles = [
  { id: '1', name: 'ADMIN', displayName: '관리자', description: '전체 시스템 관리 권한', permissions: ['*'], userCount: 3, color: '#ef4444', isSystem: true, createdAt: '2024-01-01' },
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const role = roles.find(r => r.id === id);
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    if (roles[index].isSystem && body.name !== roles[index].name) {
      return NextResponse.json({ success: false, error: 'Cannot modify system role name' }, { status: 400 });
    }

    roles[index] = { ...roles[index], ...body, id };
    return NextResponse.json({ success: true, data: roles[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    if (roles[index].isSystem) {
      return NextResponse.json({ success: false, error: 'Cannot delete system role' }, { status: 400 });
    }

    if (roles[index].userCount > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete role with assigned users' }, { status: 400 });
    }

    roles.splice(index, 1);
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 });
  }
}

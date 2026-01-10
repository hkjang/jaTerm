// Admin Roles API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';

let roles = [
  { id: '1', name: 'ADMIN', displayName: '관리자', description: '전체 시스템 관리 권한', permissions: ['*'], userCount: 3, color: '#ef4444', isSystem: true, createdAt: '2024-01-01' },
  { id: '2', name: 'OPERATOR', displayName: '운영자', description: '서버 운영 및 모니터링', permissions: ['servers:read', 'servers:connect', 'sessions:read', 'sessions:manage', 'recordings:read'], userCount: 8, color: '#f59e0b', isSystem: true, createdAt: '2024-01-01' },
  { id: '3', name: 'DEVELOPER', displayName: '개발자', description: '개발/스테이징 서버 접근', permissions: ['servers:read', 'servers:connect_dev', 'servers:connect_staging', 'sessions:read_own'], userCount: 25, color: '#10b981', isSystem: true, createdAt: '2024-01-01' },
  { id: '4', name: 'VIEWER', displayName: '열람자', description: '읽기 전용 접근', permissions: ['servers:read', 'sessions:read', 'recordings:read'], userCount: 12, color: '#6b7280', isSystem: true, createdAt: '2024-01-01' },
  { id: '5', name: 'DBA', displayName: 'DBA', description: '데이터베이스 전용 접근', permissions: ['servers:read', 'servers:connect_db', 'sessions:manage_db'], userCount: 4, color: '#8b5cf6', isSystem: false, createdAt: '2025-06-01' },
  { id: '6', name: 'SECURITY', displayName: '보안팀', description: '보안 감사 및 모니터링', permissions: ['audit:read', 'recordings:read', 'sessions:read', 'alerts:read'], userCount: 5, color: '#3b82f6', isSystem: false, createdAt: '2025-03-01' },
];

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: roles, total: roles.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, description = '', permissions = [], color = '#6b7280' } = body;

    if (!name || !displayName) {
      return NextResponse.json({ success: false, error: 'Name and displayName are required' }, { status: 400 });
    }

    if (roles.some(r => r.name === name)) {
      return NextResponse.json({ success: false, error: 'Role with this name already exists' }, { status: 400 });
    }

    const newRole = {
      id: String(Date.now()),
      name: name.toUpperCase(),
      displayName,
      description,
      permissions,
      userCount: 0,
      color,
      isSystem: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    roles.push(newRole);
    return NextResponse.json({ success: true, data: newRole }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 });
  }
}

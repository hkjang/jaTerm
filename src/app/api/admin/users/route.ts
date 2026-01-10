// Admin Users API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';

let users = [
  { id: '1', email: 'admin@company.com', name: '김관리자', role: 'ADMIN', department: '인프라팀', status: 'ACTIVE', mfaEnabled: true, lastLogin: '2026-01-10 14:30', createdAt: '2024-01-01', servers: 15, sessions: 45 },
  { id: '2', email: 'dev@company.com', name: '이개발', role: 'DEVELOPER', department: '개발팀', status: 'ACTIVE', mfaEnabled: true, lastLogin: '2026-01-10 09:15', createdAt: '2024-06-01', servers: 8, sessions: 234 },
  { id: '3', email: 'ops@company.com', name: '박운영', role: 'OPERATOR', department: '운영팀', status: 'ACTIVE', mfaEnabled: true, lastLogin: '2026-01-10 12:00', createdAt: '2024-03-15', servers: 12, sessions: 178 },
  { id: '4', email: 'viewer@company.com', name: '최감사', role: 'VIEWER', department: '감사팀', status: 'ACTIVE', mfaEnabled: false, lastLogin: '2026-01-09 16:30', createdAt: '2025-01-01', servers: 5, sessions: 23 },
  { id: '5', email: 'newuser@company.com', name: '정신입', role: 'DEVELOPER', department: '개발팀', status: 'PENDING', mfaEnabled: false, lastLogin: null, createdAt: '2026-01-08', servers: 0, sessions: 0 },
  { id: '6', email: 'blocked@company.com', name: '강차단', role: 'DEVELOPER', department: '개발팀', status: 'BLOCKED', mfaEnabled: false, lastLogin: '2025-12-01', createdAt: '2024-06-01', servers: 0, sessions: 156 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    let filtered = [...users];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (role) filtered = filtered.filter(u => u.role === role);
    if (status) filtered = filtered.filter(u => u.status === status);
    if (department) filtered = filtered.filter(u => u.department === department);

    return NextResponse.json({ success: true, data: filtered, total: filtered.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role = 'DEVELOPER', department = '' } = body;

    if (!email || !name) {
      return NextResponse.json({ success: false, error: 'Email and name are required' }, { status: 400 });
    }

    if (users.some(u => u.email === email)) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
    }

    const newUser = {
      id: String(Date.now()),
      email,
      name,
      role,
      department,
      status: 'PENDING',
      mfaEnabled: false,
      lastLogin: null,
      createdAt: new Date().toISOString().slice(0, 10),
      servers: 0,
      sessions: 0,
    };

    users.unshift(newUser);
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}

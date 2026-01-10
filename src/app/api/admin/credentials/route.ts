// Admin Credentials/Secrets API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';

let credentials = [
  { id: '1', name: 'prod-db-root', type: 'PASSWORD', username: 'root', target: 'prod-db-*.internal', status: 'ACTIVE', createdAt: '2025-06-01', expiresAt: '2026-06-01', lastUsed: '2026-01-10', usedBy: ['김관리자', '이DBA'], rotationEnabled: true, rotationDays: 90, updatedAt: new Date().toISOString() },
  { id: '2', name: 'deploy-key-prod', type: 'SSH_KEY', target: 'prod-*.internal', status: 'ACTIVE', createdAt: '2025-07-15', lastUsed: '2026-01-10', usedBy: ['배포 시스템'], rotationEnabled: false, updatedAt: new Date().toISOString() },
  { id: '3', name: 'aws-access-key', type: 'API_KEY', target: 'AWS Console', status: 'EXPIRING_SOON', createdAt: '2025-01-15', expiresAt: '2026-01-15', lastUsed: '2026-01-09', usedBy: ['인프라팀'], rotationEnabled: true, rotationDays: 365, updatedAt: new Date().toISOString() },
  { id: '4', name: 'api-ssl-cert', type: 'CERTIFICATE', target: 'api.company.com', status: 'ACTIVE', createdAt: '2025-08-01', expiresAt: '2026-08-01', lastUsed: '2026-01-10', usedBy: ['API 서버'], rotationEnabled: true, rotationDays: 365, updatedAt: new Date().toISOString() },
  { id: '5', name: 'github-deploy-token', type: 'TOKEN', target: 'GitHub Actions', status: 'ACTIVE', createdAt: '2025-11-01', lastUsed: '2026-01-10', usedBy: ['CI/CD'], rotationEnabled: false, updatedAt: new Date().toISOString() },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let filtered = [...credentials];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(s) || c.target.toLowerCase().includes(s));
    }
    if (type) filtered = filtered.filter(c => c.type === type);
    if (status) filtered = filtered.filter(c => c.status === status);

    return NextResponse.json({ success: true, data: filtered, total: filtered.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, username, target, expiresAt, rotationEnabled = false, rotationDays } = body;

    if (!name || !type || !target) {
      return NextResponse.json({ success: false, error: 'Name, type, and target are required' }, { status: 400 });
    }

    const newCred = {
      id: String(Date.now()),
      name,
      type,
      username,
      target,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10),
      expiresAt,
      lastUsed: undefined,
      usedBy: [],
      rotationEnabled,
      rotationDays,
      updatedAt: new Date().toISOString(),
    };

    credentials.unshift(newCred);
    return NextResponse.json({ success: true, data: newCred }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create credential' }, { status: 500 });
  }
}

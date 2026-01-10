// Admin SSH Keys API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';

let sshKeys = [
  { id: '1', name: 'deploy-key-prod', type: 'ED25519', bits: 256, fingerprint: 'SHA256:aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5', status: 'ACTIVE', owner: '배포시스템', createdAt: '2025-06-01', lastUsed: '2026-01-10', servers: ['prod-*', 'staging-*'], comment: 'Production deployment key' },
  { id: '2', name: 'admin-key-kim', type: 'RSA', bits: 4096, fingerprint: 'SHA256:1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0', status: 'ACTIVE', owner: '김관리자', createdAt: '2025-03-15', lastUsed: '2026-01-10', expiresAt: '2026-03-15', servers: ['*'], comment: 'Admin access key' },
  { id: '3', name: 'dev-key-lee', type: 'ED25519', bits: 256, fingerprint: 'SHA256:xY1zA2bC3dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3', status: 'ACTIVE', owner: '이개발', createdAt: '2025-08-20', lastUsed: '2026-01-09', servers: ['dev-*', 'staging-*'] },
  { id: '4', name: 'ci-cd-runner', type: 'ECDSA', bits: 521, fingerprint: 'SHA256:mN4oP5qR6sT7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6', status: 'ACTIVE', owner: 'GitHub Actions', createdAt: '2025-11-01', lastUsed: '2026-01-10', servers: ['build-*'], comment: 'CI/CD pipeline key' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let filtered = [...sshKeys];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(k => k.name.toLowerCase().includes(s) || k.owner.toLowerCase().includes(s));
    }
    if (status) filtered = filtered.filter(k => k.status === status);
    if (type) filtered = filtered.filter(k => k.type === type);

    return NextResponse.json({ success: true, data: filtered, total: filtered.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch SSH keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type = 'ED25519', comment, servers = [] } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const fp = 'SHA256:' + Array.from({length: 43}, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*62)]).join('');
    const newKey = {
      id: String(Date.now()),
      name,
      type,
      bits: type === 'ED25519' ? 256 : type === 'ECDSA' ? 521 : 4096,
      fingerprint: fp,
      status: 'ACTIVE',
      owner: 'admin',
      createdAt: new Date().toISOString().slice(0, 10),
      servers,
      comment,
    };

    sshKeys.unshift(newKey);
    return NextResponse.json({ success: true, data: newKey }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create SSH key' }, { status: 500 });
  }
}

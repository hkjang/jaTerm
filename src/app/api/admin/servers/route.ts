// Admin Servers API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, this would be Prisma or another DB
let servers = [
  { id: '1', name: 'prod-db-01', hostname: 'prod-db-01.internal', ip: '10.0.1.10', port: 22, type: 'DATABASE', status: 'ONLINE', environment: 'PRODUCTION', group: 'Database', cpu: 45, memory: 72, disk: 68, lastSeen: new Date().toISOString(), tags: ['postgresql', 'primary'], createdAt: '2025-06-01', updatedAt: new Date().toISOString() },
  { id: '2', name: 'prod-api-01', hostname: 'prod-api-01.internal', ip: '10.0.1.20', port: 22, type: 'LINUX', status: 'ONLINE', environment: 'PRODUCTION', group: 'API', cpu: 32, memory: 58, disk: 45, lastSeen: new Date().toISOString(), tags: ['node', 'api'], createdAt: '2025-06-01', updatedAt: new Date().toISOString() },
  { id: '3', name: 'prod-web-01', hostname: 'prod-web-01.internal', ip: '10.0.1.30', port: 22, type: 'LINUX', status: 'WARNING', environment: 'PRODUCTION', group: 'Web', cpu: 85, memory: 78, disk: 52, lastSeen: new Date().toISOString(), tags: ['nginx', 'frontend'], createdAt: '2025-06-01', updatedAt: new Date().toISOString() },
  { id: '4', name: 'staging-api-01', hostname: 'staging-api-01.internal', ip: '10.0.2.20', port: 22, type: 'LINUX', status: 'ONLINE', environment: 'STAGING', group: 'API', cpu: 15, memory: 35, disk: 28, lastSeen: new Date().toISOString(), tags: ['staging'], createdAt: '2025-07-01', updatedAt: new Date().toISOString() },
  { id: '5', name: 'prod-k8s-master', hostname: 'k8s-master.internal', ip: '10.0.1.100', port: 22, type: 'CONTAINER', status: 'ONLINE', environment: 'PRODUCTION', group: 'Kubernetes', cpu: 28, memory: 45, disk: 38, lastSeen: new Date().toISOString(), tags: ['k8s', 'master'], createdAt: '2025-08-01', updatedAt: new Date().toISOString() },
];

// GET - List all servers with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const environment = searchParams.get('environment');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let filtered = [...servers];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(srv => 
        srv.name.toLowerCase().includes(s) ||
        srv.hostname.toLowerCase().includes(s) ||
        srv.ip.includes(s) ||
        srv.tags.some(t => t.toLowerCase().includes(s))
      );
    }

    if (environment && environment !== 'ALL') {
      filtered = filtered.filter(srv => srv.environment === environment);
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter(srv => srv.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);

    return NextResponse.json({ success: true, data: paginatedData, total, page, limit });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch servers' }, { status: 500 });
  }
}

// POST - Create new server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hostname, ip, port = 22, type = 'LINUX', environment = 'DEVELOPMENT', group, tags = [] } = body;

    if (!name || !hostname || !ip) {
      return NextResponse.json({ success: false, error: 'Name, hostname, and IP are required' }, { status: 400 });
    }

    // Check for duplicate
    if (servers.some(s => s.name === name || s.ip === ip)) {
      return NextResponse.json({ success: false, error: 'Server with this name or IP already exists' }, { status: 400 });
    }

    const newServer = {
      id: String(Date.now()),
      name,
      hostname,
      ip,
      port,
      type,
      status: 'ONLINE',
      environment,
      group: group || undefined,
      cpu: 0,
      memory: 0,
      disk: 0,
      lastSeen: new Date().toISOString(),
      tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    servers.unshift(newServer);

    return NextResponse.json({ success: true, data: newServer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create server' }, { status: 500 });
  }
}

// DELETE bulk
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: 'IDs array is required' }, { status: 400 });
    }

    const before = servers.length;
    servers = servers.filter(s => !ids.includes(s.id));
    const deleted = before - servers.length;

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete servers' }, { status: 500 });
  }
}

// Admin Server by ID - GET/PUT/DELETE
import { NextRequest, NextResponse } from 'next/server';

// This would be shared with route.ts in production via a service layer
let servers = [
  { id: '1', name: 'prod-db-01', hostname: 'prod-db-01.internal', ip: '10.0.1.10', port: 22, type: 'DATABASE', status: 'ONLINE', environment: 'PRODUCTION', group: 'Database', cpu: 45, memory: 72, disk: 68, lastSeen: new Date().toISOString(), tags: ['postgresql', 'primary'], createdAt: '2025-06-01', updatedAt: new Date().toISOString() },
  { id: '2', name: 'prod-api-01', hostname: 'prod-api-01.internal', ip: '10.0.1.20', port: 22, type: 'LINUX', status: 'ONLINE', environment: 'PRODUCTION', group: 'API', cpu: 32, memory: 58, disk: 45, lastSeen: new Date().toISOString(), tags: ['node', 'api'], createdAt: '2025-06-01', updatedAt: new Date().toISOString() },
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get server by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const server = servers.find(s => s.id === id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: server });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch server' }, { status: 500 });
  }
}

// PUT - Update server
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const index = servers.findIndex(s => s.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    const updated = {
      ...servers[index],
      ...body,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    servers[index] = updated;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update server' }, { status: 500 });
  }
}

// DELETE - Remove server
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const index = servers.findIndex(s => s.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    servers.splice(index, 1);

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete server' }, { status: 500 });
  }
}

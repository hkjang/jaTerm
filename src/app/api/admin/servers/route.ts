// Admin Servers API Routes
// Full CRUD for server management

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logCreate, logUpdate, logDelete, getAuditContext } from '@/lib/audit/audit-logger';
import { isAdminRole } from '@/lib/auth/otp-types';

// Helper to get current admin user
async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const userId = authHeader.replace('Bearer ', '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

// GET: List all servers with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const environment = searchParams.get('environment') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    
    if (environment) {
      where.environment = environment;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { hostname: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [servers, total] = await Promise.all([
      prisma.server.findMany({
        where,
        select: {
          id: true,
          name: true,
          hostname: true,
          port: true,
          username: true,
          authType: true,
          environment: true,
          description: true,
          tags: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { terminalSessions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.server.count({ where }),
    ]);

    const serversWithStats = servers.map(server => ({
      ...server,
      tags: server.tags ? JSON.parse(server.tags) : [],
      sessionCount: server._count.terminalSessions,
    }));

    return NextResponse.json({
      servers: serversWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List servers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new server
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      hostname, 
      port = 22, 
      username, 
      authType = 'KEY',
      privateKey,
      password,
      environment = 'DEV',
      description,
      tags = [],
    } = body;

    if (!name || !hostname || !username) {
      return NextResponse.json(
        { error: 'Name, hostname, and username are required' },
        { status: 400 }
      );
    }

    // Create server
    const server = await prisma.server.create({
      data: {
        name,
        hostname,
        port,
        username,
        authType,
        privateKey,
        password,
        environment,
        description,
        tags: JSON.stringify(tags),
      },
      select: {
        id: true,
        name: true,
        hostname: true,
        port: true,
        environment: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit log
    const context = getAuditContext(request);
    await logCreate('Server', server.id, 
      { name, hostname, port, environment },
      { userId: admin.id, ...context }
    );

    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    console.error('Create server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update server
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
    }

    // Get current server data for audit
    const currentServer = await prisma.server.findUnique({
      where: { id },
      select: { name: true, hostname: true, port: true, environment: true, isActive: true },
    });

    if (!currentServer) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Handle tags
    if (updateFields.tags && Array.isArray(updateFields.tags)) {
      updateFields.tags = JSON.stringify(updateFields.tags);
    }

    // Update server
    const updatedServer = await prisma.server.update({
      where: { id },
      data: updateFields,
      select: {
        id: true,
        name: true,
        hostname: true,
        port: true,
        environment: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    const context = getAuditContext(request);
    await logUpdate('Server', id, currentServer, updateFields, { userId: admin.id, ...context });

    return NextResponse.json(updatedServer);
  } catch (error) {
    console.error('Update server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete server
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
    }

    // Get server data for audit
    const server = await prisma.server.findUnique({
      where: { id },
      select: { name: true, hostname: true, environment: true },
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Delete server
    await prisma.server.delete({ where: { id } });

    // Audit log
    const context = getAuditContext(request);
    await logDelete('Server', id, server, { userId: admin.id, ...context });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

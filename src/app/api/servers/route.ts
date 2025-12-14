import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/servers - List all servers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');
    
    const where: any = {};
    if (environment) {
      where.environment = environment;
    }

    const servers = await prisma.server.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(servers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
  }
}

// POST /api/servers - Create a new server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const server = await prisma.server.create({
      data: {
        name: body.name,
        hostname: body.hostname,
        port: body.port || 22,
        username: body.username || 'root',
        authType: body.authType || 'KEY',
        privateKey: body.privateKey,
        password: body.password,
        environment: body.environment || 'DEV',
        description: body.description,
        tags: body.tags ? JSON.stringify(body.tags) : null,
      },
    });

    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create server' }, { status: 500 });
  }
}

// Admin Server Bulk Import API
// Import multiple servers from JSON

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRole } from '@/lib/auth/otp-types';
import { logCreate, getAuditContext } from '@/lib/audit/audit-logger';

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

interface ServerImport {
  name: string;
  hostname: string;
  port?: number;
  username?: string;
  authType?: 'KEY' | 'PASSWORD';
  environment?: 'PROD' | 'STAGE' | 'DEV';
  description?: string;
  tags?: string[];
}

// POST: Bulk import servers
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { servers } = await request.json() as { servers: ServerImport[] };

    if (!servers || !Array.isArray(servers) || servers.length === 0) {
      return NextResponse.json({ error: 'servers array is required' }, { status: 400 });
    }

    if (servers.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 servers per import' }, { status: 400 });
    }

    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const context = getAuditContext(request);

    for (const serverData of servers) {
      try {
        // Validate required fields
        if (!serverData.name || !serverData.hostname) {
          results.failed++;
          results.errors.push(`${serverData.name || 'unknown'}: name과 hostname은 필수입니다`);
          continue;
        }

        // Check if server with same hostname already exists
        const existing = await prisma.server.findFirst({
          where: { hostname: serverData.hostname, port: serverData.port || 22 },
        });

        if (existing) {
          results.failed++;
          results.errors.push(`${serverData.name}: 동일한 호스트(${serverData.hostname})가 이미 존재합니다`);
          continue;
        }

        // Create server
        const server = await prisma.server.create({
          data: {
            name: serverData.name,
            hostname: serverData.hostname,
            port: serverData.port || 22,
            username: serverData.username || 'root',
            authType: serverData.authType || 'KEY',
            environment: serverData.environment || 'DEV',
            description: serverData.description || null,
            tags: JSON.stringify(serverData.tags || []),
          },
        });

        // Audit log
        await logCreate('Server', server.id, 
          { name: serverData.name, hostname: serverData.hostname, environment: serverData.environment },
          { userId: admin.id, ...context }
        );

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${serverData.name}: 등록 실패`);
      }
    }

    return NextResponse.json({
      message: `${results.success}개 서버 등록 완료, ${results.failed}개 실패`,
      ...results,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
  }
}

// GET: Export template
export async function GET() {
  const template = {
    servers: [
      {
        name: 'prod-web-01',
        hostname: '192.168.1.10',
        port: 22,
        username: 'root',
        authType: 'KEY',
        environment: 'PROD',
        description: 'Production Web Server 1',
        tags: ['web', 'nginx'],
      },
      {
        name: 'dev-server-01',
        hostname: '192.168.3.10',
        port: 22,
        username: 'developer',
        authType: 'KEY',
        environment: 'DEV',
        description: 'Development Server',
        tags: ['dev'],
      },
    ],
  };

  return NextResponse.json(template);
}

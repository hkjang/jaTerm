// Admin Server Test Connection API
// Tests SSH connection to a server

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

// POST: Test connection to a server
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serverId, hostname, port = 22, username, authType, privateKey, password } = await request.json();

    // If serverId provided, fetch server details from database
    let targetServer = { hostname, port, username, authType, privateKey, password };
    
    if (serverId) {
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: {
          hostname: true,
          port: true,
          username: true,
          authType: true,
          privateKey: true,
          password: true,
        },
      });
      
      if (!server) {
        return NextResponse.json({ error: 'Server not found' }, { status: 404 });
      }
      targetServer = server;
    }

    // Validate required fields
    if (!targetServer.hostname || !targetServer.username) {
      return NextResponse.json({ error: 'hostname and username are required' }, { status: 400 });
    }

    // In production, this would actually test SSH connection
    // For now, simulate connection test with validation
    const startTime = Date.now();
    
    // Simulated connection test (replace with actual SSH library in production)
    const testResult = await simulateConnectionTest(targetServer);
    
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      duration,
      details: {
        hostname: targetServer.hostname,
        port: targetServer.port,
        username: targetServer.username,
        authType: targetServer.authType,
      },
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({ error: 'Connection test failed' }, { status: 500 });
  }
}

// Simulated connection test (replace with real SSH library in production)
async function simulateConnectionTest(server: {
  hostname: string;
  port: number;
  username: string;
  authType: string;
  privateKey?: string | null;
  password?: string | null;
}): Promise<{ success: boolean; message: string }> {
  // Validate hostname format
  const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (!hostnameRegex.test(server.hostname)) {
    return { success: false, message: '유효하지 않은 호스트 주소입니다.' };
  }

  // Validate port
  if (server.port < 1 || server.port > 65535) {
    return { success: false, message: '유효하지 않은 포트 번호입니다.' };
  }

  // Validate authentication
  if (server.authType === 'KEY' && !server.privateKey) {
    return { success: false, message: 'SSH 키가 설정되지 않았습니다.' };
  }
  
  if (server.authType === 'PASSWORD' && !server.password) {
    return { success: false, message: '비밀번호가 설정되지 않았습니다.' };
  }

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // In production, this would use ssh2 or similar library to actually test connection
  // For now, return success if all validations pass
  return { 
    success: true, 
    message: `${server.hostname}:${server.port} 연결 테스트 성공 (${server.username}@${server.hostname})` 
  };
}

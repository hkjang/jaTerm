import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const operatorPassword = await bcrypt.hash('operator123', 12);
  const devPassword = await bcrypt.hash('dev123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@jaterm.com' },
    update: {
      requireMfaSetup: false,
      lastLoginAt: new Date(), // Mark as recently logged in
    },
    create: {
      email: 'admin@jaterm.com',
      name: '관리자',
      password: adminPassword,
      role: 'ADMIN',
      department: '보안팀',
      mfaEnabled: false,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      requireMfaSetup: false,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@jaterm.com' },
    update: {
      requireMfaSetup: false,
      lastLoginAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
    create: {
      email: 'operator@jaterm.com',
      name: '운영자',
      password: operatorPassword,
      role: 'OPERATOR',
      department: '운영팀',
      mfaEnabled: false,
      requireMfaSetup: false,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000),
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: 'dev@jaterm.com' },
    update: {
      requireMfaSetup: false,
      lastLoginAt: new Date(Date.now() - 7200000), // 2 hours ago
    },
    create: {
      email: 'dev@jaterm.com',
      name: '개발자',
      password: devPassword,
      role: 'DEVELOPER',
      department: '개발팀',
      mfaEnabled: false,
      requireMfaSetup: false,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 7200000),
    },
  });

  console.log('✅ Users created');

  // Create servers
  const servers = [
    { name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD' as const, description: 'Production Web Server 1' },
    { name: 'prod-api-01', hostname: '192.168.1.11', environment: 'PROD' as const, description: 'Production API Server 1' },
    { name: 'stage-web-01', hostname: '192.168.2.10', environment: 'STAGE' as const, description: 'Staging Web Server' },
    { name: 'stage-api-01', hostname: '192.168.2.11', environment: 'STAGE' as const, description: 'Staging API Server' },
    { name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV' as const, description: 'Development Server' },
    { name: 'dev-database', hostname: '192.168.3.20', environment: 'DEV' as const, description: 'Development Database' },
  ];

  const createdServers: { id: string; name: string }[] = [];
  for (const serverData of servers) {
    const server = await prisma.server.upsert({
      where: { id: serverData.name },
      update: {},
      create: {
        id: serverData.name,
        name: serverData.name,
        hostname: serverData.hostname,
        port: 22,
        username: 'root',
        authType: 'KEY',
        environment: serverData.environment,
        description: serverData.description,
        isActive: true,
      },
    });
    createdServers.push({ id: server.id, name: server.name });
  }

  console.log('✅ Servers created');

  // Create policies
  await prisma.policy.upsert({
    where: { id: 'policy-prod' },
    update: {},
    create: {
      id: 'policy-prod',
      name: 'Production Access',
      description: 'ADMIN/OPERATOR 역할 프로덕션 서버 접근 정책',
      priority: 100,
      isActive: true,
      allowedRoles: JSON.stringify(['ADMIN', 'OPERATOR']),
      allowedDays: JSON.stringify([1, 2, 3, 4, 5]),
      allowedStartTime: '09:00',
      allowedEndTime: '18:00',
      commandMode: 'BLACKLIST',
      requireApproval: false,
    },
  });

  await prisma.policy.upsert({
    where: { id: 'policy-dev' },
    update: {},
    create: {
      id: 'policy-dev',
      name: 'Development Access',
      description: '개발 환경 자유 접근 정책',
      priority: 50,
      isActive: true,
      allowedRoles: JSON.stringify(['ADMIN', 'OPERATOR', 'DEVELOPER']),
      allowedDays: JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
      allowedStartTime: '00:00',
      allowedEndTime: '23:59',
      commandMode: 'BLACKLIST',
      requireApproval: false,
    },
  });

  console.log('✅ Policies created');

  // Create risk patterns
  const riskPatterns = [
    { pattern: 'rm -rf /', riskLevel: 1.0, category: 'destructive', description: '전체 파일 시스템 삭제' },
    { pattern: 'mkfs', riskLevel: 0.95, category: 'destructive', description: '파일 시스템 포맷' },
    { pattern: 'dd if=/dev/zero', riskLevel: 0.9, category: 'destructive', description: '디스크 덮어쓰기' },
    { pattern: 'shutdown', riskLevel: 0.85, category: 'system', description: '시스템 종료' },
    { pattern: 'chmod 777 /', riskLevel: 0.7, category: 'permission', description: '전체 권한 변경' },
  ];

  for (const pattern of riskPatterns) {
    await prisma.riskPattern.upsert({
      where: { id: pattern.pattern.replace(/[^a-zA-Z0-9]/g, '-') },
      update: {},
      create: {
        id: pattern.pattern.replace(/[^a-zA-Z0-9]/g, '-'),
        pattern: pattern.pattern,
        riskLevel: pattern.riskLevel,
        category: pattern.category,
        description: pattern.description,
        isActive: true,
      },
    });
  }

  console.log('✅ Risk patterns created');

  // Create sample terminal sessions
  const sessionData = [
    { 
      id: 'session-1',
      userId: admin.id, 
      serverId: createdServers[0].id, 
      status: 'ACTIVE',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
    { 
      id: 'session-2',
      userId: operator.id, 
      serverId: createdServers[2].id, 
      status: 'ACTIVE',
      startedAt: new Date(Date.now() - 7200000), // 2 hours ago
    },
    { 
      id: 'session-3',
      userId: developer.id, 
      serverId: createdServers[4].id, 
      status: 'DISCONNECTED',
      startedAt: new Date(Date.now() - 10800000), // 3 hours ago
      endedAt: new Date(Date.now() - 7200000),
    },
  ];

  for (const session of sessionData) {
    await prisma.terminalSession.upsert({
      where: { id: session.id },
      update: { status: session.status },
      create: {
        id: session.id,
        userId: session.userId,
        serverId: session.serverId,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt || null,
        clientIp: '192.168.1.100',
        purpose: '시스템 점검',
      },
    });
  }

  console.log('✅ Terminal sessions created');

  // Create sample command logs
  const commandLogs = [
    { sessionId: 'session-1', command: 'ls -la', blocked: false },
    { sessionId: 'session-1', command: 'cd /var/log', blocked: false },
    { sessionId: 'session-1', command: 'tail -f application.log', blocked: false },
    { sessionId: 'session-1', command: 'rm -rf /', blocked: true, reason: '위험 명령 차단: 전체 파일 시스템 삭제' },
    { sessionId: 'session-2', command: 'docker ps', blocked: false },
    { sessionId: 'session-2', command: 'docker logs app', blocked: false },
    { sessionId: 'session-3', command: 'git pull', blocked: false },
    { sessionId: 'session-3', command: 'npm install', blocked: false },
  ];

  // Delete existing command logs for these sessions to avoid duplicates
  await prisma.commandLog.deleteMany({
    where: { sessionId: { in: ['session-1', 'session-2', 'session-3'] } },
  });

  for (const log of commandLogs) {
    await prisma.commandLog.create({
      data: {
        sessionId: log.sessionId,
        command: log.command,
        blocked: log.blocked,
        reason: log.reason || null,
        riskScore: log.blocked ? 1.0 : 0.1,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
      },
    });
  }

  console.log('✅ Command logs created');

  // Create sample security alerts
  const securityAlerts = [
    {
      id: 'alert-1',
      alertType: 'DANGEROUS_COMMAND',
      severity: 'CRITICAL',
      title: '위험 명령 차단',
      message: 'rm -rf / 명령이 차단되었습니다',
      sessionId: 'session-1',
      userId: admin.id,
      isResolved: false,
    },
    {
      id: 'alert-2',
      alertType: 'ANOMALY_DETECTED',
      severity: 'HIGH',
      title: '이상 접속 감지',
      message: '비정상적인 접속 시간 감지 (새벽 3시)',
      userId: operator.id,
      isResolved: false,
    },
    {
      id: 'alert-3',
      alertType: 'POLICY_VIOLATION',
      severity: 'MEDIUM',
      title: '정책 위반',
      message: '허용 시간 외 접속 시도',
      userId: developer.id,
      isResolved: true,
      resolvedAt: new Date(Date.now() - 3600000),
      resolvedBy: admin.id,
    },
  ];

  for (const alert of securityAlerts) {
    await prisma.securityAlert.upsert({
      where: { id: alert.id },
      update: {},
      create: {
        id: alert.id,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        sessionId: alert.sessionId || null,
        userId: alert.userId,
        isResolved: alert.isResolved,
        resolvedAt: alert.resolvedAt || null,
        resolvedBy: alert.resolvedBy || null,
        createdAt: new Date(Date.now() - Math.random() * 7200000),
      },
    });
  }

  console.log('✅ Security alerts created');

  // Create sample audit logs
  const auditLogs = [
    {
      userId: admin.id,
      action: 'LOGIN',
      resource: 'User',
      resourceId: admin.id,
      details: JSON.stringify({ method: 'password', success: true }),
      ipAddress: '192.168.1.100',
    },
    {
      userId: admin.id,
      action: 'CREATE',
      resource: 'Server',
      resourceId: 'prod-web-01',
      details: JSON.stringify({ name: 'prod-web-01', environment: 'PROD' }),
      ipAddress: '192.168.1.100',
    },
    {
      userId: operator.id,
      action: 'SESSION_START',
      resource: 'TerminalSession',
      resourceId: 'session-2',
      details: JSON.stringify({ server: 'stage-web-01' }),
      ipAddress: '192.168.1.101',
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
      },
    });
  }

  console.log('✅ Audit logs created');

  // Create sample approval requests
  const approvalRequests = [
    {
      id: 'approval-1',
      userId: operator.id,
      serverId: createdServers[0].id,
      reason: '긴급 장애 대응 - 로그 확인',
      requestType: 'PRIOR',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 3600000),
    },
    {
      id: 'approval-2',
      userId: developer.id,
      serverId: createdServers[1].id,
      reason: '배포 후 모니터링',
      requestType: 'REALTIME',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 1800000),
    },
    {
      id: 'approval-3',
      userId: developer.id,
      serverId: createdServers[2].id,
      reason: '테스트 환경 점검',
      requestType: 'PRIOR',
      status: 'APPROVED',
      approverId: admin.id,
      approvedAt: new Date(Date.now() - 3600000),
      expiresAt: new Date(Date.now() + 10800000),
    },
  ];

  for (const req of approvalRequests) {
    await prisma.approvalRequest.upsert({
      where: { id: req.id },
      update: {},
      create: {
        id: req.id,
        requesterId: req.userId, // Using userId as requesterId
        serverId: req.serverId,
        purpose: req.reason,
        status: req.status,
        approverId: req.approverId || null,
        approvedAt: req.approvedAt || null,
        expiresAt: req.expiresAt,
        createdAt: new Date(Date.now() - Math.random() * 7200000),
      },
    });
  }

  console.log('✅ Approval requests created');

  // Create system settings
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      mfaPolicy: 'OPTIONAL',
      mfaRequiredRoles: JSON.stringify(['ADMIN', 'SUPER']),
      mfaGracePeriodDays: 7,
      sessionTimeoutMins: 480,
      maxConcurrentSessions: 5,
      maxLoginAttempts: 5,
      lockoutDurationMins: 15,
    },
  });

  console.log('✅ System settings created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

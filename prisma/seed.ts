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
    update: {},
    create: {
      email: 'admin@jaterm.com',
      name: '관리자',
      password: adminPassword,
      role: 'ADMIN',
      department: '보안팀',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP', // Demo secret
      isActive: true,
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@jaterm.com' },
    update: {},
    create: {
      email: 'operator@jaterm.com',
      name: '운영자',
      password: operatorPassword,
      role: 'OPERATOR',
      department: '운영팀',
      mfaEnabled: false,
      isActive: true,
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: 'dev@jaterm.com' },
    update: {},
    create: {
      email: 'dev@jaterm.com',
      name: '개발자',
      password: devPassword,
      role: 'DEVELOPER',
      department: '개발팀',
      mfaEnabled: false,
      isActive: true,
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

  for (const serverData of servers) {
    await prisma.server.upsert({
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
  }

  console.log('✅ Servers created');

  // Create policies
  const prodPolicy = await prisma.policy.upsert({
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

  const devPolicy = await prisma.policy.upsert({
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

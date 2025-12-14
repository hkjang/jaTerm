import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    
    const where: any = {};
    if (role) where.role = role;
    if (isActive !== null) where.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        mfaEnabled: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password || 'changeme123', 12);
    
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role || 'USER',
        department: body.department,
        mfaEnabled: false,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        mfaEnabled: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

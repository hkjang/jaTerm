// Admin SSH Key by ID - GET/PUT/DELETE
import { NextRequest, NextResponse } from 'next/server';

let sshKeys = [
  { id: '1', name: 'deploy-key-prod', type: 'ED25519', bits: 256, fingerprint: 'SHA256:aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5', status: 'ACTIVE', owner: '배포시스템', createdAt: '2025-06-01', lastUsed: '2026-01-10', servers: ['prod-*', 'staging-*'], comment: 'Production deployment key' },
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const key = sshKeys.find(k => k.id === id);
    if (!key) {
      return NextResponse.json({ success: false, error: 'SSH key not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: key });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch SSH key' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const index = sshKeys.findIndex(k => k.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'SSH key not found' }, { status: 404 });
    }

    sshKeys[index] = { ...sshKeys[index], ...body, id };
    return NextResponse.json({ success: true, data: sshKeys[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update SSH key' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const index = sshKeys.findIndex(k => k.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'SSH key not found' }, { status: 404 });
    }
    sshKeys.splice(index, 1);
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete SSH key' }, { status: 500 });
  }
}

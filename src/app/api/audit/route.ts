import { NextRequest, NextResponse } from 'next/server';
import { searchAuditLogs } from '@/lib/audit';

// GET /api/audit - Search audit logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await searchAuditLogs({
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

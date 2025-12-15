/**
 * AI Audit Log 조회 API
 * GET: 로그 목록 조회 (관리자용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAuditLogger } from '@/lib/ai/ai-audit-logger';

// Audit Log 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId') || undefined;
    const feature = searchParams.get('feature') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await aiAuditLogger.searchLogs({
      userId,
      feature,
      status,
      startDate,
      endDate,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch AI audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

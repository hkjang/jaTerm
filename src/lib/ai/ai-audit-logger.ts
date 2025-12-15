/**
 * AI Audit Logger
 * AI 호출 기록 및 감사 로그 관리
 */

import { prisma } from '@/lib/db';
import { hashPrompt } from './crypto';
import { AIAuditData, AIFeature } from './types';

/**
 * AI Audit Logger - AI 호출 감사 로깅
 */
export class AIAuditLogger {
  private static instance: AIAuditLogger;

  private constructor() {}

  static getInstance(): AIAuditLogger {
    if (!AIAuditLogger.instance) {
      AIAuditLogger.instance = new AIAuditLogger();
    }
    return AIAuditLogger.instance;
  }

  /**
   * AI 호출 로그 기록
   */
  async log(data: AIAuditData): Promise<string> {
    const log = await prisma.aIAuditLog.create({
      data: {
        userId: data.userId,
        providerId: data.providerId,
        providerName: data.providerName,
        modelName: data.modelName,
        feature: data.feature,
        promptHash: data.promptHash,
        promptLength: data.promptLength,
        responseTokens: data.responseTokens,
        durationMs: data.durationMs,
        status: data.status,
        errorMessage: data.errorMessage,
        ipAddress: data.ipAddress,
      },
    });

    return log.id;
  }

  /**
   * 성공 로그 생성 헬퍼
   */
  async logSuccess(
    userId: string,
    feature: AIFeature,
    prompt: string,
    options: {
      providerId?: string;
      providerName?: string;
      modelName?: string;
      responseTokens?: number;
      durationMs?: number;
      ipAddress?: string;
    }
  ): Promise<string> {
    return this.log({
      userId,
      feature,
      promptHash: hashPrompt(prompt),
      promptLength: prompt.length,
      status: 'success',
      ...options,
    });
  }

  /**
   * 실패 로그 생성 헬퍼
   */
  async logFailure(
    userId: string,
    feature: AIFeature,
    prompt: string,
    errorMessage: string,
    options: {
      providerId?: string;
      providerName?: string;
      modelName?: string;
      ipAddress?: string;
    } = {}
  ): Promise<string> {
    return this.log({
      userId,
      feature,
      promptHash: hashPrompt(prompt),
      promptLength: prompt.length,
      status: 'failed',
      errorMessage,
      ...options,
    });
  }

  /**
   * 차단 로그 생성 헬퍼
   */
  async logBlocked(
    userId: string,
    feature: AIFeature,
    prompt: string,
    reason: string,
    ipAddress?: string
  ): Promise<string> {
    return this.log({
      userId,
      feature,
      promptHash: hashPrompt(prompt),
      promptLength: prompt.length,
      status: 'blocked',
      errorMessage: reason,
      ipAddress,
    });
  }

  /**
   * 사용자별 호출 통계
   */
  async getUserStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCalls: number;
    successCount: number;
    failedCount: number;
    blockedCount: number;
    byFeature: Record<string, number>;
  }> {
    const where: {
      userId: string;
      timestamp?: { gte?: Date; lte?: Date };
    } = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const logs = await prisma.aIAuditLog.findMany({
      where,
      select: {
        status: true,
        feature: true,
      },
    });

    const stats = {
      totalCalls: logs.length,
      successCount: 0,
      failedCount: 0,
      blockedCount: 0,
      byFeature: {} as Record<string, number>,
    };

    for (const log of logs) {
      if (log.status === 'success') stats.successCount++;
      else if (log.status === 'failed') stats.failedCount++;
      else if (log.status === 'blocked') stats.blockedCount++;

      stats.byFeature[log.feature] = (stats.byFeature[log.feature] || 0) + 1;
    }

    return stats;
  }

  /**
   * 로그 검색 (관리자용)
   */
  async searchLogs(options: {
    userId?: string;
    feature?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20 } = options;

    const where: Record<string, unknown> = {};
    if (options.userId) where.userId = options.userId;
    if (options.feature) where.feature = options.feature;
    if (options.status) where.status = options.status;

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) (where.timestamp as Record<string, Date>).gte = options.startDate;
      if (options.endDate) (where.timestamp as Record<string, Date>).lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.aIAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aIAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 대시보드 통계 (관리자용)
   */
  async getDashboardStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalLogs, byStatus, byFeature, byDay] = await Promise.all([
      // 총 호출 수
      prisma.aIAuditLog.count({
        where: { timestamp: { gte: startDate } },
      }),
      // 상태별 집계
      prisma.aIAuditLog.groupBy({
        by: ['status'],
        _count: true,
        where: { timestamp: { gte: startDate } },
      }),
      // 기능별 집계
      prisma.aIAuditLog.groupBy({
        by: ['feature'],
        _count: true,
        where: { timestamp: { gte: startDate } },
      }),
      // 일별 추이 (최근 7일)
      prisma.$queryRaw`
        SELECT 
          date(timestamp) as date,
          COUNT(*) as count
        FROM AIAuditLog
        WHERE timestamp >= ${startDate}
        GROUP BY date(timestamp)
        ORDER BY date DESC
      `,
    ]);

    return {
      totalLogs,
      byStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count])
      ),
      byFeature: Object.fromEntries(
        byFeature.map((f) => [f.feature, f._count])
      ),
      byDay,
    };
  }
}

// 싱글톤 인스턴스 export
export const aiAuditLogger = AIAuditLogger.getInstance();

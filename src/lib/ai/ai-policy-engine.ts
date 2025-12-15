/**
 * AI Policy Engine
 * AI 사용 정책 검증, Rate Limit, 권한 체크 등
 */

import { prisma } from '@/lib/db';
import { AIFeature, PolicyCheckResult, RateLimitResult } from './types';

// Rate Limit 추적용 메모리 캐시 (프로덕션에서는 Redis 사용 권장)
const rateLimitCache: Map<string, { count: number; resetAt: Date }> = new Map();

/**
 * AI Policy Engine - AI 사용 정책 관리
 */
export class AIPolicyEngine {
  private static instance: AIPolicyEngine;

  private constructor() {}

  static getInstance(): AIPolicyEngine {
    if (!AIPolicyEngine.instance) {
      AIPolicyEngine.instance = new AIPolicyEngine();
    }
    return AIPolicyEngine.instance;
  }

  /**
   * 사용 권한 확인
   */
  async checkPermission(
    userId: string,
    userRole: string,
    feature: AIFeature
  ): Promise<PolicyCheckResult> {
    // 활성 정책 조회
    const policy = await prisma.aIPolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!policy) {
      // 정책이 없으면 기본 허용
      return { allowed: true };
    }

    // Role 확인
    const allowedRoles = JSON.parse(policy.allowedRoles) as string[];
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return {
        allowed: false,
        reason: 'AI 기능 사용 권한이 없습니다.',
      };
    }

    // Feature 확인
    const allowedFeatures = JSON.parse(policy.allowedFeatures) as string[];
    if (allowedFeatures.length > 0 && !allowedFeatures.includes(feature)) {
      return {
        allowed: false,
        reason: `'${feature}' 기능은 허용되지 않습니다.`,
      };
    }

    // 시간 제한 확인
    if (policy.timeRestriction) {
      const timeCheck = this.checkTimeRestriction(policy.timeRestriction);
      if (!timeCheck.allowed) {
        return timeCheck;
      }
    }

    // Rate Limit 확인
    const rateLimit = await this.checkRateLimit(userId, policy.rateLimit);
    if (!rateLimit.allowed) {
      return {
        allowed: false,
        reason: `시간당 호출 제한(${policy.rateLimit}회)을 초과했습니다.`,
        rateLimit,
      };
    }

    return { allowed: true, rateLimit };
  }

  /**
   * Rate Limit 확인
   */
  async checkRateLimit(userId: string, limit: number): Promise<RateLimitResult> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const cacheKey = `ratelimit:${userId}`;

    let cached = rateLimitCache.get(cacheKey);

    // 캐시가 만료되었거나 없으면 초기화
    if (!cached || cached.resetAt < now) {
      cached = {
        count: 0,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1시간 후
      };
      rateLimitCache.set(cacheKey, cached);
    }

    const remaining = Math.max(0, limit - cached.count);

    return {
      allowed: cached.count < limit,
      remaining,
      resetAt: cached.resetAt,
      limit,
    };
  }

  /**
   * Rate Limit 카운터 증가
   */
  async incrementRateLimit(userId: string): Promise<void> {
    const cacheKey = `ratelimit:${userId}`;
    const cached = rateLimitCache.get(cacheKey);

    if (cached) {
      cached.count++;
    } else {
      const now = new Date();
      rateLimitCache.set(cacheKey, {
        count: 1,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000),
      });
    }
  }

  /**
   * 시간 제한 확인
   */
  private checkTimeRestriction(restriction: string): PolicyCheckResult {
    try {
      const config = JSON.parse(restriction) as { start: string; end: string };
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (currentTime < config.start || currentTime > config.end) {
        return {
          allowed: false,
          reason: `AI 기능은 ${config.start} ~ ${config.end} 사이에만 사용 가능합니다.`,
        };
      }

      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  /**
   * 위험 점수 임계치 확인
   */
  async checkRiskThreshold(riskScore: number): Promise<{
    allowed: boolean;
    recommendation: 'allow' | 'warn' | 'block';
  }> {
    const policy = await prisma.aIPolicy.findFirst({
      where: { isActive: true },
    });

    const threshold = policy?.riskThreshold ?? 0.7;
    const autoBlock = policy?.autoBlock ?? false;

    if (riskScore >= 0.9) {
      return {
        allowed: !autoBlock,
        recommendation: 'block',
      };
    }

    if (riskScore >= threshold) {
      return {
        allowed: true,
        recommendation: 'warn',
      };
    }

    return {
      allowed: true,
      recommendation: 'allow',
    };
  }

  /**
   * 프롬프트 최대 길이 가져오기
   */
  async getPromptMaxLength(): Promise<number> {
    const policy = await prisma.aIPolicy.findFirst({
      where: { isActive: true },
    });

    return policy?.promptMaxLength ?? 2000;
  }

  /**
   * 결과 마스킹 필요 여부
   */
  async shouldMaskResult(): Promise<boolean> {
    const policy = await prisma.aIPolicy.findFirst({
      where: { isActive: true },
    });

    return policy?.resultMasking ?? false;
  }

  /**
   * 정책 캐시 초기화
   */
  clearRateLimitCache(userId?: string): void {
    if (userId) {
      rateLimitCache.delete(`ratelimit:${userId}`);
    } else {
      rateLimitCache.clear();
    }
  }
}

// 싱글톤 인스턴스 export
export const aiPolicyEngine = AIPolicyEngine.getInstance();

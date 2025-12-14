import { prisma } from '@/lib/db';
import { createAlert } from '@/lib/audit';

interface BehaviorStats {
  avgSessionDuration: number;
  typicalCommands: string[];
  accessTimes: number[]; // Hour of day distribution
  commonServers: string[];
}

export interface AnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number;
  reasons: string[];
}

/**
 * Anomaly Detector - Detects unusual user behavior
 */
export class AnomalyDetector {
  private anomalyThreshold: number;

  constructor(anomalyThreshold: number = 0.7) {
    this.anomalyThreshold = anomalyThreshold;
  }

  /**
   * Get or create behavior profile for user
   */
  async getProfile(userId: string): Promise<BehaviorStats | null> {
    const profile = await prisma.behaviorProfile.findUnique({
      where: { userId },
    });

    if (!profile) return null;

    return {
      avgSessionDuration: profile.avgSessionDuration || 0,
      typicalCommands: profile.typicalCommands 
        ? JSON.parse(profile.typicalCommands) 
        : [],
      accessTimes: profile.accessPattern 
        ? JSON.parse(profile.accessPattern).hours || [] 
        : [],
      commonServers: profile.typicalServers 
        ? JSON.parse(profile.typicalServers) 
        : [],
    };
  }

  /**
   * Update behavior profile based on session activity
   */
  async updateProfile(
    userId: string,
    sessionData: {
      duration: number;
      commands: string[];
      serverId: string;
      accessHour: number;
    }
  ): Promise<void> {
    const existing = await prisma.behaviorProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      // Create new profile
      await prisma.behaviorProfile.create({
        data: {
          userId,
          avgSessionDuration: sessionData.duration,
          typicalCommands: JSON.stringify(sessionData.commands.slice(0, 50)),
          typicalServers: JSON.stringify([sessionData.serverId]),
          accessPattern: JSON.stringify({ 
            hours: [sessionData.accessHour] 
          }),
        },
      });
      return;
    }

    // Update existing profile with moving average
    const currentCommands: string[] = existing.typicalCommands 
      ? JSON.parse(existing.typicalCommands) 
      : [];
    const currentServers: string[] = existing.typicalServers 
      ? JSON.parse(existing.typicalServers) 
      : [];
    const currentPattern = existing.accessPattern 
      ? JSON.parse(existing.accessPattern) 
      : { hours: [] };

    // Merge and limit (using Array.from for ES5 compatibility)
    const newCommands = Array.from(new Set([...currentCommands, ...sessionData.commands])).slice(0, 100);
    const newServers = Array.from(new Set([...currentServers, sessionData.serverId])).slice(0, 20);
    currentPattern.hours = [...currentPattern.hours, sessionData.accessHour].slice(-100);

    const newAvgDuration = (existing.avgSessionDuration || 0) * 0.8 + sessionData.duration * 0.2;

    await prisma.behaviorProfile.update({
      where: { userId },
      data: {
        avgSessionDuration: newAvgDuration,
        typicalCommands: JSON.stringify(newCommands),
        typicalServers: JSON.stringify(newServers),
        accessPattern: JSON.stringify(currentPattern),
        lastUpdated: new Date(),
      },
    });
  }

  /**
   * Detect anomalies in current session
   */
  async detectAnomalies(
    userId: string,
    currentActivity: {
      serverId: string;
      accessHour: number;
      commands: string[];
    }
  ): Promise<AnomalyResult> {
    const profile = await this.getProfile(userId);
    
    if (!profile) {
      // No profile yet - can't detect anomalies
      return {
        isAnomaly: false,
        anomalyScore: 0,
        reasons: [],
      };
    }

    let anomalyScore = 0;
    const reasons: string[] = [];

    // Check unusual access time
    if (profile.accessTimes.length > 10) {
      const avgHour = profile.accessTimes.reduce((a, b) => a + b, 0) / profile.accessTimes.length;
      const hourDiff = Math.abs(currentActivity.accessHour - avgHour);
      if (hourDiff > 6) {
        anomalyScore += 0.3;
        reasons.push(`비정상적인 접속 시간 (평소: ${Math.round(avgHour)}시, 현재: ${currentActivity.accessHour}시)`);
      }
    }

    // Check unusual server access
    if (profile.commonServers.length > 0 && 
        !profile.commonServers.includes(currentActivity.serverId)) {
      anomalyScore += 0.3;
      reasons.push('평소 접속하지 않는 서버');
    }

    // Check unusual commands
    const unusualCommands = currentActivity.commands.filter(
      (cmd) => !profile.typicalCommands.some((tc) => cmd.startsWith(tc.split(' ')[0]))
    );
    if (unusualCommands.length > 5) {
      anomalyScore += 0.2;
      reasons.push(`비정상적인 명령어 사용 (${unusualCommands.length}개)`);
    }

    return {
      isAnomaly: anomalyScore >= this.anomalyThreshold,
      anomalyScore,
      reasons,
    };
  }

  /**
   * Detect and alert anomalies
   */
  async detectAndAlert(
    sessionId: string,
    userId: string,
    activity: {
      serverId: string;
      accessHour: number;
      commands: string[];
    }
  ): Promise<AnomalyResult> {
    const result = await this.detectAnomalies(userId, activity);

    if (result.isAnomaly) {
      await createAlert(
        'ANOMALY_DETECTED',
        result.anomalyScore >= 0.8 ? 'CRITICAL' : 'HIGH',
        '이상 행위 감지',
        `사용자 행동 패턴 이상 감지:\n${result.reasons.join('\n')}`,
        sessionId,
        userId
      );
    }

    return result;
  }
}

// Export singleton
export const anomalyDetector = new AnomalyDetector();

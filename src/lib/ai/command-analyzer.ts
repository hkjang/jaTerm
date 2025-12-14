import { prisma } from '@/lib/db';
import { createAlert } from '@/lib/audit';

// Risk patterns with weights
const RISK_PATTERNS = [
  { pattern: /rm\s+(-rf?|--recursive)?/, weight: 0.8, category: 'destructive' },
  { pattern: /dd\s+/, weight: 0.9, category: 'destructive' },
  { pattern: /mkfs/, weight: 0.95, category: 'destructive' },
  { pattern: /shutdown|reboot|halt|poweroff/, weight: 0.85, category: 'system' },
  { pattern: /chmod\s+(-R\s+)?777/, weight: 0.7, category: 'permission' },
  { pattern: /chown/, weight: 0.6, category: 'permission' },
  { pattern: /sudo\s+su/, weight: 0.7, category: 'privilege' },
  { pattern: /passwd/, weight: 0.6, category: 'credential' },
  { pattern: /iptables|firewall-cmd/, weight: 0.75, category: 'network' },
  { pattern: /curl.*\|\s*(ba)?sh/, weight: 0.9, category: 'remote_exec' },
  { pattern: /wget.*\|\s*(ba)?sh/, weight: 0.9, category: 'remote_exec' },
  { pattern: /base64\s+-d/, weight: 0.5, category: 'obfuscation' },
  { pattern: /eval\s*\(/, weight: 0.6, category: 'obfuscation' },
  { pattern: /nc\s+-[lnvp]|netcat/, weight: 0.7, category: 'network' },
  { pattern: /\/etc\/passwd|\/etc\/shadow/, weight: 0.8, category: 'credential' },
];

export interface RiskAnalysis {
  riskScore: number;
  categories: string[];
  isHighRisk: boolean;
  explanation: string;
  recommendation: 'allow' | 'warn' | 'block';
}

/**
 * Command Risk Analyzer - AI-inspired risk scoring
 */
export class CommandAnalyzer {
  private riskThreshold: number;
  private blockThreshold: number;

  constructor(riskThreshold: number = 0.6, blockThreshold: number = 0.9) {
    this.riskThreshold = riskThreshold;
    this.blockThreshold = blockThreshold;
  }

  /**
   * Analyze command risk
   */
  analyze(command: string): RiskAnalysis {
    const normalizedCommand = command.toLowerCase().trim();
    let totalScore = 0;
    const matchedCategories = new Set<string>();
    const matchedPatterns: string[] = [];

    // Check against risk patterns
    for (const riskPattern of RISK_PATTERNS) {
      if (riskPattern.pattern.test(normalizedCommand)) {
        totalScore += riskPattern.weight;
        matchedCategories.add(riskPattern.category);
        matchedPatterns.push(riskPattern.pattern.toString());
      }
    }

    // Additional heuristics
    totalScore += this.analyzeHeuristics(normalizedCommand);

    // Normalize score to 0-1 range
    const riskScore = Math.min(totalScore, 1.0);
    const categories = Array.from(matchedCategories);

    // Determine recommendation
    let recommendation: 'allow' | 'warn' | 'block';
    if (riskScore >= this.blockThreshold) {
      recommendation = 'block';
    } else if (riskScore >= this.riskThreshold) {
      recommendation = 'warn';
    } else {
      recommendation = 'allow';
    }

    // Generate explanation
    const explanation = this.generateExplanation(
      riskScore,
      categories,
      matchedPatterns
    );

    return {
      riskScore,
      categories,
      isHighRisk: riskScore >= this.riskThreshold,
      explanation,
      recommendation,
    };
  }

  /**
   * Analyze command using heuristics
   */
  private analyzeHeuristics(command: string): number {
    let score = 0;

    // Long command with pipes (potential for complex operations)
    const pipeCount = (command.match(/\|/g) || []).length;
    if (pipeCount > 3) score += 0.1;

    // Output redirection to system paths
    if (/>\s*\/dev\//.test(command)) score += 0.3;
    if (/>\s*\/etc\//.test(command)) score += 0.4;

    // Environment variable manipulation
    if (/export\s+\w+=/.test(command)) score += 0.1;

    // History manipulation (hiding tracks)
    if (/history\s+-c|unset\s+HISTFILE/.test(command)) score += 0.5;

    // Cron job modification
    if (/crontab/.test(command)) score += 0.3;

    return score;
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    riskScore: number,
    categories: string[],
    patterns: string[]
  ): string {
    if (categories.length === 0) {
      return 'Command appears to be low risk.';
    }

    const categoryDescriptions: Record<string, string> = {
      destructive: '파일 시스템 손상 가능',
      system: '시스템 상태 변경',
      permission: '권한 변경',
      privilege: '권한 상승',
      credential: '자격 증명 접근',
      network: '네트워크 설정 변경',
      remote_exec: '원격 코드 실행',
      obfuscation: '명령 난독화',
    };

    const descriptions = categories
      .map((cat) => categoryDescriptions[cat] || cat)
      .join(', ');

    return `위험 레벨: ${(riskScore * 100).toFixed(0)}% - ${descriptions}`;
  }

  /**
   * Analyze and potentially alert
   */
  async analyzeAndAlert(
    sessionId: string,
    userId: string,
    command: string
  ): Promise<RiskAnalysis> {
    const analysis = this.analyze(command);

    if (analysis.recommendation === 'block') {
      await createAlert(
        'DANGEROUS_COMMAND',
        'CRITICAL',
        '위험 명령 감지',
        `명령: ${command}\n분석: ${analysis.explanation}`,
        sessionId,
        userId
      );
    } else if (analysis.recommendation === 'warn') {
      await createAlert(
        'DANGEROUS_COMMAND',
        'HIGH',
        '주의 필요 명령',
        `명령: ${command}\n분석: ${analysis.explanation}`,
        sessionId,
        userId
      );
    }

    return analysis;
  }
}

// Export singleton
export const commandAnalyzer = new CommandAnalyzer();

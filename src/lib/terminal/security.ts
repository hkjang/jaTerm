// Security Features - Input Filtering, Paste Control, Typing Detection

import { PasteFilterResult, TypingPattern, SecuritySettings } from './types';

// ============================================
// Dangerous Paste Patterns
// ============================================

const DANGEROUS_PASTE_PATTERNS = [
  { pattern: /rm\s+(-rf?|--recursive)?\s*\/(?!home|tmp)/, description: '시스템 파일 삭제', risk: 1.0 },
  { pattern: /dd\s+.*of=\/dev\//, description: '디스크 직접 쓰기', risk: 1.0 },
  { pattern: /mkfs\s+/, description: '파일 시스템 포맷', risk: 1.0 },
  { pattern: />\s*\/dev\/sda/, description: '디스크 덮어쓰기', risk: 1.0 },
  { pattern: /shutdown|reboot|halt|poweroff/, description: '시스템 종료/재부팅', risk: 0.9 },
  { pattern: /chmod\s+(-R\s+)?777\s+\//, description: '전체 권한 변경', risk: 0.8 },
  { pattern: /curl.*\|\s*(ba)?sh/, description: '원격 스크립트 실행', risk: 0.9 },
  { pattern: /wget.*\|\s*(ba)?sh/, description: '원격 스크립트 실행', risk: 0.9 },
  { pattern: /base64\s+-d.*\|.*sh/, description: '인코딩된 명령 실행', risk: 0.85 },
  { pattern: /eval\s*\(/, description: '동적 코드 실행', risk: 0.7 },
  { pattern: /fork\s*\(\)\s*\{/, description: 'Fork bomb', risk: 1.0 },
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\}/, description: 'Fork bomb', risk: 1.0 },
  { pattern: /history\s+-c|unset\s+HISTFILE/, description: '히스토리 삭제', risk: 0.6 },
  { pattern: /nc\s+-[lnvpe]|netcat/, description: '네트워크 연결', risk: 0.5 },
  { pattern: /\/etc\/passwd|\/etc\/shadow/, description: '자격 증명 파일 접근', risk: 0.7 },
  { pattern: /iptables\s+-F/, description: '방화벽 규칙 삭제', risk: 0.85 },
  { pattern: /useradd|userdel|passwd/, description: '사용자 관리', risk: 0.6 },
];

// ============================================
// Sensitive Information Patterns
// ============================================

const SENSITIVE_PATTERNS = [
  { pattern: /(?:password|passwd|pwd)\s*[=:]\s*["']?[\w!@#$%^&*]+["']?/gi, type: 'password' },
  { pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*["']?[\w-]+["']?/gi, type: 'api_key' },
  { pattern: /(?:secret|token)\s*[=:]\s*["']?[\w-]+["']?/gi, type: 'secret' },
  { pattern: /(?:aws[_-]?access[_-]?key[_-]?id)\s*[=:]\s*["']?[A-Z0-9]+["']?/gi, type: 'aws_key' },
  { pattern: /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[=:]\s*["']?[\w/+=]+["']?/gi, type: 'aws_secret' },
  { pattern: /-----BEGIN (?:RSA |DSA |EC |)PRIVATE KEY-----/g, type: 'private_key' },
  { pattern: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g, type: 'jwt' },
  { pattern: /ghp_[A-Za-z0-9]{36}/g, type: 'github_token' },
  { pattern: /sk-[A-Za-z0-9]{48}/g, type: 'openai_key' },
  { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, type: 'credit_card' },
];

// ============================================
// Paste Filter
// ============================================

export function filterPaste(
  text: string, 
  settings: SecuritySettings
): PasteFilterResult {
  if (!settings.pasteFilterEnabled) {
    return { allowed: true, originalText: text, blockedPatterns: [], riskScore: 0 };
  }

  const blockedPatterns: string[] = [];
  let maxRisk = 0;
  let filteredText = text;

  // Check for dangerous patterns
  for (const { pattern, description, risk } of DANGEROUS_PASTE_PATTERNS) {
    if (pattern.test(text)) {
      blockedPatterns.push(description);
      maxRisk = Math.max(maxRisk, risk);
    }
  }

  // If risk is too high, block completely
  if (maxRisk >= 0.9) {
    return {
      allowed: false,
      originalText: text,
      blockedPatterns,
      riskScore: maxRisk,
    };
  }

  return {
    allowed: true,
    originalText: text,
    filteredText,
    blockedPatterns,
    riskScore: maxRisk,
  };
}

// ============================================
// Sensitive Info Masking
// ============================================

export function maskSensitiveInfo(text: string): { masked: string; found: string[] } {
  let masked = text;
  const found: string[] = [];

  for (const { pattern, type } of SENSITIVE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(type);
      masked = masked.replace(pattern, (match) => {
        const visible = match.slice(0, 4);
        const hidden = '*'.repeat(Math.max(match.length - 4, 4));
        return `${visible}${hidden}`;
      });
    }
  }

  return { masked, found };
}

// ============================================
// Typing Speed Detection
// ============================================

interface KeystrokeEvent {
  key: string;
  timestamp: number;
}

class TypingDetector {
  private keystrokeHistory: KeystrokeEvent[] = [];
  private baselineSpeed = 0;
  private baselineVariance = 0;
  private calibrated = false;
  private readonly WINDOW_SIZE = 20;
  private readonly ANOMALY_THRESHOLD = 3; // Standard deviations

  recordKeystroke(key: string) {
    const now = Date.now();
    this.keystrokeHistory.push({ key, timestamp: now });
    
    // Keep only recent keystrokes
    if (this.keystrokeHistory.length > 100) {
      this.keystrokeHistory = this.keystrokeHistory.slice(-100);
    }
  }

  analyze(): TypingPattern {
    if (this.keystrokeHistory.length < this.WINDOW_SIZE) {
      return {
        avgSpeed: 0,
        variance: 0,
        isAnomaly: false,
        confidence: 0,
      };
    }

    // Calculate intervals between keystrokes
    const intervals: number[] = [];
    for (let i = 1; i < this.keystrokeHistory.length; i++) {
      intervals.push(
        this.keystrokeHistory[i].timestamp - this.keystrokeHistory[i - 1].timestamp
      );
    }

    // Calculate average and variance
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Calibrate baseline if not done
    if (!this.calibrated && this.keystrokeHistory.length >= 50) {
      this.baselineSpeed = avg;
      this.baselineVariance = variance;
      this.calibrated = true;
    }

    // Detect anomaly (automated input is usually very fast with low variance)
    let isAnomaly = false;
    let confidence = 0;

    if (this.calibrated) {
      const speedDiff = Math.abs(avg - this.baselineSpeed);
      const varianceDiff = Math.abs(variance - this.baselineVariance);
      
      // Too fast (< 30ms between keystrokes) or too consistent
      if (avg < 30 && stdDev < 10) {
        isAnomaly = true;
        confidence = 0.9;
      } else if (speedDiff > this.baselineSpeed * this.ANOMALY_THRESHOLD) {
        isAnomaly = true;
        confidence = Math.min(speedDiff / this.baselineSpeed / this.ANOMALY_THRESHOLD, 1);
      }
    }

    return {
      avgSpeed: avg,
      variance,
      isAnomaly,
      confidence,
    };
  }

  reset() {
    this.keystrokeHistory = [];
    this.calibrated = false;
    this.baselineSpeed = 0;
    this.baselineVariance = 0;
  }
}

export const typingDetector = new TypingDetector();

// ============================================
// Auto-Lock Timer
// ============================================

class AutoLockManager {
  private timer: NodeJS.Timeout | null = null;
  private callback: (() => void) | null = null;
  private timeout = 300000; // 5 minutes default

  start(callback: () => void, timeoutSeconds: number) {
    this.callback = callback;
    this.timeout = timeoutSeconds * 1000;
    this.resetTimer();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  resetTimer() {
    this.stop();
    if (this.callback) {
      this.timer = setTimeout(() => {
        this.callback?.();
      }, this.timeout);
    }
  }
}

export const autoLockManager = new AutoLockManager();

// ============================================
// Session Watermark
// ============================================

export function generateWatermark(
  userId: string,
  userName: string,
  sessionId: string
): string {
  const timestamp = new Date().toISOString();
  return `${userName} (${userId}) | Session: ${sessionId.slice(0, 8)} | ${timestamp}`;
}

export function renderWatermarkCanvas(
  canvas: HTMLCanvasElement,
  watermarkText: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.textAlign = 'center';

  const lines = watermarkText.split(' | ');
  const lineHeight = 16;
  const angle = -15 * (Math.PI / 180);

  ctx.save();
  ctx.rotate(angle);

  for (let y = -canvas.height; y < canvas.height * 2; y += 100) {
    for (let x = -canvas.width; x < canvas.width * 2; x += 300) {
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * lineHeight);
      });
    }
  }

  ctx.restore();
}

// ============================================
// Command Validation
// ============================================

export interface CommandValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

export function validateCommand(command: string): CommandValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  let riskLevel: CommandValidation['riskLevel'] = 'safe';

  // Check for dangerous patterns
  for (const { pattern, description, risk } of DANGEROUS_PASTE_PATTERNS) {
    if (pattern.test(command)) {
      if (risk >= 0.9) {
        errors.push(`위험: ${description}`);
        riskLevel = 'critical';
      } else if (risk >= 0.7) {
        warnings.push(`경고: ${description}`);
        if (riskLevel !== 'critical') riskLevel = 'high';
      } else if (risk >= 0.5) {
        warnings.push(`주의: ${description}`);
        if (riskLevel === 'safe' || riskLevel === 'low') riskLevel = 'medium';
      } else {
        warnings.push(`정보: ${description}`);
        if (riskLevel === 'safe') riskLevel = 'low';
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    riskLevel,
  };
}

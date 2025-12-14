import { prisma } from '@/lib/db';

// Default dangerous command patterns
const DEFAULT_BLACKLIST = [
  /rm\s+(-rf?|--recursive)?\s+\//, // rm -rf /
  /mkfs\./, // Format filesystem
  /dd\s+.*of=\/dev/, // Direct disk write
  /:\(\)\{:\|:\&\}\;:/, // Fork bomb
  /shutdown/, // Shutdown
  /reboot/, // Reboot
  /init\s+0/, // Halt
  /halt/, // Halt
  /poweroff/, // Power off
  /chmod\s+(-R\s+)?777\s+\//, // chmod 777 /
  /chown\s+(-R\s+)?.*\//, // chown /
  />\/dev\/sd/, // Overwrite disk
  /wget.*\|\s*(ba)?sh/, // Download and execute
  /curl.*\|\s*(ba)?sh/, // Download and execute
];

// Common safe commands for whitelist mode
const DEFAULT_WHITELIST = [
  /^ls(\s|$)/,
  /^cd(\s|$)/,
  /^cat(\s|$)/,
  /^less(\s|$)/,
  /^more(\s|$)/,
  /^head(\s|$)/,
  /^tail(\s|$)/,
  /^grep(\s|$)/,
  /^find(\s|$)/,
  /^pwd(\s|$)/,
  /^whoami(\s|$)/,
  /^date(\s|$)/,
  /^uptime(\s|$)/,
  /^df(\s|$)/,
  /^du(\s|$)/,
  /^ps(\s|$)/,
  /^top(\s|$)/,
  /^htop(\s|$)/,
  /^netstat(\s|$)/,
  /^ss(\s|$)/,
  /^ping(\s|$)/,
  /^traceroute(\s|$)/,
  /^docker\s+(ps|logs|inspect)/,
  /^kubectl\s+(get|describe|logs)/,
];

export interface CommandCheckResult {
  allowed: boolean;
  reason?: string;
  riskScore: number;
  matchedPattern?: string;
}

export type CommandMode = 'BLACKLIST' | 'WHITELIST';

/**
 * Filter for checking commands against policies
 */
export class CommandFilter {
  private blacklistPatterns: RegExp[];
  private whitelistPatterns: RegExp[];
  private mode: CommandMode;

  constructor(mode: CommandMode = 'BLACKLIST', customPatterns?: string[]) {
    this.mode = mode;
    this.blacklistPatterns = [...DEFAULT_BLACKLIST];
    this.whitelistPatterns = [...DEFAULT_WHITELIST];

    // Add custom patterns from policy
    if (customPatterns) {
      const patterns = customPatterns.map((p) => new RegExp(p));
      if (mode === 'BLACKLIST') {
        this.blacklistPatterns.push(...patterns);
      } else {
        this.whitelistPatterns.push(...patterns);
      }
    }
  }

  /**
   * Check if a command is allowed
   */
  check(command: string): CommandCheckResult {
    const trimmedCommand = command.trim().toLowerCase();

    if (this.mode === 'BLACKLIST') {
      return this.checkBlacklist(trimmedCommand);
    } else {
      return this.checkWhitelist(trimmedCommand);
    }
  }

  private checkBlacklist(command: string): CommandCheckResult {
    for (const pattern of this.blacklistPatterns) {
      if (pattern.test(command)) {
        return {
          allowed: false,
          reason: 'Command matches blacklisted pattern',
          riskScore: 1.0,
          matchedPattern: pattern.toString(),
        };
      }
    }

    return {
      allowed: true,
      riskScore: this.calculateRiskScore(command),
    };
  }

  private checkWhitelist(command: string): CommandCheckResult {
    for (const pattern of this.whitelistPatterns) {
      if (pattern.test(command)) {
        return {
          allowed: true,
          riskScore: 0.1,
          matchedPattern: pattern.toString(),
        };
      }
    }

    return {
      allowed: false,
      reason: 'Command not in whitelist',
      riskScore: 0.5,
    };
  }

  /**
   * Calculate risk score for a command (0.0 - 1.0)
   */
  private calculateRiskScore(command: string): number {
    let score = 0;

    // Sudo usage
    if (/sudo/.test(command)) score += 0.3;

    // Root operations
    if (/su\s+-/.test(command)) score += 0.4;

    // File modifications
    if (/rm|mv|cp|chmod|chown/.test(command)) score += 0.2;

    // Package management
    if (/apt|yum|dnf|pacman|pip|npm/.test(command)) score += 0.2;

    // Service management
    if (/systemctl|service/.test(command)) score += 0.3;

    // Network operations
    if (/iptables|firewall/.test(command)) score += 0.4;

    return Math.min(score, 1.0);
  }
}

/**
 * Get command filter for a policy
 */
export async function getCommandFilterForPolicy(policyId: string): Promise<CommandFilter> {
  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
  });

  if (!policy) {
    return new CommandFilter('BLACKLIST');
  }

  const patterns = policy.commandPatterns 
    ? JSON.parse(policy.commandPatterns) 
    : [];

  return new CommandFilter(policy.commandMode, patterns);
}

/**
 * Extract command from terminal input buffer
 */
export function extractCommand(buffer: string): string {
  // Handle common terminal input patterns
  const lines = buffer.split('\n');
  const lastLine = lines[lines.length - 1];
  
  // Remove command prompt artifacts
  const promptPatterns = [
    /^\$\s*/,
    /^#\s*/,
    /^>\s*/,
    /^\w+@[\w-]+[:\s]+.*[$#]\s*/,
  ];

  let command = lastLine;
  for (const pattern of promptPatterns) {
    command = command.replace(pattern, '');
  }

  return command.trim();
}

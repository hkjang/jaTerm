// AI Command Analysis - Explanation, Suggestions, Corrections

import { AICommandAnalysis, AlternativeCommand, CommandCorrection, LogSummary } from './types';

// ============================================
// Command Explanations
// ============================================

const COMMAND_EXPLANATIONS: Record<string, { description: string; examples: string[] }> = {
  ls: {
    description: '디렉토리 내용을 나열합니다',
    examples: ['ls -la: 숨김 파일 포함 상세 목록', 'ls -lh: 사람이 읽기 쉬운 파일 크기'],
  },
  cd: {
    description: '현재 디렉토리를 변경합니다',
    examples: ['cd ~: 홈 디렉토리로 이동', 'cd ..: 상위 디렉토리로 이동'],
  },
  cat: {
    description: '파일 내용을 출력합니다',
    examples: ['cat file.txt: 파일 내용 표시', 'cat -n file.txt: 줄 번호 포함'],
  },
  grep: {
    description: '패턴과 일치하는 줄을 검색합니다',
    examples: ['grep "error" log.txt: 에러 검색', 'grep -r "TODO" .: 재귀 검색'],
  },
  find: {
    description: '파일과 디렉토리를 검색합니다',
    examples: ['find . -name "*.log": 로그 파일 찾기', 'find /tmp -mtime +7: 7일 이상 된 파일'],
  },
  rm: {
    description: '파일이나 디렉토리를 삭제합니다',
    examples: ['rm file.txt: 파일 삭제', 'rm -r dir/: 디렉토리 삭제 (주의!)'],
  },
  cp: {
    description: '파일이나 디렉토리를 복사합니다',
    examples: ['cp file1 file2: 파일 복사', 'cp -r dir1 dir2: 디렉토리 복사'],
  },
  mv: {
    description: '파일이나 디렉토리를 이동하거나 이름을 변경합니다',
    examples: ['mv old.txt new.txt: 이름 변경', 'mv file.txt /backup/: 파일 이동'],
  },
  chmod: {
    description: '파일 권한을 변경합니다',
    examples: ['chmod 755 script.sh: 실행 권한 부여', 'chmod -R 644 /var/www/: 재귀 권한 변경'],
  },
  chown: {
    description: '파일 소유자를 변경합니다',
    examples: ['chown user:group file: 소유자 변경', 'chown -R www-data /var/www/: 재귀 변경'],
  },
  systemctl: {
    description: '시스템 서비스를 관리합니다',
    examples: ['systemctl status nginx: 상태 확인', 'systemctl restart nginx: 재시작'],
  },
  docker: {
    description: 'Docker 컨테이너를 관리합니다',
    examples: ['docker ps: 컨테이너 목록', 'docker logs -f container: 로그 확인'],
  },
  kubectl: {
    description: 'Kubernetes 클러스터를 관리합니다',
    examples: ['kubectl get pods: 파드 목록', 'kubectl logs pod-name: 로그 확인'],
  },
  tail: {
    description: '파일의 마지막 부분을 출력합니다',
    examples: ['tail -f log.txt: 실시간 로그', 'tail -n 100 log.txt: 마지막 100줄'],
  },
  ps: {
    description: '실행 중인 프로세스를 표시합니다',
    examples: ['ps aux: 모든 프로세스', 'ps aux | grep nginx: 특정 프로세스 검색'],
  },
  top: {
    description: '실시간 시스템 모니터링',
    examples: ['top: 시스템 모니터링', 'top -u user: 특정 사용자 프로세스'],
  },
  df: {
    description: '디스크 사용량을 표시합니다',
    examples: ['df -h: 사람이 읽기 쉬운 형식', 'df -i: inode 사용량'],
  },
  du: {
    description: '디렉토리 크기를 표시합니다',
    examples: ['du -sh *: 현재 디렉토리 크기', 'du -h --max-depth=1: 1단계 깊이만'],
  },
  netstat: {
    description: '네트워크 연결 상태를 표시합니다',
    examples: ['netstat -tlnp: 리스닝 포트', 'netstat -an: 모든 연결'],
  },
  curl: {
    description: 'URL에서 데이터를 전송합니다',
    examples: ['curl -I url: 헤더만 확인', 'curl -X POST -d "data" url: POST 요청'],
  },
  ssh: {
    description: '원격 서버에 연결합니다',
    examples: ['ssh user@host: 기본 연결', 'ssh -i key.pem user@host: 키 인증'],
  },
  scp: {
    description: 'SSH를 통해 파일을 복사합니다',
    examples: ['scp file user@host:/path: 업로드', 'scp user@host:/path file: 다운로드'],
  },
  tar: {
    description: '아카이브 파일을 생성하거나 추출합니다',
    examples: ['tar -czvf archive.tar.gz dir/: 압축', 'tar -xzvf archive.tar.gz: 추출'],
  },
  vim: {
    description: '텍스트 편집기',
    examples: ['vim file.txt: 파일 편집', ':wq: 저장 후 종료'],
  },
  nano: {
    description: '간단한 텍스트 편집기',
    examples: ['nano file.txt: 파일 편집', 'Ctrl+O: 저장, Ctrl+X: 종료'],
  },
  awk: {
    description: '텍스트 처리 도구',
    examples: ["awk '{print $1}' file: 첫 번째 열", "awk -F: '{print $1}' /etc/passwd: 사용자 목록"],
  },
  sed: {
    description: '스트림 편집기',
    examples: ["sed 's/old/new/g' file: 텍스트 치환", "sed -i 's/old/new/g' file: 파일 직접 수정"],
  },
  crontab: {
    description: '예약 작업을 관리합니다',
    examples: ['crontab -l: 작업 목록', 'crontab -e: 작업 편집'],
  },
  journalctl: {
    description: '시스템 로그를 확인합니다',
    examples: ['journalctl -u nginx: 서비스 로그', 'journalctl -f: 실시간 로그'],
  },
};

// ============================================
// Common Typos and Corrections
// ============================================

const COMMON_TYPOS: Record<string, string> = {
  'sl': 'ls',
  'lls': 'ls',
  'cd..': 'cd ..',
  'cta': 'cat',
  'grpe': 'grep',
  'gre': 'grep',
  'grp': 'grep',
  'finde': 'find',
  'finf': 'find',
  'rm-rf': 'rm -rf',
  'mkdor': 'mkdir',
  'mkdr': 'mkdir',
  'mkidr': 'mkdir',
  'systemclt': 'systemctl',
  'systemct': 'systemctl',
  'dockre': 'docker',
  'docekr': 'docker',
  'kubeclt': 'kubectl',
  'kubctl': 'kubectl',
  'htop': 'top',
  'chmo': 'chmod',
  'chmd': 'chmod',
  'chonw': 'chown',
  'chowd': 'chown',
};

// ============================================
// Safer Alternatives
// ============================================

const SAFER_ALTERNATIVES: Record<string, AlternativeCommand[]> = {
  'rm -rf': [
    {
      command: 'rm -ri',
      description: '삭제 전 확인 요청',
      riskScore: 0.3,
      reason: '각 파일/디렉토리 삭제 전 확인을 요청합니다',
    },
    {
      command: 'trash-put',
      description: '휴지통으로 이동',
      riskScore: 0.1,
      reason: '파일을 완전히 삭제하지 않고 휴지통으로 이동합니다',
    },
  ],
  'chmod 777': [
    {
      command: 'chmod 755',
      description: '실행 권한만 부여',
      riskScore: 0.2,
      reason: '소유자에게만 쓰기 권한을 부여합니다',
    },
    {
      command: 'chmod 644',
      description: '읽기 전용',
      riskScore: 0.1,
      reason: '소유자만 쓰기 가능, 나머지는 읽기만',
    },
  ],
  'curl | sh': [
    {
      command: 'curl -o script.sh && cat script.sh && sh script.sh',
      description: '스크립트 검토 후 실행',
      riskScore: 0.4,
      reason: '스크립트 내용을 먼저 확인합니다',
    },
  ],
  'kill -9': [
    {
      command: 'kill -15',
      description: '우아한 종료 요청',
      riskScore: 0.2,
      reason: '프로세스가 정리할 기회를 줍니다',
    },
  ],
};

// ============================================
// Risk Categories
// ============================================

const RISK_CATEGORIES: Record<string, { keywords: string[]; score: number }> = {
  destructive: {
    keywords: ['rm', 'rmdir', 'dd', 'mkfs', 'format', 'shred'],
    score: 0.8,
  },
  system: {
    keywords: ['shutdown', 'reboot', 'halt', 'poweroff', 'init'],
    score: 0.85,
  },
  permission: {
    keywords: ['chmod', 'chown', 'chgrp', 'setfacl'],
    score: 0.5,
  },
  network: {
    keywords: ['iptables', 'firewall-cmd', 'ufw', 'nc', 'netcat'],
    score: 0.6,
  },
  credential: {
    keywords: ['passwd', 'chpasswd', 'ssh-keygen', 'gpg'],
    score: 0.5,
  },
  privilege: {
    keywords: ['sudo', 'su', 'pkexec', 'doas'],
    score: 0.4,
  },
  service: {
    keywords: ['systemctl', 'service', 'supervisorctl'],
    score: 0.4,
  },
  container: {
    keywords: ['docker', 'podman', 'kubectl', 'crictl'],
    score: 0.3,
  },
  database: {
    keywords: ['mysql', 'psql', 'mongo', 'redis-cli'],
    score: 0.4,
  },
};

// ============================================
// AI Analysis Functions
// ============================================

export function analyzeCommand(command: string): AICommandAnalysis {
  const trimmed = command.trim();
  const parts = trimmed.split(/\s+/);
  const baseCommand = parts[0];

  // Get command explanation
  const explanation = getCommandExplanation(trimmed);

  // Calculate risk score
  const { score, categories } = calculateRiskScore(trimmed);

  // Get alternatives
  const alternatives = getSaferAlternatives(trimmed);

  // Check for corrections
  const corrections = getCorrections(trimmed);

  // Determine risk level
  const riskLevel = getRiskLevel(score);

  return {
    command: trimmed,
    explanation,
    riskScore: score,
    riskLevel,
    categories,
    alternatives,
    corrections,
    estimatedDuration: estimateDuration(trimmed),
  };
}

function getCommandExplanation(command: string): string {
  const parts = command.split(/\s+/);
  const baseCommand = parts[0];

  // Check for known command
  if (COMMAND_EXPLANATIONS[baseCommand]) {
    const info = COMMAND_EXPLANATIONS[baseCommand];
    let explanation = info.description;

    // Add options explanation
    const options = parts.filter(p => p.startsWith('-'));
    if (options.length > 0) {
      explanation += ` (옵션: ${options.join(', ')})`;
    }

    return explanation;
  }

  // Handle compound commands
  if (command.includes('|')) {
    const pipeCommands = command.split('|').map(c => c.trim().split(/\s+/)[0]);
    return `파이프라인: ${pipeCommands.join(' → ')}`;
  }

  return '알 수 없는 명령어입니다';
}

function calculateRiskScore(command: string): { score: number; categories: string[] } {
  const normalizedCommand = command.toLowerCase();
  let totalScore = 0;
  const matchedCategories: string[] = [];

  for (const [category, { keywords, score }] of Object.entries(RISK_CATEGORIES)) {
    for (const keyword of keywords) {
      if (normalizedCommand.includes(keyword)) {
        totalScore += score;
        if (!matchedCategories.includes(category)) {
          matchedCategories.push(category);
        }
      }
    }
  }

  // Additional risk factors
  if (normalizedCommand.includes('-rf') || normalizedCommand.includes('--recursive')) {
    totalScore += 0.3;
  }

  if (normalizedCommand.includes('/dev/') || normalizedCommand.includes('/etc/')) {
    totalScore += 0.2;
  }

  if (normalizedCommand.includes('| sh') || normalizedCommand.includes('| bash')) {
    totalScore += 0.4;
  }

  // Normalize to 0-1
  return {
    score: Math.min(totalScore, 1.0),
    categories: matchedCategories,
  };
}

function getSaferAlternatives(command: string): AlternativeCommand[] {
  for (const [pattern, alternatives] of Object.entries(SAFER_ALTERNATIVES)) {
    if (command.includes(pattern)) {
      return alternatives;
    }
  }
  return [];
}

function getCorrections(command: string): CommandCorrection[] {
  const corrections: CommandCorrection[] = [];
  const parts = command.split(/\s+/);
  const baseCommand = parts[0];

  // Check for typos
  if (COMMON_TYPOS[baseCommand]) {
    corrections.push({
      type: 'typo',
      original: baseCommand,
      corrected: COMMON_TYPOS[baseCommand],
      confidence: 0.9,
    });
  }

  // Check for common option mistakes
  if (command.includes('-rf/') || command.includes('-rf /')) {
    // Space after -rf is important
    corrections.push({
      type: 'syntax',
      original: command,
      corrected: command.replace('-rf/', '-rf /'),
      confidence: 0.8,
    });
  }

  return corrections;
}

function getRiskLevel(score: number): AICommandAnalysis['riskLevel'] {
  if (score >= 0.9) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  if (score >= 0.2) return 'low';
  return 'safe';
}

function estimateDuration(command: string): string | undefined {
  const normalizedCommand = command.toLowerCase();

  // Quick commands
  if (['ls', 'pwd', 'whoami', 'date', 'echo'].some(c => normalizedCommand.startsWith(c))) {
    return '< 1초';
  }

  // Medium duration
  if (['find', 'grep -r', 'du', 'tar'].some(c => normalizedCommand.includes(c))) {
    return '수 초 ~ 수 분';
  }

  // Long running
  if (['rsync', 'scp', 'wget', 'curl'].some(c => normalizedCommand.includes(c))) {
    return '수 분 (네트워크 속도에 따라 다름)';
  }

  return undefined;
}

// ============================================
// Log Summary Generation
// ============================================

export function generateLogSummary(
  sessionId: string,
  commands: { command: string; output?: string; blocked?: boolean; timestamp: Date }[],
  duration: number
): LogSummary {
  const keyActions: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const cmd of commands) {
    const analysis = analyzeCommand(cmd.command);

    // Collect key actions
    if (analysis.riskLevel !== 'safe') {
      keyActions.push(`${analysis.explanation} (${cmd.command.slice(0, 50)}${cmd.command.length > 50 ? '...' : ''})`);
    }

    // Collect warnings
    if (analysis.riskLevel === 'medium' || analysis.riskLevel === 'high') {
      warnings.push(`위험도 ${Math.round(analysis.riskScore * 100)}%: ${cmd.command.slice(0, 30)}`);
    }

    // Check output for errors
    if (cmd.output) {
      if (cmd.output.toLowerCase().includes('error') || cmd.output.toLowerCase().includes('failed')) {
        errors.push(cmd.command.slice(0, 50));
      }
    }

    // Count blocked
    if (cmd.blocked) {
      warnings.push(`차단됨: ${cmd.command.slice(0, 30)}`);
    }
  }

  // Generate summary
  const blockedCount = commands.filter(c => c.blocked).length;
  const summary = `총 ${commands.length}개 명령 실행 (${blockedCount}개 차단). ` +
    `${errors.length}개 에러, ${warnings.length}개 경고 발생. ` +
    `세션 시간: ${Math.floor(duration / 60)}분 ${duration % 60}초`;

  return {
    sessionId,
    summary,
    keyActions: keyActions.slice(0, 10),
    warnings: warnings.slice(0, 5),
    errors: errors.slice(0, 5),
    duration: `${Math.floor(duration / 60)}분 ${duration % 60}초`,
    commandCount: commands.length,
  };
}

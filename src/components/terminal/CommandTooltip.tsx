'use client';

import { useState, useRef, useEffect } from 'react';

interface CommandTooltipProps {
  command: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

// Command database with explanations
const COMMAND_DATABASE: Record<string, {
  description: string;
  synopsis: string;
  options: { flag: string; description: string }[];
  examples: string[];
  category: string;
  risk: 'safe' | 'caution' | 'danger';
}> = {
  ls: {
    description: '디렉토리 내용 목록을 표시합니다.',
    synopsis: 'ls [옵션] [파일...]',
    options: [
      { flag: '-l', description: '긴 형식으로 상세 정보 표시' },
      { flag: '-a', description: '숨김 파일 포함 모두 표시' },
      { flag: '-h', description: '파일 크기를 읽기 쉽게 표시' },
      { flag: '-R', description: '하위 디렉토리 재귀적으로 표시' },
      { flag: '-t', description: '수정 시간순 정렬' },
    ],
    examples: ['ls -la', 'ls -lh /var/log', 'ls *.txt'],
    category: '파일 시스템',
    risk: 'safe',
  },
  cd: {
    description: '현재 작업 디렉토리를 변경합니다.',
    synopsis: 'cd [디렉토리]',
    options: [
      { flag: '~', description: '홈 디렉토리로 이동' },
      { flag: '-', description: '이전 디렉토리로 이동' },
      { flag: '..', description: '상위 디렉토리로 이동' },
    ],
    examples: ['cd /home/user', 'cd ..', 'cd -'],
    category: '탐색',
    risk: 'safe',
  },
  rm: {
    description: '파일이나 디렉토리를 삭제합니다. ⚠️ 되돌릴 수 없습니다!',
    synopsis: 'rm [옵션] 파일...',
    options: [
      { flag: '-r', description: '디렉토리 재귀적 삭제' },
      { flag: '-f', description: '강제 삭제 (확인 없음)' },
      { flag: '-i', description: '삭제 전 확인' },
      { flag: '-v', description: '삭제되는 파일 표시' },
    ],
    examples: ['rm file.txt', 'rm -rf directory/', 'rm -i *.log'],
    category: '파일 시스템',
    risk: 'danger',
  },
  cp: {
    description: '파일이나 디렉토리를 복사합니다.',
    synopsis: 'cp [옵션] 원본 대상',
    options: [
      { flag: '-r', description: '디렉토리 재귀적 복사' },
      { flag: '-p', description: '권한, 타임스탬프 보존' },
      { flag: '-i', description: '덮어쓰기 전 확인' },
      { flag: '-v', description: '복사되는 파일 표시' },
    ],
    examples: ['cp file.txt backup.txt', 'cp -r dir1/ dir2/', 'cp -rp src/ dest/'],
    category: '파일 시스템',
    risk: 'safe',
  },
  mv: {
    description: '파일이나 디렉토리를 이동하거나 이름을 변경합니다.',
    synopsis: 'mv [옵션] 원본 대상',
    options: [
      { flag: '-i', description: '덮어쓰기 전 확인' },
      { flag: '-f', description: '강제 이동' },
      { flag: '-v', description: '이동되는 파일 표시' },
    ],
    examples: ['mv oldname.txt newname.txt', 'mv file.txt /path/to/', 'mv -i *.txt archive/'],
    category: '파일 시스템',
    risk: 'caution',
  },
  grep: {
    description: '파일에서 패턴을 검색합니다.',
    synopsis: 'grep [옵션] 패턴 [파일...]',
    options: [
      { flag: '-i', description: '대소문자 무시' },
      { flag: '-r', description: '재귀적 검색' },
      { flag: '-n', description: '줄 번호 표시' },
      { flag: '-v', description: '패턴과 일치하지 않는 줄' },
      { flag: '-l', description: '파일 이름만 표시' },
    ],
    examples: ['grep "error" log.txt', 'grep -rn "TODO" src/', 'grep -i "warning" *.log'],
    category: '검색',
    risk: 'safe',
  },
  cat: {
    description: '파일 내용을 출력합니다.',
    synopsis: 'cat [옵션] [파일...]',
    options: [
      { flag: '-n', description: '줄 번호 표시' },
      { flag: '-b', description: '비어있지 않은 줄만 번호 표시' },
      { flag: '-s', description: '연속된 빈 줄 압축' },
    ],
    examples: ['cat file.txt', 'cat -n script.sh', 'cat file1.txt file2.txt > merged.txt'],
    category: '파일 시스템',
    risk: 'safe',
  },
  chmod: {
    description: '파일 권한을 변경합니다.',
    synopsis: 'chmod [옵션] 모드 파일...',
    options: [
      { flag: '-R', description: '재귀적으로 적용' },
      { flag: '-v', description: '변경 내용 표시' },
    ],
    examples: ['chmod 755 script.sh', 'chmod +x file', 'chmod -R 644 *.txt'],
    category: '권한',
    risk: 'caution',
  },
  chown: {
    description: '파일 소유자를 변경합니다.',
    synopsis: 'chown [옵션] 소유자[:그룹] 파일...',
    options: [
      { flag: '-R', description: '재귀적으로 적용' },
      { flag: '-v', description: '변경 내용 표시' },
    ],
    examples: ['chown user:group file', 'chown -R www-data:www-data /var/www'],
    category: '권한',
    risk: 'caution',
  },
  ps: {
    description: '실행 중인 프로세스를 표시합니다.',
    synopsis: 'ps [옵션]',
    options: [
      { flag: 'aux', description: '모든 프로세스 상세 표시' },
      { flag: '-ef', description: '전체 형식으로 표시' },
      { flag: '-u', description: '사용자별 프로세스' },
    ],
    examples: ['ps aux', 'ps -ef | grep nginx', 'ps aux --sort=-%mem'],
    category: '프로세스',
    risk: 'safe',
  },
  kill: {
    description: '프로세스에 시그널을 보내 종료합니다.',
    synopsis: 'kill [옵션] PID...',
    options: [
      { flag: '-9', description: '강제 종료 (SIGKILL)' },
      { flag: '-15', description: '정상 종료 (SIGTERM)' },
      { flag: '-l', description: '시그널 목록 표시' },
    ],
    examples: ['kill 1234', 'kill -9 1234', 'kill -15 $(pgrep nginx)'],
    category: '프로세스',
    risk: 'caution',
  },
  sudo: {
    description: '관리자(root) 권한으로 명령을 실행합니다.',
    synopsis: 'sudo [옵션] 명령',
    options: [
      { flag: '-u', description: '다른 사용자로 실행' },
      { flag: '-s', description: 'root 쉘 실행' },
      { flag: '-i', description: 'root 로그인 쉘 실행' },
    ],
    examples: ['sudo apt update', 'sudo -u postgres psql', 'sudo !!'],
    category: '권한',
    risk: 'caution',
  },
  systemctl: {
    description: '시스템 서비스를 관리합니다.',
    synopsis: 'systemctl [명령] [서비스]',
    options: [
      { flag: 'start', description: '서비스 시작' },
      { flag: 'stop', description: '서비스 중지' },
      { flag: 'restart', description: '서비스 재시작' },
      { flag: 'status', description: '서비스 상태 확인' },
      { flag: 'enable', description: '부팅 시 자동 시작' },
    ],
    examples: ['systemctl status nginx', 'systemctl restart apache2', 'systemctl enable docker'],
    category: '서비스',
    risk: 'caution',
  },
  docker: {
    description: 'Docker 컨테이너를 관리합니다.',
    synopsis: 'docker [명령] [옵션]',
    options: [
      { flag: 'ps', description: '실행 중인 컨테이너 표시' },
      { flag: 'images', description: '이미지 목록' },
      { flag: 'run', description: '새 컨테이너 실행' },
      { flag: 'exec', description: '실행 중인 컨테이너에서 명령 실행' },
      { flag: 'logs', description: '컨테이너 로그 확인' },
    ],
    examples: ['docker ps -a', 'docker logs -f container_id', 'docker exec -it container /bin/bash'],
    category: '컨테이너',
    risk: 'safe',
  },
  git: {
    description: 'Git 버전 관리 시스템을 사용합니다.',
    synopsis: 'git [명령] [옵션]',
    options: [
      { flag: 'status', description: '작업 디렉토리 상태' },
      { flag: 'add', description: '변경 사항 스테이징' },
      { flag: 'commit', description: '변경 사항 커밋' },
      { flag: 'push', description: '원격에 푸시' },
      { flag: 'pull', description: '원격에서 풀' },
    ],
    examples: ['git status', 'git add .', 'git commit -m "message"', 'git pull origin main'],
    category: '버전 관리',
    risk: 'safe',
  },
};

function getCommandInfo(command: string) {
  const baseCommand = command.trim().split(/\s+/)[0];
  return COMMAND_DATABASE[baseCommand] || null;
}

export default function CommandTooltip({
  command,
  children,
  position = 'top',
  delay = 500,
}: CommandTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const commandInfo = getCommandInfo(command);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 300;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - 8;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - 8;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + 8;
        break;
    }
    
    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8));
    
    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getRiskColor = (risk: 'safe' | 'caution' | 'danger') => {
    switch (risk) {
      case 'danger': return 'var(--color-danger)';
      case 'caution': return 'var(--color-warning)';
      default: return 'var(--color-success)';
    }
  };

  const getRiskLabel = (risk: 'safe' | 'caution' | 'danger') => {
    switch (risk) {
      case 'danger': return '위험';
      case 'caution': return '주의';
      default: return '안전';
    }
  };

  if (!commandInfo) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: '320px',
            maxHeight: '300px',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 10000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}>
              <code style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
              }}>
                {command.split(/\s+/)[0]}
              </code>
              <span style={{
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                background: `${getRiskColor(commandInfo.risk)}20`,
                color: getRiskColor(commandInfo.risk),
              }}>
                {getRiskLabel(commandInfo.risk)}
              </span>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}>
              {commandInfo.category}
            </div>
          </div>

          {/* Content */}
          <div style={{
            padding: '12px 16px',
            maxHeight: '220px',
            overflow: 'auto',
          }}>
            {/* Description */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-primary)',
              }}>
                {commandInfo.description}
              </div>
            </div>

            {/* Synopsis */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                사용법
              </div>
              <code style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary)',
              }}>
                {commandInfo.synopsis}
              </code>
            </div>

            {/* Options */}
            {commandInfo.options.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}>
                  주요 옵션
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {commandInfo.options.slice(0, 4).map((opt, i) => (
                    <div key={i} style={{ fontSize: '0.8rem' }}>
                      <code style={{
                        color: 'var(--color-primary)',
                        marginRight: '8px',
                      }}>
                        {opt.flag}
                      </code>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {opt.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            {commandInfo.examples.length > 0 && (
              <div>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}>
                  예제
                </div>
                <div style={{
                  background: '#0d1117',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px',
                }}>
                  {commandInfo.examples.slice(0, 2).map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-primary)',
                        marginBottom: i < commandInfo.examples.length - 1 ? '4px' : 0,
                      }}
                    >
                      $ {ex}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface BeginnerModeProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  currentCommand?: string;
  serverEnvironment?: 'PROD' | 'STAGE' | 'DEV';
}

interface GuideTip {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'tip';
  forCommand?: string[];
  forEnvironment?: ('PROD' | 'STAGE' | 'DEV')[];
}

const BEGINNER_TIPS: GuideTip[] = [
  {
    id: 'welcome',
    title: '터미널에 오신 것을 환영합니다!',
    content: '명령어를 입력하고 Enter 키를 눌러 실행하세요. 도움이 필요하면 AI 어시스턴트를 사용해 보세요.',
    type: 'info',
  },
  {
    id: 'prod-warning',
    title: 'Production 서버 접속 중',
    content: '실제 운영 환경입니다. 명령어 실행 전 반드시 확인하세요. 위험한 명령어는 2단계 확인이 필요합니다.',
    type: 'warning',
    forEnvironment: ['PROD'],
  },
  {
    id: 'ls-tip',
    title: 'ls 명령어 팁',
    content: 'ls -la로 숨김 파일을 포함한 상세 목록을 볼 수 있습니다.',
    type: 'tip',
    forCommand: ['ls'],
  },
  {
    id: 'cd-tip',
    title: 'cd 명령어 팁',
    content: 'cd - 로 이전 디렉토리로 돌아갈 수 있고, cd ~ 로 홈 디렉토리로 이동할 수 있습니다.',
    type: 'tip',
    forCommand: ['cd'],
  },
  {
    id: 'rm-warning',
    title: '⚠️ 삭제 명령어 주의',
    content: 'rm 명령으로 삭제된 파일은 복구하기 어렵습니다. -i 옵션을 사용하면 삭제 전 확인을 받을 수 있습니다.',
    type: 'warning',
    forCommand: ['rm'],
  },
  {
    id: 'sudo-warning',
    title: '⚠️ 관리자 권한 명령',
    content: 'sudo는 관리자 권한으로 명령을 실행합니다. 시스템 전체에 영향을 줄 수 있으니 신중하게 사용하세요.',
    type: 'warning',
    forCommand: ['sudo'],
  },
  {
    id: 'history-tip',
    title: '히스토리 팁',
    content: '↑ ↓ 화살표 키로 이전 명령어를 탐색할 수 있습니다. Ctrl+R로 히스토리를 검색할 수 있습니다.',
    type: 'tip',
  },
  {
    id: 'tab-completion',
    title: '자동완성 팁',
    content: 'Tab 키를 누르면 파일명이나 명령어를 자동으로 완성할 수 있습니다. 두 번 누르면 가능한 옵션을 보여줍니다.',
    type: 'tip',
  },
  {
    id: 'ctrl-c',
    title: '명령 취소',
    content: 'Ctrl+C를 누르면 실행 중인 명령을 중단할 수 있습니다.',
    type: 'info',
  },
];

const WORKFLOW_GUIDES = [
  {
    id: 'deployment',
    title: '배포 작업',
    steps: [
      { step: 1, label: '코드 풀', command: 'git pull origin main', description: '최신 코드 가져오기' },
      { step: 2, label: '의존성', command: 'npm install', description: '패키지 설치' },
      { step: 3, label: '빌드', command: 'npm run build', description: '프로덕션 빌드' },
      { step: 4, label: '재시작', command: 'pm2 restart all', description: '서비스 재시작' },
      { step: 5, label: '확인', command: 'pm2 status', description: '상태 확인' },
    ],
  },
  {
    id: 'troubleshooting',
    title: '문제 해결',
    steps: [
      { step: 1, label: '로그 확인', command: 'tail -100 /var/log/app.log', description: '최근 로그 보기' },
      { step: 2, label: '프로세스', command: 'ps aux | grep node', description: '실행 중인 프로세스' },
      { step: 3, label: '리소스', command: 'htop', description: 'CPU/메모리 확인' },
      { step: 4, label: '디스크', command: 'df -h', description: '디스크 사용량' },
      { step: 5, label: '네트워크', command: 'netstat -tlnp', description: '열린 포트 확인' },
    ],
  },
  {
    id: 'docker-management',
    title: 'Docker 관리',
    steps: [
      { step: 1, label: '컨테이너', command: 'docker ps -a', description: '모든 컨테이너 상태' },
      { step: 2, label: '로그', command: 'docker logs -f <container>', description: '컨테이너 로그' },
      { step: 3, label: '이미지', command: 'docker images', description: '이미지 목록' },
      { step: 4, label: '정리', command: 'docker system prune', description: '미사용 리소스 정리' },
    ],
  },
];

export default function BeginnerMode({
  isEnabled,
  onToggle,
  currentCommand,
  serverEnvironment,
}: BeginnerModeProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [activeWorkflow, setActiveWorkflow] = useState<typeof WORKFLOW_GUIDES[0] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Get relevant tips based on current context
  const relevantTips = BEGINNER_TIPS.filter(tip => {
    // Check environment filter
    if (tip.forEnvironment && serverEnvironment) {
      if (!tip.forEnvironment.includes(serverEnvironment)) return false;
    }
    
    // Check command filter
    if (tip.forCommand && currentCommand) {
      const baseCommand = currentCommand.trim().split(/\s+/)[0];
      if (!tip.forCommand.includes(baseCommand)) return false;
    }
    
    // Show tips without specific filters, or matching filters
    if (!tip.forEnvironment && !tip.forCommand) return true;
    if (tip.forEnvironment && serverEnvironment && tip.forEnvironment.includes(serverEnvironment)) return true;
    if (tip.forCommand && currentCommand) {
      const baseCommand = currentCommand.trim().split(/\s+/)[0];
      if (tip.forCommand.includes(baseCommand)) return true;
    }
    
    return false;
  });

  // Rotate through tips
  useEffect(() => {
    if (!isEnabled || relevantTips.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % relevantTips.length);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isEnabled, relevantTips.length]);

  if (!isEnabled) {
    return (
      <button
        onClick={() => onToggle(true)}
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          padding: '8px 12px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 100,
        }}
      >
        <span>🎓</span>
        <span>초보자 모드</span>
      </button>
    );
  }

  const currentTip = relevantTips[currentTipIndex] || relevantTips[0];

  const getTipIcon = (type: 'info' | 'warning' | 'tip') => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'tip': return '💡';
      default: return 'ℹ️';
    }
  };

  const getTipColor = (type: 'info' | 'warning' | 'tip') => {
    switch (type) {
      case 'warning': return 'var(--color-warning)';
      case 'tip': return 'var(--color-primary)';
      default: return 'var(--color-info)';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      width: '320px',
      maxHeight: '400px',
      background: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎓</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>학습 도우미</span>
        </div>
        <button
          onClick={() => onToggle(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Current Tip */}
      {currentTip && !activeWorkflow && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <span style={{ fontSize: '1.2rem' }}>{getTipIcon(currentTip.type)}</span>
            <div>
              <div style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: getTipColor(currentTip.type),
                marginBottom: '4px',
              }}>
                {currentTip.title}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
              }}>
                {currentTip.content}
              </div>
            </div>
          </div>
          
          {relevantTips.length > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '12px',
            }}>
              {relevantTips.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTipIndex(i)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: i === currentTipIndex 
                      ? 'var(--color-primary)' 
                      : 'var(--color-border)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workflow Guide */}
      {activeWorkflow && (
        <div style={{ padding: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              📋 {activeWorkflow.title}
            </div>
            <button
              onClick={() => {
                setActiveWorkflow(null);
                setCurrentStep(0);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              닫기
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeWorkflow.steps.map((step, i) => (
              <div
                key={step.step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  background: i === currentStep 
                    ? 'var(--color-primary-bg)' 
                    : i < currentStep 
                      ? 'var(--color-success-bg)' 
                      : 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentStep(i)}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: i < currentStep 
                    ? 'var(--color-success)' 
                    : i === currentStep 
                      ? 'var(--color-primary)' 
                      : 'var(--color-border)',
                  color: i <= currentStep ? 'white' : 'var(--color-text-muted)',
                }}>
                  {i < currentStep ? '✓' : step.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: i === currentStep 
                      ? 'var(--color-primary)' 
                      : 'var(--color-text-primary)',
                  }}>
                    {step.label}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}>
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: '#0d1117',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--color-success)',
          }}>
            $ {activeWorkflow.steps[currentStep]?.command}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
          }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              이전
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setCurrentStep(Math.min(activeWorkflow.steps.length - 1, currentStep + 1))}
              disabled={currentStep === activeWorkflow.steps.length - 1}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Workflow Selection */}
      {!activeWorkflow && (
        <div style={{
          padding: '12px 16px',
          overflow: 'auto',
          flex: 1,
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            작업 가이드
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {WORKFLOW_GUIDES.map(workflow => (
              <button
                key={workflow.id}
                onClick={() => setActiveWorkflow(workflow)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'var(--color-surface)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span>📋</span>
                <div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                  }}>
                    {workflow.title}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}>
                    {workflow.steps.length} 단계
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

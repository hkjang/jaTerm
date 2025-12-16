'use client';

import { useState, useEffect, useRef } from 'react';
import { CommandValidation } from '@/lib/terminal/security';

interface DangerousCommandConfirmProps {
  isOpen: boolean;
  command: string;
  serverName: string;
  serverEnvironment: 'PROD' | 'STAGE' | 'DEV';
  validation: CommandValidation;
  onConfirm: () => void;
  onCancel: () => void;
  onDryRun?: () => void;
}

// Undo guides for common dangerous commands
const UNDO_GUIDES: Record<string, { description: string; undoCommand?: string; note?: string }> = {
  'rm': {
    description: '파일/디렉토리 삭제',
    note: '삭제된 파일은 복구하기 어렵습니다. 백업이 있는지 확인하세요.',
  },
  'chmod': {
    description: '파일 권한 변경',
    undoCommand: 'chmod <원래_권한> <파일경로>',
    note: '원래 권한을 기록해두세요.',
  },
  'chown': {
    description: '파일 소유자 변경',
    undoCommand: 'chown <원래_소유자>:<원래_그룹> <파일경로>',
    note: '원래 소유자 정보를 기록해두세요.',
  },
  'mv': {
    description: '파일 이동/이름변경',
    undoCommand: 'mv <새_경로> <원래_경로>',
  },
  'dd': {
    description: '디스크 직접 쓰기',
    note: '⚠️ 복구 불가능! 디스크 데이터가 영구 손실됩니다.',
  },
  'mkfs': {
    description: '파일 시스템 포맷',
    note: '⚠️ 복구 불가능! 모든 데이터가 손실됩니다.',
  },
  'shutdown': {
    description: '시스템 종료',
    undoCommand: '물리적 또는 ILO/IPMI를 통한 재시작 필요',
  },
  'reboot': {
    description: '시스템 재부팅',
    note: '시스템이 재부팅됩니다. 실행 중인 작업이 중단될 수 있습니다.',
  },
  'iptables': {
    description: '방화벽 규칙 변경',
    undoCommand: 'iptables-restore < /etc/iptables.rules.backup',
    note: '변경 전 iptables-save > backup.rules 로 백업하세요.',
  },
  'systemctl': {
    description: '서비스 상태 변경',
    undoCommand: 'systemctl start/stop/restart <서비스>',
  },
  'kill': {
    description: '프로세스 종료',
    note: '종료된 프로세스는 수동으로 재시작해야 합니다.',
  },
};

function getUndoGuide(command: string): { description: string; undoCommand?: string; note?: string } | null {
  const baseCommand = command.trim().split(/\s+/)[0];
  return UNDO_GUIDES[baseCommand] || null;
}

export default function DangerousCommandConfirm({
  isOpen,
  command,
  serverName,
  serverEnvironment,
  validation,
  onConfirm,
  onCancel,
  onDryRun,
}: DangerousCommandConfirmProps) {
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(5);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const requiresTextConfirm = serverEnvironment === 'PROD' || validation.riskLevel === 'critical';
  const confirmPhrase = serverName.slice(0, 8).toUpperCase();
  
  const undoGuide = getUndoGuide(command);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setCountdown(serverEnvironment === 'PROD' ? 5 : 3);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, serverEnvironment]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const canConfirm = !requiresTextConfirm || confirmText.toUpperCase() === confirmPhrase;
  const isCountdownActive = countdown > 0;

  const getRiskColor = () => {
    switch (validation.riskLevel) {
      case 'critical': return 'var(--color-danger)';
      case 'high': return '#f59e0b';
      case 'medium': return 'var(--color-warning)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getEnvironmentColor = () => {
    switch (serverEnvironment) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${getRiskColor()}`,
        width: '100%',
        maxWidth: '520px',
        padding: '24px',
        boxShadow: `0 0 40px ${getRiskColor()}40`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: `${getRiskColor()}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: getRiskColor() }}>
              {validation.riskLevel === 'critical' ? '위험 명령 감지!' : '주의가 필요한 명령'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              실행 전 확인이 필요합니다
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: `${getEnvironmentColor()}20`,
            color: getEnvironmentColor(),
          }}>
            {serverEnvironment}
          </span>
          <span style={{ fontWeight: 600 }}>{serverName}</span>
        </div>

        {/* Command */}
        <div style={{
          background: '#0d1117',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          color: getRiskColor(),
          border: `1px solid ${getRiskColor()}40`,
          wordBreak: 'break-all',
        }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '8px' }}>
            실행할 명령:
          </div>
          {command}
        </div>

        {/* Warnings and Errors */}
        {(validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div style={{ marginBottom: '16px' }}>
            {validation.errors.map((error, i) => (
              <div key={`e-${i}`} style={{
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '8px',
                fontSize: '0.85rem',
              }}>
                ❌ {error}
              </div>
            ))}
            {validation.warnings.map((warning, i) => (
              <div key={`w-${i}`} style={{
                background: 'var(--color-warning-bg)',
                color: 'var(--color-warning)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '8px',
                fontSize: '0.85rem',
              }}>
                ⚠️ {warning}
              </div>
            ))}
          </div>
        )}

        {/* Undo Guide */}
        {undoGuide && (
          <div style={{
            background: 'var(--color-info-bg)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <div style={{
              fontWeight: 600,
              fontSize: '0.85rem',
              marginBottom: '8px',
              color: 'var(--color-info)',
            }}>
              💡 복구 안내: {undoGuide.description}
            </div>
            {undoGuide.undoCommand && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                background: 'var(--color-surface)',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '8px',
              }}>
                {undoGuide.undoCommand}
              </div>
            )}
            {undoGuide.note && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {undoGuide.note}
              </div>
            )}
          </div>
        )}

        {/* Text Confirmation for PROD */}
        {requiresTextConfirm && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}>
              확인을 위해 <strong style={{ color: getRiskColor() }}>{confirmPhrase}</strong>를 입력하세요:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmPhrase}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${confirmText.toUpperCase() === confirmPhrase ? 'var(--color-success)' : 'var(--color-border)'}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                textAlign: 'center',
                letterSpacing: '0.1em',
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            className="btn btn-ghost"
            onClick={onCancel}
          >
            취소
          </button>
          
          {onDryRun && (
            <button
              className="btn btn-secondary"
              onClick={onDryRun}
              title="실제 실행 없이 명령 결과를 시뮬레이션합니다"
            >
              🔍 Dry Run
            </button>
          )}
          
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={!canConfirm || isCountdownActive}
            style={{
              minWidth: '120px',
              opacity: (!canConfirm || isCountdownActive) ? 0.5 : 1,
            }}
          >
            {isCountdownActive ? `${countdown}초 후 활성화` : '실행'}
          </button>
        </div>
      </div>
    </div>
  );
}

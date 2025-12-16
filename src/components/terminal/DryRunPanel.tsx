'use client';

import { DryRunResult } from '@/lib/terminal/security';

interface DryRunPanelProps {
  result: DryRunResult | null;
  onClose: () => void;
  onExecute: () => void;
}

export default function DryRunPanel({ result, onClose, onExecute }: DryRunPanelProps) {
  if (!result) return null;

  const getImpactColor = () => {
    switch (result.estimatedImpact) {
      case 'destructive': return 'var(--color-danger)';
      case 'high': return '#f59e0b';
      case 'medium': return 'var(--color-warning)';
      case 'low': return 'var(--color-info)';
      default: return 'var(--color-success)';
    }
  };

  const getImpactLabel = () => {
    switch (result.estimatedImpact) {
      case 'destructive': return '파괴적';
      case 'high': return '높음';
      case 'medium': return '중간';
      case 'low': return '낮음';
      default: return '없음';
    }
  };

  return (
    <div style={{
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      marginTop: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <span style={{ fontWeight: 600 }}>Dry Run 결과</span>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px' }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Impact Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: `${getImpactColor()}20`,
            color: getImpactColor(),
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            영향도: {getImpactLabel()}
          </span>
          {!result.canUndo && (
            <span style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              ⚠️ 되돌리기 불가
            </span>
          )}
        </div>

        {/* Simulated Output */}
        <div style={{
          background: '#0d1117',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: 'var(--color-text-primary)',
          whiteSpace: 'pre-wrap',
          border: '1px solid var(--color-border)',
        }}>
          {result.simulatedOutput}
        </div>

        {/* Affected Paths */}
        {result.affectedPaths.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}>
              영향받는 경로:
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              {result.affectedPaths.map((path, i) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 8px',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                  }}
                >
                  {path}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {result.warnings.map((warning, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-warning-bg)',
                  color: 'var(--color-warning)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '8px',
                }}
              >
                ⚠️ {warning}
              </div>
            ))}
          </div>
        )}

        {/* Undo Hints */}
        {result.undoHints.length > 0 && (
          <div style={{
            background: 'var(--color-info-bg)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <div style={{
              fontWeight: 600,
              fontSize: '0.85rem',
              color: 'var(--color-info)',
              marginBottom: '8px',
            }}>
              💡 복구 힌트:
            </div>
            {result.undoHints.map((hint, i) => (
              <div
                key={i}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: i < result.undoHints.length - 1 ? '4px' : 0,
                }}
              >
                • {hint}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '8px',
          borderTop: '1px solid var(--color-border)',
        }}>
          <button className="btn btn-ghost" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-primary"
            onClick={onExecute}
          >
            실제로 실행
          </button>
        </div>
      </div>
    </div>
  );
}

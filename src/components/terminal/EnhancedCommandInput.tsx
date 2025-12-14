'use client';

import { useState, useEffect, useCallback } from 'react';
import { AICommandAnalysis } from '@/lib/terminal/types';
import { analyzeCommand } from '@/lib/terminal/ai-analyzer';

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (command: string) => void;
  serverName: string;
  currentDir: string;
  previewEnabled: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

export default function EnhancedCommandInput({
  value,
  onChange,
  onExecute,
  serverName,
  currentDir,
  previewEnabled,
  readOnly = false,
  disabled = false,
}: CommandInputProps) {
  const [analysis, setAnalysis] = useState<AICommandAnalysis | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Analyze command when input changes
  useEffect(() => {
    if (!value.trim()) {
      setAnalysis(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const result = analyzeCommand(value);
      setAnalysis(result);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (readOnly || disabled) return;

      // Check if command requires confirmation
      if (analysis && (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical')) {
        setShowConfirmation(true);
        return;
      }

      onExecute(value);
      onChange('');
    }
  };

  const handleConfirmExecute = () => {
    setShowConfirmation(false);
    onExecute(value);
    onChange('');
  };

  const getRiskLevelColor = (level: AICommandAnalysis['riskLevel']) => {
    switch (level) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskLevelLabel = (level: AICommandAnalysis['riskLevel']) => {
    switch (level) {
      case 'critical': return '매우 위험';
      case 'high': return '위험';
      case 'medium': return '주의';
      case 'low': return '낮음';
      default: return '안전';
    }
  };

  return (
    <div className="enhanced-input-container">
      {/* Input Preview */}
      {previewEnabled && analysis && showPreview && (
        <div className="command-preview-panel">
          <div className="preview-header">
            <span className="preview-title">명령어 분석</span>
            <span 
              className="risk-badge"
              style={{ 
                backgroundColor: getRiskLevelColor(analysis.riskLevel) + '20',
                color: getRiskLevelColor(analysis.riskLevel)
              }}
            >
              {getRiskLevelLabel(analysis.riskLevel)}
            </span>
          </div>

          <div className="preview-content">
            <div className="preview-section">
              <div className="preview-label">설명</div>
              <div className="preview-value">{analysis.explanation}</div>
            </div>

            {analysis.corrections.length > 0 && (
              <div className="preview-section corrections">
                <div className="preview-label">💡 수정 제안</div>
                {analysis.corrections.map((correction, i) => (
                  <div key={i} className="correction-item">
                    <code className="correction-original">{correction.original}</code>
                    <span className="correction-arrow">→</span>
                    <code 
                      className="correction-fixed"
                      onClick={() => {
                        onChange(value.replace(correction.original, correction.corrected));
                      }}
                    >
                      {correction.corrected}
                    </code>
                  </div>
                ))}
              </div>
            )}

            {analysis.alternatives.length > 0 && (
              <div className="preview-section">
                <div className="preview-label">🛡️ 더 안전한 대안</div>
                <div className="alternatives-list">
                  {analysis.alternatives.map((alt, i) => (
                    <button
                      key={i}
                      className="alternative-item"
                      onClick={() => onChange(alt.command)}
                    >
                      <code>{alt.command}</code>
                      <span className="alternative-desc">{alt.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {analysis.estimatedDuration && (
              <div className="preview-section">
                <div className="preview-label">⏱️ 예상 시간</div>
                <div className="preview-value">{analysis.estimatedDuration}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Command Input */}
      <div className={`command-input-wrapper ${readOnly ? 'read-only' : ''} ${disabled ? 'disabled' : ''}`}>
        <div className="input-prompt">
          <span className="prompt-user">user@{serverName}</span>
          <span className="prompt-separator">:</span>
          <span className="prompt-path">{currentDir}</span>
          <span className="prompt-symbol">$</span>
        </div>

        <input
          type="text"
          className="command-text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowPreview(true)}
          onBlur={() => setTimeout(() => setShowPreview(false), 200)}
          disabled={disabled || readOnly}
          placeholder={readOnly ? '읽기 전용 모드' : '명령어를 입력하세요...'}
          autoComplete="off"
          spellCheck={false}
        />

        {value && analysis && (
          <div 
            className="risk-indicator"
            style={{ backgroundColor: getRiskLevelColor(analysis.riskLevel) }}
            title={`위험도: ${Math.round(analysis.riskScore * 100)}%`}
          />
        )}

        <div className="input-actions">
          {previewEnabled && (
            <button
              className="action-btn"
              onClick={() => setShowPreview(!showPreview)}
              title="미리보기"
            >
              👁️
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && analysis && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <div className="confirmation-header">
              <span className="confirmation-icon">⚠️</span>
              <h3>위험 명령 확인</h3>
            </div>
            <div className="confirmation-body">
              <p>다음 명령을 실행하시겠습니까?</p>
              <code className="confirmation-command">{value}</code>
              <div className="confirmation-risks">
                <strong>위험 요소:</strong>
                <ul>
                  {analysis.categories.map((cat, i) => (
                    <li key={i}>{cat}</li>
                  ))}
                </ul>
              </div>
              {analysis.alternatives.length > 0 && (
                <div className="confirmation-alternatives">
                  <strong>더 안전한 대안:</strong>
                  {analysis.alternatives.map((alt, i) => (
                    <button
                      key={i}
                      className="alternative-btn"
                      onClick={() => {
                        setShowConfirmation(false);
                        onChange(alt.command);
                      }}
                    >
                      {alt.description}: <code>{alt.command}</code>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmation(false)}
              >
                취소
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmExecute}
              >
                그래도 실행
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-input-container {
          position: relative;
        }

        .command-preview-panel {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          margin-bottom: 8px;
          overflow: hidden;
          animation: slideUp 0.2s ease-out;
          max-height: 300px;
          overflow-y: auto;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--color-bg-tertiary);
          border-bottom: 1px solid var(--color-border);
        }

        .preview-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .risk-badge {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .preview-content {
          padding: 12px;
        }

        .preview-section {
          margin-bottom: 12px;
        }

        .preview-section:last-child {
          margin-bottom: 0;
        }

        .preview-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .preview-value {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
        }

        .correction-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
        }

        .correction-original {
          text-decoration: line-through;
          color: var(--color-danger);
          font-size: 0.85rem;
        }

        .correction-arrow {
          color: var(--color-text-muted);
        }

        .correction-fixed {
          color: var(--color-success);
          cursor: pointer;
          font-size: 0.85rem;
        }

        .correction-fixed:hover {
          text-decoration: underline;
        }

        .alternatives-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .alternative-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .alternative-item:hover {
          border-color: var(--color-primary);
        }

        .alternative-item code {
          color: var(--color-primary);
          font-size: 0.85rem;
        }

        .alternative-desc {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .command-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--terminal-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          gap: 8px;
        }

        .command-input-wrapper.read-only {
          opacity: 0.7;
          background: var(--color-bg-tertiary);
        }

        .command-input-wrapper.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .input-prompt {
          display: flex;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .prompt-user {
          color: var(--color-success);
        }

        .prompt-separator {
          color: var(--color-text-primary);
        }

        .prompt-path {
          color: var(--color-primary);
        }

        .prompt-symbol {
          color: var(--color-text-primary);
          margin-left: 4px;
        }

        .command-text-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          color: var(--terminal-fg);
          caret-color: var(--terminal-cursor);
        }

        .command-text-input::placeholder {
          color: var(--color-text-muted);
        }

        .risk-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .input-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          opacity: 0.5;
          transition: opacity var(--transition-fast);
        }

        .action-btn:hover {
          opacity: 1;
        }

        .confirmation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .confirmation-dialog {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 450px;
          overflow: hidden;
        }

        .confirmation-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: var(--color-danger-bg);
          border-bottom: 1px solid var(--color-danger);
        }

        .confirmation-icon {
          font-size: 1.5rem;
        }

        .confirmation-header h3 {
          margin: 0;
          color: var(--color-danger);
        }

        .confirmation-body {
          padding: 20px;
        }

        .confirmation-body p {
          margin-bottom: 12px;
          color: var(--color-text-secondary);
        }

        .confirmation-command {
          display: block;
          padding: 12px;
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          margin-bottom: 16px;
          word-break: break-all;
        }

        .confirmation-risks {
          padding: 12px;
          background: var(--color-danger-bg);
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
        }

        .confirmation-risks strong {
          display: block;
          margin-bottom: 8px;
          color: var(--color-danger);
        }

        .confirmation-risks ul {
          margin: 0;
          padding-left: 20px;
          color: var(--color-text-secondary);
        }

        .confirmation-alternatives {
          padding: 12px;
          background: var(--color-success-bg);
          border-radius: var(--radius-sm);
        }

        .confirmation-alternatives strong {
          display: block;
          margin-bottom: 8px;
          color: var(--color-success);
        }

        .alternative-btn {
          display: block;
          width: 100%;
          padding: 8px 12px;
          margin-top: 8px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          text-align: left;
          font-size: 0.85rem;
        }

        .alternative-btn:hover {
          border-color: var(--color-success);
        }

        .alternative-btn code {
          color: var(--color-success);
        }

        .confirmation-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Macro, MacroStep, MacroVariable, PRESET_MACROS } from '@/lib/terminal';

interface MacrosPanelProps {
  macros: Macro[];
  onExecuteMacro: (macro: Macro, variables: Record<string, string>) => void;
  onAddMacro: (macro: Omit<Macro, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRemoveMacro: (id: string) => void;
  onClose: () => void;
}

export default function MacrosPanel({
  macros,
  onExecuteMacro,
  onAddMacro,
  onRemoveMacro,
  onClose,
}: MacrosPanelProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'presets'>('my');
  const [selectedMacro, setSelectedMacro] = useState<Macro | typeof PRESET_MACROS[0] | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Initialize variables when macro is selected
  const handleSelectMacro = (macro: Macro | typeof PRESET_MACROS[0]) => {
    setSelectedMacro(macro);
    const initialVars: Record<string, string> = {};
    macro.variables.forEach(v => {
      initialVars[v.name] = v.defaultValue || '';
    });
    setVariables(initialVars);
  };

  const handleExecute = () => {
    if (!selectedMacro) return;
    
    // Check required variables
    const missingRequired = selectedMacro.variables.filter(v => 
      v.required && !variables[v.name]
    );
    
    if (missingRequired.length > 0) {
      alert(`필수 변수를 입력해주세요: ${missingRequired.map(v => v.name).join(', ')}`);
      return;
    }

    if ('id' in selectedMacro) {
      onExecuteMacro(selectedMacro, variables);
    } else {
      // For preset macros, create a temporary macro object
      const tempMacro: Macro = {
        id: `preset_${Date.now()}`,
        userId: 'current',
        ...selectedMacro,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onExecuteMacro(tempMacro, variables);
    }
  };

  const handleAddPresetToMy = (preset: typeof PRESET_MACROS[0]) => {
    onAddMacro({
      ...preset,
      userId: 'current',
      isShared: false,
    });
    setActiveTab('my');
  };

  return (
    <div className="macros-panel">
      <div className="macros-header">
        <h2>🤖 매크로 관리</h2>
        <button className="macros-close" onClick={onClose}>×</button>
      </div>

      <div className="macros-tabs">
        <button
          className={`macros-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          📁 내 매크로 ({macros.length})
        </button>
        <button
          className={`macros-tab ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          📦 프리셋 ({PRESET_MACROS.length})
        </button>
      </div>

      <div className="macros-content">
        <div className="macros-list">
          {activeTab === 'my' && (
            <>
              {macros.length === 0 ? (
                <div className="macros-empty">
                  <span className="empty-icon">📝</span>
                  <p>저장된 매크로가 없습니다</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowCreateModal(true)}
                  >
                    첫 매크로 만들기
                  </button>
                </div>
              ) : (
                macros.map(macro => (
                  <div
                    key={macro.id}
                    className={`macro-item ${selectedMacro && 'id' in selectedMacro && selectedMacro.id === macro.id ? 'selected' : ''}`}
                    onClick={() => handleSelectMacro(macro)}
                  >
                    <div className="macro-item-header">
                      <span className="macro-name">{macro.name}</span>
                      <span className="macro-steps">{macro.steps.length} 단계</span>
                    </div>
                    {macro.description && (
                      <p className="macro-description">{macro.description}</p>
                    )}
                    <div className="macro-meta">
                      {macro.variables.length > 0 && (
                        <span className="macro-vars">📝 변수 {macro.variables.length}개</span>
                      )}
                      {macro.isShared && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>공유됨</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'presets' && (
            <>
              {PRESET_MACROS.map((preset, index) => (
                <div
                  key={index}
                  className={`macro-item ${selectedMacro === preset ? 'selected' : ''}`}
                  onClick={() => handleSelectMacro(preset)}
                >
                  <div className="macro-item-header">
                    <span className="macro-name">{preset.name}</span>
                    <span className="macro-steps">{preset.steps.length} 단계</span>
                  </div>
                  {preset.description && (
                    <p className="macro-description">{preset.description}</p>
                  )}
                  <div className="macro-meta">
                    {preset.variables.length > 0 && (
                      <span className="macro-vars">📝 변수 {preset.variables.length}개</span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPresetToMy(preset);
                      }}
                    >
                      내 매크로에 추가
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Macro Detail Panel */}
        {selectedMacro && (
          <div className="macro-detail">
            <h3>{selectedMacro.name}</h3>
            {selectedMacro.description && (
              <p className="detail-description">{selectedMacro.description}</p>
            )}

            {/* Steps Preview */}
            <div className="detail-section">
              <h4>실행 단계</h4>
              <div className="steps-list">
                {selectedMacro.steps.map((step, index) => (
                  <div key={step.id || index} className="step-item">
                    <span className="step-number">{index + 1}</span>
                    <div className="step-content">
                      {step.type === 'command' && (
                        <>
                          <span className="step-type">명령 실행</span>
                          <code>{step.command}</code>
                        </>
                      )}
                      {step.type === 'wait' && (
                        <>
                          <span className="step-type">대기</span>
                          <span>{step.waitTime}ms</span>
                        </>
                      )}
                      {step.type === 'prompt' && (
                        <>
                          <span className="step-type">확인</span>
                          <span>{step.prompt}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Variables Input */}
            {selectedMacro.variables.length > 0 && (
              <div className="detail-section">
                <h4>변수 설정</h4>
                <div className="variables-form">
                  {selectedMacro.variables.map((variable) => (
                    <div key={variable.name} className="variable-input">
                      <label>
                        {variable.name}
                        {variable.required && <span className="required">*</span>}
                      </label>
                      {variable.description && (
                        <span className="variable-hint">{variable.description}</span>
                      )}
                      {variable.type === 'select' ? (
                        <select
                          className="form-input form-select"
                          value={variables[variable.name] || ''}
                          onChange={(e) => setVariables({
                            ...variables,
                            [variable.name]: e.target.value,
                          })}
                        >
                          <option value="">선택...</option>
                          {variable.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={variable.type === 'number' ? 'number' : 'text'}
                          className="form-input"
                          value={variables[variable.name] || ''}
                          onChange={(e) => setVariables({
                            ...variables,
                            [variable.name]: e.target.value,
                          })}
                          placeholder={variable.defaultValue || ''}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-actions">
              {'id' in selectedMacro && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (confirm('이 매크로를 삭제하시겠습니까?')) {
                      onRemoveMacro(selectedMacro.id);
                      setSelectedMacro(null);
                    }
                  }}
                >
                  삭제
                </button>
              )}
              <button className="btn btn-primary" onClick={handleExecute}>
                ▶️ 실행
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .macros-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 600px;
          height: 100vh;
          background: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .macros-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .macros-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .macros-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: 1.2rem;
        }

        .macros-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }

        .macros-tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .macros-tab:hover {
          color: var(--color-text-primary);
        }

        .macros-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .macros-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .macros-list {
          width: 50%;
          border-right: 1px solid var(--color-border);
          overflow-y: auto;
          padding: 12px;
        }

        .macros-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .macros-empty p {
          color: var(--color-text-secondary);
          margin-bottom: 16px;
        }

        .macro-item {
          padding: 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          margin-bottom: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .macro-item:hover {
          border-color: var(--color-text-muted);
        }

        .macro-item.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-glow);
        }

        .macro-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .macro-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .macro-steps {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .macro-description {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          margin: 0 0 8px;
        }

        .macro-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .macro-vars {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }

        .macro-detail {
          width: 50%;
          padding: 16px;
          overflow-y: auto;
        }

        .macro-detail h3 {
          margin: 0 0 8px;
        }

        .detail-description {
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          margin: 0 0 20px;
        }

        .detail-section {
          margin-bottom: 20px;
        }

        .detail-section h4 {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 12px;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px;
          background: var(--color-surface);
          border-radius: var(--radius-sm);
        }

        .step-number {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary-glow);
          color: var(--color-primary);
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-type {
          display: block;
          font-size: 0.7rem;
          color: var(--color-text-muted);
          margin-bottom: 4px;
        }

        .step-content code {
          font-size: 0.85rem;
          color: var(--color-text-primary);
        }

        .variables-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .variable-input label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .required {
          color: var(--color-danger);
          margin-left: 2px;
        }

        .variable-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-bottom: 6px;
        }

        .detail-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}

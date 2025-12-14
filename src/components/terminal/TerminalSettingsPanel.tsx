'use client';

import { useState } from 'react';
import { TerminalSettings, TerminalTheme } from '@/lib/terminal/types';

interface SettingsPanelProps {
  settings: TerminalSettings;
  themes: TerminalTheme[];
  currentTheme: TerminalTheme;
  onUpdateSettings: (settings: Partial<TerminalSettings>) => void;
  onClose: () => void;
}

export default function TerminalSettingsPanel({
  settings,
  themes,
  currentTheme,
  onUpdateSettings,
  onClose,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'security'>('appearance');

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>터미널 설정</h2>
        <button className="settings-close" onClick={onClose}>×</button>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          🎨 외관
        </button>
        <button
          className={`settings-tab ${activeTab === 'behavior' ? 'active' : ''}`}
          onClick={() => setActiveTab('behavior')}
        >
          ⚙️ 동작
        </button>
        <button
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 보안
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'appearance' && (
          <div className="settings-section">
            <h3>테마</h3>
            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-option ${settings.theme === theme.id ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ theme: theme.id })}
                >
                  <div 
                    className="theme-preview"
                    style={{
                      background: theme.background,
                      color: theme.foreground,
                    }}
                  >
                    <span style={{ color: theme.green }}>$</span>{' '}
                    <span style={{ color: theme.yellow }}>ls</span>{' '}
                    <span style={{ color: theme.blue }}>-la</span>
                  </div>
                  <span className="theme-name">{theme.name}</span>
                </button>
              ))}
            </div>

            <h3>폰트</h3>
            <div className="setting-group">
              <label>폰트 크기</label>
              <div className="setting-input-row">
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                />
                <span className="setting-value">{settings.fontSize}px</span>
              </div>
            </div>

            <div className="setting-group">
              <label>폰트 패밀리</label>
              <select
                className="form-input form-select"
                value={settings.fontFamily}
                onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
              >
                <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
                <option value='"Fira Code", monospace'>Fira Code</option>
                <option value='Consolas, monospace'>Consolas</option>
                <option value='"Source Code Pro", monospace'>Source Code Pro</option>
                <option value='Monaco, monospace'>Monaco</option>
              </select>
            </div>

            <div className="setting-group">
              <label>줄 높이</label>
              <div className="setting-input-row">
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
                />
                <span className="setting-value">{settings.lineHeight}</span>
              </div>
            </div>

            <h3>커서</h3>
            <div className="setting-group">
              <label>커서 스타일</label>
              <div className="cursor-options">
                {(['block', 'underline', 'bar'] as const).map((style) => (
                  <button
                    key={style}
                    className={`cursor-option ${settings.cursorStyle === style ? 'active' : ''}`}
                    onClick={() => onUpdateSettings({ cursorStyle: style })}
                  >
                    <div className={`cursor-preview cursor-${style}`}></div>
                    <span>{style === 'block' ? '블록' : style === 'underline' ? '밑줄' : '막대'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-toggle">
                <span>커서 깜빡임</span>
                <input
                  type="checkbox"
                  checked={settings.cursorBlink}
                  onChange={(e) => onUpdateSettings({ cursorBlink: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="settings-section">
            <h3>스크롤</h3>
            <div className="setting-group">
              <label>스크롤백 라인 수</label>
              <div className="setting-input-row">
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={settings.scrollback}
                  onChange={(e) => onUpdateSettings({ scrollback: Number(e.target.value) })}
                />
                <span className="setting-value">{settings.scrollback.toLocaleString()}</span>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-toggle">
                <span>자동 스크롤</span>
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => onUpdateSettings({ autoScroll: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-toggle">
                <span>줄 바꿈</span>
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <h3>알림</h3>
            <div className="setting-group">
              <label>벨 스타일</label>
              <select
                className="form-input form-select"
                value={settings.bellStyle}
                onChange={(e) => onUpdateSettings({ bellStyle: e.target.value as any })}
              >
                <option value="none">없음</option>
                <option value="visual">시각적</option>
                <option value="sound">소리</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <div className="security-notice">
              <span className="security-icon">🔒</span>
              <div>
                <strong>보안 설정</strong>
                <p>이 설정들은 터미널 사용 중 보안을 강화합니다.</p>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-toggle">
                <span>붙여넣기 필터</span>
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-description">위험한 명령어 패턴을 감지하고 차단합니다</span>
            </div>

            <div className="setting-group">
              <label className="setting-toggle">
                <span>입력 속도 감지</span>
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-description">자동 입력 시도를 탐지합니다</span>
            </div>

            <div className="setting-group">
              <label className="setting-toggle">
                <span>세션 워터마크</span>
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-description">화면에 사용자 정보를 워터마크로 표시합니다</span>
            </div>

            <div className="setting-group">
              <label className="setting-toggle">
                <span>자동 잠금</span>
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-description">비활성 시 자동으로 잠금합니다</span>
            </div>

            <div className="setting-group">
              <label>자동 잠금 시간</label>
              <select className="form-input form-select" defaultValue="300">
                <option value="60">1분</option>
                <option value="180">3분</option>
                <option value="300">5분</option>
                <option value="600">10분</option>
                <option value="900">15분</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .settings-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .settings-close {
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
          transition: all var(--transition-fast);
        }

        .settings-close:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .settings-tabs {
          display: flex;
          padding: 0 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .settings-tab {
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .settings-tab:hover {
          color: var(--color-text-primary);
        }

        .settings-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .settings-section h3 {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          margin: 20px 0 12px;
        }

        .settings-section h3:first-child {
          margin-top: 0;
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .theme-option {
          padding: 12px;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .theme-option:hover {
          border-color: var(--color-text-muted);
        }

        .theme-option.active {
          border-color: var(--color-primary);
          box-shadow: 0 0 10px var(--color-primary-glow);
        }

        .theme-preview {
          padding: 10px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          margin-bottom: 8px;
        }

        .theme-name {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }

        .theme-option.active .theme-name {
          color: var(--color-primary);
        }

        .setting-group {
          margin-bottom: 16px;
        }

        .setting-group > label {
          display: block;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }

        .setting-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .setting-input-row input[type="range"] {
          flex: 1;
          accent-color: var(--color-primary);
        }

        .setting-value {
          font-size: 0.85rem;
          font-family: var(--font-mono);
          color: var(--color-primary);
          min-width: 60px;
          text-align: right;
        }

        .cursor-options {
          display: flex;
          gap: 12px;
        }

        .cursor-option {
          flex: 1;
          padding: 12px;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: center;
          transition: all var(--transition-fast);
        }

        .cursor-option:hover {
          border-color: var(--color-text-muted);
        }

        .cursor-option.active {
          border-color: var(--color-primary);
        }

        .cursor-preview {
          height: 20px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cursor-block::before {
          content: '';
          display: block;
          width: 10px;
          height: 16px;
          background: var(--color-primary);
        }

        .cursor-underline::before {
          content: '';
          display: block;
          width: 10px;
          height: 2px;
          background: var(--color-primary);
        }

        .cursor-bar::before {
          content: '';
          display: block;
          width: 2px;
          height: 16px;
          background: var(--color-primary);
        }

        .cursor-option span {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .setting-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
        }

        .setting-toggle input {
          display: none;
        }

        .toggle-slider {
          width: 44px;
          height: 24px;
          background: var(--color-surface);
          border-radius: 12px;
          position: relative;
          transition: all var(--transition-fast);
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: var(--color-text-muted);
          border-radius: 50%;
          transition: all var(--transition-fast);
        }

        .setting-toggle input:checked + .toggle-slider {
          background: var(--color-primary-glow);
        }

        .setting-toggle input:checked + .toggle-slider::before {
          transform: translateX(20px);
          background: var(--color-primary);
        }

        .setting-description {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .security-notice {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: var(--color-info-bg);
          border-radius: var(--radius-md);
          margin-bottom: 20px;
        }

        .security-icon {
          font-size: 1.5rem;
        }

        .security-notice strong {
          display: block;
          margin-bottom: 4px;
        }

        .security-notice p {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin: 0;
        }
      `}</style>
    </div>
  );
}

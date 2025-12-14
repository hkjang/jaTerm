'use client';

import { useState } from 'react';
import { TerminalTab } from '@/lib/terminal/types';

interface TabBarProps {
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
}

export default function TerminalTabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onAddTab,
}: TabBarProps) {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: TerminalTab['status']) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      case 'error': return '⚠️';
      default: return '⚪';
    }
  };

  const getQualityIcon = (quality?: TerminalTab['connectionQuality']) => {
    switch (quality) {
      case 'excellent': return '📶';
      case 'good': return '📶';
      case 'fair': return '📶';
      case 'poor': return '📶';
      default: return '';
    }
  };

  return (
    <div className="terminal-tab-bar">
      <div className="terminal-tabs-container">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`terminal-tab ${tab.id === activeTabId ? 'active' : ''} ${draggedTabId === tab.id ? 'dragging' : ''}`}
            onClick={() => onTabSelect(tab.id)}
            draggable
            onDragStart={() => setDraggedTabId(tab.id)}
            onDragEnd={() => setDraggedTabId(null)}
          >
            <div className="terminal-tab-content">
              <span 
                className="terminal-tab-env" 
                style={{ backgroundColor: getEnvironmentColor(tab.environment) + '20', color: getEnvironmentColor(tab.environment) }}
              >
                {tab.environment.slice(0, 1)}
              </span>
              <span className="terminal-tab-status">{getStatusIcon(tab.status)}</span>
              <span className="terminal-tab-name">{tab.serverName}</span>
              {tab.isRecording && (
                <span className="terminal-tab-recording" title="녹화 중">
                  <span className="recording-dot"></span>
                </span>
              )}
            </div>
            <button
              className="terminal-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="탭 닫기"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <button className="terminal-tab-add" onClick={onAddTab} title="새 세션">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <style jsx>{`
        .terminal-tab-bar {
          display: flex;
          align-items: center;
          height: 40px;
          background: var(--color-bg-tertiary);
          border-bottom: 1px solid var(--color-border);
          padding: 0 8px;
          gap: 4px;
        }

        .terminal-tabs-container {
          display: flex;
          flex: 1;
          overflow-x: auto;
          gap: 4px;
          padding: 4px 0;
        }

        .terminal-tabs-container::-webkit-scrollbar {
          height: 4px;
        }

        .terminal-tabs-container::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 2px;
        }

        .terminal-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: var(--color-surface);
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
          min-width: 140px;
          max-width: 200px;
        }

        .terminal-tab:hover {
          background: var(--color-surface-hover);
        }

        .terminal-tab.active {
          background: var(--color-bg-secondary);
          border-color: var(--color-primary);
          box-shadow: 0 0 10px var(--color-primary-glow);
        }

        .terminal-tab.dragging {
          opacity: 0.5;
        }

        .terminal-tab-content {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          overflow: hidden;
        }

        .terminal-tab-env {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 4px;
        }

        .terminal-tab-status {
          font-size: 0.7rem;
        }

        .terminal-tab-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .terminal-tab.active .terminal-tab-name {
          color: var(--color-text-primary);
        }

        .terminal-tab-recording {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .recording-dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .terminal-tab-close {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 1rem;
          transition: all var(--transition-fast);
          opacity: 0;
        }

        .terminal-tab:hover .terminal-tab-close,
        .terminal-tab.active .terminal-tab-close {
          opacity: 1;
        }

        .terminal-tab-close:hover {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }

        .terminal-tab-add {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .terminal-tab-add:hover {
          background: var(--color-surface);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

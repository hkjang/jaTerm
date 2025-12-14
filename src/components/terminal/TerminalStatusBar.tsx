'use client';

import { useState, useEffect } from 'react';
import { ConnectionStatus, ResourceUsage } from '@/lib/terminal/types';

interface StatusBarProps {
  sessionId: string;
  serverName: string;
  connectionStatus?: ConnectionStatus;
  resourceUsage?: ResourceUsage;
  isRecording: boolean;
  userRole: string;
  readOnly?: boolean;
  onReconnect?: () => void;
}

export default function TerminalStatusBar({
  sessionId,
  serverName,
  connectionStatus,
  resourceUsage,
  isRecording,
  userRole,
  readOnly = false,
  onReconnect,
}: StatusBarProps) {
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      setSessionDuration(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const getStatusIcon = () => {
    if (!connectionStatus) return { icon: '🔵', label: '연결됨', color: '#10b981' };
    
    switch (connectionStatus.status) {
      case 'connected':
        return { icon: '🟢', label: '연결됨', color: '#10b981' };
      case 'reconnecting':
        return { icon: '🟡', label: '재연결 중...', color: '#f59e0b' };
      case 'disconnected':
        return { icon: '🔴', label: '연결 끊김', color: '#ef4444' };
      default:
        return { icon: '⚪', label: '알 수 없음', color: '#6b7280' };
    }
  };

  const getQualityLabel = () => {
    if (!connectionStatus) return null;
    
    switch (connectionStatus.quality) {
      case 'excellent':
        return { label: '우수', bars: 4, color: '#10b981' };
      case 'good':
        return { label: '양호', bars: 3, color: '#10b981' };
      case 'fair':
        return { label: '보통', bars: 2, color: '#f59e0b' };
      case 'poor':
        return { label: '불량', bars: 1, color: '#ef4444' };
      default:
        return null;
    }
  };

  const status = getStatusIcon();
  const quality = getQualityLabel();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="status-bar">
      {/* Left Section */}
      <div className="status-section left">
        {/* Connection Status */}
        <div className="status-item" style={{ color: status.color }}>
          <span className="status-icon">{status.icon}</span>
          <span className="status-text">{status.label}</span>
          {connectionStatus?.status === 'reconnecting' && (
            <span className="reconnect-count">
              ({connectionStatus.reconnectAttempts})
            </span>
          )}
          {connectionStatus?.status === 'disconnected' && onReconnect && (
            <button className="btn-reconnect" onClick={onReconnect}>
              재연결
            </button>
          )}
        </div>

        {/* Connection Quality */}
        {quality && (
          <div className="status-item quality">
            <div className="quality-bars">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`quality-bar ${bar <= quality.bars ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: bar <= quality.bars ? quality.color : 'var(--color-border)',
                    height: `${bar * 3 + 4}px`,
                  }}
                />
              ))}
            </div>
            <span className="quality-label">{quality.label}</span>
          </div>
        )}

        {/* Latency */}
        {connectionStatus?.latency !== undefined && (
          <div className="status-item">
            <span className="status-label">지연:</span>
            <span className={`status-value ${connectionStatus.latency > 200 ? 'warning' : ''}`}>
              {connectionStatus.latency}ms
            </span>
          </div>
        )}
      </div>

      {/* Center Section */}
      <div className="status-section center">
        {/* Server Name */}
        <div className="status-server">
          <span className="server-name">{serverName}</span>
        </div>

        {/* Session Duration */}
        <div className="status-item">
          <span className="status-icon">⏱️</span>
          <span className="status-value mono">{sessionDuration}</span>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="status-item recording">
            <span className="recording-dot"></span>
            <span className="status-text">REC</span>
          </div>
        )}

        {/* Read Only Mode */}
        {readOnly && (
          <div className="status-item read-only">
            <span className="status-icon">👁️</span>
            <span className="status-text">읽기 전용</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="status-section right">
        {/* Resource Usage */}
        {resourceUsage && (
          <>
            <div className="status-item">
              <span className="status-label">CPU:</span>
              <span className={`status-value ${resourceUsage.cpu > 80 ? 'warning' : ''}`}>
                {resourceUsage.cpu.toFixed(1)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">MEM:</span>
              <span className={`status-value ${resourceUsage.memory.percentage > 80 ? 'warning' : ''}`}>
                {resourceUsage.memory.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">↓</span>
              <span className="status-value">{formatBytes(resourceUsage.network.bytesIn)}/s</span>
            </div>
          </>
        )}

        {/* User Role */}
        <div className={`status-item role role-${userRole.toLowerCase()}`}>
          <span className="role-badge">{userRole}</span>
        </div>

        {/* Session ID */}
        <div className="status-item session-id">
          <span className="status-label">ID:</span>
          <span 
            className="status-value mono"
            title={sessionId}
          >
            {sessionId.slice(0, 8)}
          </span>
        </div>
      </div>

      <style jsx>{`
        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 28px;
          background: linear-gradient(to right, var(--color-bg-tertiary), var(--color-bg-secondary));
          border-top: 1px solid var(--color-border);
          padding: 0 12px;
          font-size: 0.75rem;
          user-select: none;
        }

        .status-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-section.left {
          justify-content: flex-start;
        }

        .status-section.center {
          justify-content: center;
        }

        .status-section.right {
          justify-content: flex-end;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-text-secondary);
        }

        .status-icon {
          font-size: 0.85rem;
        }

        .status-label {
          color: var(--color-text-muted);
        }

        .status-value {
          color: var(--color-text-primary);
        }

        .status-value.warning {
          color: var(--color-warning);
        }

        .status-value.mono {
          font-family: var(--font-mono);
        }

        .reconnect-count {
          font-size: 0.65rem;
          color: var(--color-text-muted);
        }

        .btn-reconnect {
          padding: 2px 8px;
          margin-left: 4px;
          background: var(--color-primary-glow);
          border: none;
          border-radius: 4px;
          color: var(--color-primary);
          cursor: pointer;
          font-size: 0.7rem;
          transition: all var(--transition-fast);
        }

        .btn-reconnect:hover {
          background: var(--color-primary);
          color: white;
        }

        .quality {
          gap: 6px;
        }

        .quality-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 16px;
        }

        .quality-bar {
          width: 4px;
          border-radius: 1px;
          transition: all var(--transition-fast);
        }

        .quality-label {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }

        .server-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .recording {
          color: var(--color-danger);
        }

        .recording-dot {
          width: 8px;
          height: 8px;
          background: var(--color-danger);
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .read-only {
          padding: 2px 8px;
          background: var(--color-warning-bg);
          border-radius: 4px;
          color: var(--color-warning);
        }

        .role-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-admin .role-badge {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }

        .role-operator .role-badge {
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        .role-developer .role-badge {
          background: var(--color-info-bg);
          color: var(--color-info);
        }

        .role-viewer .role-badge {
          background: var(--color-surface);
          color: var(--color-text-muted);
        }

        .session-id {
          cursor: pointer;
        }

        .session-id:hover .status-value {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

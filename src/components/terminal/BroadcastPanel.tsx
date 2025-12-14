'use client';

import { useState, useEffect, useMemo } from 'react';
import { BroadcastCommand, BroadcastResult, ServerFilter } from '@/lib/terminal/types';
import { aggregateBroadcastResults, AggregatedResults } from '@/lib/terminal/automation';

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  status: 'online' | 'offline' | 'maintenance';
  tags?: string[];
}

interface BroadcastPanelProps {
  servers: Server[];
  onExecute: (serverIds: string[], command: string) => Promise<BroadcastResult[]>;
  onClose: () => void;
}

export default function BroadcastPanel({
  servers,
  onExecute,
  onClose,
}: BroadcastPanelProps) {
  const [command, setCommand] = useState('');
  const [filter, setFilter] = useState<ServerFilter>({
    environments: [],
    tags: [],
    status: ['online'],
    search: '',
  });
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [excludedServers, setExcludedServers] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<BroadcastResult[] | null>(null);
  const [aggregated, setAggregated] = useState<AggregatedResults | null>(null);
  const [serverProgress, setServerProgress] = useState<Record<string, 'pending' | 'running' | 'completed' | 'failed'>>({});

  // Filter servers
  const filteredServers = useMemo(() => {
    return servers.filter(server => {
      // Environment filter
      if (filter.environments.length > 0 && !filter.environments.includes(server.environment)) {
        return false;
      }
      // Status filter
      if (filter.status.length > 0 && !filter.status.includes(server.status)) {
        return false;
      }
      // Search filter
      if (filter.search && !server.name.toLowerCase().includes(filter.search.toLowerCase()) &&
          !server.hostname.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [servers, filter]);

  // Select all filtered servers
  const handleSelectAll = () => {
    const allIds = new Set(filteredServers.map(s => s.id));
    setSelectedServers(allIds);
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedServers(new Set());
  };

  // Toggle server selection
  const toggleServer = (serverId: string) => {
    const newSelected = new Set(selectedServers);
    if (newSelected.has(serverId)) {
      newSelected.delete(serverId);
    } else {
      newSelected.add(serverId);
    }
    setSelectedServers(newSelected);
  };

  // Toggle exclude
  const toggleExclude = (serverId: string) => {
    const newExcluded = new Set(excludedServers);
    if (newExcluded.has(serverId)) {
      newExcluded.delete(serverId);
    } else {
      newExcluded.add(serverId);
    }
    setExcludedServers(newExcluded);
  };

  // Toggle environment filter
  const toggleEnvironment = (env: 'PROD' | 'STAGE' | 'DEV') => {
    setFilter(prev => ({
      ...prev,
      environments: prev.environments.includes(env)
        ? prev.environments.filter(e => e !== env)
        : [...prev.environments, env],
    }));
  };

  // Execute broadcast
  const handleExecute = async () => {
    if (!command.trim() || selectedServers.size === 0) return;

    setIsExecuting(true);
    setResults(null);
    setAggregated(null);

    // Initialize progress
    const initialProgress: Record<string, 'pending' | 'running' | 'completed' | 'failed'> = {};
    selectedServers.forEach(id => {
      if (!excludedServers.has(id)) {
        initialProgress[id] = 'pending';
      }
    });
    setServerProgress(initialProgress);

    const targetServers = Array.from(selectedServers).filter(id => !excludedServers.has(id));
    
    try {
      const broadcastResults = await onExecute(targetServers, command);
      setResults(broadcastResults);
      setAggregated(aggregateBroadcastResults(broadcastResults));
      
      // Update progress based on results
      const finalProgress: Record<string, 'pending' | 'running' | 'completed' | 'failed'> = {};
      broadcastResults.forEach(r => {
        finalProgress[r.serverId] = r.status === 'success' ? 'completed' : 'failed';
      });
      setServerProgress(finalProgress);
    } catch (error) {
      console.error('Broadcast execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="broadcast-panel">
      <div className="broadcast-header">
        <h2>🌐 다중 서버 브로드캐스트</h2>
        <button className="broadcast-close" onClick={onClose}>×</button>
      </div>

      <div className="broadcast-content">
        {/* Command Input */}
        <div className="broadcast-section">
          <label>실행할 명령어</label>
          <div className="command-input-wrapper">
            <input
              type="text"
              className="form-input"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="예: uptime, df -h, systemctl status nginx"
              disabled={isExecuting}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="broadcast-section">
          <label>서버 필터</label>
          <div className="filter-row">
            <div className="filter-group">
              <span className="filter-label">환경:</span>
              {(['PROD', 'STAGE', 'DEV'] as const).map(env => (
                <button
                  key={env}
                  className={`filter-btn ${filter.environments.includes(env) ? 'active' : ''}`}
                  style={{ '--env-color': getEnvironmentColor(env) } as React.CSSProperties}
                  onClick={() => toggleEnvironment(env)}
                >
                  {env}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="form-input filter-search"
              placeholder="서버 검색..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {/* Server Selection */}
        <div className="broadcast-section">
          <div className="section-header">
            <label>대상 서버 ({selectedServers.size}개 선택됨)</label>
            <div className="section-actions">
              <button className="btn btn-ghost btn-sm" onClick={handleSelectAll}>전체 선택</button>
              <button className="btn btn-ghost btn-sm" onClick={handleDeselectAll}>전체 해제</button>
            </div>
          </div>
          
          <div className="server-grid">
            {filteredServers.map(server => (
              <div
                key={server.id}
                className={`server-card ${selectedServers.has(server.id) ? 'selected' : ''} ${excludedServers.has(server.id) ? 'excluded' : ''}`}
              >
                <div className="server-card-header">
                  <label className="server-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedServers.has(server.id)}
                      onChange={() => toggleServer(server.id)}
                      disabled={isExecuting}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <span
                    className="server-env"
                    style={{
                      backgroundColor: getEnvironmentColor(server.environment) + '20',
                      color: getEnvironmentColor(server.environment),
                    }}
                  >
                    {server.environment}
                  </span>
                  <span
                    className="server-status"
                    style={{ backgroundColor: getStatusColor(server.status) }}
                  ></span>
                </div>
                <div className="server-name">{server.name}</div>
                <div className="server-hostname">{server.hostname}</div>
                
                {selectedServers.has(server.id) && (
                  <button
                    className={`exclude-btn ${excludedServers.has(server.id) ? 'excluded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExclude(server.id);
                    }}
                    title={excludedServers.has(server.id) ? '제외 해제' : '제외'}
                  >
                    {excludedServers.has(server.id) ? '제외됨' : '제외'}
                  </button>
                )}

                {isExecuting && serverProgress[server.id] && (
                  <div className={`server-progress ${serverProgress[server.id]}`}>
                    {serverProgress[server.id] === 'pending' && '⏳'}
                    {serverProgress[server.id] === 'running' && '🔄'}
                    {serverProgress[server.id] === 'completed' && '✅'}
                    {serverProgress[server.id] === 'failed' && '❌'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {aggregated && (
          <div className="broadcast-section">
            <label>실행 결과</label>
            <div className="results-summary">
              <div className="result-stat">
                <span className="stat-value" style={{ color: 'var(--color-text-primary)' }}>{aggregated.total}</span>
                <span className="stat-label">전체</span>
              </div>
              <div className="result-stat">
                <span className="stat-value" style={{ color: 'var(--color-success)' }}>{aggregated.success}</span>
                <span className="stat-label">성공</span>
              </div>
              <div className="result-stat">
                <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{aggregated.failed}</span>
                <span className="stat-label">실패</span>
              </div>
              <div className="result-stat">
                <span className="stat-value" style={{ color: 'var(--color-warning)' }}>{aggregated.timeout}</span>
                <span className="stat-label">타임아웃</span>
              </div>
              <div className="result-stat">
                <span className="stat-value">{aggregated.successRate.toFixed(1)}%</span>
                <span className="stat-label">성공률</span>
              </div>
            </div>

            {results && (
              <div className="results-list">
                {results.map((result) => (
                  <details key={result.serverId} className={`result-item ${result.status}`}>
                    <summary>
                      <span className="result-icon">
                        {result.status === 'success' && '✅'}
                        {result.status === 'failed' && '❌'}
                        {result.status === 'timeout' && '⏱️'}
                        {result.status === 'skipped' && '⏭️'}
                      </span>
                      <span className="result-server">{result.serverName}</span>
                      <span className="result-duration">{result.duration}ms</span>
                    </summary>
                    <div className="result-output">
                      {result.output ? (
                        <pre>{result.output}</pre>
                      ) : result.error ? (
                        <pre className="error">{result.error}</pre>
                      ) : (
                        <span className="no-output">출력 없음</span>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="broadcast-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          닫기
        </button>
        <button
          className="btn btn-primary"
          onClick={handleExecute}
          disabled={isExecuting || !command.trim() || selectedServers.size === 0}
        >
          {isExecuting ? '실행 중...' : `${selectedServers.size - excludedServers.size}개 서버에 실행`}
        </button>
      </div>

      <style jsx>{`
        .broadcast-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }

        .broadcast-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .broadcast-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .broadcast-close {
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

        .broadcast-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .broadcast-section {
          margin-bottom: 20px;
        }

        .broadcast-section > label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        .filter-row {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .filter-btn {
          padding: 4px 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 9999px;
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-btn:hover,
        .filter-btn.active {
          border-color: var(--env-color);
          color: var(--env-color);
          background: color-mix(in srgb, var(--env-color) 10%, transparent);
        }

        .filter-search {
          flex: 1;
          max-width: 200px;
        }

        .server-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .server-card {
          padding: 12px;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .server-card:hover {
          border-color: var(--color-text-muted);
        }

        .server-card.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-glow);
        }

        .server-card.excluded {
          opacity: 0.5;
          border-style: dashed;
        }

        .server-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .server-checkbox {
          position: relative;
          width: 18px;
          height: 18px;
        }

        .server-checkbox input {
          opacity: 0;
          position: absolute;
        }

        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          width: 18px;
          height: 18px;
          background: var(--color-bg-tertiary);
          border: 2px solid var(--color-border);
          border-radius: 4px;
        }

        .server-checkbox input:checked ~ .checkmark {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        .checkmark::after {
          content: '';
          position: absolute;
          display: none;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .server-checkbox input:checked ~ .checkmark::after {
          display: block;
        }

        .server-env {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 600;
        }

        .server-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: auto;
        }

        .server-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .server-hostname {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .exclude-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 2px 6px;
          background: var(--color-warning-bg);
          border: none;
          border-radius: 4px;
          color: var(--color-warning);
          font-size: 0.65rem;
          cursor: pointer;
        }

        .exclude-btn.excluded {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }

        .server-progress {
          position: absolute;
          bottom: 8px;
          right: 8px;
          font-size: 0.9rem;
        }

        .results-summary {
          display: flex;
          gap: 20px;
          padding: 16px;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          margin-bottom: 12px;
        }

        .result-stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .result-item {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .result-item summary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--color-surface);
          cursor: pointer;
        }

        .result-item.success {
          border-color: var(--color-success);
        }

        .result-item.failed {
          border-color: var(--color-danger);
        }

        .result-icon {
          font-size: 0.9rem;
        }

        .result-server {
          font-weight: 500;
        }

        .result-duration {
          margin-left: auto;
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .result-output {
          padding: 12px;
          background: var(--color-bg-tertiary);
        }

        .result-output pre {
          margin: 0;
          font-size: 0.8rem;
          font-family: var(--font-mono);
          white-space: pre-wrap;
          word-break: break-all;
        }

        .result-output pre.error {
          color: var(--color-danger);
        }

        .no-output {
          color: var(--color-text-muted);
          font-style: italic;
        }

        .broadcast-footer {
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

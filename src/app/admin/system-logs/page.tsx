'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'CRITICAL';
  source: string;
  message: string;
  details?: string;
  timestamp: string;
  count?: number;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockLogs: SystemLog[] = [
      { id: '1', level: 'INFO', source: 'auth-service', message: '사용자 kim@company.com 로그인 성공', timestamp: new Date(Date.now() - 1 * 60000).toISOString() },
      { id: '2', level: 'WARN', source: 'ssh-gateway', message: '연결 시도 타임아웃: prod-web-01 (10초)', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
      { id: '3', level: 'INFO', source: 'session-manager', message: '세션 sess-001 시작: kim@company.com → prod-web-01', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
      { id: '4', level: 'ERROR', source: 'db-connector', message: 'DB 연결 실패: db-master-01 (Connection refused)', details: 'Error: ECONNREFUSED - connect ECONNREFUSED 10.0.3.10:5432\n    at TCPConnectWrap.afterConnect\n    at TCPConnectWrap.complete', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: '5', level: 'INFO', source: 'audit-logger', message: '명령어 기록: docker ps -a (김개발)', timestamp: new Date(Date.now() - 6 * 60000).toISOString() },
      { id: '6', level: 'WARN', source: 'auth-service', message: '로그인 실패 연속 3회: lee@company.com', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: '7', level: 'CRITICAL', source: 'security-monitor', message: '보안 경고: 차단된 IP에서 접근 시도 (1.2.3.4)', details: 'Source IP: 1.2.3.4\nTarget User: admin\nBlocked Reason: IP Blacklist\nAttempts: 5', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), count: 5 },
      { id: '8', level: 'INFO', source: 'mfa-service', message: 'MFA 인증 성공: park@company.com (TOTP)', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: '9', level: 'DEBUG', source: 'ssh-gateway', message: 'SSH 핸드셰이크 완료: stage-app-01', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: '10', level: 'ERROR', source: 'file-transfer', message: '파일 전송 실패: Permission denied (backup.tar.gz)', details: 'File: /var/backup/backup.tar.gz\nSize: 2.5 GB\nError: Permission denied - check server permissions', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: '11', level: 'INFO', source: 'session-manager', message: '세션 종료: sess-001 (정상 종료)', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: '12', level: 'WARN', source: 'resource-monitor', message: 'CPU 사용량 85% 초과: prod-web-01', timestamp: new Date(Date.now() - 50 * 60000).toISOString() },
      { id: '13', level: 'INFO', source: 'backup-service', message: '자동 백업 완료: config.db (12.5 MB)', timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
      { id: '14', level: 'CRITICAL', source: 'health-check', message: '서버 응답 없음: db-slave-02 (3회 연속)', details: 'Server: db-slave-02\nIP: 10.0.3.12\nLast Response: 5 minutes ago\nHealth Check Failed: 3 times', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), count: 3 },
      { id: '15', level: 'INFO', source: 'cert-manager', message: 'SSL 인증서 갱신 완료: *.company.com (유효기간 90일)', timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
    ];
    setLogs(mockLogs);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        const newLog: SystemLog = {
          id: Date.now().toString(),
          level: ['INFO', 'WARN', 'DEBUG'][Math.floor(Math.random() * 3)] as SystemLog['level'],
          source: ['auth-service', 'ssh-gateway', 'session-manager'][Math.floor(Math.random() * 3)],
          message: '자동 갱신된 로그 메시지',
          timestamp: new Date().toISOString()
        };
        setLogs(prev => [newLog, ...prev.slice(0, 49)]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'INFO': return { color: '#3b82f6', bg: '#3b82f620', icon: 'ℹ️' };
      case 'WARN': return { color: '#f59e0b', bg: '#f59e0b20', icon: '⚠️' };
      case 'ERROR': return { color: '#ef4444', bg: '#ef444420', icon: '❌' };
      case 'DEBUG': return { color: '#6b7280', bg: '#6b728020', icon: '🔧' };
      case 'CRITICAL': return { color: '#dc2626', bg: '#dc262620', icon: '🚨' };
      default: return { color: '#6b7280', bg: '#6b728020', icon: '📋' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const uniqueSources = [...new Set(logs.map(l => l.source))];
  const filteredLogs = logs.filter(l => {
    if (searchQuery && !l.message.toLowerCase().includes(searchQuery.toLowerCase()) && !l.source.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterLevel !== 'all' && l.level !== filterLevel) return false;
    if (filterSource !== 'all' && l.source !== filterSource) return false;
    return true;
  });

  const levelCounts = {
    INFO: logs.filter(l => l.level === 'INFO').length,
    WARN: logs.filter(l => l.level === 'WARN').length,
    ERROR: logs.filter(l => l.level === 'ERROR').length,
    CRITICAL: logs.filter(l => l.level === 'CRITICAL').length
  };

  return (
    <AdminLayout 
      title="시스템 로그" 
      description="시스템 이벤트 및 오류 모니터링"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 로그</div>
          <div className="stat-value">{logs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ℹ️ INFO</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{levelCounts.INFO}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ WARN</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{levelCounts.WARN}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">❌ ERROR</div>
          <div className="stat-value" style={{ color: levelCounts.ERROR > 0 ? '#ef4444' : 'inherit' }}>{levelCounts.ERROR}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🚨 CRITICAL</div>
          <div className="stat-value" style={{ color: levelCounts.CRITICAL > 0 ? '#dc2626' : 'inherit' }}>{levelCounts.CRITICAL}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 로그 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} style={{ maxWidth: '160px' }}>
          <option value="all">모든 소스</option>
          {uniqueSources.map(source => <option key={source} value={source}>{source}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'INFO', 'WARN', 'ERROR', 'CRITICAL'].map(level => {
            const config = level !== 'all' ? getLevelConfig(level) : null;
            return (
              <button
                key={level}
                className={`btn btn-sm ${filterLevel === level ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterLevel(level)}
              >
                {level === 'all' ? '전체' : level}
              </button>
            );
          })}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          <span style={{ fontSize: '0.85rem' }}>🔄 자동 갱신</span>
        </label>
      </div>

      {/* Logs */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: '16px', background: '#0f172a', maxHeight: '500px', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            {filteredLogs.map(log => {
              const levelConfig = getLevelConfig(log.level);
              return (
                <div 
                  key={log.id} 
                  style={{ 
                    padding: '8px 12px', 
                    borderLeft: `3px solid ${levelConfig.color}`, 
                    marginBottom: '4px', 
                    background: log.level === 'CRITICAL' || log.level === 'ERROR' ? levelConfig.bg : 'transparent',
                    cursor: log.details ? 'pointer' : 'default',
                    borderRadius: '0 4px 4px 0'
                  }}
                  onClick={() => log.details && setSelectedLog(log)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#64748b', minWidth: '60px' }}>{getTimeAgo(log.timestamp)}</span>
                    <span style={{ padding: '1px 6px', background: levelConfig.bg, color: levelConfig.color, borderRadius: '3px', fontWeight: 600, fontSize: '0.7rem', minWidth: '60px', textAlign: 'center' }}>
                      {log.level}
                    </span>
                    <span style={{ color: '#8b5cf6', minWidth: '120px' }}>[{log.source}]</span>
                    <span style={{ color: '#e2e8f0', flex: 1 }}>{log.message}</span>
                    {log.count && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>×{log.count}</span>}
                    {log.details && <span style={{ color: '#64748b' }}>📋</span>}
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay active" onClick={() => setSelectedLog(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getLevelConfig(selectedLog.level).icon} 로그 상세</h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ padding: '2px 8px', background: getLevelConfig(selectedLog.level).bg, color: getLevelConfig(selectedLog.level).color, borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                    {selectedLog.level}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{selectedLog.source}</span>
                </div>
                <div style={{ fontWeight: 500-1 }}>{selectedLog.message}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {new Date(selectedLog.timestamp).toLocaleString('ko-KR')}
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>상세 정보</div>
                  <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {selectedLog.details}
                  </pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(selectedLog.message + '\n' + (selectedLog.details || ''))}>📋 복사</button>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

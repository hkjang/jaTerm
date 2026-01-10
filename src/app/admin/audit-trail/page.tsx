'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AuditEvent {
  id: string;
  timestamp: string;
  category: 'AUTH' | 'ACCESS' | 'CONFIG' | 'DATA' | 'SYSTEM' | 'SECURITY';
  action: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  actor: { id: string; name: string; type: 'USER' | 'SYSTEM' | 'API' };
  resource: { type: string; id: string; name: string };
  details: string;
  sourceIP: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata: Record<string, string>;
}

interface AuditSummary {
  totalEvents: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byResult: Record<string, number>;
  topActors: { name: string; count: number }[];
}

export default function AuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const mockEvents: AuditEvent[] = [
      { id: 'e1', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), category: 'AUTH', action: 'LOGIN', severity: 'INFO', actor: { id: 'u1', name: 'admin@jaterm.io', type: 'USER' }, resource: { type: 'Session', id: 's1', name: 'Web Console' }, details: '로그인 성공', sourceIP: '192.168.1.100', userAgent: 'Chrome/120.0', result: 'SUCCESS', metadata: { mfa: 'true', sessionDuration: '8h' } },
      { id: 'e2', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), category: 'ACCESS', action: 'SSH_CONNECT', severity: 'INFO', actor: { id: 'u2', name: 'dev-user', type: 'USER' }, resource: { type: 'Server', id: 'srv1', name: 'prod-web-01' }, details: 'SSH 연결 시작', sourceIP: '10.0.1.50', userAgent: 'jaTerm/1.0', result: 'SUCCESS', metadata: { port: '22', protocol: 'SSH' } },
      { id: 'e3', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), category: 'SECURITY', action: 'ACCESS_DENIED', severity: 'WARNING', actor: { id: 'u3', name: 'unknown@test.com', type: 'USER' }, resource: { type: 'Server', id: 'srv2', name: 'db-master' }, details: '권한 없음 - sudo 접근 차단', sourceIP: '10.0.2.100', userAgent: 'jaTerm/1.0', result: 'DENIED', metadata: { command: 'sudo rm -rf /', blocked: 'true' } },
      { id: 'e4', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), category: 'CONFIG', action: 'POLICY_UPDATE', severity: 'WARNING', actor: { id: 'u1', name: 'admin@jaterm.io', type: 'USER' }, resource: { type: 'Policy', id: 'p1', name: 'production-access' }, details: '접근 정책 변경', sourceIP: '192.168.1.100', userAgent: 'Chrome/120.0', result: 'SUCCESS', metadata: { changes: 'allowedUsers: +5, -2' } },
      { id: 'e5', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), category: 'AUTH', action: 'LOGIN_FAILED', severity: 'ERROR', actor: { id: 'u4', name: 'hacker@evil.com', type: 'USER' }, resource: { type: 'Session', id: 's2', name: 'Web Console' }, details: '잘못된 비밀번호 (5회 시도)', sourceIP: '203.0.113.50', userAgent: 'curl/7.68', result: 'FAILURE', metadata: { attempts: '5', locked: 'true' } },
      { id: 'e6', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), category: 'DATA', action: 'EXPORT', severity: 'INFO', actor: { id: 'u1', name: 'admin@jaterm.io', type: 'USER' }, resource: { type: 'Report', id: 'r1', name: 'session-logs-202401' }, details: '세션 로그 내보내기', sourceIP: '192.168.1.100', userAgent: 'Chrome/120.0', result: 'SUCCESS', metadata: { format: 'CSV', records: '15420' } },
      { id: 'e7', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), category: 'SYSTEM', action: 'BACKUP_COMPLETE', severity: 'INFO', actor: { id: 'sys', name: 'backup-service', type: 'SYSTEM' }, resource: { type: 'Backup', id: 'b1', name: 'daily-backup' }, details: '일일 백업 완료', sourceIP: '127.0.0.1', userAgent: 'BackupAgent/2.1', result: 'SUCCESS', metadata: { size: '12.5GB', duration: '25m' } },
      { id: 'e8', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), category: 'SECURITY', action: 'CERT_EXPIRING', severity: 'CRITICAL', actor: { id: 'sys', name: 'cert-monitor', type: 'SYSTEM' }, resource: { type: 'Certificate', id: 'c1', name: 'api.jaterm.io' }, details: 'SSL 인증서 7일 후 만료', sourceIP: '127.0.0.1', userAgent: 'CertMonitor/1.0', result: 'SUCCESS', metadata: { expiry: '2024-01-17', issuer: "Let's Encrypt" } },
      { id: 'e9', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), category: 'ACCESS', action: 'FILE_TRANSFER', severity: 'INFO', actor: { id: 'u2', name: 'dev-user', type: 'USER' }, resource: { type: 'File', id: 'f1', name: 'config.yaml' }, details: 'SFTP 업로드', sourceIP: '10.0.1.50', userAgent: 'jaTerm/1.0', result: 'SUCCESS', metadata: { size: '2.5KB', direction: 'upload' } },
      { id: 'e10', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), category: 'CONFIG', action: 'USER_CREATE', severity: 'INFO', actor: { id: 'u1', name: 'admin@jaterm.io', type: 'USER' }, resource: { type: 'User', id: 'u5', name: 'new-developer' }, details: '사용자 생성', sourceIP: '192.168.1.100', userAgent: 'Chrome/120.0', result: 'SUCCESS', metadata: { role: 'Developer', groups: 'dev-team' } },
    ];
    
    const mockSummary: AuditSummary = {
      totalEvents: 15420,
      byCategory: { AUTH: 4520, ACCESS: 5840, CONFIG: 1250, DATA: 890, SYSTEM: 1820, SECURITY: 1100 },
      bySeverity: { INFO: 12500, WARNING: 2120, ERROR: 580, CRITICAL: 220 },
      byResult: { SUCCESS: 14200, FAILURE: 850, DENIED: 370 },
      topActors: [{ name: 'admin@jaterm.io', count: 3250 }, { name: 'dev-user', count: 2840 }, { name: 'backup-service', count: 1820 }, { name: 'ops-team', count: 1520 }, { name: 'cert-monitor', count: 980 }],
    };
    setEvents(mockEvents);
    setSummary(mockSummary);
    setLoading(false);
  }, []);

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'AUTH': return { color: '#3b82f6', icon: '🔐', label: '인증' };
      case 'ACCESS': return { color: '#10b981', icon: '🚪', label: '접근' };
      case 'CONFIG': return { color: '#f59e0b', icon: '⚙️', label: '설정' };
      case 'DATA': return { color: '#8b5cf6', icon: '📊', label: '데이터' };
      case 'SYSTEM': return { color: '#6b7280', icon: '🖥️', label: '시스템' };
      case 'SECURITY': return { color: '#ef4444', icon: '🛡️', label: '보안' };
      default: return { color: '#6b7280', icon: '?', label: category };
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'INFO': return { color: '#3b82f6', icon: 'ℹ️' };
      case 'WARNING': return { color: '#f59e0b', icon: '⚠️' };
      case 'ERROR': return { color: '#ef4444', icon: '❌' };
      case 'CRITICAL': return { color: '#dc2626', icon: '🚨' };
      default: return { color: '#6b7280', icon: '?' };
    }
  };

  const getResultConfig = (result: string) => {
    switch (result) {
      case 'SUCCESS': return { color: '#10b981', icon: '✓' };
      case 'FAILURE': return { color: '#ef4444', icon: '✗' };
      case 'DENIED': return { color: '#f59e0b', icon: '⛔' };
      default: return { color: '#6b7280', icon: '?' };
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (searchQuery && !e.action.toLowerCase().includes(searchQuery.toLowerCase()) && !e.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) && !e.details.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout 
      title="감사 추적" 
      description="시스템 활동 및 보안 이벤트 로그"
    >
      {/* Summary Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 이벤트</div>
          <div className="stat-value">{summary?.totalEvents.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 성공</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{summary?.byResult.SUCCESS?.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ 경고</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{summary?.bySeverity.WARNING?.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⛔ 거부됨</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{summary?.byResult.DENIED?.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🚨 심각</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{summary?.bySeverity.CRITICAL?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="🔍 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '200px' }} />
        <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 카테고리</option>
          <option value="AUTH">인증</option>
          <option value="ACCESS">접근</option>
          <option value="CONFIG">설정</option>
          <option value="DATA">데이터</option>
          <option value="SYSTEM">시스템</option>
          <option value="SECURITY">보안</option>
        </select>
        <select className="form-input" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 심각도</option>
          <option value="INFO">정보</option>
          <option value="WARNING">경고</option>
          <option value="ERROR">오류</option>
          <option value="CRITICAL">심각</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary">📥 내보내기</button>
      </div>

      {/* Events List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th style={{ width: '150px' }}>시간</th><th>카테고리</th><th>액션</th><th>행위자</th><th>리소스</th><th>결과</th><th>심각도</th></tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => {
                  const categoryConfig = getCategoryConfig(event.category);
                  const severityConfig = getSeverityConfig(event.severity);
                  const resultConfig = getResultConfig(event.result);
                  return (
                    <tr key={event.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedEvent(event)}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(event.timestamp).toLocaleString('ko-KR')}</td>
                      <td><span style={{ padding: '3px 10px', background: `${categoryConfig.color}20`, color: categoryConfig.color, borderRadius: '6px', fontSize: '0.8rem' }}>{categoryConfig.icon} {categoryConfig.label}</span></td>
                      <td style={{ fontWeight: 500 }}>{event.action}</td>
                      <td><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{event.actor.type === 'SYSTEM' ? '🤖' : '👤'} {event.actor.name}</span></td>
                      <td style={{ fontSize: '0.85rem' }}><code>{event.resource.name}</code></td>
                      <td><span style={{ color: resultConfig.color }}>{resultConfig.icon} {event.result}</span></td>
                      <td><span style={{ color: severityConfig.color }}>{severityConfig.icon}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay active" onClick={() => setSelectedEvent(null)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getSeverityConfig(selectedEvent.severity).icon} {selectedEvent.action}</h3>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', background: `${getCategoryConfig(selectedEvent.category).color}20`, color: getCategoryConfig(selectedEvent.category).color, borderRadius: '6px' }}>{getCategoryConfig(selectedEvent.category).icon} {getCategoryConfig(selectedEvent.category).label}</span>
                <span style={{ padding: '4px 10px', background: `${getResultConfig(selectedEvent.result).color}20`, color: getResultConfig(selectedEvent.result).color, borderRadius: '6px' }}>{getResultConfig(selectedEvent.result).icon} {selectedEvent.result}</span>
                <span style={{ padding: '4px 10px', background: `${getSeverityConfig(selectedEvent.severity).color}20`, color: getSeverityConfig(selectedEvent.severity).color, borderRadius: '6px' }}>{selectedEvent.severity}</span>
              </div>
              
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem' }}>{selectedEvent.details}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>시간:</span><br />{new Date(selectedEvent.timestamp).toLocaleString('ko-KR')}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>행위자:</span><br />{selectedEvent.actor.name} ({selectedEvent.actor.type})</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>리소스:</span><br />{selectedEvent.resource.type}: {selectedEvent.resource.name}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>IP:</span><br /><code>{selectedEvent.sourceIP}</code></div>
              </div>
              
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>📋 메타데이터</div>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '6px' }}>
                {Object.entries(selectedEvent.metadata).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-muted)', minWidth: '100px' }}>{k}:</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedEvent(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

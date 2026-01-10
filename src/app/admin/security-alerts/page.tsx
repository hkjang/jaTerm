'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SecurityAlert {
  id: string;
  type: 'BLOCKED_COMMAND' | 'SUSPICIOUS_ACCESS' | 'FAILED_LOGIN' | 'POLICY_VIOLATION' | 'BRUTE_FORCE' | 'UNUSUAL_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';
  title: string;
  description: string;
  user?: { id: string; name: string; email: string };
  server?: { id: string; name: string; environment: string };
  metadata?: Record<string, string>;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: { name: string };
}

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('NEW');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      // Mock data
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'BLOCKED_COMMAND',
          severity: 'CRITICAL',
          status: 'NEW',
          title: '위험 명령어 차단',
          description: 'rm -rf / 명령어 실행 시도 차단됨',
          user: { id: 'u1', name: '김개발', email: 'dev@example.com' },
          server: { id: 's1', name: 'prod-web-01', environment: 'PROD' },
          metadata: { command: 'rm -rf /', ip: '192.168.1.100' },
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: '2',
          type: 'BRUTE_FORCE',
          severity: 'HIGH',
          status: 'NEW',
          title: '무차별 대입 공격 감지',
          description: '같은 IP에서 5회 이상 로그인 실패',
          metadata: { ip: '45.33.32.156', attempts: '8', country: 'CN' },
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: '3',
          type: 'SUSPICIOUS_ACCESS',
          severity: 'HIGH',
          status: 'INVESTIGATING',
          title: '비정상 접근 패턴',
          description: '업무 시간 외 PROD 서버 접근',
          user: { id: 'u2', name: '박운영', email: 'ops@example.com' },
          server: { id: 's2', name: 'prod-db-01', environment: 'PROD' },
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
        {
          id: '4',
          type: 'POLICY_VIOLATION',
          severity: 'MEDIUM',
          status: 'NEW',
          title: '정책 위반',
          description: 'MFA 없이 PROD 서버 접근 시도',
          user: { id: 'u3', name: '이뷰어', email: 'viewer@example.com' },
          server: { id: 's1', name: 'prod-web-01', environment: 'PROD' },
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
        {
          id: '5',
          type: 'UNUSUAL_ACTIVITY',
          severity: 'LOW',
          status: 'RESOLVED',
          title: '비정상 활동',
          description: '평소보다 많은 파일 다운로드',
          user: { id: 'u1', name: '김개발', email: 'dev@example.com' },
          server: { id: 's3', name: 'stage-web-01', environment: 'STAGE' },
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
          resolvedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
          resolvedBy: { name: '관리자' },
        },
      ];

      let filtered = mockAlerts;
      if (severityFilter !== 'ALL') filtered = filtered.filter(a => a.severity === severityFilter);
      if (statusFilter !== 'ALL') filtered = filtered.filter(a => a.status === statusFilter);

      setAlerts(filtered);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchAlerts, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAlerts]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleResolve = (alert: SecurityAlert, action: 'RESOLVED' | 'IGNORED') => {
    setAlerts(alerts.map(a => a.id === alert.id ? { ...a, status: action, resolvedAt: new Date().toISOString() } : a));
    setMessage({ type: 'success', text: action === 'RESOLVED' ? '알림이 해결됨으로 처리되었습니다.' : '알림이 무시됨으로 처리되었습니다.' });
    setSelectedAlert(null);
  };

  const handleInvestigate = (alert: SecurityAlert) => {
    setAlerts(alerts.map(a => a.id === alert.id ? { ...a, status: 'INVESTIGATING' } : a));
    setMessage({ type: 'success', text: '조사 중으로 상태가 변경되었습니다.' });
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return { color: '#dc2626', bg: '#dc262620', icon: '🚨', label: '심각' };
      case 'HIGH': return { color: '#ea580c', bg: '#ea580c20', icon: '⚠️', label: '높음' };
      case 'MEDIUM': return { color: '#d97706', bg: '#d9770620', icon: '⚡', label: '중간' };
      case 'LOW': return { color: '#65a30d', bg: '#65a30d20', icon: 'ℹ️', label: '낮음' };
      default: return { color: '#6b7280', bg: '#6b728020', icon: '•', label: severity };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'NEW': return { color: '#ef4444', label: '신규' };
      case 'INVESTIGATING': return { color: '#f59e0b', label: '조사중' };
      case 'RESOLVED': return { color: '#10b981', label: '해결됨' };
      case 'IGNORED': return { color: '#6b7280', label: '무시됨' };
      default: return { color: '#6b7280', label: status };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BLOCKED_COMMAND': return '🚫';
      case 'BRUTE_FORCE': return '🔓';
      case 'SUSPICIOUS_ACCESS': return '👁️';
      case 'FAILED_LOGIN': return '❌';
      case 'POLICY_VIOLATION': return '📋';
      case 'UNUSUAL_ACTIVITY': return '🔍';
      default: return '⚠️';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH' && a.status === 'NEW').length;
  const newCount = alerts.filter(a => a.status === 'NEW').length;

  return (
    <AdminLayout 
      title="보안 알림" 
      description="실시간 보안 이벤트 모니터링"
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            자동 새로고침
          </label>
          <button className="btn btn-ghost btn-sm" onClick={fetchAlerts}>🔄 새로고침</button>
        </div>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div style={{ 
          padding: '16px 20px', 
          background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
          borderRadius: '8px',
          marginBottom: '20px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'pulse 2s infinite',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>심각한 보안 이벤트 {criticalCount}건 발생</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>즉시 확인이 필요합니다</div>
          </div>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={() => setSeverityFilter('CRITICAL')}>
            바로 확인
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: statusFilter === 'NEW' ? '3px solid var(--color-danger)' : 'none' }} onClick={() => setStatusFilter('NEW')}>
          <div className="stat-label">신규 알림</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{newCount}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: severityFilter === 'CRITICAL' ? '3px solid #dc2626' : 'none' }} onClick={() => { setSeverityFilter('CRITICAL'); setStatusFilter('ALL'); }}>
          <div className="stat-label">심각</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{alerts.filter(a => a.severity === 'CRITICAL').length}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: severityFilter === 'HIGH' ? '3px solid #ea580c' : 'none' }} onClick={() => { setSeverityFilter('HIGH'); setStatusFilter('ALL'); }}>
          <div className="stat-label">높음</div>
          <div className="stat-value" style={{ color: '#ea580c' }}>{alerts.filter(a => a.severity === 'HIGH').length}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: statusFilter === 'ALL' ? '3px solid var(--color-primary)' : 'none' }} onClick={() => { setSeverityFilter('ALL'); setStatusFilter('ALL'); }}>
          <div className="stat-label">전체</div>
          <div className="stat-value">{alerts.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <select className="form-input form-select" style={{ width: '150px' }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="ALL">모든 심각도</option>
          <option value="CRITICAL">심각</option>
          <option value="HIGH">높음</option>
          <option value="MEDIUM">중간</option>
          <option value="LOW">낮음</option>
        </select>
        <select className="form-input form-select" style={{ width: '150px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">모든 상태</option>
          <option value="NEW">신규</option>
          <option value="INVESTIGATING">조사중</option>
          <option value="RESOLVED">해결됨</option>
          <option value="IGNORED">무시됨</option>
        </select>
      </div>

      {/* Alert List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          알림이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map(alert => {
            const severity = getSeverityConfig(alert.severity);
            const status = getStatusConfig(alert.status);
            return (
              <div 
                key={alert.id}
                className="card"
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer',
                  borderLeft: `4px solid ${severity.color}`,
                  opacity: alert.status === 'RESOLVED' || alert.status === 'IGNORED' ? 0.6 : 1,
                }}
                onClick={() => setSelectedAlert(alert)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(alert.type)}</span>
                      <span style={{ padding: '2px 8px', background: severity.bg, color: severity.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {severity.label}
                      </span>
                      <span style={{ fontWeight: 600 }}>{alert.title}</span>
                      <span style={{ padding: '2px 6px', background: status.color + '20', color: status.color, borderRadius: '4px', fontSize: '0.7rem' }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      {alert.description}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {alert.user && <span>👤 {alert.user.name}</span>}
                      {alert.server && <span>🖥️ {alert.server.name}</span>}
                      <span>⏰ {getTimeAgo(alert.createdAt)}</span>
                    </div>
                  </div>
                  {alert.status === 'NEW' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handleInvestigate(alert); }}>
                        🔍 조사
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleResolve(alert, 'RESOLVED'); }}>
                        ✅ 해결
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="modal-overlay active" onClick={() => setSelectedAlert(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeIcon(selectedAlert.type)} 알림 상세</h3>
              <button className="modal-close" onClick={() => setSelectedAlert(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ padding: '4px 10px', background: getSeverityConfig(selectedAlert.severity).bg, color: getSeverityConfig(selectedAlert.severity).color, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {getSeverityConfig(selectedAlert.severity).icon} {getSeverityConfig(selectedAlert.severity).label}
                  </span>
                  <span style={{ padding: '4px 10px', background: getStatusConfig(selectedAlert.status).color + '20', color: getStatusConfig(selectedAlert.status).color, borderRadius: '6px', fontSize: '0.8rem' }}>
                    {getStatusConfig(selectedAlert.status).label}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{selectedAlert.title}</h4>
                <p style={{ color: 'var(--color-text-secondary)' }}>{selectedAlert.description}</p>
              </div>

              {selectedAlert.user && (
                <div className="form-group">
                  <label className="form-label">관련 사용자</label>
                  <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 500 }}>{selectedAlert.user.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{selectedAlert.user.email}</div>
                  </div>
                </div>
              )}

              {selectedAlert.server && (
                <div className="form-group">
                  <label className="form-label">관련 서버</label>
                  <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                    {selectedAlert.server.name} ({selectedAlert.server.environment})
                  </div>
                </div>
              )}

              {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                <div className="form-group">
                  <label className="form-label">추가 정보</label>
                  <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {Object.entries(selectedAlert.metadata).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{key}:</span>
                        <span style={{ color: key === 'command' ? '#ef4444' : 'inherit' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                발생 시간: {new Date(selectedAlert.createdAt).toLocaleString('ko-KR')}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAlert(null)}>닫기</button>
              {selectedAlert.status === 'NEW' && (
                <>
                  <button className="btn btn-ghost" onClick={() => handleResolve(selectedAlert, 'IGNORED')}>무시</button>
                  <button className="btn btn-primary" onClick={() => handleResolve(selectedAlert, 'RESOLVED')}>✅ 해결</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </AdminLayout>
  );
}

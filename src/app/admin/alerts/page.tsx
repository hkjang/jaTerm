'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SecurityAlert {
  id: string;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  userId?: string;
  sessionId?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [resolvedFilter, setResolvedFilter] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const user = localStorage.getItem('user');
    if (!user) return {};
    try {
      const { id } = JSON.parse(user);
      return { 'Authorization': `Bearer ${id}` };
    } catch {
      return {};
    }
  };

  const fetchAlerts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (severityFilter) params.set('severity', severityFilter);
      if (resolvedFilter) params.set('resolved', resolvedFilter === 'resolved' ? 'true' : 'false');

      const response = await fetch(`/api/admin/alerts?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('알림을 불러오는데 실패했습니다.');
      console.error('Fetch alerts error:', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, resolvedFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'resolve' }),
      });

      if (!response.ok) throw new Error('Failed to resolve alert');

      setSuccess('알림이 해결 처리되었습니다.');
      setSelectedAlert(null);
      fetchAlerts();
    } catch (err) {
      setError('알림 처리에 실패했습니다.');
    }
  };

  const handleReopen = async (id: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reopen' }),
      });

      if (!response.ok) throw new Error('Failed to reopen alert');

      setSuccess('알림이 다시 열렸습니다.');
      setSelectedAlert(null);
      fetchAlerts();
    } catch (err) {
      setError('알림 처리에 실패했습니다.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'var(--color-danger)';
      case 'HIGH': return '#ff6b35';
      case 'MEDIUM': return 'var(--color-warning)';
      case 'LOW': return 'var(--color-info)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'DANGEROUS_COMMAND': return '위험 명령';
      case 'ANOMALY_DETECTED': return '이상 행위';
      case 'UNAUTHORIZED_ACCESS': return '무단 접근';
      case 'SESSION_VIOLATION': return '세션 위반';
      case 'POLICY_VIOLATION': return '정책 위반';
      default: return type;
    }
  };

  // Calculate stats from fetched data
  const unresolvedCount = alerts.filter(a => !a.isResolved).length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const mediumCount = alerts.filter(a => a.severity === 'MEDIUM').length;
  const resolvedCount = alerts.filter(a => a.isResolved).length;

  return (
    <AdminLayout
      title="보안 알림"
      description="AI 기반 보안 이벤트 및 위협 탐지"
      actions={
        <button className="btn btn-secondary" onClick={() => setShowSettingsModal(true)}>
          ⚙️ 알림 설정
        </button>
      }
    >
      {/* Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">미해결</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
            {unresolvedCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CRITICAL</div>
          <div className="stat-value">{criticalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">HIGH</div>
          <div className="stat-value">{highCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MEDIUM</div>
          <div className="stat-value">{mediumCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">해결됨</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <select
            className="form-input form-select"
            style={{ width: '150px' }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">모든 심각도</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            className="form-input form-select"
            style={{ width: '150px' }}
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
          >
            <option value="">모든 상태</option>
            <option value="unresolved">미해결</option>
            <option value="resolved">해결됨</option>
          </select>
          <button className="btn btn-ghost" onClick={() => fetchAlerts()}>
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          알림이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map(alert => (
            <div 
              key={alert.id}
              className="card"
              style={{ 
                padding: '16px',
                borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                cursor: 'pointer',
                opacity: alert.isResolved ? 0.7 : 1
              }}
              onClick={() => setSelectedAlert(alert)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {alert.severity === 'CRITICAL' ? '⛔' : alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟠' : '🟡'}
                    </span>
                    <span style={{ fontWeight: 600 }}>{alert.title}</span>
                    <span className={`badge badge-${
                      alert.severity === 'CRITICAL' ? 'danger' : 
                      alert.severity === 'HIGH' ? 'warning' : 'info'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="badge badge-info">{getAlertTypeLabel(alert.alertType)}</span>
                    {alert.isResolved && <span className="badge badge-success">해결됨</span>}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{alert.message}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>🕐 {new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!alert.isResolved && (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                    >
                      해결
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            disabled={pagination.page <= 1}
            onClick={() => fetchAlerts(pagination.page - 1)}
          >
            ← 이전
          </button>
          <span style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button 
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchAlerts(pagination.page + 1)}
          >
            다음 →
          </button>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="modal-overlay active" onClick={() => setSelectedAlert(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedAlert.title}</h3>
              <button className="modal-close" onClick={() => setSelectedAlert(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge badge-${
                    selectedAlert.severity === 'CRITICAL' ? 'danger' : 
                    selectedAlert.severity === 'HIGH' ? 'warning' : 'info'
                  }`}>
                    {selectedAlert.severity}
                  </span>
                  <span className="badge badge-info">{getAlertTypeLabel(selectedAlert.alertType)}</span>
                  {selectedAlert.isResolved && <span className="badge badge-success">해결됨</span>}
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>상세 메시지</div>
                  <div style={{ fontWeight: 500 }}>{selectedAlert.message}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>발생 시간</div>
                    <div style={{ fontWeight: 500 }}>{new Date(selectedAlert.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>알림 유형</div>
                    <div style={{ fontWeight: 500 }}>{selectedAlert.alertType}</div>
                  </div>
                </div>

                {selectedAlert.isResolved && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>해결 정보</div>
                    <div>해결 시간: {selectedAlert.resolvedAt ? new Date(selectedAlert.resolvedAt).toLocaleString() : '-'}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAlert(null)}>닫기</button>
              {selectedAlert.isResolved ? (
                <button className="btn btn-warning" onClick={() => handleReopen(selectedAlert.id)}>다시 열기</button>
              ) : (
                <button className="btn btn-success" onClick={() => handleResolve(selectedAlert.id)}>해결 처리</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay active" onClick={() => setShowSettingsModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">알림 설정</h3>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">위험도 임계치</label>
                <input type="range" min="0" max="100" defaultValue="70" style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>0%</span>
                  <span>70% (현재)</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">알림 채널</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    이메일 알림
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    Slack 알림
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    SMS 알림 (CRITICAL만)
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">자동 차단 규칙</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    CRITICAL 위험도 자동 세션 종료
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    위험 명령 실행 시 자동 알림
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>취소</button>
              <button className="btn btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

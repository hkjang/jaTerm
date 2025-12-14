'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SecurityAlert {
  id: string;
  type: 'DANGEROUS_COMMAND' | 'ANOMALY_DETECTED' | 'UNAUTHORIZED_ACCESS' | 'SESSION_VIOLATION' | 'POLICY_VIOLATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  sessionId?: string;
  serverName?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  aiExplanation?: string;
  riskScore: number;
}

const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'DANGEROUS_COMMAND',
    severity: 'CRITICAL',
    title: '위험 명령 차단',
    message: 'rm -rf / 명령이 차단되었습니다',
    userId: '2',
    userName: '김철수',
    sessionId: 'session-123',
    serverName: 'prod-web-01',
    isResolved: false,
    createdAt: new Date(Date.now() - 1800000),
    aiExplanation: '이 명령은 시스템의 모든 파일을 삭제할 수 있는 매우 위험한 명령입니다. 의도적인 악의적 행위 또는 실수일 수 있습니다.',
    riskScore: 0.95,
  },
  {
    id: '2',
    type: 'ANOMALY_DETECTED',
    severity: 'HIGH',
    title: '이상 행위 감지',
    message: '비정상적인 접속 시간 감지 (새벽 3시)',
    userId: '3',
    userName: '이영희',
    sessionId: 'session-456',
    serverName: 'prod-api-01',
    isResolved: false,
    createdAt: new Date(Date.now() - 3600000),
    aiExplanation: '해당 사용자의 평소 접속 패턴과 다른 시간대에 접속이 발생했습니다. 계정 도용 가능성이 있습니다.',
    riskScore: 0.78,
  },
  {
    id: '3',
    type: 'POLICY_VIOLATION',
    severity: 'MEDIUM',
    title: '정책 위반',
    message: '허용되지 않은 시간대 접근 시도',
    userId: '4',
    userName: '박민수',
    serverName: 'stage-web-01',
    isResolved: true,
    resolvedBy: '홍길동',
    resolvedAt: new Date(Date.now() - 1800000),
    createdAt: new Date(Date.now() - 7200000),
    riskScore: 0.45,
  },
  {
    id: '4',
    type: 'UNAUTHORIZED_ACCESS',
    severity: 'HIGH',
    title: '무단 접근 시도',
    message: '권한 없는 서버 접근 시도',
    userId: '5',
    userName: '정수진',
    serverName: 'prod-db-01',
    isResolved: true,
    resolvedBy: '홍길동',
    resolvedAt: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 86400000),
    riskScore: 0.82,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [resolvedFilter, setResolvedFilter] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = !severityFilter || alert.severity === severityFilter;
    const matchesResolved = resolvedFilter === '' || 
      (resolvedFilter === 'resolved' && alert.isResolved) ||
      (resolvedFilter === 'unresolved' && !alert.isResolved);
    return matchesSeverity && matchesResolved;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'var(--color-danger)';
      case 'HIGH': return '#ff6b35';
      case 'MEDIUM': return 'var(--color-warning)';
      case 'LOW': return 'var(--color-info)';
      default: return 'var(--color-text-muted)';
    }
  };

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id 
        ? { ...alert, isResolved: true, resolvedBy: '현재 관리자', resolvedAt: new Date() }
        : alert
    ));
    setSelectedAlert(null);
  };

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
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">미해결</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
            {alerts.filter(a => !a.isResolved).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CRITICAL</div>
          <div className="stat-value">{alerts.filter(a => a.severity === 'CRITICAL').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">HIGH</div>
          <div className="stat-value">{alerts.filter(a => a.severity === 'HIGH').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MEDIUM</div>
          <div className="stat-value">{alerts.filter(a => a.severity === 'MEDIUM').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">오늘 해결</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>
            {alerts.filter(a => a.isResolved).length}
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
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.map(alert => (
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
                  {alert.isResolved && <span className="badge badge-success">해결됨</span>}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{alert.message}</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {alert.userName && <span>👤 {alert.userName}</span>}
                  {alert.serverName && <span>🖥️ {alert.serverName}</span>}
                  <span>🕐 {alert.createdAt.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ 
                background: getSeverityColor(alert.severity) + '20',
                color: getSeverityColor(alert.severity),
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}>
                {Math.round(alert.riskScore * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>

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
                  <span className="badge badge-info">{selectedAlert.type}</span>
                  {selectedAlert.isResolved && <span className="badge badge-success">해결됨</span>}
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>상세 메시지</div>
                  <div style={{ fontWeight: 500 }}>{selectedAlert.message}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사용자</div>
                    <div style={{ fontWeight: 500 }}>{selectedAlert.userName || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>서버</div>
                    <div style={{ fontWeight: 500 }}>{selectedAlert.serverName || '-'}</div>
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ fontSize: '2rem' }}>🤖</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>AI 분석</div>
                    <div style={{ fontSize: '0.9rem' }}>{selectedAlert.aiExplanation || 'AI 분석 정보가 없습니다.'}</div>
                  </div>
                </div>

                <div style={{ 
                  background: `${getSeverityColor(selectedAlert.severity)}10`,
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 500 }}>위험도 점수</span>
                  <span style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700,
                    color: getSeverityColor(selectedAlert.severity)
                  }}>
                    {Math.round(selectedAlert.riskScore * 100)}%
                  </span>
                </div>

                {selectedAlert.isResolved && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>해결 정보</div>
                    <div>처리자: {selectedAlert.resolvedBy}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {selectedAlert.resolvedAt?.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAlert(null)}>닫기</button>
              {!selectedAlert.isResolved && (
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

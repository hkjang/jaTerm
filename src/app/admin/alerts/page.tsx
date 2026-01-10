'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Alert {
  id: string;
  type: 'SECURITY' | 'SYSTEM' | 'ACCESS' | 'POLICY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  source: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  assignee?: string;
}

const initialAlerts: Alert[] = [
  { id: '1', type: 'SECURITY', severity: 'CRITICAL', title: '다수 로그인 실패', description: 'admin 계정 로그인 10회 실패 - 192.168.1.50', source: 'Auth Service', status: 'NEW', createdAt: '2026-01-10 15:30' },
  { id: '2', type: 'ACCESS', severity: 'HIGH', title: '비정상 접근 패턴', description: 'prod-db-01 비업무 시간 접근 시도', source: 'Access Monitor', status: 'NEW', createdAt: '2026-01-10 03:15' },
  { id: '3', type: 'SYSTEM', severity: 'MEDIUM', title: '디스크 용량 경고', description: 'prod-web-01 디스크 사용률 85%', source: 'System Monitor', status: 'ACKNOWLEDGED', createdAt: '2026-01-10 10:00', assignee: '박운영' },
  { id: '4', type: 'POLICY', severity: 'HIGH', title: '위험 명령어 실행', description: 'rm -rf 실행 시도 (prod-api-01)', source: 'Command Filter', status: 'RESOLVED', createdAt: '2026-01-09 16:45', assignee: '김관리자' },
  { id: '5', type: 'SECURITY', severity: 'LOW', title: 'SSH 키 만료 예정', description: 'deploy-key-staging 7일 후 만료', source: 'Key Manager', status: 'NEW', createdAt: '2026-01-10 09:00' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleAcknowledge = (a: Alert) => {
    setAlerts(alerts.map(alert => alert.id === a.id ? { ...alert, status: 'ACKNOWLEDGED', assignee: '현재 사용자' } : alert));
    setSuccess('알림 확인됨');
    setSelectedAlert(null);
  };

  const handleResolve = (a: Alert) => {
    setAlerts(alerts.map(alert => alert.id === a.id ? { ...alert, status: 'RESOLVED' } : alert));
    setSuccess('해결됨');
    setSelectedAlert(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제?')) {
      setAlerts(alerts.filter(a => a.id !== id));
      setSuccess('삭제됨');
      setSelectedAlert(null);
    }
  };

  const handleBulkAcknowledge = () => {
    setAlerts(alerts.map(a => a.status === 'NEW' ? { ...a, status: 'ACKNOWLEDGED', assignee: '현재 사용자' } : a));
    setSuccess('모든 새 알림 확인됨');
  };

  const getSeverityColor = (s: string) => ({ CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#6b7280' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ SECURITY: '🛡️', SYSTEM: '💻', ACCESS: '🔐', POLICY: '📋' }[t] || '🔔');
  const getStatusColor = (s: string) => ({ NEW: '#ef4444', ACKNOWLEDGED: '#f59e0b', RESOLVED: '#10b981' }[s] || '#6b7280');

  const filtered = alerts.filter(a => 
    (filterStatus === '' || a.status === filterStatus) &&
    (filterSeverity === '' || a.severity === filterSeverity)
  );

  const newCount = alerts.filter(a => a.status === 'NEW').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;

  return (
    <AdminLayout title="알림 관리" description="시스템 및 보안 알림" actions={newCount > 0 && <button className="btn btn-secondary" onClick={handleBulkAcknowledge}>✓ 모두 확인</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">🔴 새 알림</div><div className="stat-value" style={{ color: '#ef4444' }}>{newCount}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 치명적</div><div className="stat-value" style={{ color: '#f59e0b' }}>{criticalCount}</div></div>
        <div className="stat-card"><div className="stat-label">👀 확인됨</div><div className="stat-value">{alerts.filter(a => a.status === 'ACKNOWLEDGED').length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 해결됨</div><div className="stat-value" style={{ color: '#10b981' }}>{alerts.filter(a => a.status === 'RESOLVED').length}</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}>
          <option value="">전체 상태</option><option value="NEW">새 알림</option><option value="ACKNOWLEDGED">확인됨</option><option value="RESOLVED">해결됨</option>
        </select>
        <select className="form-input" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ width: 130 }}>
          <option value="">전체 심각도</option><option value="CRITICAL">치명적</option><option value="HIGH">높음</option><option value="MEDIUM">중간</option><option value="LOW">낮음</option>
        </select>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(a => (
          <div key={a.id} className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${getSeverityColor(a.severity)}` }} onClick={() => setSelectedAlert(a)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ fontSize: '1.5rem' }}>{getTypeIcon(a.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{a.title}</span>
                  <span style={{ padding: '2px 6px', background: `${getSeverityColor(a.severity)}20`, color: getSeverityColor(a.severity), borderRadius: 4, fontSize: '0.7rem' }}>{a.severity}</span>
                  <span style={{ padding: '2px 6px', background: `${getStatusColor(a.status)}20`, color: getStatusColor(a.status), borderRadius: 4, fontSize: '0.7rem' }}>{a.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{a.description}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>{a.source}</span><span>{a.createdAt}</span>{a.assignee && <span>👤 {a.assignee}</span>}
                </div>
              </div>
              <div onClick={e => e.stopPropagation()}>
                {a.status === 'NEW' && <button className="btn btn-ghost btn-sm" onClick={() => handleAcknowledge(a)}>👀</button>}
                {a.status !== 'RESOLVED' && <button className="btn btn-ghost btn-sm" onClick={() => handleResolve(a)}>✅</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Detail Modal */}
      {selectedAlert && (
        <div className="modal-overlay active" onClick={() => setSelectedAlert(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedAlert.type)} {selectedAlert.title}</h3><button className="modal-close" onClick={() => setSelectedAlert(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getSeverityColor(selectedAlert.severity)}20`, color: getSeverityColor(selectedAlert.severity), borderRadius: 6 }}>{selectedAlert.severity}</span><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedAlert.status)}20`, color: getStatusColor(selectedAlert.status), borderRadius: 6 }}>{selectedAlert.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedAlert.type}</span></div>
            <div style={{ marginBottom: 16, lineHeight: 1.6 }}>{selectedAlert.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>소스:</b> {selectedAlert.source}</div><div><b>발생:</b> {selectedAlert.createdAt}</div>{selectedAlert.assignee && <div><b>담당:</b> {selectedAlert.assignee}</div>}</div>
          </div>
          <div className="modal-footer">{selectedAlert.status === 'NEW' && <button className="btn btn-secondary" onClick={() => handleAcknowledge(selectedAlert)}>👀 확인</button>}{selectedAlert.status !== 'RESOLVED' && <button className="btn btn-primary" onClick={() => handleResolve(selectedAlert)}>✅ 해결</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedAlert.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedAlert(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

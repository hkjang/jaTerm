'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Incident {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'OPEN' | 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  type: 'OUTAGE' | 'DEGRADATION' | 'SECURITY' | 'DATA_LOSS';
  affectedServices: string[];
  assignee: string;
  commander: string;
  startedAt: string;
  resolvedAt: string | null;
  duration: string;
  rootCause: string;
  timeline: { time: string; action: string; by: string }[];
}

export default function IncidentManagementPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ title: '', severity: 'P2', type: 'OUTAGE', affectedServices: '', assignee: '', commander: '' });

  useEffect(() => {
    const mock: Incident[] = [
      { id: 'INC-001', title: 'API Gateway 장애', severity: 'P1', status: 'RESOLVED', type: 'OUTAGE', affectedServices: ['API Gateway', 'Web App', 'Mobile App'], assignee: '김철수', commander: '박팀장', startedAt: '2026-01-10 09:15', resolvedAt: '2026-01-10 10:45', duration: '1h 30m', rootCause: 'Database connection pool exhaustion', timeline: [{ time: '09:15', action: '장애 감지', by: 'Monitoring' }, { time: '09:20', action: 'P1 선언', by: '박팀장' }, { time: '10:45', action: '복구 완료', by: '김철수' }] },
      { id: 'INC-002', title: 'Payment 서비스 지연', severity: 'P2', status: 'MONITORING', type: 'DEGRADATION', affectedServices: ['Payment', 'Checkout'], assignee: '이영희', commander: '김부장', startedAt: '2026-01-10 11:30', resolvedAt: null, duration: '2h+', rootCause: 'External payment provider latency', timeline: [{ time: '11:30', action: '지연 감지', by: 'Alert' }, { time: '11:35', action: '조사 시작', by: '이영희' }] },
      { id: 'INC-003', title: 'CDN 캐시 무효화 실패', severity: 'P3', status: 'INVESTIGATING', type: 'DEGRADATION', affectedServices: ['CDN', 'Static Assets'], assignee: '박민수', commander: '최과장', startedAt: '2026-01-10 12:00', resolvedAt: null, duration: '1h 30m+', rootCause: '', timeline: [] },
      { id: 'INC-004', title: '보안 스캔 이상 탐지', severity: 'P2', status: 'OPEN', type: 'SECURITY', affectedServices: ['Auth Service'], assignee: '', commander: '', startedAt: '2026-01-10 13:00', resolvedAt: null, duration: '30m+', rootCause: '', timeline: [] },
    ];
    setIncidents(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: Incident = {
      id: `INC-${String(incidents.length + 1).padStart(3, '0')}`, title: formData.title, severity: formData.severity as Incident['severity'], status: 'OPEN', type: formData.type as Incident['type'],
      affectedServices: formData.affectedServices.split(',').map(s => s.trim()).filter(Boolean), assignee: formData.assignee, commander: formData.commander, startedAt: new Date().toLocaleString('ko-KR'), resolvedAt: null, duration: '0m', rootCause: '', timeline: [{ time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), action: '인시던트 생성', by: '시스템' }],
    };
    setIncidents([newInc, ...incidents]);
    setSuccess('인시던트가 생성되었습니다.');
    setShowCreateModal(false);
    setFormData({ title: '', severity: 'P2', type: 'OUTAGE', affectedServices: '', assignee: '', commander: '' });
  };

  const handleStatusChange = (inc: Incident, newStatus: Incident['status']) => {
    setIncidents(incidents.map(i => i.id === inc.id ? { ...i, status: newStatus, resolvedAt: newStatus === 'RESOLVED' ? new Date().toLocaleString('ko-KR') : i.resolvedAt, timeline: [...i.timeline, { time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), action: `상태 변경: ${newStatus}`, by: '관리자' }] } : i));
    setSuccess(`상태가 ${newStatus}로 변경되었습니다.`);
  };

  const handleAssign = (inc: Incident, assignee: string) => {
    setIncidents(incidents.map(i => i.id === inc.id ? { ...i, assignee, timeline: [...i.timeline, { time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), action: `담당자 배정: ${assignee}`, by: '관리자' }] } : i));
    setSuccess('담당자가 배정되었습니다.');
  };

  const getSeverityStyle = (s: string) => ({ P1: '#ef4444', P2: '#f97316', P3: '#f59e0b', P4: '#10b981' }[s] || '#6b7280');
  const getStatusStyle = (s: string) => ({ OPEN: '#ef4444', INVESTIGATING: '#f59e0b', IDENTIFIED: '#3b82f6', MONITORING: '#8b5cf6', RESOLVED: '#10b981' }[s] || '#6b7280');
  const getStatusLabel = (s: string) => ({ OPEN: '🔴 열림', INVESTIGATING: '🔍 조사중', IDENTIFIED: '🎯 확인됨', MONITORING: '👁️ 모니터링', RESOLVED: '✅ 해결됨' }[s] || s);

  const filtered = incidents.filter(i => (filterSeverity === 'all' || i.severity === filterSeverity) && (filterStatus === 'all' || i.status === filterStatus));
  const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <AdminLayout title="인시던트 관리" description="장애 및 보안 인시던트 대응 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>🚨 인시던트 선언</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}><div className="stat-label">🔴 활성 인시던트</div><div className="stat-value" style={{ color: activeCount > 0 ? '#ef4444' : '#10b981' }}>{activeCount}</div></div>
        <div className="stat-card"><div className="stat-label">🔥 P1</div><div className="stat-value" style={{ color: '#ef4444' }}>{incidents.filter(i => i.severity === 'P1' && i.status !== 'RESOLVED').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ P2</div><div className="stat-value" style={{ color: '#f97316' }}>{incidents.filter(i => i.severity === 'P2' && i.status !== 'RESOLVED').length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 해결됨</div><div className="stat-value" style={{ color: '#10b981' }}>{incidents.filter(i => i.status === 'RESOLVED').length}</div></div>
        <div className="stat-card"><div className="stat-label">📊 총 인시던트</div><div className="stat-value">{incidents.length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ maxWidth: 100 }}><option value="all">전체</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option><option value="P4">P4</option></select>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 130 }}><option value="all">전체 상태</option><option value="OPEN">열림</option><option value="INVESTIGATING">조사중</option><option value="MONITORING">모니터링</option><option value="RESOLVED">해결됨</option></select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(inc => (
            <div key={inc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', borderLeft: `4px solid ${getSeverityStyle(inc.severity)}` }} onClick={() => setSelectedIncident(inc)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 80 }}><span style={{ fontWeight: 700, color: getSeverityStyle(inc.severity) }}>{inc.severity}</span><code style={{ fontSize: '0.75rem' }}>{inc.id}</code></div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>{inc.title}</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{inc.affectedServices.slice(0, 3).map((s, i) => <span key={i} style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.75rem' }}>{s}</span>)}</div></div>
              <div style={{ textAlign: 'center' }}><span style={{ padding: '4px 10px', background: `${getStatusStyle(inc.status)}20`, color: getStatusStyle(inc.status), borderRadius: 6, fontSize: '0.8rem' }}>{getStatusLabel(inc.status)}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.85rem', color: 'var(--color-text-muted)', minWidth: 100 }}><div>⏱️ {inc.duration}</div><div>👤 {inc.assignee || '미배정'}</div></div>
            </div>
          ))}
        </div>
      )}

      {selectedIncident && (
        <div className="modal-overlay active" onClick={() => setSelectedIncident(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">🚨 {selectedIncident.id}: {selectedIncident.title}</h3><button className="modal-close" onClick={() => setSelectedIncident(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', background: `${getSeverityStyle(selectedIncident.severity)}20`, color: getSeverityStyle(selectedIncident.severity), borderRadius: 6, fontWeight: 700 }}>{selectedIncident.severity}</span>
                <span style={{ padding: '4px 12px', background: `${getStatusStyle(selectedIncident.status)}20`, color: getStatusStyle(selectedIncident.status), borderRadius: 6 }}>{getStatusLabel(selectedIncident.status)}</span>
                <span style={{ padding: '4px 12px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedIncident.type}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>시작: <b>{selectedIncident.startedAt}</b></div><div>지속: <b>{selectedIncident.duration}</b></div>
                <div>담당자: <b>{selectedIncident.assignee || '미배정'}</b></div><div>Commander: <b>{selectedIncident.commander || '-'}</b></div>
              </div>
              <div style={{ marginBottom: 16 }}><b>영향 서비스:</b> {selectedIncident.affectedServices.join(', ')}</div>
              {selectedIncident.rootCause && <div style={{ padding: 12, background: '#f59e0b20', borderRadius: 8, marginBottom: 16 }}>🔍 Root Cause: <b>{selectedIncident.rootCause}</b></div>}
              {selectedIncident.timeline.length > 0 && (
                <div><b>타임라인</b><div style={{ marginTop: 8, borderLeft: '2px solid var(--color-border)', paddingLeft: 12 }}>{selectedIncident.timeline.map((t, i) => <div key={i} style={{ marginBottom: 8, fontSize: '0.85rem' }}><span style={{ color: 'var(--color-text-muted)' }}>{t.time}</span> - {t.action} <span style={{ color: 'var(--color-text-muted)' }}>by {t.by}</span></div>)}</div></div>
              )}
            </div>
            <div className="modal-footer">
              {selectedIncident.status !== 'RESOLVED' && <><select className="form-input" style={{ maxWidth: 140 }} onChange={e => { if (e.target.value) handleStatusChange(selectedIncident, e.target.value as Incident['status']); }} defaultValue=""><option value="">상태 변경</option><option value="INVESTIGATING">조사중</option><option value="IDENTIFIED">확인됨</option><option value="MONITORING">모니터링</option><option value="RESOLVED">해결됨</option></select>
              {!selectedIncident.assignee && <button className="btn btn-secondary" onClick={() => handleAssign(selectedIncident, '현재 사용자')}>🙋 담당 배정</button>}</>}
              <button className="btn btn-ghost" onClick={() => setSelectedIncident(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">🚨 인시던트 선언</h3><button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">제목</label><input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="장애 또는 이슈 제목" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">심각도</label><select className="form-input" value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}><option value="P1">🔴 P1 - Critical</option><option value="P2">🟠 P2 - High</option><option value="P3">🟡 P3 - Medium</option><option value="P4">🟢 P4 - Low</option></select></div>
                  <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="OUTAGE">Outage</option><option value="DEGRADATION">Degradation</option><option value="SECURITY">Security</option><option value="DATA_LOSS">Data Loss</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">영향 서비스 (쉼표 구분)</label><input className="form-input" value={formData.affectedServices} onChange={e => setFormData({...formData, affectedServices: e.target.value})} placeholder="API, Database, Web" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">담당자</label><input className="form-input" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} placeholder="이름" /></div>
                  <div className="form-group"><label className="form-label">Incident Commander</label><input className="form-input" value={formData.commander} onChange={e => setFormData({...formData, commander: e.target.value})} placeholder="이름" /></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button><button type="submit" className="btn btn-primary" style={{ background: '#ef4444' }}>🚨 선언</button></div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

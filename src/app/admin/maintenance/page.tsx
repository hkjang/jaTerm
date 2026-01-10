'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  type: 'SCHEDULED' | 'EMERGENCY' | 'RECURRING';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  affectedServices: string[];
  scheduledStart: string;
  scheduledEnd: string;
  createdBy: string;
  notificationsSent: boolean;
  createdAt: string;
}

export default function MaintenancePage() {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWindow, setSelectedWindow] = useState<MaintenanceWindow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'SCHEDULED', services: 'API Server', scheduledStart: '', scheduledEnd: '' });

  useEffect(() => {
    setWindows([
      { id: '1', title: 'DB 마이그레이션', description: 'PostgreSQL 15로 업그레이드', type: 'SCHEDULED', status: 'SCHEDULED', affectedServices: ['Database', 'API Server'], scheduledStart: '2026-01-15 02:00', scheduledEnd: '2026-01-15 06:00', createdBy: 'admin', notificationsSent: true, createdAt: '2026-01-08' },
      { id: '2', title: '보안 패치 적용', description: '긴급 보안 패치', type: 'EMERGENCY', status: 'IN_PROGRESS', affectedServices: ['All Services'], scheduledStart: '2026-01-10 18:00', scheduledEnd: '2026-01-10 20:00', createdBy: 'security', notificationsSent: true, createdAt: '2026-01-10' },
      { id: '3', title: '주간 백업 검증', description: '백업 무결성 검증', type: 'RECURRING', status: 'SCHEDULED', affectedServices: ['Backup Service'], scheduledStart: '2026-01-12 03:00', scheduledEnd: '2026-01-12 04:00', createdBy: 'ops', notificationsSent: false, createdAt: '2025-12-01' },
      { id: '4', title: 'CDN 설정 변경', description: '캐시 정책 최적화', type: 'SCHEDULED', status: 'COMPLETED', affectedServices: ['CDN'], scheduledStart: '2026-01-05 04:00', scheduledEnd: '2026-01-05 05:00', createdBy: 'infra', notificationsSent: true, createdAt: '2026-01-03' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setWindows([{ id: String(Date.now()), title: form.title, description: form.description, type: form.type as MaintenanceWindow['type'], status: 'SCHEDULED', affectedServices: form.services.split(',').map(s => s.trim()), scheduledStart: form.scheduledStart, scheduledEnd: form.scheduledEnd, createdBy: 'admin', notificationsSent: false, createdAt: new Date().toISOString().slice(0, 10) }, ...windows]); setSuccess('생성됨'); setShowCreate(false); };
  const handleStart = (w: MaintenanceWindow) => { setWindows(windows.map(win => win.id === w.id ? { ...win, status: 'IN_PROGRESS' } : win)); setSuccess('시작됨'); setSelectedWindow(null); };
  const handleComplete = (w: MaintenanceWindow) => { setWindows(windows.map(win => win.id === w.id ? { ...win, status: 'COMPLETED' } : win)); setSuccess('완료됨'); setSelectedWindow(null); };
  const handleCancel = (w: MaintenanceWindow) => { setWindows(windows.map(win => win.id === w.id ? { ...win, status: 'CANCELLED' } : win)); setSuccess('취소됨'); setSelectedWindow(null); };
  const handleNotify = (w: MaintenanceWindow) => { setWindows(windows.map(win => win.id === w.id ? { ...win, notificationsSent: true } : win)); setSuccess('알림 발송됨'); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setWindows(windows.filter(w => w.id !== id)); setSuccess('삭제됨'); setSelectedWindow(null); } };

  const getStatusColor = (s: string) => ({ SCHEDULED: '#3b82f6', IN_PROGRESS: '#f59e0b', COMPLETED: '#10b981', CANCELLED: '#6b7280' }[s] || '#6b7280');
  const getTypeColor = (t: string) => ({ SCHEDULED: '#6366f1', EMERGENCY: '#ef4444', RECURRING: '#10b981' }[t] || '#6b7280');

  const filtered = windows.filter(w => filter === '' || w.status === filter);

  return (
    <AdminLayout title="유지보수" description="시스템 유지보수 일정 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 일정</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 일정</div><div className="stat-value">{windows.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟡 진행중</div><div className="stat-value" style={{ color: '#f59e0b' }}>{windows.filter(w => w.status === 'IN_PROGRESS').length}</div></div>
        <div className="stat-card"><div className="stat-label">📅 예정</div><div className="stat-value" style={{ color: '#3b82f6' }}>{windows.filter(w => w.status === 'SCHEDULED').length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 완료</div><div className="stat-value" style={{ color: '#10b981' }}>{windows.filter(w => w.status === 'COMPLETED').length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><button className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('')}>전체</button><button className={`btn ${filter === 'IN_PROGRESS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('IN_PROGRESS')}>진행중</button><button className={`btn ${filter === 'SCHEDULED' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('SCHEDULED')}>예정</button></div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gap: 12 }}>{filtered.map(w => (
          <div key={w.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(w.status)}`, cursor: 'pointer' }} onClick={() => setSelectedWindow(w)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><div style={{ display: 'flex', gap: 8, marginBottom: 4 }}><span style={{ fontWeight: 700 }}>{w.title}</span><span style={{ padding: '2px 6px', background: `${getTypeColor(w.type)}20`, color: getTypeColor(w.type), borderRadius: 4, fontSize: '0.7rem' }}>{w.type}</span><span style={{ padding: '2px 6px', background: `${getStatusColor(w.status)}20`, color: getStatusColor(w.status), borderRadius: 4, fontSize: '0.7rem' }}>{w.status}</span></div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{w.description}</div><div style={{ fontSize: '0.85rem', marginTop: 4 }}>📅 {w.scheduledStart} ~ {w.scheduledEnd.split(' ')[1]}</div></div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 150 }}>{w.affectedServices.map(s => <span key={s} style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.75rem' }}>{s}</span>)}</div>
            </div>
          </div>
        ))}</div>
      )}
      {selectedWindow && (
        <div className="modal-overlay active" onClick={() => setSelectedWindow(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔧 {selectedWindow.title}</h3><button className="modal-close" onClick={() => setSelectedWindow(null)}>×</button></div>
          <div className="modal-body"><div style={{ marginBottom: 12 }}>{selectedWindow.description}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>시작:</b> {selectedWindow.scheduledStart}</div><div><b>종료:</b> {selectedWindow.scheduledEnd}</div><div><b>생성자:</b> {selectedWindow.createdBy}</div><div><b>알림:</b> {selectedWindow.notificationsSent ? '✅' : '❌'}</div></div></div>
          <div className="modal-footer">{selectedWindow.status === 'SCHEDULED' && <><button className="btn btn-primary" onClick={() => handleStart(selectedWindow)}>▶️ 시작</button>{!selectedWindow.notificationsSent && <button className="btn btn-secondary" onClick={() => handleNotify(selectedWindow)}>📢</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleCancel(selectedWindow)}>❌</button></>}{selectedWindow.status === 'IN_PROGRESS' && <button className="btn btn-primary" onClick={() => handleComplete(selectedWindow)}>✅ 완료</button>}<button className="btn btn-ghost" onClick={() => handleDelete(selectedWindow.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedWindow(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔧 유지보수 일정</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">제목</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">설명</label><textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="SCHEDULED">예정</option><option value="EMERGENCY">긴급</option><option value="RECURRING">반복</option></select></div>
            <div className="form-group"><label className="form-label">서비스</label><input className="form-input" value={form.services} onChange={e => setForm({ ...form, services: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div className="form-group"><label className="form-label">시작</label><input type="datetime-local" className="form-input" value={form.scheduledStart} onChange={e => setForm({ ...form, scheduledStart: e.target.value })} required /></div><div className="form-group"><label className="form-label">종료</label><input type="datetime-local" className="form-input" value={form.scheduledEnd} onChange={e => setForm({ ...form, scheduledEnd: e.target.value })} required /></div></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface WorkspaceItem {
  id: string;
  name: string;
  type: 'PERSONAL' | 'TEAM' | 'PROJECT' | 'SHARED';
  owner: { name: string; email: string };
  members: number;
  storage: { used: number; limit: number };
  projects: number;
  lastActivity: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  createdAt: string;
}

export default function WorkspaceManagementPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWs, setSelectedWs] = useState<WorkspaceItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'TEAM', owner: '' });

  useEffect(() => {
    setWorkspaces([
      { id: '1', name: 'Platform Engineering', type: 'TEAM', owner: { name: '김팀장', email: 'lead@jaterm.io' }, members: 25, storage: { used: 45, limit: 100 }, projects: 12, lastActivity: '2026-01-10 14:50', status: 'ACTIVE', createdAt: '2024-06-01' },
      { id: '2', name: 'Backend Services', type: 'TEAM', owner: { name: '박개발', email: 'backend@jaterm.io' }, members: 18, storage: { used: 32, limit: 100 }, projects: 8, lastActivity: '2026-01-10 14:45', status: 'ACTIVE', createdAt: '2024-07-15' },
      { id: '3', name: 'Frontend Team', type: 'TEAM', owner: { name: '이프론트', email: 'frontend@jaterm.io' }, members: 12, storage: { used: 28, limit: 50 }, projects: 6, lastActivity: '2026-01-10 13:30', status: 'ACTIVE', createdAt: '2024-08-01' },
      { id: '4', name: 'Q4 Migration Project', type: 'PROJECT', owner: { name: '최PM', email: 'pm@jaterm.io' }, members: 35, storage: { used: 85, limit: 100 }, projects: 1, lastActivity: '2026-01-08 18:00', status: 'ARCHIVED', createdAt: '2025-10-01' },
      { id: '5', name: 'Demo Environment', type: 'SHARED', owner: { name: 'Admin', email: 'admin@jaterm.io' }, members: 150, storage: { used: 5, limit: 20 }, projects: 3, lastActivity: '2026-01-10 12:00', status: 'ACTIVE', createdAt: '2025-01-01' },
      { id: '6', name: '김민수 개인', type: 'PERSONAL', owner: { name: '김민수', email: 'minsu@jaterm.io' }, members: 1, storage: { used: 8, limit: 10 }, projects: 4, lastActivity: '2026-01-10 14:30', status: 'ACTIVE', createdAt: '2025-03-15' },
      { id: '7', name: 'Legacy System', type: 'PROJECT', owner: { name: '정운영', email: 'ops@jaterm.io' }, members: 8, storage: { used: 95, limit: 100 }, projects: 2, lastActivity: '2025-11-20', status: 'SUSPENDED', createdAt: '2023-01-01' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setWorkspaces([{ id: String(Date.now()), name: form.name, type: form.type as WorkspaceItem['type'], owner: { name: form.owner, email: `${form.owner}@jaterm.io` }, members: 1, storage: { used: 0, limit: 50 }, projects: 0, lastActivity: '-', status: 'ACTIVE', createdAt: new Date().toISOString().slice(0, 10) }, ...workspaces]); setSuccess('워크스페이스 생성됨'); setShowCreate(false); setForm({ name: '', type: 'TEAM', owner: '' }); };
  const handleArchive = (w: WorkspaceItem) => { if (confirm('보관?')) { setWorkspaces(workspaces.map(ws => ws.id === w.id ? { ...ws, status: 'ARCHIVED' } : ws)); setSuccess('보관됨'); setSelectedWs(null); } };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setWorkspaces(workspaces.filter(w => w.id !== id)); setSuccess('삭제됨'); setSelectedWs(null); } };

  const getTypeIcon = (t: string) => ({ PERSONAL: '👤', TEAM: '👥', PROJECT: '📁', SHARED: '🌐' }[t] || '📦');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', ARCHIVED: '#6b7280', SUSPENDED: '#ef4444' }[s] || '#6b7280');
  const getStoragePercent = (w: WorkspaceItem) => Math.round((w.storage.used / w.storage.limit) * 100);

  const filtered = workspaces.filter(w => (filterType === 'all' || w.type === filterType) && (search === '' || w.name.toLowerCase().includes(search.toLowerCase())));
  const totalMembers = workspaces.reduce((a, w) => a + w.members, 0);
  const totalStorage = workspaces.reduce((a, w) => a + w.storage.used, 0);

  return (
    <AdminLayout title="워크스페이스 관리" description="팀 및 프로젝트 워크스페이스 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 워크스페이스</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 워크스페이스</div><div className="stat-value">{workspaces.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{workspaces.filter(w => w.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">👥 총 멤버</div><div className="stat-value">{totalMembers}</div></div>
        <div className="stat-card"><div className="stat-label">💾 스토리지</div><div className="stat-value">{totalStorage} GB</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 유형</option><option value="PERSONAL">개인</option><option value="TEAM">팀</option><option value="PROJECT">프로젝트</option><option value="SHARED">공유</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(w => {
            const pct = getStoragePercent(w);
            return (
              <div key={w.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(w.status)}`, cursor: 'pointer', opacity: w.status !== 'ACTIVE' ? 0.7 : 1 }} onClick={() => setSelectedWs(w)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div><span style={{ fontSize: '1.3rem', marginRight: 8 }}>{getTypeIcon(w.type)}</span><span style={{ fontWeight: 700 }}>{w.name}</span></div>
                  <span style={{ padding: '2px 8px', background: `${getStatusColor(w.status)}20`, color: getStatusColor(w.status), borderRadius: 4, fontSize: '0.75rem' }}>{w.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{w.owner.name} · {w.members}명</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.85rem', marginBottom: 12 }}>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>프로젝트:</span> {w.projects}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>생성:</span> {w.createdAt}</div>
                </div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}><span>스토리지</span><span>{w.storage.used}/{w.storage.limit} GB</span></div><div style={{ background: 'var(--color-bg-secondary)', borderRadius: 4, height: 6 }}><div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#10b981', borderRadius: 4 }} /></div></div>
              </div>
            );
          })}
        </div>
      )}
      {selectedWs && (
        <div className="modal-overlay active" onClick={() => setSelectedWs(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedWs.type)} {selectedWs.name}</h3><button className="modal-close" onClick={() => setSelectedWs(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedWs.status)}20`, color: getStatusColor(selectedWs.status), borderRadius: 6 }}>{selectedWs.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedWs.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>소유자:</b> {selectedWs.owner.name}</div><div><b>멤버:</b> {selectedWs.members}명</div>
              <div><b>프로젝트:</b> {selectedWs.projects}</div><div><b>스토리지:</b> {selectedWs.storage.used}/{selectedWs.storage.limit} GB</div>
              <div><b>생성일:</b> {selectedWs.createdAt}</div><div><b>최근 활동:</b> {selectedWs.lastActivity}</div>
            </div>
          </div>
          <div className="modal-footer">{selectedWs.status === 'ACTIVE' && <button className="btn btn-secondary" onClick={() => handleArchive(selectedWs)}>📦 보관</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedWs.id)}>🗑️ 삭제</button><button className="btn btn-ghost" onClick={() => setSelectedWs(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📁 워크스페이스 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="PERSONAL">개인</option><option value="TEAM">팀</option><option value="PROJECT">프로젝트</option><option value="SHARED">공유</option></select></div>
            <div className="form-group"><label className="form-label">소유자</label><input className="form-input" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} required /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

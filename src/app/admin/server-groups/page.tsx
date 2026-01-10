'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ServerGroup {
  id: string;
  name: string;
  description: string;
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
  servers: string[];
  policies: string[];
  createdAt: string;
}

const initialGroups: ServerGroup[] = [
  { id: '1', name: 'Production DB', description: '운영 데이터베이스 서버', environment: 'PRODUCTION', servers: ['prod-db-01', 'prod-db-02', 'prod-db-03'], policies: ['업무시간 접근 제한', 'MFA 필수'], createdAt: '2025-01-15' },
  { id: '2', name: 'Production API', description: '운영 API 서버', environment: 'PRODUCTION', servers: ['prod-api-01', 'prod-api-02'], policies: ['업무시간 접근 제한'], createdAt: '2025-02-01' },
  { id: '3', name: 'Staging All', description: '스테이징 전체', environment: 'STAGING', servers: ['staging-api-01', 'staging-web-01', 'staging-db-01'], policies: [], createdAt: '2025-03-01' },
  { id: '4', name: 'Development', description: '개발 서버', environment: 'DEVELOPMENT', servers: ['dev-server-01', 'dev-server-02'], policies: [], createdAt: '2025-01-01' },
];

export default function ServerGroupsPage() {
  const [groups, setGroups] = useState<ServerGroup[]>(initialGroups);
  const [selectedGroup, setSelectedGroup] = useState<ServerGroup | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', description: '', environment: 'DEVELOPMENT', servers: '' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newGroup: ServerGroup = { id: String(Date.now()), ...form, environment: form.environment as ServerGroup['environment'], servers: form.servers.split(',').map(s => s.trim()).filter(Boolean), policies: [], createdAt: new Date().toISOString().slice(0, 10) };
    setGroups([newGroup, ...groups]);
    setSuccess('그룹 생성됨');
    setShowCreate(false);
    setForm({ name: '', description: '', environment: 'DEVELOPMENT', servers: '' });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setGroups(groups.map(g => g.id === selectedGroup.id ? { ...g, ...form, environment: form.environment as ServerGroup['environment'], servers: form.servers.split(',').map(s => s.trim()).filter(Boolean) } : g));
    setSuccess('수정됨');
    setShowEdit(false);
    setSelectedGroup(null);
  };

  const openEdit = (group: ServerGroup) => {
    setForm({ name: group.name, description: group.description, environment: group.environment, servers: group.servers.join(', ') });
    setSelectedGroup(group);
    setShowEdit(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제?')) {
      setGroups(groups.filter(g => g.id !== id));
      setSuccess('삭제됨');
      setSelectedGroup(null);
    }
  };

  const getEnvColor = (e: string) => ({ PRODUCTION: '#ef4444', STAGING: '#f59e0b', DEVELOPMENT: '#10b981' }[e] || '#6b7280');

  return (
    <AdminLayout title="서버 그룹" description="서버 그룹 구성 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 그룹</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {groups.map(g => (
          <div key={g.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedGroup(g)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>📦</span>
              <span style={{ fontWeight: 600, flex: 1 }}>{g.name}</span>
              <span style={{ padding: '2px 8px', background: `${getEnvColor(g.environment)}20`, color: getEnvColor(g.environment), borderRadius: 4, fontSize: '0.75rem' }}>{g.environment}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{g.description}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>🖥️ {g.servers.length}개 서버</span>
              <span>📋 {g.policies.length}개 정책</span>
            </div>
          </div>
        ))}
      </div>
      
      {selectedGroup && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedGroup(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📦 {selectedGroup.name}</h3><button className="modal-close" onClick={() => setSelectedGroup(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getEnvColor(selectedGroup.environment)}20`, color: getEnvColor(selectedGroup.environment), borderRadius: 6 }}>{selectedGroup.environment}</span></div>
            <div style={{ marginBottom: 16 }}>{selectedGroup.description}</div>
            <div style={{ marginBottom: 16 }}><b>서버 ({selectedGroup.servers.length}개):</b><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{selectedGroup.servers.map(s => <span key={s} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.85rem' }}>🖥️ {s}</span>)}</div></div>
            {selectedGroup.policies.length > 0 && <div><b>정책:</b><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{selectedGroup.policies.map(p => <span key={p} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.85rem' }}>📋 {p}</span>)}</div></div>}
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => openEdit(selectedGroup)}>✏️ 수정</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedGroup.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedGroup(null)}>닫기</button></div>
        </div></div>
      )}
      
      {(showCreate || showEdit) && (
        <div className="modal-overlay active" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedGroup(null); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{showEdit ? '✏️ 그룹 수정' : '📦 그룹 생성'}</h3><button className="modal-close" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedGroup(null); }}>×</button></div>
          <form onSubmit={showEdit ? handleEdit : handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">설명</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">환경</label><select className="form-input" value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}><option value="DEVELOPMENT">개발</option><option value="STAGING">스테이징</option><option value="PRODUCTION">운영</option></select></div>
            <div className="form-group"><label className="form-label">서버 (쉼표 구분)</label><input className="form-input" value={form.servers} onChange={e => setForm({ ...form, servers: e.target.value })} placeholder="prod-db-01, prod-db-02" /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedGroup(null); }}>취소</button><button type="submit" className="btn btn-primary">{showEdit ? '저장' : '생성'}</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

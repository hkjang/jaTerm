'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Runbook {
  id: string;
  name: string;
  category: 'INCIDENT' | 'MAINTENANCE' | 'DEPLOYMENT' | 'SECURITY' | 'RECOVERY';
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  lastUsed: string;
  usageCount: number;
  steps: number;
  avgDuration: string;
  owner: string;
  updatedAt: string;
}

export default function RunbookLibraryPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: 'INCIDENT', owner: '' });

  useEffect(() => {
    setRunbooks([
      { id: '1', name: 'Database Failover', category: 'RECOVERY', status: 'ACTIVE', lastUsed: '2026-01-08 15:30', usageCount: 12, steps: 8, avgDuration: '15분', owner: 'DBA Team', updatedAt: '2026-01-05' },
      { id: '2', name: '서버 패치 절차', category: 'MAINTENANCE', status: 'ACTIVE', lastUsed: '2026-01-10 02:00', usageCount: 45, steps: 12, avgDuration: '45분', owner: 'Ops Team', updatedAt: '2025-12-20' },
      { id: '3', name: 'Blue-Green 배포', category: 'DEPLOYMENT', status: 'ACTIVE', lastUsed: '2026-01-10 10:30', usageCount: 89, steps: 15, avgDuration: '30분', owner: 'DevOps', updatedAt: '2025-11-15' },
      { id: '4', name: '보안 인시던트 대응', category: 'SECURITY', status: 'ACTIVE', lastUsed: '2025-12-15 18:00', usageCount: 5, steps: 20, avgDuration: '60분', owner: 'Security Team', updatedAt: '2025-10-01' },
      { id: '5', name: 'P1 장애 대응', category: 'INCIDENT', status: 'ACTIVE', lastUsed: '2026-01-09 22:45', usageCount: 8, steps: 10, avgDuration: '25분', owner: 'SRE Team', updatedAt: '2025-12-01' },
      { id: '6', name: '캐시 일괄 삭제', category: 'MAINTENANCE', status: 'DRAFT', lastUsed: '-', usageCount: 0, steps: 5, avgDuration: '10분', owner: 'Platform Team', updatedAt: '2026-01-08' },
      { id: '7', name: '레거시 마이그레이션', category: 'DEPLOYMENT', status: 'DEPRECATED', lastUsed: '2025-06-15', usageCount: 3, steps: 25, avgDuration: '120분', owner: 'Migration Team', updatedAt: '2025-06-01' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setRunbooks([{ id: String(Date.now()), name: form.name, category: form.category as Runbook['category'], status: 'DRAFT', lastUsed: '-', usageCount: 0, steps: 0, avgDuration: '-', owner: form.owner, updatedAt: new Date().toISOString().slice(0, 10) }, ...runbooks]); setSuccess('런북 생성됨'); setShowCreate(false); setForm({ name: '', category: 'INCIDENT', owner: '' }); };
  const handleExecute = (r: Runbook) => { setRunbooks(runbooks.map(rb => rb.id === r.id ? { ...rb, lastUsed: new Date().toISOString().slice(0, 16).replace('T', ' '), usageCount: rb.usageCount + 1 } : rb)); setSuccess(`${r.name} 실행 시작됨`); setSelectedRunbook(null); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setRunbooks(runbooks.filter(r => r.id !== id)); setSuccess('삭제됨'); setSelectedRunbook(null); } };

  const getCategoryIcon = (c: string) => ({ INCIDENT: '🚨', MAINTENANCE: '🔧', DEPLOYMENT: '🚀', SECURITY: '🔐', RECOVERY: '♻️' }[c] || '📋');
  const getCategoryColor = (c: string) => ({ INCIDENT: '#ef4444', MAINTENANCE: '#f59e0b', DEPLOYMENT: '#3b82f6', SECURITY: '#8b5cf6', RECOVERY: '#10b981' }[c] || '#6b7280');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', DRAFT: '#f59e0b', DEPRECATED: '#6b7280' }[s] || '#6b7280');

  const filtered = runbooks.filter(r => (filterCategory === 'all' || r.category === filterCategory) && (search === '' || r.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <AdminLayout title="런북 라이브러리" description="운영 절차서 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 런북</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 런북</div><div className="stat-value">{runbooks.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{runbooks.filter(r => r.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">총 실행</div><div className="stat-value">{runbooks.reduce((a, r) => a + r.usageCount, 0)}</div></div>
        <div className="stat-card"><div className="stat-label">📝 초안</div><div className="stat-value" style={{ color: '#f59e0b' }}>{runbooks.filter(r => r.status === 'DRAFT').length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 런북 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 카테고리</option><option value="INCIDENT">인시던트</option><option value="MAINTENANCE">유지보수</option><option value="DEPLOYMENT">배포</option><option value="SECURITY">보안</option><option value="RECOVERY">복구</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: `4px solid ${getCategoryColor(r.category)}`, opacity: r.status === 'DEPRECATED' ? 0.6 : 1, cursor: 'pointer' }} onClick={() => setSelectedRunbook(r)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontSize: '1.3rem', marginRight: 8 }}>{getCategoryIcon(r.category)}</span><span style={{ fontWeight: 700 }}>{r.name}</span></div>
                <span style={{ padding: '2px 8px', background: `${getStatusColor(r.status)}20`, color: getStatusColor(r.status), borderRadius: 4, fontSize: '0.75rem' }}>{r.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.85rem', marginBottom: 8 }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>단계:</span> {r.steps}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>실행:</span> {r.usageCount}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>시간:</span> {r.avgDuration}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}><span>{r.owner}</span><span>최근: {r.lastUsed}</span></div>
            </div>
          ))}
        </div>
      )}
      {selectedRunbook && (
        <div className="modal-overlay active" onClick={() => setSelectedRunbook(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getCategoryIcon(selectedRunbook.category)} {selectedRunbook.name}</h3><button className="modal-close" onClick={() => setSelectedRunbook(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getCategoryColor(selectedRunbook.category)}20`, color: getCategoryColor(selectedRunbook.category), borderRadius: 6 }}>{selectedRunbook.category}</span><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedRunbook.status)}20`, color: getStatusColor(selectedRunbook.status), borderRadius: 6 }}>{selectedRunbook.status}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>단계 수:</b> {selectedRunbook.steps}</div><div><b>평균 시간:</b> {selectedRunbook.avgDuration}</div>
              <div><b>실행 횟수:</b> {selectedRunbook.usageCount}</div><div><b>마지막 실행:</b> {selectedRunbook.lastUsed}</div>
              <div><b>담당:</b> {selectedRunbook.owner}</div><div><b>수정일:</b> {selectedRunbook.updatedAt}</div>
            </div>
          </div>
          <div className="modal-footer">{selectedRunbook.status === 'ACTIVE' && <button className="btn btn-primary" onClick={() => handleExecute(selectedRunbook)}>▶️ 실행</button>}<button className="btn btn-secondary">✏️ 편집</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedRunbook.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedRunbook(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📋 런북 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">카테고리</label><select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="INCIDENT">인시던트</option><option value="MAINTENANCE">유지보수</option><option value="DEPLOYMENT">배포</option><option value="SECURITY">보안</option><option value="RECOVERY">복구</option></select></div>
            <div className="form-group"><label className="form-label">담당팀</label><input className="form-input" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} required /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

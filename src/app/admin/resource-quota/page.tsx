'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Quota {
  id: string;
  name: string;
  resource: 'CPU' | 'MEMORY' | 'STORAGE' | 'NETWORK' | 'INSTANCES';
  scope: 'USER' | 'GROUP' | 'PROJECT';
  scopeName: string;
  limit: number;
  used: number;
  unit: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export default function ResourceQuotaPage() {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [editQuota, setEditQuota] = useState<Quota | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [filterResource, setFilterResource] = useState('all');
  const [form, setForm] = useState({ name: '', resource: 'CPU', scope: 'USER', scopeName: '', limit: 0, unit: 'cores' });

  useEffect(() => {
    setQuotas([
      { id: '1', name: 'CPU Quota - Admin Team', resource: 'CPU', scope: 'GROUP', scopeName: 'admin-team', limit: 32, used: 24, unit: 'cores', status: 'WARNING' },
      { id: '2', name: 'Memory Quota - Admin Team', resource: 'MEMORY', scope: 'GROUP', scopeName: 'admin-team', limit: 128, used: 96, unit: 'GB', status: 'WARNING' },
      { id: '3', name: 'Storage Quota - Project A', resource: 'STORAGE', scope: 'PROJECT', scopeName: 'project-alpha', limit: 1000, used: 450, unit: 'GB', status: 'OK' },
      { id: '4', name: 'Instance Quota - Dev User', resource: 'INSTANCES', scope: 'USER', scopeName: 'dev@jaterm.io', limit: 10, used: 10, unit: '개', status: 'CRITICAL' },
      { id: '5', name: 'Network Quota - Project B', resource: 'NETWORK', scope: 'PROJECT', scopeName: 'project-beta', limit: 100, used: 35, unit: 'Mbps', status: 'OK' },
      { id: '6', name: 'CPU Quota - Dev Team', resource: 'CPU', scope: 'GROUP', scopeName: 'dev-team', limit: 64, used: 28, unit: 'cores', status: 'OK' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); const usage = Math.floor(form.limit * 0.3); setQuotas([{ id: String(Date.now()), name: form.name, resource: form.resource as Quota['resource'], scope: form.scope as Quota['scope'], scopeName: form.scopeName, limit: form.limit, used: usage, unit: form.unit, status: usage / form.limit < 0.7 ? 'OK' : usage / form.limit < 0.9 ? 'WARNING' : 'CRITICAL' }, ...quotas]); setSuccess('쿼터 생성됨'); setShowCreate(false); setForm({ name: '', resource: 'CPU', scope: 'USER', scopeName: '', limit: 0, unit: 'cores' }); };
  const handleUpdate = (q: Quota) => { const pct = q.used / q.limit; setQuotas(quotas.map(quota => quota.id === q.id ? { ...q, status: pct < 0.7 ? 'OK' : pct < 0.9 ? 'WARNING' : 'CRITICAL' } : quota)); setSuccess('수정됨'); setEditQuota(null); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setQuotas(quotas.filter(q => q.id !== id)); setSuccess('삭제됨'); } };

  const getResourceIcon = (r: string) => ({ CPU: '⚡', MEMORY: '🧠', STORAGE: '💾', NETWORK: '🌐', INSTANCES: '📦' }[r] || '📊');
  const getStatusColor = (s: string) => ({ OK: '#10b981', WARNING: '#f59e0b', CRITICAL: '#ef4444' }[s] || '#6b7280');
  const getUsagePercent = (q: Quota) => Math.round((q.used / q.limit) * 100);
  const filtered = quotas.filter(q => filterResource === 'all' || q.resource === filterResource);

  return (
    <AdminLayout title="리소스 쿼터" description="사용자/그룹/프로젝트별 리소스 제한" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 쿼터</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 쿼터</div><div className="stat-value">{quotas.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 정상</div><div className="stat-value" style={{ color: '#10b981' }}>{quotas.filter(q => q.status === 'OK').length}</div></div>
        <div className="stat-card"><div className="stat-label">🟡 경고</div><div className="stat-value" style={{ color: '#f59e0b' }}>{quotas.filter(q => q.status === 'WARNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 위험</div><div className="stat-value" style={{ color: '#ef4444' }}>{quotas.filter(q => q.status === 'CRITICAL').length}</div></div>
      </div>
      <div style={{ marginBottom: 16 }}><select className="form-input" value={filterResource} onChange={e => setFilterResource(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 리소스</option><option value="CPU">CPU</option><option value="MEMORY">Memory</option><option value="STORAGE">Storage</option><option value="NETWORK">Network</option><option value="INSTANCES">Instances</option></select></div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(q => (
            <div key={q.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(q.status)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div><div style={{ fontWeight: 700 }}>{getResourceIcon(q.resource)} {q.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{q.scope}: {q.scopeName}</div></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditQuota(q)}>✏️</button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}><span>{q.used} / {q.limit} {q.unit}</span><span style={{ color: getStatusColor(q.status) }}>{getUsagePercent(q)}%</span></div>
                <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 4, height: 8, overflow: 'hidden' }}><div style={{ width: `${Math.min(getUsagePercent(q), 100)}%`, height: '100%', background: getStatusColor(q.status), transition: 'width 0.3s' }} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ padding: '2px 8px', background: `${getStatusColor(q.status)}20`, color: getStatusColor(q.status), borderRadius: 4, fontSize: '0.75rem' }}>{q.status}</span>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(q.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📊 쿼터 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">리소스</label><select className="form-input" value={form.resource} onChange={e => { const units: Record<string, string> = { CPU: 'cores', MEMORY: 'GB', STORAGE: 'GB', NETWORK: 'Mbps', INSTANCES: '개' }; setForm({ ...form, resource: e.target.value, unit: units[e.target.value] || '' }); }}><option>CPU</option><option>MEMORY</option><option>STORAGE</option><option>NETWORK</option><option>INSTANCES</option></select></div>
              <div className="form-group"><label className="form-label">범위</label><select className="form-input" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}><option>USER</option><option>GROUP</option><option>PROJECT</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">대상</label><input className="form-input" value={form.scopeName} onChange={e => setForm({ ...form, scopeName: e.target.value })} placeholder="user@example.com 또는 그룹명" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">제한</label><input type="number" className="form-input" value={form.limit} onChange={e => setForm({ ...form, limit: parseInt(e.target.value) })} required /></div>
              <div className="form-group"><label className="form-label">단위</label><input className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
      {editQuota && (
        <div className="modal-overlay active" onClick={() => setEditQuota(null)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">✏️ 쿼터 수정</h3><button className="modal-close" onClick={() => setEditQuota(null)}>×</button></div>
          <form onSubmit={e => { e.preventDefault(); handleUpdate(editQuota); }}><div className="modal-body">
            <div style={{ marginBottom: 16 }}><b>{getResourceIcon(editQuota.resource)} {editQuota.name}</b><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{editQuota.scope}: {editQuota.scopeName}</div></div>
            <div className="form-group"><label className="form-label">제한 ({editQuota.unit})</label><input type="number" className="form-input" value={editQuota.limit} onChange={e => setEditQuota({ ...editQuota, limit: parseInt(e.target.value) })} /></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>현재 사용량: {editQuota.used} {editQuota.unit}</div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditQuota(null)}>취소</button><button type="submit" className="btn btn-primary">저장</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  users: number;
  maxUsers: number;
  storage: number;
  maxStorage: number;
  createdAt: string;
  lastActivity: string;
  domain: string;
}

export default function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', plan: 'STARTER', domain: '' });

  useEffect(() => {
    setTenants([
      { id: '1', name: 'Acme Corp', slug: 'acme', plan: 'ENTERPRISE', status: 'ACTIVE', users: 250, maxUsers: 500, storage: 450, maxStorage: 1000, createdAt: '2025-06-15', lastActivity: '2026-01-10 14:25', domain: 'acme.jaterm.io' },
      { id: '2', name: 'TechStart', slug: 'techstart', plan: 'BUSINESS', status: 'ACTIVE', users: 45, maxUsers: 100, storage: 120, maxStorage: 500, createdAt: '2025-09-20', lastActivity: '2026-01-10 14:20', domain: 'techstart.jaterm.io' },
      { id: '3', name: 'DevTeam Ltd', slug: 'devteam', plan: 'STARTER', status: 'TRIAL', users: 8, maxUsers: 10, storage: 15, maxStorage: 50, createdAt: '2026-01-01', lastActivity: '2026-01-10 13:00', domain: 'devteam.jaterm.io' },
      { id: '4', name: 'GlobalTech', slug: 'globaltech', plan: 'ENTERPRISE', status: 'ACTIVE', users: 520, maxUsers: 1000, storage: 800, maxStorage: 2000, createdAt: '2024-12-10', lastActivity: '2026-01-10 14:27', domain: 'globaltech.jaterm.io' },
      { id: '5', name: 'SmallBiz', slug: 'smallbiz', plan: 'FREE', status: 'SUSPENDED', users: 3, maxUsers: 5, storage: 4, maxStorage: 10, createdAt: '2025-11-05', lastActivity: '2025-12-20 10:00', domain: 'smallbiz.jaterm.io' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setTenants([{ id: String(Date.now()), name: form.name, slug: form.slug, plan: form.plan as Tenant['plan'], status: 'TRIAL', users: 1, maxUsers: form.plan === 'FREE' ? 5 : form.plan === 'STARTER' ? 10 : form.plan === 'BUSINESS' ? 100 : 1000, storage: 0, maxStorage: form.plan === 'FREE' ? 10 : form.plan === 'STARTER' ? 50 : form.plan === 'BUSINESS' ? 500 : 2000, createdAt: new Date().toISOString().slice(0, 10), lastActivity: '-', domain: form.domain || `${form.slug}.jaterm.io` }, ...tenants]); setSuccess('테넌트 생성됨'); setShowCreate(false); setForm({ name: '', slug: '', plan: 'STARTER', domain: '' }); };
  const handleSuspend = (t: Tenant) => { setTenants(tenants.map(tenant => tenant.id === t.id ? { ...tenant, status: 'SUSPENDED' } : tenant)); setSuccess(`${t.name} 정지됨`); setSelectedTenant(null); };
  const handleActivate = (t: Tenant) => { setTenants(tenants.map(tenant => tenant.id === t.id ? { ...tenant, status: 'ACTIVE' } : tenant)); setSuccess(`${t.name} 활성화됨`); setSelectedTenant(null); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setTenants(tenants.filter(t => t.id !== id)); setSuccess('삭제됨'); setSelectedTenant(null); } };

  const getPlanColor = (p: string) => ({ FREE: '#6b7280', STARTER: '#3b82f6', BUSINESS: '#8b5cf6', ENTERPRISE: '#f59e0b' }[p] || '#6b7280');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', SUSPENDED: '#ef4444', TRIAL: '#f59e0b' }[s] || '#6b7280');
  const formatStorage = (gb: number) => gb >= 1000 ? (gb / 1000).toFixed(1) + ' TB' : gb + ' GB';

  const totalUsers = tenants.reduce((a, t) => a + t.users, 0);
  const activeCount = tenants.filter(t => t.status === 'ACTIVE').length;

  return (
    <AdminLayout title="테넌트 관리" description="멀티테넌트 조직 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 테넌트</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 테넌트</div><div className="stat-value">{tenants.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{activeCount}</div></div>
        <div className="stat-card"><div className="stat-label">총 사용자</div><div className="stat-value">{totalUsers.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">Enterprise</div><div className="stat-value" style={{ color: '#f59e0b' }}>{tenants.filter(t => t.plan === 'ENTERPRISE').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {tenants.map(t => (
            <div key={t.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(t.status)}`, cursor: 'pointer' }} onClick={() => setSelectedTenant(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t.name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{t.domain}</div></div>
                <div style={{ display: 'flex', gap: 6 }}><span style={{ padding: '2px 8px', background: `${getPlanColor(t.plan)}20`, color: getPlanColor(t.plan), borderRadius: 4, fontSize: '0.75rem' }}>{t.plan}</span><span style={{ padding: '2px 8px', background: `${getStatusColor(t.status)}20`, color: getStatusColor(t.status), borderRadius: 4, fontSize: '0.75rem' }}>{t.status}</span></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사용자</div><div style={{ fontWeight: 600 }}>{t.users} / {t.maxUsers}</div><div style={{ background: 'var(--color-bg-secondary)', borderRadius: 3, height: 4, marginTop: 4, overflow: 'hidden' }}><div style={{ width: `${(t.users / t.maxUsers) * 100}%`, height: '100%', background: '#3b82f6' }} /></div></div>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>스토리지</div><div style={{ fontWeight: 600 }}>{formatStorage(t.storage)} / {formatStorage(t.maxStorage)}</div><div style={{ background: 'var(--color-bg-secondary)', borderRadius: 3, height: 4, marginTop: 4, overflow: 'hidden' }}><div style={{ width: `${(t.storage / t.maxStorage) * 100}%`, height: '100%', background: '#10b981' }} /></div></div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>마지막 활동: {t.lastActivity}</div>
            </div>
          ))}
        </div>
      )}
      {selectedTenant && (
        <div className="modal-overlay active" onClick={() => setSelectedTenant(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🏢 {selectedTenant.name}</h3><button className="modal-close" onClick={() => setSelectedTenant(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getPlanColor(selectedTenant.plan)}20`, color: getPlanColor(selectedTenant.plan), borderRadius: 6 }}>{selectedTenant.plan}</span><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedTenant.status)}20`, color: getStatusColor(selectedTenant.status), borderRadius: 6 }}>{selectedTenant.status}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>Slug:</b> {selectedTenant.slug}</div><div><b>도메인:</b> {selectedTenant.domain}</div>
              <div><b>사용자:</b> {selectedTenant.users} / {selectedTenant.maxUsers}</div><div><b>스토리지:</b> {formatStorage(selectedTenant.storage)} / {formatStorage(selectedTenant.maxStorage)}</div>
              <div><b>생성:</b> {selectedTenant.createdAt}</div><div><b>마지막 활동:</b> {selectedTenant.lastActivity}</div>
            </div>
          </div>
          <div className="modal-footer">{selectedTenant.status === 'ACTIVE' ? <button className="btn btn-secondary" onClick={() => handleSuspend(selectedTenant)}>⏸️ 정지</button> : <button className="btn btn-primary" onClick={() => handleActivate(selectedTenant)}>▶️ 활성화</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedTenant.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedTenant(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🏢 테넌트 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Slug</label><input className="form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="my-company" required /></div>
            <div className="form-group"><label className="form-label">플랜</label><select className="form-input" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}><option value="FREE">Free</option><option value="STARTER">Starter</option><option value="BUSINESS">Business</option><option value="ENTERPRISE">Enterprise</option></select></div>
            <div className="form-group"><label className="form-label">커스텀 도메인 (선택)</label><input className="form-input" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="company.jaterm.io" /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

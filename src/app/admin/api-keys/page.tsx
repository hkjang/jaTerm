'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  requestsToday: number;
  rateLimit: number;
}

const initialKeys: ApiKey[] = [
  { id: '1', name: 'Production App', prefix: 'jt_prod_', scopes: ['servers:read', 'sessions:read'], status: 'ACTIVE', createdAt: '2025-06-01', expiresAt: '2026-06-01', lastUsed: '2026-01-10 15:30', requestsToday: 1234, rateLimit: 10000 },
  { id: '2', name: 'Monitoring System', prefix: 'jt_mon_', scopes: ['metrics:read', 'alerts:read'], status: 'ACTIVE', createdAt: '2025-08-15', lastUsed: '2026-01-10 15:29', requestsToday: 5678, rateLimit: 50000 },
  { id: '3', name: 'CI/CD Pipeline', prefix: 'jt_ci_', scopes: ['servers:connect', 'commands:execute'], status: 'ACTIVE', createdAt: '2025-11-01', lastUsed: '2026-01-10 14:00', requestsToday: 89, rateLimit: 1000 },
  { id: '4', name: 'Legacy App', prefix: 'jt_old_', scopes: ['servers:read'], status: 'REVOKED', createdAt: '2024-01-01', requestsToday: 0, rateLimit: 1000 },
];

const allScopes = ['servers:read', 'servers:connect', 'sessions:read', 'sessions:manage', 'metrics:read', 'alerts:read', 'commands:execute', 'audit:read'];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', scopes: [] as string[], rateLimit: 1000, expiresAt: '' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const generateKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length: 32}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const fullKey = `jt_${generateKey()}`;
    const newKey: ApiKey = { id: String(Date.now()), name: form.name, prefix: `jt_${form.name.toLowerCase().replace(/\s/g, '_')}_`, scopes: form.scopes, status: 'ACTIVE', createdAt: new Date().toISOString().slice(0, 10), expiresAt: form.expiresAt || undefined, requestsToday: 0, rateLimit: form.rateLimit };
    setKeys([newKey, ...keys]);
    setShowNewKey(fullKey);
    setShowCreate(false);
    setForm({ name: '', scopes: [], rateLimit: 1000, expiresAt: '' });
  };

  const handleRevoke = (k: ApiKey) => {
    if (confirm(`${k.name} API 키를 폐기하시겠습니까?`)) {
      setKeys(keys.map(key => key.id === k.id ? { ...key, status: 'REVOKED' } : key));
      setSuccess('API 키 폐기됨');
      setSelectedKey(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제?')) {
      setKeys(keys.filter(k => k.id !== id));
      setSuccess('삭제됨');
      setSelectedKey(null);
    }
  };

  const toggleScope = (scope: string) => {
    setForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope) ? prev.scopes.filter(s => s !== scope) : [...prev.scopes, scope]
    }));
  };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', REVOKED: '#ef4444' }[s] || '#6b7280');

  return (
    <AdminLayout title="API 키 관리" description="API 접근 키 생성 및 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ API 키</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{keys.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{keys.filter(k => k.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">오늘 요청</div><div className="stat-value">{keys.reduce((sum, k) => sum + k.requestsToday, 0).toLocaleString()}</div></div>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>이름</th><th>접두사</th><th>스코프</th><th>요청/제한</th><th>마지막 사용</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>{keys.map(k => (
            <tr key={k.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedKey(k)}>
              <td style={{ fontWeight: 600 }}>{k.name}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{k.prefix}***</td>
              <td style={{ fontSize: '0.85rem' }}>{k.scopes.length}개</td>
              <td style={{ fontSize: '0.85rem' }}>{k.requestsToday.toLocaleString()} / {k.rateLimit.toLocaleString()}</td>
              <td style={{ fontSize: '0.85rem' }}>{k.lastUsed || '-'}</td>
              <td><span style={{ padding: '2px 8px', background: `${getStatusColor(k.status)}20`, color: getStatusColor(k.status), borderRadius: 4, fontSize: '0.75rem' }}>{k.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                {k.status === 'ACTIVE' && <button className="btn btn-ghost btn-sm" onClick={() => handleRevoke(k)}>🚫</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(k.id)}>🗑️</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {selectedKey && (
        <div className="modal-overlay active" onClick={() => setSelectedKey(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔑 {selectedKey.name}</h3><button className="modal-close" onClick={() => setSelectedKey(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedKey.status)}20`, color: getStatusColor(selectedKey.status), borderRadius: 6 }}>{selectedKey.status}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><div><b>접두사:</b> {selectedKey.prefix}***</div><div><b>생성:</b> {selectedKey.createdAt}</div>{selectedKey.expiresAt && <div><b>만료:</b> {selectedKey.expiresAt}</div>}<div><b>요청:</b> {selectedKey.requestsToday.toLocaleString()} / {selectedKey.rateLimit.toLocaleString()}</div>{selectedKey.lastUsed && <div><b>마지막:</b> {selectedKey.lastUsed}</div>}</div>
            <div style={{ marginBottom: 8 }}><b>스코프:</b></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{selectedKey.scopes.map(s => <span key={s} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{s}</span>)}</div>
          </div>
          <div className="modal-footer">{selectedKey.status === 'ACTIVE' && <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleRevoke(selectedKey)}>🚫 폐기</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedKey.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedKey(null)}>닫기</button></div>
        </div></div>
      )}
      
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔑 API 키 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="My Application" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">요청 제한 (일)</label><input type="number" className="form-input" value={form.rateLimit} onChange={e => setForm({ ...form, rateLimit: parseInt(e.target.value) })} /></div>
              <div className="form-group"><label className="form-label">만료일</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">스코프</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {allScopes.map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.scopes.includes(s)} onChange={() => toggleScope(s)} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
      
      {showNewKey && (
        <div className="modal-overlay active"><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔑 API 키 생성됨</h3></div>
          <div className="modal-body">
            <div style={{ background: '#fef3c7', padding: 12, borderRadius: 6, marginBottom: 16, color: '#92400e' }}>⚠️ 이 키는 다시 표시되지 않습니다. 안전하게 보관하세요.</div>
            <div style={{ fontFamily: 'monospace', padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.9rem', wordBreak: 'break-all' }}>{showNewKey}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(showNewKey); setSuccess('복사됨'); }}>📋 복사</button><button className="btn btn-primary" onClick={() => { setShowNewKey(null); setSuccess('API 키 생성됨'); }}>완료</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

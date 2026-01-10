'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SSHKey {
  id: string;
  name: string;
  type: 'ED25519' | 'RSA' | 'ECDSA';
  bits: number;
  fingerprint: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  owner: string;
  servers: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
}

const initialKeys: SSHKey[] = [
  { id: '1', name: 'deploy-key-prod', type: 'ED25519', bits: 256, fingerprint: 'SHA256:aB3cD4eF5gH6iJ7kL8mN9oP0', status: 'ACTIVE', owner: '배포시스템', servers: ['prod-*'], createdAt: '2025-06-01', lastUsed: '2026-01-10' },
  { id: '2', name: 'admin-key-kim', type: 'RSA', bits: 4096, fingerprint: 'SHA256:1A2b3C4d5E6f7G8h9I0j1K2', status: 'ACTIVE', owner: '김관리자', servers: ['*'], createdAt: '2025-03-15', expiresAt: '2026-03-15', lastUsed: '2026-01-10' },
  { id: '3', name: 'dev-key-lee', type: 'ED25519', bits: 256, fingerprint: 'SHA256:xY1zA2bC3dE4fG5hI6jK7lM', status: 'ACTIVE', owner: '이개발', servers: ['dev-*', 'staging-*'], createdAt: '2025-08-20', lastUsed: '2026-01-09' },
  { id: '4', name: 'ci-cd-runner', type: 'ECDSA', bits: 521, fingerprint: 'SHA256:mN4oP5qR6sT7uV8wX9yZ0aB', status: 'ACTIVE', owner: 'GitHub Actions', servers: ['build-*'], createdAt: '2025-11-01', lastUsed: '2026-01-10' },
  { id: '5', name: 'old-deploy-key', type: 'RSA', bits: 2048, fingerprint: 'SHA256:old123key456', status: 'REVOKED', owner: '이전 시스템', servers: [], createdAt: '2024-01-01' },
];

export default function SSHKeysPage() {
  const [keys, setKeys] = useState<SSHKey[]>(initialKeys);
  const [selectedKey, setSelectedKey] = useState<SSHKey | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', type: 'ED25519', owner: '', servers: '', expiresAt: '' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const bits = form.type === 'ED25519' ? 256 : form.type === 'ECDSA' ? 521 : 4096;
    const fp = 'SHA256:' + Array.from({length: 22}, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*62)]).join('');
    const newKey: SSHKey = { id: String(Date.now()), name: form.name, type: form.type as SSHKey['type'], bits, fingerprint: fp, status: 'ACTIVE', owner: form.owner, servers: form.servers.split(',').map(s => s.trim()).filter(Boolean), createdAt: new Date().toISOString().slice(0, 10), expiresAt: form.expiresAt || undefined };
    setKeys([newKey, ...keys]);
    setSuccess('SSH 키가 생성되었습니다.');
    setShowCreate(false);
    setForm({ name: '', type: 'ED25519', owner: '', servers: '', expiresAt: '' });
  };

  const handleDownload = (k: SSHKey) => {
    setSuccess(`${k.name} 공개키 다운로드`);
  };

  const handleRevoke = (k: SSHKey) => {
    if (confirm(`${k.name} 폐기?`)) {
      setKeys(keys.map(key => key.id === k.id ? { ...key, status: 'REVOKED' } : key));
      setSuccess('키 폐기됨');
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

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', REVOKED: '#ef4444', EXPIRED: '#6b7280' }[s] || '#6b7280');

  const filtered = keys.filter(k => search === '' || k.name.includes(search) || k.owner.includes(search));

  return (
    <AdminLayout title="SSH 키 관리" description="SSH 키 생성 및 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ SSH 키</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{keys.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{keys.filter(k => k.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 폐기</div><div className="stat-value" style={{ color: '#ef4444' }}>{keys.filter(k => k.status === 'REVOKED').length}</div></div>
      </div>
      
      <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300, marginBottom: 16 }} />
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>이름</th><th>유형</th><th>소유자</th><th>핑거프린트</th><th>서버</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>{filtered.map(k => (
            <tr key={k.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedKey(k)}>
              <td style={{ fontWeight: 600 }}>{k.name}</td>
              <td>{k.type} ({k.bits})</td>
              <td>{k.owner}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{k.fingerprint.slice(0, 20)}...</td>
              <td style={{ fontSize: '0.85rem' }}>{k.servers.join(', ') || '-'}</td>
              <td><span style={{ padding: '2px 8px', background: `${getStatusColor(k.status)}20`, color: getStatusColor(k.status), borderRadius: 4, fontSize: '0.75rem' }}>{k.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                {k.status === 'ACTIVE' && <><button className="btn btn-ghost btn-sm" onClick={() => handleDownload(k)}>📥</button><button className="btn btn-ghost btn-sm" onClick={() => handleRevoke(k)}>🚫</button></>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {/* Detail Modal */}
      {selectedKey && (
        <div className="modal-overlay active" onClick={() => setSelectedKey(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔑 {selectedKey.name}</h3><button className="modal-close" onClick={() => setSelectedKey(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedKey.status)}20`, color: getStatusColor(selectedKey.status), borderRadius: 6 }}>{selectedKey.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedKey.type} {selectedKey.bits}bit</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><div><b>소유자:</b> {selectedKey.owner}</div><div><b>생성:</b> {selectedKey.createdAt}</div>{selectedKey.expiresAt && <div><b>만료:</b> {selectedKey.expiresAt}</div>}{selectedKey.lastUsed && <div><b>마지막 사용:</b> {selectedKey.lastUsed}</div>}</div>
            <div style={{ marginBottom: 8 }}><b>핑거프린트:</b></div>
            <div style={{ fontFamily: 'monospace', padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.85rem', wordBreak: 'break-all' }}>{selectedKey.fingerprint}</div>
            {selectedKey.servers.length > 0 && <div style={{ marginTop: 16 }}><b>서버:</b> {selectedKey.servers.join(', ')}</div>}
          </div>
          <div className="modal-footer">{selectedKey.status === 'ACTIVE' && <><button className="btn btn-secondary" onClick={() => handleDownload(selectedKey)}>📥 공개키</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleRevoke(selectedKey)}>🚫 폐기</button></>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedKey.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedKey(null)}>닫기</button></div>
        </div></div>
      )}
      
      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔑 SSH 키 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">키 이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="deploy-key-prod" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="ED25519">ED25519 (권장)</option><option value="RSA">RSA 4096</option><option value="ECDSA">ECDSA 521</option></select></div>
              <div className="form-group"><label className="form-label">소유자</label><input className="form-input" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} required /></div>
            </div>
            <div className="form-group"><label className="form-label">서버 패턴 (쉼표 구분)</label><input className="form-input" value={form.servers} onChange={e => setForm({ ...form, servers: e.target.value })} placeholder="prod-*, staging-*" /></div>
            <div className="form-group"><label className="form-label">만료일 (선택)</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

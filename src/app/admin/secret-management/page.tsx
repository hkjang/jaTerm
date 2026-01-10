'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Secret {
  id: string;
  name: string;
  path: string;
  type: 'PASSWORD' | 'API_KEY' | 'CERTIFICATE' | 'SSH_KEY' | 'TOKEN' | 'GENERIC';
  version: number;
  engine: 'VAULT' | 'AWS_SM' | 'K8S_SECRET' | 'LOCAL';
  rotationEnabled: boolean;
  lastRotated: string;
  nextRotation: string | null;
  accessCount: number;
  lastAccessed: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'DISABLED';
}

export default function SecretManagementPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', path: '', type: 'API_KEY', engine: 'VAULT', rotationEnabled: false });

  useEffect(() => {
    setSecrets([
      { id: '1', name: 'database-credentials', path: 'secret/prod/db', type: 'PASSWORD', version: 15, engine: 'VAULT', rotationEnabled: true, lastRotated: '2026-01-08', nextRotation: '2026-02-08', accessCount: 1250, lastAccessed: '2026-01-10 14:45', status: 'ACTIVE' },
      { id: '2', name: 'stripe-api-key', path: 'secret/prod/stripe', type: 'API_KEY', version: 3, engine: 'VAULT', rotationEnabled: false, lastRotated: '2025-06-15', nextRotation: null, accessCount: 850, lastAccessed: '2026-01-10 14:30', status: 'ACTIVE' },
      { id: '3', name: 'github-deploy-key', path: 'secret/ci/github', type: 'SSH_KEY', version: 2, engine: 'K8S_SECRET', rotationEnabled: true, lastRotated: '2025-12-01', nextRotation: '2026-01-15', accessCount: 420, lastAccessed: '2026-01-10 12:00', status: 'EXPIRING' },
      { id: '4', name: 'ssl-wildcard-cert', path: 'secret/certs/wildcard', type: 'CERTIFICATE', version: 5, engine: 'AWS_SM', rotationEnabled: true, lastRotated: '2025-10-01', nextRotation: '2026-01-10', accessCount: 95, lastAccessed: '2026-01-09 08:00', status: 'EXPIRING' },
      { id: '5', name: 'jwt-signing-key', path: 'secret/auth/jwt', type: 'TOKEN', version: 8, engine: 'VAULT', rotationEnabled: true, lastRotated: '2026-01-05', nextRotation: '2026-04-05', accessCount: 5600, lastAccessed: '2026-01-10 14:47', status: 'ACTIVE' },
      { id: '6', name: 'legacy-service-token', path: 'secret/legacy/token', type: 'TOKEN', version: 1, engine: 'LOCAL', rotationEnabled: false, lastRotated: '2024-01-01', nextRotation: null, accessCount: 15, lastAccessed: '2025-06-20', status: 'DISABLED' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setSecrets([{ id: String(Date.now()), name: form.name, path: form.path, type: form.type as Secret['type'], version: 1, engine: form.engine as Secret['engine'], rotationEnabled: form.rotationEnabled, lastRotated: '-', nextRotation: null, accessCount: 0, lastAccessed: '-', status: 'ACTIVE' }, ...secrets]); setSuccess('시크릿 생성됨'); setShowCreate(false); setForm({ name: '', path: '', type: 'API_KEY', engine: 'VAULT', rotationEnabled: false }); };
  const handleRotate = (s: Secret) => { if (confirm('로테이션?')) { setSecrets(secrets.map(sec => sec.id === s.id ? { ...sec, version: sec.version + 1, lastRotated: new Date().toISOString().slice(0, 10), nextRotation: s.rotationEnabled ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : null } : sec)); setSuccess(`${s.name} 로테이션됨`); setSelectedSecret(null); } };
  const handleDisable = (s: Secret) => { if (confirm('비활성화?')) { setSecrets(secrets.map(sec => sec.id === s.id ? { ...sec, status: 'DISABLED' } : sec)); setSuccess('비활성화됨'); setSelectedSecret(null); } };

  const getTypeIcon = (t: string) => ({ PASSWORD: '🔑', API_KEY: '🔌', CERTIFICATE: '📜', SSH_KEY: '🔐', TOKEN: '🎫', GENERIC: '📦' }[t] || '🔒');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', EXPIRING: '#f59e0b', EXPIRED: '#ef4444', DISABLED: '#6b7280' }[s] || '#6b7280');
  const getEngineIcon = (e: string) => ({ VAULT: '🏛️', AWS_SM: '☁️', K8S_SECRET: '☸️', LOCAL: '💻' }[e] || '🔧');

  const filtered = secrets.filter(s => search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.path.toLowerCase().includes(search.toLowerCase()));
  const expiringCount = secrets.filter(s => s.status === 'EXPIRING').length;

  return (
    <AdminLayout title="시크릿 관리" description="자격증명 및 키 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 시크릿</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 시크릿</div><div className="stat-value">{secrets.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{secrets.filter(s => s.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 만료 예정</div><div className="stat-value" style={{ color: expiringCount > 0 ? '#f59e0b' : '#10b981' }}>{expiringCount}</div></div>
        <div className="stat-card"><div className="stat-label">🔄 자동 로테이션</div><div className="stat-value">{secrets.filter(s => s.rotationEnabled).length}</div></div>
      </div>
      <div style={{ marginBottom: 16 }}><input className="form-input" placeholder="🔍 시크릿 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} /></div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>시크릿</th><th>경로</th><th>유형</th><th>엔진</th><th>버전</th><th>접근</th><th>상태</th></tr></thead>
            <tbody>{filtered.map(s => (
              <tr key={s.id} style={{ cursor: 'pointer', opacity: s.status === 'DISABLED' ? 0.5 : 1 }} onClick={() => setSelectedSecret(s)}>
                <td style={{ fontWeight: 600 }}>{s.name}{s.rotationEnabled && <span style={{ marginLeft: 6, fontSize: '0.8rem' }}>🔄</span>}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{s.path}</td>
                <td>{getTypeIcon(s.type)} {s.type}</td>
                <td>{getEngineIcon(s.engine)} {s.engine}</td>
                <td>v{s.version}</td>
                <td>{s.accessCount.toLocaleString()}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), borderRadius: 4, fontSize: '0.8rem' }}>{s.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedSecret && (
        <div className="modal-overlay active" onClick={() => setSelectedSecret(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedSecret.type)} {selectedSecret.name}</h3><button className="modal-close" onClick={() => setSelectedSecret(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedSecret.status)}20`, color: getStatusColor(selectedSecret.status), borderRadius: 6 }}>{selectedSecret.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{getEngineIcon(selectedSecret.engine)} {selectedSecret.engine}</span></div>
            <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: 16 }}>{selectedSecret.path}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>유형:</b> {selectedSecret.type}</div><div><b>버전:</b> v{selectedSecret.version}</div>
              <div><b>접근 횟수:</b> {selectedSecret.accessCount.toLocaleString()}</div><div><b>마지막 접근:</b> {selectedSecret.lastAccessed}</div>
              <div><b>마지막 로테이션:</b> {selectedSecret.lastRotated}</div><div><b>다음 로테이션:</b> {selectedSecret.nextRotation || '-'}</div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleRotate(selectedSecret)}>🔄 로테이션</button>{selectedSecret.status !== 'DISABLED' && <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDisable(selectedSecret)}>⛔ 비활성화</button>}<button className="btn btn-ghost" onClick={() => setSelectedSecret(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔐 시크릿 추가</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="database-password" required /></div>
            <div className="form-group"><label className="form-label">경로</label><input className="form-input" value={form.path} onChange={e => setForm({ ...form, path: e.target.value })} placeholder="secret/prod/db" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="PASSWORD">비밀번호</option><option value="API_KEY">API 키</option><option value="CERTIFICATE">인증서</option><option value="SSH_KEY">SSH 키</option><option value="TOKEN">토큰</option></select></div>
              <div className="form-group"><label className="form-label">엔진</label><select className="form-input" value={form.engine} onChange={e => setForm({ ...form, engine: e.target.value })}><option value="VAULT">Vault</option><option value="AWS_SM">AWS SM</option><option value="K8S_SECRET">K8s</option><option value="LOCAL">Local</option></select></div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.rotationEnabled} onChange={e => setForm({ ...form, rotationEnabled: e.target.checked })} /><label>자동 로테이션 활성화</label></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

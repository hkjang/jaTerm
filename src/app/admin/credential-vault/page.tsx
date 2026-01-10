'use client';

import { useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminCrud } from '@/hooks/useAdminCrud';

interface Credential {
  id: string;
  name: string;
  type: 'SSH_KEY' | 'PASSWORD' | 'API_KEY' | 'CERTIFICATE' | 'TOKEN';
  username?: string;
  target: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'EXPIRING_SOON';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  usedBy: string[];
  rotationEnabled: boolean;
  rotationDays?: number;
}

const mockCredentials: Credential[] = [
  { id: '1', name: 'prod-db-root', type: 'PASSWORD', username: 'root', target: 'prod-db-*.internal', status: 'ACTIVE', createdAt: '2025-06-01', expiresAt: '2026-06-01', lastUsed: '2026-01-10', usedBy: ['김관리자', '이DBA'], rotationEnabled: true, rotationDays: 90 },
  { id: '2', name: 'deploy-key-prod', type: 'SSH_KEY', target: 'prod-*.internal', status: 'ACTIVE', createdAt: '2025-07-15', lastUsed: '2026-01-10', usedBy: ['배포 시스템'], rotationEnabled: false },
  { id: '3', name: 'aws-access-key', type: 'API_KEY', target: 'AWS Console', status: 'EXPIRING_SOON', createdAt: '2025-01-15', expiresAt: '2026-01-15', lastUsed: '2026-01-09', usedBy: ['인프라팀'], rotationEnabled: true, rotationDays: 365 },
  { id: '4', name: 'api-ssl-cert', type: 'CERTIFICATE', target: 'api.company.com', status: 'ACTIVE', createdAt: '2025-08-01', expiresAt: '2026-08-01', lastUsed: '2026-01-10', usedBy: ['API 서버'], rotationEnabled: true, rotationDays: 365 },
  { id: '5', name: 'github-deploy-token', type: 'TOKEN', target: 'GitHub Actions', status: 'ACTIVE', createdAt: '2025-11-01', lastUsed: '2026-01-10', usedBy: ['CI/CD'], rotationEnabled: false },
  { id: '6', name: 'old-admin-pass', type: 'PASSWORD', username: 'admin', target: 'legacy-system', status: 'REVOKED', createdAt: '2024-01-01', usedBy: [], rotationEnabled: false },
];

export default function CredentialVaultPage() {
  const { items: credentials, loading, error, success, create, update, remove, setSuccess, fetch } = useAdminCrud<Credential>('/api/admin/credentials', { mockData: mockCredentials, useMock: true });
  
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ name: '', type: 'PASSWORD', username: '', target: '', expiresAt: '', rotationEnabled: false, rotationDays: 90 });

  const resetForm = useCallback(() => {
    setForm({ name: '', type: 'PASSWORD', username: '', target: '', expiresAt: '', rotationEnabled: false, rotationDays: 90 });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await create({
      ...form,
      status: 'ACTIVE',
      usedBy: [],
      expiresAt: form.expiresAt || undefined,
      username: form.username || undefined,
    } as Partial<Credential>);
    if (result) { setShowCreate(false); resetForm(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCred) return;
    const result = await update(selectedCred.id, form);
    if (result) { setShowEdit(false); setSelectedCred(null); resetForm(); }
  };

  const openEdit = (cred: Credential) => {
    setForm({ name: cred.name, type: cred.type, username: cred.username || '', target: cred.target, expiresAt: cred.expiresAt || '', rotationEnabled: cred.rotationEnabled, rotationDays: cred.rotationDays || 90 });
    setSelectedCred(cred);
    setShowEdit(true);
  };

  const handleRotate = async (c: Credential) => {
    await update(c.id, { lastUsed: new Date().toISOString().slice(0, 10) });
    setSuccess(`${c.name} 회전 시작...`);
  };

  const handleRevoke = async (c: Credential) => {
    if (confirm(`${c.name} 폐기?`)) {
      await update(c.id, { status: 'REVOKED' });
      setSelectedCred(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('삭제?')) { await remove(id); setSelectedCred(null); }
  };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', EXPIRED: '#6b7280', REVOKED: '#ef4444', EXPIRING_SOON: '#f59e0b' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ SSH_KEY: '🔑', PASSWORD: '🔒', API_KEY: '🔌', CERTIFICATE: '📜', TOKEN: '🎫' }[t] || '❓');

  const filtered = credentials.filter(c => (filterType === '' || c.type === filterType) && (search === '' || c.name.includes(search) || c.target.includes(search)));
  const expiringSoon = credentials.filter(c => c.status === 'EXPIRING_SOON').length;

  return (
    <AdminLayout title="자격증명 보관" description="비밀번호, SSH 키, 인증서 등 자격증명 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 자격증명</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>❌ {error}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{credentials.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{credentials.filter(c => c.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 만료 임박</div><div className="stat-value" style={{ color: '#f59e0b' }}>{expiringSoon}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 폐기</div><div className="stat-value" style={{ color: '#ef4444' }}>{credentials.filter(c => c.status === 'REVOKED').length}</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 130 }}>
          <option value="">전체 유형</option><option value="PASSWORD">비밀번호</option><option value="SSH_KEY">SSH 키</option><option value="API_KEY">API 키</option><option value="CERTIFICATE">인증서</option><option value="TOKEN">토큰</option>
        </select>
        <button className="btn btn-ghost" onClick={() => fetch()}>🔄 새로고침</button>
      </div>
      
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>이름</th><th>유형</th><th>대상</th><th>사용자</th><th>만료</th><th>회전</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCred(c)}>
                <td><div style={{ fontWeight: 600 }}>{c.name}</div>{c.username && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>@{c.username}</div>}</td>
                <td>{getTypeIcon(c.type)} {c.type}</td>
                <td style={{ fontSize: '0.85rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.target}</td>
                <td style={{ fontSize: '0.85rem' }}>{c.usedBy.length}명</td>
                <td style={{ fontSize: '0.85rem' }}>{c.expiresAt || '-'}</td>
                <td>{c.rotationEnabled ? <span style={{ color: '#10b981' }}>✓ {c.rotationDays}일</span> : <span style={{ color: '#6b7280' }}>-</span>}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(c.status)}20`, color: getStatusColor(c.status), borderRadius: 4, fontSize: '0.75rem' }}>{c.status}</span></td>
                <td onClick={e => e.stopPropagation()}>
                  {c.status === 'ACTIVE' && <button className="btn btn-ghost btn-sm" onClick={() => handleRotate(c)}>🔄</button>}
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button>
                  {c.status !== 'REVOKED' && <button className="btn btn-ghost btn-sm" onClick={() => handleRevoke(c)}>🚫</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      
      {/* Detail Modal */}
      {selectedCred && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedCred(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedCred.type)} {selectedCred.name}</h3><button className="modal-close" onClick={() => setSelectedCred(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedCred.status)}20`, color: getStatusColor(selectedCred.status), borderRadius: 6 }}>{selectedCred.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedCred.type}</span>{selectedCred.rotationEnabled && <span style={{ padding: '4px 10px', background: '#10b98120', color: '#10b981', borderRadius: 6 }}>🔄 {selectedCred.rotationDays}일</span>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>{selectedCred.username && <div><b>사용자명:</b> {selectedCred.username}</div>}<div><b>대상:</b> {selectedCred.target}</div><div><b>생성:</b> {selectedCred.createdAt}</div>{selectedCred.expiresAt && <div><b>만료:</b> {selectedCred.expiresAt}</div>}{selectedCred.lastUsed && <div><b>마지막 사용:</b> {selectedCred.lastUsed}</div>}</div>
            {selectedCred.usedBy.length > 0 && <div style={{ marginBottom: 8 }}><b>사용 중:</b></div>}{selectedCred.usedBy.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{selectedCred.usedBy.map(u => <span key={u} style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.85rem' }}>{u}</span>)}</div>}
          </div>
          <div className="modal-footer">{selectedCred.status === 'ACTIVE' && <><button className="btn btn-secondary" onClick={() => handleRotate(selectedCred)}>🔄 회전</button><button className="btn btn-secondary" onClick={() => openEdit(selectedCred)}>✏️ 수정</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleRevoke(selectedCred)}>🚫 폐기</button></>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedCred.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedCred(null)}>닫기</button></div>
        </div></div>
      )}
      
      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔒 자격증명 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="prod-db-root" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="PASSWORD">비밀번호</option><option value="SSH_KEY">SSH 키</option><option value="API_KEY">API 키</option><option value="CERTIFICATE">인증서</option><option value="TOKEN">토큰</option></select></div>
              <div className="form-group"><label className="form-label">사용자명</label><input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="선택사항" /></div>
            </div>
            <div className="form-group"><label className="form-label">대상</label><input className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} required placeholder="prod-*.internal" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">만료일</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">자동 회전</label><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}><input type="checkbox" checked={form.rotationEnabled} onChange={e => setForm({ ...form, rotationEnabled: e.target.checked })} /><span>활성화</span>{form.rotationEnabled && <input type="number" className="form-input" style={{ width: 80 }} value={form.rotationDays} onChange={e => setForm({ ...form, rotationDays: parseInt(e.target.value) })} />}{form.rotationEnabled && <span>일</span>}</div></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
      
      {/* Edit Modal */}
      {showEdit && selectedCred && (
        <div className="modal-overlay active" onClick={() => { setShowEdit(false); setSelectedCred(null); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">✏️ 자격증명 수정</h3><button className="modal-close" onClick={() => { setShowEdit(false); setSelectedCred(null); }}>×</button></div>
          <form onSubmit={handleEdit}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="PASSWORD">비밀번호</option><option value="SSH_KEY">SSH 키</option><option value="API_KEY">API 키</option><option value="CERTIFICATE">인증서</option><option value="TOKEN">토큰</option></select></div>
              <div className="form-group"><label className="form-label">사용자명</label><input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">대상</label><input className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">만료일</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">자동 회전</label><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}><input type="checkbox" checked={form.rotationEnabled} onChange={e => setForm({ ...form, rotationEnabled: e.target.checked })} /><span>활성화</span>{form.rotationEnabled && <input type="number" className="form-input" style={{ width: 80 }} value={form.rotationDays} onChange={e => setForm({ ...form, rotationDays: parseInt(e.target.value) })} />}{form.rotationEnabled && <span>일</span>}</div></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowEdit(false); setSelectedCred(null); }}>취소</button><button type="submit" className="btn btn-primary">저장</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

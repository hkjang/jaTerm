'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Credential {
  id: string;
  name: string;
  type: 'SSH_KEY' | 'PASSWORD' | 'API_KEY' | 'CERTIFICATE';
  target: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  usedBy: string[];
  rotationEnabled: boolean;
  rotationDays?: number;
}

const initialCredentials: Credential[] = [
  { id: '1', name: 'prod-db-root', type: 'PASSWORD', target: 'prod-db-*.internal', status: 'ACTIVE', createdAt: '2025-06-01', expiresAt: '2026-06-01', lastUsed: '2026-01-10', usedBy: ['김관리자', '이DBA'], rotationEnabled: true, rotationDays: 90 },
  { id: '2', name: 'deploy-key-prod', type: 'SSH_KEY', target: 'prod-*.internal', status: 'ACTIVE', createdAt: '2025-07-15', lastUsed: '2026-01-10', usedBy: ['배포시스템'], rotationEnabled: false },
  { id: '3', name: 'aws-access-key', type: 'API_KEY', target: 'AWS Console', status: 'ACTIVE', createdAt: '2025-01-15', expiresAt: '2026-01-15', lastUsed: '2026-01-09', usedBy: ['인프라팀'], rotationEnabled: true, rotationDays: 365 },
  { id: '4', name: 'api-ssl-cert', type: 'CERTIFICATE', target: 'api.company.com', status: 'ACTIVE', createdAt: '2025-08-01', expiresAt: '2026-08-01', usedBy: ['API 서버'], rotationEnabled: true, rotationDays: 365 },
];

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ name: '', type: 'PASSWORD', target: '', expiresAt: '', rotationEnabled: false, rotationDays: 90 });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCred: Credential = { id: String(Date.now()), ...form, type: form.type as Credential['type'], status: 'ACTIVE', createdAt: new Date().toISOString().slice(0, 10), usedBy: [], expiresAt: form.expiresAt || undefined, rotationDays: form.rotationEnabled ? form.rotationDays : undefined };
    setCredentials([newCred, ...credentials]);
    setSuccess('자격증명이 추가되었습니다.');
    setShowCreate(false);
    setForm({ name: '', type: 'PASSWORD', target: '', expiresAt: '', rotationEnabled: false, rotationDays: 90 });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCred) return;
    setCredentials(credentials.map(c => c.id === selectedCred.id ? { ...c, ...form, type: form.type as Credential['type'], expiresAt: form.expiresAt || undefined, rotationDays: form.rotationEnabled ? form.rotationDays : undefined } : c));
    setSuccess('수정되었습니다.');
    setShowEdit(false);
    setSelectedCred(null);
  };

  const openEdit = (cred: Credential) => {
    setForm({ name: cred.name, type: cred.type, target: cred.target, expiresAt: cred.expiresAt || '', rotationEnabled: cred.rotationEnabled, rotationDays: cred.rotationDays || 90 });
    setSelectedCred(cred);
    setShowEdit(true);
  };

  const handleRotate = (cred: Credential) => {
    setCredentials(credentials.map(c => c.id === cred.id ? { ...c, lastUsed: new Date().toISOString().slice(0, 10) } : c));
    setSuccess(`${cred.name} 회전 시작...`);
  };

  const handleRevoke = (cred: Credential) => {
    if (confirm(`${cred.name} 폐기?`)) {
      setCredentials(credentials.map(c => c.id === cred.id ? { ...c, status: 'REVOKED' } : c));
      setSuccess('폐기되었습니다.');
      setSelectedCred(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제?')) {
      setCredentials(credentials.filter(c => c.id !== id));
      setSuccess('삭제되었습니다.');
      setSelectedCred(null);
    }
  };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', EXPIRED: '#6b7280', REVOKED: '#ef4444' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ SSH_KEY: '🔑', PASSWORD: '🔒', API_KEY: '🔌', CERTIFICATE: '📜' }[t] || '❓');

  const filtered = credentials.filter(c => (filterType === '' || c.type === filterType) && (search === '' || c.name.includes(search) || c.target.includes(search)));

  return (
    <AdminLayout title="자격증명 관리" description="비밀번호, SSH 키, API 키, 인증서 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 자격증명</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{credentials.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{credentials.filter(c => c.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔄 회전 활성</div><div className="stat-value">{credentials.filter(c => c.rotationEnabled).length}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 폐기</div><div className="stat-value" style={{ color: '#ef4444' }}>{credentials.filter(c => c.status === 'REVOKED').length}</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 130 }}>
          <option value="">전체</option><option value="PASSWORD">비밀번호</option><option value="SSH_KEY">SSH 키</option><option value="API_KEY">API 키</option><option value="CERTIFICATE">인증서</option>
        </select>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>이름</th><th>유형</th><th>대상</th><th>만료</th><th>회전</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>{filtered.map(c => (
            <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCred(c)}>
              <td style={{ fontWeight: 600 }}>{c.name}</td>
              <td>{getTypeIcon(c.type)} {c.type}</td>
              <td style={{ fontSize: '0.85rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.target}</td>
              <td style={{ fontSize: '0.85rem' }}>{c.expiresAt || '-'}</td>
              <td>{c.rotationEnabled ? <span style={{ color: '#10b981' }}>✓ {c.rotationDays}일</span> : '-'}</td>
              <td><span style={{ padding: '2px 8px', background: `${getStatusColor(c.status)}20`, color: getStatusColor(c.status), borderRadius: 4, fontSize: '0.75rem' }}>{c.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                {c.status === 'ACTIVE' && <><button className="btn btn-ghost btn-sm" onClick={() => handleRotate(c)}>🔄</button><button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button><button className="btn btn-ghost btn-sm" onClick={() => handleRevoke(c)}>🚫</button></>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {/* Detail Modal */}
      {selectedCred && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedCred(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedCred.type)} {selectedCred.name}</h3><button className="modal-close" onClick={() => setSelectedCred(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedCred.status)}20`, color: getStatusColor(selectedCred.status), borderRadius: 6 }}>{selectedCred.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedCred.type}</span>{selectedCred.rotationEnabled && <span style={{ padding: '4px 10px', background: '#10b98120', color: '#10b981', borderRadius: 6 }}>🔄 {selectedCred.rotationDays}일</span>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>대상:</b> {selectedCred.target}</div><div><b>생성:</b> {selectedCred.createdAt}</div>{selectedCred.expiresAt && <div><b>만료:</b> {selectedCred.expiresAt}</div>}{selectedCred.lastUsed && <div><b>마지막 사용:</b> {selectedCred.lastUsed}</div>}</div>
            {selectedCred.usedBy.length > 0 && <div style={{ marginTop: 16 }}><b>사용 중:</b> {selectedCred.usedBy.join(', ')}</div>}
          </div>
          <div className="modal-footer">{selectedCred.status === 'ACTIVE' && <><button className="btn btn-secondary" onClick={() => handleRotate(selectedCred)}>🔄 회전</button><button className="btn btn-secondary" onClick={() => openEdit(selectedCred)}>✏️ 수정</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleRevoke(selectedCred)}>🚫 폐기</button></>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedCred.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedCred(null)}>닫기</button></div>
        </div></div>
      )}
      
      {/* Create/Edit Modal */}
      {(showCreate || showEdit) && (
        <div className="modal-overlay active" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedCred(null); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{showEdit ? '✏️ 수정' : '🔒 자격증명 추가'}</h3><button className="modal-close" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedCred(null); }}>×</button></div>
          <form onSubmit={showEdit ? handleEdit : handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="PASSWORD">비밀번호</option><option value="SSH_KEY">SSH 키</option><option value="API_KEY">API 키</option><option value="CERTIFICATE">인증서</option></select></div>
              <div className="form-group"><label className="form-label">대상</label><input className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} required /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">만료일</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">자동 회전</label><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}><input type="checkbox" checked={form.rotationEnabled} onChange={e => setForm({ ...form, rotationEnabled: e.target.checked })} /><span>활성</span>{form.rotationEnabled && <><input type="number" className="form-input" style={{ width: 80 }} value={form.rotationDays} onChange={e => setForm({ ...form, rotationDays: parseInt(e.target.value) })} /><span>일</span></>}</div></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedCred(null); }}>취소</button><button type="submit" className="btn btn-primary">{showEdit ? '저장' : '추가'}</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

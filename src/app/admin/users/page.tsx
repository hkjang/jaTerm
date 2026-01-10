'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'DEVELOPER' | 'VIEWER';
  department: string;
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
  mfaEnabled: boolean;
  lastLogin: string | null;
  createdAt: string;
  servers: number;
  sessions: number;
}

const initialUsers: User[] = [
  { id: '1', email: 'admin@company.com', name: '김관리자', role: 'ADMIN', department: '인프라팀', status: 'ACTIVE', mfaEnabled: true, lastLogin: '2026-01-10 14:30', createdAt: '2024-01-01', servers: 15, sessions: 45 },
  { id: '2', email: 'dev@company.com', name: '이개발', role: 'DEVELOPER', department: '개발팀', status: 'ACTIVE', mfaEnabled: true, lastLogin: '2026-01-10 09:15', createdAt: '2024-06-01', servers: 8, sessions: 234 },
  { id: '3', email: 'ops@company.com', name: '박운영', role: 'OPERATOR', department: '운영팀', status: 'ACTIVE', mfaEnabled: true, lastLogin: '2026-01-10 12:00', createdAt: '2024-03-15', servers: 12, sessions: 178 },
  { id: '4', email: 'viewer@company.com', name: '최감사', role: 'VIEWER', department: '감사팀', status: 'ACTIVE', mfaEnabled: false, lastLogin: '2026-01-09 16:30', createdAt: '2025-01-01', servers: 5, sessions: 23 },
  { id: '5', email: 'newuser@company.com', name: '정신입', role: 'DEVELOPER', department: '개발팀', status: 'PENDING', mfaEnabled: false, lastLogin: null, createdAt: '2026-01-08', servers: 0, sessions: 0 },
  { id: '6', email: 'blocked@company.com', name: '강차단', role: 'DEVELOPER', department: '개발팀', status: 'BLOCKED', mfaEnabled: false, lastLogin: '2025-12-01', createdAt: '2024-06-01', servers: 0, sessions: 156 },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'DEVELOPER', department: '' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = { id: String(Date.now()), ...form, role: form.role as User['role'], status: 'PENDING', mfaEnabled: false, lastLogin: null, createdAt: new Date().toISOString().slice(0, 10), servers: 0, sessions: 0 };
    setUsers([newUser, ...users]);
    setSuccess('사용자가 추가되었습니다.');
    setShowCreate(false);
    setForm({ name: '', email: '', role: 'DEVELOPER', department: '' });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...form, role: form.role as User['role'] } : u));
    setSuccess('수정되었습니다.');
    setShowEdit(false);
    setSelectedUser(null);
  };

  const openEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, role: user.role, department: user.department });
    setSelectedUser(user);
    setShowEdit(true);
  };

  const handleBlock = (user: User) => {
    setUsers(users.map(u => u.id === user.id ? { ...u, status: u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' } : u));
    setSuccess(user.status === 'BLOCKED' ? '차단 해제됨' : '차단됨');
    setSelectedUser(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('사용자를 삭제하시겠습니까?')) {
      setUsers(users.filter(u => u.id !== id));
      setSuccess('삭제되었습니다.');
      setSelectedUser(null);
    }
  };

  const handleApprove = (user: User) => {
    setUsers(users.map(u => u.id === user.id ? { ...u, status: 'ACTIVE' } : u));
    setSuccess('승인되었습니다.');
    setSelectedUser(null);
  };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', PENDING: '#f59e0b', BLOCKED: '#ef4444' }[s] || '#6b7280');
  const getRoleColor = (r: string) => ({ ADMIN: '#ef4444', OPERATOR: '#f59e0b', DEVELOPER: '#10b981', VIEWER: '#6b7280' }[r] || '#6b7280');

  const filtered = users.filter(u => 
    (filterRole === '' || u.role === filterRole) &&
    (filterStatus === '' || u.status === filterStatus) &&
    (search === '' || u.name.includes(search) || u.email.includes(search))
  );

  return (
    <AdminLayout title="사용자 관리" description="사용자 계정 및 권한 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 사용자</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{users.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{users.filter(u => u.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">⏳ 대기</div><div className="stat-value" style={{ color: '#f59e0b' }}>{users.filter(u => u.status === 'PENDING').length}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 차단</div><div className="stat-value" style={{ color: '#ef4444' }}>{users.filter(u => u.status === 'BLOCKED').length}</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 120 }}>
          <option value="">전체 역할</option><option value="ADMIN">관리자</option><option value="OPERATOR">운영자</option><option value="DEVELOPER">개발자</option><option value="VIEWER">열람자</option>
        </select>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 120 }}>
          <option value="">전체 상태</option><option value="ACTIVE">활성</option><option value="PENDING">대기</option><option value="BLOCKED">차단</option>
        </select>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>사용자</th><th>역할</th><th>부서</th><th>MFA</th><th>마지막 로그인</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>{filtered.map(u => (
            <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedUser(u)}>
              <td><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{u.email}</div></td>
              <td><span style={{ padding: '2px 8px', background: `${getRoleColor(u.role)}20`, color: getRoleColor(u.role), borderRadius: 4, fontSize: '0.75rem' }}>{u.role}</span></td>
              <td style={{ fontSize: '0.85rem' }}>{u.department}</td>
              <td>{u.mfaEnabled ? '✅' : '❌'}</td>
              <td style={{ fontSize: '0.85rem' }}>{u.lastLogin || '-'}</td>
              <td><span style={{ padding: '2px 8px', background: `${getStatusColor(u.status)}20`, color: getStatusColor(u.status), borderRadius: 4, fontSize: '0.75rem' }}>{u.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                {u.status === 'PENDING' && <button className="btn btn-ghost btn-sm" onClick={() => handleApprove(u)}>✅</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleBlock(u)}>{u.status === 'BLOCKED' ? '🔓' : '🚫'}</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {/* Detail Modal */}
      {selectedUser && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedUser(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">👤 {selectedUser.name}</h3><button className="modal-close" onClick={() => setSelectedUser(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedUser.status)}20`, color: getStatusColor(selectedUser.status), borderRadius: 6 }}>{selectedUser.status}</span><span style={{ padding: '4px 10px', background: `${getRoleColor(selectedUser.role)}20`, color: getRoleColor(selectedUser.role), borderRadius: 6 }}>{selectedUser.role}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><div><b>이메일:</b> {selectedUser.email}</div><div><b>부서:</b> {selectedUser.department}</div><div><b>MFA:</b> {selectedUser.mfaEnabled ? '활성' : '비활성'}</div><div><b>가입일:</b> {selectedUser.createdAt}</div><div><b>마지막 로그인:</b> {selectedUser.lastLogin || '없음'}</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--color-bg-secondary)', padding: 16, borderRadius: 8 }}><div style={{ textAlign: 'center' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>서버 접근</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedUser.servers}</div></div><div style={{ textAlign: 'center' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>총 세션</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedUser.sessions}</div></div></div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => openEdit(selectedUser)}>✏️ 수정</button><button className="btn btn-secondary" onClick={() => handleBlock(selectedUser)}>{selectedUser.status === 'BLOCKED' ? '🔓 차단 해제' : '🚫 차단'}</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedUser.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>닫기</button></div>
        </div></div>
      )}
      
      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">👤 사용자 추가</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">이메일</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">역할</label><select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="DEVELOPER">개발자</option><option value="OPERATOR">운영자</option><option value="VIEWER">열람자</option><option value="ADMIN">관리자</option></select></div>
              <div className="form-group"><label className="form-label">부서</label><input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">추가</button></div></form>
        </div></div>
      )}
      
      {/* Edit Modal */}
      {showEdit && selectedUser && (
        <div className="modal-overlay active" onClick={() => { setShowEdit(false); setSelectedUser(null); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">✏️ 사용자 수정</h3><button className="modal-close" onClick={() => { setShowEdit(false); setSelectedUser(null); }}>×</button></div>
          <form onSubmit={handleEdit}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">이메일</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">역할</label><select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="DEVELOPER">개발자</option><option value="OPERATOR">운영자</option><option value="VIEWER">열람자</option><option value="ADMIN">관리자</option></select></div>
              <div className="form-group"><label className="form-label">부서</label><input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowEdit(false); setSelectedUser(null); }}>취소</button><button type="submit" className="btn btn-primary">저장</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

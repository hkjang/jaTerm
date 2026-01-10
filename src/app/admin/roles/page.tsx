'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  userCount: number;
  color: string;
  isSystem: boolean;
}

const initialRoles: Role[] = [
  { id: '1', name: 'ADMIN', displayName: '관리자', description: '전체 시스템 관리 권한', permissions: ['*'], userCount: 3, color: '#ef4444', isSystem: true },
  { id: '2', name: 'OPERATOR', displayName: '운영자', description: '서버 운영 및 모니터링', permissions: ['servers:read', 'servers:connect', 'sessions:manage'], userCount: 8, color: '#f59e0b', isSystem: true },
  { id: '3', name: 'DEVELOPER', displayName: '개발자', description: '개발/스테이징 서버 접근', permissions: ['servers:read', 'servers:connect_dev', 'sessions:read_own'], userCount: 25, color: '#10b981', isSystem: true },
  { id: '4', name: 'VIEWER', displayName: '열람자', description: '읽기 전용', permissions: ['servers:read', 'sessions:read'], userCount: 12, color: '#6b7280', isSystem: true },
  { id: '5', name: 'DBA', displayName: 'DBA', description: '데이터베이스 전용', permissions: ['servers:connect_db'], userCount: 4, color: '#8b5cf6', isSystem: false },
];

const allPermissions = [
  { id: 'servers:read', label: '서버 조회' },
  { id: 'servers:connect', label: '서버 접속 (전체)' },
  { id: 'servers:connect_dev', label: '개발서버 접속' },
  { id: 'servers:connect_db', label: 'DB서버 접속' },
  { id: 'sessions:read', label: '세션 조회' },
  { id: 'sessions:read_own', label: '내 세션 조회' },
  { id: 'sessions:manage', label: '세션 관리' },
  { id: 'audit:read', label: '감사 로그 조회' },
  { id: 'users:manage', label: '사용자 관리' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', displayName: '', description: '', permissions: [] as string[], color: '#10b981' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRole: Role = { id: String(Date.now()), ...form, name: form.name.toUpperCase(), userCount: 0, isSystem: false };
    setRoles([...roles, newRole]);
    setSuccess('역할이 추가되었습니다.');
    setShowCreate(false);
    setForm({ name: '', displayName: '', description: '', permissions: [], color: '#10b981' });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, ...form, name: form.name.toUpperCase() } : r));
    setSuccess('수정되었습니다.');
    setShowEdit(false);
    setSelectedRole(null);
  };

  const openEdit = (role: Role) => {
    setForm({ name: role.name, displayName: role.displayName, description: role.description, permissions: role.permissions, color: role.color });
    setSelectedRole(role);
    setShowEdit(true);
  };

  const handleDelete = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.isSystem) { alert('시스템 역할은 삭제할 수 없습니다.'); return; }
    if (role && role.userCount > 0) { alert('사용 중인 역할은 삭제할 수 없습니다.'); return; }
    if (confirm('역할을 삭제하시겠습니까?')) {
      setRoles(roles.filter(r => r.id !== id));
      setSuccess('삭제되었습니다.');
      setSelectedRole(null);
    }
  };

  const togglePerm = (perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm]
    }));
  };

  return (
    <AdminLayout title="역할 관리" description="역할 및 권한 설정" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 역할</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {roles.map(role => (
          <div key={role.id} className="card" style={{ cursor: 'pointer', border: `2px solid ${role.color}30` }} onClick={() => setSelectedRole(role)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${role.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🛡️</div>
              <div>
                <div style={{ fontWeight: 600 }}>{role.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{role.name}</div>
              </div>
              {role.isSystem && <span style={{ marginLeft: 'auto', padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.7rem' }}>시스템</span>}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{role.description}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>👥 {role.userCount}명</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{role.permissions.length} 권한</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Detail Modal */}
      {selectedRole && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedRole(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🛡️ {selectedRole.displayName}</h3><button className="modal-close" onClick={() => setSelectedRole(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${selectedRole.color}20`, color: selectedRole.color, borderRadius: 6 }}>{selectedRole.name}</span>{selectedRole.isSystem && <span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>시스템</span>}</div>
            <div style={{ marginBottom: 16 }}><b>설명:</b> {selectedRole.description}</div>
            <div style={{ marginBottom: 8 }}><b>권한 ({selectedRole.permissions.length}개):</b></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{selectedRole.permissions.map(p => <span key={p} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{p}</span>)}</div>
          </div>
          <div className="modal-footer">{!selectedRole.isSystem && <><button className="btn btn-secondary" onClick={() => openEdit(selectedRole)}>✏️ 수정</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedRole.id)}>🗑️</button></>}<button className="btn btn-ghost" onClick={() => setSelectedRole(null)}>닫기</button></div>
        </div></div>
      )}
      
      {/* Create/Edit Modal */}
      {(showCreate || showEdit) && (
        <div className="modal-overlay active" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedRole(null); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{showEdit ? '✏️ 역할 수정' : '🛡️ 역할 추가'}</h3><button className="modal-close" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedRole(null); }}>×</button></div>
          <form onSubmit={showEdit ? handleEdit : handleCreate}><div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">역할 ID</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="CUSTOM_ROLE" style={{ textTransform: 'uppercase' }} /></div>
              <div className="form-group"><label className="form-label">표시 이름</label><input className="form-input" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} required /></div>
            </div>
            <div className="form-group"><label className="form-label">설명</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">색상</label><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: 60, height: 36, padding: 2, cursor: 'pointer' }} /></div>
            <div className="form-group"><label className="form-label">권한</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {allPermissions.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={() => togglePerm(p.id)} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedRole(null); }}>취소</button><button type="submit" className="btn btn-primary">{showEdit ? '저장' : '추가'}</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

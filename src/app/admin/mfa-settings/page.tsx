'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface MfaUser {
  id: string;
  name: string;
  email: string;
  mfaEnabled: boolean;
  mfaMethod: 'TOTP' | 'SMS' | 'EMAIL' | 'HARDWARE' | null;
  enrolledAt: string | null;
  lastUsed: string | null;
  backupCodes: number;
}

interface MfaPolicy {
  requireMfa: boolean;
  allowedMethods: string[];
  graceperiodDays: number;
  enforceAfterDate: string;
}

export default function MfaSettingsPage() {
  const [users, setUsers] = useState<MfaUser[]>([]);
  const [policy, setPolicy] = useState<MfaPolicy>({ requireMfa: true, allowedMethods: ['TOTP', 'SMS', 'EMAIL', 'HARDWARE'], graceperiodDays: 7, enforceAfterDate: '2026-02-01' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'policy'>('users');
  const [selectedUser, setSelectedUser] = useState<MfaUser | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setUsers([
      { id: '1', name: '김관리자', email: 'admin@company.com', mfaEnabled: true, mfaMethod: 'TOTP', enrolledAt: '2025-06-15', lastUsed: '2026-01-10 14:30', backupCodes: 8 },
      { id: '2', name: '이개발', email: 'dev@company.com', mfaEnabled: true, mfaMethod: 'HARDWARE', enrolledAt: '2025-08-20', lastUsed: '2026-01-10 09:15', backupCodes: 10 },
      { id: '3', name: '박운영', email: 'ops@company.com', mfaEnabled: true, mfaMethod: 'TOTP', enrolledAt: '2025-09-10', lastUsed: '2026-01-09 18:45', backupCodes: 5 },
      { id: '4', name: '최보안', email: 'security@company.com', mfaEnabled: true, mfaMethod: 'SMS', enrolledAt: '2025-07-01', lastUsed: '2026-01-10 12:00', backupCodes: 10 },
      { id: '5', name: '정신입', email: 'new@company.com', mfaEnabled: false, mfaMethod: null, enrolledAt: null, lastUsed: null, backupCodes: 0 },
      { id: '6', name: '강테스트', email: 'test@company.com', mfaEnabled: false, mfaMethod: null, enrolledAt: null, lastUsed: null, backupCodes: 0 },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleResetMfa = (u: MfaUser) => { if (confirm(`${u.name}의 MFA를 초기화?`)) { setUsers(users.map(user => user.id === u.id ? { ...user, mfaEnabled: false, mfaMethod: null, enrolledAt: null, lastUsed: null, backupCodes: 0 } : user)); setSuccess('MFA 초기화됨'); setSelectedUser(null); } };
  const handleGenerateBackupCodes = (u: MfaUser) => { setUsers(users.map(user => user.id === u.id ? { ...user, backupCodes: 10 } : user)); setSuccess('백업 코드 재생성됨'); };
  const handleSavePolicy = () => { setSuccess('정책 저장됨'); setEditing(false); };
  const handleToggleMethod = (method: string) => { setPolicy({ ...policy, allowedMethods: policy.allowedMethods.includes(method) ? policy.allowedMethods.filter(m => m !== method) : [...policy.allowedMethods, method] }); };

  const getMethodIcon = (m: string | null) => ({ TOTP: '📱', SMS: '💬', EMAIL: '📧', HARDWARE: '🔑' }[m || ''] || '❓');
  const getMethodLabel = (m: string | null) => ({ TOTP: 'Authenticator', SMS: 'SMS', EMAIL: 'Email', HARDWARE: 'Hardware Key' }[m || ''] || '-');

  const filtered = users.filter(u => search === '' || u.name.includes(search) || u.email.includes(search));
  const enabledCount = users.filter(u => u.mfaEnabled).length;

  return (
    <AdminLayout title="MFA 설정" description="다중 인증(MFA) 관리">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체 사용자</div><div className="stat-value">{users.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ MFA 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{enabledCount}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ MFA 미설정</div><div className="stat-value" style={{ color: '#f59e0b' }}>{users.length - enabledCount}</div></div>
        <div className="stat-card"><div className="stat-label">📊 활성화율</div><div className="stat-value">{((enabledCount / users.length) * 100).toFixed(0)}%</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>👥 사용자</button>
        <button className={`btn ${activeTab === 'policy' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('policy')}>📋 정책</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : activeTab === 'users' ? (
        <>
          <div style={{ marginBottom: 16 }}><input className="form-input" placeholder="🔍 사용자 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} /></div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table"><thead><tr><th>사용자</th><th>MFA</th><th>방식</th><th>등록일</th><th>마지막 사용</th><th>백업코드</th><th>액션</th></tr></thead>
              <tbody>{filtered.map(u => (
                <tr key={u.id}>
                  <td><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{u.email}</div></td>
                  <td>{u.mfaEnabled ? <span style={{ color: '#10b981' }}>✅ 활성</span> : <span style={{ color: '#f59e0b' }}>⚠️ 미설정</span>}</td>
                  <td>{u.mfaMethod ? <>{getMethodIcon(u.mfaMethod)} {getMethodLabel(u.mfaMethod)}</> : '-'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.enrolledAt || '-'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.lastUsed || '-'}</td>
                  <td>{u.backupCodes > 0 ? <span style={{ color: u.backupCodes < 3 ? '#f59e0b' : '#10b981' }}>{u.backupCodes}개</span> : '-'}</td>
                  <td>{u.mfaEnabled && <><button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(u)}>상세</button><button className="btn btn-ghost btn-sm" onClick={() => handleResetMfa(u)}>🔄</button></>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ margin: 0 }}>📋 MFA 정책</h3>
            {editing ? <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-primary" onClick={handleSavePolicy}>저장</button><button className="btn btn-secondary" onClick={() => setEditing(false)}>취소</button></div> : <button className="btn btn-secondary" onClick={() => setEditing(true)}>✏️ 수정</button>}
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border-light)' }}><div><div style={{ fontWeight: 500 }}>MFA 필수</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>모든 사용자에게 MFA 의무화</div></div><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={policy.requireMfa} disabled={!editing} onChange={e => setPolicy({ ...policy, requireMfa: e.target.checked })} style={{ width: 18, height: 18 }} /><span>{policy.requireMfa ? 'ON' : 'OFF'}</span></label></div>
            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-light)' }}><div style={{ fontWeight: 500, marginBottom: 8 }}>허용된 MFA 방식</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['TOTP', 'SMS', 'EMAIL', 'HARDWARE'].map(m => <button key={m} className={`btn ${policy.allowedMethods.includes(m) ? 'btn-primary' : 'btn-secondary'}`} disabled={!editing} onClick={() => handleToggleMethod(m)}>{getMethodIcon(m)} {getMethodLabel(m)}</button>)}</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="form-group"><label className="form-label">유예 기간 (일)</label><input type="number" className="form-input" value={policy.graceperiodDays} disabled={!editing} onChange={e => setPolicy({ ...policy, graceperiodDays: parseInt(e.target.value) })} /></div><div className="form-group"><label className="form-label">강제 적용일</label><input type="date" className="form-input" value={policy.enforceAfterDate} disabled={!editing} onChange={e => setPolicy({ ...policy, enforceAfterDate: e.target.value })} /></div></div>
          </div>
        </div>
      )}
      {selectedUser && (
        <div className="modal-overlay active" onClick={() => setSelectedUser(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getMethodIcon(selectedUser.mfaMethod)} {selectedUser.name}</h3><button className="modal-close" onClick={() => setSelectedUser(null)}>×</button></div>
          <div className="modal-body"><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>이메일:</b> {selectedUser.email}</div><div><b>MFA 방식:</b> {getMethodLabel(selectedUser.mfaMethod)}</div><div><b>등록일:</b> {selectedUser.enrolledAt}</div><div><b>마지막 사용:</b> {selectedUser.lastUsed}</div><div><b>백업 코드:</b> {selectedUser.backupCodes}개</div></div></div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleGenerateBackupCodes(selectedUser)}>🔄 백업코드 재생성</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleResetMfa(selectedUser)}>❌ MFA 초기화</button><button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

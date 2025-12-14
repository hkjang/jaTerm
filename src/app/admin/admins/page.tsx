'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AUDITOR';
  mfaEnabled: boolean;
  ipRestriction: string[];
  isActive: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  permissions: string[];
}

const mockAdmins: Admin[] = [
  { 
    id: '1', 
    name: '최고관리자', 
    email: 'super@jaterm.com', 
    role: 'SUPER_ADMIN',
    mfaEnabled: true,
    ipRestriction: ['192.168.1.0/24'],
    isActive: true,
    lastLoginAt: new Date(),
    lastLoginIp: '192.168.1.100',
    permissions: ['*']
  },
  { 
    id: '2', 
    name: '홍길동', 
    email: 'admin@jaterm.com', 
    role: 'ADMIN',
    mfaEnabled: true,
    ipRestriction: ['192.168.1.0/24', '10.0.0.0/8'],
    isActive: true,
    lastLoginAt: new Date(Date.now() - 86400000),
    lastLoginIp: '192.168.1.101',
    permissions: ['users', 'servers', 'policies', 'sessions']
  },
  { 
    id: '3', 
    name: '감사관', 
    email: 'auditor@jaterm.com', 
    role: 'AUDITOR',
    mfaEnabled: true,
    ipRestriction: [],
    isActive: true,
    lastLoginAt: new Date(Date.now() - 172800000),
    lastLoginIp: '192.168.1.102',
    permissions: ['audit.read', 'sessions.read', 'logs.read']
  },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState(mockAdmins);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return { class: 'badge-danger', label: 'Super Admin' };
      case 'ADMIN': return { class: 'badge-warning', label: 'Admin' };
      case 'AUDITOR': return { class: 'badge-info', label: 'Auditor' };
      default: return { class: 'badge-info', label: role };
    }
  };

  return (
    <AdminLayout 
      title="관리자 계정" 
      description="Super Admin, Admin, Auditor 역할 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 관리자 추가
        </button>
      }
    >
      {/* Role Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {['SUPER_ADMIN', 'ADMIN', 'AUDITOR'].map(role => {
          const count = admins.filter(a => a.role === role).length;
          const badge = getRoleBadge(role);
          return (
            <div key={role} className="stat-card">
              <div className="stat-label">{badge.label}</div>
              <div className="stat-value">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Admins Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>관리자</th>
                <th>역할</th>
                <th>MFA</th>
                <th>IP 제한</th>
                <th>권한</th>
                <th>최근 로그인</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => {
                const badge = getRoleBadge(admin.role);
                return (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{admin.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{admin.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${badge.class}`}>{badge.label}</span>
                    </td>
                    <td>
                      {admin.mfaEnabled ? (
                        <span style={{ color: 'var(--color-success)' }}>✓ 필수</span>
                      ) : (
                        <span style={{ color: 'var(--color-danger)' }}>✗ 미설정</span>
                      )}
                    </td>
                    <td>
                      {admin.ipRestriction.length > 0 ? (
                        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                          {admin.ipRestriction[0]}
                          {admin.ipRestriction.length > 1 && (
                            <span style={{ color: 'var(--color-text-muted)' }}> +{admin.ipRestriction.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>제한 없음</span>
                      )}
                    </td>
                    <td>
                      {admin.permissions[0] === '*' ? (
                        <span className="badge badge-danger">전체 권한</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem' }}>{admin.permissions.length}개 권한</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {admin.lastLoginAt ? (
                        <div>
                          <div>{new Date(admin.lastLoginAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {admin.lastLoginIp}
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {admin.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAdmin(admin)}>권한 설정</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>비활성화</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">관리자 추가</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">이름</label>
                <input type="text" className="form-input" placeholder="관리자 이름" />
              </div>
              <div className="form-group">
                <label className="form-label">이메일</label>
                <input type="email" className="form-input" placeholder="admin@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">역할</label>
                <select className="form-input form-select">
                  <option value="ADMIN">Admin</option>
                  <option value="AUDITOR">Auditor</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">IP 제한 (CIDR)</label>
                <input type="text" className="form-input" placeholder="192.168.1.0/24" />
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  여러 IP는 쉼표로 구분
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked />
                  MFA 필수
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn btn-primary">추가</button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {selectedAdmin && (
        <div className="modal-overlay active" onClick={() => setSelectedAdmin(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">권한 설정 - {selectedAdmin.name}</h3>
              <button className="modal-close" onClick={() => setSelectedAdmin(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>기능 단위 권한 (RBAC)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[
                    { key: 'users', label: '사용자 관리' },
                    { key: 'admins', label: '관리자 관리' },
                    { key: 'servers', label: '서버 관리' },
                    { key: 'policies', label: '정책 관리' },
                    { key: 'sessions', label: '세션 관제' },
                    { key: 'sessions.terminate', label: '세션 종료' },
                    { key: 'audit.read', label: '감사 로그 조회' },
                    { key: 'audit.export', label: '감사 로그 내보내기' },
                    { key: 'commands', label: '명령어 통제' },
                    { key: 'approvals', label: '승인 워크플로' },
                    { key: 'alerts', label: '보안 알림' },
                    { key: 'settings', label: '시스템 설정' },
                  ].map(perm => (
                    <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        defaultChecked={selectedAdmin.permissions.includes('*') || selectedAdmin.permissions.includes(perm.key)}
                        disabled={selectedAdmin.role === 'SUPER_ADMIN'}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>API 단위 권한</div>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <code>/api/admin/*</code> - 관리자 API 접근
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAdmin(null)}>취소</button>
              <button className="btn btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

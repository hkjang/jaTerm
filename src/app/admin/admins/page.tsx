'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const user = localStorage.getItem('user');
    if (!user) return {};
    try {
      const { id } = JSON.parse(user);
      return { 'Authorization': `Bearer ${id}` };
    } catch {
      return {};
    }
  };

  const fetchAdmins = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Fetch only admin roles (SUPER, ADMIN)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch admins');
      
      const data = await response.json();
      // Filter for admin roles only
      const adminUsers = data.users.filter((u: Admin) => 
        ['SUPER', 'ADMIN'].includes(u.role)
      );
      setAdmins(adminUsers);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('관리자 목록을 불러오는데 실패했습니다.');
      console.error('Fetch admins error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER': return { class: 'badge-danger', label: 'Super Admin' };
      case 'ADMIN': return { class: 'badge-warning', label: 'Admin' };
      default: return { class: 'badge-info', label: role };
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: admin.id, isActive: !admin.isActive }),
      });
      setSuccess(admin.isActive ? '관리자가 비활성화되었습니다.' : '관리자가 활성화되었습니다.');
      fetchAdmins();
    } catch (err) {
      setError('상태 변경에 실패했습니다.');
    }
  };

  const superCount = admins.filter(a => a.role === 'SUPER').length;
  const adminCount = admins.filter(a => a.role === 'ADMIN').length;

  return (
    <AdminLayout 
      title="관리자 계정" 
      description="Super Admin, Admin 역할 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 관리자 추가
        </button>
      }
    >
      {/* Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Role Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Super Admin</div>
          <div className="stat-value">{superCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admin</div>
          <div className="stat-value">{adminCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 관리자</div>
          <div className="stat-value">{admins.length}</div>
        </div>
      </div>

      {/* Admins Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>관리자</th>
                  <th>역할</th>
                  <th>MFA</th>
                  <th>최근 로그인</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      관리자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  admins.map(admin => {
                    const badge = getRoleBadge(admin.role);
                    return (
                      <tr key={admin.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{admin.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{admin.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${badge.class}`}>{badge.label}</span>
                        </td>
                        <td>
                          {admin.mfaEnabled ? (
                            <span style={{ color: 'var(--color-success)' }}>✓ 활성</span>
                          ) : (
                            <span style={{ color: 'var(--color-warning)' }}>미설정</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {admin.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAdmin(admin)}>권한 설정</button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              style={{ color: admin.isActive ? 'var(--color-danger)' : 'var(--color-success)' }}
                              onClick={() => handleToggleActive(admin)}
                            >
                              {admin.isActive ? '비활성화' : '활성화'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">관리자 추가</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                관리자를 추가하려면 먼저 사용자 관리에서 계정을 생성한 후, 해당 계정의 역할을 ADMIN으로 변경하세요.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>닫기</button>
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
                        defaultChecked={selectedAdmin.role === 'SUPER'}
                        disabled={selectedAdmin.role === 'SUPER'}
                      />
                      {perm.label}
                    </label>
                  ))}
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

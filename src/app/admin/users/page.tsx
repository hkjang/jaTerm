'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER' | 'ADMIN' | 'OPERATOR' | 'DEVELOPER' | 'VIEWER' | 'USER';
  department: string | null;
  mfaEnabled: boolean;
  otpStatus: string;
  isActive: boolean;
  lastLoginAt: string | null;
  sessionCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    department: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const user = localStorage.getItem('user');
    if (!user) return {};
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  };

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess('사용자가 생성되었습니다.');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'USER', department: '' });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '사용자 생성에 실패했습니다.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedUser.id,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          ...(formData.password && { password: formData.password }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess('사용자 정보가 수정되었습니다.');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '사용자 수정에 실패했습니다.');
    }
  };

  const handleLockUser = async (user: User) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      });

      setSuccess(user.isActive ? '사용자가 잠금되었습니다.' : '사용자가 활성화되었습니다.');
      fetchUsers();
    } catch (err) {
      setError('상태 변경에 실패했습니다.');
    }
  };

  const handleResetOTP = async (userId: string) => {
    if (!confirm('정말 이 사용자의 OTP를 초기화하시겠습니까?')) return;

    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          resetOTP: true,
        }),
      });

      setSuccess('OTP가 초기화되었습니다.');
      fetchUsers();
    } catch (err) {
      setError('OTP 초기화에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return;

    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      setSuccess('사용자가 삭제되었습니다.');
      fetchUsers();
    } catch (err) {
      setError('사용자 삭제에 실패했습니다.');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
    });
    setShowEditModal(true);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SUPER': return 'badge-danger';
      case 'ADMIN': return 'badge-danger';
      case 'OPERATOR': return 'badge-warning';
      case 'DEVELOPER': return 'badge-info';
      default: return 'badge-info';
    }
  };

  const getOTPStatusBadge = (status: string) => {
    switch (status) {
      case 'ENABLED': return { color: 'var(--color-success)', text: '✓ 활성' };
      case 'LOCKED': return { color: 'var(--color-danger)', text: '🔒 잠금' };
      case 'RESET_REQUIRED': return { color: 'var(--color-warning)', text: '⚠️ 재설정 필요' };
      default: return { color: 'var(--color-text-muted)', text: '미설정' };
    }
  };

  return (
    <AdminLayout 
      title="사용자 관리" 
      description="계정, 권한, MFA, 태그 설정 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 사용자 추가
        </button>
      }
    >
      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}
          <button 
            onClick={() => setSuccess('')}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >×</button>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="이름 또는 이메일 검색..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <select 
            className="form-input form-select" 
            style={{ width: '150px' }} 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">모든 역할</option>
            <option value="SUPER">Super</option>
            <option value="ADMIN">Admin</option>
            <option value="OPERATOR">Operator</option>
            <option value="DEVELOPER">Developer</option>
            <option value="VIEWER">Viewer</option>
            <option value="USER">User</option>
          </select>
          <select 
            className="form-input form-select" 
            style={{ width: '120px' }} 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">모든 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>역할</th>
                  <th>부서</th>
                  <th>OTP</th>
                  <th>상태</th>
                  <th>최근 로그인</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const otpBadge = getOTPStatusBadge(user.otpStatus);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{user.name || '-'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                      </td>
                      <td>{user.department || '-'}</td>
                      <td>
                        <span style={{ color: otpBadge.color }}>{otpBadge.text}</span>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {user.isActive ? '활성' : '잠금'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(user)}>
                            수정
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleLockUser(user)}>
                            {user.isActive ? '잠금' : '해제'}
                          </button>
                          {user.mfaEnabled && (
                            <button 
                              className="btn btn-ghost btn-sm" 
                              style={{ color: 'var(--color-warning)' }}
                              onClick={() => handleResetOTP(user.id)}
                            >
                              OTP 초기화
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            disabled={pagination.page <= 1}
            onClick={() => fetchUsers(pagination.page - 1)}
          >
            ← 이전
          </button>
          <span style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button 
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchUsers(pagination.page + 1)}
          >
            다음 →
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">사용자 추가</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">이름</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">이메일 *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="user@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">비밀번호 *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">역할</label>
                  <select 
                    className="form-input form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="USER">User</option>
                    <option value="VIEWER">Viewer</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">부서</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="개발팀"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">추가</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay active" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">사용자 수정</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">이메일</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={selectedUser.email}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">이름</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">새 비밀번호 (선택)</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="변경시에만 입력"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">역할</label>
                  <select 
                    className="form-input form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="USER">User</option>
                    <option value="VIEWER">Viewer</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER">Super</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">부서</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

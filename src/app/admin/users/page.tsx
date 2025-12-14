'use client';

import { useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'DEVELOPER' | 'VIEWER';
  department: string;
  mfaEnabled: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
}

const mockUsers: User[] = [
  { id: '1', name: '홍길동', email: 'admin@jaterm.com', role: 'ADMIN', department: '보안팀', mfaEnabled: true, isActive: true, lastLoginAt: new Date() },
  { id: '2', name: '김철수', email: 'operator@jaterm.com', role: 'OPERATOR', department: '운영팀', mfaEnabled: true, isActive: true, lastLoginAt: new Date(Date.now() - 86400000) },
  { id: '3', name: '이영희', email: 'dev@jaterm.com', role: 'DEVELOPER', department: '개발팀', mfaEnabled: false, isActive: true, lastLoginAt: new Date(Date.now() - 172800000) },
  { id: '4', name: '박민수', email: 'viewer@jaterm.com', role: 'VIEWER', department: '감사팀', mfaEnabled: true, isActive: true, lastLoginAt: null },
  { id: '5', name: '정수진', email: 'dev2@jaterm.com', role: 'DEVELOPER', department: '개발팀', mfaEnabled: false, isActive: false, lastLoginAt: new Date(Date.now() - 604800000) },
];

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.includes(searchQuery) || user.email.includes(searchQuery);
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-danger';
      case 'OPERATOR': return 'badge-warning';
      case 'DEVELOPER': return 'badge-info';
      default: return 'badge-info';
    }
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      {/* Sidebar - Same as dashboard */}
      <aside className="sidebar" style={{ position: 'relative', height: '100vh' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="header-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>⌘</div>
          <span style={{ fontWeight: 600 }}>jaTerm Admin</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Overview</div>
            <Link href="/admin" className="sidebar-link"><span className="sidebar-link-icon">📊</span><span>대시보드</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Management</div>
            <Link href="/admin/users" className="sidebar-link active"><span className="sidebar-link-icon">👥</span><span>사용자 관리</span></Link>
            <Link href="/admin/servers" className="sidebar-link"><span className="sidebar-link-icon">🖥️</span><span>서버 관리</span></Link>
            <Link href="/admin/policies" className="sidebar-link"><span className="sidebar-link-icon">📋</span><span>정책 관리</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Monitoring</div>
            <Link href="/admin/sessions" className="sidebar-link"><span className="sidebar-link-icon">📺</span><span>세션 관제</span></Link>
            <Link href="/admin/audit" className="sidebar-link"><span className="sidebar-link-icon">📝</span><span>감사 로그</span></Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>사용자 관리</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>계정, 권한, MFA 설정 관리</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 사용자 추가
          </button>
        </div>

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
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>역할</th>
                  <th>부서</th>
                  <th>MFA</th>
                  <th>상태</th>
                  <th>최근 로그인</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                    </td>
                    <td>{user.department}</td>
                    <td>
                      {user.mfaEnabled ? (
                        <span style={{ color: 'var(--color-success)' }}>✓ 활성</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>미설정</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm">수정</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showModal && (
          <div className="modal-overlay active" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">사용자 추가</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">이름</label>
                  <input type="text" className="form-input" placeholder="홍길동" />
                </div>
                <div className="form-group">
                  <label className="form-label">이메일</label>
                  <input type="email" className="form-input" placeholder="user@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">역할</label>
                  <select className="form-input form-select">
                    <option value="DEVELOPER">Developer</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">부서</label>
                  <input type="text" className="form-input" placeholder="개발팀" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button className="btn btn-primary">추가</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

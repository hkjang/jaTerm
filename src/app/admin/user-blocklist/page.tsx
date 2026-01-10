'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface BlockedUser {
  id: string;
  user: { id: string; name: string; email: string; role: string };
  server?: { id: string; name: string; environment: string };
  reason: string;
  blockedAt: string;
  blockedBy: { name: string; email: string };
  expiresAt?: string;
  isGlobal: boolean;
}

export default function UserBlocklistPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'global' | 'server'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Add form state
  const [blockUserId, setBlockUserId] = useState('');
  const [blockServerId, setBlockServerId] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('');
  const [isGlobalBlock, setIsGlobalBlock] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const user = localStorage.getItem('user');
    if (!user) return {};
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  };

  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data
      const mockData: BlockedUser[] = [
        {
          id: '1',
          user: { id: 'u1', name: '차단됨1', email: 'blocked1@example.com', role: 'DEVELOPER' },
          reason: '비인가 접근 시도',
          blockedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          blockedBy: { name: '관리자', email: 'admin@example.com' },
          isGlobal: true,
        },
        {
          id: '2',
          user: { id: 'u2', name: '차단됨2', email: 'blocked2@example.com', role: 'VIEWER' },
          server: { id: 's1', name: 'prod-web-01', environment: 'PROD' },
          reason: '보안 정책 위반 - 민감 데이터 접근',
          blockedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          blockedBy: { name: '관리자', email: 'admin@example.com' },
          expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
          isGlobal: false,
        },
        {
          id: '3',
          user: { id: 'u3', name: '임시차단', email: 'temp@example.com', role: 'OPERATOR' },
          server: { id: 's2', name: 'prod-db-01', environment: 'PROD' },
          reason: '유지보수 기간 동안 접근 제한',
          blockedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          blockedBy: { name: '운영자', email: 'ops@example.com' },
          expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
          isGlobal: false,
        },
      ];

      let filtered = mockData;
      if (filterType === 'global') filtered = mockData.filter(b => b.isGlobal);
      if (filterType === 'server') filtered = mockData.filter(b => !b.isGlobal);

      setBlockedUsers(filtered);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUnblock = (blocked: BlockedUser) => {
    if (!confirm(`${blocked.user.name}의 차단을 해제하시겠습니까?`)) return;
    setBlockedUsers(blockedUsers.filter(b => b.id !== blocked.id));
    setMessage({ type: 'success', text: `${blocked.user.name}의 차단이 해제되었습니다.` });
  };

  const handleAddBlock = () => {
    if (!blockUserId || !blockReason) return;
    setMessage({ type: 'success', text: '사용자가 차단 목록에 추가되었습니다.' });
    setShowAddModal(false);
    resetForm();
    fetchBlockedUsers();
  };

  const resetForm = () => {
    setBlockUserId('');
    setBlockServerId('');
    setBlockReason('');
    setBlockDuration('');
    setIsGlobalBlock(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#ef4444';
      case 'OPERATOR': return '#f59e0b';
      case 'DEVELOPER': return '#3b82f6';
      case 'VIEWER': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getRemainingDays = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  const globalCount = blockedUsers.filter(b => b.isGlobal).length;
  const serverCount = blockedUsers.filter(b => !b.isGlobal).length;

  return (
    <AdminLayout 
      title="사용자 차단 관리" 
      description="접근 제한 사용자 목록 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 차단 추가
        </button>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: filterType === 'all' ? '3px solid var(--color-primary)' : 'none' }} onClick={() => setFilterType('all')}>
          <div className="stat-label">전체 차단</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{blockedUsers.length}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: filterType === 'global' ? '3px solid var(--color-primary)' : 'none' }} onClick={() => setFilterType('global')}>
          <div className="stat-label">전역 차단</div>
          <div className="stat-value">{globalCount}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: filterType === 'server' ? '3px solid var(--color-primary)' : 'none' }} onClick={() => setFilterType('server')}>
          <div className="stat-label">서버별 차단</div>
          <div className="stat-value">{serverCount}</div>
        </div>
      </div>

      {/* Blocked Users List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          차단된 사용자가 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>차단 범위</th>
                  <th>사유</th>
                  <th>차단일</th>
                  <th>만료</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {blockedUsers.map(blocked => (
                  <tr key={blocked.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ef444430', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}>
                          🚫
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{blocked.user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{blocked.user.email}</div>
                        </div>
                        <span style={{ padding: '2px 6px', background: getRoleColor(blocked.user.role) + '20', color: getRoleColor(blocked.user.role), borderRadius: '4px', fontSize: '0.65rem' }}>
                          {blocked.user.role}
                        </span>
                      </div>
                    </td>
                    <td>
                      {blocked.isGlobal ? (
                        <span className="badge badge-danger">🌐 전역 차단</span>
                      ) : blocked.server ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ padding: '2px 6px', background: getEnvColor(blocked.server.environment) + '20', color: getEnvColor(blocked.server.environment), borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {blocked.server.environment}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>{blocked.server.name}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={blocked.reason}>
                        {blocked.reason}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(blocked.blockedAt)}
                    </td>
                    <td>
                      {blocked.expiresAt ? (
                        <span style={{ color: getRemainingDays(blocked.expiresAt) <= 3 ? '#f59e0b' : 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {getRemainingDays(blocked.expiresAt)}일 후
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>영구</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-success)' }} onClick={() => handleUnblock(blocked)}>
                        🔓 해제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚫 사용자 차단 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">차단할 사용자</label>
                <select className="form-input form-select" value={blockUserId} onChange={(e) => setBlockUserId(e.target.value)}>
                  <option value="">사용자를 선택하세요</option>
                  <option value="u1">김개발 (dev@example.com)</option>
                  <option value="u2">박운영 (ops@example.com)</option>
                  <option value="u3">이뷰어 (viewer@example.com)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isGlobalBlock} onChange={(e) => setIsGlobalBlock(e.target.checked)} />
                  <span>전역 차단 (모든 서버 접근 금지)</span>
                </label>
              </div>

              {!isGlobalBlock && (
                <div className="form-group">
                  <label className="form-label">대상 서버</label>
                  <select className="form-input form-select" value={blockServerId} onChange={(e) => setBlockServerId(e.target.value)}>
                    <option value="">서버를 선택하세요</option>
                    <option value="s1">prod-web-01 (PROD)</option>
                    <option value="s2">prod-db-01 (PROD)</option>
                    <option value="s3">stage-web-01 (STAGE)</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">차단 사유</label>
                <textarea 
                  className="form-input" 
                  placeholder="차단 사유를 입력하세요..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">차단 기간</label>
                <select className="form-input form-select" value={blockDuration} onChange={(e) => setBlockDuration(e.target.value)}>
                  <option value="">영구 차단</option>
                  <option value="1d">1일</option>
                  <option value="7d">7일</option>
                  <option value="30d">30일</option>
                  <option value="90d">90일</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>취소</button>
              <button className="btn btn-danger" onClick={handleAddBlock} disabled={!blockUserId || !blockReason}>
                🚫 차단 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

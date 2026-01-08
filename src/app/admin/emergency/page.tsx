'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EmergencyAccess {
  id: string;
  requester: { id: string; name: string; email: string; role: string };
  server: { id: string; name: string; hostname: string; environment: string };
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedAt: string;
  grantedBy: { name: string; email: string };
  expiresAt: string;
  revokedAt?: string;
  revokedBy?: string;
  commandsExecuted: number;
  commandLogs?: { command: string; executedAt: string; blocked: boolean }[];
}

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EmergencyPage() {
  const [accesses, setAccesses] = useState<EmergencyAccess[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<EmergencyAccess | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  // Grant form
  const [grantForm, setGrantForm] = useState({
    userId: '',
    serverId: '',
    reason: '',
    durationMinutes: 60,
  });

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

  const fetchAccesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/emergency', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAccesses(data.accesses || []);
      setError('');
    } catch (err) {
      setError('긴급 접근 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/servers?limit=100', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers || []);
      }
    } catch (err) {
      console.error('Fetch servers error:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAccesses();
    fetchServers();
    fetchUsers();
  }, [fetchAccesses, fetchServers, fetchUsers]);

  const handleGrant = async () => {
    if (!grantForm.userId || !grantForm.serverId || !grantForm.reason) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setGrantLoading(true);
    try {
      const response = await fetch('/api/admin/emergency', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(grantForm),
      });

      if (!response.ok) throw new Error('Grant failed');

      setSuccess('긴급 접근이 부여되었습니다.');
      setShowGrantModal(false);
      setGrantForm({ userId: '', serverId: '', reason: '', durationMinutes: 60 });
      fetchAccesses();
    } catch (err) {
      setError('긴급 접근 부여에 실패했습니다.');
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('정말 이 긴급 접근을 즉시 취소하시겠습니까?')) return;

    try {
      await fetch('/api/admin/emergency', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'revoke' }),
      });
      setSuccess('긴급 접근이 취소되었습니다.');
      fetchAccesses();
    } catch (err) {
      setError('취소에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { class: 'badge-success', label: '활성' };
      case 'EXPIRED': return { class: 'badge-warning', label: '만료' };
      case 'REVOKED': return { class: 'badge-danger', label: '취소됨' };
      default: return { class: 'badge-info', label: status };
    }
  };

  const getEnvBadge = (env: string) => {
    switch (env) {
      case 'PROD': return 'badge-danger';
      case 'STAGE': return 'badge-warning';
      default: return 'badge-success';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    return `${Math.floor(minutes / 60)}시간 ${minutes % 60 > 0 ? `${minutes % 60}분` : ''}`;
  };

  const getRemainingTime = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return '만료됨';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 남음`;
    return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분 남음`;
  };

  const activeCount = accesses.filter(a => a.status === 'ACTIVE').length;
  const expiredCount = accesses.filter(a => a.status === 'EXPIRED').length;
  const revokedCount = accesses.filter(a => a.status === 'REVOKED').length;
  const totalCommands = accesses.reduce((sum, a) => sum + a.commandsExecuted, 0);

  return (
    <AdminLayout
      title="긴급 접근 (Break Glass)"
      description="긴급 상황 시 임시 접근 권한 부여 및 관리"
      actions={<button className="btn btn-danger" onClick={() => setShowGrantModal(true)}>🚨 긴급 접근 부여</button>}
    >
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

      {activeCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>현재 {activeCount}건의 긴급 접근이 활성 상태입니다</div>
            <div style={{ fontSize: '0.85rem' }}>모든 활동이 실시간으로 모니터링 및 기록됩니다</div>
          </div>
          <button className="btn btn-ghost" onClick={fetchAccesses}>🔄 새로고침</button>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">활성 긴급 접근</div>
          <div className="stat-value" style={{ color: activeCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 기록</div>
          <div className="stat-value">{accesses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">만료/취소</div>
          <div className="stat-value">{expiredCount + revokedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 실행 명령</div>
          <div className="stat-value">{totalCommands}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : accesses.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          긴급 접근 기록이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {accesses.map(access => {
            const statusBadge = getStatusBadge(access.status);
            return (
              <div 
                key={access.id} 
                className="card" 
                style={{ 
                  padding: '20px', 
                  borderLeft: access.status === 'ACTIVE' ? '4px solid var(--color-danger)' : undefined,
                  background: access.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.02)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                      <span className={`badge ${getEnvBadge(access.server.environment)}`}>{access.server.environment}</span>
                      <span style={{ fontWeight: 600 }}>{access.server.name}</span>
                      {access.status === 'ACTIVE' && (
                        <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>
                          ⏱ {getRemainingTime(access.expiresAt)}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사유</div>
                      <div style={{ fontWeight: 500 }}>{access.reason}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>요청자</div>
                        <div style={{ fontWeight: 500 }}>{access.requester.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{access.requester.role}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>부여자</div>
                        <div style={{ fontWeight: 500 }}>{access.grantedBy?.name || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>시작 시간</div>
                        <div style={{ fontWeight: 500 }}>{new Date(access.grantedAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>만료 시간</div>
                        <div style={{ fontWeight: 500 }}>{new Date(access.expiresAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>실행 명령</div>
                        <div style={{ fontWeight: 500, fontSize: '1.25rem', color: access.commandsExecuted > 0 ? 'var(--color-info)' : undefined }}>
                          {access.commandsExecuted}개
                        </div>
                      </div>
                    </div>

                    {access.revokedBy && (
                      <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--color-danger)' }}>🚫 취소됨</span>
                        <span style={{ marginLeft: '8px', color: 'var(--color-text-muted)' }}>
                          {access.revokedBy} ({access.revokedAt ? new Date(access.revokedAt).toLocaleString() : ''})
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => { setSelectedAccess(access); setShowDetailModal(true); }}
                    >
                      📋 상세
                    </button>
                    {access.status === 'ACTIVE' && (
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleRevoke(access.id)}
                      >
                        🛑 즉시 취소
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grant Emergency Access Modal */}
      {showGrantModal && (
        <div className="modal-overlay active" onClick={() => setShowGrantModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚨 긴급 접근 부여</h3>
              <button className="modal-close" onClick={() => setShowGrantModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>주의</div>
                    <div style={{ fontSize: '0.85rem' }}>
                      긴급 접근은 모든 정책을 우회합니다. 모든 활동이 기록되며 감사 대상이 됩니다.
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">대상 사용자 *</label>
                <select 
                  className="form-input form-select"
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                >
                  <option value="">사용자 선택</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">대상 서버 *</label>
                <select 
                  className="form-input form-select"
                  value={grantForm.serverId}
                  onChange={(e) => setGrantForm({ ...grantForm, serverId: e.target.value })}
                >
                  <option value="">서버 선택</option>
                  {servers.map(server => (
                    <option key={server.id} value={server.id}>
                      [{server.environment}] {server.name} ({server.hostname})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">긴급 접근 사유 *</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="긴급 접근이 필요한 상세 사유를 입력하세요..."
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">접근 유효 시간</label>
                <select 
                  className="form-input form-select"
                  value={grantForm.durationMinutes}
                  onChange={(e) => setGrantForm({ ...grantForm, durationMinutes: parseInt(e.target.value) })}
                >
                  <option value="15">15분</option>
                  <option value="30">30분</option>
                  <option value="60">1시간</option>
                  <option value="120">2시간</option>
                  <option value="240">4시간</option>
                </select>
              </div>

              {grantForm.userId && grantForm.serverId && (
                <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginTop: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>미리보기</div>
                  <div style={{ marginTop: '8px' }}>
                    <strong>{users.find(u => u.id === grantForm.userId)?.name}</strong>
                    님에게{' '}
                    <strong>{servers.find(s => s.id === grantForm.serverId)?.name}</strong>
                    서버에 대한{' '}
                    <strong>{formatDuration(grantForm.durationMinutes)}</strong>
                    동안의 긴급 접근 권한이 부여됩니다.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGrantModal(false)}>취소</button>
              <button 
                className="btn btn-danger"
                onClick={handleGrant}
                disabled={grantLoading || !grantForm.userId || !grantForm.serverId || !grantForm.reason}
              >
                {grantLoading ? '처리 중...' : '🚨 긴급 접근 부여'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAccess && (
        <div className="modal-overlay active" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">긴급 접근 상세</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>요청자</div>
                  <div style={{ fontWeight: 500 }}>{selectedAccess.requester.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedAccess.requester.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>대상 서버</div>
                  <div style={{ fontWeight: 500 }}>{selectedAccess.server.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{selectedAccess.server.hostname}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사유</div>
                <div style={{ fontWeight: 500, padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginTop: '4px' }}>
                  {selectedAccess.reason}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-label">상태</div>
                  <span className={`badge ${getStatusBadge(selectedAccess.status).class}`}>
                    {getStatusBadge(selectedAccess.status).label}
                  </span>
                </div>
                <div className="stat-card">
                  <div className="stat-label">실행 명령</div>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>{selectedAccess.commandsExecuted}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">유효 시간</div>
                  <div className="stat-value" style={{ fontSize: '1rem' }}>
                    {selectedAccess.status === 'ACTIVE' ? getRemainingTime(selectedAccess.expiresAt) : '종료됨'}
                  </div>
                </div>
              </div>

              {selectedAccess.commandLogs && selectedAccess.commandLogs.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>명령 실행 로그</div>
                  <div style={{ 
                    background: 'var(--terminal-bg)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '12px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem'
                  }}>
                    {selectedAccess.commandLogs.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          [{new Date(log.executedAt).toLocaleTimeString()}]
                        </span>{' '}
                        <span style={{ color: log.blocked ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {log.blocked ? '✗' : '$'}
                        </span>{' '}
                        {log.command}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>닫기</button>
              {selectedAccess.status === 'ACTIVE' && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => { handleRevoke(selectedAccess.id); setShowDetailModal(false); }}
                >
                  🛑 즉시 취소
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

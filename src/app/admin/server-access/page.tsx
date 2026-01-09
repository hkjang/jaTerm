'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

interface Server {
  id: string;
  name: string;
  hostname: string;
  port: number;
  environment: 'PROD' | 'STAGE' | 'DEV';
  isActive: boolean;
  tags: string[];
  description: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  sessionCount?: number;
  lastAccess?: string;
}

interface Session {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  user: { id: string; name: string; email: string; role: string };
}

interface Policy {
  id: string;
  name: string;
  allowedRoles: string[];
  commandMode: string;
  requireApproval: boolean;
  priority: number;
}

interface ServerWithAccess {
  id: string;
  name: string;
  hostname: string;
  environment: string;
  isActive: boolean;
  totalSessions: number;
  activeSessions: number;
}

export default function ServerAccessPage() {
  const searchParams = useSearchParams();
  const [servers, setServers] = useState<ServerWithAccess[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [accessedUsers, setAccessedUsers] = useState<User[]>([]);
  const [appliedPolicies, setAppliedPolicies] = useState<Policy[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'users' | 'sessions' | 'policies' | 'settings'>('users');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // IP Whitelist state
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const user = localStorage.getItem('user');
    if (!user) return {};
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  };

  const fetchServers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/servers/access', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers || []);
      }
    } catch (err) {
      console.error('Failed to fetch servers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServerDetail = useCallback(async (serverId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/access?serverId=${serverId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedServer(data.server);
        setRecentSessions(data.recentSessions || []);
        setAccessedUsers(data.accessedUsers || []);
        setAppliedPolicies(data.appliedPolicies || []);
      }
    } catch (err) {
      console.error('Failed to fetch server detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    fetchServers();
    fetchUsers();
  }, [fetchServers, fetchUsers]);

  useEffect(() => {
    const serverId = searchParams.get('id');
    if (serverId) {
      fetchServerDetail(serverId);
    }
  }, [searchParams, fetchServerDetail]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleGrantAccess = async () => {
    if (!selectedServer || !grantUserId) return;
    
    try {
      const response = await fetch('/api/admin/servers/access', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: selectedServer.id, userId: grantUserId }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setShowGrantModal(false);
        setGrantUserId('');
        fetchServerDetail(selectedServer.id);
      } else {
        setMessage({ type: 'error', text: result.error || '권한 부여 실패' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '권한 부여 실패' });
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!selectedServer || !confirm('이 사용자의 접근 권한을 취소하시겠습니까?')) return;

    try {
      const response = await fetch('/api/admin/servers/access', {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: selectedServer.id, userId, reason: 'Admin revocation' }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: '접근 권한이 취소되었습니다.' });
        fetchServerDetail(selectedServer.id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: '권한 취소 실패' });
    }
  };

  const handleAddIp = () => {
    if (newIp && !ipWhitelist.includes(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp('');
      setMessage({ type: 'success', text: 'IP가 화이트리스트에 추가되었습니다.' });
    }
  };

  const handleRemoveIp = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter(i => i !== ip));
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AdminLayout 
      title="서버 접근 관리" 
      description="서버별 접근 권한 및 사용자 관리"
    >
      {/* Messages */}
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        {/* Server List */}
        <div className="card" style={{ padding: '16px', height: 'fit-content', maxHeight: '80vh', overflow: 'auto' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>🖥️ 서버 목록</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="spinner" style={{ width: '24px', height: '24px' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {servers.map(server => (
                <div
                  key={server.id}
                  onClick={() => fetchServerDetail(server.id)}
                  style={{
                    padding: '12px',
                    background: selectedServer?.id === server.id ? 'var(--color-primary)' : 'var(--color-surface)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: `3px solid ${getEnvColor(server.environment)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: selectedServer?.id === server.id ? 'white' : 'inherit' }}>
                        {server.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: selectedServer?.id === server.id ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {server.hostname}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ padding: '2px 6px', background: getEnvColor(server.environment) + '20', color: getEnvColor(server.environment), borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                        {server.environment}
                      </span>
                      {server.activeSessions > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '4px' }}>
                          🟢 {server.activeSessions} 활성
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {servers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                  서버 없음
                </div>
              )}
            </div>
          )}
        </div>

        {/* Server Detail */}
        <div>
          {!selectedServer ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👈</div>
              <div style={{ color: 'var(--color-text-muted)' }}>
                왼쪽에서 서버를 선택하세요
              </div>
            </div>
          ) : detailLoading ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
            </div>
          ) : (
            <>
              {/* Server Header */}
              <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>{selectedServer.name}</h2>
                      <span style={{ padding: '4px 10px', background: getEnvColor(selectedServer.environment) + '20', color: getEnvColor(selectedServer.environment), borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {selectedServer.environment}
                      </span>
                      <span className={`badge ${selectedServer.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {selectedServer.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                      {selectedServer.hostname}:{selectedServer.port}
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowGrantModal(true)}>
                    ➕ 접근 권한 부여
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                {[
                  { id: 'users', label: '👥 접근 사용자' },
                  { id: 'sessions', label: '📋 세션 이력' },
                  { id: 'policies', label: '📜 적용 정책' },
                  { id: 'settings', label: '⚙️ 접근 설정' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`btn btn-sm ${selectedTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                    style={{ padding: '8px 16px' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="card" style={{ padding: '20px' }}>
                {selectedTab === 'users' && (
                  <>
                    <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>접근한 사용자 ({accessedUsers.length})</h3>
                    {accessedUsers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        아직 접근 기록이 없습니다
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>사용자</th>
                              <th>역할</th>
                              <th>세션 수</th>
                              <th>마지막 접근</th>
                              <th>작업</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accessedUsers.map(user => (
                              <tr key={user.id}>
                                <td>
                                  <div style={{ fontWeight: 500 }}>{user.name || '알 수 없음'}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                                </td>
                                <td>
                                  <span style={{ padding: '2px 8px', background: getRoleColor(user.role) + '20', color: getRoleColor(user.role), borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {user.role}
                                  </span>
                                </td>
                                <td>{user.sessionCount || 0}</td>
                                <td style={{ fontSize: '0.85rem' }}>{user.lastAccess ? formatTime(user.lastAccess) : '-'}</td>
                                <td>
                                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRevokeAccess(user.id)}>
                                    🚫 차단
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {selectedTab === 'sessions' && (
                  <>
                    <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>최근 세션 이력</h3>
                    {recentSessions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        세션 기록이 없습니다
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recentSessions.map(session => (
                          <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-surface)', borderRadius: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: session.status === 'ACTIVE' ? '#10b981' : '#6b7280' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{session.user.name || session.user.email}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {formatTime(session.startedAt)} {session.endedAt ? `~ ${formatTime(session.endedAt)}` : '(진행 중)'}
                              </div>
                            </div>
                            <span style={{ padding: '2px 8px', background: getRoleColor(session.user.role) + '20', color: getRoleColor(session.user.role), borderRadius: '4px', fontSize: '0.7rem' }}>
                              {session.user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {selectedTab === 'policies' && (
                  <>
                    <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>적용된 정책</h3>
                    {appliedPolicies.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        적용된 정책이 없습니다
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {appliedPolicies.map(policy => (
                          <div key={policy.id} style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ fontWeight: 600 }}>{policy.name}</div>
                              <span className="badge badge-info">우선순위: {policy.priority}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="badge">명령어: {policy.commandMode}</span>
                              {policy.requireApproval && <span className="badge badge-warning">승인 필요</span>}
                              {policy.allowedRoles?.map((role: string) => (
                                <span key={role} style={{ padding: '2px 6px', background: getRoleColor(role) + '20', color: getRoleColor(role), borderRadius: '4px', fontSize: '0.7rem' }}>
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {selectedTab === 'settings' && (
                  <>
                    <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>접근 설정</h3>
                    
                    {/* IP Whitelist */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>🌐 IP 화이트리스트</h4>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="IP 주소 (예: 192.168.1.0/24)"
                          value={newIp}
                          onChange={(e) => setNewIp(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={handleAddIp}>추가</button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ipWhitelist.map(ip => (
                          <span key={ip} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--color-surface)', borderRadius: '6px', fontSize: '0.85rem' }}>
                            {ip}
                            <button onClick={() => handleRemoveIp(ip)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>×</button>
                          </span>
                        ))}
                        {ipWhitelist.length === 0 && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            모든 IP에서 접근 가능 (화이트리스트 비활성)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Access Settings */}
                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>⚙️ 기타 설정</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked />
                          <span>MFA 필수</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked />
                          <span>세션 녹화</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" />
                          <span>승인 후 접근 (PROD 환경 권장)</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && selectedServer && (
        <div className="modal-overlay active" onClick={() => setShowGrantModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ 접근 권한 부여</h3>
              <button className="modal-close" onClick={() => setShowGrantModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">서버</label>
                <div style={{ padding: '10px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                  {selectedServer.name} ({selectedServer.hostname})
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">사용자 선택</label>
                <select className="form-input form-select" value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)}>
                  <option value="">사용자를 선택하세요</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGrantModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleGrantAccess} disabled={!grantUserId}>
                권한 부여
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

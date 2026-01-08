'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionServer {
  id: string;
  name: string;
  hostname: string;
  environment: string;
}

interface CommandLog {
  id: string;
  command: string;
  executedAt: string;
  blocked: boolean;
  blockReason?: string;
}

interface Session {
  id: string;
  user: SessionUser;
  server: SessionServer;
  status: 'CONNECTING' | 'ACTIVE' | 'DISCONNECTED' | 'TERMINATED' | 'ERROR';
  startedAt: string;
  endedAt: string | null;
  commandCount: number;
  blockedCount: number;
  recentCommands?: CommandLog[];
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showCommandsModal, setShowCommandsModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      if (envFilter) params.set('environment', envFilter);

      const response = await fetch(`/api/admin/sessions?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.sessions || []);
      setLastRefresh(new Date());
      if (loading) setLoading(false);
    } catch (err) {
      if (loading) {
        setError('세션 목록을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    }
  }, [statusFilter, envFilter, loading]);

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, envFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchSessions, autoRefresh, refreshInterval]);

  const handleTerminate = async (sessionId: string) => {
    if (!confirm('정말 이 세션을 강제 종료하시겠습니까?')) return;

    try {
      await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, reason: 'Admin termination' }),
      });

      setSuccess('세션이 종료되었습니다.');
      setSelectedSession(null);
      fetchSessions();
    } catch (err) {
      setError('세션 종료에 실패했습니다.');
    }
  };

  const handleAddComment = async () => {
    if (!selectedSession || !commentText.trim()) return;

    try {
      await fetch('/api/admin/sessions', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSession.id,
          action: 'add_comment',
          content: commentText,
        }),
      });

      setSuccess('주석이 추가되었습니다.');
      setShowCommentModal(false);
      setCommentText('');
    } catch (err) {
      setError('주석 추가에 실패했습니다.');
    }
  };

  const formatDuration = (startedAt: string, endedAt?: string | null) => {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { class: 'badge-success', label: '활성', icon: '●' };
      case 'TERMINATED': return { class: 'badge-danger', label: '강제종료', icon: '✗' };
      case 'DISCONNECTED': return { class: 'badge-info', label: '종료됨', icon: '○' };
      case 'ERROR': return { class: 'badge-danger', label: '오류', icon: '!' };
      case 'CONNECTING': return { class: 'badge-warning', label: '연결중', icon: '...' };
      default: return { class: 'badge-info', label: status, icon: '' };
    }
  };

  // Stats
  const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
  const totalCommands = sessions.reduce((a, s) => a + s.commandCount, 0);
  const blockedCommands = sessions.reduce((a, s) => a + s.blockedCount, 0);
  const prodSessions = sessions.filter(s => s.server.environment === 'PROD' && s.status === 'ACTIVE');

  // Group by environment
  const sessionsByEnv = {
    PROD: sessions.filter(s => s.server.environment === 'PROD'),
    STAGE: sessions.filter(s => s.server.environment === 'STAGE'),
    DEV: sessions.filter(s => s.server.environment === 'DEV'),
  };

  return (
    <AdminLayout 
      title="세션 관제" 
      description="실시간 터미널 세션 모니터링 및 관제"
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 새로고침
          </label>
          {autoRefresh && (
            <select 
              className="form-input form-select" 
              style={{ width: '80px', padding: '4px 8px' }}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            >
              <option value="5">5초</option>
              <option value="15">15초</option>
              <option value="30">30초</option>
              <option value="60">1분</option>
            </select>
          )}
          <button className="btn btn-ghost btn-sm" onClick={fetchSessions}>
            🔄 새로고침
          </button>
        </div>
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

      {/* Production Alert */}
      {prodSessions.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔴</span>
          <div>
            <strong>{prodSessions.length}개</strong>의 운영 환경 세션이 활성 상태입니다.
          </div>
        </div>
      )}

      {/* Blocked Commands Alert */}
      {blockedCommands > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            오늘 <strong>{blockedCommands}개</strong>의 명령이 정책에 의해 차단되었습니다.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">활성 세션</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{activeSessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">오늘 총 세션</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 명령 실행</div>
          <div className="stat-value">{totalCommands}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">차단된 명령</div>
          <div className="stat-value" style={{ color: blockedCommands > 0 ? 'var(--color-danger)' : undefined }}>{blockedCommands}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">마지막 갱신</div>
          <div style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
            {lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            className="form-input form-select" 
            style={{ width: '150px' }} 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">모든 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="DISCONNECTED">종료됨</option>
            <option value="TERMINATED">강제종료</option>
          </select>
          <select 
            className="form-input form-select" 
            style={{ width: '150px' }} 
            value={envFilter} 
            onChange={(e) => setEnvFilter(e.target.value)}
          >
            <option value="">모든 환경</option>
            <option value="PROD">PROD</option>
            <option value="STAGE">STAGE</option>
            <option value="DEV">DEV</option>
          </select>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            {['PROD', 'STAGE', 'DEV'].map(env => (
              <span 
                key={env}
                className="badge"
                style={{ 
                  background: `${getEnvColor(env)}20`, 
                  color: getEnvColor(env),
                  padding: '4px 8px',
                }}
              >
                {env}: {sessionsByEnv[env as 'PROD' | 'STAGE' | 'DEV'].filter(s => s.status === 'ACTIVE').length}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            세션이 없습니다.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>서버</th>
                  <th>상태</th>
                  <th>시작 시간</th>
                  <th>지속 시간</th>
                  <th>명령</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => {
                  const statusBadge = getStatusBadge(session.status);
                  return (
                    <tr 
                      key={session.id}
                      style={{
                        background: session.status === 'ACTIVE' && session.server.environment === 'PROD' 
                          ? 'rgba(239, 68, 68, 0.03)' 
                          : undefined,
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 500 }}>{session.user.name || session.user.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {session.user.email}
                          <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>{session.user.role}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '0.65rem', 
                            fontWeight: 600, 
                            background: getEnvColor(session.server.environment) + '20', 
                            color: getEnvColor(session.server.environment) 
                          }}>
                            {session.server.environment}
                          </span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{session.server.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {session.server.hostname}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.class}`}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(session.startedAt).toLocaleTimeString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {formatDuration(session.startedAt, session.endedAt)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{session.commandCount}</span>
                        {session.blockedCount > 0 && (
                          <span style={{ color: 'var(--color-danger)', marginLeft: '8px', fontWeight: 500 }}>
                            ({session.blockedCount} 차단)
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => { setSelectedSession(session); setShowCommandsModal(true); }}
                          >
                            📋 로그
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => setSelectedSession(session)}
                          >
                            👁️ 상세
                          </button>
                          {session.status === 'ACTIVE' && (
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleTerminate(session.id)}
                            >
                              종료
                            </button>
                          )}
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

      {/* Session Detail Modal */}
      {selectedSession && !showCommandsModal && !showCommentModal && (
        <div className="modal-overlay active" onClick={() => setSelectedSession(null)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">세션 상세 - {selectedSession.user.name || selectedSession.user.email}</h3>
              <button className="modal-close" onClick={() => setSelectedSession(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사용자</div>
                  <div style={{ fontWeight: 500 }}>{selectedSession.user.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedSession.user.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>서버</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${selectedSession.server.environment === 'PROD' ? 'badge-danger' : selectedSession.server.environment === 'STAGE' ? 'badge-warning' : 'badge-success'}`}>
                      {selectedSession.server.environment}
                    </span>
                    <span style={{ fontWeight: 500 }}>{selectedSession.server.name}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedSession.server.hostname}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-label">상태</div>
                  <span className={`badge ${getStatusBadge(selectedSession.status).class}`}>{getStatusBadge(selectedSession.status).label}</span>
                </div>
                <div className="stat-card">
                  <div className="stat-label">지속 시간</div>
                  <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatDuration(selectedSession.startedAt, selectedSession.endedAt)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">실행 명령</div>
                  <div className="stat-value" style={{ fontSize: '1.25rem' }}>{selectedSession.commandCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">차단 명령</div>
                  <div className="stat-value" style={{ fontSize: '1.25rem', color: selectedSession.blockedCount > 0 ? 'var(--color-danger)' : undefined }}>
                    {selectedSession.blockedCount}
                  </div>
                </div>
              </div>

              <div style={{ 
                background: 'var(--terminal-bg)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.85rem', 
                maxHeight: '200px', 
                overflow: 'auto' 
              }}>
                <div style={{ color: 'var(--color-text-muted)' }}># 세션 정보</div>
                <div style={{ marginTop: '8px' }}><span style={{ color: 'var(--color-success)' }}>$</span> 세션 시작: {new Date(selectedSession.startedAt).toLocaleString()}</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> 지속 시간: {formatDuration(selectedSession.startedAt, selectedSession.endedAt)}</div>
                {selectedSession.endedAt && (
                  <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-warning)' }}>$</span> 세션 종료: {new Date(selectedSession.endedAt).toLocaleString()}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-ghost"
                onClick={() => { setShowCommandsModal(true); }}
              >
                📋 명령 로그
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => { setShowCommentModal(true); }}
              >
                📝 주석 추가
              </button>
              {selectedSession.status === 'ACTIVE' && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => { handleTerminate(selectedSession.id); setSelectedSession(null); }}
                >
                  세션 강제 종료
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Commands Log Modal */}
      {showCommandsModal && selectedSession && (
        <div className="modal-overlay active" onClick={() => setShowCommandsModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">명령 실행 로그</h3>
              <button className="modal-close" onClick={() => setShowCommandsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                <strong>{selectedSession.user.name}</strong> @ <strong>{selectedSession.server.name}</strong>
              </div>
              <div style={{ 
                background: 'var(--terminal-bg)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.85rem', 
                maxHeight: '400px', 
                overflow: 'auto' 
              }}>
                {selectedSession.recentCommands && selectedSession.recentCommands.length > 0 ? (
                  selectedSession.recentCommands.map((cmd, idx) => (
                    <div key={idx} style={{ marginBottom: '6px' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        [{new Date(cmd.executedAt).toLocaleTimeString()}]
                      </span>{' '}
                      <span style={{ color: cmd.blocked ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {cmd.blocked ? '✗' : '$'}
                      </span>{' '}
                      <span style={{ color: cmd.blocked ? 'var(--color-danger)' : undefined }}>{cmd.command}</span>
                      {cmd.blocked && cmd.blockReason && (
                        <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginLeft: '8px' }}>
                          ({cmd.blockReason})
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--color-text-muted)' }}>
                    명령 로그가 없거나 로드 중입니다...
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCommandsModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedSession && (
        <div className="modal-overlay active" onClick={() => setShowCommentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">세션 주석 추가</h3>
              <button className="modal-close" onClick={() => setShowCommentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">주석 내용</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="세션에 대한 메모를 남기세요..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCommentModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleAddComment}>추가</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

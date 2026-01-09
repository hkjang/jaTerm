'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ServerHealth {
  id: string;
  name: string;
  hostname: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  status: 'online' | 'offline' | 'warning';
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
}

interface Session {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  user: { id: string; name: string; email: string };
  server: { id: string; name: string; hostname: string; environment: string };
  commandCount: number;
  blockedCount: number;
}

interface DashboardStats {
  totalServers: number;
  activeServers: number;
  totalSessions: number;
  activeSessions: number;
  blockedCommands: number;
}

export default function OperationsPage() {
  const [servers, setServers] = useState<ServerHealth[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sessions' | 'health'>('overview');
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const user = localStorage.getItem('user');
    if (!user) return {};
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  };

  const fetchData = useCallback(async () => {
    try {
      const [healthRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/server-health', { headers: getAuthHeaders() }),
        fetch('/api/admin/sessions?status=ACTIVE&limit=50', { headers: getAuthHeaders() }),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setServers(healthData.servers || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
      }

      // Calculate stats
      const serverList = servers.length > 0 ? servers : [];
      setStats({
        totalServers: serverList.length,
        activeServers: serverList.filter(s => s.status === 'online').length,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'ACTIVE').length,
        blockedCommands: sessions.reduce((acc, s) => acc + (s.blockedCount || 0), 0),
      });

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [servers.length, sessions.length]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleTestConnection = async (serverId: string) => {
    setTestingServer(serverId);
    try {
      const response = await fetch('/api/admin/servers/test', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      });
      const result = await response.json();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message || (result.success ? '연결 성공' : '연결 실패'),
      });
    } catch (err) {
      setMessage({ type: 'error', text: '연결 테스트 실패' });
    } finally {
      setTestingServer(null);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('이 세션을 강제 종료하시겠습니까?')) return;
    
    setTerminatingSession(sessionId);
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, reason: 'Admin termination' }),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: '세션이 종료되었습니다' });
        fetchData();
      } else {
        const result = await response.json();
        setMessage({ type: 'error', text: result.error || '세션 종료 실패' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '세션 종료 실패' });
    } finally {
      setTerminatingSession(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'ACTIVE': return '#10b981';
      case 'offline': case 'TERMINATED': return '#ef4444';
      case 'warning': case 'DISCONNECTED': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getCpuColor = (usage: number) => {
    if (usage >= 80) return '#ef4444';
    if (usage >= 60) return '#f59e0b';
    return '#10b981';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const formatDuration = (startStr: string, endStr?: string) => {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hours > 0) return `${hours}시간 ${mins}분`;
    if (mins > 0) return `${mins}분 ${secs}초`;
    return `${secs}초`;
  };

  return (
    <AdminLayout 
      title="운영 모니터링" 
      description="실시간 서버 상태 및 세션 모니터링"
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span style={{ fontSize: '0.85rem' }}>자동 새로고침</span>
          </label>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="form-input" 
            style={{ width: '100px', padding: '6px 10px' }}
          >
            <option value="10">10초</option>
            <option value="30">30초</option>
            <option value="60">1분</option>
            <option value="300">5분</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchData}>
            🔄 새로고침
          </button>
          {lastUpdate && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
            </span>
          )}
        </div>
      }
    >
      {/* Messages */}
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '4px' }}>전체 서버</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats?.totalServers || servers.length}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{stats?.activeServers || 0} 활성</div>
        </div>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '4px' }}>활성 세션</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{sessions.filter(s => s.status === 'ACTIVE').length}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>진행 중</div>
        </div>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '4px' }}>경고 서버</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{servers.filter(s => s.cpuUsage > 70 || s.memoryUsage > 80).length}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>주의 필요</div>
        </div>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '4px' }}>차단된 명령</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{sessions.reduce((acc, s) => acc + (s.blockedCount || 0), 0)}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>보안 이벤트</div>
        </div>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '4px' }}>평균 응답</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
            {servers.length > 0 ? Math.round(servers.reduce((acc, s) => acc + s.responseTime, 0) / servers.length) : 0}
            <span style={{ fontSize: '1rem' }}>ms</span>
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>네트워크 지연</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
        {[
          { id: 'overview', label: '📊 개요', icon: '' },
          { id: 'sessions', label: '👥 활성 세션', icon: '' },
          { id: 'health', label: '💓 서버 상태', icon: '' },
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

      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--color-text-muted)' }}>데이터를 불러오는 중...</div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Server Health Summary */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>🖥️ 서버 상태 요약</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {servers.slice(0, 5).map(server => (
                    <div key={server.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-surface)', borderRadius: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(server.status) }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{server.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{server.hostname}</div>
                      </div>
                      <span style={{ padding: '2px 8px', background: getEnvColor(server.environment) + '20', color: getEnvColor(server.environment), borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {server.environment}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: getCpuColor(server.cpuUsage) }}>CPU {server.cpuUsage}%</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>MEM {server.memoryUsage}%</div>
                      </div>
                    </div>
                  ))}
                  {servers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                      서버 데이터 없음
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>👥 최근 활성 세션</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sessions.slice(0, 5).map(session => (
                    <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-surface)', borderRadius: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(session.status) }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{session.user.name || session.user.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{session.server.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem' }}>{session.commandCount} 명령</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatDuration(session.startedAt)}</div>
                      </div>
                      {session.blockedCount > 0 && (
                        <span style={{ padding: '2px 6px', background: '#ef444420', color: '#ef4444', borderRadius: '4px', fontSize: '0.7rem' }}>
                          ⚠️ {session.blockedCount}
                        </span>
                      )}
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                      활성 세션 없음
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {selectedTab === 'sessions' && (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>사용자</th>
                      <th>서버</th>
                      <th>시작 시간</th>
                      <th>지속 시간</th>
                      <th>명령 수</th>
                      <th>차단</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => (
                      <tr key={session.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(session.status), animation: session.status === 'ACTIVE' ? 'pulse 2s infinite' : 'none' }} />
                            <span style={{ fontSize: '0.85rem' }}>{session.status}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{session.user.name || '알 수 없음'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{session.user.email}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ padding: '2px 6px', background: getEnvColor(session.server.environment) + '20', color: getEnvColor(session.server.environment), borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                              {session.server.environment}
                            </span>
                            <span>{session.server.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{formatTime(session.startedAt)}</td>
                        <td style={{ fontSize: '0.85rem' }}>{formatDuration(session.startedAt, session.endedAt)}</td>
                        <td style={{ textAlign: 'center' }}>{session.commandCount}</td>
                        <td style={{ textAlign: 'center' }}>
                          {session.blockedCount > 0 ? (
                            <span style={{ padding: '2px 8px', background: '#ef444420', color: '#ef4444', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                              {session.blockedCount}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {session.status === 'ACTIVE' && (
                            <button 
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => handleTerminateSession(session.id)}
                              disabled={terminatingSession === session.id}
                            >
                              {terminatingSession === session.id ? '⏳' : '⏹️ 종료'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                          활성 세션이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Health Tab */}
          {selectedTab === 'health' && (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>서버</th>
                      <th>환경</th>
                      <th>응답 시간</th>
                      <th>CPU</th>
                      <th>메모리</th>
                      <th>세션</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servers.map(server => (
                      <tr key={server.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(server.status) }} />
                            <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{server.status}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{server.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{server.hostname}</div>
                        </td>
                        <td>
                          <span style={{ padding: '2px 8px', background: getEnvColor(server.environment) + '20', color: getEnvColor(server.environment), borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {server.environment}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{server.responseTime}ms</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${server.cpuUsage}%`, height: '100%', background: getCpuColor(server.cpuUsage), transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: getCpuColor(server.cpuUsage), fontWeight: 500 }}>{server.cpuUsage}%</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${server.memoryUsage}%`, height: '100%', background: getCpuColor(server.memoryUsage), transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: getCpuColor(server.memoryUsage), fontWeight: 500 }}>{server.memoryUsage}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', background: 'var(--color-surface)', borderRadius: '4px', fontSize: '0.85rem' }}>
                            {server.activeSessions}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleTestConnection(server.id)}
                            disabled={testingServer === server.id}
                          >
                            {testingServer === server.id ? '⏳' : '🔗 테스트'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {servers.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                          서버 데이터가 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </AdminLayout>
  );
}

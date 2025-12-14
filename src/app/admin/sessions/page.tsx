'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Session {
  id: string;
  user: { name: string; email: string; role: string };
  server: { name: string; hostname: string; environment: string };
  status: 'ACTIVE' | 'DISCONNECTED' | 'TERMINATED';
  startedAt: Date;
  endedAt: Date | null;
  commandCount: number;
  blockedCount: number;
}

const mockSessions: Session[] = [
  { 
    id: '1', 
    user: { name: '홍길동', email: 'admin@jaterm.com', role: 'ADMIN' },
    server: { name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD' },
    status: 'ACTIVE',
    startedAt: new Date(Date.now() - 3600000),
    endedAt: null,
    commandCount: 24,
    blockedCount: 0
  },
  { 
    id: '2', 
    user: { name: '김철수', email: 'operator@jaterm.com', role: 'OPERATOR' },
    server: { name: 'stage-api-01', hostname: '192.168.2.11', environment: 'STAGE' },
    status: 'ACTIVE',
    startedAt: new Date(Date.now() - 7200000),
    endedAt: null,
    commandCount: 45,
    blockedCount: 1
  },
  { 
    id: '3', 
    user: { name: '이영희', email: 'dev@jaterm.com', role: 'DEVELOPER' },
    server: { name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV' },
    status: 'DISCONNECTED',
    startedAt: new Date(Date.now() - 10800000),
    endedAt: new Date(Date.now() - 9000000),
    commandCount: 12,
    blockedCount: 2
  },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState(mockSessions);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const filteredSessions = sessions.filter(session => {
    return !statusFilter || session.status === statusFilter;
  });

  const formatDuration = (startedAt: Date, endedAt?: Date | null) => {
    const end = endedAt || new Date();
    const diff = end.getTime() - startedAt.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
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
            <Link href="/admin/users" className="sidebar-link"><span className="sidebar-link-icon">👥</span><span>사용자 관리</span></Link>
            <Link href="/admin/servers" className="sidebar-link"><span className="sidebar-link-icon">🖥️</span><span>서버 관리</span></Link>
            <Link href="/admin/policies" className="sidebar-link"><span className="sidebar-link-icon">📋</span><span>정책 관리</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Monitoring</div>
            <Link href="/admin/sessions" className="sidebar-link active"><span className="sidebar-link-icon">📺</span><span>세션 관제</span></Link>
            <Link href="/admin/audit" className="sidebar-link"><span className="sidebar-link-icon">📝</span><span>감사 로그</span></Link>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>세션 관제</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>실시간 터미널 세션 모니터링</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
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
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-label">활성 세션</div>
            <div className="stat-value">{sessions.filter(s => s.status === 'ACTIVE').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">오늘 총 세션</div>
            <div className="stat-value">{sessions.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">총 명령 실행</div>
            <div className="stat-value">{sessions.reduce((a, s) => a + s.commandCount, 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">차단된 명령</div>
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
              {sessions.reduce((a, s) => a + s.blockedCount, 0)}
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="card" style={{ padding: 0 }}>
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
                {filteredSessions.map(session => (
                  <tr key={session.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{session.user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {session.user.email}
                        <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>
                          {session.user.role}
                        </span>
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
                      <span className={`badge ${
                        session.status === 'ACTIVE' ? 'badge-success' : 
                        session.status === 'TERMINATED' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {session.status === 'ACTIVE' && '● '}
                        {session.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {session.startedAt.toLocaleTimeString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {formatDuration(session.startedAt, session.endedAt)}
                    </td>
                    <td>
                      <span>{session.commandCount}</span>
                      {session.blockedCount > 0 && (
                        <span style={{ color: 'var(--color-danger)', marginLeft: '8px' }}>
                          ({session.blockedCount} 차단)
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          👁️ 보기
                        </button>
                        {session.status === 'ACTIVE' && (
                          <button className="btn btn-danger btn-sm">종료</button>
                        )}
                        {session.status !== 'ACTIVE' && (
                          <button className="btn btn-ghost btn-sm">🎬 재생</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Session Detail Modal */}
        {selectedSession && (
          <div className="modal-overlay active" onClick={() => setSelectedSession(null)}>
            <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">세션 상세 - {selectedSession.user.name}</h3>
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
                    <div style={{ fontWeight: 500 }}>{selectedSession.server.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedSession.server.hostname}
                    </div>
                  </div>
                </div>

                {/* Mock command log */}
                <div style={{ 
                  background: 'var(--terminal-bg)', 
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  <div style={{ color: 'var(--color-text-muted)' }}># 명령어 로그</div>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ color: 'var(--color-success)' }}>$</span> ls -la
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ color: 'var(--color-success)' }}>$</span> cd /var/log
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ color: 'var(--color-success)' }}>$</span> tail -f application.log
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ color: 'var(--color-success)' }}>$</span> ps aux | grep nginx
                  </div>
                  {selectedSession.blockedCount > 0 && (
                    <div style={{ marginTop: '8px', color: 'var(--color-danger)' }}>
                      <span style={{ color: 'var(--color-danger)' }}>✗</span> rm -rf / <span style={{ fontSize: '0.75rem' }}>(BLOCKED)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                {selectedSession.status !== 'ACTIVE' && (
                  <button className="btn btn-secondary">🎬 세션 재생</button>
                )}
                {selectedSession.status === 'ACTIVE' && (
                  <button className="btn btn-danger">세션 강제 종료</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

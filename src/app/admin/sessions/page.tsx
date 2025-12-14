'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Session {
  id: string;
  user: { name: string; email: string; role: string };
  server: { name: string; hostname: string; environment: string };
  status: 'ACTIVE' | 'DISCONNECTED' | 'TERMINATED';
  startedAt: Date;
  endedAt: Date | null;
  commandCount: number;
  blockedCount: number;
  watermarkEnabled: boolean;
}

const mockSessions: Session[] = [
  { id: '1', user: { name: '홍길동', email: 'admin@jaterm.com', role: 'ADMIN' }, server: { name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD' }, status: 'ACTIVE', startedAt: new Date(Date.now() - 3600000), endedAt: null, commandCount: 24, blockedCount: 0, watermarkEnabled: true },
  { id: '2', user: { name: '김철수', email: 'operator@jaterm.com', role: 'OPERATOR' }, server: { name: 'stage-api-01', hostname: '192.168.2.11', environment: 'STAGE' }, status: 'ACTIVE', startedAt: new Date(Date.now() - 7200000), endedAt: null, commandCount: 45, blockedCount: 1, watermarkEnabled: true },
  { id: '3', user: { name: '이영희', email: 'dev@jaterm.com', role: 'DEVELOPER' }, server: { name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV' }, status: 'DISCONNECTED', startedAt: new Date(Date.now() - 10800000), endedAt: new Date(Date.now() - 9000000), commandCount: 12, blockedCount: 2, watermarkEnabled: false },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState(mockSessions);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const filteredSessions = sessions.filter(session => !statusFilter || session.status === statusFilter);

  const formatDuration = (startedAt: Date, endedAt?: Date | null) => {
    const end = endedAt || new Date();
    const diff = end.getTime() - startedAt.getTime();
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const getEnvColor = (env: string) => env === 'PROD' ? 'var(--color-danger)' : env === 'STAGE' ? 'var(--color-warning)' : 'var(--color-success)';

  const handleTerminate = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'TERMINATED' as const, endedAt: new Date() } : s));
  };

  return (
    <AdminLayout title="세션 관제" description="실시간 터미널 세션 모니터링 및 관제"
      actions={<select className="form-input form-select" style={{ width: '150px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">모든 상태</option><option value="ACTIVE">활성</option><option value="DISCONNECTED">종료됨</option><option value="TERMINATED">강제종료</option></select>}>

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">활성 세션</div><div className="stat-value">{sessions.filter(s => s.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">오늘 총 세션</div><div className="stat-value">{sessions.length}</div></div>
        <div className="stat-card"><div className="stat-label">총 명령 실행</div><div className="stat-value">{sessions.reduce((a, s) => a + s.commandCount, 0)}</div></div>
        <div className="stat-card"><div className="stat-label">차단된 명령</div><div className="stat-value" style={{ color: 'var(--color-danger)' }}>{sessions.reduce((a, s) => a + s.blockedCount, 0)}</div></div>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>사용자</th><th>서버</th><th>상태</th><th>시작 시간</th><th>지속 시간</th><th>명령</th><th>워터마크</th><th>작업</th></tr></thead>
            <tbody>
              {filteredSessions.map(session => (
                <tr key={session.id}>
                  <td><div style={{ fontWeight: 500 }}>{session.user.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{session.user.email}<span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>{session.user.role}</span></div></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, background: getEnvColor(session.server.environment) + '20', color: getEnvColor(session.server.environment) }}>{session.server.environment}</span>
                      <div><div style={{ fontWeight: 500 }}>{session.server.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{session.server.hostname}</div></div>
                    </div>
                  </td>
                  <td><span className={`badge ${session.status === 'ACTIVE' ? 'badge-success' : session.status === 'TERMINATED' ? 'badge-danger' : 'badge-info'}`}>{session.status === 'ACTIVE' && '● '}{session.status}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{session.startedAt.toLocaleTimeString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{formatDuration(session.startedAt, session.endedAt)}</td>
                  <td><span>{session.commandCount}</span>{session.blockedCount > 0 && <span style={{ color: 'var(--color-danger)', marginLeft: '8px' }}>({session.blockedCount} 차단)</span>}</td>
                  <td>{session.watermarkEnabled ? <span style={{ color: 'var(--color-success)' }}>✓</span> : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSession(session)}>👁️ 보기</button>
                      {session.status === 'ACTIVE' && <button className="btn btn-danger btn-sm" onClick={() => handleTerminate(session.id)}>종료</button>}
                      {session.status !== 'ACTIVE' && <button className="btn btn-ghost btn-sm">🎬 재생</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSession && (
        <div className="modal-overlay active" onClick={() => setSelectedSession(null)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">세션 상세 - {selectedSession.user.name}</h3><button className="modal-close" onClick={() => setSelectedSession(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사용자</div><div style={{ fontWeight: 500 }}>{selectedSession.user.name}</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedSession.user.email}</div></div>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>서버</div><div style={{ fontWeight: 500 }}>{selectedSession.server.name}</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{selectedSession.server.hostname}</div></div>
              </div>
              <div style={{ background: 'var(--terminal-bg)', borderRadius: 'var(--radius-md)', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', maxHeight: '300px', overflow: 'auto' }}>
                <div style={{ color: 'var(--color-text-muted)' }}># 화면 미러링 (시뮬레이션)</div>
                <div style={{ marginTop: '8px' }}><span style={{ color: 'var(--color-success)' }}>$</span> ls -la</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> cd /var/log</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> tail -f application.log</div>
                {selectedSession.blockedCount > 0 && <div style={{ marginTop: '8px', color: 'var(--color-danger)' }}><span>✗</span> rm -rf / <span style={{ fontSize: '0.75rem' }}>(BLOCKED - 위험 명령 차단)</span></div>}
              </div>
            </div>
            <div className="modal-footer">
              {selectedSession.status !== 'ACTIVE' && <button className="btn btn-secondary">🎬 세션 재생</button>}
              {selectedSession.status === 'ACTIVE' && <button className="btn btn-danger" onClick={() => { handleTerminate(selectedSession.id); setSelectedSession(null); }}>세션 강제 종료</button>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

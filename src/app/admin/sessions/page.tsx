'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Session {
  id: string;
  user: string;
  server: string;
  type: 'SSH' | 'SFTP' | 'RDP';
  status: 'ACTIVE' | 'IDLE' | 'DISCONNECTED';
  startTime: string;
  duration: string;
  commands: number;
  lastActivity: string;
  ip: string;
  recording: boolean;
}

const initialSessions: Session[] = [
  { id: '1', user: '김관리자', server: 'prod-db-01', type: 'SSH', status: 'ACTIVE', startTime: '2026-01-10 14:30', duration: '2h 15m', commands: 45, lastActivity: '방금 전', ip: '192.168.1.100', recording: true },
  { id: '2', user: '이개발', server: 'dev-api-01', type: 'SSH', status: 'ACTIVE', startTime: '2026-01-10 13:00', duration: '3h 45m', commands: 123, lastActivity: '1분 전', ip: '192.168.1.101', recording: true },
  { id: '3', user: '박운영', server: 'prod-web-01', type: 'SSH', status: 'IDLE', startTime: '2026-01-10 10:00', duration: '6h 45m', commands: 67, lastActivity: '30분 전', ip: '192.168.1.102', recording: true },
  { id: '4', user: '최DBA', server: 'prod-db-02', type: 'SSH', status: 'ACTIVE', startTime: '2026-01-10 15:00', duration: '45m', commands: 22, lastActivity: '2분 전', ip: '192.168.1.103', recording: true },
  { id: '5', user: '정개발', server: 'staging-01', type: 'SFTP', status: 'ACTIVE', startTime: '2026-01-10 14:45', duration: '1h', commands: 5, lastActivity: '5분 전', ip: '192.168.1.104', recording: false },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleWatch = (s: Session) => {
    setSuccess(`${s.user}의 세션을 감시 중...`);
  };

  const handleMessage = (s: Session) => {
    const msg = prompt('보낼 메시지:');
    if (msg) setSuccess(`${s.user}에게 메시지 전송됨`);
  };

  const handleTerminate = (s: Session) => {
    if (confirm(`${s.user}의 세션을 종료하시겠습니까?`)) {
      setSessions(sessions.filter(sess => sess.id !== s.id));
      setSuccess('세션 종료됨');
      setSelectedSession(null);
    }
  };

  const handleToggleRecording = (s: Session) => {
    setSessions(sessions.map(sess => sess.id === s.id ? { ...sess, recording: !sess.recording } : sess));
    setSuccess(s.recording ? '녹화 중지' : '녹화 시작');
  };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', IDLE: '#f59e0b', DISCONNECTED: '#6b7280' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ SSH: '💻', SFTP: '📁', RDP: '🖥️' }[t] || '📺');

  const filtered = sessions.filter(s => 
    (filterStatus === '' || s.status === filterStatus) &&
    (search === '' || s.user.includes(search) || s.server.includes(search))
  );

  return (
    <AdminLayout title="세션 관제" description="실시간 터미널 세션 모니터링">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">활성 세션</div><div className="stat-value" style={{ color: '#10b981' }}>{sessions.filter(s => s.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">유휴</div><div className="stat-value" style={{ color: '#f59e0b' }}>{sessions.filter(s => s.status === 'IDLE').length}</div></div>
        <div className="stat-card"><div className="stat-label">녹화 중</div><div className="stat-value">{sessions.filter(s => s.recording).length}</div></div>
        <div className="stat-card"><div className="stat-label">총 명령</div><div className="stat-value">{sessions.reduce((sum, s) => sum + s.commands, 0)}</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 120 }}>
          <option value="">전체</option><option value="ACTIVE">활성</option><option value="IDLE">유휴</option>
        </select>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>사용자</th><th>서버</th><th>유형</th><th>시작</th><th>명령</th><th>녹화</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>{filtered.map(s => (
            <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedSession(s)}>
              <td><div style={{ fontWeight: 600 }}>{s.user}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.ip}</div></td>
              <td style={{ fontWeight: 500 }}>{s.server}</td>
              <td>{getTypeIcon(s.type)} {s.type}</td>
              <td><div style={{ fontSize: '0.85rem' }}>{s.duration}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.lastActivity}</div></td>
              <td style={{ fontWeight: 600 }}>{s.commands}</td>
              <td>{s.recording ? '🔴' : '⚪'}</td>
              <td><span style={{ padding: '2px 8px', background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), borderRadius: 4, fontSize: '0.75rem' }}>{s.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleWatch(s)}>👁️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleMessage(s)}>💬</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggleRecording(s)}>{s.recording ? '⏹️' : '⏺️'}</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleTerminate(s)}>⛔</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {/* Detail Modal */}
      {selectedSession && (
        <div className="modal-overlay active" onClick={() => setSelectedSession(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📺 {selectedSession.user} - {selectedSession.server}</h3><button className="modal-close" onClick={() => setSelectedSession(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedSession.status)}20`, color: getStatusColor(selectedSession.status), borderRadius: 6 }}>{selectedSession.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{getTypeIcon(selectedSession.type)} {selectedSession.type}</span>{selectedSession.recording && <span style={{ padding: '4px 10px', background: '#ef444420', color: '#ef4444', borderRadius: 6 }}>🔴 녹화 중</span>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>시작:</b> {selectedSession.startTime}</div><div><b>시간:</b> {selectedSession.duration}</div><div><b>IP:</b> {selectedSession.ip}</div><div><b>명령:</b> {selectedSession.commands}개</div><div><b>마지막 활동:</b> {selectedSession.lastActivity}</div></div>
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={() => handleWatch(selectedSession)}>👁️ 감시</button><button className="btn btn-secondary" onClick={() => handleMessage(selectedSession)}>💬 메시지</button><button className="btn btn-secondary" onClick={() => handleToggleRecording(selectedSession)}>{selectedSession.recording ? '⏹️ 녹화 중지' : '⏺️ 녹화 시작'}</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleTerminate(selectedSession)}>⛔ 종료</button><button className="btn btn-ghost" onClick={() => setSelectedSession(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CollabSession {
  id: string;
  sessionId: string;
  server: string;
  owner: string;
  participants: { name: string; role: 'OWNER' | 'VIEWER' | 'OPERATOR'; joinedAt: string; status: 'ACTIVE' | 'IDLE' }[];
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  createdAt: string;
  duration: string;
  permissions: { canType: boolean; canPaste: boolean; canResize: boolean };
}

export default function SessionCollaborationPage() {
  const [sessions, setSessions] = useState<CollabSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CollabSession | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setSessions([
      { id: '1', sessionId: 'sess-a1b2c3', server: 'prod-db-01', owner: '김관리자', participants: [{ name: '김관리자', role: 'OWNER', joinedAt: '14:00', status: 'ACTIVE' }, { name: '이개발', role: 'OPERATOR', joinedAt: '14:05', status: 'ACTIVE' }, { name: '박보안', role: 'VIEWER', joinedAt: '14:10', status: 'IDLE' }], status: 'ACTIVE', createdAt: '2026-01-10 14:00', duration: '45분', permissions: { canType: true, canPaste: true, canResize: true } },
      { id: '2', sessionId: 'sess-d4e5f6', server: 'api-server-02', owner: '최시니어', participants: [{ name: '최시니어', role: 'OWNER', joinedAt: '13:30', status: 'ACTIVE' }, { name: '정주니어', role: 'VIEWER', joinedAt: '13:35', status: 'ACTIVE' }], status: 'ACTIVE', createdAt: '2026-01-10 13:30', duration: '1시간 15분', permissions: { canType: false, canPaste: false, canResize: false } },
      { id: '3', sessionId: 'sess-g7h8i9', server: 'staging-web-01', owner: '강테스트', participants: [{ name: '강테스트', role: 'OWNER', joinedAt: '10:00', status: 'IDLE' }], status: 'PAUSED', createdAt: '2026-01-10 10:00', duration: '4시간 45분', permissions: { canType: true, canPaste: false, canResize: true } },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleJoin = (s: CollabSession) => { setSuccess(`${s.sessionId} 세션에 참가 중...`); };
  const handleWatch = (s: CollabSession) => { setSuccess(`${s.sessionId} 세션 모니터링 시작`); };
  const handleKick = (s: CollabSession, participant: string) => { if (confirm(`${participant}를 세션에서 제거?`)) { setSessions(sessions.map(sess => sess.id === s.id ? { ...sess, participants: sess.participants.filter(p => p.name !== participant) } : sess)); setSuccess(`${participant} 제거됨`); } };
  const handleEndSession = (s: CollabSession) => { if (confirm('세션을 종료하시겠습니까?')) { setSessions(sessions.map(sess => sess.id === s.id ? { ...sess, status: 'ENDED' } : sess)); setSuccess('세션 종료됨'); setSelectedSession(null); } };
  const handleBroadcast = () => { setSuccess('메시지 브로드캐스트 전송됨'); };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', PAUSED: '#f59e0b', ENDED: '#6b7280' }[s] || '#6b7280');
  const getRoleColor = (r: string) => ({ OWNER: '#6366f1', OPERATOR: '#10b981', VIEWER: '#3b82f6' }[r] || '#6b7280');

  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const totalParticipants = sessions.reduce((a, s) => a + s.participants.length, 0);

  return (
    <AdminLayout title="세션 협업" description="실시간 터미널 세션 공유 및 협업 관리">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">공유 세션</div><div className="stat-value">{sessions.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{activeCount}</div></div>
        <div className="stat-card"><div className="stat-label">👥 참가자</div><div className="stat-value">{totalParticipants}</div></div>
        <div className="stat-card"><div className="stat-label">⏸️ 일시정지</div><div className="stat-value" style={{ color: '#f59e0b' }}>{sessions.filter(s => s.status === 'PAUSED').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gap: 12 }}>{sessions.filter(s => s.status !== 'ENDED').map(s => (
          <div key={s.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(s.status)}`, cursor: 'pointer' }} onClick={() => setSelectedSession(s)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}><span style={{ fontWeight: 700 }}>{s.server}</span><code style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{s.sessionId}</code><span style={{ padding: '2px 8px', background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), borderRadius: 4, fontSize: '0.75rem' }}>{s.status}</span></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>👤 {s.owner} · ⏱️ {s.duration} · 📅 {s.createdAt}</div>
                <div style={{ display: 'flex', gap: 6 }}>{s.participants.map(p => <span key={p.name} style={{ padding: '2px 8px', background: `${getRoleColor(p.role)}20`, color: getRoleColor(p.role), borderRadius: 4, fontSize: '0.75rem' }}>{p.name} ({p.role})</span>)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}><button className="btn btn-ghost btn-sm" onClick={() => handleWatch(s)}>👁️</button><button className="btn btn-ghost btn-sm" onClick={() => handleJoin(s)}>🚪</button></div>
            </div>
          </div>
        ))}</div>
      )}
      {selectedSession && (
        <div className="modal-overlay active" onClick={() => setSelectedSession(null)}><div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">👥 {selectedSession.server}</h3><button className="modal-close" onClick={() => setSelectedSession(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedSession.status)}20`, color: getStatusColor(selectedSession.status), borderRadius: 6 }}>{selectedSession.status}</span><code style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedSession.sessionId}</code></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><div><b>소유자:</b> {selectedSession.owner}</div><div><b>시작:</b> {selectedSession.createdAt}</div><div><b>경과:</b> {selectedSession.duration}</div></div>
            <div style={{ marginBottom: 8 }}><b>권한 설정:</b></div><div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 8px', background: selectedSession.permissions.canType ? '#10b98120' : '#6b728020', borderRadius: 4, fontSize: '0.85rem' }}>⌨️ 입력 {selectedSession.permissions.canType ? '✓' : '✗'}</span><span style={{ padding: '4px 8px', background: selectedSession.permissions.canPaste ? '#10b98120' : '#6b728020', borderRadius: 4, fontSize: '0.85rem' }}>📋 붙여넣기 {selectedSession.permissions.canPaste ? '✓' : '✗'}</span><span style={{ padding: '4px 8px', background: selectedSession.permissions.canResize ? '#10b98120' : '#6b728020', borderRadius: 4, fontSize: '0.85rem' }}>↔️ 리사이즈 {selectedSession.permissions.canResize ? '✓' : '✗'}</span></div>
            <div style={{ marginBottom: 8 }}><b>참가자 ({selectedSession.participants.length}):</b></div><div style={{ display: 'grid', gap: 8 }}>{selectedSession.participants.map(p => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>
                <div><span style={{ fontWeight: 500 }}>{p.name}</span><span style={{ marginLeft: 8, padding: '2px 6px', background: `${getRoleColor(p.role)}20`, color: getRoleColor(p.role), borderRadius: 4, fontSize: '0.7rem' }}>{p.role}</span><span style={{ marginLeft: 8, color: p.status === 'ACTIVE' ? '#10b981' : '#6b7280', fontSize: '0.8rem' }}>● {p.status}</span></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.joinedAt} 참가 {p.role !== 'OWNER' && <button className="btn btn-ghost btn-sm" onClick={() => handleKick(selectedSession, p.name)}>❌</button>}</div>
              </div>
            ))}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={() => handleJoin(selectedSession)}>🚪 참가</button><button className="btn btn-secondary" onClick={handleBroadcast}>📢 브로드캐스트</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleEndSession(selectedSession)}>🛑 종료</button><button className="btn btn-ghost" onClick={() => setSelectedSession(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Recording {
  id: string;
  sessionId: string;
  server: string;
  user: string;
  startTime: string;
  endTime: string;
  duration: string;
  size: string;
  status: 'COMPLETED' | 'RECORDING' | 'PROCESSING' | 'FAILED';
  hasVideo: boolean;
  hasAudit: boolean;
  commandCount: number;
  tags: string[];
  retention: string;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<Recording | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setRecordings([
      { id: '1', sessionId: 'sess-a1b2c3', server: 'prod-db-01', user: '김관리자', startTime: '2026-01-10 09:00', endTime: '2026-01-10 10:45', duration: '1h 45m', size: '125 MB', status: 'COMPLETED', hasVideo: true, hasAudit: true, commandCount: 342, tags: ['production', 'database'], retention: '90일' },
      { id: '2', sessionId: 'sess-d4e5f6', server: 'api-server-02', user: '이개발', startTime: '2026-01-10 11:30', endTime: '-', duration: '2h 15m', size: '88 MB', status: 'RECORDING', hasVideo: true, hasAudit: true, commandCount: 156, tags: ['debugging'], retention: '30일' },
      { id: '3', sessionId: 'sess-g7h8i9', server: 'staging-web-01', user: '박테스트', startTime: '2026-01-09 14:00', endTime: '2026-01-09 16:30', duration: '2h 30m', size: '156 MB', status: 'COMPLETED', hasVideo: true, hasAudit: true, commandCount: 523, tags: ['staging', 'test'], retention: '30일' },
      { id: '4', sessionId: 'sess-j0k1l2', server: 'dev-jump-01', user: '최시니어', startTime: '2026-01-10 08:00', endTime: '2026-01-10 08:15', duration: '15m', size: '12 MB', status: 'COMPLETED', hasVideo: false, hasAudit: true, commandCount: 28, tags: [], retention: '14일' },
      { id: '5', sessionId: 'sess-m3n4o5', server: 'prod-k8s-master', user: '강운영', startTime: '2026-01-08 22:00', endTime: '2026-01-08 23:45', duration: '1h 45m', size: '98 MB', status: 'PROCESSING', hasVideo: true, hasAudit: true, commandCount: 287, tags: ['production', 'k8s'], retention: '90일' },
      { id: '6', sessionId: 'sess-p6q7r8', server: 'secure-bastion', user: '정보안', startTime: '2026-01-07 10:00', endTime: '2026-01-07 10:05', duration: '5m', size: '-', status: 'FAILED', hasVideo: false, hasAudit: false, commandCount: 0, tags: [], retention: '-' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handlePlay = (r: Recording) => { setSuccess(`${r.sessionId} 재생 시작...`); };
  const handleDownload = (r: Recording) => { setSuccess(`${r.sessionId} 다운로드 시작...`); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setRecordings(recordings.filter(r => r.id !== id)); setSuccess('삭제됨'); setSelectedRec(null); } };
  const handleExtendRetention = (r: Recording) => { setRecordings(recordings.map(rec => rec.id === r.id ? { ...rec, retention: '180일' } : rec)); setSuccess('보존 기간 연장됨'); };

  const getStatusColor = (s: string) => ({ COMPLETED: '#10b981', RECORDING: '#3b82f6', PROCESSING: '#f59e0b', FAILED: '#ef4444' }[s] || '#6b7280');

  const filtered = recordings.filter(r => (filterStatus === '' || r.status === filterStatus) && (search === '' || r.server.includes(search) || r.user.includes(search) || r.sessionId.includes(search)));
  const totalSize = recordings.filter(r => r.size !== '-').reduce((a, r) => a + parseFloat(r.size), 0);

  return (
    <AdminLayout title="세션 녹화" description="터미널 세션 녹화 관리 및 재생">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{recordings.length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 녹화중</div><div className="stat-value" style={{ color: '#ef4444' }}>{recordings.filter(r => r.status === 'RECORDING').length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 완료</div><div className="stat-value" style={{ color: '#10b981' }}>{recordings.filter(r => r.status === 'COMPLETED').length}</div></div>
        <div className="stat-card"><div className="stat-label">💾 용량</div><div className="stat-value" style={{ fontSize: '1rem' }}>{totalSize.toFixed(0)} MB</div></div>
        <div className="stat-card"><div className="stat-label">⌨️ 명령어</div><div className="stat-value">{recordings.reduce((a, r) => a + r.commandCount, 0)}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}><option value="">전체 상태</option><option value="COMPLETED">완료</option><option value="RECORDING">녹화중</option><option value="PROCESSING">처리중</option><option value="FAILED">실패</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>세션</th><th>서버</th><th>사용자</th><th>시간</th><th>길이</th><th>크기</th><th>명령어</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>{filtered.map(r => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedRec(r)}>
                <td><code style={{ fontSize: '0.8rem' }}>{r.sessionId}</code></td>
                <td style={{ fontWeight: 500 }}>{r.server}</td>
                <td>{r.user}</td>
                <td style={{ fontSize: '0.85rem' }}>{r.startTime}</td>
                <td>{r.duration}</td>
                <td>{r.size}</td>
                <td>{r.commandCount}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(r.status)}20`, color: getStatusColor(r.status), borderRadius: 4, fontSize: '0.75rem' }}>{r.status}</span></td>
                <td onClick={e => e.stopPropagation()}>{r.status === 'COMPLETED' && <><button className="btn btn-ghost btn-sm" onClick={() => handlePlay(r)}>▶️</button><button className="btn btn-ghost btn-sm" onClick={() => handleDownload(r)}>📥</button></>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedRec && (
        <div className="modal-overlay active" onClick={() => setSelectedRec(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🎬 {selectedRec.sessionId}</h3><button className="modal-close" onClick={() => setSelectedRec(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedRec.status)}20`, color: getStatusColor(selectedRec.status), borderRadius: 6 }}>{selectedRec.status}</span>{selectedRec.hasVideo && <span style={{ padding: '4px 10px', background: '#3b82f620', color: '#3b82f6', borderRadius: 6 }}>📹 비디오</span>}{selectedRec.hasAudit && <span style={{ padding: '4px 10px', background: '#10b98120', color: '#10b981', borderRadius: 6 }}>📝 감사</span>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><div><b>서버:</b> {selectedRec.server}</div><div><b>사용자:</b> {selectedRec.user}</div><div><b>시작:</b> {selectedRec.startTime}</div><div><b>종료:</b> {selectedRec.endTime}</div><div><b>길이:</b> {selectedRec.duration}</div><div><b>크기:</b> {selectedRec.size}</div><div><b>명령어:</b> {selectedRec.commandCount}개</div><div><b>보존:</b> {selectedRec.retention}</div></div>
            {selectedRec.tags.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{selectedRec.tags.map(t => <span key={t} style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.85rem' }}>{t}</span>)}</div>}
          </div>
          <div className="modal-footer">{selectedRec.status === 'COMPLETED' && <><button className="btn btn-primary" onClick={() => handlePlay(selectedRec)}>▶️ 재생</button><button className="btn btn-secondary" onClick={() => handleDownload(selectedRec)}>📥 다운로드</button></>}<button className="btn btn-secondary" onClick={() => handleExtendRetention(selectedRec)}>📅 보존 연장</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedRec.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedRec(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

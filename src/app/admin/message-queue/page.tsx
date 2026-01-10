'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface QueueJob {
  id: string;
  queue: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DELAYED';
  priority: number;
  payload: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt: string | null;
  error: string | null;
}

interface QueueStats {
  name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  delayed: number;
}

export default function MessageQueuePage() {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setQueueStats([
      { name: 'email', pending: 45, processing: 3, completed: 12500, failed: 12, delayed: 5 },
      { name: 'notification', pending: 120, processing: 10, completed: 45000, failed: 23, delayed: 0 },
      { name: 'export', pending: 8, processing: 2, completed: 890, failed: 5, delayed: 15 },
      { name: 'sync', pending: 25, processing: 5, completed: 8900, failed: 45, delayed: 10 },
    ]);
    setJobs([
      { id: '1', queue: 'email', type: 'SendWelcomeEmail', status: 'PENDING', priority: 5, payload: '{"to":"user@example.com"}', attempts: 0, maxAttempts: 3, createdAt: '2026-01-10 14:25', processedAt: null, error: null },
      { id: '2', queue: 'notification', type: 'PushNotification', status: 'PROCESSING', priority: 10, payload: '{"userId":123}', attempts: 1, maxAttempts: 3, createdAt: '2026-01-10 14:24', processedAt: null, error: null },
      { id: '3', queue: 'export', type: 'GenerateReport', status: 'COMPLETED', priority: 1, payload: '{"report":"monthly"}', attempts: 1, maxAttempts: 3, createdAt: '2026-01-10 14:00', processedAt: '2026-01-10 14:15', error: null },
      { id: '4', queue: 'sync', type: 'SyncUserData', status: 'FAILED', priority: 5, payload: '{"userId":456}', attempts: 3, maxAttempts: 3, createdAt: '2026-01-10 13:30', processedAt: '2026-01-10 13:45', error: 'Connection timeout' },
      { id: '5', queue: 'email', type: 'SendPasswordReset', status: 'DELAYED', priority: 8, payload: '{"to":"reset@example.com"}', attempts: 0, maxAttempts: 3, createdAt: '2026-01-10 14:26', processedAt: null, error: null },
      { id: '6', queue: 'notification', type: 'SendSMS', status: 'PENDING', priority: 7, payload: '{"phone":"+821012345678"}', attempts: 0, maxAttempts: 5, createdAt: '2026-01-10 14:27', processedAt: null, error: null },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleRetry = (job: QueueJob) => { setJobs(jobs.map(j => j.id === job.id ? { ...j, status: 'PENDING', attempts: 0, error: null } : j)); setSuccess(`${job.type} 재시도 예약됨`); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setJobs(jobs.filter(j => j.id !== id)); setSuccess('삭제됨'); } };
  const handlePurgeQueue = (queue: string) => { if (confirm(`${queue} 큐 전체 삭제?`)) { setJobs(jobs.filter(j => j.queue !== queue)); setSuccess(`${queue} 큐 비움`); } };
  const handlePurgeFailed = () => { if (confirm('실패한 작업 전체 삭제?')) { setJobs(jobs.filter(j => j.status !== 'FAILED')); setSuccess('실패 작업 삭제됨'); } };

  const getStatusColor = (s: string) => ({ PENDING: '#6b7280', PROCESSING: '#3b82f6', COMPLETED: '#10b981', FAILED: '#ef4444', DELAYED: '#f59e0b' }[s] || '#6b7280');
  const filtered = jobs.filter(j => (selectedQueue === 'all' || j.queue === selectedQueue) && (selectedStatus === 'all' || j.status === selectedStatus));

  return (
    <AdminLayout title="메시지 큐" description="작업 큐 및 백그라운드 작업 관리" actions={<button className="btn btn-secondary" onClick={handlePurgeFailed}>🗑️ 실패 작업 삭제</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {queueStats.map(q => (
          <div key={q.name} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>📬 {q.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => handlePurgeQueue(q.name)}>🗑️</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.8rem' }}>
              <div><div style={{ color: 'var(--color-text-muted)' }}>대기</div><div style={{ fontWeight: 600 }}>{q.pending}</div></div>
              <div><div style={{ color: 'var(--color-text-muted)' }}>처리중</div><div style={{ fontWeight: 600, color: '#3b82f6' }}>{q.processing}</div></div>
              <div><div style={{ color: 'var(--color-text-muted)' }}>실패</div><div style={{ fontWeight: 600, color: '#ef4444' }}>{q.failed}</div></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={selectedQueue} onChange={e => setSelectedQueue(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 큐</option>{queueStats.map(q => <option key={q.name} value={q.name}>{q.name}</option>)}</select>
        <select className="form-input" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 상태</option><option value="PENDING">대기</option><option value="PROCESSING">처리중</option><option value="COMPLETED">완료</option><option value="FAILED">실패</option><option value="DELAYED">지연</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>큐</th><th>타입</th><th>상태</th><th>우선순위</th><th>시도</th><th>생성</th><th>에러</th><th>작업</th></tr></thead>
            <tbody>{filtered.map(j => (
              <tr key={j.id}>
                <td><span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{j.queue}</span></td>
                <td style={{ fontWeight: 500 }}>{j.type}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(j.status)}20`, color: getStatusColor(j.status), borderRadius: 4, fontSize: '0.8rem' }}>{j.status}</span></td>
                <td>{j.priority}</td>
                <td>{j.attempts}/{j.maxAttempts}</td>
                <td style={{ fontSize: '0.85rem' }}>{j.createdAt}</td>
                <td style={{ fontSize: '0.8rem', color: '#ef4444', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.error || '-'}</td>
                <td>{j.status === 'FAILED' && <button className="btn btn-ghost btn-sm" onClick={() => handleRetry(j)}>🔄</button>}<button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(j.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

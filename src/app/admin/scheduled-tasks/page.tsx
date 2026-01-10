'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Task {
  id: string;
  name: string;
  type: 'CRON' | 'INTERVAL' | 'ONE_TIME';
  command: string;
  schedule: string;
  status: 'ACTIVE' | 'PAUSED' | 'RUNNING' | 'FAILED';
  lastRun: string | null;
  nextRun: string;
  lastResult: 'SUCCESS' | 'FAILED' | 'PENDING';
  runCount: number;
  failCount: number;
  timeout: number;
  retries: number;
}

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'CRON', command: '', schedule: '0 * * * *', timeout: 300, retries: 3 });

  useEffect(() => {
    const mock: Task[] = [
      { id: '1', name: '세션 정리', type: 'CRON', command: 'node scripts/cleanup-sessions.js', schedule: '0 3 * * *', status: 'ACTIVE', lastRun: '2026-01-10 03:00', nextRun: '2026-01-11 03:00', lastResult: 'SUCCESS', runCount: 156, failCount: 2, timeout: 300, retries: 3 },
      { id: '2', name: '로그 아카이브', type: 'CRON', command: 'sh /scripts/archive-logs.sh', schedule: '0 4 * * 0', status: 'ACTIVE', lastRun: '2026-01-05 04:00', nextRun: '2026-01-12 04:00', lastResult: 'SUCCESS', runCount: 52, failCount: 0, timeout: 600, retries: 2 },
      { id: '3', name: '상태 체크', type: 'INTERVAL', command: 'curl -f http://localhost:3000/health', schedule: '5분마다', status: 'RUNNING', lastRun: '2026-01-10 13:25', nextRun: '2026-01-10 13:30', lastResult: 'SUCCESS', runCount: 4320, failCount: 12, timeout: 30, retries: 5 },
      { id: '4', name: 'DB 백업 알림', type: 'CRON', command: 'node scripts/notify-backup.js', schedule: '0 5 * * *', status: 'ACTIVE', lastRun: '2026-01-10 05:00', nextRun: '2026-01-11 05:00', lastResult: 'SUCCESS', runCount: 89, failCount: 1, timeout: 60, retries: 3 },
      { id: '5', name: '만료 세션 제거', type: 'INTERVAL', command: 'redis-cli scan expired:*', schedule: '1시간마다', status: 'PAUSED', lastRun: '2026-01-09 12:00', nextRun: '-', lastResult: 'PENDING', runCount: 720, failCount: 0, timeout: 120, retries: 2 },
      { id: '6', name: '보고서 생성', type: 'CRON', command: 'python generate-report.py', schedule: '0 8 * * 1', status: 'FAILED', lastRun: '2026-01-06 08:00', nextRun: '2026-01-13 08:00', lastResult: 'FAILED', runCount: 15, failCount: 3, timeout: 900, retries: 1 },
    ];
    setTasks(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: String(tasks.length + 1), name: formData.name, type: formData.type as Task['type'], command: formData.command, schedule: formData.schedule, status: 'ACTIVE', lastRun: null, nextRun: new Date(Date.now() + 3600000).toLocaleString('ko-KR'), lastResult: 'PENDING', runCount: 0, failCount: 0, timeout: formData.timeout, retries: formData.retries,
    };
    setTasks([newTask, ...tasks]);
    setSuccess('작업이 생성되었습니다.');
    setShowCreateModal(false);
    setFormData({ name: '', type: 'CRON', command: '', schedule: '0 * * * *', timeout: 300, retries: 3 });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, name: formData.name, type: formData.type as Task['type'], command: formData.command, schedule: formData.schedule, timeout: formData.timeout, retries: formData.retries } : t));
    setSuccess('수정되었습니다.');
    setShowEditModal(false);
    setSelectedTask(null);
  };

  const handleDelete = (id: string) => { if (confirm('삭제하시겠습니까?')) { setTasks(tasks.filter(t => t.id !== id)); setSuccess('삭제되었습니다.'); setSelectedTask(null); } };
  const handleToggle = (task: Task) => { setTasks(tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED', nextRun: t.status === 'PAUSED' ? new Date(Date.now() + 3600000).toLocaleString('ko-KR') : '-' } : t)); setSuccess(task.status === 'PAUSED' ? '활성화되었습니다.' : '일시정지되었습니다.'); };
  const handleRunNow = (task: Task) => { setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'RUNNING' } : t)); setSuccess(`${task.name} 실행 시작`); setTimeout(() => { setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'ACTIVE', lastRun: new Date().toLocaleString('ko-KR'), runCount: t.runCount + 1, lastResult: 'SUCCESS' } : t)); }, 2000); };

  const openEdit = (t: Task) => {
    setSelectedTask(t);
    setFormData({ name: t.name, type: t.type, command: t.command, schedule: t.schedule, timeout: t.timeout, retries: t.retries });
    setShowEditModal(true);
  };

  const getStatusStyle = (s: string) => ({ ACTIVE: '#10b981', PAUSED: '#6b7280', RUNNING: '#3b82f6', FAILED: '#ef4444' }[s] || '#6b7280');
  const getResultStyle = (r: string) => ({ SUCCESS: '#10b981', FAILED: '#ef4444', PENDING: '#f59e0b' }[r] || '#6b7280');

  const filtered = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

  return (
    <AdminLayout title="예약 작업" description="Cron 및 스케줄 기반 자동화 작업 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 작업 추가</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 작업</div><div className="stat-value">{tasks.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{tasks.filter(t => t.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔄 실행중</div><div className="stat-value" style={{ color: '#3b82f6' }}>{tasks.filter(t => t.status === 'RUNNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">⏸️ 일시정지</div><div className="stat-value" style={{ color: '#6b7280' }}>{tasks.filter(t => t.status === 'PAUSED').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{tasks.filter(t => t.status === 'FAILED').length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 130 }}><option value="all">전체 상태</option><option value="ACTIVE">활성</option><option value="RUNNING">실행중</option><option value="PAUSED">일시정지</option><option value="FAILED">실패</option></select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>작업명</th><th>유형</th><th>스케줄</th><th>상태</th><th>마지막 결과</th><th>실행횟수</th><th>다음 실행</th><th>작업</th></tr></thead>
            <tbody>{filtered.map(t => (
              <tr key={t.id} style={{ opacity: t.status === 'PAUSED' ? 0.6 : 1 }}>
                <td><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.command}</div></td>
                <td><span style={{ padding: '3px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{t.type}</span></td>
                <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{t.schedule}</td>
                <td><span style={{ padding: '3px 8px', background: `${getStatusStyle(t.status)}20`, color: getStatusStyle(t.status), borderRadius: 4, fontSize: '0.8rem' }}>{t.status}</span></td>
                <td><span style={{ color: getResultStyle(t.lastResult) }}>{t.lastResult === 'SUCCESS' ? '✅' : t.lastResult === 'FAILED' ? '❌' : '⏳'}</span></td>
                <td>{t.runCount} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({t.failCount} 실패)</span></td>
                <td style={{ fontSize: '0.85rem' }}>{t.nextRun}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)} title="수정">✏️</button>
                  {t.status !== 'RUNNING' && <button className="btn btn-ghost btn-sm" onClick={() => handleRunNow(t)} title="즉시 실행">▶️</button>}
                  <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(t)} title={t.status === 'PAUSED' ? '활성화' : '일시정지'}>{t.status === 'PAUSED' ? '✅' : '⏸️'}</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(t.id)} title="삭제">🗑️</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">➕ 작업 추가</h3><button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">작업명</label><input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="CRON">Cron</option><option value="INTERVAL">Interval</option><option value="ONE_TIME">One-Time</option></select></div>
                <div className="form-group"><label className="form-label">명령어</label><input className="form-input" value={formData.command} onChange={e => setFormData({...formData, command: e.target.value})} required placeholder="node script.js" style={{ fontFamily: 'var(--font-mono)' }} /></div>
                <div className="form-group"><label className="form-label">스케줄</label><input className="form-input" value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} placeholder="0 * * * *" style={{ fontFamily: 'var(--font-mono)' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Timeout (초)</label><input type="number" className="form-input" value={formData.timeout} onChange={e => setFormData({...formData, timeout: parseInt(e.target.value)})} /></div>
                  <div className="form-group"><label className="form-label">재시도 횟수</label><input type="number" className="form-input" value={formData.retries} onChange={e => setFormData({...formData, retries: parseInt(e.target.value)})} /></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedTask && (
        <div className="modal-overlay active" onClick={() => { setShowEditModal(false); setSelectedTask(null); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">✏️ 수정 - {selectedTask.name}</h3><button className="modal-close" onClick={() => { setShowEditModal(false); setSelectedTask(null); }}>×</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">작업명</label><input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="CRON">Cron</option><option value="INTERVAL">Interval</option><option value="ONE_TIME">One-Time</option></select></div>
                <div className="form-group"><label className="form-label">명령어</label><input className="form-input" value={formData.command} onChange={e => setFormData({...formData, command: e.target.value})} required style={{ fontFamily: 'var(--font-mono)' }} /></div>
                <div className="form-group"><label className="form-label">스케줄</label><input className="form-input" value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} style={{ fontFamily: 'var(--font-mono)' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Timeout (초)</label><input type="number" className="form-input" value={formData.timeout} onChange={e => setFormData({...formData, timeout: parseInt(e.target.value)})} /></div>
                  <div className="form-group"><label className="form-label">재시도 횟수</label><input type="number" className="form-input" value={formData.retries} onChange={e => setFormData({...formData, retries: parseInt(e.target.value)})} /></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedTask.id)}>🗑️</button><div style={{ flex: 1 }} /><button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedTask(null); }}>취소</button><button type="submit" className="btn btn-primary">저장</button></div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

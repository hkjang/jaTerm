'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ScheduledTask {
  id: string;
  name: string;
  description: string | null;
  command: string | null;
  schedule: string;
  targetIds: string[];
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  macro: { id: string; name: string } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SchedulesPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });

      const response = await fetch(`/api/admin/schedules?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const data = await response.json();
      setTasks(data.tasks);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('예약 작업 목록을 불러오는데 실패했습니다.');
      console.error('Fetch schedules error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleActive = async (task: ScheduledTask) => {
    try {
      await fetch('/api/admin/schedules', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, isActive: !task.isActive }),
      });
      setSuccess(task.isActive ? '작업이 비활성화되었습니다.' : '작업이 활성화되었습니다.');
      fetchTasks();
    } catch (err) {
      setError('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 예약 작업을 삭제하시겠습니까?')) return;

    try {
      await fetch('/api/admin/schedules', {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSuccess('예약 작업이 삭제되었습니다.');
      fetchTasks();
    } catch (err) {
      setError('예약 작업 삭제에 실패했습니다.');
    }
  };

  const activeCount = tasks.filter(t => t.isActive).length;
  const totalCount = tasks.length;

  return (
    <AdminLayout 
      title="예약 작업" 
      description="자동화된 서버 작업 일정 관리"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 작업 추가</button>}
    >
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}<button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체 작업</div><div className="stat-value">{totalCount}</div></div>
        <div className="stat-card"><div className="stat-label">활성 작업</div><div className="stat-value" style={{ color: 'var(--color-success)' }}>{activeCount}</div></div>
        <div className="stat-card"><div className="stat-label">비활성 작업</div><div className="stat-value" style={{ color: 'var(--color-danger)' }}>{totalCount - activeCount}</div></div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          예약 작업이 없습니다. 새 작업을 추가해주세요.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>작업명</th>
                  <th>일정</th>
                  <th>명령/매크로</th>
                  <th>상태</th>
                  <th>마지막 실행</th>
                  <th>다음 실행</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{task.description || ''}</div>
                    </td>
                    <td><code style={{ fontSize: '0.85rem' }}>{task.schedule}</code></td>
                    <td>
                      {task.macro ? (
                        <span className="badge badge-info">{task.macro.name}</span>
                      ) : (
                        <code style={{ fontSize: '0.8rem' }}>{task.command?.substring(0, 30)}...</code>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${task.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {task.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : '-'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {task.nextRunAt ? new Date(task.nextRunAt).toLocaleString() : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(task)}>
                          {task.isActive ? '비활성화' : '활성화'}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(task.id)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => fetchTasks(pagination.page - 1)}>← 이전</button>
          <span style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>{pagination.page} / {pagination.totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTasks(pagination.page + 1)}>다음 →</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">예약 작업 추가</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">작업명</label><input type="text" className="form-input" placeholder="Daily Backup" /></div>
              <div className="form-group"><label className="form-label">설명</label><input type="text" className="form-input" placeholder="매일 자정 백업 실행" /></div>
              <div className="form-group"><label className="form-label">Cron 일정</label><input type="text" className="form-input" placeholder="0 0 * * *" style={{ fontFamily: 'var(--font-mono)' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>예: 0 0 * * * (매일 자정)</div>
              </div>
              <div className="form-group"><label className="form-label">명령어</label><textarea className="form-input" rows={3} placeholder="backup.sh" style={{ fontFamily: 'var(--font-mono)' }} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">추가</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

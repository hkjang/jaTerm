'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  command: string;
  targetServers: string[];
  isActive: boolean;
  lastRunAt: Date | null;
  lastStatus: 'SUCCESS' | 'FAILED' | 'RUNNING' | null;
  nextRunAt: Date;
}

const mockTasks: ScheduledTask[] = [
  { id: '1', name: '일일 백업', description: '데이터베이스 백업', schedule: '0 2 * * *', command: '/scripts/backup.sh', targetServers: ['prod-db-01'], isActive: true, lastRunAt: new Date(Date.now() - 86400000), lastStatus: 'SUCCESS', nextRunAt: new Date(Date.now() + 43200000) },
  { id: '2', name: '로그 정리', description: '30일 이상 로그 삭제', schedule: '0 3 * * 0', command: 'find /var/log -mtime +30 -delete', targetServers: ['prod-web-01', 'prod-api-01'], isActive: true, lastRunAt: new Date(Date.now() - 604800000), lastStatus: 'SUCCESS', nextRunAt: new Date(Date.now() + 259200000) },
  { id: '3', name: '상태 점검', description: '서버 헬스 체크', schedule: '*/30 * * * *', command: '/scripts/healthcheck.sh', targetServers: ['prod-web-01', 'prod-api-01', 'prod-db-01'], isActive: true, lastRunAt: new Date(Date.now() - 1800000), lastStatus: 'RUNNING', nextRunAt: new Date(Date.now() + 1800000) },
  { id: '4', name: '인증서 갱신', description: 'SSL 인증서 자동 갱신', schedule: '0 0 1 * *', command: 'certbot renew', targetServers: ['prod-web-01'], isActive: false, lastRunAt: new Date(Date.now() - 2592000000), lastStatus: 'FAILED', nextRunAt: new Date(Date.now() + 604800000) },
];

export default function SchedulesPage() {
  const [tasks] = useState(mockTasks);
  const [showModal, setShowModal] = useState(false);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'SUCCESS': return { class: 'badge-success', label: '성공' };
      case 'FAILED': return { class: 'badge-danger', label: '실패' };
      case 'RUNNING': return { class: 'badge-warning', label: '실행중' };
      default: return { class: 'badge-info', label: '-' };
    }
  };

  return (
    <AdminLayout title="스케줄 관리" description="자동화 작업 스케줄 및 실행 로그"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 스케줄 추가</button>}>
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체 작업</div><div className="stat-value">{tasks.length}</div></div>
        <div className="stat-card"><div className="stat-label">활성</div><div className="stat-value">{tasks.filter(t => t.isActive).length}</div></div>
        <div className="stat-card"><div className="stat-label">최근 성공</div><div className="stat-value" style={{ color: 'var(--color-success)' }}>{tasks.filter(t => t.lastStatus === 'SUCCESS').length}</div></div>
        <div className="stat-card"><div className="stat-label">최근 실패</div><div className="stat-value" style={{ color: 'var(--color-danger)' }}>{tasks.filter(t => t.lastStatus === 'FAILED').length}</div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>작업</th><th>스케줄</th><th>대상 서버</th><th>상태</th><th>마지막 실행</th><th>다음 실행</th><th>작업</th></tr></thead>
            <tbody>
              {tasks.map(task => {
                const statusBadge = getStatusBadge(task.lastStatus);
                return (
                  <tr key={task.id} style={{ opacity: task.isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{task.description}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{task.schedule}</td>
                    <td><span style={{ fontSize: '0.85rem' }}>{task.targetServers.length}개 서버</span></td>
                    <td>
                      <span className={`badge ${task.isActive ? 'badge-success' : 'badge-danger'}`} style={{ marginRight: '4px' }}>{task.isActive ? '활성' : '비활성'}</span>
                      {task.lastStatus && <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{task.lastRunAt?.toLocaleString() || '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{task.nextRunAt.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm">▶️ 실행</button>
                        <button className="btn btn-ghost btn-sm">수정</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">스케줄 추가</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">작업 이름</label><input type="text" className="form-input" /></div>
              <div className="form-group"><label className="form-label">설명</label><input type="text" className="form-input" /></div>
              <div className="form-group"><label className="form-label">Cron 표현식</label><input type="text" className="form-input" style={{ fontFamily: 'var(--font-mono)' }} placeholder="0 2 * * *" /></div>
              <div className="form-group"><label className="form-label">실행 명령</label><input type="text" className="form-input" style={{ fontFamily: 'var(--font-mono)' }} /></div>
              <div className="form-group"><label className="form-label">롤백 명령 (실패 시)</label><input type="text" className="form-input" style={{ fontFamily: 'var(--font-mono)' }} placeholder="선택 사항" /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">추가</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

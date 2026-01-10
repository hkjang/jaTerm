'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ScheduledJob {
  id: string;
  name: string;
  description: string;
  type: 'CRON' | 'INTERVAL' | 'ONCE';
  schedule: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'RUNNING' | 'FAILED';
  lastRun?: string;
  nextRun?: string;
  lastDuration?: number; // ms
  successCount: number;
  failureCount: number;
  retryCount: number;
  maxRetries: number;
  timeout: number; // seconds
  createdBy: string;
  tags: string[];
}

export default function ScheduledJobsPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const mockJobs: ScheduledJob[] = [
      { id: '1', name: 'daily-backup', description: '매일 새벽 2시 전체 백업', type: 'CRON', schedule: '0 2 * * *', status: 'ACTIVE', lastRun: new Date(Date.now() - 8 * 3600000).toISOString(), nextRun: new Date(Date.now() + 16 * 3600000).toISOString(), lastDuration: 3600000, successCount: 89, failureCount: 2, retryCount: 0, maxRetries: 3, timeout: 7200, createdBy: 'system', tags: ['backup', 'critical'] },
      { id: '2', name: 'session-cleanup', description: '만료된 세션 정리', type: 'INTERVAL', schedule: 'every 1 hour', status: 'ACTIVE', lastRun: new Date(Date.now() - 30 * 60000).toISOString(), nextRun: new Date(Date.now() + 30 * 60000).toISOString(), lastDuration: 5000, successCount: 720, failureCount: 0, retryCount: 0, maxRetries: 1, timeout: 60, createdBy: 'system', tags: ['cleanup'] },
      { id: '3', name: 'audit-log-archive', description: '감사 로그 아카이브', type: 'CRON', schedule: '0 0 * * 0', status: 'ACTIVE', lastRun: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), nextRun: new Date(Date.now() + 4 * 24 * 3600000).toISOString(), lastDuration: 1800000, successCount: 12, failureCount: 0, retryCount: 0, maxRetries: 2, timeout: 3600, createdBy: 'admin', tags: ['audit', 'archive'] },
      { id: '4', name: 'metrics-collector', description: '시스템 메트릭 수집', type: 'INTERVAL', schedule: 'every 5 minutes', status: 'RUNNING', lastRun: new Date(Date.now() - 2 * 60000).toISOString(), nextRun: new Date(Date.now() + 3 * 60000).toISOString(), lastDuration: 2000, successCount: 8640, failureCount: 5, retryCount: 0, maxRetries: 1, timeout: 30, createdBy: 'system', tags: ['monitoring'] },
      { id: '5', name: 'license-check', description: '라이선스 유효성 확인', type: 'CRON', schedule: '0 6 * * *', status: 'ACTIVE', lastRun: new Date(Date.now() - 4 * 3600000).toISOString(), nextRun: new Date(Date.now() + 20 * 3600000).toISOString(), lastDuration: 1500, successCount: 90, failureCount: 0, retryCount: 0, maxRetries: 3, timeout: 60, createdBy: 'system', tags: ['license'] },
      { id: '6', name: 'temp-file-cleanup', description: '임시 파일 정리', type: 'INTERVAL', schedule: 'every 6 hours', status: 'PAUSED', lastRun: new Date(Date.now() - 12 * 3600000).toISOString(), lastDuration: 15000, successCount: 120, failureCount: 3, retryCount: 0, maxRetries: 2, timeout: 300, createdBy: 'admin', tags: ['cleanup'] },
      { id: '7', name: 'failed-db-sync', description: '데이터베이스 동기화', type: 'CRON', schedule: '0 */4 * * *', status: 'FAILED', lastRun: new Date(Date.now() - 2 * 3600000).toISOString(), nextRun: new Date(Date.now() + 2 * 3600000).toISOString(), lastDuration: 0, successCount: 45, failureCount: 8, retryCount: 3, maxRetries: 3, timeout: 600, createdBy: 'system', tags: ['database', 'sync'] },
      { id: '8', name: 'weekly-report', description: '주간 리포트 생성 및 발송', type: 'CRON', schedule: '0 9 * * 1', status: 'ACTIVE', lastRun: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), nextRun: new Date(Date.now() + 5 * 24 * 3600000).toISOString(), lastDuration: 45000, successCount: 52, failureCount: 1, retryCount: 0, maxRetries: 2, timeout: 300, createdBy: 'admin', tags: ['report', 'email'] },
      { id: '9', name: 'one-time-migration', description: '데이터 마이그레이션 (일회성)', type: 'ONCE', schedule: '2026-01-15 03:00', status: 'DISABLED', successCount: 0, failureCount: 0, retryCount: 0, maxRetries: 1, timeout: 7200, createdBy: 'admin', tags: ['migration'] },
    ];
    setJobs(mockJobs);
    setLoading(false);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: '#10b981', bg: '#10b98120', label: '활성', icon: '●' };
      case 'RUNNING': return { color: '#3b82f6', bg: '#3b82f620', label: '실행중', icon: '▶' };
      case 'PAUSED': return { color: '#f59e0b', bg: '#f59e0b20', label: '일시정지', icon: '⏸' };
      case 'DISABLED': return { color: '#6b7280', bg: '#6b728020', label: '비활성', icon: '○' };
      case 'FAILED': return { color: '#ef4444', bg: '#ef444420', label: '실패', icon: '✗' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '?' };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'CRON': return { color: '#8b5cf6', label: 'CRON' };
      case 'INTERVAL': return { color: '#3b82f6', label: '주기' };
      case 'ONCE': return { color: '#f59e0b', label: '일회성' };
      default: return { color: '#6b7280', label: type };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 0) {
      const future = Math.abs(diff);
      const hours = Math.floor(future / 3600000);
      const days = Math.floor(hours / 24);
      if (days > 0) return `${days}일 후`;
      return `${hours}시간 후`;
    }
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}초`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}분`;
    return `${(ms / 3600000).toFixed(1)}시간`;
  };

  const filteredJobs = jobs.filter(j => {
    if (searchQuery && !j.name.toLowerCase().includes(searchQuery.toLowerCase()) && !j.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && j.status !== filterStatus) return false;
    if (filterType !== 'all' && j.type !== filterType) return false;
    return true;
  });

  const activeCount = jobs.filter(j => j.status === 'ACTIVE' || j.status === 'RUNNING').length;
  const failedCount = jobs.filter(j => j.status === 'FAILED').length;
  const totalSuccess = jobs.reduce((sum, j) => sum + j.successCount, 0);
  const totalFailure = jobs.reduce((sum, j) => sum + j.failureCount, 0);

  return (
    <AdminLayout 
      title="예약 작업" 
      description="스케줄러 및 자동화 작업 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 작업</div>
          <div className="stat-value">{jobs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">● 활성</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✗ 실패</div>
          <div className="stat-value" style={{ color: failedCount > 0 ? '#ef4444' : 'inherit' }}>{failedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 성공 횟수</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>{totalSuccess.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">성공률</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{totalSuccess + totalFailure > 0 ? ((totalSuccess / (totalSuccess + totalFailure)) * 100).toFixed(1) : 100}%</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 작업 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 유형</option>
          <option value="CRON">CRON</option>
          <option value="INTERVAL">주기</option>
          <option value="ONCE">일회성</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'ACTIVE', 'RUNNING', 'PAUSED', 'FAILED'].map(status => {
            const config = status !== 'all' ? getStatusConfig(status) : null;
            return (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '전체' : config?.label}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 새 작업</button>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>작업</th>
                  <th>유형</th>
                  <th>스케줄</th>
                  <th>상태</th>
                  <th>마지막 실행</th>
                  <th>다음 실행</th>
                  <th>성공/실패</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => {
                  const statusConfig = getStatusConfig(job.status);
                  const typeConfig = getTypeConfig(job.type);
                  const successRate = job.successCount + job.failureCount > 0 ? (job.successCount / (job.successCount + job.failureCount)) * 100 : 100;
                  return (
                    <tr key={job.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{job.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{job.description}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>{typeConfig.label}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{job.schedule}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        {job.lastRun ? (
                          <div style={{ fontSize: '0.8rem' }}>
                            <div>{getTimeAgo(job.lastRun)}</div>
                            {job.lastDuration !== undefined && <div style={{ color: 'var(--color-text-muted)' }}>{formatDuration(job.lastDuration)}</div>}
                          </div>
                        ) : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: job.nextRun ? 'inherit' : 'var(--color-text-muted)' }}>
                        {job.nextRun ? getTimeAgo(job.nextRun) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '50px', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${successRate}%`, height: '100%', background: successRate > 90 ? '#10b981' : successRate > 70 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{job.successCount}/{job.failureCount}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" title="상세" onClick={() => setSelectedJob(job)}>👁️</button>
                          <button className="btn btn-ghost btn-sm" title="즉시 실행">▶️</button>
                          {job.status === 'ACTIVE' && <button className="btn btn-ghost btn-sm" title="일시정지">⏸️</button>}
                          {job.status === 'PAUSED' && <button className="btn btn-ghost btn-sm" title="재개">▶️</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedJob && (
        <div className="modal-overlay active" onClick={() => setSelectedJob(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⏰ 작업 상세</h3>
              <button className="modal-close" onClick={() => setSelectedJob(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>작업명</div>
                  <div style={{ fontWeight: 600 }}>{selectedJob.name}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>설명</div>
                  <div>{selectedJob.description}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>유형</div>
                  <span style={{ padding: '2px 8px', background: `${getTypeConfig(selectedJob.type).color}20`, color: getTypeConfig(selectedJob.type).color, borderRadius: '4px', fontSize: '0.8rem' }}>{getTypeConfig(selectedJob.type).label}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>스케줄</div>
                  <code>{selectedJob.schedule}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>성공</div>
                  <div style={{ color: '#10b981' }}>{selectedJob.successCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>실패</div>
                  <div style={{ color: selectedJob.failureCount > 0 ? '#ef4444' : 'inherit' }}>{selectedJob.failureCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>재시도 설정</div>
                  <div>{selectedJob.retryCount}/{selectedJob.maxRetries}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>타임아웃</div>
                  <div>{selectedJob.timeout}초</div>
                </div>
                {selectedJob.tags.length > 0 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>태그</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {selectedJob.tags.map(tag => (
                        <span key={tag} style={{ padding: '2px 6px', background: '#3b82f620', color: '#3b82f6', borderRadius: '4px', fontSize: '0.7rem' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary">▶️ 즉시 실행</button>
              <button className="btn btn-secondary">📋 로그 보기</button>
              <button className="btn btn-ghost" onClick={() => setSelectedJob(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">+ 새 예약 작업</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">작업 이름</label>
                <input type="text" className="form-input" placeholder="my-scheduled-job" />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <input type="text" className="form-input" placeholder="작업 설명을 입력하세요" />
              </div>
              <div className="form-group">
                <label className="form-label">유형</label>
                <select className="form-input">
                  <option value="CRON">CRON</option>
                  <option value="INTERVAL">주기</option>
                  <option value="ONCE">일회성</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">스케줄</label>
                <input type="text" className="form-input" placeholder="0 2 * * * 또는 every 1 hour" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">타임아웃 (초)</label>
                  <input type="number" className="form-input" defaultValue={300} />
                </div>
                <div className="form-group">
                  <label className="form-label">최대 재시도</label>
                  <input type="number" className="form-input" defaultValue={3} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>취소</button>
              <button className="btn btn-primary">생성</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

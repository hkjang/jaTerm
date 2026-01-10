'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Backup {
  id: string;
  name: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'MANUAL';
  status: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'SCHEDULED' | 'CANCELLED';
  size: number;
  startedAt: string;
  completedAt?: string;
  duration?: number; // seconds
  path: string;
  server?: { name: string; ip: string };
  retention: number; // days
  createdBy: string;
  encrypted: boolean;
  checksum?: string;
  errorMessage?: string;
}

export default function BackupManagementPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const mockBackups: Backup[] = [
      { id: '1', name: 'daily-backup-20260110', type: 'FULL', status: 'COMPLETED', size: 5368709120, startedAt: new Date(Date.now() - 2 * 3600000).toISOString(), completedAt: new Date(Date.now() - 1 * 3600000).toISOString(), duration: 3600, path: '/backup/daily/20260110.tar.gz', retention: 30, createdBy: 'system', encrypted: true, checksum: 'sha256:a1b2c3d4e5f6...' },
      { id: '2', name: 'db-master-backup', type: 'INCREMENTAL', status: 'COMPLETED', size: 1073741824, startedAt: new Date(Date.now() - 6 * 3600000).toISOString(), completedAt: new Date(Date.now() - 5 * 3600000).toISOString(), duration: 1800, path: '/backup/incremental/db-master-20260110.tar.gz', server: { name: 'db-master-01', ip: '10.0.3.10' }, retention: 14, createdBy: 'system', encrypted: true },
      { id: '3', name: 'manual-config-backup', type: 'MANUAL', status: 'COMPLETED', size: 52428800, startedAt: new Date(Date.now() - 12 * 3600000).toISOString(), completedAt: new Date(Date.now() - 12 * 3600000).toISOString(), duration: 300, path: '/backup/manual/config-20260110.tar.gz', retention: 90, createdBy: '김개발', encrypted: false },
      { id: '4', name: 'nightly-backup', type: 'FULL', status: 'RUNNING', size: 0, startedAt: new Date(Date.now() - 30 * 60000).toISOString(), path: '/backup/nightly/20260110.tar.gz', retention: 7, createdBy: 'system', encrypted: true },
      { id: '5', name: 'weekly-backup-20260105', type: 'FULL', status: 'COMPLETED', size: 10737418240, startedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(), completedAt: new Date(Date.now() - 5 * 24 * 3600000 + 7200000).toISOString(), duration: 7200, path: '/backup/weekly/20260105.tar.gz', retention: 90, createdBy: 'system', encrypted: true, checksum: 'sha256:f1e2d3c4b5a6...' },
      { id: '6', name: 'prod-web-backup', type: 'DIFFERENTIAL', status: 'FAILED', size: 0, startedAt: new Date(Date.now() - 24 * 3600000).toISOString(), path: '/backup/differential/prod-web-20260109.tar.gz', server: { name: 'prod-web-01', ip: '10.0.1.10' }, retention: 14, createdBy: 'system', encrypted: true, errorMessage: 'Disk space insufficient' },
      { id: '7', name: 'scheduled-backup-20260111', type: 'FULL', status: 'SCHEDULED', size: 0, startedAt: new Date(Date.now() + 12 * 3600000).toISOString(), path: '/backup/scheduled/20260111.tar.gz', retention: 30, createdBy: 'system', encrypted: true },
      { id: '8', name: 'log-archive-202601', type: 'INCREMENTAL', status: 'COMPLETED', size: 2147483648, startedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), completedAt: new Date(Date.now() - 3 * 24 * 3600000 + 3600000).toISOString(), duration: 3600, path: '/backup/archive/logs-202601.tar.gz', retention: 365, createdBy: 'system', encrypted: false },
    ];
    setBackups(mockBackups);
    setLoading(false);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { color: '#10b981', bg: '#10b98120', label: '완료', icon: '✓' };
      case 'RUNNING': return { color: '#3b82f6', bg: '#3b82f620', label: '진행중', icon: '⏳' };
      case 'FAILED': return { color: '#ef4444', bg: '#ef444420', label: '실패', icon: '✗' };
      case 'SCHEDULED': return { color: '#8b5cf6', bg: '#8b5cf620', label: '예약됨', icon: '🕐' };
      case 'CANCELLED': return { color: '#6b7280', bg: '#6b728020', label: '취소', icon: '⊘' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '?' };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'FULL': return { color: '#10b981', label: '전체' };
      case 'INCREMENTAL': return { color: '#3b82f6', label: '증분' };
      case 'DIFFERENTIAL': return { color: '#f59e0b', label: '차등' };
      case 'MANUAL': return { color: '#8b5cf6', label: '수동' };
      default: return { color: '#6b7280', label: type };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 0) {
      const future = Math.abs(diff);
      const hours = Math.floor(future / 3600000);
      return `${hours}시간 후`;
    }
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const filteredBackups = backups.filter(b => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && b.type !== filterType) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    return true;
  });

  const totalSize = backups.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + b.size, 0);
  const completedCount = backups.filter(b => b.status === 'COMPLETED').length;
  const runningCount = backups.filter(b => b.status === 'RUNNING').length;
  const failedCount = backups.filter(b => b.status === 'FAILED').length;

  return (
    <AdminLayout 
      title="백업 관리" 
      description="시스템 백업 및 복구 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 백업</div>
          <div className="stat-value">{backups.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 완료</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{completedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⏳ 진행중</div>
          <div className="stat-value" style={{ color: runningCount > 0 ? '#3b82f6' : 'inherit' }}>{runningCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✗ 실패</div>
          <div className="stat-value" style={{ color: failedCount > 0 ? '#ef4444' : 'inherit' }}>{failedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💾 총 용량</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>{formatFileSize(totalSize)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 백업명 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 유형</option>
          <option value="FULL">전체 백업</option>
          <option value="INCREMENTAL">증분 백업</option>
          <option value="DIFFERENTIAL">차등 백업</option>
          <option value="MANUAL">수동 백업</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'COMPLETED', 'RUNNING', 'FAILED', 'SCHEDULED'].map(status => {
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
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 새 백업</button>
      </div>

      {/* Backups Table */}
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
                  <th>이름</th>
                  <th>유형</th>
                  <th>상태</th>
                  <th>크기</th>
                  <th>보관</th>
                  <th>시간</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredBackups.map(backup => {
                  const statusConfig = getStatusConfig(backup.status);
                  const typeConfig = getTypeConfig(backup.type);
                  return (
                    <tr key={backup.id}>
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 500 }}>{backup.name}</span>
                            {backup.encrypted && <span title="암호화됨" style={{ fontSize: '0.9rem' }}>🔒</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{backup.path}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{formatFileSize(backup.size)}</td>
                      <td style={{ fontSize: '0.85rem' }}>{backup.retention}일</td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {getTimeAgo(backup.startedAt)}
                          {backup.duration && <div>{formatDuration(backup.duration)}</div>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" title="상세" onClick={() => setSelectedBackup(backup)}>👁️</button>
                          {backup.status === 'COMPLETED' && (
                            <>
                              <button className="btn btn-ghost btn-sm" title="다운로드">⬇️</button>
                              <button className="btn btn-ghost btn-sm" title="복구">🔄</button>
                            </>
                          )}
                          <button className="btn btn-ghost btn-sm" title="삭제" style={{ color: '#ef4444' }}>🗑️</button>
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
      {selectedBackup && (
        <div className="modal-overlay active" onClick={() => setSelectedBackup(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💾 백업 상세</h3>
              <button className="modal-close" onClick={() => setSelectedBackup(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>백업명</div>
                  <div style={{ fontWeight: 500 }}>{selectedBackup.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>유형</div>
                  <div>{getTypeConfig(selectedBackup.type).label}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>상태</div>
                  <span style={{ padding: '4px 10px', background: getStatusConfig(selectedBackup.status).bg, color: getStatusConfig(selectedBackup.status).color, borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                    {getStatusConfig(selectedBackup.status).label}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>크기</div>
                  <div>{formatFileSize(selectedBackup.size)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>보관 기간</div>
                  <div>{selectedBackup.retention}일</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>경로</div>
                  <code style={{ fontSize: '0.85rem' }}>{selectedBackup.path}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>생성자</div>
                  <div>{selectedBackup.createdBy}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>암호화</div>
                  <div>{selectedBackup.encrypted ? '🔒 예' : '❌ 아니오'}</div>
                </div>
                {selectedBackup.checksum && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>체크섬</div>
                    <code style={{ fontSize: '0.8rem' }}>{selectedBackup.checksum}</code>
                  </div>
                )}
                {selectedBackup.errorMessage && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>오류</div>
                    <div style={{ color: '#ef4444' }}>❌ {selectedBackup.errorMessage}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedBackup.status === 'COMPLETED' && (
                <>
                  <button className="btn btn-secondary">⬇️ 다운로드</button>
                  <button className="btn btn-primary">🔄 복구</button>
                </>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedBackup(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">+ 새 백업 생성</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">백업 이름</label>
                <input type="text" className="form-input" placeholder="my-backup-20260110" />
              </div>
              <div className="form-group">
                <label className="form-label">백업 유형</label>
                <select className="form-input">
                  <option value="FULL">전체 백업</option>
                  <option value="INCREMENTAL">증분 백업</option>
                  <option value="DIFFERENTIAL">차등 백업</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">보관 기간 (일)</label>
                <input type="number" className="form-input" defaultValue={30} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked />
                  <span>암호화 적용</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>취소</button>
              <button className="btn btn-primary">백업 시작</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

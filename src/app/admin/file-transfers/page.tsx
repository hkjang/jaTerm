'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface FileTransfer {
  id: string;
  filename: string;
  size: string;
  direction: 'UPLOAD' | 'DOWNLOAD';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'CANCELLED';
  progress: number;
  server: string;
  remotePath: string;
  user: string;
  startTime: string;
  endTime?: string;
  speed?: string;
}

export default function FileTransfersPage() {
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState<FileTransfer | null>(null);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setTransfers([
      { id: '1', filename: 'config.yaml', size: '2.5 KB', direction: 'DOWNLOAD', status: 'COMPLETED', progress: 100, server: 'prod-api-01', remotePath: '/etc/app/config.yaml', user: '김개발', startTime: '14:30:15', endTime: '14:30:16', speed: '2.5 MB/s' },
      { id: '2', filename: 'database_backup.sql.gz', size: '1.2 GB', direction: 'DOWNLOAD', status: 'IN_PROGRESS', progress: 67, server: 'prod-db-01', remotePath: '/backups/database_backup.sql.gz', user: '이운영', startTime: '14:25:00', speed: '45 MB/s' },
      { id: '3', filename: 'deploy.sh', size: '4.8 KB', direction: 'UPLOAD', status: 'COMPLETED', progress: 100, server: 'staging-web-01', remotePath: '/opt/scripts/deploy.sh', user: '박배포', startTime: '14:20:00', endTime: '14:20:01' },
      { id: '4', filename: 'logs_20260110.tar.gz', size: '890 MB', direction: 'DOWNLOAD', status: 'FAILED', progress: 23, server: 'prod-log-01', remotePath: '/var/logs/logs_20260110.tar.gz', user: '최분석', startTime: '14:15:00' },
      { id: '5', filename: 'ssl_cert.pem', size: '1.8 KB', direction: 'UPLOAD', status: 'COMPLETED', progress: 100, server: 'prod-lb-01', remotePath: '/etc/ssl/certs/ssl_cert.pem', user: '정보안', startTime: '14:10:00', endTime: '14:10:01' },
      { id: '6', filename: 'app-v2.3.0.jar', size: '45 MB', direction: 'UPLOAD', status: 'IN_PROGRESS', progress: 89, server: 'prod-app-02', remotePath: '/opt/app/app-v2.3.0.jar', user: '강릴리즈', startTime: '14:28:00', speed: '12 MB/s' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCancel = (t: FileTransfer) => { setTransfers(transfers.map(tr => tr.id === t.id ? { ...tr, status: 'CANCELLED', progress: tr.progress } : tr)); setSuccess('전송 취소됨'); };
  const handleRetry = (t: FileTransfer) => { setTransfers(transfers.map(tr => tr.id === t.id ? { ...tr, status: 'IN_PROGRESS', progress: 0 } : tr)); setSuccess('재시도 시작'); };
  const handleDelete = (id: string) => { if (confirm('기록 삭제?')) { setTransfers(transfers.filter(t => t.id !== id)); setSuccess('삭제됨'); setSelectedTransfer(null); } };

  const getStatusColor = (s: string) => ({ COMPLETED: '#10b981', IN_PROGRESS: '#3b82f6', FAILED: '#ef4444', CANCELLED: '#6b7280' }[s] || '#6b7280');
  const getDirectionIcon = (d: string) => d === 'UPLOAD' ? '📤' : '📥';

  const filtered = transfers.filter(t => filter === '' || t.status === filter);
  const inProgress = transfers.filter(t => t.status === 'IN_PROGRESS').length;

  return (
    <AdminLayout title="파일 전송" description="SFTP 파일 업로드/다운로드 관리">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{transfers.length}</div></div>
        <div className="stat-card"><div className="stat-label">🔵 진행중</div><div className="stat-value" style={{ color: '#3b82f6' }}>{inProgress}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 완료</div><div className="stat-value" style={{ color: '#10b981' }}>{transfers.filter(t => t.status === 'COMPLETED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{transfers.filter(t => t.status === 'FAILED').length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('')}>전체</button>
        <button className={`btn ${filter === 'IN_PROGRESS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('IN_PROGRESS')}>진행중</button>
        <button className={`btn ${filter === 'COMPLETED' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('COMPLETED')}>완료</button>
        <button className={`btn ${filter === 'FAILED' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('FAILED')}>실패</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>파일</th><th>방향</th><th>크기</th><th>서버</th><th>사용자</th><th>진행률</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>{filtered.map(t => (
              <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTransfer(t)}>
                <td><div style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.filename}</div></td>
                <td>{getDirectionIcon(t.direction)} {t.direction === 'UPLOAD' ? '업로드' : '다운로드'}</td>
                <td>{t.size}</td>
                <td style={{ fontSize: '0.85rem' }}>{t.server}</td>
                <td style={{ fontSize: '0.85rem' }}>{t.user}</td>
                <td style={{ width: 120 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${t.progress}%`, background: getStatusColor(t.status), transition: 'width 0.3s' }} /></div><span style={{ fontSize: '0.8rem' }}>{t.progress}%</span></div></td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(t.status)}20`, color: getStatusColor(t.status), borderRadius: 4, fontSize: '0.75rem' }}>{t.status}</span></td>
                <td onClick={e => e.stopPropagation()}>{t.status === 'IN_PROGRESS' && <button className="btn btn-ghost btn-sm" onClick={() => handleCancel(t)}>⏹️</button>}{t.status === 'FAILED' && <button className="btn btn-ghost btn-sm" onClick={() => handleRetry(t)}>🔄</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedTransfer && (
        <div className="modal-overlay active" onClick={() => setSelectedTransfer(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getDirectionIcon(selectedTransfer.direction)} {selectedTransfer.filename}</h3><button className="modal-close" onClick={() => setSelectedTransfer(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedTransfer.status)}20`, color: getStatusColor(selectedTransfer.status), borderRadius: 6 }}>{selectedTransfer.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedTransfer.direction}</span></div>
            {selectedTransfer.status === 'IN_PROGRESS' && <div style={{ marginBottom: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>진행률</span><span>{selectedTransfer.progress}%</span></div><div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: `${selectedTransfer.progress}%`, background: '#3b82f6', transition: 'width 0.3s' }} /></div></div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>크기:</b> {selectedTransfer.size}</div><div><b>서버:</b> {selectedTransfer.server}</div><div><b>사용자:</b> {selectedTransfer.user}</div>{selectedTransfer.speed && <div><b>속도:</b> {selectedTransfer.speed}</div>}<div><b>시작:</b> {selectedTransfer.startTime}</div>{selectedTransfer.endTime && <div><b>종료:</b> {selectedTransfer.endTime}</div>}</div>
            <div style={{ marginTop: 12 }}><b>원격 경로:</b></div><code style={{ display: 'block', padding: 8, background: 'var(--color-bg-secondary)', borderRadius: 4, marginTop: 4 }}>{selectedTransfer.remotePath}</code>
          </div>
          <div className="modal-footer">{selectedTransfer.status === 'IN_PROGRESS' && <button className="btn btn-secondary" onClick={() => handleCancel(selectedTransfer)}>⏹️ 취소</button>}{selectedTransfer.status === 'FAILED' && <button className="btn btn-primary" onClick={() => handleRetry(selectedTransfer)}>🔄 재시도</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedTransfer.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedTransfer(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

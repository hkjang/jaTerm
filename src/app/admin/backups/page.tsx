'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Backup {
  id: string;
  name: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  target: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'SCHEDULED';
  size: string;
  duration: string;
  createdAt: string;
  nextRun?: string;
  retention: number;
}

const initialBackups: Backup[] = [
  { id: '1', name: 'daily-prod-db', type: 'FULL', target: 'prod-db-01', status: 'COMPLETED', size: '45.2 GB', duration: '32m', createdAt: '2026-01-10 02:00', nextRun: '2026-01-11 02:00', retention: 30 },
  { id: '2', name: 'hourly-config', type: 'INCREMENTAL', target: 'config-server', status: 'COMPLETED', size: '128 MB', duration: '2m', createdAt: '2026-01-10 15:00', nextRun: '2026-01-10 16:00', retention: 7 },
  { id: '3', name: 'weekly-full', type: 'FULL', target: 'all-servers', status: 'SCHEDULED', size: '-', duration: '-', createdAt: '-', nextRun: '2026-01-12 00:00', retention: 90 },
  { id: '4', name: 'daily-logs', type: 'DIFFERENTIAL', target: 'log-server', status: 'RUNNING', size: '2.1 GB', duration: '5m', createdAt: '2026-01-10 15:30', retention: 14 },
  { id: '5', name: 'failed-backup-test', type: 'FULL', target: 'test-server', status: 'FAILED', size: '0 B', duration: '-', createdAt: '2026-01-09 10:00', retention: 7 },
];

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>(initialBackups);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'FULL', target: '', retention: 30 });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newBackup: Backup = { id: String(Date.now()), ...form, type: form.type as Backup['type'], status: 'SCHEDULED', size: '-', duration: '-', createdAt: '-', nextRun: new Date(Date.now() + 3600000).toISOString().slice(0, 16).replace('T', ' ') };
    setBackups([newBackup, ...backups]);
    setSuccess('백업 예약됨');
    setShowCreate(false);
    setForm({ name: '', type: 'FULL', target: '', retention: 30 });
  };

  const handleRunNow = (b: Backup) => {
    setBackups(backups.map(bk => bk.id === b.id ? { ...bk, status: 'RUNNING', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : bk));
    setSuccess(`${b.name} 백업 시작`);
    setTimeout(() => {
      setBackups(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: 'COMPLETED', duration: '5m', size: '1.5 GB' } : bk));
    }, 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제?')) {
      setBackups(backups.filter(b => b.id !== id));
      setSuccess('삭제됨');
      setSelectedBackup(null);
    }
  };

  const getStatusColor = (s: string) => ({ COMPLETED: '#10b981', RUNNING: '#3b82f6', FAILED: '#ef4444', SCHEDULED: '#f59e0b' }[s] || '#6b7280');
  const getTypeColor = (t: string) => ({ FULL: '#8b5cf6', INCREMENTAL: '#10b981', DIFFERENTIAL: '#f59e0b' }[t] || '#6b7280');

  return (
    <AdminLayout title="백업 관리" description="서버 백업 및 복원" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 백업</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{backups.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 완료</div><div className="stat-value" style={{ color: '#10b981' }}>{backups.filter(b => b.status === 'COMPLETED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔄 실행 중</div><div className="stat-value" style={{ color: '#3b82f6' }}>{backups.filter(b => b.status === 'RUNNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{backups.filter(b => b.status === 'FAILED').length}</div></div>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>이름</th><th>유형</th><th>대상</th><th>크기</th><th>시간</th><th>보존</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>{backups.map(b => (
            <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedBackup(b)}>
              <td style={{ fontWeight: 600 }}>{b.name}</td>
              <td><span style={{ padding: '2px 6px', background: `${getTypeColor(b.type)}20`, color: getTypeColor(b.type), borderRadius: 4, fontSize: '0.75rem' }}>{b.type}</span></td>
              <td style={{ fontSize: '0.85rem' }}>{b.target}</td>
              <td style={{ fontSize: '0.85rem' }}>{b.size}</td>
              <td style={{ fontSize: '0.85rem' }}>{b.duration}</td>
              <td style={{ fontSize: '0.85rem' }}>{b.retention}일</td>
              <td><span style={{ padding: '2px 8px', background: `${getStatusColor(b.status)}20`, color: getStatusColor(b.status), borderRadius: 4, fontSize: '0.75rem' }}>{b.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                {b.status !== 'RUNNING' && <button className="btn btn-ghost btn-sm" onClick={() => handleRunNow(b)}>▶️</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(b.id)}>🗑️</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {selectedBackup && (
        <div className="modal-overlay active" onClick={() => setSelectedBackup(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">💾 {selectedBackup.name}</h3><button className="modal-close" onClick={() => setSelectedBackup(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedBackup.status)}20`, color: getStatusColor(selectedBackup.status), borderRadius: 6 }}>{selectedBackup.status}</span><span style={{ padding: '4px 10px', background: `${getTypeColor(selectedBackup.type)}20`, color: getTypeColor(selectedBackup.type), borderRadius: 6 }}>{selectedBackup.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>대상:</b> {selectedBackup.target}</div><div><b>크기:</b> {selectedBackup.size}</div><div><b>소요시간:</b> {selectedBackup.duration}</div><div><b>보존:</b> {selectedBackup.retention}일</div>{selectedBackup.createdAt !== '-' && <div><b>생성:</b> {selectedBackup.createdAt}</div>}{selectedBackup.nextRun && <div><b>다음 실행:</b> {selectedBackup.nextRun}</div>}</div>
          </div>
          <div className="modal-footer">{selectedBackup.status !== 'RUNNING' && <button className="btn btn-primary" onClick={() => { handleRunNow(selectedBackup); setSelectedBackup(null); }}>▶️ 지금 실행</button>}{selectedBackup.status === 'COMPLETED' && <button className="btn btn-secondary">♻️ 복원</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedBackup.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedBackup(null)}>닫기</button></div>
        </div></div>
      )}
      
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">💾 백업 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="daily-prod" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="FULL">전체</option><option value="INCREMENTAL">증분</option><option value="DIFFERENTIAL">차등</option></select></div>
              <div className="form-group"><label className="form-label">보존 (일)</label><input type="number" className="form-input" value={form.retention} onChange={e => setForm({ ...form, retention: parseInt(e.target.value) })} /></div>
            </div>
            <div className="form-group"><label className="form-label">대상</label><input className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} required placeholder="prod-db-01" /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

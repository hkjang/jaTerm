'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface StorageVolume {
  id: string;
  name: string;
  type: 'SSD' | 'HDD' | 'NVMe' | 'NETWORK' | 'OBJECT';
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'SYNCING';
  totalSize: number;
  usedSize: number;
  mountPoint: string;
  iops: number;
  throughput: number;
  attachedTo: string;
}

export default function StorageManagementPage() {
  const [volumes, setVolumes] = useState<StorageVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVolume, setSelectedVolume] = useState<StorageVolume | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'SSD', size: 100, mountPoint: '/mnt/data' });

  useEffect(() => {
    setVolumes([
      { id: '1', name: 'root-volume', type: 'NVMe', status: 'HEALTHY', totalSize: 500, usedSize: 320, mountPoint: '/', iops: 15000, throughput: 2400, attachedTo: 'web-server-01' },
      { id: '2', name: 'data-volume', type: 'SSD', status: 'HEALTHY', totalSize: 2000, usedSize: 1450, mountPoint: '/data', iops: 10000, throughput: 1200, attachedTo: 'db-server-01' },
      { id: '3', name: 'backup-storage', type: 'HDD', status: 'HEALTHY', totalSize: 10000, usedSize: 6500, mountPoint: '/backup', iops: 500, throughput: 200, attachedTo: 'backup-server' },
      { id: '4', name: 'nfs-share', type: 'NETWORK', status: 'SYNCING', totalSize: 5000, usedSize: 2100, mountPoint: '/nfs/share', iops: 3000, throughput: 800, attachedTo: 'shared' },
      { id: '5', name: 's3-bucket', type: 'OBJECT', status: 'HEALTHY', totalSize: 50000, usedSize: 12500, mountPoint: 's3://jaterm-data', iops: 0, throughput: 5000, attachedTo: 'all-services' },
      { id: '6', name: 'temp-volume', type: 'SSD', status: 'DEGRADED', totalSize: 200, usedSize: 195, mountPoint: '/tmp', iops: 8000, throughput: 900, attachedTo: 'api-server-02' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const formatSize = (gb: number) => gb >= 1000 ? (gb / 1000).toFixed(1) + ' TB' : gb + ' GB';
  const getUsagePercent = (v: StorageVolume) => Math.round((v.usedSize / v.totalSize) * 100);
  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setVolumes([{ id: String(Date.now()), name: form.name, type: form.type as StorageVolume['type'], status: 'HEALTHY', totalSize: form.size, usedSize: 0, mountPoint: form.mountPoint, iops: form.type === 'NVMe' ? 15000 : form.type === 'SSD' ? 10000 : 500, throughput: form.type === 'NVMe' ? 2400 : form.type === 'SSD' ? 1200 : 200, attachedTo: '-' }, ...volumes]); setSuccess('볼륨 생성됨'); setShowCreate(false); setForm({ name: '', type: 'SSD', size: 100, mountPoint: '/mnt/data' }); };
  const handleResize = (vol: StorageVolume, newSize: number) => { setVolumes(volumes.map(v => v.id === vol.id ? { ...v, totalSize: newSize } : v)); setSuccess('크기 변경됨'); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setVolumes(volumes.filter(v => v.id !== id)); setSuccess('삭제됨'); setSelectedVolume(null); } };

  const getStatusColor = (s: string) => ({ HEALTHY: '#10b981', DEGRADED: '#f59e0b', FAILED: '#ef4444', SYNCING: '#3b82f6' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ SSD: '💿', HDD: '🖴', NVMe: '⚡', NETWORK: '🌐', OBJECT: '☁️' }[t] || '💾');
  const totalStorage = volumes.reduce((a, v) => a + v.totalSize, 0);
  const usedStorage = volumes.reduce((a, v) => a + v.usedSize, 0);

  return (
    <AdminLayout title="스토리지 관리" description="볼륨 및 저장소 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 볼륨</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 볼륨</div><div className="stat-value">{volumes.length}</div></div>
        <div className="stat-card"><div className="stat-label">총 용량</div><div className="stat-value">{formatSize(totalStorage)}</div></div>
        <div className="stat-card"><div className="stat-label">사용량</div><div className="stat-value">{formatSize(usedStorage)} ({Math.round((usedStorage / totalStorage) * 100)}%)</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 경고</div><div className="stat-value" style={{ color: '#f59e0b' }}>{volumes.filter(v => getUsagePercent(v) > 85).length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {volumes.map(vol => {
            const pct = getUsagePercent(vol);
            const color = pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#10b981';
            return (
              <div key={vol.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(vol.status)}`, cursor: 'pointer' }} onClick={() => setSelectedVolume(vol)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div><span style={{ fontSize: '1.5rem', marginRight: 8 }}>{getTypeIcon(vol.type)}</span><span style={{ fontWeight: 700 }}>{vol.name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{vol.mountPoint}</div></div>
                  <span style={{ padding: '4px 10px', background: `${getStatusColor(vol.status)}20`, color: getStatusColor(vol.status), borderRadius: 6, fontSize: '0.8rem', height: 'fit-content' }}>{vol.status}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}><span>{formatSize(vol.usedSize)} / {formatSize(vol.totalSize)}</span><span style={{ color }}>{pct}%</span></div>
                  <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 4, height: 8, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}><span>IOPS: {vol.iops.toLocaleString()}</span><span>{vol.throughput} MB/s</span></div>
              </div>
            );
          })}
        </div>
      )}
      {selectedVolume && (
        <div className="modal-overlay active" onClick={() => setSelectedVolume(null)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedVolume.type)} {selectedVolume.name}</h3><button className="modal-close" onClick={() => setSelectedVolume(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedVolume.status)}20`, color: getStatusColor(selectedVolume.status), borderRadius: 6 }}>{selectedVolume.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedVolume.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>마운트:</b> {selectedVolume.mountPoint}</div><div><b>연결:</b> {selectedVolume.attachedTo}</div>
              <div><b>용량:</b> {formatSize(selectedVolume.totalSize)}</div><div><b>사용:</b> {formatSize(selectedVolume.usedSize)}</div>
              <div><b>IOPS:</b> {selectedVolume.iops.toLocaleString()}</div><div><b>처리량:</b> {selectedVolume.throughput} MB/s</div>
            </div>
            <div className="form-group"><label className="form-label">크기 조정 (GB)</label><input type="number" className="form-input" defaultValue={selectedVolume.totalSize} onBlur={e => handleResize(selectedVolume, parseInt(e.target.value))} min={selectedVolume.usedSize} /></div>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedVolume.id)}>🗑️ 삭제</button><button className="btn btn-ghost" onClick={() => setSelectedVolume(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">💾 볼륨 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>NVMe</option><option>SSD</option><option>HDD</option><option>NETWORK</option></select></div>
              <div className="form-group"><label className="form-label">크기 (GB)</label><input type="number" className="form-input" value={form.size} onChange={e => setForm({ ...form, size: parseInt(e.target.value) })} /></div>
            </div>
            <div className="form-group"><label className="form-label">마운트 포인트</label><input className="form-input" value={form.mountPoint} onChange={e => setForm({ ...form, mountPoint: e.target.value })} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

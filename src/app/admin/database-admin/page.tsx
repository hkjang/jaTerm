'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DatabaseInstance {
  id: string;
  name: string;
  type: 'MYSQL' | 'POSTGRESQL' | 'MONGODB' | 'REDIS' | 'ELASTICSEARCH';
  status: 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | 'ERROR';
  version: string;
  host: string;
  port: number;
  connections: { active: number; max: number };
  cpu: number;
  memory: number;
  storage: { used: number; total: number };
  replication: 'PRIMARY' | 'REPLICA' | 'STANDALONE';
  lastBackup: string;
}

export default function DatabaseAdminPage() {
  const [databases, setDatabases] = useState<DatabaseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDb, setSelectedDb] = useState<DatabaseInstance | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setDatabases([
      { id: '1', name: 'production-db', type: 'POSTGRESQL', status: 'RUNNING', version: '15.2', host: 'db-prod.internal', port: 5432, connections: { active: 85, max: 200 }, cpu: 45, memory: 72, storage: { used: 450, total: 1000 }, replication: 'PRIMARY', lastBackup: '2026-01-10 06:00' },
      { id: '2', name: 'production-replica', type: 'POSTGRESQL', status: 'RUNNING', version: '15.2', host: 'db-replica.internal', port: 5432, connections: { active: 42, max: 200 }, cpu: 25, memory: 55, storage: { used: 448, total: 1000 }, replication: 'REPLICA', lastBackup: '-' },
      { id: '3', name: 'cache-db', type: 'REDIS', status: 'RUNNING', version: '7.2', host: 'redis.internal', port: 6379, connections: { active: 120, max: 500 }, cpu: 15, memory: 85, storage: { used: 8, total: 16 }, replication: 'PRIMARY', lastBackup: '2026-01-10 04:00' },
      { id: '4', name: 'logs-db', type: 'ELASTICSEARCH', status: 'RUNNING', version: '8.11', host: 'elastic.internal', port: 9200, connections: { active: 25, max: 100 }, cpu: 60, memory: 78, storage: { used: 850, total: 2000 }, replication: 'STANDALONE', lastBackup: '2026-01-10 02:00' },
      { id: '5', name: 'analytics-db', type: 'MONGODB', status: 'MAINTENANCE', version: '7.0', host: 'mongo.internal', port: 27017, connections: { active: 0, max: 150 }, cpu: 0, memory: 0, storage: { used: 320, total: 500 }, replication: 'PRIMARY', lastBackup: '2026-01-09 22:00' },
      { id: '6', name: 'legacy-db', type: 'MYSQL', status: 'STOPPED', version: '8.0', host: 'mysql-legacy.internal', port: 3306, connections: { active: 0, max: 100 }, cpu: 0, memory: 0, storage: { used: 125, total: 200 }, replication: 'STANDALONE', lastBackup: '2026-01-08 00:00' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleStart = (db: DatabaseInstance) => { setDatabases(databases.map(d => d.id === db.id ? { ...d, status: 'RUNNING' } : d)); setSuccess(`${db.name} 시작됨`); };
  const handleStop = (db: DatabaseInstance) => { if (confirm('정지?')) { setDatabases(databases.map(d => d.id === db.id ? { ...d, status: 'STOPPED', connections: { ...d.connections, active: 0 } } : d)); setSuccess(`${db.name} 정지됨`); } };
  const handleBackup = (db: DatabaseInstance) => { setSuccess(`${db.name} 백업 시작...`); };

  const getStatusColor = (s: string) => ({ RUNNING: '#10b981', STOPPED: '#6b7280', MAINTENANCE: '#f59e0b', ERROR: '#ef4444' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ MYSQL: '🐬', POSTGRESQL: '🐘', MONGODB: '🍃', REDIS: '💾', ELASTICSEARCH: '🔍' }[t] || '🗄️');
  const formatSize = (gb: number) => gb >= 1000 ? (gb / 1000).toFixed(1) + ' TB' : gb + ' GB';

  return (
    <AdminLayout title="데이터베이스 관리" description="데이터베이스 인스턴스 모니터링">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 인스턴스</div><div className="stat-value">{databases.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 실행중</div><div className="stat-value" style={{ color: '#10b981' }}>{databases.filter(d => d.status === 'RUNNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">총 연결</div><div className="stat-value">{databases.reduce((a, d) => a + d.connections.active, 0)}</div></div>
        <div className="stat-card"><div className="stat-label">총 스토리지</div><div className="stat-value">{formatSize(databases.reduce((a, d) => a + d.storage.used, 0))}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {databases.map(db => (
            <div key={db.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(db.status)}`, cursor: 'pointer' }} onClick={() => setSelectedDb(db)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontSize: '1.5rem', marginRight: 8 }}>{getTypeIcon(db.type)}</span><span style={{ fontWeight: 700 }}>{db.name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{db.host}:{db.port}</div></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}><span style={{ padding: '2px 8px', background: `${getStatusColor(db.status)}20`, color: getStatusColor(db.status), borderRadius: 4, fontSize: '0.75rem' }}>{db.status}</span>{db.replication !== 'STANDALONE' && <span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.7rem' }}>{db.replication}</span>}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CPU</div><div style={{ fontWeight: 600 }}>{db.cpu}%</div></div>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>메모리</div><div style={{ fontWeight: 600 }}>{db.memory}%</div></div>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>연결</div><div style={{ fontWeight: 600 }}>{db.connections.active}/{db.connections.max}</div></div>
              </div>
              <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}><span>스토리지</span><span>{formatSize(db.storage.used)} / {formatSize(db.storage.total)}</span></div><div style={{ background: 'var(--color-bg-secondary)', borderRadius: 4, height: 6 }}><div style={{ width: `${(db.storage.used / db.storage.total) * 100}%`, height: '100%', background: db.storage.used / db.storage.total > 0.85 ? '#ef4444' : '#10b981', borderRadius: 4 }} /></div></div>
            </div>
          ))}
        </div>
      )}
      {selectedDb && (
        <div className="modal-overlay active" onClick={() => setSelectedDb(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedDb.type)} {selectedDb.name}</h3><button className="modal-close" onClick={() => setSelectedDb(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedDb.status)}20`, color: getStatusColor(selectedDb.status), borderRadius: 6 }}>{selectedDb.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedDb.type} {selectedDb.version}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>호스트:</b> {selectedDb.host}</div><div><b>포트:</b> {selectedDb.port}</div>
              <div><b>CPU:</b> {selectedDb.cpu}%</div><div><b>메모리:</b> {selectedDb.memory}%</div>
              <div><b>연결:</b> {selectedDb.connections.active} / {selectedDb.connections.max}</div><div><b>복제:</b> {selectedDb.replication}</div>
              <div><b>스토리지:</b> {formatSize(selectedDb.storage.used)} / {formatSize(selectedDb.storage.total)}</div><div><b>마지막 백업:</b> {selectedDb.lastBackup}</div>
            </div>
          </div>
          <div className="modal-footer">{selectedDb.status === 'RUNNING' ? <button className="btn btn-secondary" onClick={() => { handleStop(selectedDb); setSelectedDb(null); }}>⏹️ 정지</button> : <button className="btn btn-primary" onClick={() => { handleStart(selectedDb); setSelectedDb(null); }}>▶️ 시작</button>}<button className="btn btn-secondary" onClick={() => handleBackup(selectedDb)}>💾 백업</button><button className="btn btn-ghost" onClick={() => setSelectedDb(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

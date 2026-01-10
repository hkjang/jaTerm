'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CacheEntry {
  id: string;
  key: string;
  type: 'STRING' | 'HASH' | 'LIST' | 'SET' | 'ZSET';
  size: number;
  ttl: number;
  hits: number;
  lastAccess: string;
  namespace: string;
}

interface CacheStats {
  totalKeys: number;
  memoryUsed: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  connections: number;
}

export default function CacheManagementPage() {
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [stats, setStats] = useState<CacheStats>({ totalKeys: 0, memoryUsed: 0, hitRate: 0, missRate: 0, evictions: 0, connections: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNs, setSelectedNs] = useState('all');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setStats({ totalKeys: 15420, memoryUsed: 2.4, hitRate: 94.5, missRate: 5.5, evictions: 1250, connections: 48 });
    setEntries([
      { id: '1', key: 'session:user:12345', type: 'HASH', size: 2048, ttl: 3600, hits: 15000, lastAccess: '2026-01-10 14:26', namespace: 'session' },
      { id: '2', key: 'cache:api:products', type: 'STRING', size: 51200, ttl: 300, hits: 125000, lastAccess: '2026-01-10 14:27', namespace: 'api' },
      { id: '3', key: 'cache:api:users:list', type: 'STRING', size: 25600, ttl: 600, hits: 45000, lastAccess: '2026-01-10 14:25', namespace: 'api' },
      { id: '4', key: 'queue:jobs:pending', type: 'LIST', size: 8192, ttl: -1, hits: 89000, lastAccess: '2026-01-10 14:27', namespace: 'queue' },
      { id: '5', key: 'ratelimit:ip:203.0.113.1', type: 'STRING', size: 64, ttl: 60, hits: 500, lastAccess: '2026-01-10 14:26', namespace: 'ratelimit' },
      { id: '6', key: 'leaderboard:global', type: 'ZSET', size: 102400, ttl: -1, hits: 35000, lastAccess: '2026-01-10 14:20', namespace: 'game' },
      { id: '7', key: 'session:user:67890', type: 'HASH', size: 1536, ttl: 3600, hits: 8500, lastAccess: '2026-01-10 14:22', namespace: 'session' },
      { id: '8', key: 'cache:config:global', type: 'HASH', size: 4096, ttl: -1, hits: 250000, lastAccess: '2026-01-10 14:27', namespace: 'config' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const formatSize = (b: number) => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B';
  const formatTTL = (ttl: number) => ttl < 0 ? '∞' : ttl >= 3600 ? `${Math.floor(ttl / 3600)}h` : ttl >= 60 ? `${Math.floor(ttl / 60)}m` : `${ttl}s`;
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setEntries(entries.filter(e => e.id !== id)); setSuccess('삭제됨'); } };
  const handleFlushNs = (ns: string) => { if (confirm(`${ns} 네임스페이스 전체 삭제?`)) { setEntries(entries.filter(e => e.namespace !== ns)); setSuccess(`${ns} 플러시됨`); } };
  const handleFlushAll = () => { if (confirm('전체 캐시를 삭제하시겠습니까?')) { setEntries([]); setSuccess('전체 캐시 플러시됨'); } };

  const getTypeColor = (t: string) => ({ STRING: '#3b82f6', HASH: '#10b981', LIST: '#f59e0b', SET: '#8b5cf6', ZSET: '#ec4899' }[t] || '#6b7280');
  const namespaces = [...new Set(entries.map(e => e.namespace))];
  const filtered = entries.filter(e => (selectedNs === 'all' || e.namespace === selectedNs) && (search === '' || e.key.includes(search)));

  return (
    <AdminLayout title="캐시 관리" description="Redis/Memcached 캐시 관리" actions={<button className="btn btn-danger" onClick={handleFlushAll}>🗑️ 전체 플러시</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 키</div><div className="stat-value">{stats.totalKeys.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">메모리</div><div className="stat-value">{stats.memoryUsed} GB</div></div>
        <div className="stat-card"><div className="stat-label">✅ 히트율</div><div className="stat-value" style={{ color: '#10b981' }}>{stats.hitRate}%</div></div>
        <div className="stat-card"><div className="stat-label">❌ 미스율</div><div className="stat-value" style={{ color: '#ef4444' }}>{stats.missRate}%</div></div>
        <div className="stat-card"><div className="stat-label">제거</div><div className="stat-value">{stats.evictions.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">연결</div><div className="stat-value">{stats.connections}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 키 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="form-input" value={selectedNs} onChange={e => setSelectedNs(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 NS</option>{namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}</select>
        {selectedNs !== 'all' && <button className="btn btn-secondary" onClick={() => handleFlushNs(selectedNs)}>🗑️ {selectedNs} 플러시</button>}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>키</th><th>타입</th><th>크기</th><th>TTL</th><th>히트</th><th>마지막 접근</th><th>작업</th></tr></thead>
            <tbody>{filtered.map(e => (
              <tr key={e.id}>
                <td><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.key}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{e.namespace}</div></td>
                <td><span style={{ padding: '2px 8px', background: `${getTypeColor(e.type)}20`, color: getTypeColor(e.type), borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>{e.type}</span></td>
                <td>{formatSize(e.size)}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{formatTTL(e.ttl)}</td>
                <td>{e.hits.toLocaleString()}</td>
                <td style={{ fontSize: '0.85rem' }}>{e.lastAccess}</td>
                <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(e.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

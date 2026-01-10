'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface LogStream {
  id: string;
  name: string;
  source: 'APPLICATION' | 'SYSTEM' | 'SECURITY' | 'NETWORK' | 'DATABASE';
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  eventsPerSec: number;
  retentionDays: number;
  storageUsed: number;
  lastEvent: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  source: string;
  message: string;
  metadata: string;
}

export default function LogAggregationPage() {
  const [streams, setStreams] = useState<LogStream[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setStreams([
      { id: '1', name: 'api-logs', source: 'APPLICATION', status: 'ACTIVE', eventsPerSec: 125, retentionDays: 30, storageUsed: 45.2, lastEvent: '2026-01-10 14:27' },
      { id: '2', name: 'syslog', source: 'SYSTEM', status: 'ACTIVE', eventsPerSec: 45, retentionDays: 90, storageUsed: 120.5, lastEvent: '2026-01-10 14:27' },
      { id: '3', name: 'auth-logs', source: 'SECURITY', status: 'ACTIVE', eventsPerSec: 15, retentionDays: 365, storageUsed: 85.3, lastEvent: '2026-01-10 14:26' },
      { id: '4', name: 'network-logs', source: 'NETWORK', status: 'PAUSED', eventsPerSec: 0, retentionDays: 14, storageUsed: 25.8, lastEvent: '2026-01-10 12:00' },
      { id: '5', name: 'db-audit', source: 'DATABASE', status: 'ACTIVE', eventsPerSec: 35, retentionDays: 60, storageUsed: 67.9, lastEvent: '2026-01-10 14:27' },
    ]);
    setLogs([
      { id: '1', timestamp: '2026-01-10 14:27:35.123', level: 'INFO', source: 'api-gateway', message: 'Request processed successfully', metadata: '{"method":"GET","path":"/api/users","status":200}' },
      { id: '2', timestamp: '2026-01-10 14:27:34.892', level: 'WARN', source: 'auth-service', message: 'Rate limit threshold reached', metadata: '{"ip":"203.0.113.50","limit":100}' },
      { id: '3', timestamp: '2026-01-10 14:27:33.456', level: 'ERROR', source: 'payment-service', message: 'Payment gateway timeout', metadata: '{"orderId":"ORD-12345","timeout":30000}' },
      { id: '4', timestamp: '2026-01-10 14:27:32.789', level: 'DEBUG', source: 'user-service', message: 'Database query executed', metadata: '{"query":"SELECT * FROM users","duration":45}' },
      { id: '5', timestamp: '2026-01-10 14:27:31.234', level: 'INFO', source: 'scheduler', message: 'Cron job completed', metadata: '{"job":"cleanup","duration":1250}' },
      { id: '6', timestamp: '2026-01-10 14:27:30.567', level: 'FATAL', source: 'db-master', message: 'Connection pool exhausted', metadata: '{"pool":"primary","max":100}' },
      { id: '7', timestamp: '2026-01-10 14:27:29.890', level: 'INFO', source: 'cache-service', message: 'Cache hit ratio: 94.5%', metadata: '{"hits":12500,"misses":725}' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleToggleStream = (stream: LogStream) => { setStreams(streams.map(s => s.id === stream.id ? { ...s, status: s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : s)); setSuccess(stream.status === 'ACTIVE' ? '일시정지됨' : '재개됨'); };
  const handleExport = () => { setSuccess('로그 내보내기 시작...'); };

  const getLevelColor = (l: string) => ({ DEBUG: '#6b7280', INFO: '#3b82f6', WARN: '#f59e0b', ERROR: '#ef4444', FATAL: '#dc2626' }[l] || '#6b7280');
  const getSourceIcon = (s: string) => ({ APPLICATION: '📱', SYSTEM: '💻', SECURITY: '🔒', NETWORK: '🌐', DATABASE: '🗄️' }[s] || '📝');
  const filtered = logs.filter(l => (selectedLevel === 'all' || l.level === selectedLevel) && (search === '' || l.message.toLowerCase().includes(search.toLowerCase())));
  const totalEps = streams.filter(s => s.status === 'ACTIVE').reduce((a, s) => a + s.eventsPerSec, 0);
  const totalStorage = streams.reduce((a, s) => a + s.storageUsed, 0);

  return (
    <AdminLayout title="로그 집계" description="중앙 로그 관리 및 분석" actions={<button className="btn btn-secondary" onClick={handleExport}>📥 내보내기</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">스트림</div><div className="stat-value">{streams.length}</div></div>
        <div className="stat-card"><div className="stat-label">활성</div><div className="stat-value" style={{ color: '#10b981' }}>{streams.filter(s => s.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">이벤트/초</div><div className="stat-value">{totalEps}</div></div>
        <div className="stat-card"><div className="stat-label">저장소</div><div className="stat-value">{totalStorage.toFixed(1)} GB</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {streams.map(s => (
          <div key={s.id} className="card" style={{ padding: 12, borderLeft: `4px solid ${s.status === 'ACTIVE' ? '#10b981' : s.status === 'PAUSED' ? '#6b7280' : '#ef4444'}`, cursor: 'pointer' }} onClick={() => handleToggleStream(s)}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{getSourceIcon(s.source)} {s.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.eventsPerSec} eps · {s.storageUsed.toFixed(1)} GB</div>
            <div style={{ fontSize: '0.75rem', marginTop: 4, color: s.status === 'ACTIVE' ? '#10b981' : '#6b7280' }}>{s.status}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 로그 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="form-input" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} style={{ maxWidth: 120 }}><option value="all">전체</option><option value="DEBUG">DEBUG</option><option value="INFO">INFO</option><option value="WARN">WARN</option><option value="ERROR">ERROR</option><option value="FATAL">FATAL</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0, maxHeight: 400, overflow: 'auto' }}>
          <table className="table" style={{ fontSize: '0.85rem' }}><thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg-primary)' }}><tr><th>시간</th><th>레벨</th><th>소스</th><th>메시지</th></tr></thead>
            <tbody>{filtered.map(l => (
              <tr key={l.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                <td><span style={{ padding: '2px 6px', background: `${getLevelColor(l.level)}20`, color: getLevelColor(l.level), borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>{l.level}</span></td>
                <td style={{ fontSize: '0.8rem' }}>{l.source}</td>
                <td><div>{l.message}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.metadata}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

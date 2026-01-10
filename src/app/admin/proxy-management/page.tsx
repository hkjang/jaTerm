'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ProxyRule {
  id: string;
  name: string;
  type: 'REVERSE' | 'FORWARD' | 'TRANSPARENT' | 'SOCKS5';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  sourceHost: string;
  targetHost: string;
  targetPort: number;
  ssl: boolean;
  rateLimit: number;
  requestCount: number;
  avgLatency: number;
}

export default function ProxyManagementPage() {
  const [proxies, setProxies] = useState<ProxyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'REVERSE', sourceHost: '', targetHost: '', targetPort: 8080, ssl: true, rateLimit: 1000 });

  useEffect(() => {
    setProxies([
      { id: '1', name: 'api-proxy', type: 'REVERSE', status: 'ACTIVE', sourceHost: 'api.jaterm.io', targetHost: 'internal-api', targetPort: 3000, ssl: true, rateLimit: 5000, requestCount: 125000, avgLatency: 45 },
      { id: '2', name: 'static-proxy', type: 'REVERSE', status: 'ACTIVE', sourceHost: 'cdn.jaterm.io', targetHost: 's3-bucket', targetPort: 443, ssl: true, rateLimit: 10000, requestCount: 890000, avgLatency: 12 },
      { id: '3', name: 'ws-proxy', type: 'REVERSE', status: 'ACTIVE', sourceHost: 'ws.jaterm.io', targetHost: 'ws-server', targetPort: 8080, ssl: true, rateLimit: 2000, requestCount: 45000, avgLatency: 8 },
      { id: '4', name: 'dev-forward', type: 'FORWARD', status: 'ACTIVE', sourceHost: '*', targetHost: 'squid-proxy', targetPort: 3128, ssl: false, rateLimit: 500, requestCount: 12000, avgLatency: 120 },
      { id: '5', name: 'legacy-proxy', type: 'REVERSE', status: 'INACTIVE', sourceHost: 'old.jaterm.io', targetHost: 'legacy-server', targetPort: 80, ssl: false, rateLimit: 100, requestCount: 0, avgLatency: 0 },
      { id: '6', name: 'socks-tunnel', type: 'SOCKS5', status: 'ACTIVE', sourceHost: '0.0.0.0:1080', targetHost: '-', targetPort: 0, ssl: false, rateLimit: 1000, requestCount: 8500, avgLatency: 65 },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setProxies([{ id: String(Date.now()), name: form.name, type: form.type as ProxyRule['type'], status: 'ACTIVE', sourceHost: form.sourceHost, targetHost: form.targetHost, targetPort: form.targetPort, ssl: form.ssl, rateLimit: form.rateLimit, requestCount: 0, avgLatency: 0 }, ...proxies]); setSuccess('프록시 생성됨'); setShowCreate(false); setForm({ name: '', type: 'REVERSE', sourceHost: '', targetHost: '', targetPort: 8080, ssl: true, rateLimit: 1000 }); };
  const handleToggle = (proxy: ProxyRule) => { setProxies(proxies.map(p => p.id === proxy.id ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : p)); setSuccess(proxy.status === 'ACTIVE' ? '비활성화됨' : '활성화됨'); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setProxies(proxies.filter(p => p.id !== id)); setSuccess('삭제됨'); } };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', INACTIVE: '#6b7280', ERROR: '#ef4444' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ REVERSE: '🔄', FORWARD: '➡️', TRANSPARENT: '👁️', SOCKS5: '🧦' }[t] || '🔀');

  return (
    <AdminLayout title="프록시 관리" description="리버스 프록시 및 포워드 프록시 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 프록시</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 프록시</div><div className="stat-value">{proxies.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{proxies.filter(p => p.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">총 요청</div><div className="stat-value">{(proxies.reduce((a, p) => a + p.requestCount, 0) / 1000).toFixed(0)}K</div></div>
        <div className="stat-card"><div className="stat-label">평균 지연</div><div className="stat-value">{Math.round(proxies.filter(p => p.avgLatency > 0).reduce((a, p) => a + p.avgLatency, 0) / proxies.filter(p => p.avgLatency > 0).length || 0)}ms</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>이름</th><th>유형</th><th>소스</th><th>대상</th><th>SSL</th><th>요청</th><th>지연</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>{proxies.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{getTypeIcon(p.type)} {p.name}</td>
                <td><span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{p.type}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{p.sourceHost}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{p.targetHost}:{p.targetPort}</td>
                <td>{p.ssl ? '🔒' : '🔓'}</td>
                <td>{(p.requestCount / 1000).toFixed(1)}K</td>
                <td>{p.avgLatency}ms</td>
                <td><span style={{ color: getStatusColor(p.status) }}>{p.status === 'ACTIVE' ? '🟢' : p.status === 'INACTIVE' ? '⚪' : '🔴'} {p.status}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => handleToggle(p)}>{p.status === 'ACTIVE' ? '⏸️' : '▶️'}</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(p.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔀 프록시 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="REVERSE">Reverse Proxy</option><option value="FORWARD">Forward Proxy</option><option value="SOCKS5">SOCKS5</option></select></div>
            <div className="form-group"><label className="form-label">소스 호스트</label><input className="form-input" value={form.sourceHost} onChange={e => setForm({ ...form, sourceHost: e.target.value })} placeholder="example.jaterm.io" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">대상 호스트</label><input className="form-input" value={form.targetHost} onChange={e => setForm({ ...form, targetHost: e.target.value })} placeholder="internal-service" required /></div>
              <div className="form-group"><label className="form-label">포트</label><input type="number" className="form-input" value={form.targetPort} onChange={e => setForm({ ...form, targetPort: parseInt(e.target.value) })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={form.ssl} onChange={e => setForm({ ...form, ssl: e.target.checked })} />SSL/TLS</label>
              <div className="form-group" style={{ flex: 1 }}><label className="form-label">Rate Limit (req/s)</label><input type="number" className="form-input" value={form.rateLimit} onChange={e => setForm({ ...form, rateLimit: parseInt(e.target.value) })} /></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

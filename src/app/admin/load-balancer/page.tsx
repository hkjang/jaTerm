'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface LoadBalancer {
  id: string;
  name: string;
  type: 'APPLICATION' | 'NETWORK' | 'GATEWAY';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAINING';
  protocol: string;
  port: number;
  algorithm: string;
  backends: { name: string; address: string; status: string }[];
  metrics: { rps: number; conns: number };
}

export default function LoadBalancerPage() {
  const [lbs, setLbs] = useState<LoadBalancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLb, setSelectedLb] = useState<LoadBalancer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'APPLICATION', protocol: 'HTTPS', port: 443, algorithm: 'ROUND_ROBIN' });

  useEffect(() => {
    setLbs([
      { id: '1', name: 'web-lb', type: 'APPLICATION', status: 'ACTIVE', protocol: 'HTTPS', port: 443, algorithm: 'ROUND_ROBIN', backends: [{ name: 'web-1', address: '10.0.1.1:8080', status: 'healthy' }, { name: 'web-2', address: '10.0.1.2:8080', status: 'healthy' }], metrics: { rps: 1250, conns: 4520 } },
      { id: '2', name: 'api-lb', type: 'APPLICATION', status: 'ACTIVE', protocol: 'HTTPS', port: 443, algorithm: 'LEAST_CONN', backends: [{ name: 'api-1', address: '10.0.2.1:3000', status: 'healthy' }, { name: 'api-2', address: '10.0.2.2:3000', status: 'unhealthy' }], metrics: { rps: 890, conns: 2100 } },
      { id: '3', name: 'db-tcp-lb', type: 'NETWORK', status: 'ACTIVE', protocol: 'TCP', port: 5432, algorithm: 'IP_HASH', backends: [{ name: 'pg-1', address: '10.0.3.1:5432', status: 'healthy' }], metrics: { rps: 450, conns: 180 } },
      { id: '4', name: 'internal-gw', type: 'GATEWAY', status: 'DRAINING', protocol: 'HTTPS', port: 8443, algorithm: 'WEIGHTED', backends: [{ name: 'gw-1', address: '10.0.4.1:8080', status: 'draining' }], metrics: { rps: 12, conns: 45 } },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setLbs([{ id: String(Date.now()), name: form.name, type: form.type as LoadBalancer['type'], status: 'ACTIVE', protocol: form.protocol, port: form.port, algorithm: form.algorithm, backends: [], metrics: { rps: 0, conns: 0 } }, ...lbs]); setSuccess('로드밸런서 생성됨'); setShowCreate(false); setForm({ name: '', type: 'APPLICATION', protocol: 'HTTPS', port: 443, algorithm: 'ROUND_ROBIN' }); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setLbs(lbs.filter(l => l.id !== id)); setSuccess('삭제됨'); setSelectedLb(null); } };
  const handleToggle = (lb: LoadBalancer) => { setLbs(lbs.map(l => l.id === lb.id ? { ...l, status: l.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : l)); setSuccess(lb.status === 'ACTIVE' ? '비활성화됨' : '활성화됨'); };

  const getStatus = (s: string) => ({ ACTIVE: '#10b981', INACTIVE: '#6b7280', DRAINING: '#f59e0b' }[s] || '#6b7280');
  const getIcon = (t: string) => ({ APPLICATION: '🌐', NETWORK: '🔌', GATEWAY: '🚪' }[t] || '⚖️');

  return (
    <AdminLayout title="로드 밸런서" description="트래픽 분산 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 로드밸런서</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 LB</div><div className="stat-value">{lbs.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{lbs.filter(l => l.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">백엔드</div><div className="stat-value">{lbs.reduce((a, l) => a + l.backends.length, 0)}</div></div>
        <div className="stat-card"><div className="stat-label">req/s</div><div className="stat-value">{lbs.reduce((a, l) => a + l.metrics.rps, 0).toLocaleString()}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {lbs.map(lb => (
            <div key={lb.id} className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${getStatus(lb.status)}` }} onClick={() => setSelectedLb(lb)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontSize: '1.5rem', marginRight: 8 }}>{getIcon(lb.type)}</span><span style={{ fontWeight: 700 }}>{lb.name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{lb.type} · {lb.protocol}:{lb.port}</div></div>
                <span style={{ padding: '4px 10px', background: `${getStatus(lb.status)}20`, color: getStatus(lb.status), borderRadius: 6, fontSize: '0.8rem', height: 'fit-content' }}>{lb.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>{lb.backends.map((b, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: b.status === 'healthy' ? '#10b981' : '#ef4444' }} title={b.name} />)}<span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{lb.backends.filter(b => b.status === 'healthy').length}/{lb.backends.length}</span></div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem' }}><span><b>{lb.metrics.rps}</b> req/s</span><span><b>{lb.metrics.conns}</b> conns</span></div>
            </div>
          ))}
        </div>
      )}
      {selectedLb && (
        <div className="modal-overlay active" onClick={() => setSelectedLb(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getIcon(selectedLb.type)} {selectedLb.name}</h3><button className="modal-close" onClick={() => setSelectedLb(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatus(selectedLb.status)}20`, color: getStatus(selectedLb.status), borderRadius: 6 }}>{selectedLb.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedLb.algorithm}</span></div>
            <div style={{ marginBottom: 16 }}><b>백엔드</b>{selectedLb.backends.map((b, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--color-bg-secondary)', borderRadius: 6, marginTop: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: b.status === 'healthy' ? '#10b981' : '#ef4444' }} /><span>{b.name}</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{b.address}</span></div>)}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { handleToggle(selectedLb); setSelectedLb(null); }}>{selectedLb.status === 'ACTIVE' ? '⏸️ 비활성화' : '▶️ 활성화'}</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedLb.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedLb(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">⚖️ 로드밸런서 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="APPLICATION">Application</option><option value="NETWORK">Network</option><option value="GATEWAY">Gateway</option></select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">프로토콜</label><select className="form-input" value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })}><option>HTTPS</option><option>HTTP</option><option>TCP</option></select></div>
              <div className="form-group"><label className="form-label">포트</label><input type="number" className="form-input" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) })} /></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

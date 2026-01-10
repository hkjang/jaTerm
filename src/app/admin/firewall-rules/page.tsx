'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface FirewallRule {
  id: string;
  name: string;
  priority: number;
  action: 'ALLOW' | 'DENY' | 'LOG';
  direction: 'INBOUND' | 'OUTBOUND';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY';
  sourceIp: string;
  destIp: string;
  port: string;
  status: 'ACTIVE' | 'INACTIVE';
  hits: number;
  lastHit: string;
}

export default function FirewallRulesPage() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', priority: 100, action: 'ALLOW', direction: 'INBOUND', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '*', port: '443' });

  useEffect(() => {
    setRules([
      { id: '1', name: 'Allow HTTPS', priority: 10, action: 'ALLOW', direction: 'INBOUND', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '*', port: '443', status: 'ACTIVE', hits: 1250000, lastHit: '2026-01-10 14:26' },
      { id: '2', name: 'Allow HTTP', priority: 20, action: 'ALLOW', direction: 'INBOUND', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '*', port: '80', status: 'ACTIVE', hits: 450000, lastHit: '2026-01-10 14:25' },
      { id: '3', name: 'Allow SSH (Admin)', priority: 30, action: 'ALLOW', direction: 'INBOUND', protocol: 'TCP', sourceIp: '10.0.0.0/8', destIp: '*', port: '22', status: 'ACTIVE', hits: 8500, lastHit: '2026-01-10 14:20' },
      { id: '4', name: 'Block Telnet', priority: 40, action: 'DENY', direction: 'INBOUND', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '*', port: '23', status: 'ACTIVE', hits: 12500, lastHit: '2026-01-10 13:45' },
      { id: '5', name: 'Log Suspicious', priority: 50, action: 'LOG', direction: 'INBOUND', protocol: 'ANY', sourceIp: '0.0.0.0/0', destIp: '*', port: '1-1024', status: 'ACTIVE', hits: 35000, lastHit: '2026-01-10 14:26' },
      { id: '6', name: 'Allow Outbound', priority: 100, action: 'ALLOW', direction: 'OUTBOUND', protocol: 'ANY', sourceIp: '*', destIp: '0.0.0.0/0', port: '*', status: 'ACTIVE', hits: 8900000, lastHit: '2026-01-10 14:27' },
      { id: '7', name: 'Deny Default', priority: 999, action: 'DENY', direction: 'INBOUND', protocol: 'ANY', sourceIp: '0.0.0.0/0', destIp: '*', port: '*', status: 'ACTIVE', hits: 560000, lastHit: '2026-01-10 14:26' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setRules([...rules, { id: String(Date.now()), name: form.name, priority: form.priority, action: form.action as FirewallRule['action'], direction: form.direction as FirewallRule['direction'], protocol: form.protocol as FirewallRule['protocol'], sourceIp: form.sourceIp, destIp: form.destIp, port: form.port, status: 'ACTIVE', hits: 0, lastHit: '-' }].sort((a, b) => a.priority - b.priority)); setSuccess('규칙 생성됨'); setShowCreate(false); setForm({ name: '', priority: 100, action: 'ALLOW', direction: 'INBOUND', protocol: 'TCP', sourceIp: '0.0.0.0/0', destIp: '*', port: '443' }); };
  const handleToggle = (rule: FirewallRule) => { setRules(rules.map(r => r.id === rule.id ? { ...r, status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : r)); setSuccess(rule.status === 'ACTIVE' ? '비활성화됨' : '활성화됨'); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setRules(rules.filter(r => r.id !== id)); setSuccess('삭제됨'); } };

  const getActionColor = (a: string) => ({ ALLOW: '#10b981', DENY: '#ef4444', LOG: '#f59e0b' }[a] || '#6b7280');
  const formatHits = (h: number) => h >= 1000000 ? (h / 1000000).toFixed(1) + 'M' : h >= 1000 ? (h / 1000).toFixed(1) + 'K' : String(h);

  return (
    <AdminLayout title="방화벽 규칙" description="네트워크 방화벽 정책 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 규칙</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 규칙</div><div className="stat-value">{rules.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 허용</div><div className="stat-value" style={{ color: '#10b981' }}>{rules.filter(r => r.action === 'ALLOW').length}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 차단</div><div className="stat-value" style={{ color: '#ef4444' }}>{rules.filter(r => r.action === 'DENY').length}</div></div>
        <div className="stat-card"><div className="stat-label">총 히트</div><div className="stat-value">{formatHits(rules.reduce((a, r) => a + r.hits, 0))}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>#</th><th>이름</th><th>동작</th><th>방향</th><th>프로토콜</th><th>소스</th><th>대상</th><th>포트</th><th>히트</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>{rules.map(r => (
              <tr key={r.id} style={{ opacity: r.status === 'INACTIVE' ? 0.5 : 1 }}>
                <td style={{ fontWeight: 600 }}>{r.priority}</td>
                <td>{r.name}</td>
                <td><span style={{ padding: '2px 8px', background: `${getActionColor(r.action)}20`, color: getActionColor(r.action), borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>{r.action}</span></td>
                <td><span style={{ fontSize: '0.85rem' }}>{r.direction === 'INBOUND' ? '⬇️' : '⬆️'} {r.direction}</span></td>
                <td>{r.protocol}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{r.sourceIp}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{r.destIp}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{r.port}</td>
                <td>{formatHits(r.hits)}</td>
                <td><span style={{ color: r.status === 'ACTIVE' ? '#10b981' : '#6b7280' }}>{r.status === 'ACTIVE' ? '🟢' : '⚪'}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => handleToggle(r)}>{r.status === 'ACTIVE' ? '⏸️' : '▶️'}</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(r.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔥 방화벽 규칙 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">우선순위</label><input type="number" className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">동작</label><select className="form-input" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}><option>ALLOW</option><option>DENY</option><option>LOG</option></select></div>
              <div className="form-group"><label className="form-label">방향</label><select className="form-input" value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}><option>INBOUND</option><option>OUTBOUND</option></select></div>
              <div className="form-group"><label className="form-label">프로토콜</label><select className="form-input" value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })}><option>TCP</option><option>UDP</option><option>ICMP</option><option>ANY</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">소스 IP</label><input className="form-input" value={form.sourceIp} onChange={e => setForm({ ...form, sourceIp: e.target.value })} placeholder="0.0.0.0/0" /></div>
              <div className="form-group"><label className="form-label">대상 IP</label><input className="form-input" value={form.destIp} onChange={e => setForm({ ...form, destIp: e.target.value })} placeholder="*" /></div>
            </div>
            <div className="form-group"><label className="form-label">포트</label><input className="form-input" value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} placeholder="443 또는 80-443 또는 *" /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

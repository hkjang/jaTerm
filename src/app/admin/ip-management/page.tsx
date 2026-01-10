'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface IPEntry {
  id: string;
  ip: string;
  type: 'WHITELIST' | 'BLACKLIST';
  reason: string;
  source: 'MANUAL' | 'AUTO' | 'THREAT_INTEL';
  hits: number;
  lastSeen: string;
  expiresAt: string | null;
  addedBy: string;
  addedAt: string;
}

export default function IPManagementPage() {
  const [entries, setEntries] = useState<IPEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ ip: '', type: 'BLACKLIST', reason: '', expiresAt: '' });

  useEffect(() => {
    setEntries([
      { id: '1', ip: '10.0.0.0/8', type: 'WHITELIST', reason: '내부 네트워크', source: 'MANUAL', hits: 125000, lastSeen: '2026-01-10 14:47', expiresAt: null, addedBy: 'admin', addedAt: '2025-01-01' },
      { id: '2', ip: '192.168.0.0/16', type: 'WHITELIST', reason: 'VPN 대역', source: 'MANUAL', hits: 45000, lastSeen: '2026-01-10 14:45', expiresAt: null, addedBy: 'admin', addedAt: '2025-01-01' },
      { id: '3', ip: '203.0.113.50', type: 'WHITELIST', reason: '파트너사 오피스', source: 'MANUAL', hits: 850, lastSeen: '2026-01-10 12:30', expiresAt: '2026-06-30', addedBy: 'security', addedAt: '2025-12-01' },
      { id: '4', ip: '185.220.101.0/24', type: 'BLACKLIST', reason: 'Tor Exit Node', source: 'THREAT_INTEL', hits: 2450, lastSeen: '2026-01-10 14:40', expiresAt: null, addedBy: 'system', addedAt: '2025-06-15' },
      { id: '5', ip: '45.155.205.0/24', type: 'BLACKLIST', reason: '악성 스캐너 대역', source: 'THREAT_INTEL', hits: 1890, lastSeen: '2026-01-10 14:35', expiresAt: null, addedBy: 'system', addedAt: '2025-08-20' },
      { id: '6', ip: '123.45.67.89', type: 'BLACKLIST', reason: '무차별 대입 공격', source: 'AUTO', hits: 5420, lastSeen: '2026-01-10 14:30', expiresAt: '2026-01-17', addedBy: 'auto-block', addedAt: '2026-01-10' },
      { id: '7', ip: '98.76.54.32', type: 'BLACKLIST', reason: '의심스러운 활동', source: 'MANUAL', hits: 156, lastSeen: '2026-01-09 22:15', expiresAt: '2026-02-10', addedBy: 'security', addedAt: '2026-01-09' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleAdd = (e: React.FormEvent) => { e.preventDefault(); setEntries([{ id: String(Date.now()), ip: form.ip, type: form.type as IPEntry['type'], reason: form.reason, source: 'MANUAL', hits: 0, lastSeen: '-', expiresAt: form.expiresAt || null, addedBy: 'admin', addedAt: new Date().toISOString().slice(0, 10) }, ...entries]); setSuccess('IP 추가됨'); setShowAdd(false); setForm({ ip: '', type: 'BLACKLIST', reason: '', expiresAt: '' }); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setEntries(entries.filter(e => e.id !== id)); setSuccess('삭제됨'); } };

  const getTypeColor = (t: string) => t === 'WHITELIST' ? '#10b981' : '#ef4444';
  const getSourceIcon = (s: string) => ({ MANUAL: '👤', AUTO: '🤖', THREAT_INTEL: '🛡️' }[s] || '❓');
  const filtered = entries.filter(e => (filterType === 'all' || e.type === filterType) && (search === '' || e.ip.includes(search) || e.reason.toLowerCase().includes(search.toLowerCase())));
  const whitelistCount = entries.filter(e => e.type === 'WHITELIST').length;
  const blacklistCount = entries.filter(e => e.type === 'BLACKLIST').length;
  const totalBlocked = entries.filter(e => e.type === 'BLACKLIST').reduce((a, e) => a + e.hits, 0);

  return (
    <AdminLayout title="IP 관리" description="화이트리스트/블랙리스트 관리" actions={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ IP</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 항목</div><div className="stat-value">{entries.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 화이트리스트</div><div className="stat-value" style={{ color: '#10b981' }}>{whitelistCount}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 블랙리스트</div><div className="stat-value" style={{ color: '#ef4444' }}>{blacklistCount}</div></div>
        <div className="stat-card"><div className="stat-label">차단 횟수</div><div className="stat-value">{totalBlocked.toLocaleString()}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 IP 또는 사유 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체</option><option value="WHITELIST">화이트리스트</option><option value="BLACKLIST">블랙리스트</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>IP / CIDR</th><th>유형</th><th>사유</th><th>출처</th><th>히트</th><th>마지막 확인</th><th>만료</th><th>작업</th></tr></thead>
            <tbody>{filtered.map(e => (
              <tr key={e.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{e.ip}</td>
                <td><span style={{ padding: '2px 8px', background: `${getTypeColor(e.type)}20`, color: getTypeColor(e.type), borderRadius: 4, fontSize: '0.8rem' }}>{e.type}</span></td>
                <td>{e.reason}</td>
                <td>{getSourceIcon(e.source)} <span style={{ fontSize: '0.85rem' }}>{e.source}</span></td>
                <td>{e.hits.toLocaleString()}</td>
                <td style={{ fontSize: '0.85rem' }}>{e.lastSeen}</td>
                <td style={{ fontSize: '0.85rem' }}>{e.expiresAt || '영구'}</td>
                <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(e.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showAdd && (
        <div className="modal-overlay active" onClick={() => setShowAdd(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🌐 IP 추가</h3><button className="modal-close" onClick={() => setShowAdd(false)}>×</button></div>
          <form onSubmit={handleAdd}><div className="modal-body">
            <div className="form-group"><label className="form-label">IP 또는 CIDR</label><input className="form-input" value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} placeholder="192.168.1.1 또는 10.0.0.0/8" required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="BLACKLIST">블랙리스트</option><option value="WHITELIST">화이트리스트</option></select></div>
            <div className="form-group"><label className="form-label">사유</label><input className="form-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">만료일 (선택)</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>취소</button><button type="submit" className="btn btn-primary">추가</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DNSRecord {
  id: string;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  value: string;
  ttl: number;
  zone: string;
  status: 'ACTIVE' | 'PENDING' | 'ERROR';
  updatedAt: string;
}

export default function DNSManagementPage() {
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [success, setSuccess] = useState('');
  const [filterZone, setFilterZone] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [form, setForm] = useState({ name: '', type: 'A', value: '', ttl: 300, zone: 'jaterm.io' });

  useEffect(() => {
    setRecords([
      { id: '1', name: '@', type: 'A', value: '203.0.113.1', ttl: 300, zone: 'jaterm.io', status: 'ACTIVE', updatedAt: '2026-01-10 10:30' },
      { id: '2', name: 'www', type: 'CNAME', value: 'jaterm.io', ttl: 3600, zone: 'jaterm.io', status: 'ACTIVE', updatedAt: '2026-01-10 09:15' },
      { id: '3', name: 'api', type: 'A', value: '203.0.113.2', ttl: 300, zone: 'jaterm.io', status: 'ACTIVE', updatedAt: '2026-01-09 18:00' },
      { id: '4', name: '@', type: 'MX', value: '10 mail.jaterm.io', ttl: 3600, zone: 'jaterm.io', status: 'ACTIVE', updatedAt: '2026-01-08 14:20' },
      { id: '5', name: '@', type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600, zone: 'jaterm.io', status: 'ACTIVE', updatedAt: '2026-01-07 11:00' },
      { id: '6', name: 'staging', type: 'A', value: '203.0.113.10', ttl: 60, zone: 'dev.jaterm.io', status: 'PENDING', updatedAt: '2026-01-10 12:00' },
      { id: '7', name: 'db', type: 'A', value: '10.0.1.5', ttl: 300, zone: 'internal.jaterm.io', status: 'ACTIVE', updatedAt: '2026-01-09 16:45' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setRecords([{ id: String(Date.now()), ...form, type: form.type as DNSRecord['type'], status: 'PENDING', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }, ...records]); setSuccess('레코드 생성됨'); setShowCreate(false); setForm({ name: '', type: 'A', value: '', ttl: 300, zone: 'jaterm.io' }); };
  const handleUpdate = (rec: DNSRecord) => { setRecords(records.map(r => r.id === rec.id ? { ...rec, status: 'PENDING', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : r)); setSuccess('레코드 수정됨'); setEditRecord(null); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setRecords(records.filter(r => r.id !== id)); setSuccess('삭제됨'); } };

  const getTypeColor = (t: string) => ({ A: '#3b82f6', AAAA: '#8b5cf6', CNAME: '#10b981', MX: '#f59e0b', TXT: '#6b7280', NS: '#ec4899', SRV: '#06b6d4' }[t] || '#6b7280');
  const zones = [...new Set(records.map(r => r.zone))];
  const filtered = records.filter(r => (filterZone === 'all' || r.zone === filterZone) && (filterType === 'all' || r.type === filterType));

  return (
    <AdminLayout title="DNS 관리" description="도메인 레코드 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 레코드</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 레코드</div><div className="stat-value">{records.length}</div></div>
        <div className="stat-card"><div className="stat-label">Zone</div><div className="stat-value">{zones.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{records.filter(r => r.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">⏳ 대기</div><div className="stat-value" style={{ color: '#f59e0b' }}>{records.filter(r => r.status === 'PENDING').length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={filterZone} onChange={e => setFilterZone(e.target.value)} style={{ maxWidth: 180 }}><option value="all">전체 Zone</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select>
        <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 100 }}><option value="all">전체</option><option value="A">A</option><option value="AAAA">AAAA</option><option value="CNAME">CNAME</option><option value="MX">MX</option><option value="TXT">TXT</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>이름</th><th>유형</th><th>값</th><th>TTL</th><th>Zone</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>{filtered.map(r => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.name}</td>
                <td><span style={{ padding: '2px 8px', background: `${getTypeColor(r.type)}20`, color: getTypeColor(r.type), borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>{r.type}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value}</td>
                <td>{r.ttl}s</td>
                <td style={{ fontSize: '0.85rem' }}>{r.zone}</td>
                <td><span style={{ color: r.status === 'ACTIVE' ? '#10b981' : r.status === 'PENDING' ? '#f59e0b' : '#ef4444' }}>{r.status === 'ACTIVE' ? '🟢' : r.status === 'PENDING' ? '⏳' : '❌'}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => setEditRecord(r)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(r.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🌐 DNS 레코드 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">Zone</label><select className="form-input" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="@ 또는 subdomain" required /></div>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>A</option><option>AAAA</option><option>CNAME</option><option>MX</option><option>TXT</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">값</label><input className="form-input" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="IP 또는 도메인" required /></div>
            <div className="form-group"><label className="form-label">TTL (초)</label><select className="form-input" value={form.ttl} onChange={e => setForm({ ...form, ttl: parseInt(e.target.value) })}><option value={60}>60 (1분)</option><option value={300}>300 (5분)</option><option value={3600}>3600 (1시간)</option><option value={86400}>86400 (1일)</option></select></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
      {editRecord && (
        <div className="modal-overlay active" onClick={() => setEditRecord(null)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">✏️ DNS 레코드 수정</h3><button className="modal-close" onClick={() => setEditRecord(null)}>×</button></div>
          <form onSubmit={e => { e.preventDefault(); handleUpdate(editRecord); }}><div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>이름:</b> {editRecord.name}</div><div><b>유형:</b> {editRecord.type}</div>
            </div>
            <div className="form-group"><label className="form-label">값</label><input className="form-input" value={editRecord.value} onChange={e => setEditRecord({ ...editRecord, value: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">TTL</label><select className="form-input" value={editRecord.ttl} onChange={e => setEditRecord({ ...editRecord, ttl: parseInt(e.target.value) })}><option value={60}>60</option><option value={300}>300</option><option value={3600}>3600</option><option value={86400}>86400</option></select></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditRecord(null)}>취소</button><button type="submit" className="btn btn-primary">저장</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

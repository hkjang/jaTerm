'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface GeoEntry {
  country: string;
  countryCode: string;
  users: number;
  sessions: number;
  avgLatency: number;
  blocked: number;
}

interface GeoRule {
  id: string;
  type: 'ALLOW' | 'BLOCK';
  target: string;
  reason: string;
  createdAt: string;
}

export default function GeoAccessPage() {
  const [entries, setEntries] = useState<GeoEntry[]>([]);
  const [rules, setRules] = useState<GeoRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ type: 'BLOCK', target: '', reason: '' });

  useEffect(() => {
    setEntries([
      { country: '대한민국', countryCode: 'KR', users: 1250, sessions: 4500, avgLatency: 15, blocked: 0 },
      { country: '미국', countryCode: 'US', users: 85, sessions: 320, avgLatency: 180, blocked: 5 },
      { country: '일본', countryCode: 'JP', users: 45, sessions: 150, avgLatency: 35, blocked: 0 },
      { country: '싱가포르', countryCode: 'SG', users: 28, sessions: 95, avgLatency: 65, blocked: 0 },
      { country: '중국', countryCode: 'CN', users: 0, sessions: 0, avgLatency: 0, blocked: 450 },
      { country: '러시아', countryCode: 'RU', users: 0, sessions: 0, avgLatency: 0, blocked: 280 },
      { country: '독일', countryCode: 'DE', users: 15, sessions: 42, avgLatency: 220, blocked: 2 },
      { country: '베트남', countryCode: 'VN', users: 8, sessions: 25, avgLatency: 85, blocked: 15 },
    ]);
    setRules([
      { id: '1', type: 'BLOCK', target: 'CN', reason: '보안 정책: 중국 차단', createdAt: '2025-06-01' },
      { id: '2', type: 'BLOCK', target: 'RU', reason: '보안 정책: 러시아 차단', createdAt: '2025-06-01' },
      { id: '3', type: 'ALLOW', target: 'KR', reason: '본사 위치', createdAt: '2025-01-01' },
      { id: '4', type: 'ALLOW', target: 'JP', reason: '지사 위치', createdAt: '2025-03-15' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleAddRule = (e: React.FormEvent) => { e.preventDefault(); setRules([{ id: String(Date.now()), type: form.type as GeoRule['type'], target: form.target, reason: form.reason, createdAt: new Date().toISOString().slice(0, 10) }, ...rules]); setSuccess('규칙 추가됨'); setShowAddRule(false); setForm({ type: 'BLOCK', target: '', reason: '' }); };
  const handleDeleteRule = (id: string) => { if (confirm('삭제?')) { setRules(rules.filter(r => r.id !== id)); setSuccess('삭제됨'); } };

  const getCountryFlag = (code: string) => String.fromCodePoint(...code.split('').map(c => 127397 + c.charCodeAt(0)));
  const totalUsers = entries.reduce((a, e) => a + e.users, 0);
  const totalBlocked = entries.reduce((a, e) => a + e.blocked, 0);
  const allowedCountries = rules.filter(r => r.type === 'ALLOW').length;
  const blockedCountries = rules.filter(r => r.type === 'BLOCK').length;

  return (
    <AdminLayout title="지역 접근 제어" description="국가별 접근 정책 관리" actions={<button className="btn btn-primary" onClick={() => setShowAddRule(true)}>+ 규칙</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 사용자</div><div className="stat-value">{totalUsers.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 허용 국가</div><div className="stat-value" style={{ color: '#10b981' }}>{allowedCountries}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 차단 국가</div><div className="stat-value" style={{ color: '#ef4444' }}>{blockedCountries}</div></div>
        <div className="stat-card"><div className="stat-label">차단된 요청</div><div className="stat-value" style={{ color: '#ef4444' }}>{totalBlocked.toLocaleString()}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>🌍 국가별 현황</div>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
            <table className="table"><thead><tr><th>국가</th><th>사용자</th><th>세션</th><th>지연</th><th>차단</th></tr></thead>
              <tbody>{entries.sort((a, b) => (b.users + b.blocked) - (a.users + a.blocked)).map(e => (
                <tr key={e.countryCode} style={{ background: e.blocked > 0 && e.users === 0 ? '#ef444410' : undefined }}>
                  <td style={{ fontWeight: 600 }}>{getCountryFlag(e.countryCode)} {e.country}</td>
                  <td>{e.users.toLocaleString()}</td>
                  <td>{e.sessions.toLocaleString()}</td>
                  <td>{e.avgLatency > 0 ? `${e.avgLatency}ms` : '-'}</td>
                  <td style={{ color: e.blocked > 0 ? '#ef4444' : 'inherit' }}>{e.blocked > 0 ? e.blocked.toLocaleString() : '-'}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>📋 접근 규칙</div>
          {rules.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ padding: '2px 8px', background: r.type === 'ALLOW' ? '#10b98120' : '#ef444420', color: r.type === 'ALLOW' ? '#10b981' : '#ef4444', borderRadius: 4, fontSize: '0.75rem' }}>{r.type}</span>
              <span style={{ fontWeight: 600 }}>{getCountryFlag(r.target)} {r.target}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', flex: 1 }}>{r.reason}</span>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeleteRule(r.id)}>×</button>
            </div>
          ))}
        </div>
      </div>
      {showAddRule && (
        <div className="modal-overlay active" onClick={() => setShowAddRule(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🌍 접근 규칙 추가</h3><button className="modal-close" onClick={() => setShowAddRule(false)}>×</button></div>
          <form onSubmit={handleAddRule}><div className="modal-body">
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="BLOCK">차단</option><option value="ALLOW">허용</option></select></div>
            <div className="form-group"><label className="form-label">국가 코드</label><input className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value.toUpperCase() })} placeholder="KR, US, JP..." maxLength={2} required /></div>
            <div className="form-group"><label className="form-label">사유</label><input className="form-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="규칙 설명" /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAddRule(false)}>취소</button><button type="submit" className="btn btn-primary">추가</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

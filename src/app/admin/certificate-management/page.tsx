'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Certificate {
  id: string;
  domain: string;
  type: 'SSL/TLS' | 'WILDCARD' | 'MULTI_DOMAIN';
  issuer: string;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'PENDING';
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  fingerprint: string;
}

export default function CertificateManagementPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ domain: '', type: 'SSL/TLS', issuer: "Let's Encrypt", autoRenew: true });

  useEffect(() => {
    setCerts([
      { id: '1', domain: 'jaterm.io', type: 'SSL/TLS', issuer: "Let's Encrypt", status: 'VALID', issuedAt: '2025-12-01', expiresAt: '2026-03-01', autoRenew: true, fingerprint: 'SHA256:AB:CD:EF:12:34:56:78' },
      { id: '2', domain: '*.jaterm.io', type: 'WILDCARD', issuer: 'DigiCert', status: 'VALID', issuedAt: '2025-06-15', expiresAt: '2026-06-15', autoRenew: true, fingerprint: 'SHA256:11:22:33:44:55:66:77' },
      { id: '3', domain: 'api.jaterm.io', type: 'SSL/TLS', issuer: "Let's Encrypt", status: 'EXPIRING', issuedAt: '2025-10-15', expiresAt: '2026-01-15', autoRenew: false, fingerprint: 'SHA256:AA:BB:CC:DD:EE:FF:00' },
      { id: '4', domain: 'staging.jaterm.io', type: 'SSL/TLS', issuer: "Let's Encrypt", status: 'EXPIRED', issuedAt: '2025-07-01', expiresAt: '2025-10-01', autoRenew: false, fingerprint: 'SHA256:99:88:77:66:55:44:33' },
      { id: '5', domain: 'docs.jaterm.io', type: 'SSL/TLS', issuer: 'Cloudflare', status: 'VALID', issuedAt: '2025-11-20', expiresAt: '2026-11-20', autoRenew: true, fingerprint: 'SHA256:FF:EE:DD:CC:BB:AA:99' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setCerts([{ id: String(Date.now()), domain: form.domain, type: form.type as Certificate['type'], issuer: form.issuer, status: 'PENDING', issuedAt: '-', expiresAt: '-', autoRenew: form.autoRenew, fingerprint: '-' }, ...certs]); setSuccess('인증서 발급 요청됨'); setShowCreate(false); setForm({ domain: '', type: 'SSL/TLS', issuer: "Let's Encrypt", autoRenew: true }); };
  const handleRenew = (cert: Certificate) => { setCerts(certs.map(c => c.id === cert.id ? { ...c, status: 'PENDING' } : c)); setSuccess(`${cert.domain} 갱신 요청됨`); setTimeout(() => setCerts(prev => prev.map(c => c.id === cert.id ? { ...c, status: 'VALID', expiresAt: '2026-04-10' } : c)), 2000); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setCerts(certs.filter(c => c.id !== id)); setSuccess('삭제됨'); setSelectedCert(null); } };
  const toggleAutoRenew = (cert: Certificate) => { setCerts(certs.map(c => c.id === cert.id ? { ...c, autoRenew: !c.autoRenew } : c)); setSuccess(cert.autoRenew ? '자동 갱신 비활성화' : '자동 갱신 활성화'); };

  const getStatus = (s: string) => ({ VALID: '#10b981', EXPIRING: '#f59e0b', EXPIRED: '#ef4444', PENDING: '#3b82f6' }[s] || '#6b7280');
  const getStatusLabel = (s: string) => ({ VALID: '✅ 유효', EXPIRING: '⚠️ 만료임박', EXPIRED: '❌ 만료됨', PENDING: '⏳ 대기중' }[s] || s);
  const getDaysLeft = (exp: string) => { const d = Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000); return d > 0 ? `${d}일 남음` : '만료됨'; };

  return (
    <AdminLayout title="인증서 관리" description="SSL/TLS 인증서 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 인증서</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 인증서</div><div className="stat-value">{certs.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 유효</div><div className="stat-value" style={{ color: '#10b981' }}>{certs.filter(c => c.status === 'VALID').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 만료임박</div><div className="stat-value" style={{ color: '#f59e0b' }}>{certs.filter(c => c.status === 'EXPIRING').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 만료</div><div className="stat-value" style={{ color: '#ef4444' }}>{certs.filter(c => c.status === 'EXPIRED').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>도메인</th><th>유형</th><th>발급자</th><th>상태</th><th>만료일</th><th>자동갱신</th><th>작업</th></tr></thead>
            <tbody>{certs.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.domain}</td>
                <td><span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{c.type}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{c.issuer}</td>
                <td><span style={{ color: getStatus(c.status) }}>{getStatusLabel(c.status)}</span></td>
                <td><div>{c.expiresAt}</div>{c.status !== 'PENDING' && <div style={{ fontSize: '0.75rem', color: getStatus(c.status) }}>{getDaysLeft(c.expiresAt)}</div>}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => toggleAutoRenew(c)}>{c.autoRenew ? '🔄 ON' : '⏹️ OFF'}</button></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => setSelectedCert(c)}>👁️</button><button className="btn btn-ghost btn-sm" onClick={() => handleRenew(c)} disabled={c.status === 'PENDING'}>🔄</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(c.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedCert && (
        <div className="modal-overlay active" onClick={() => setSelectedCert(null)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔒 {selectedCert.domain}</h3><button className="modal-close" onClick={() => setSelectedCert(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatus(selectedCert.status)}20`, color: getStatus(selectedCert.status), borderRadius: 6 }}>{getStatusLabel(selectedCert.status)}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedCert.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>발급자:</b> {selectedCert.issuer}</div><div><b>자동갱신:</b> {selectedCert.autoRenew ? 'ON' : 'OFF'}</div>
              <div><b>발급일:</b> {selectedCert.issuedAt}</div><div><b>만료일:</b> {selectedCert.expiresAt}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all' }}>{selectedCert.fingerprint}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { handleRenew(selectedCert); setSelectedCert(null); }}>🔄 갱신</button><button className="btn btn-ghost" onClick={() => setSelectedCert(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔒 인증서 발급</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">도메인</label><input className="form-input" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="example.com" required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>SSL/TLS</option><option>WILDCARD</option><option>MULTI_DOMAIN</option></select></div>
            <div className="form-group"><label className="form-label">발급자</label><select className="form-input" value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })}><option>Let&apos;s Encrypt</option><option>DigiCert</option><option>Cloudflare</option></select></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={form.autoRenew} onChange={e => setForm({ ...form, autoRenew: e.target.checked })} />자동 갱신</label>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">발급</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

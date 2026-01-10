'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface LicenseInfo {
  id: string;
  name: string;
  type: 'PERPETUAL' | 'SUBSCRIPTION' | 'TRIAL' | 'OPEN_SOURCE';
  vendor: string;
  product: string;
  seats: { used: number; total: number };
  cost: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'PENDING';
  expiresAt: string;
  autoRenew: boolean;
  assignedTo: string[];
}

export default function LicenseManagementPage() {
  const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLicenses([
      { id: '1', name: 'jaTerm Enterprise', type: 'SUBSCRIPTION', vendor: 'jaTerm', product: 'jaTerm Platform', seats: { used: 125, total: 200 }, cost: 2500, billingCycle: 'MONTHLY', status: 'ACTIVE', expiresAt: '2027-01-10', autoRenew: true, assignedTo: ['all-employees'] },
      { id: '2', name: 'GitHub Enterprise', type: 'SUBSCRIPTION', vendor: 'GitHub', product: 'GitHub Enterprise Cloud', seats: { used: 85, total: 100 }, cost: 21, billingCycle: 'MONTHLY', status: 'ACTIVE', expiresAt: '2026-06-15', autoRenew: true, assignedTo: ['engineering'] },
      { id: '3', name: 'Slack Business+', type: 'SUBSCRIPTION', vendor: 'Slack', product: 'Business+', seats: { used: 150, total: 200 }, cost: 15, billingCycle: 'MONTHLY', status: 'ACTIVE', expiresAt: '2026-03-01', autoRenew: true, assignedTo: ['all-employees'] },
      { id: '4', name: 'JetBrains All Products', type: 'SUBSCRIPTION', vendor: 'JetBrains', product: 'All Products Pack', seats: { used: 45, total: 50 }, cost: 649, billingCycle: 'YEARLY', status: 'EXPIRING', expiresAt: '2026-02-15', autoRenew: false, assignedTo: ['developers'] },
      { id: '5', name: 'Datadog Pro', type: 'SUBSCRIPTION', vendor: 'Datadog', product: 'Infrastructure Pro', seats: { used: 0, total: 100 }, cost: 15, billingCycle: 'MONTHLY', status: 'ACTIVE', expiresAt: '2026-12-31', autoRenew: true, assignedTo: ['devops', 'sre'] },
      { id: '6', name: 'Legacy Tool', type: 'PERPETUAL', vendor: 'OldVendor', product: 'Legacy Suite', seats: { used: 5, total: 10 }, cost: 5000, billingCycle: 'ONE_TIME', status: 'EXPIRED', expiresAt: '2025-12-31', autoRenew: false, assignedTo: ['legacy-team'] },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleToggleRenew = (l: LicenseInfo) => { setLicenses(licenses.map(lic => lic.id === l.id ? { ...lic, autoRenew: !lic.autoRenew } : lic)); setSuccess(`자동갱신 ${l.autoRenew ? '해제' : '설정'}됨`); };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', EXPIRING: '#f59e0b', EXPIRED: '#ef4444', PENDING: '#6b7280' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ PERPETUAL: '♾️', SUBSCRIPTION: '🔄', TRIAL: '🧪', OPEN_SOURCE: '🆓' }[t] || '📜');
  const formatCost = (cost: number, cycle: string) => `$${cost.toLocaleString()}${cycle === 'MONTHLY' ? '/월' : cycle === 'YEARLY' ? '/년' : ''}`;
  const getSeatsPercent = (l: LicenseInfo) => Math.round((l.seats.used / l.seats.total) * 100);

  const totalMonthlyCost = licenses.filter(l => l.status !== 'EXPIRED').reduce((a, l) => a + (l.billingCycle === 'MONTHLY' ? l.cost * l.seats.total : l.billingCycle === 'YEARLY' ? (l.cost * l.seats.total) / 12 : 0), 0);
  const expiringCount = licenses.filter(l => l.status === 'EXPIRING').length;

  return (
    <AdminLayout title="라이선스 관리" description="소프트웨어 라이선스 관리" actions={<button className="btn btn-primary">+ 라이선스</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 라이선스</div><div className="stat-value">{licenses.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{licenses.filter(l => l.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 만료 예정</div><div className="stat-value" style={{ color: expiringCount > 0 ? '#f59e0b' : '#10b981' }}>{expiringCount}</div></div>
        <div className="stat-card"><div className="stat-label">월 비용</div><div className="stat-value">${Math.round(totalMonthlyCost).toLocaleString()}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>라이선스</th><th>벤더</th><th>시트</th><th>비용</th><th>만료일</th><th>자동갱신</th><th>상태</th></tr></thead>
            <tbody>{licenses.map(l => {
              const seatPct = getSeatsPercent(l);
              return (
                <tr key={l.id} style={{ cursor: 'pointer', opacity: l.status === 'EXPIRED' ? 0.6 : 1 }} onClick={() => setSelectedLicense(l)}>
                  <td><div style={{ fontWeight: 600 }}>{getTypeIcon(l.type)} {l.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{l.product}</div></td>
                  <td>{l.vendor}</td>
                  <td><div>{l.seats.used} / {l.seats.total}</div><div style={{ background: 'var(--color-bg-secondary)', borderRadius: 3, height: 4, marginTop: 4, width: 60 }}><div style={{ width: `${seatPct}%`, height: '100%', background: seatPct > 90 ? '#ef4444' : seatPct > 75 ? '#f59e0b' : '#10b981', borderRadius: 3 }} /></div></td>
                  <td>{formatCost(l.cost * (l.seats.total || 1), l.billingCycle)}</td>
                  <td>{l.expiresAt}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleToggleRenew(l); }}>{l.autoRenew ? '✅' : '⬜'}</button></td>
                  <td><span style={{ padding: '2px 8px', background: `${getStatusColor(l.status)}20`, color: getStatusColor(l.status), borderRadius: 4, fontSize: '0.8rem' }}>{l.status}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      {selectedLicense && (
        <div className="modal-overlay active" onClick={() => setSelectedLicense(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedLicense.type)} {selectedLicense.name}</h3><button className="modal-close" onClick={() => setSelectedLicense(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedLicense.status)}20`, color: getStatusColor(selectedLicense.status), borderRadius: 6 }}>{selectedLicense.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedLicense.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>벤더:</b> {selectedLicense.vendor}</div><div><b>제품:</b> {selectedLicense.product}</div>
              <div><b>시트:</b> {selectedLicense.seats.used} / {selectedLicense.seats.total}</div><div><b>비용:</b> {formatCost(selectedLicense.cost * selectedLicense.seats.total, selectedLicense.billingCycle)}</div>
              <div><b>만료:</b> {selectedLicense.expiresAt}</div><div><b>자동갱신:</b> {selectedLicense.autoRenew ? '예' : '아니오'}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8 }}><b>할당:</b> {selectedLicense.assignedTo.join(', ')}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleToggleRenew(selectedLicense)}>🔄 자동갱신 {selectedLicense.autoRenew ? '해제' : '설정'}</button><button className="btn btn-ghost" onClick={() => setSelectedLicense(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

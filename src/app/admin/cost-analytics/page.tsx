'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CostItem {
  id: string;
  service: string;
  category: 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'DATABASE' | 'OTHER';
  provider: 'AWS' | 'GCP' | 'AZURE' | 'NCLOUD';
  currentMonthCost: number;
  lastMonthCost: number;
  projectedCost: number;
  budget: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

interface CostAlert {
  id: string;
  type: 'OVER_BUDGET' | 'SPIKE' | 'ANOMALY';
  service: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
}

export default function CostAnalyticsPage() {
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');

  useEffect(() => {
    setCosts([
      { id: '1', service: 'EC2 Instances', category: 'COMPUTE', provider: 'AWS', currentMonthCost: 4520, lastMonthCost: 4200, projectedCost: 4800, budget: 5000, trend: 'UP' },
      { id: '2', service: 'S3 Storage', category: 'STORAGE', provider: 'AWS', currentMonthCost: 850, lastMonthCost: 920, projectedCost: 800, budget: 1000, trend: 'DOWN' },
      { id: '3', service: 'RDS Database', category: 'DATABASE', provider: 'AWS', currentMonthCost: 1200, lastMonthCost: 1200, projectedCost: 1200, budget: 1500, trend: 'STABLE' },
      { id: '4', service: 'CloudRun', category: 'COMPUTE', provider: 'GCP', currentMonthCost: 680, lastMonthCost: 550, projectedCost: 750, budget: 700, trend: 'UP' },
      { id: '5', service: 'Cloud Storage', category: 'STORAGE', provider: 'GCP', currentMonthCost: 320, lastMonthCost: 300, projectedCost: 340, budget: 400, trend: 'UP' },
      { id: '6', service: 'Data Transfer', category: 'NETWORK', provider: 'AWS', currentMonthCost: 1850, lastMonthCost: 1500, projectedCost: 2200, budget: 1800, trend: 'UP' },
      { id: '7', service: 'VMs', category: 'COMPUTE', provider: 'AZURE', currentMonthCost: 2100, lastMonthCost: 2000, projectedCost: 2200, budget: 2500, trend: 'UP' },
      { id: '8', service: 'NCloud Server', category: 'COMPUTE', provider: 'NCLOUD', currentMonthCost: 450, lastMonthCost: 450, projectedCost: 450, budget: 500, trend: 'STABLE' },
    ]);
    setAlerts([
      { id: '1', type: 'OVER_BUDGET', service: 'Data Transfer', message: '예산 초과 예상 ($2,200 > $1,800)', severity: 'HIGH', timestamp: '2026-01-10 14:00' },
      { id: '2', type: 'SPIKE', service: 'CloudRun', message: '지난달 대비 23.6% 비용 증가', severity: 'MEDIUM', timestamp: '2026-01-10 10:30' },
      { id: '3', type: 'ANOMALY', service: 'EC2 Instances', message: '비정상적인 사용 패턴 감지', severity: 'LOW', timestamp: '2026-01-09 18:00' },
    ]);
    setLoading(false);
  }, []);

  const formatCurrency = (n: number) => '$' + n.toLocaleString();
  const getChange = (curr: number, last: number) => { const pct = ((curr - last) / last * 100).toFixed(1); return { value: pct, positive: curr >= last }; };
  const getBudgetStatus = (cost: number, budget: number) => { const pct = (cost / budget) * 100; return pct > 100 ? 'OVER' : pct > 85 ? 'WARNING' : 'OK'; };
  const getProviderColor = (p: string) => ({ AWS: '#ff9900', GCP: '#4285f4', AZURE: '#0078d4', NCLOUD: '#1ec800' }[p] || '#6b7280');
  const getCategoryIcon = (c: string) => ({ COMPUTE: '💻', STORAGE: '💾', NETWORK: '🌐', DATABASE: '🗄️', OTHER: '📦' }[c] || '📊');

  const totalCurrent = costs.reduce((a, c) => a + c.currentMonthCost, 0);
  const totalLast = costs.reduce((a, c) => a + c.lastMonthCost, 0);
  const totalProjected = costs.reduce((a, c) => a + c.projectedCost, 0);
  const totalBudget = costs.reduce((a, c) => a + c.budget, 0);
  const filtered = costs.filter(c => (selectedCategory === 'all' || c.category === selectedCategory) && (selectedProvider === 'all' || c.provider === selectedProvider));

  return (
    <AdminLayout title="비용 분석" description="클라우드 비용 모니터링 및 최적화">
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">이번 달 비용</div><div className="stat-value">{formatCurrency(totalCurrent)}</div></div>
        <div className="stat-card"><div className="stat-label">예상 비용</div><div className="stat-value" style={{ color: totalProjected > totalBudget ? '#ef4444' : '#10b981' }}>{formatCurrency(totalProjected)}</div></div>
        <div className="stat-card"><div className="stat-label">총 예산</div><div className="stat-value">{formatCurrency(totalBudget)}</div></div>
        <div className="stat-card"><div className="stat-label">MoM 변화</div><div className="stat-value" style={{ color: totalCurrent > totalLast ? '#ef4444' : '#10b981' }}>{getChange(totalCurrent, totalLast).positive ? '▲' : '▼'} {getChange(totalCurrent, totalLast).value}%</div></div>
      </div>
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {alerts.map(a => (
            <div key={a.id} className="alert" style={{ marginBottom: 8, background: a.severity === 'HIGH' ? '#ef444420' : a.severity === 'MEDIUM' ? '#f59e0b20' : '#3b82f620', borderLeft: `4px solid ${a.severity === 'HIGH' ? '#ef4444' : a.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6'}` }}>
              <span style={{ marginRight: 8 }}>{a.type === 'OVER_BUDGET' ? '💰' : a.type === 'SPIKE' ? '📈' : '⚠️'}</span><b>{a.service}</b>: {a.message}<span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{a.timestamp}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 카테고리</option><option value="COMPUTE">Compute</option><option value="STORAGE">Storage</option><option value="NETWORK">Network</option><option value="DATABASE">Database</option></select>
        <select className="form-input" value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 프로바이더</option><option value="AWS">AWS</option><option value="GCP">GCP</option><option value="AZURE">Azure</option><option value="NCLOUD">NCloud</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>서비스</th><th>카테고리</th><th>프로바이더</th><th>이번 달</th><th>지난 달</th><th>예상</th><th>예산</th><th>상태</th></tr></thead>
            <tbody>{filtered.map(c => {
              const budgetStatus = getBudgetStatus(c.projectedCost, c.budget);
              const change = getChange(c.currentMonthCost, c.lastMonthCost);
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.service}</td>
                  <td>{getCategoryIcon(c.category)} {c.category}</td>
                  <td><span style={{ padding: '2px 8px', background: `${getProviderColor(c.provider)}20`, color: getProviderColor(c.provider), borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>{c.provider}</span></td>
                  <td>{formatCurrency(c.currentMonthCost)}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(c.lastMonthCost)} <span style={{ fontSize: '0.75rem', color: change.positive ? '#ef4444' : '#10b981' }}>{change.positive ? '▲' : '▼'}{change.value}%</span></td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(c.projectedCost)}</td>
                  <td>{formatCurrency(c.budget)}</td>
                  <td><span style={{ padding: '2px 8px', background: budgetStatus === 'OVER' ? '#ef444420' : budgetStatus === 'WARNING' ? '#f59e0b20' : '#10b98120', color: budgetStatus === 'OVER' ? '#ef4444' : budgetStatus === 'WARNING' ? '#f59e0b' : '#10b981', borderRadius: 4, fontSize: '0.8rem' }}>{budgetStatus === 'OVER' ? '초과' : budgetStatus === 'WARNING' ? '주의' : '정상'}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

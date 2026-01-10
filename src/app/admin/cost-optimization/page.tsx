'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CostItem {
  id: string;
  name: string;
  category: 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'DATABASE' | 'AI_ML' | 'OTHER';
  provider: 'AWS' | 'GCP' | 'AZURE' | 'ON_PREM';
  currentCost: number;
  previousCost: number;
  trend: number;
  optimization: { savings: number; recommendation: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' };
  tags: { team: string; project: string; environment: string };
}

interface CostSummary {
  totalMonthly: number;
  byCategory: Record<string, number>;
  byProvider: Record<string, number>;
  potentialSavings: number;
  recommendations: number;
}

export default function CostOptimizationPage() {
  const [items, setItems] = useState<CostItem[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations'>('overview');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    const mockItems: CostItem[] = [
      { id: '1', name: 'EC2 Production', category: 'COMPUTE', provider: 'AWS', currentCost: 4520.80, previousCost: 4380.50, trend: 3.2, optimization: { savings: 850, recommendation: 'Reserved Instance로 전환 시 평균 40% 절감', priority: 'HIGH' }, tags: { team: 'Platform', project: 'Core', environment: 'Production' } },
      { id: '2', name: 'S3 Data Lake', category: 'STORAGE', provider: 'AWS', currentCost: 1850.20, previousCost: 1720.00, trend: 7.5, optimization: { savings: 420, recommendation: 'Intelligent-Tiering으로 자동 계층화', priority: 'MEDIUM' }, tags: { team: 'Data', project: 'Analytics', environment: 'Production' } },
      { id: '3', name: 'RDS PostgreSQL', category: 'DATABASE', provider: 'AWS', currentCost: 2340.00, previousCost: 2340.00, trend: 0, optimization: { savings: 200, recommendation: 'Multi-AZ 비사용 시간대 일시 중지', priority: 'LOW' }, tags: { team: 'Platform', project: 'Core', environment: 'Production' } },
      { id: '4', name: 'GKE Cluster', category: 'COMPUTE', provider: 'GCP', currentCost: 3180.50, previousCost: 3450.20, trend: -7.8, optimization: { savings: 600, recommendation: 'Preemptible VM으로 전환 가능한 워크로드 검토', priority: 'HIGH' }, tags: { team: 'Platform', project: 'K8S', environment: 'Production' } },
      { id: '5', name: 'BigQuery', category: 'DATABASE', provider: 'GCP', currentCost: 890.40, previousCost: 650.80, trend: 36.8, optimization: { savings: 320, recommendation: '쿼리 최적화 및 Slot Reservations 도입', priority: 'HIGH' }, tags: { team: 'Data', project: 'Analytics', environment: 'Production' } },
      { id: '6', name: 'Azure VMs Dev', category: 'COMPUTE', provider: 'AZURE', currentCost: 1250.00, previousCost: 1250.00, trend: 0, optimization: { savings: 1050, recommendation: '개발 환경 야간/주말 자동 종료', priority: 'HIGH' }, tags: { team: 'Dev', project: 'Development', environment: 'Development' } },
      { id: '7', name: 'Networking (NAT)', category: 'NETWORK', provider: 'AWS', currentCost: 680.30, previousCost: 580.20, trend: 17.3, optimization: { savings: 250, recommendation: 'VPC Endpoints로 NAT Gateway 트래픽 감소', priority: 'MEDIUM' }, tags: { team: 'Infra', project: 'Network', environment: 'Production' } },
      { id: '8', name: 'AI/ML SageMaker', category: 'AI_ML', provider: 'AWS', currentCost: 1540.00, previousCost: 980.00, trend: 57.1, optimization: { savings: 450, recommendation: 'Spot Instance Training 활용', priority: 'MEDIUM' }, tags: { team: 'ML', project: 'Recommendation', environment: 'Production' } },
    ];
    
    const mockSummary: CostSummary = {
      totalMonthly: 16252.20,
      byCategory: { COMPUTE: 8951.30, STORAGE: 1850.20, DATABASE: 3230.40, NETWORK: 680.30, AI_ML: 1540.00 },
      byProvider: { AWS: 11831.30, GCP: 4070.90, AZURE: 1250.00, ON_PREM: 0 },
      potentialSavings: 4140,
      recommendations: 8,
    };
    setItems(mockItems);
    setSummary(mockSummary);
    setLoading(false);
  }, []);

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'COMPUTE': return { color: '#3b82f6', icon: '🖥️', label: '컴퓨팅' };
      case 'STORAGE': return { color: '#10b981', icon: '💾', label: '스토리지' };
      case 'DATABASE': return { color: '#8b5cf6', icon: '🗄️', label: '데이터베이스' };
      case 'NETWORK': return { color: '#f59e0b', icon: '🌐', label: '네트워크' };
      case 'AI_ML': return { color: '#ec4899', icon: '🤖', label: 'AI/ML' };
      case 'OTHER': return { color: '#6b7280', icon: '📦', label: '기타' };
      default: return { color: '#6b7280', icon: '?', label: category };
    }
  };

  const getProviderConfig = (provider: string) => {
    switch (provider) {
      case 'AWS': return { color: '#f59e0b', icon: '☁️' };
      case 'GCP': return { color: '#3b82f6', icon: '🔷' };
      case 'AZURE': return { color: '#0078d4', icon: '🔵' };
      case 'ON_PREM': return { color: '#10b981', icon: '🏢' };
      default: return { color: '#6b7280', icon: '?' };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGH': return { color: '#ef4444', label: '높음' };
      case 'MEDIUM': return { color: '#f59e0b', label: '중간' };
      case 'LOW': return { color: '#10b981', label: '낮음' };
      default: return { color: '#6b7280', label: priority };
    }
  };

  const filteredItems = filterCategory === 'all' ? items : items.filter(i => i.category === filterCategory);
  const sortedByTrend = [...items].sort((a, b) => b.trend - a.trend);
  const sortedBySavings = [...items].sort((a, b) => b.optimization.savings - a.optimization.savings);

  return (
    <AdminLayout title="비용 최적화" description="클라우드 비용 분석 및 절감 권장사항">
      {/* Summary Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">월 총 비용</div><div className="stat-value">${summary?.totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 0 }) || 0}</div></div>
        <div className="stat-card"><div className="stat-label">AWS</div><div className="stat-value" style={{ color: '#f59e0b' }}>${summary?.byProvider.AWS?.toLocaleString(undefined, { minimumFractionDigits: 0 }) || 0}</div></div>
        <div className="stat-card"><div className="stat-label">GCP</div><div className="stat-value" style={{ color: '#3b82f6' }}>${summary?.byProvider.GCP?.toLocaleString(undefined, { minimumFractionDigits: 0 }) || 0}</div></div>
        <div className="stat-card"><div className="stat-label">Azure</div><div className="stat-value" style={{ color: '#0078d4' }}>${summary?.byProvider.AZURE?.toLocaleString(undefined, { minimumFractionDigits: 0 }) || 0}</div></div>
        <div className="stat-card"><div className="stat-label">💰 절감 가능</div><div className="stat-value" style={{ color: '#10b981' }}>${summary?.potentialSavings.toLocaleString() || 0}</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
        <button className={`btn btn-ghost ${activeTab === 'overview' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('overview')} style={{ borderRadius: '8px 8px 0 0' }}>📊 개요</button>
        <button className={`btn btn-ghost ${activeTab === 'details' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('details')} style={{ borderRadius: '8px 8px 0 0' }}>📋 상세</button>
        <button className={`btn btn-ghost ${activeTab === 'recommendations' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('recommendations')} style={{ borderRadius: '8px 8px 0 0' }}>💡 권장사항</button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>📈 비용 증가 Top 5</div>
            {sortedByTrend.slice(0, 5).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                <span>{getCategoryConfig(item.category).icon} {item.name}</span>
                <span style={{ color: item.trend > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>💰 절감 가능 Top 5</div>
            {sortedBySavings.slice(0, 5).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                <span>{getCategoryConfig(item.category).icon} {item.name}</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>-${item.optimization.savings.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '16px', gridColumn: 'span 2' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>📊 카테고리별 분포</div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {summary && Object.entries(summary.byCategory).map(([cat, cost]) => {
                const config = getCategoryConfig(cat);
                const percent = ((cost / summary.totalMonthly) * 100).toFixed(1);
                return (
                  <div key={cat} style={{ minWidth: '140px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><span>{config.icon}</span><span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{config.label}</span></div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>${cost.toLocaleString()}</div>
                    <div style={{ height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}><div style={{ width: `${percent}%`, height: '100%', background: config.color, borderRadius: '3px' }} /></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{percent}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ maxWidth: '150px' }}>
              <option value="all">전체 카테고리</option>
              <option value="COMPUTE">컴퓨팅</option>
              <option value="STORAGE">스토리지</option>
              <option value="DATABASE">데이터베이스</option>
              <option value="NETWORK">네트워크</option>
              <option value="AI_ML">AI/ML</option>
            </select>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>리소스</th><th>카테고리</th><th>프로바이더</th><th>현재 비용</th><th>변동</th><th>절감 가능</th><th>Team/Project</th></tr></thead>
                <tbody>
                  {filteredItems.map(item => {
                    const catConfig = getCategoryConfig(item.category);
                    const provConfig = getProviderConfig(item.provider);
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td><span style={{ padding: '3px 10px', background: `${catConfig.color}20`, color: catConfig.color, borderRadius: '6px', fontSize: '0.8rem' }}>{catConfig.icon} {catConfig.label}</span></td>
                        <td><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{provConfig.icon} {item.provider}</span></td>
                        <td style={{ fontWeight: 600 }}>${item.currentCost.toLocaleString()}</td>
                        <td><span style={{ color: item.trend > 0 ? '#ef4444' : item.trend < 0 ? '#10b981' : 'inherit' }}>{item.trend > 0 ? '↑' : item.trend < 0 ? '↓' : '-'} {Math.abs(item.trend).toFixed(1)}%</span></td>
                        <td style={{ color: '#10b981' }}>-${item.optimization.savings.toLocaleString()}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.tags.team} / {item.tags.project}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {sortedBySavings.map(item => {
            const priorityConfig = getPriorityConfig(item.optimization.priority);
            return (
              <div key={item.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${priorityConfig.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>💡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <span style={{ padding: '2px 8px', background: `${priorityConfig.color}20`, color: priorityConfig.color, borderRadius: '4px', fontSize: '0.75rem' }}>{priorityConfig.label} 우선순위</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.optimization.recommendation}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>-${item.optimization.savings.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>월 예상 절감</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Resource {
  id: string;
  name: string;
  type: 'CPU' | 'MEMORY' | 'STORAGE' | 'NETWORK' | 'GPU';
  current: number;
  projected: number;
  capacity: number;
  trend: number;
  timeToExhaustion: string;
  recommendations: string[];
}

interface Forecast {
  date: string;
  cpu: number;
  memory: number;
  storage: number;
}

export default function CapacityPlanningPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'forecast' | 'alerts'>('current');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const mockResources: Resource[] = [
      { id: '1', name: 'Production Cluster CPU', type: 'CPU', current: 72, projected: 85, capacity: 1000, trend: 5.2, timeToExhaustion: '45일', recommendations: ['노드 2개 추가 권장', 'Spot Instance 활용 고려'] },
      { id: '2', name: 'Production Memory', type: 'MEMORY', current: 68, projected: 78, capacity: 512, trend: 3.8, timeToExhaustion: '60일', recommendations: ['메모리 최적화 워크로드 검토', '캐시 정책 조정'] },
      { id: '3', name: 'Data Lake Storage', type: 'STORAGE', current: 82, projected: 95, capacity: 50000, trend: 8.5, timeToExhaustion: '21일', recommendations: ['데이터 보존 정책 검토', '콜드 스토리지 이전', '스토리지 클래스 변경'] },
      { id: '4', name: 'Network Bandwidth', type: 'NETWORK', current: 45, projected: 52, capacity: 10000, trend: 2.1, timeToExhaustion: '120일+', recommendations: ['현재 충분한 여유'] },
      { id: '5', name: 'GPU Cluster', type: 'GPU', current: 88, projected: 95, capacity: 16, trend: 12.3, timeToExhaustion: '14일', recommendations: ['GPU 노드 확장 긴급', 'Spot GPU 인스턴스 추가', 'Job 스케줄링 최적화'] },
      { id: '6', name: 'Dev Environment CPU', type: 'CPU', current: 35, projected: 40, capacity: 200, trend: 1.5, timeToExhaustion: '180일+', recommendations: ['현재 적정 수준'] },
      { id: '7', name: 'Staging Memory', type: 'MEMORY', current: 55, projected: 62, capacity: 128, trend: 2.8, timeToExhaustion: '90일', recommendations: ['모니터링 유지'] },
      { id: '8', name: 'Backup Storage', type: 'STORAGE', current: 76, projected: 88, capacity: 20000, trend: 6.2, timeToExhaustion: '35일', recommendations: ['백업 보존 주기 조정', '증분 백업 비율 증가'] },
    ];
    
    const mockForecasts: Forecast[] = [
      { date: '1월', cpu: 72, memory: 68, storage: 82 },
      { date: '2월', cpu: 76, memory: 71, storage: 86 },
      { date: '3월', cpu: 80, memory: 74, storage: 90 },
      { date: '4월', cpu: 85, memory: 78, storage: 94 },
      { date: '5월', cpu: 88, memory: 81, storage: 97 },
      { date: '6월', cpu: 92, memory: 85, storage: 99 },
    ];
    
    setResources(mockResources);
    setForecasts(mockForecasts);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'CPU': return { color: '#3b82f6', icon: '🔲', unit: 'vCPU' };
      case 'MEMORY': return { color: '#8b5cf6', icon: '🧠', unit: 'GB' };
      case 'STORAGE': return { color: '#10b981', icon: '💾', unit: 'GB' };
      case 'NETWORK': return { color: '#f59e0b', icon: '🌐', unit: 'Mbps' };
      case 'GPU': return { color: '#ec4899', icon: '🎮', unit: 'Units' };
      default: return { color: '#6b7280', icon: '?', unit: '' };
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 75) return '#f59e0b';
    if (percent >= 50) return '#3b82f6';
    return '#10b981';
  };

  const filteredResources = filterType === 'all' ? resources : resources.filter(r => r.type === filterType);
  const criticalResources = resources.filter(r => r.current >= 80);
  const warningResources = resources.filter(r => r.current >= 60 && r.current < 80);

  return (
    <AdminLayout title="용량 계획" description="리소스 용량 예측 및 계획 관리">
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 리소스</div><div className="stat-value">{resources.length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 위험</div><div className="stat-value" style={{ color: '#ef4444' }}>{criticalResources.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟡 경고</div><div className="stat-value" style={{ color: '#f59e0b' }}>{warningResources.length}</div></div>
        <div className="stat-card"><div className="stat-label">평균 사용률</div><div className="stat-value">{Math.round(resources.reduce((s, r) => s + r.current, 0) / resources.length)}%</div></div>
        <div className="stat-card"><div className="stat-label">권장사항</div><div className="stat-value">{resources.reduce((s, r) => s + r.recommendations.length, 0)}</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
        <button className={`btn btn-ghost ${activeTab === 'current' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('current')} style={{ borderRadius: '8px 8px 0 0' }}>📊 현재 상태</button>
        <button className={`btn btn-ghost ${activeTab === 'forecast' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('forecast')} style={{ borderRadius: '8px 8px 0 0' }}>📈 예측</button>
        <button className={`btn btn-ghost ${activeTab === 'alerts' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('alerts')} style={{ borderRadius: '8px 8px 0 0' }}>⚠️ 경고</button>
      </div>

      {/* Current Tab */}
      {activeTab === 'current' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
              <option value="all">전체</option>
              <option value="CPU">CPU</option>
              <option value="MEMORY">MEMORY</option>
              <option value="STORAGE">STORAGE</option>
              <option value="NETWORK">NETWORK</option>
              <option value="GPU">GPU</option>
            </select>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredResources.map(r => {
                const typeConfig = getTypeConfig(r.type);
                const usageColor = getUsageColor(r.current);
                return (
                  <div key={r.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${usageColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{typeConfig.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.type} • 잔여: {r.timeToExhaustion}</div>
                      </div>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: usageColor }}>{r.current}%</span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        <span>사용량</span>
                        <span>{(r.capacity * r.current / 100).toFixed(0)} / {r.capacity} {typeConfig.unit}</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: `${r.current}%`, height: '100%', background: usageColor, borderRadius: '4px' }} />
                        <div style={{ position: 'absolute', left: `${r.projected}%`, top: 0, width: '2px', height: '100%', background: '#6b7280' }} title={`예상: ${r.projected}%`} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                      <span>예상: <b>{r.projected}%</b></span>
                      <span style={{ color: r.trend > 0 ? '#ef4444' : '#10b981' }}>추세: {r.trend > 0 ? '+' : ''}{r.trend}%/월</span>
                    </div>
                    {r.recommendations.length > 0 && (
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>💡 권장사항:</div>
                        {r.recommendations.slice(0, 2).map((rec, i) => <div key={i} style={{ color: 'var(--color-text-muted)' }}>• {rec}</div>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Forecast Tab */}
      {activeTab === 'forecast' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>📈 6개월 용량 예측</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', textAlign: 'center' }}>
            {forecasts.map(f => (
              <div key={f.date} style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: '10px' }}>{f.date}</div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CPU</div>
                  <div style={{ height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}><div style={{ width: `${f.cpu}%`, height: '100%', background: getUsageColor(f.cpu), borderRadius: '3px' }} /></div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: getUsageColor(f.cpu) }}>{f.cpu}%</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>MEMORY</div>
                  <div style={{ height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}><div style={{ width: `${f.memory}%`, height: '100%', background: getUsageColor(f.memory), borderRadius: '3px' }} /></div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: getUsageColor(f.memory) }}>{f.memory}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>STORAGE</div>
                  <div style={{ height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}><div style={{ width: `${f.storage}%`, height: '100%', background: getUsageColor(f.storage), borderRadius: '3px' }} /></div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: getUsageColor(f.storage) }}>{f.storage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[...criticalResources, ...warningResources].map(r => {
            const typeConfig = getTypeConfig(r.type);
            const isCritical = r.current >= 80;
            return (
              <div key={r.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${isCritical ? '#ef4444' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>{isCritical ? '🔴' : '🟡'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{typeConfig.icon} {r.type} • 현재 {r.current}% • 잔여 {r.timeToExhaustion}</div>
                  </div>
                  <button className="btn btn-primary btn-sm">조치</button>
                </div>
              </div>
            );
          })}
          {criticalResources.length === 0 && warningResources.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>🎉 활성 경고 없음</div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

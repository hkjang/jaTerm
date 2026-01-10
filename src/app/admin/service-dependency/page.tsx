'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Service {
  id: string;
  name: string;
  type: 'API' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'EXTERNAL' | 'INTERNAL';
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  version: string;
  owner: string;
  dependencies: { id: string; name: string; type: string; critical: boolean }[];
  dependents: { id: string; name: string; type: string }[];
  metrics: { latency: number; errorRate: number; throughput: number };
  endpoint: string;
  lastHealthCheck: string;
}

export default function ServiceDependencyPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const mockServices: Service[] = [
      { id: 's1', name: 'api-gateway', type: 'API', status: 'HEALTHY', version: '3.2.1', owner: 'Platform Team', dependencies: [{ id: 's2', name: 'auth-service', type: 'API', critical: true }, { id: 's3', name: 'user-service', type: 'API', critical: true }, { id: 's4', name: 'redis-cache', type: 'CACHE', critical: false }], dependents: [], metrics: { latency: 45, errorRate: 0.1, throughput: 15000 }, endpoint: 'https://api.jaterm.io', lastHealthCheck: new Date(Date.now() - 30000).toISOString() },
      { id: 's2', name: 'auth-service', type: 'API', status: 'HEALTHY', version: '2.1.0', owner: 'Security Team', dependencies: [{ id: 's5', name: 'postgres-main', type: 'DATABASE', critical: true }, { id: 's4', name: 'redis-cache', type: 'CACHE', critical: true }], dependents: [{ id: 's1', name: 'api-gateway', type: 'API' }], metrics: { latency: 25, errorRate: 0.05, throughput: 8500 }, endpoint: 'auth-service:8080', lastHealthCheck: new Date(Date.now() - 30000).toISOString() },
      { id: 's3', name: 'user-service', type: 'API', status: 'HEALTHY', version: '1.8.5', owner: 'User Team', dependencies: [{ id: 's5', name: 'postgres-main', type: 'DATABASE', critical: true }, { id: 's6', name: 'email-service', type: 'EXTERNAL', critical: false }], dependents: [{ id: 's1', name: 'api-gateway', type: 'API' }], metrics: { latency: 35, errorRate: 0.2, throughput: 5200 }, endpoint: 'user-service:8080', lastHealthCheck: new Date(Date.now() - 30000).toISOString() },
      { id: 's4', name: 'redis-cache', type: 'CACHE', status: 'HEALTHY', version: '7.2.0', owner: 'Infra Team', dependencies: [], dependents: [{ id: 's1', name: 'api-gateway', type: 'API' }, { id: 's2', name: 'auth-service', type: 'API' }], metrics: { latency: 2, errorRate: 0.01, throughput: 45000 }, endpoint: 'redis-master:6379', lastHealthCheck: new Date(Date.now() - 30000).toISOString() },
      { id: 's5', name: 'postgres-main', type: 'DATABASE', status: 'HEALTHY', version: '15.2', owner: 'DBA Team', dependencies: [], dependents: [{ id: 's2', name: 'auth-service', type: 'API' }, { id: 's3', name: 'user-service', type: 'API' }, { id: 's7', name: 'session-service', type: 'API' }], metrics: { latency: 8, errorRate: 0.02, throughput: 12000 }, endpoint: 'postgres-primary:5432', lastHealthCheck: new Date(Date.now() - 30000).toISOString() },
      { id: 's6', name: 'email-service', type: 'EXTERNAL', status: 'HEALTHY', version: 'N/A', owner: 'External (SendGrid)', dependencies: [], dependents: [{ id: 's3', name: 'user-service', type: 'API' }], metrics: { latency: 120, errorRate: 0.5, throughput: 850 }, endpoint: 'api.sendgrid.com', lastHealthCheck: new Date(Date.now() - 60000).toISOString() },
      { id: 's7', name: 'session-service', type: 'API', status: 'DEGRADED', version: '1.2.3', owner: 'Platform Team', dependencies: [{ id: 's5', name: 'postgres-main', type: 'DATABASE', critical: true }, { id: 's8', name: 'rabbitmq', type: 'QUEUE', critical: false }], dependents: [{ id: 's1', name: 'api-gateway', type: 'API' }], metrics: { latency: 150, errorRate: 2.5, throughput: 3200 }, endpoint: 'session-service:8080', lastHealthCheck: new Date(Date.now() - 30000).toISOString() },
      { id: 's8', name: 'rabbitmq', type: 'QUEUE', status: 'HEALTHY', version: '3.12', owner: 'Infra Team', dependencies: [], dependents: [{ id: 's7', name: 'session-service', type: 'API' }], metrics: { latency: 5, errorRate: 0.1, throughput: 25000 }, endpoint: 'rabbitmq:5672', lastHealthCheck: new Date(Date.now() - 30000).toISOString() },
    ];
    setServices(mockServices);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'API': return { color: '#3b82f6', icon: '🔌' };
      case 'DATABASE': return { color: '#8b5cf6', icon: '🗄️' };
      case 'CACHE': return { color: '#10b981', icon: '⚡' };
      case 'QUEUE': return { color: '#f59e0b', icon: '📨' };
      case 'EXTERNAL': return { color: '#6b7280', icon: '🌐' };
      case 'INTERNAL': return { color: '#06b6d4', icon: '🏠' };
      default: return { color: '#6b7280', icon: '?' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'HEALTHY': return { color: '#10b981', icon: '✓', label: '정상' };
      case 'DEGRADED': return { color: '#f59e0b', icon: '⚠️', label: '저하' };
      case 'DOWN': return { color: '#ef4444', icon: '✗', label: '다운' };
      case 'UNKNOWN': return { color: '#6b7280', icon: '?', label: '알 수 없음' };
      default: return { color: '#6b7280', icon: '?', label: status };
    }
  };

  const filteredServices = services.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.owner.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalDeps = services.reduce((sum, s) => sum + s.dependencies.length, 0);

  return (
    <AdminLayout title="서비스 의존성" description="서비스 간 의존 관계 관리 및 시각화">
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 서비스</div><div className="stat-value">{services.length}</div></div>
        <div className="stat-card"><div className="stat-label">✓ 정상</div><div className="stat-value" style={{ color: '#10b981' }}>{services.filter(s => s.status === 'HEALTHY').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 저하</div><div className="stat-value" style={{ color: '#f59e0b' }}>{services.filter(s => s.status === 'DEGRADED').length}</div></div>
        <div className="stat-card"><div className="stat-label">의존 관계</div><div className="stat-value">{totalDeps}</div></div>
        <div className="stat-card"><div className="stat-label">외부 서비스</div><div className="stat-value">{services.filter(s => s.type === 'EXTERNAL').length}</div></div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="🔍 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '180px' }} />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 유형</option>
          <option value="API">API</option>
          <option value="DATABASE">DATABASE</option>
          <option value="CACHE">CACHE</option>
          <option value="QUEUE">QUEUE</option>
          <option value="EXTERNAL">EXTERNAL</option>
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('list')}>📋 목록</button>
          <button className={`btn ${viewMode === 'graph' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('graph')}>🔗 그래프</button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredServices.map(s => {
              const typeConfig = getTypeConfig(s.type);
              const statusConfig = getStatusConfig(s.status);
              return (
                <div key={s.id} className="card" style={{ padding: '16px', cursor: 'pointer', borderLeft: `4px solid ${statusConfig.color}` }} onClick={() => setSelectedService(s)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{typeConfig.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.type} • v{s.version}</div>
                    </div>
                    <span style={{ padding: '4px 10px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '6px', fontSize: '0.8rem' }}>{statusConfig.icon} {statusConfig.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.8rem', textAlign: 'center', background: 'var(--color-bg-secondary)', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
                    <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Latency</div><div style={{ fontWeight: 600 }}>{s.metrics.latency}ms</div></div>
                    <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Error Rate</div><div style={{ fontWeight: 600, color: s.metrics.errorRate > 1 ? '#f59e0b' : 'inherit' }}>{s.metrics.errorRate}%</div></div>
                    <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Throughput</div><div style={{ fontWeight: 600 }}>{s.metrics.throughput.toLocaleString()}/s</div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <span>의존: {s.dependencies.length} ({s.dependencies.filter(d => d.critical).length} critical)</span>
                    <span>피의존: {s.dependents.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Graph View */}
      {viewMode === 'graph' && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', minHeight: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔗</div>
          <div style={{ color: 'var(--color-text-muted)' }}>의존성 그래프 시각화</div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {services.slice(0, 5).map(s => (
              <div key={s.id} style={{ padding: '8px 16px', background: `${getStatusConfig(s.status).color}20`, borderRadius: '8px', fontSize: '0.9rem' }}>{getTypeConfig(s.type).icon} {s.name}</div>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>* 실제 그래프 시각화는 D3.js 또는 Cytoscape.js 연동 필요</div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedService && (
        <div className="modal-overlay active" onClick={() => setSelectedService(null)}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedService.type).icon} {selectedService.name}</h3>
              <button className="modal-close" onClick={() => setSelectedService(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getTypeConfig(selectedService.type).color}20`, color: getTypeConfig(selectedService.type).color, borderRadius: '6px' }}>{selectedService.type}</span>
                <span style={{ padding: '4px 10px', background: `${getStatusConfig(selectedService.status).color}20`, color: getStatusConfig(selectedService.status).color, borderRadius: '6px' }}>{getStatusConfig(selectedService.status).icon} {getStatusConfig(selectedService.status).label}</span>
                <span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>v{selectedService.version}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Owner:</span><br />{selectedService.owner}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Endpoint:</span><br /><code style={{ fontSize: '0.85rem' }}>{selectedService.endpoint}</code></div>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>📥 의존 서비스 ({selectedService.dependencies.length})</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {selectedService.dependencies.length === 0 ? <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>없음</span> : selectedService.dependencies.map(d => (
                  <span key={d.id} style={{ padding: '4px 10px', background: d.critical ? '#ef444420' : 'var(--color-bg-secondary)', color: d.critical ? '#ef4444' : 'inherit', borderRadius: '6px', fontSize: '0.85rem' }}>{getTypeConfig(d.type).icon} {d.name} {d.critical && '⚠️'}</span>
                ))}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>📤 피의존 서비스 ({selectedService.dependents.length})</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedService.dependents.length === 0 ? <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>없음</span> : selectedService.dependents.map(d => (
                  <span key={d.id} style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.85rem' }}>{getTypeConfig(d.type).icon} {d.name}</span>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">🔄 Health Check</button>
              <button className="btn btn-ghost" onClick={() => setSelectedService(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ServiceEntry {
  id: string;
  name: string;
  version: string;
  type: 'API' | 'WEB' | 'WORKER' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'GATEWAY';
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STARTING' | 'STOPPED';
  instances: { id: string; host: string; port: number; status: 'UP' | 'DOWN' | 'STARTING'; lastHeartbeat: string; cpu: number; memory: number }[];
  endpoints?: string[];
  dependencies: string[];
  healthCheck: { url: string; interval: number; timeout: number };
  metadata: Record<string, string>;
  registeredAt: string;
  updatedAt: string;
}

export default function ServiceRegistryPage() {
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'topology'>('list');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const mockServices: ServiceEntry[] = [
      { id: '1', name: 'api-gateway', version: '2.3.1', type: 'GATEWAY', status: 'HEALTHY', instances: [{ id: 'i1', host: '10.0.1.10', port: 8080, status: 'UP', lastHeartbeat: new Date(Date.now() - 5000).toISOString(), cpu: 23, memory: 45 }, { id: 'i2', host: '10.0.1.11', port: 8080, status: 'UP', lastHeartbeat: new Date(Date.now() - 3000).toISOString(), cpu: 19, memory: 42 }], endpoints: ['/api/*', '/auth/*'], dependencies: ['auth-service', 'user-service'], healthCheck: { url: '/health', interval: 30, timeout: 5 }, metadata: { region: 'kr-central', tier: 'production' }, registeredAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: '2', name: 'auth-service', version: '1.8.0', type: 'API', status: 'HEALTHY', instances: [{ id: 'i3', host: '10.0.2.20', port: 3000, status: 'UP', lastHeartbeat: new Date(Date.now() - 8000).toISOString(), cpu: 15, memory: 38 }], endpoints: ['/auth/login', '/auth/logout', '/auth/token'], dependencies: ['redis-cache', 'user-db'], healthCheck: { url: '/health', interval: 30, timeout: 5 }, metadata: { oauth: 'enabled' }, registeredAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 24 * 3600000).toISOString() },
      { id: '3', name: 'user-service', version: '2.1.5', type: 'API', status: 'HEALTHY', instances: [{ id: 'i4', host: '10.0.2.30', port: 3001, status: 'UP', lastHeartbeat: new Date(Date.now() - 4000).toISOString(), cpu: 28, memory: 52 }, { id: 'i5', host: '10.0.2.31', port: 3001, status: 'UP', lastHeartbeat: new Date(Date.now() - 6000).toISOString(), cpu: 25, memory: 48 }], dependencies: ['user-db', 'redis-cache'], healthCheck: { url: '/health', interval: 30, timeout: 5 }, metadata: {}, registeredAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
      { id: '4', name: 'ssh-gateway', version: '1.5.2', type: 'GATEWAY', status: 'HEALTHY', instances: [{ id: 'i6', host: '10.0.3.10', port: 2222, status: 'UP', lastHeartbeat: new Date(Date.now() - 2000).toISOString(), cpu: 35, memory: 62 }], dependencies: ['auth-service', 'session-db'], healthCheck: { url: '/health', interval: 15, timeout: 3 }, metadata: { maxSessions: '500' }, registeredAt: new Date(Date.now() - 120 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
      { id: '5', name: 'session-recorder', version: '1.2.0', type: 'WORKER', status: 'DEGRADED', instances: [{ id: 'i7', host: '10.0.4.10', port: 9000, status: 'UP', lastHeartbeat: new Date(Date.now() - 15000).toISOString(), cpu: 85, memory: 78 }, { id: 'i8', host: '10.0.4.11', port: 9000, status: 'DOWN', lastHeartbeat: new Date(Date.now() - 120000).toISOString(), cpu: 0, memory: 0 }], dependencies: ['storage-service', 'redis-queue'], healthCheck: { url: '/health', interval: 30, timeout: 5 }, metadata: {}, registeredAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: '6', name: 'user-db', version: '15.4', type: 'DATABASE', status: 'HEALTHY', instances: [{ id: 'i9', host: '10.0.5.10', port: 5432, status: 'UP', lastHeartbeat: new Date(Date.now() - 3000).toISOString(), cpu: 45, memory: 72 }, { id: 'i10', host: '10.0.5.11', port: 5432, status: 'UP', lastHeartbeat: new Date(Date.now() - 4000).toISOString(), cpu: 12, memory: 68 }], dependencies: [], healthCheck: { url: 'tcp', interval: 10, timeout: 2 }, metadata: { engine: 'PostgreSQL', role: 'primary' }, registeredAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: '7', name: 'redis-cache', version: '7.2', type: 'CACHE', status: 'HEALTHY', instances: [{ id: 'i11', host: '10.0.6.10', port: 6379, status: 'UP', lastHeartbeat: new Date(Date.now() - 1000).toISOString(), cpu: 8, memory: 35 }], dependencies: [], healthCheck: { url: 'tcp', interval: 5, timeout: 1 }, metadata: { mode: 'cluster' }, registeredAt: new Date(Date.now() - 150 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: '8', name: 'redis-queue', version: '7.2', type: 'QUEUE', status: 'HEALTHY', instances: [{ id: 'i12', host: '10.0.6.20', port: 6380, status: 'UP', lastHeartbeat: new Date(Date.now() - 2000).toISOString(), cpu: 12, memory: 28 }], dependencies: [], healthCheck: { url: 'tcp', interval: 5, timeout: 1 }, metadata: { queues: '15' }, registeredAt: new Date(Date.now() - 100 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: '9', name: 'web-frontend', version: '3.0.0', type: 'WEB', status: 'HEALTHY', instances: [{ id: 'i13', host: '10.0.7.10', port: 3000, status: 'UP', lastHeartbeat: new Date(Date.now() - 5000).toISOString(), cpu: 5, memory: 22 }, { id: 'i14', host: '10.0.7.11', port: 3000, status: 'UP', lastHeartbeat: new Date(Date.now() - 6000).toISOString(), cpu: 4, memory: 20 }], dependencies: ['api-gateway'], healthCheck: { url: '/', interval: 30, timeout: 5 }, metadata: { framework: 'Next.js' }, registeredAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 6 * 3600000).toISOString() },
      { id: '10', name: 'notification-service', version: '1.1.0', type: 'WORKER', status: 'STOPPED', instances: [], dependencies: ['redis-queue', 'smtp-relay'], healthCheck: { url: '/health', interval: 30, timeout: 5 }, metadata: {}, registeredAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 24 * 3600000).toISOString() },
    ];
    setServices(mockServices);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'API': return { color: '#3b82f6', label: 'API', icon: '🔌' };
      case 'WEB': return { color: '#8b5cf6', label: 'Web', icon: '🌐' };
      case 'WORKER': return { color: '#f59e0b', label: 'Worker', icon: '⚙️' };
      case 'DATABASE': return { color: '#10b981', label: 'DB', icon: '🗄️' };
      case 'CACHE': return { color: '#ef4444', label: 'Cache', icon: '💾' };
      case 'QUEUE': return { color: '#06b6d4', label: 'Queue', icon: '📬' };
      case 'GATEWAY': return { color: '#ec4899', label: 'Gateway', icon: '🚪' };
      default: return { color: '#6b7280', label: type, icon: '?' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'HEALTHY': return { color: '#10b981', label: '정상', icon: '✓' };
      case 'DEGRADED': return { color: '#f59e0b', label: '저하', icon: '⚠️' };
      case 'UNHEALTHY': return { color: '#ef4444', label: '비정상', icon: '✗' };
      case 'STARTING': return { color: '#3b82f6', label: '시작중', icon: '⏳' };
      case 'STOPPED': return { color: '#6b7280', label: '중지', icon: '⏹️' };
      default: return { color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}초 전`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return `${Math.floor(diff / 86400000)}일 전`;
  };

  const filteredServices = services.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const healthyCount = services.filter(s => s.status === 'HEALTHY').length;
  const degradedCount = services.filter(s => s.status === 'DEGRADED').length;
  const totalInstances = services.reduce((acc, s) => acc + s.instances.length, 0);

  return (
    <AdminLayout 
      title="서비스 레지스트리" 
      description="마이크로서비스 등록 및 검색"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 서비스</div>
          <div className="stat-value">{services.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 정상</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{healthyCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ 저하</div>
          <div className="stat-value" style={{ color: degradedCount > 0 ? '#f59e0b' : 'inherit' }}>{degradedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 인스턴스</div>
          <div className="stat-value">{totalInstances}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🚪 게이트웨이</div>
          <div className="stat-value">{services.filter(s => s.type === 'GATEWAY').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 서비스 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '200px' }}
        />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 유형</option>
          <option value="API">🔌 API</option>
          <option value="WEB">🌐 Web</option>
          <option value="GATEWAY">🚪 Gateway</option>
          <option value="WORKER">⚙️ Worker</option>
          <option value="DATABASE">🗄️ DB</option>
          <option value="CACHE">💾 Cache</option>
          <option value="QUEUE">📬 Queue</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'HEALTHY', 'DEGRADED', 'STOPPED'].map(status => (
            <button
              key={status}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? '전체' : getStatusConfig(status).label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('list')}>📋 목록</button>
          <button className={`btn btn-sm ${viewMode === 'topology' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('topology')}>🔀 토폴로지</button>
        </div>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          🔄 실시간
        </label>
        <button className="btn btn-primary">+ 서비스 등록</button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredServices.map(service => {
            const typeConfig = getTypeConfig(service.type);
            const statusConfig = getStatusConfig(service.status);
            const upInstances = service.instances.filter(i => i.status === 'UP').length;
            return (
              <div 
                key={service.id} 
                className="card" 
                style={{ padding: '16px', cursor: 'pointer', borderLeft: `4px solid ${statusConfig.color}` }}
                onClick={() => setSelectedService(service)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{typeConfig.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{service.name}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>v{service.version}</span>
                        <span style={{ padding: '1px 6px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '3px', fontSize: '0.7rem' }}>{typeConfig.label}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>{statusConfig.icon} {statusConfig.label}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  <span>🖥️ {upInstances}/{service.instances.length} 인스턴스</span>
                  {service.dependencies.length > 0 && <span>🔗 {service.dependencies.length} 의존성</span>}
                  <span>🕐 {getTimeAgo(service.updatedAt)}</span>
                </div>
                
                {service.instances.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {service.instances.slice(0, 3).map(inst => (
                      <span key={inst.id} style={{ padding: '2px 6px', background: inst.status === 'UP' ? '#10b98120' : '#ef444420', color: inst.status === 'UP' ? '#10b981' : '#ef4444', borderRadius: '4px', fontSize: '0.7rem' }}>{inst.host}:{inst.port}</span>
                    ))}
                    {service.instances.length > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>+{service.instances.length - 3}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedService && (
        <div className="modal-overlay active" onClick={() => setSelectedService(null)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedService.type).icon} {selectedService.name}</h3>
              <button className="modal-close" onClick={() => setSelectedService(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getStatusConfig(selectedService.status).color}20`, color: getStatusConfig(selectedService.status).color, borderRadius: '6px', fontSize: '0.85rem' }}>{getStatusConfig(selectedService.status).icon} {getStatusConfig(selectedService.status).label}</span>
                <span style={{ padding: '4px 10px', background: `${getTypeConfig(selectedService.type).color}20`, color: getTypeConfig(selectedService.type).color, borderRadius: '6px', fontSize: '0.85rem' }}>{getTypeConfig(selectedService.type).label}</span>
                <span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.85rem' }}>v{selectedService.version}</span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>인스턴스</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedService.instances.map(inst => (
                    <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: inst.status === 'UP' ? '#10b981' : '#ef4444' }} />
                      <code style={{ fontSize: '0.85rem' }}>{inst.host}:{inst.port}</code>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>CPU: {inst.cpu}%</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>MEM: {inst.memory}%</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{getTimeAgo(inst.lastHeartbeat)}</span>
                    </div>
                  ))}
                  {selectedService.instances.length === 0 && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>실행 중인 인스턴스 없음</div>}
                </div>
              </div>
              
              {selectedService.dependencies.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>의존성</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedService.dependencies.map(dep => <span key={dep} style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.85rem' }}>{dep}</span>)}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>헬스체크</div><div>{selectedService.healthCheck.url} ({selectedService.healthCheck.interval}s)</div></div>
                <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>등록일</div><div>{new Date(selectedService.registeredAt).toLocaleDateString('ko-KR')}</div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">🔄 재시작</button>
              <button className="btn btn-ghost" onClick={() => setSelectedService(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

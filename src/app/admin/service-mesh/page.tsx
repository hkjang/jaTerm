'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Service {
  id: string;
  name: string;
  namespace: string;
  version: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  instances: number;
  cpu: number;
  memory: number;
  requestRate: number;
  errorRate: number;
  latencyP50: number;
  latencyP99: number;
  upstreams: string[];
  downstreams: string[];
}

export default function ServiceMeshPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const mock: Service[] = [
      { id: '1', name: 'api-gateway', namespace: 'production', version: 'v2.3.1', status: 'HEALTHY', instances: 4, cpu: 45, memory: 62, requestRate: 1250, errorRate: 0.02, latencyP50: 12, latencyP99: 85, upstreams: [], downstreams: ['user-service', 'order-service', 'product-service'] },
      { id: '2', name: 'user-service', namespace: 'production', version: 'v1.8.0', status: 'HEALTHY', instances: 3, cpu: 32, memory: 48, requestRate: 420, errorRate: 0.01, latencyP50: 8, latencyP99: 45, upstreams: ['api-gateway'], downstreams: ['auth-service', 'notification-service'] },
      { id: '3', name: 'order-service', namespace: 'production', version: 'v3.1.2', status: 'DEGRADED', instances: 5, cpu: 78, memory: 81, requestRate: 890, errorRate: 1.5, latencyP50: 45, latencyP99: 320, upstreams: ['api-gateway'], downstreams: ['payment-service', 'inventory-service'] },
      { id: '4', name: 'product-service', namespace: 'production', version: 'v2.0.5', status: 'HEALTHY', instances: 2, cpu: 28, memory: 35, requestRate: 350, errorRate: 0.05, latencyP50: 15, latencyP99: 65, upstreams: ['api-gateway', 'order-service'], downstreams: ['cache-service'] },
      { id: '5', name: 'payment-service', namespace: 'production', version: 'v1.5.0', status: 'HEALTHY', instances: 3, cpu: 22, memory: 40, requestRate: 180, errorRate: 0.1, latencyP50: 120, latencyP99: 450, upstreams: ['order-service'], downstreams: ['external-payment'] },
      { id: '6', name: 'inventory-service', namespace: 'production', version: 'v1.2.3', status: 'UNHEALTHY', instances: 2, cpu: 95, memory: 92, requestRate: 0, errorRate: 100, latencyP50: 0, latencyP99: 0, upstreams: ['order-service'], downstreams: ['warehouse-api'] },
      { id: '7', name: 'auth-service', namespace: 'production', version: 'v2.1.0', status: 'HEALTHY', instances: 4, cpu: 18, memory: 32, requestRate: 620, errorRate: 0.02, latencyP50: 5, latencyP99: 25, upstreams: ['user-service'], downstreams: ['redis-cache'] },
      { id: '8', name: 'notification-service', namespace: 'production', version: 'v1.0.8', status: 'HEALTHY', instances: 2, cpu: 12, memory: 28, requestRate: 85, errorRate: 0.5, latencyP50: 22, latencyP99: 120, upstreams: ['user-service', 'order-service'], downstreams: ['email-service', 'sms-gateway'] },
    ];
    setServices(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleRestart = (svc: Service) => { setSuccess(`${svc.name} 재시작 중...`); setTimeout(() => setSuccess(`${svc.name} 재시작 완료`), 2000); };
  const handleScale = (svc: Service, delta: number) => { setServices(services.map(s => s.id === svc.id ? { ...s, instances: Math.max(1, s.instances + delta) } : s)); setSuccess(`${svc.name} 인스턴스 ${delta > 0 ? '증가' : '감소'}`); };

  const getStatusStyle = (s: string) => ({ HEALTHY: '#10b981', DEGRADED: '#f59e0b', UNHEALTHY: '#ef4444', UNKNOWN: '#6b7280' }[s] || '#6b7280');
  const getStatusIcon = (s: string) => ({ HEALTHY: '🟢', DEGRADED: '🟡', UNHEALTHY: '🔴', UNKNOWN: '⚫' }[s] || '⚫');

  const filtered = services.filter(s => filterStatus === 'all' || s.status === filterStatus);
  const healthyCount = services.filter(s => s.status === 'HEALTHY').length;

  return (
    <AdminLayout title="서비스 메시" description="마이크로서비스 토폴로지 및 상태 모니터링">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 서비스</div><div className="stat-value">{services.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 정상</div><div className="stat-value" style={{ color: '#10b981' }}>{healthyCount}</div></div>
        <div className="stat-card"><div className="stat-label">🟡 저하</div><div className="stat-value" style={{ color: '#f59e0b' }}>{services.filter(s => s.status === 'DEGRADED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 장애</div><div className="stat-value" style={{ color: '#ef4444' }}>{services.filter(s => s.status === 'UNHEALTHY').length}</div></div>
        <div className="stat-card"><div className="stat-label">총 인스턴스</div><div className="stat-value">{services.reduce((a, s) => a + s.instances, 0)}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 130 }}><option value="all">전체 상태</option><option value="HEALTHY">정상</option><option value="DEGRADED">저하</option><option value="UNHEALTHY">장애</option></select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(svc => (
            <div key={svc.id} className="card" style={{ cursor: 'pointer', borderTop: `3px solid ${getStatusStyle(svc.status)}` }} onClick={() => setSelectedService(svc)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{getStatusIcon(svc.status)} {svc.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{svc.namespace} · {svc.version}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{svc.instances}</div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>instances</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12, textAlign: 'center' }}>
                <div><div style={{ fontSize: '0.9rem', fontWeight: 600, color: svc.cpu > 80 ? '#ef4444' : 'inherit' }}>{svc.cpu}%</div><div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>CPU</div></div>
                <div><div style={{ fontSize: '0.9rem', fontWeight: 600, color: svc.memory > 80 ? '#ef4444' : 'inherit' }}>{svc.memory}%</div><div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>MEM</div></div>
                <div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{svc.requestRate}</div><div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>req/s</div></div>
                <div><div style={{ fontSize: '0.9rem', fontWeight: 600, color: svc.errorRate > 1 ? '#ef4444' : svc.errorRate > 0.5 ? '#f59e0b' : '#10b981' }}>{svc.errorRate}%</div><div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>errors</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>P50: {svc.latencyP50}ms</span><span>P99: {svc.latencyP99}ms</span>
                <span style={{ marginLeft: 'auto' }}>↓{svc.downstreams.length} ↑{svc.upstreams.length}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedService && (
        <div className="modal-overlay active" onClick={() => setSelectedService(null)}>
          <div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">{getStatusIcon(selectedService.status)} {selectedService.name}</h3><button className="modal-close" onClick={() => setSelectedService(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusStyle(selectedService.status)}20`, color: getStatusStyle(selectedService.status), borderRadius: 6 }}>{selectedService.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedService.namespace}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedService.version}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedService.cpu > 80 ? '#ef4444' : 'inherit' }}>{selectedService.cpu}%</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CPU</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedService.memory}%</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Memory</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedService.requestRate}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>req/s</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedService.errorRate > 1 ? '#ef4444' : '#10b981' }}>{selectedService.errorRate}%</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Error Rate</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><b>인스턴스:</b><button className="btn btn-ghost btn-sm" onClick={() => handleScale(selectedService, -1)}>➖</button><span style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{selectedService.instances}</span><button className="btn btn-ghost btn-sm" onClick={() => handleScale(selectedService, 1)}>➕</button></div>
              {selectedService.upstreams.length > 0 && <div style={{ marginBottom: 12 }}><b>↑ Upstreams:</b> {selectedService.upstreams.join(', ')}</div>}
              {selectedService.downstreams.length > 0 && <div><b>↓ Downstreams:</b> {selectedService.downstreams.join(', ')}</div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { handleRestart(selectedService); setSelectedService(null); }}>🔄 재시작</button><button className="btn btn-ghost" onClick={() => setSelectedService(null)}>닫기</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

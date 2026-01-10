'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface HealthCheck {
  id: string;
  name: string;
  endpoint: string;
  type: 'HTTP' | 'TCP' | 'DNS' | 'DATABASE' | 'REDIS' | 'CUSTOM';
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  latency: number;
  uptime: number;
  lastCheck: string;
  checkInterval: number;
  consecutiveFailures: number;
  dependencies: string[];
}

export default function SystemHealthPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchHealth = () => {
      setChecks([
        { id: '1', name: 'API Gateway', endpoint: 'https://api.jaterm.io/health', type: 'HTTP', status: 'HEALTHY', latency: 45, uptime: 99.98, lastCheck: '2026-01-10 14:49', checkInterval: 30, consecutiveFailures: 0, dependencies: ['auth-service', 'core-api'] },
        { id: '2', name: 'Auth Service', endpoint: 'auth.internal:8080/health', type: 'HTTP', status: 'HEALTHY', latency: 12, uptime: 99.99, lastCheck: '2026-01-10 14:49', checkInterval: 15, consecutiveFailures: 0, dependencies: ['primary-db', 'redis-cache'] },
        { id: '3', name: 'Primary Database', endpoint: 'db-prod.internal:5432', type: 'DATABASE', status: 'HEALTHY', latency: 3, uptime: 99.95, lastCheck: '2026-01-10 14:49', checkInterval: 10, consecutiveFailures: 0, dependencies: [] },
        { id: '4', name: 'Redis Cache', endpoint: 'redis.internal:6379', type: 'REDIS', status: 'HEALTHY', latency: 1, uptime: 99.99, lastCheck: '2026-01-10 14:49', checkInterval: 10, consecutiveFailures: 0, dependencies: [] },
        { id: '5', name: 'Terminal Proxy', endpoint: 'proxy.jaterm.io:443', type: 'TCP', status: 'DEGRADED', latency: 85, uptime: 99.85, lastCheck: '2026-01-10 14:49', checkInterval: 30, consecutiveFailures: 2, dependencies: ['api-gateway'] },
        { id: '6', name: 'Elasticsearch', endpoint: 'elastic.internal:9200', type: 'HTTP', status: 'HEALTHY', latency: 15, uptime: 99.90, lastCheck: '2026-01-10 14:49', checkInterval: 30, consecutiveFailures: 0, dependencies: [] },
        { id: '7', name: 'Email Service', endpoint: 'email.internal:587', type: 'TCP', status: 'UNHEALTHY', latency: 0, uptime: 98.50, lastCheck: '2026-01-10 14:49', checkInterval: 60, consecutiveFailures: 5, dependencies: [] },
        { id: '8', name: 'DNS Resolution', endpoint: 'jaterm.io', type: 'DNS', status: 'HEALTHY', latency: 25, uptime: 99.99, lastCheck: '2026-01-10 14:49', checkInterval: 60, consecutiveFailures: 0, dependencies: [] },
      ]);
      setLoading(false);
    };
    fetchHealth();
    if (autoRefresh) { const t = setInterval(fetchHealth, 15000); return () => clearInterval(t); }
  }, [autoRefresh]);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleForceCheck = (h: HealthCheck) => { setSuccess(`${h.name} 점검 실행 중...`); };
  const handleRestart = (h: HealthCheck) => { if (confirm('서비스 재시작?')) { setSuccess(`${h.name} 재시작 요청됨`); } };

  const getStatusColor = (s: string) => ({ HEALTHY: '#10b981', DEGRADED: '#f59e0b', UNHEALTHY: '#ef4444', UNKNOWN: '#6b7280' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ HTTP: '🌐', TCP: '🔌', DNS: '📡', DATABASE: '🗄️', REDIS: '💾', CUSTOM: '⚙️' }[t] || '🔧');
  const getLatencyColor = (l: number) => l < 50 ? '#10b981' : l < 100 ? '#f59e0b' : '#ef4444';

  const healthyCount = checks.filter(c => c.status === 'HEALTHY').length;
  const degradedCount = checks.filter(c => c.status === 'DEGRADED').length;
  const unhealthyCount = checks.filter(c => c.status === 'UNHEALTHY').length;
  const avgUptime = checks.length > 0 ? checks.reduce((a, c) => a + c.uptime, 0) / checks.length : 0;

  const overallStatus = unhealthyCount > 0 ? 'UNHEALTHY' : degradedCount > 0 ? 'DEGRADED' : 'HEALTHY';

  return (
    <AdminLayout title="시스템 상태" description="전체 시스템 헬스체크">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${getStatusColor(overallStatus)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{overallStatus === 'HEALTHY' ? '✅' : overallStatus === 'DEGRADED' ? '⚠️' : '❌'}</div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: getStatusColor(overallStatus) }}>{overallStatus}</div><div style={{ color: 'var(--color-text-muted)' }}>전체 시스템 상태</div></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />🔄 자동 새로고침 (15초)</label>
      </div>
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">🟢 정상</div><div className="stat-value" style={{ color: '#10b981' }}>{healthyCount}</div></div>
        <div className="stat-card"><div className="stat-label">🟡 성능저하</div><div className="stat-value" style={{ color: '#f59e0b' }}>{degradedCount}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 장애</div><div className="stat-value" style={{ color: '#ef4444' }}>{unhealthyCount}</div></div>
        <div className="stat-card"><div className="stat-label">평균 가동률</div><div className="stat-value">{avgUptime.toFixed(2)}%</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {checks.sort((a, b) => ['UNHEALTHY', 'DEGRADED', 'HEALTHY', 'UNKNOWN'].indexOf(a.status) - ['UNHEALTHY', 'DEGRADED', 'HEALTHY', 'UNKNOWN'].indexOf(b.status)).map(h => (
            <div key={h.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(h.status)}`, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: '2rem' }}>{getTypeIcon(h.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{h.name}</span><span style={{ padding: '2px 8px', background: `${getStatusColor(h.status)}20`, color: getStatusColor(h.status), borderRadius: 4, fontSize: '0.75rem' }}>{h.status}</span></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{h.endpoint}</div>
                {h.dependencies.length > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>의존: {h.dependencies.join(', ')}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 80px)', gap: 16, textAlign: 'center' }}>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>지연</div><div style={{ fontWeight: 600, color: getLatencyColor(h.latency) }}>{h.latency}ms</div></div>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>가동률</div><div style={{ fontWeight: 600 }}>{h.uptime}%</div></div>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>주기</div><div style={{ fontWeight: 600 }}>{h.checkInterval}초</div></div>
                <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>실패</div><div style={{ fontWeight: 600, color: h.consecutiveFailures > 0 ? '#ef4444' : 'inherit' }}>{h.consecutiveFailures}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-ghost btn-sm" onClick={() => handleForceCheck(h)}>🔄</button>{h.status !== 'HEALTHY' && <button className="btn btn-ghost btn-sm" style={{ color: '#f59e0b' }} onClick={() => handleRestart(h)}>⟳</button>}</div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

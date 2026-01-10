'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  change: number; // percentage change
  trend: 'UP' | 'DOWN' | 'STABLE';
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  history: number[];
}

interface ServiceStatus {
  name: string;
  status: 'RUNNING' | 'STOPPED' | 'DEGRADED' | 'RESTARTING';
  uptime: number; // seconds
  cpu: number;
  memory: number;
  lastCheck: string;
}

export default function SystemMetricsPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const mockMetrics: SystemMetric[] = [
      { name: 'CPU 사용률', value: 45, unit: '%', change: -5, trend: 'DOWN', status: 'GOOD', history: [52, 48, 45, 42, 45, 48, 45] },
      { name: '메모리 사용률', value: 68, unit: '%', change: 3, trend: 'UP', status: 'WARNING', history: [62, 64, 65, 66, 67, 68, 68] },
      { name: '디스크 사용률', value: 72, unit: '%', change: 1, trend: 'UP', status: 'WARNING', history: [68, 69, 70, 70, 71, 71, 72] },
      { name: '네트워크 I/O', value: 245, unit: 'MB/s', change: 12, trend: 'UP', status: 'GOOD', history: [180, 195, 210, 220, 235, 240, 245] },
      { name: '활성 연결', value: 1247, unit: '개', change: -8, trend: 'DOWN', status: 'GOOD', history: [1350, 1320, 1290, 1280, 1260, 1250, 1247] },
      { name: '초당 요청', value: 892, unit: 'RPS', change: 15, trend: 'UP', status: 'GOOD', history: [720, 750, 780, 820, 850, 875, 892] },
      { name: '평균 응답시간', value: 45, unit: 'ms', change: -12, trend: 'DOWN', status: 'GOOD', history: [58, 55, 52, 50, 48, 46, 45] },
      { name: '오류율', value: 0.02, unit: '%', change: 0, trend: 'STABLE', status: 'GOOD', history: [0.03, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02] },
    ];

    const mockServices: ServiceStatus[] = [
      { name: 'jaTerm API', status: 'RUNNING', uptime: 864000, cpu: 12, memory: 45, lastCheck: new Date().toISOString() },
      { name: 'SSH Gateway', status: 'RUNNING', uptime: 864000, cpu: 8, memory: 32, lastCheck: new Date().toISOString() },
      { name: 'Session Manager', status: 'RUNNING', uptime: 432000, cpu: 15, memory: 28, lastCheck: new Date().toISOString() },
      { name: 'Audit Logger', status: 'RUNNING', uptime: 864000, cpu: 5, memory: 18, lastCheck: new Date().toISOString() },
      { name: 'Notification Service', status: 'RUNNING', uptime: 172800, cpu: 3, memory: 12, lastCheck: new Date().toISOString() },
      { name: 'Backup Scheduler', status: 'RUNNING', uptime: 864000, cpu: 2, memory: 8, lastCheck: new Date().toISOString() },
      { name: 'Metrics Collector', status: 'DEGRADED', uptime: 3600, cpu: 45, memory: 72, lastCheck: new Date().toISOString() },
      { name: 'Cache Service', status: 'RUNNING', uptime: 864000, cpu: 8, memory: 52, lastCheck: new Date().toISOString() },
    ];

    setMetrics(mockMetrics);
    setServices(mockServices);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Simulate metric updates
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.value + (Math.random() - 0.5) * 5,
        history: [...m.history.slice(1), m.value]
      })));
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'GOOD': case 'RUNNING': return { color: '#10b981', bg: '#10b98120', label: '정상', icon: '●' };
      case 'WARNING': case 'DEGRADED': return { color: '#f59e0b', bg: '#f59e0b20', label: '경고', icon: '◐' };
      case 'CRITICAL': return { color: '#ef4444', bg: '#ef444420', label: '위험', icon: '●' };
      case 'STOPPED': return { color: '#6b7280', bg: '#6b728020', label: '중지', icon: '○' };
      case 'RESTARTING': return { color: '#3b82f6', bg: '#3b82f620', label: '재시작', icon: '↻' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '?' };
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'UP') return { icon: '↑', color: change > 0 ? '#ef4444' : '#10b981' };
    if (trend === 'DOWN') return { icon: '↓', color: change < 0 ? '#10b981' : '#ef4444' };
    return { icon: '→', color: '#6b7280' };
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}일 ${hours}시간`;
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${minutes}분`;
  };

  const renderMiniChart = (history: number[], status: string) => {
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;
    const statusConfig = getStatusConfig(status);
    
    return (
      <svg width="80" height="24" style={{ display: 'block' }}>
        <polyline
          points={history.map((v, i) => `${i * 12 + 4},${20 - ((v - min) / range) * 16}`).join(' ')}
          fill="none"
          stroke={statusConfig.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const goodCount = services.filter(s => s.status === 'RUNNING').length;
  const degradedCount = services.filter(s => s.status === 'DEGRADED').length;

  return (
    <AdminLayout 
      title="시스템 메트릭" 
      description="실시간 시스템 성능 모니터링"
    >
      {/* Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            마지막 갱신: {lastRefresh.toLocaleTimeString('ko-KR')}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            자동 갱신
          </label>
          {autoRefresh && (
            <select 
              className="form-input" 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              style={{ maxWidth: '100px' }}
            >
              <option value={10}>10초</option>
              <option value={30}>30초</option>
              <option value={60}>1분</option>
            </select>
          )}
        </div>
        <button className="btn btn-secondary" onClick={() => setLastRefresh(new Date())}>🔄 새로고침</button>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
            {metrics.map(metric => {
              const statusConfig = getStatusConfig(metric.status);
              const trendConfig = getTrendIcon(metric.trend, metric.change);
              return (
                <div key={metric.name} className="card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{metric.name}</div>
                    <span style={{ width: '8px', height: '8px', background: statusConfig.color, borderRadius: '50%' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{typeof metric.value === 'number' && metric.value < 1 ? metric.value.toFixed(2) : Math.round(metric.value)}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{metric.unit}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: trendConfig.color }}>
                      <span>{trendConfig.icon}</span>
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                    {renderMiniChart(metric.history, metric.status)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Services Status */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>서비스 상태</h3>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
              <span style={{ color: '#10b981' }}>● 정상: {goodCount}</span>
              <span style={{ color: degradedCount > 0 ? '#f59e0b' : 'var(--color-text-muted)' }}>◐ 저하: {degradedCount}</span>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>서비스</th>
                    <th>상태</th>
                    <th>업타임</th>
                    <th>CPU</th>
                    <th>메모리</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => {
                    const statusConfig = getStatusConfig(service.status);
                    return (
                      <tr key={service.name}>
                        <td style={{ fontWeight: 500 }}>{service.name}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{formatUptime(service.uptime)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${service.cpu}%`, height: '100%', background: service.cpu > 80 ? '#ef4444' : service.cpu > 50 ? '#f59e0b' : '#10b981' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{service.cpu}%</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${service.memory}%`, height: '100%', background: service.memory > 80 ? '#ef4444' : service.memory > 50 ? '#f59e0b' : '#10b981' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{service.memory}%</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-ghost btn-sm" title="재시작">🔄</button>
                            <button className="btn btn-ghost btn-sm" title="로그">📋</button>
                            <button className="btn btn-ghost btn-sm" title="상세">👁️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

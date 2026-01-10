'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ServerMetrics {
  id: string;
  server: { name: string; ip: string; group: string };
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  network: { inbound: number; outbound: number };
  load: number[];
  uptime: number; // seconds
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  activeSessions: number;
  lastUpdated: string;
}

export default function ServerMonitoringPage() {
  const [servers, setServers] = useState<ServerMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<ServerMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const mockServers: ServerMetrics[] = [
      { id: '1', server: { name: 'prod-web-01', ip: '10.0.1.10', group: 'Production' }, cpu: { usage: 45, cores: 8 }, memory: { used: 12.5, total: 32, percent: 39 }, disk: { used: 180, total: 500, percent: 36 }, network: { inbound: 125.6, outbound: 89.2 }, load: [2.1, 1.8, 1.5], uptime: 45 * 86400, status: 'HEALTHY', activeSessions: 3, lastUpdated: new Date().toISOString() },
      { id: '2', server: { name: 'prod-web-02', ip: '10.0.1.11', group: 'Production' }, cpu: { usage: 38, cores: 8 }, memory: { used: 14.2, total: 32, percent: 44 }, disk: { used: 195, total: 500, percent: 39 }, network: { inbound: 98.4, outbound: 67.1 }, load: [1.9, 1.6, 1.4], uptime: 45 * 86400, status: 'HEALTHY', activeSessions: 2, lastUpdated: new Date().toISOString() },
      { id: '3', server: { name: 'prod-api-01', ip: '10.0.1.20', group: 'Production' }, cpu: { usage: 72, cores: 16 }, memory: { used: 28.5, total: 64, percent: 45 }, disk: { used: 320, total: 1000, percent: 32 }, network: { inbound: 456.8, outbound: 389.2 }, load: [8.5, 7.2, 6.8], uptime: 30 * 86400, status: 'WARNING', activeSessions: 5, lastUpdated: new Date().toISOString() },
      { id: '4', server: { name: 'db-master-01', ip: '10.0.3.10', group: 'Database' }, cpu: { usage: 55, cores: 32 }, memory: { used: 115, total: 128, percent: 90 }, disk: { used: 1800, total: 2000, percent: 90 }, network: { inbound: 234.5, outbound: 156.8 }, load: [12.1, 11.5, 10.8], uptime: 90 * 86400, status: 'WARNING', activeSessions: 8, lastUpdated: new Date().toISOString() },
      { id: '5', server: { name: 'db-slave-01', ip: '10.0.3.11', group: 'Database' }, cpu: { usage: 25, cores: 32 }, memory: { used: 85, total: 128, percent: 66 }, disk: { used: 1750, total: 2000, percent: 88 }, network: { inbound: 45.2, outbound: 12.8 }, load: [5.2, 4.8, 4.5], uptime: 90 * 86400, status: 'HEALTHY', activeSessions: 2, lastUpdated: new Date().toISOString() },
      { id: '6', server: { name: 'redis-01', ip: '10.0.4.10', group: 'Cache' }, cpu: { usage: 15, cores: 4 }, memory: { used: 12, total: 16, percent: 75 }, disk: { used: 8, total: 50, percent: 16 }, network: { inbound: 567.8, outbound: 498.2 }, load: [0.8, 0.6, 0.5], uptime: 120 * 86400, status: 'HEALTHY', activeSessions: 0, lastUpdated: new Date().toISOString() },
      { id: '7', server: { name: 'stage-app-01', ip: '10.0.2.10', group: 'Staging' }, cpu: { usage: 22, cores: 4 }, memory: { used: 6.5, total: 16, percent: 41 }, disk: { used: 45, total: 200, percent: 23 }, network: { inbound: 12.4, outbound: 8.6 }, load: [0.9, 0.7, 0.6], uptime: 15 * 86400, status: 'HEALTHY', activeSessions: 1, lastUpdated: new Date().toISOString() },
      { id: '8', server: { name: 'legacy-ftp', ip: '192.168.1.100', group: 'Legacy' }, cpu: { usage: 0, cores: 2 }, memory: { used: 0, total: 4, percent: 0 }, disk: { used: 0, total: 100, percent: 0 }, network: { inbound: 0, outbound: 0 }, load: [0, 0, 0], uptime: 0, status: 'OFFLINE', activeSessions: 0, lastUpdated: new Date(Date.now() - 2 * 3600000).toISOString() },
    ];
    setServers(mockServers);
    setLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setServers(prev => prev.map(s => {
        if (s.status === 'OFFLINE') return s;
        return {
          ...s,
          cpu: { ...s.cpu, usage: Math.min(100, Math.max(10, s.cpu.usage + (Math.random() - 0.5) * 10)) },
          memory: { ...s.memory, percent: Math.min(100, Math.max(20, s.memory.percent + (Math.random() - 0.5) * 5)) },
          network: { inbound: Math.max(0, s.network.inbound + (Math.random() - 0.5) * 20), outbound: Math.max(0, s.network.outbound + (Math.random() - 0.5) * 15) },
          lastUpdated: new Date().toISOString(),
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'HEALTHY': return { color: '#10b981', bg: '#10b98120', label: '정상', icon: '✓' };
      case 'WARNING': return { color: '#f59e0b', bg: '#f59e0b20', label: '주의', icon: '⚠' };
      case 'CRITICAL': return { color: '#ef4444', bg: '#ef444420', label: '위험', icon: '✗' };
      case 'OFFLINE': return { color: '#6b7280', bg: '#6b728020', label: '오프라인', icon: '○' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '?' };
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 75) return '#f59e0b';
    return '#10b981';
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    return `${bytes.toFixed(decimals)}`;
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}일 ${hours}시간`;
  };

  const filteredServers = servers.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const healthyCount = servers.filter(s => s.status === 'HEALTHY').length;
  const warningCount = servers.filter(s => s.status === 'WARNING').length;
  const criticalCount = servers.filter(s => s.status === 'CRITICAL').length;
  const offlineCount = servers.filter(s => s.status === 'OFFLINE').length;

  return (
    <AdminLayout 
      title="서버 모니터링" 
      description="실시간 서버 상태 및 리소스 사용량"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 서버</div>
          <div className="stat-value">{servers.length}</div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('HEALTHY')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">✓ 정상</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{healthyCount}</div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('WARNING')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">⚠️ 주의</div>
          <div className="stat-value" style={{ color: warningCount > 0 ? '#f59e0b' : 'inherit' }}>{warningCount}</div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('CRITICAL')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">✗ 위험</div>
          <div className="stat-value" style={{ color: criticalCount > 0 ? '#ef4444' : 'inherit' }}>{criticalCount}</div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('OFFLINE')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">○ 오프라인</div>
          <div className="stat-value" style={{ color: '#6b7280' }}>{offlineCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE'].map(status => {
            const config = status !== 'all' ? getStatusConfig(status) : null;
            return (
              <button
                key={status}
                className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(status)}
              >
                {config && <span style={{ marginRight: '4px' }}>{config.icon}</span>}
                {status === 'all' ? '전체' : config?.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('grid')}>
            📊 그리드
          </button>
          <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('list')}>
            📋 리스트
          </button>
        </div>
      </div>

      {/* Servers Grid/List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredServers.map(server => {
            const statusConfig = getStatusConfig(server.status);
            return (
              <div key={server.id} className="card" style={{ padding: '16px', cursor: 'pointer', borderLeft: `4px solid ${statusConfig.color}` }} onClick={() => setSelectedServer(server)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{server.server.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{server.server.ip}</div>
                  </div>
                  <span style={{ padding: '2px 8px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                </div>
                
                {server.status !== 'OFFLINE' && (
                  <>
                    {/* CPU */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>CPU</span>
                        <span style={{ color: getUsageColor(server.cpu.usage) }}>{Math.round(server.cpu.usage)}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${server.cpu.usage}%`, background: getUsageColor(server.cpu.usage), transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    {/* Memory */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>메모리</span>
                        <span style={{ color: getUsageColor(server.memory.percent) }}>{Math.round(server.memory.percent)}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${server.memory.percent}%`, background: getUsageColor(server.memory.percent), transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    {/* Disk */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>디스크</span>
                        <span style={{ color: getUsageColor(server.disk.percent) }}>{Math.round(server.disk.percent)}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${server.disk.percent}%`, background: getUsageColor(server.disk.percent), transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>🔗 {server.activeSessions} 세션</span>
                      <span>⏱️ {formatUptime(server.uptime)}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>서버</th>
                  <th>상태</th>
                  <th>CPU</th>
                  <th>메모리</th>
                  <th>디스크</th>
                  <th>네트워크</th>
                  <th>세션</th>
                  <th>업타임</th>
                </tr>
              </thead>
              <tbody>
                {filteredServers.map(server => {
                  const statusConfig = getStatusConfig(server.status);
                  return (
                    <tr key={server.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedServer(server)}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{server.server.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{server.server.ip}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td style={{ color: getUsageColor(server.cpu.usage) }}>{Math.round(server.cpu.usage)}%</td>
                      <td style={{ color: getUsageColor(server.memory.percent) }}>{Math.round(server.memory.percent)}%</td>
                      <td style={{ color: getUsageColor(server.disk.percent) }}>{Math.round(server.disk.percent)}%</td>
                      <td style={{ fontSize: '0.8rem' }}>↓{formatBytes(server.network.inbound)} / ↑{formatBytes(server.network.outbound)} MB/s</td>
                      <td>{server.activeSessions}</td>
                      <td>{formatUptime(server.uptime)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Server Detail Modal */}
      {selectedServer && (
        <div className="modal-overlay active" onClick={() => setSelectedServer(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📊 {selectedServer.server.name}</h3>
              <button className="modal-close" onClick={() => setSelectedServer(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-label">CPU ({selectedServer.cpu.cores} cores)</div>
                  <div className="stat-value" style={{ color: getUsageColor(selectedServer.cpu.usage) }}>{Math.round(selectedServer.cpu.usage)}%</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">메모리 ({formatBytes(selectedServer.memory.total)} GB)</div>
                  <div className="stat-value" style={{ color: getUsageColor(selectedServer.memory.percent) }}>{Math.round(selectedServer.memory.percent)}%</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">디스크 ({formatBytes(selectedServer.disk.total)} GB)</div>
                  <div className="stat-value" style={{ color: getUsageColor(selectedServer.disk.percent) }}>{Math.round(selectedServer.disk.percent)}%</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Load Average</div>
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{selectedServer.load.map(l => l.toFixed(2)).join(' / ')}</div>
                </div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>IP:</span> {selectedServer.server.ip}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>그룹:</span> {selectedServer.server.group}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>업타임:</span> {formatUptime(selectedServer.uptime)}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>세션:</span> {selectedServer.activeSessions}개</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>네트워크 In:</span> {formatBytes(selectedServer.network.inbound)} MB/s</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>네트워크 Out:</span> {formatBytes(selectedServer.network.outbound)} MB/s</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedServer(null)}>닫기</button>
              <button className="btn btn-primary">🔗 연결</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

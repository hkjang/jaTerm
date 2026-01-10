'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface NetworkConnection {
  id: string;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  protocol: 'TCP' | 'UDP' | 'SSH' | 'HTTPS' | 'HTTP';
  status: 'ESTABLISHED' | 'LISTENING' | 'TIME_WAIT' | 'CLOSE_WAIT' | 'SYN_SENT';
  user?: { id: string; name: string };
  server?: { id: string; name: string };
  bytesIn: number;
  bytesOut: number;
  startedAt: string;
  duration: number; // seconds
}

interface NetworkStats {
  totalConnections: number;
  activeSSH: number;
  bandwidth: { in: number; out: number };
  packetLoss: number;
  latency: number;
}

export default function NetworkMonitorPage() {
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const mockConnections: NetworkConnection[] = [
      { id: '1', sourceIp: '192.168.1.100', sourcePort: 45123, destIp: '10.0.1.50', destPort: 22, protocol: 'SSH', status: 'ESTABLISHED', user: { id: 'u1', name: '김관리' }, server: { id: 's1', name: 'prod-web-01' }, bytesIn: 125000, bytesOut: 892000, startedAt: new Date(Date.now() - 45 * 60000).toISOString(), duration: 2700 },
      { id: '2', sourceIp: '192.168.1.102', sourcePort: 52344, destIp: '10.0.1.51', destPort: 22, protocol: 'SSH', status: 'ESTABLISHED', user: { id: 'u2', name: '박개발' }, server: { id: 's2', name: 'prod-web-02' }, bytesIn: 45000, bytesOut: 234000, startedAt: new Date(Date.now() - 15 * 60000).toISOString(), duration: 900 },
      { id: '3', sourceIp: '192.168.1.105', sourcePort: 33456, destIp: '10.0.2.10', destPort: 5432, protocol: 'TCP', status: 'ESTABLISHED', user: { id: 'u3', name: '이백엔드' }, server: { id: 's3', name: 'db-primary' }, bytesIn: 890000, bytesOut: 2340000, startedAt: new Date(Date.now() - 120 * 60000).toISOString(), duration: 7200 },
      { id: '4', sourceIp: '0.0.0.0', sourcePort: 22, destIp: '0.0.0.0', destPort: 0, protocol: 'SSH', status: 'LISTENING', bytesIn: 0, bytesOut: 0, startedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), duration: 604800 },
      { id: '5', sourceIp: '0.0.0.0', sourcePort: 443, destIp: '0.0.0.0', destPort: 0, protocol: 'HTTPS', status: 'LISTENING', bytesIn: 0, bytesOut: 0, startedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), duration: 604800 },
      { id: '6', sourceIp: '192.168.1.110', sourcePort: 48765, destIp: '10.0.1.52', destPort: 22, protocol: 'SSH', status: 'TIME_WAIT', user: { id: 'u4', name: '정테스트' }, server: { id: 's4', name: 'staging-01' }, bytesIn: 12000, bytesOut: 45000, startedAt: new Date(Date.now() - 5 * 60000).toISOString(), duration: 300 },
      { id: '7', sourceIp: '192.168.1.115', sourcePort: 50234, destIp: '10.0.3.20', destPort: 6379, protocol: 'TCP', status: 'ESTABLISHED', server: { id: 's5', name: 'redis-01' }, bytesIn: 5600000, bytesOut: 1230000, startedAt: new Date(Date.now() - 60 * 60000).toISOString(), duration: 3600 },
      { id: '8', sourceIp: '192.168.1.100', sourcePort: 55432, destIp: '10.0.1.55', destPort: 22, protocol: 'SSH', status: 'SYN_SENT', user: { id: 'u1', name: '김관리' }, bytesIn: 0, bytesOut: 0, startedAt: new Date(Date.now() - 5000).toISOString(), duration: 5 },
      { id: '9', sourceIp: '10.0.1.50', sourcePort: 22, destIp: '10.0.1.60', destPort: 3306, protocol: 'TCP', status: 'CLOSE_WAIT', server: { id: 's6', name: 'db-replica' }, bytesIn: 450000, bytesOut: 890000, startedAt: new Date(Date.now() - 30 * 60000).toISOString(), duration: 1800 },
      { id: '10', sourceIp: '192.168.1.120', sourcePort: 41234, destIp: '10.0.1.50', destPort: 80, protocol: 'HTTP', status: 'ESTABLISHED', bytesIn: 23000, bytesOut: 156000, startedAt: new Date(Date.now() - 2 * 60000).toISOString(), duration: 120 },
    ];
    const mockStats: NetworkStats = {
      totalConnections: 156,
      activeSSH: 32,
      bandwidth: { in: 45.6, out: 123.4 },
      packetLoss: 0.02,
      latency: 12,
    };
    setConnections(mockConnections);
    setStats(mockStats);
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => setLastRefresh(new Date()), 5000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const getProtocolConfig = (protocol: string) => {
    switch (protocol) {
      case 'SSH': return { color: '#10b981', label: 'SSH', icon: '🔐' };
      case 'TCP': return { color: '#3b82f6', label: 'TCP', icon: '🔗' };
      case 'UDP': return { color: '#8b5cf6', label: 'UDP', icon: '📡' };
      case 'HTTPS': return { color: '#f59e0b', label: 'HTTPS', icon: '🔒' };
      case 'HTTP': return { color: '#6b7280', label: 'HTTP', icon: '🌐' };
      default: return { color: '#6b7280', label: protocol, icon: '?' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ESTABLISHED': return { color: '#10b981', label: '연결됨' };
      case 'LISTENING': return { color: '#3b82f6', label: '대기중' };
      case 'TIME_WAIT': return { color: '#f59e0b', label: 'TIME_WAIT' };
      case 'CLOSE_WAIT': return { color: '#ef4444', label: 'CLOSE_WAIT' };
      case 'SYN_SENT': return { color: '#8b5cf6', label: 'SYN_SENT' };
      default: return { color: '#6b7280', label: status };
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`;
    return `${Math.floor(seconds / 86400)}일`;
  };

  const filteredConnections = connections.filter(c => {
    if (filterProtocol !== 'all' && c.protocol !== filterProtocol) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery && !c.sourceIp.includes(searchQuery) && !c.destIp.includes(searchQuery) && !c.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.server?.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout 
      title="네트워크 모니터" 
      description="실시간 네트워크 연결 모니터링"
    >
      {/* Stats */}
      {stats && (
        <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-label">🔗 전체 연결</div>
            <div className="stat-value">{stats.totalConnections}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🔐 SSH 세션</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{stats.activeSSH}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📥 인바운드</div>
            <div className="stat-value">{stats.bandwidth.in} Mbps</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📤 아웃바운드</div>
            <div className="stat-value">{stats.bandwidth.out} Mbps</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">⏱️ 지연 시간</div>
            <div className="stat-value">{stats.latency}ms</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 IP, 사용자, 서버 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '220px' }}
        />
        <select className="form-input" value={filterProtocol} onChange={(e) => setFilterProtocol(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 프로토콜</option>
          <option value="SSH">🔐 SSH</option>
          <option value="TCP">🔗 TCP</option>
          <option value="HTTPS">🔒 HTTPS</option>
          <option value="HTTP">🌐 HTTP</option>
          <option value="UDP">📡 UDP</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'ESTABLISHED', 'LISTENING', 'TIME_WAIT'].map(status => (
            <button
              key={status}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? '전체' : getStatusConfig(status).label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          🔄 실시간
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{lastRefresh.toLocaleTimeString('ko-KR')}</span>
      </div>

      {/* Connections Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>프로토콜</th>
                  <th>소스</th>
                  <th>대상</th>
                  <th>상태</th>
                  <th>사용자/서버</th>
                  <th>트래픽</th>
                  <th>지속 시간</th>
                </tr>
              </thead>
              <tbody>
                {filteredConnections.map(conn => {
                  const protocolConfig = getProtocolConfig(conn.protocol);
                  const statusConfig = getStatusConfig(conn.status);
                  return (
                    <tr key={conn.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: `${protocolConfig.color}20`, color: protocolConfig.color, borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>{protocolConfig.icon} {protocolConfig.label}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>{conn.sourceIp}:{conn.sourcePort}</code>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>{conn.destIp}:{conn.destPort}</code>
                      </td>
                      <td>
                        <span style={{ color: statusConfig.color, fontWeight: 500, fontSize: '0.85rem' }}>{statusConfig.label}</span>
                      </td>
                      <td>
                        {conn.user && <div style={{ fontSize: '0.85rem' }}>👤 {conn.user.name}</div>}
                        {conn.server && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>🖥️ {conn.server.name}</div>}
                        {!conn.user && !conn.server && <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: '#3b82f6' }}>↓ {formatBytes(conn.bytesIn)}</span>
                          <span style={{ margin: '0 4px', color: 'var(--color-text-muted)' }}>/</span>
                          <span style={{ color: '#10b981' }}>↑ {formatBytes(conn.bytesOut)}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{formatDuration(conn.duration)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

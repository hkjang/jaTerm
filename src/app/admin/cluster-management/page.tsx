'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ClusterNode {
  id: string;
  name: string;
  role: 'MASTER' | 'WORKER' | 'GATEWAY' | 'STORAGE';
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'MAINTENANCE';
  address: string;
  port: number;
  version: string;
  uptime: number;
  metrics: { cpu: number; memory: number; disk: number; network: number };
  connections: number;
  lastHeartbeat: string;
}

interface Cluster {
  id: string;
  name: string;
  type: 'HA' | 'STANDARD' | 'DEVELOPMENT';
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  nodes: ClusterNode[];
  vip?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClusterManagementPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClusterNode | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const mockClusters: Cluster[] = [
      {
        id: '1', name: 'Production HA Cluster', type: 'HA', status: 'HEALTHY', vip: '10.0.0.100',
        nodes: [
          { id: 'n1', name: 'prod-master-01', role: 'MASTER', status: 'ONLINE', address: '10.0.1.10', port: 8443, version: '2.5.0', uptime: 864000, metrics: { cpu: 32, memory: 58, disk: 45, network: 12 }, connections: 156, lastHeartbeat: new Date(Date.now() - 2000).toISOString() },
          { id: 'n2', name: 'prod-master-02', role: 'MASTER', status: 'ONLINE', address: '10.0.1.11', port: 8443, version: '2.5.0', uptime: 864000, metrics: { cpu: 28, memory: 52, disk: 42, network: 10 }, connections: 142, lastHeartbeat: new Date(Date.now() - 3000).toISOString() },
          { id: 'n3', name: 'prod-worker-01', role: 'WORKER', status: 'ONLINE', address: '10.0.1.20', port: 8443, version: '2.5.0', uptime: 432000, metrics: { cpu: 65, memory: 72, disk: 38, network: 25 }, connections: 234, lastHeartbeat: new Date(Date.now() - 1000).toISOString() },
          { id: 'n4', name: 'prod-worker-02', role: 'WORKER', status: 'ONLINE', address: '10.0.1.21', port: 8443, version: '2.5.0', uptime: 432000, metrics: { cpu: 58, memory: 68, disk: 35, network: 22 }, connections: 198, lastHeartbeat: new Date(Date.now() - 2500).toISOString() },
          { id: 'n5', name: 'prod-gateway-01', role: 'GATEWAY', status: 'ONLINE', address: '10.0.1.30', port: 443, version: '2.5.0', uptime: 864000, metrics: { cpu: 22, memory: 35, disk: 18, network: 45 }, connections: 512, lastHeartbeat: new Date(Date.now() - 1500).toISOString() },
        ],
        createdAt: new Date(Date.now() - 365 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 2 * 3600000).toISOString()
      },
      {
        id: '2', name: 'Staging Cluster', type: 'STANDARD', status: 'HEALTHY',
        nodes: [
          { id: 'n6', name: 'staging-master', role: 'MASTER', status: 'ONLINE', address: '10.0.2.10', port: 8443, version: '2.6.0-beta', uptime: 172800, metrics: { cpu: 18, memory: 42, disk: 28, network: 8 }, connections: 45, lastHeartbeat: new Date(Date.now() - 4000).toISOString() },
          { id: 'n7', name: 'staging-worker', role: 'WORKER', status: 'ONLINE', address: '10.0.2.20', port: 8443, version: '2.6.0-beta', uptime: 172800, metrics: { cpu: 35, memory: 55, disk: 32, network: 15 }, connections: 78, lastHeartbeat: new Date(Date.now() - 3500).toISOString() },
        ],
        createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 12 * 3600000).toISOString()
      },
      {
        id: '3', name: 'DR Cluster (대전)', type: 'HA', status: 'DEGRADED', vip: '10.1.0.100',
        nodes: [
          { id: 'n8', name: 'dr-master-01', role: 'MASTER', status: 'ONLINE', address: '10.1.1.10', port: 8443, version: '2.5.0', uptime: 604800, metrics: { cpu: 12, memory: 28, disk: 22, network: 3 }, connections: 5, lastHeartbeat: new Date(Date.now() - 5000).toISOString() },
          { id: 'n9', name: 'dr-master-02', role: 'MASTER', status: 'OFFLINE', address: '10.1.1.11', port: 8443, version: '2.5.0', uptime: 0, metrics: { cpu: 0, memory: 0, disk: 0, network: 0 }, connections: 0, lastHeartbeat: new Date(Date.now() - 3600000).toISOString() },
          { id: 'n10', name: 'dr-storage', role: 'STORAGE', status: 'ONLINE', address: '10.1.1.50', port: 9000, version: '2.5.0', uptime: 604800, metrics: { cpu: 8, memory: 22, disk: 65, network: 5 }, connections: 12, lastHeartbeat: new Date(Date.now() - 2000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 120 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 3600000).toISOString()
      },
    ];
    setClusters(mockClusters);
    setLoading(false);
  }, []);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'MASTER': return { color: '#8b5cf6', label: '마스터', icon: '👑' };
      case 'WORKER': return { color: '#3b82f6', label: '워커', icon: '⚙️' };
      case 'GATEWAY': return { color: '#10b981', label: '게이트웨이', icon: '🚪' };
      case 'STORAGE': return { color: '#f59e0b', label: '스토리지', icon: '💾' };
      default: return { color: '#6b7280', label: role, icon: '?' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ONLINE': case 'HEALTHY': return { color: '#10b981', label: status === 'ONLINE' ? '온라인' : '정상', icon: '✓' };
      case 'OFFLINE': return { color: '#ef4444', label: '오프라인', icon: '✗' };
      case 'DEGRADED': return { color: '#f59e0b', label: '저하', icon: '⚠️' };
      case 'MAINTENANCE': return { color: '#3b82f6', label: '유지보수', icon: '🔧' };
      default: return { color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'HA': return { color: '#10b981', label: 'HA (고가용성)', icon: '🔄' };
      case 'STANDARD': return { color: '#3b82f6', label: '표준', icon: '📦' };
      case 'DEVELOPMENT': return { color: '#6b7280', label: '개발', icon: '🛠️' };
      default: return { color: '#6b7280', label: type, icon: '?' };
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간`;
    return `${Math.floor(seconds / 86400)}일`;
  };

  const totalNodes = clusters.reduce((a, c) => a + c.nodes.length, 0);
  const onlineNodes = clusters.reduce((a, c) => a + c.nodes.filter(n => n.status === 'ONLINE').length, 0);
  const totalConnections = clusters.reduce((a, c) => a + c.nodes.reduce((b, n) => b + n.connections, 0), 0);

  return (
    <AdminLayout 
      title="클러스터 관리" 
      description="jaTerm 클러스터 노드 관리 및 모니터링"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">클러스터</div>
          <div className="stat-value">{clusters.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 노드</div>
          <div className="stat-value">{totalNodes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 온라인</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{onlineNodes}/{totalNodes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 연결</div>
          <div className="stat-value">{totalConnections.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔄 HA 클러스터</div>
          <div className="stat-value">{clusters.filter(c => c.type === 'HA').length}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          🔄 실시간 모니터링
        </label>
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary">🔄 Failover 테스트</button>
        <button className="btn btn-primary">+ 클러스터 추가</button>
      </div>

      {/* Clusters */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {clusters.map(cluster => {
            const typeConfig = getTypeConfig(cluster.type);
            const statusConfig = getStatusConfig(cluster.status);
            const avgCpu = cluster.nodes.filter(n => n.status === 'ONLINE').reduce((a, n) => a + n.metrics.cpu, 0) / Math.max(cluster.nodes.filter(n => n.status === 'ONLINE').length, 1);
            const avgMem = cluster.nodes.filter(n => n.status === 'ONLINE').reduce((a, n) => a + n.metrics.memory, 0) / Math.max(cluster.nodes.filter(n => n.status === 'ONLINE').length, 1);
            return (
              <div key={cluster.id} className="card" style={{ padding: '20px', borderLeft: `4px solid ${statusConfig.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{typeConfig.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{cluster.name}</span>
                      <span style={{ padding: '4px 10px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>{statusConfig.icon} {statusConfig.label}</span>
                      <span style={{ padding: '4px 10px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '6px', fontSize: '0.8rem' }}>{typeConfig.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {cluster.vip && <span>🌐 VIP: {cluster.vip}</span>}
                      <span>📊 CPU: {avgCpu.toFixed(0)}%</span>
                      <span>💾 메모리: {avgMem.toFixed(0)}%</span>
                      <span>🔗 연결: {cluster.nodes.reduce((a, n) => a + n.connections, 0)}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCluster(cluster)}>상세</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {cluster.nodes.map(node => {
                    const roleConfig = getRoleConfig(node.role);
                    const nodeStatusConfig = getStatusConfig(node.status);
                    return (
                      <div key={node.id} style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', cursor: 'pointer', borderLeft: `3px solid ${nodeStatusConfig.color}` }} onClick={() => setSelectedNode(node)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span>{roleConfig.icon}</span>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{node.name}</span>
                          <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: nodeStatusConfig.color }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>CPU {node.metrics.cpu}%</span>
                          <span>MEM {node.metrics.memory}%</span>
                          <span>{node.connections} conn</span>
                        </div>
                        {node.status === 'ONLINE' && (
                          <div style={{ marginTop: '8px', height: '4px', background: 'var(--color-bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${node.metrics.cpu}%`, background: node.metrics.cpu > 80 ? '#ef4444' : node.metrics.cpu > 60 ? '#f59e0b' : '#10b981' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Node Detail Modal */}
      {selectedNode && (
        <div className="modal-overlay active" onClick={() => setSelectedNode(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getRoleConfig(selectedNode.role).icon} {selectedNode.name}</h3>
              <button className="modal-close" onClick={() => setSelectedNode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getStatusConfig(selectedNode.status).color}20`, color: getStatusConfig(selectedNode.status).color, borderRadius: '6px' }}>{getStatusConfig(selectedNode.status).icon} {getStatusConfig(selectedNode.status).label}</span>
                <span style={{ padding: '4px 10px', background: `${getRoleConfig(selectedNode.role).color}20`, color: getRoleConfig(selectedNode.role).color, borderRadius: '6px' }}>{getRoleConfig(selectedNode.role).label}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>주소:</span> {selectedNode.address}:{selectedNode.port}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>버전:</span> {selectedNode.version}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>업타임:</span> {formatUptime(selectedNode.uptime)}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>연결:</span> {selectedNode.connections}</div>
              </div>
              
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>리소스 사용량</div>
              {[{ label: 'CPU', value: selectedNode.metrics.cpu }, { label: '메모리', value: selectedNode.metrics.memory }, { label: '디스크', value: selectedNode.metrics.disk }, { label: '네트워크', value: selectedNode.metrics.network }].map(m => (
                <div key={m.label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span>{m.label}</span><span>{m.value}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${m.value}%`, background: m.value > 80 ? '#ef4444' : m.value > 60 ? '#f59e0b' : '#10b981', transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              {selectedNode.status === 'ONLINE' && <button className="btn btn-secondary">🔧 유지보수 모드</button>}
              {selectedNode.status === 'OFFLINE' && <button className="btn btn-primary">🔄 재시작</button>}
              <button className="btn btn-ghost" onClick={() => setSelectedNode(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

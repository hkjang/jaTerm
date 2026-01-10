'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface NetworkNode {
  id: string;
  name: string;
  type: 'GATEWAY' | 'SWITCH' | 'ROUTER' | 'FIREWALL' | 'SERVER' | 'LOAD_BALANCER' | 'DATABASE';
  ip: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  connections: string[];
  datacenter: string;
  metrics: { latency: number; packetLoss: number; bandwidth: number };
}

export default function NetworkTopologyPage() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'SERVER', ip: '', datacenter: 'DC1', connections: '' });

  useEffect(() => {
    const mock: NetworkNode[] = [
      { id: 'n1', name: 'Internet Gateway', type: 'GATEWAY', ip: '203.0.113.1', status: 'ONLINE', connections: ['n2', 'n3'], datacenter: 'DC1', metrics: { latency: 5, packetLoss: 0, bandwidth: 10000 } },
      { id: 'n2', name: 'Main Firewall', type: 'FIREWALL', ip: '10.0.0.1', status: 'ONLINE', connections: ['n4', 'n5'], datacenter: 'DC1', metrics: { latency: 1, packetLoss: 0, bandwidth: 40000 } },
      { id: 'n3', name: 'Backup Firewall', type: 'FIREWALL', ip: '10.0.0.2', status: 'ONLINE', connections: ['n4', 'n5'], datacenter: 'DC1', metrics: { latency: 1, packetLoss: 0, bandwidth: 40000 } },
      { id: 'n4', name: 'Core Switch A', type: 'SWITCH', ip: '10.0.1.1', status: 'ONLINE', connections: ['n6', 'n7', 'n8'], datacenter: 'DC1', metrics: { latency: 0.5, packetLoss: 0, bandwidth: 100000 } },
      { id: 'n5', name: 'Core Switch B', type: 'SWITCH', ip: '10.0.1.2', status: 'WARNING', connections: ['n6', 'n7', 'n8'], datacenter: 'DC1', metrics: { latency: 2, packetLoss: 0.1, bandwidth: 100000 } },
      { id: 'n6', name: 'Web Load Balancer', type: 'LOAD_BALANCER', ip: '10.0.2.1', status: 'ONLINE', connections: ['n9', 'n10', 'n11'], datacenter: 'DC1', metrics: { latency: 1, packetLoss: 0, bandwidth: 50000 } },
      { id: 'n7', name: 'API Load Balancer', type: 'LOAD_BALANCER', ip: '10.0.2.2', status: 'ONLINE', connections: ['n12', 'n13'], datacenter: 'DC1', metrics: { latency: 1, packetLoss: 0, bandwidth: 50000 } },
      { id: 'n8', name: 'DB Router', type: 'ROUTER', ip: '10.0.3.1', status: 'ONLINE', connections: ['n14', 'n15'], datacenter: 'DC1', metrics: { latency: 0.5, packetLoss: 0, bandwidth: 25000 } },
      { id: 'n9', name: 'Web Server 1', type: 'SERVER', ip: '10.0.10.1', status: 'ONLINE', connections: [], datacenter: 'DC1', metrics: { latency: 0.2, packetLoss: 0, bandwidth: 10000 } },
      { id: 'n10', name: 'Web Server 2', type: 'SERVER', ip: '10.0.10.2', status: 'ONLINE', connections: [], datacenter: 'DC1', metrics: { latency: 0.2, packetLoss: 0, bandwidth: 10000 } },
      { id: 'n11', name: 'Web Server 3', type: 'SERVER', ip: '10.0.10.3', status: 'OFFLINE', connections: [], datacenter: 'DC1', metrics: { latency: 0, packetLoss: 100, bandwidth: 0 } },
      { id: 'n12', name: 'API Server 1', type: 'SERVER', ip: '10.0.11.1', status: 'ONLINE', connections: [], datacenter: 'DC1', metrics: { latency: 0.3, packetLoss: 0, bandwidth: 10000 } },
      { id: 'n13', name: 'API Server 2', type: 'SERVER', ip: '10.0.11.2', status: 'ONLINE', connections: [], datacenter: 'DC1', metrics: { latency: 0.3, packetLoss: 0, bandwidth: 10000 } },
      { id: 'n14', name: 'PostgreSQL Primary', type: 'DATABASE', ip: '10.0.20.1', status: 'ONLINE', connections: ['n15'], datacenter: 'DC1', metrics: { latency: 0.1, packetLoss: 0, bandwidth: 25000 } },
      { id: 'n15', name: 'PostgreSQL Replica', type: 'DATABASE', ip: '10.0.20.2', status: 'ONLINE', connections: [], datacenter: 'DC1', metrics: { latency: 0.1, packetLoss: 0, bandwidth: 25000 } },
    ];
    setNodes(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newNode: NetworkNode = {
      id: `n${nodes.length + 1}`, name: formData.name, type: formData.type as NetworkNode['type'], ip: formData.ip, status: 'ONLINE', connections: formData.connections.split(',').map(s => s.trim()).filter(Boolean), datacenter: formData.datacenter, metrics: { latency: 0, packetLoss: 0, bandwidth: 10000 },
    };
    setNodes([...nodes, newNode]);
    setSuccess('노드가 추가되었습니다.');
    setShowCreateModal(false);
    setFormData({ name: '', type: 'SERVER', ip: '', datacenter: 'DC1', connections: '' });
  };

  const handleDelete = (id: string) => { if (confirm('삭제하시겠습니까?')) { setNodes(nodes.filter(n => n.id !== id)); setSuccess('삭제되었습니다.'); setSelectedNode(null); } };
  const handleToggleStatus = (node: NetworkNode) => { setNodes(nodes.map(n => n.id === node.id ? { ...n, status: n.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' } : n)); setSuccess('상태가 변경되었습니다.'); };

  const getTypeIcon = (t: string) => ({ GATEWAY: '🌐', SWITCH: '🔀', ROUTER: '📡', FIREWALL: '🔥', SERVER: '🖥️', LOAD_BALANCER: '⚖️', DATABASE: '🗄️' }[t] || '📦');
  const getStatusStyle = (s: string) => ({ ONLINE: '#10b981', OFFLINE: '#ef4444', WARNING: '#f59e0b' }[s] || '#6b7280');

  const filtered = nodes.filter(n => (filterType === 'all' || n.type === filterType) && (filterStatus === 'all' || n.status === filterStatus));
  const onlineCount = nodes.filter(n => n.status === 'ONLINE').length;

  return (
    <AdminLayout title="네트워크 토폴로지" description="네트워크 인프라 및 연결 상태 시각화" actions={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 노드 추가</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 노드</div><div className="stat-value">{nodes.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 온라인</div><div className="stat-value" style={{ color: '#10b981' }}>{onlineCount}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 오프라인</div><div className="stat-value" style={{ color: '#ef4444' }}>{nodes.filter(n => n.status === 'OFFLINE').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 경고</div><div className="stat-value" style={{ color: '#f59e0b' }}>{nodes.filter(n => n.status === 'WARNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">가용률</div><div className="stat-value">{((onlineCount / nodes.length) * 100).toFixed(1)}%</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 유형</option><option value="GATEWAY">Gateway</option><option value="FIREWALL">Firewall</option><option value="SWITCH">Switch</option><option value="ROUTER">Router</option><option value="LOAD_BALANCER">Load Balancer</option><option value="SERVER">Server</option><option value="DATABASE">Database</option></select>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 120 }}><option value="all">전체 상태</option><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option><option value="WARNING">Warning</option></select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(node => (
            <div key={node.id} className="card" style={{ cursor: 'pointer', borderTop: `3px solid ${getStatusStyle(node.status)}` }} onClick={() => setSelectedNode(node)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: '1.5rem' }}>{getTypeIcon(node.type)}</span><div><div style={{ fontWeight: 600 }}>{node.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{node.type}</div></div></div>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: getStatusStyle(node.status) }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: 8 }}>{node.ip}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span>⏱️ {node.metrics.latency}ms</span>
                <span>📊 {(node.metrics.bandwidth / 1000).toFixed(0)} Gbps</span>
                {node.metrics.packetLoss > 0 && <span style={{ color: '#ef4444' }}>❌ {node.metrics.packetLoss}% loss</span>}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>🔗 연결: {node.connections.length}개</div>
            </div>
          ))}
        </div>
      )}

      {selectedNode && (
        <div className="modal-overlay active" onClick={() => setSelectedNode(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedNode.type)} {selectedNode.name}</h3><button className="modal-close" onClick={() => setSelectedNode(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusStyle(selectedNode.status)}20`, color: getStatusStyle(selectedNode.status), borderRadius: 6 }}>{selectedNode.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedNode.type}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedNode.datacenter}</span></div>
              <div className="card" style={{ padding: 12, marginBottom: 16 }}><code style={{ fontSize: '1rem' }}>{selectedNode.ip}</code></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Latency</div><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selectedNode.metrics.latency}ms</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Bandwidth</div><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{(selectedNode.metrics.bandwidth / 1000).toFixed(0)} Gbps</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Packet Loss</div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: selectedNode.metrics.packetLoss > 0 ? '#ef4444' : '#10b981' }}>{selectedNode.metrics.packetLoss}%</div></div>
              </div>
              {selectedNode.connections.length > 0 && <div><b>연결된 노드:</b><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>{selectedNode.connections.map(c => { const connNode = nodes.find(n => n.id === c); return connNode ? <span key={c} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{getTypeIcon(connNode.type)} {connNode.name}</span> : null; })}</div></div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleToggleStatus(selectedNode)}>{selectedNode.status === 'ONLINE' ? '⏸️ Offline으로' : '▶️ Online으로'}</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedNode.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedNode(null)}>닫기</button></div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">➕ 노드 추가</h3><button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="GATEWAY">Gateway</option><option value="FIREWALL">Firewall</option><option value="SWITCH">Switch</option><option value="ROUTER">Router</option><option value="LOAD_BALANCER">Load Balancer</option><option value="SERVER">Server</option><option value="DATABASE">Database</option></select></div>
                  <div className="form-group"><label className="form-label">데이터센터</label><input className="form-input" value={formData.datacenter} onChange={e => setFormData({...formData, datacenter: e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">IP 주소</label><input className="form-input" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} required placeholder="10.0.0.1" /></div>
                <div className="form-group"><label className="form-label">연결 노드 ID (쉼표 구분)</label><input className="form-input" value={formData.connections} onChange={e => setFormData({...formData, connections: e.target.value})} placeholder="n1, n2" /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button><button type="submit" className="btn btn-primary">추가</button></div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface NetworkPolicy {
  id: string;
  name: string;
  namespace: string;
  type: 'INGRESS' | 'EGRESS' | 'BOTH';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  priority: number;
  podSelector: { key: string; value: string }[];
  rules: { direction: 'INGRESS' | 'EGRESS'; protocol: 'TCP' | 'UDP' | 'ALL'; port: number | string; target: string; action: 'ALLOW' | 'DENY' }[];
  appliedPods: number;
  createdAt: string;
  updatedAt: string;
}

interface Firewall {
  id: string;
  name: string;
  zone: 'INTERNAL' | 'DMZ' | 'EXTERNAL';
  rules: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'ERROR';
  lastUpdated: string;
}

export default function NetworkPolicyPage() {
  const [policies, setPolicies] = useState<NetworkPolicy[]>([]);
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policies' | 'firewalls'>('policies');
  const [selectedPolicy, setSelectedPolicy] = useState<NetworkPolicy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNamespace, setFilterNamespace] = useState<string>('all');

  useEffect(() => {
    const mockPolicies: NetworkPolicy[] = [
      { id: '1', name: 'allow-api-ingress', namespace: 'jaterm', type: 'INGRESS', status: 'ACTIVE', priority: 100, podSelector: [{ key: 'app', value: 'api' }], rules: [{ direction: 'INGRESS', protocol: 'TCP', port: 8080, target: 'api-gateway', action: 'ALLOW' }, { direction: 'INGRESS', protocol: 'TCP', port: 443, target: '*', action: 'ALLOW' }], appliedPods: 6, createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString() },
      { id: '2', name: 'deny-external-db', namespace: 'data', type: 'INGRESS', status: 'ACTIVE', priority: 50, podSelector: [{ key: 'tier', value: 'database' }], rules: [{ direction: 'INGRESS', protocol: 'TCP', port: 5432, target: '10.0.0.0/8', action: 'ALLOW' }, { direction: 'INGRESS', protocol: 'ALL', port: '*', target: '0.0.0.0/0', action: 'DENY' }], appliedPods: 4, createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString() },
      { id: '3', name: 'allow-redis-internal', namespace: 'data', type: 'BOTH', status: 'ACTIVE', priority: 80, podSelector: [{ key: 'app', value: 'redis' }], rules: [{ direction: 'INGRESS', protocol: 'TCP', port: 6379, target: 'app=api', action: 'ALLOW' }, { direction: 'EGRESS', protocol: 'TCP', port: 6380, target: 'redis-sentinel', action: 'ALLOW' }], appliedPods: 3, createdAt: new Date(Date.now() - 120 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString() },
      { id: '4', name: 'egress-internet-allow', namespace: 'jaterm', type: 'EGRESS', status: 'ACTIVE', priority: 200, podSelector: [{ key: 'internet', value: 'allowed' }], rules: [{ direction: 'EGRESS', protocol: 'TCP', port: 443, target: '0.0.0.0/0', action: 'ALLOW' }, { direction: 'EGRESS', protocol: 'UDP', port: 53, target: '*', action: 'ALLOW' }], appliedPods: 8, createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString() },
      { id: '5', name: 'monitoring-access', namespace: 'monitoring', type: 'INGRESS', status: 'ACTIVE', priority: 150, podSelector: [{ key: 'app', value: 'prometheus' }], rules: [{ direction: 'INGRESS', protocol: 'TCP', port: 9090, target: 'grafana', action: 'ALLOW' }], appliedPods: 2, createdAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
      { id: '6', name: 'default-deny-all', namespace: 'default', type: 'BOTH', status: 'INACTIVE', priority: 1, podSelector: [], rules: [{ direction: 'INGRESS', protocol: 'ALL', port: '*', target: '*', action: 'DENY' }, { direction: 'EGRESS', protocol: 'ALL', port: '*', target: '*', action: 'DENY' }], appliedPods: 0, createdAt: new Date(Date.now() - 200 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 200 * 24 * 3600000).toISOString() },
    ];
    const mockFirewalls: Firewall[] = [
      { id: '1', name: 'internal-fw', zone: 'INTERNAL', rules: 45, status: 'ACTIVE', lastUpdated: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: '2', name: 'dmz-fw', zone: 'DMZ', rules: 28, status: 'ACTIVE', lastUpdated: new Date(Date.now() - 12 * 3600000).toISOString() },
      { id: '3', name: 'external-fw', zone: 'EXTERNAL', rules: 35, status: 'ACTIVE', lastUpdated: new Date(Date.now() - 6 * 3600000).toISOString() },
    ];
    setPolicies(mockPolicies);
    setFirewalls(mockFirewalls);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'INGRESS': return { color: '#3b82f6', label: 'Ingress', icon: '⬇️' };
      case 'EGRESS': return { color: '#10b981', label: 'Egress', icon: '⬆️' };
      case 'BOTH': return { color: '#8b5cf6', label: 'Both', icon: '↕️' };
      default: return { color: '#6b7280', label: type, icon: '?' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: '#10b981', label: '활성', icon: '✓' };
      case 'INACTIVE': return { color: '#6b7280', label: '비활성', icon: '○' };
      case 'PENDING': return { color: '#f59e0b', label: '대기중', icon: '⏳' };
      case 'MAINTENANCE': return { color: '#f59e0b', label: '유지보수', icon: '🔧' };
      case 'ERROR': return { color: '#ef4444', label: '오류', icon: '✗' };
      default: return { color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getZoneConfig = (zone: string) => {
    switch (zone) {
      case 'INTERNAL': return { color: '#10b981', label: '내부', icon: '🏠' };
      case 'DMZ': return { color: '#f59e0b', label: 'DMZ', icon: '⚠️' };
      case 'EXTERNAL': return { color: '#ef4444', label: '외부', icon: '🌐' };
      default: return { color: '#6b7280', label: zone, icon: '?' };
    }
  };

  const namespaces = [...new Set(policies.map(p => p.namespace))];
  const filteredPolicies = policies.filter(p => {
    if (filterNamespace !== 'all' && p.namespace !== filterNamespace) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activePolicies = policies.filter(p => p.status === 'ACTIVE').length;
  const totalPods = policies.reduce((sum, p) => sum + p.appliedPods, 0);
  const totalRules = policies.reduce((sum, p) => sum + p.rules.length, 0);

  return (
    <AdminLayout 
      title="네트워크 정책" 
      description="네트워크 접근 제어 및 방화벽 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">정책</div>
          <div className="stat-value">{policies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 활성</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{activePolicies}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">적용된 Pod</div>
          <div className="stat-value">{totalPods}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 규칙</div>
          <div className="stat-value">{totalRules}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">방화벽</div>
          <div className="stat-value">{firewalls.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
        <button className={`btn btn-ghost ${activeTab === 'policies' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('policies')} style={{ borderRadius: '8px 8px 0 0' }}>📋 네트워크 정책</button>
        <button className={`btn btn-ghost ${activeTab === 'firewalls' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('firewalls')} style={{ borderRadius: '8px 8px 0 0' }}>🛡️ 방화벽</button>
      </div>

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input type="text" className="form-input" placeholder="🔍 정책 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '250px' }} />
            <select className="form-input" value={filterNamespace} onChange={(e) => setFilterNamespace(e.target.value)} style={{ maxWidth: '180px' }}>
              <option value="all">전체 네임스페이스</option>
              {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary">+ 정책 추가</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
              {filteredPolicies.map(policy => {
                const typeConfig = getTypeConfig(policy.type);
                const statusConfig = getStatusConfig(policy.status);
                return (
                  <div key={policy.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${statusConfig.color}`, cursor: 'pointer' }} onClick={() => setSelectedPolicy(policy)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{typeConfig.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{policy.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{policy.namespace} • 우선순위 {policy.priority}</div>
                      </div>
                      <span style={{ padding: '4px 10px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>{statusConfig.icon} {statusConfig.label}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 8px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.75rem' }}>{typeConfig.label}</span>
                      {policy.podSelector.map((s, i) => <span key={i} style={{ padding: '3px 8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', fontSize: '0.75rem' }}>{s.key}={s.value}</span>)}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.85rem', textAlign: 'center', background: 'var(--color-bg-secondary)', padding: '10px', borderRadius: '6px' }}>
                      <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>규칙</div><div style={{ fontWeight: 600 }}>{policy.rules.length}</div></div>
                      <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Pod</div><div style={{ fontWeight: 600 }}>{policy.appliedPods}</div></div>
                      <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>업데이트</div><div style={{ fontWeight: 600 }}>{new Date(policy.updatedAt).toLocaleDateString('ko-KR')}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Firewalls Tab */}
      {activeTab === 'firewalls' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {firewalls.map(fw => {
            const zoneConfig = getZoneConfig(fw.zone);
            const statusConfig = getStatusConfig(fw.status);
            return (
              <div key={fw.id} className="card" style={{ padding: '20px', borderLeft: `4px solid ${zoneConfig.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>{zoneConfig.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{fw.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{zoneConfig.label} Zone</div>
                  </div>
                  <span style={{ padding: '4px 12px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '6px', fontSize: '0.85rem' }}>{statusConfig.icon} {statusConfig.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fw.rules}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>규칙</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(fw.lastUpdated).toLocaleTimeString('ko-KR')}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>마지막 업데이트</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Policy Detail Modal */}
      {selectedPolicy && (
        <div className="modal-overlay active" onClick={() => setSelectedPolicy(null)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedPolicy.type).icon} {selectedPolicy.name}</h3>
              <button className="modal-close" onClick={() => setSelectedPolicy(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getStatusConfig(selectedPolicy.status).color}20`, color: getStatusConfig(selectedPolicy.status).color, borderRadius: '6px' }}>{getStatusConfig(selectedPolicy.status).icon} {getStatusConfig(selectedPolicy.status).label}</span>
                <span style={{ padding: '4px 10px', background: `${getTypeConfig(selectedPolicy.type).color}20`, color: getTypeConfig(selectedPolicy.type).color, borderRadius: '6px' }}>{getTypeConfig(selectedPolicy.type).label}</span>
                <span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>{selectedPolicy.namespace}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>우선순위:</span> {selectedPolicy.priority}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>적용된 Pod:</span> {selectedPolicy.appliedPods}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>규칙 수:</span> {selectedPolicy.rules.length}</div>
              </div>
              
              {selectedPolicy.podSelector.length > 0 && (
                <>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>🏷️ Pod Selector</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {selectedPolicy.podSelector.map((s, i) => <code key={i} style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>{s.key}={s.value}</code>)}
                  </div>
                </>
              )}
              
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>📜 규칙</div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>방향</th><th>프로토콜</th><th>포트</th><th>대상</th><th>액션</th></tr>
                  </thead>
                  <tbody>
                    {selectedPolicy.rules.map((rule, i) => (
                      <tr key={i}>
                        <td><span style={{ padding: '3px 8px', background: rule.direction === 'INGRESS' ? '#3b82f620' : '#10b98120', color: rule.direction === 'INGRESS' ? '#3b82f6' : '#10b981', borderRadius: '4px', fontSize: '0.8rem' }}>{rule.direction === 'INGRESS' ? '⬇️' : '⬆️'} {rule.direction}</span></td>
                        <td>{rule.protocol}</td>
                        <td><code>{rule.port}</code></td>
                        <td><code style={{ fontSize: '0.85rem' }}>{rule.target}</code></td>
                        <td><span style={{ color: rule.action === 'ALLOW' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{rule.action === 'ALLOW' ? '✓ ALLOW' : '✗ DENY'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">✏️ 수정</button>
              <button className="btn btn-ghost" onClick={() => setSelectedPolicy(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

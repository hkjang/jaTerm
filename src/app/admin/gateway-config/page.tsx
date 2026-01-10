'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface GatewayRoute {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';
  target: string;
  protocol: 'HTTP' | 'HTTPS' | 'WS' | 'WSS' | 'SSH';
  enabled: boolean;
  rateLimit?: { requests: number; window: number };
  timeout: number;
  retries: number;
  healthCheck: boolean;
  requestCount: number;
  errorCount: number;
}

interface Gateway {
  id: string;
  name: string;
  type: 'API' | 'SSH' | 'WEBSOCKET' | 'MIXED';
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
  listenAddress: string;
  listenPort: number;
  ssl: { enabled: boolean; certificate?: string; expiry?: string };
  routes: GatewayRoute[];
  rateLimit: { enabled: boolean; maxRequests: number; windowSeconds: number };
  authentication: { type: 'NONE' | 'JWT' | 'API_KEY' | 'OAUTH' | 'MTLS'; required: boolean };
  cors: { enabled: boolean; origins: string[] };
  logging: { enabled: boolean; level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' };
  stats: { totalRequests: number; activeConnections: number; avgLatency: number; errorRate: number };
  createdAt: string;
  updatedAt: string;
}

export default function GatewayConfigPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [activeTab, setActiveTab] = useState<'routes' | 'security' | 'settings'>('routes');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const mockGateways: Gateway[] = [
      {
        id: '1', name: 'API Gateway (메인)', type: 'MIXED', status: 'RUNNING', listenAddress: '0.0.0.0', listenPort: 443,
        ssl: { enabled: true, certificate: '*.jaterm.io', expiry: new Date(Date.now() + 120 * 24 * 3600000).toISOString() },
        routes: [
          { id: 'r1', path: '/api/v1/*', method: 'ALL', target: 'http://api-service:8080', protocol: 'HTTP', enabled: true, rateLimit: { requests: 1000, window: 60 }, timeout: 30, retries: 3, healthCheck: true, requestCount: 1250000, errorCount: 125 },
          { id: 'r2', path: '/auth/*', method: 'ALL', target: 'http://auth-service:8081', protocol: 'HTTP', enabled: true, rateLimit: { requests: 100, window: 60 }, timeout: 10, retries: 2, healthCheck: true, requestCount: 450000, errorCount: 45 },
          { id: 'r3', path: '/ws/*', method: 'ALL', target: 'ws://websocket-service:8082', protocol: 'WS', enabled: true, timeout: 0, retries: 0, healthCheck: true, requestCount: 89000, errorCount: 8 },
          { id: 'r4', path: '/admin/*', method: 'ALL', target: 'http://admin-service:8083', protocol: 'HTTP', enabled: true, timeout: 60, retries: 3, healthCheck: true, requestCount: 23000, errorCount: 2 },
        ],
        rateLimit: { enabled: true, maxRequests: 10000, windowSeconds: 60 },
        authentication: { type: 'JWT', required: true },
        cors: { enabled: true, origins: ['https://jaterm.io', 'https://app.jaterm.io'] },
        logging: { enabled: true, level: 'INFO' },
        stats: { totalRequests: 1812000, activeConnections: 456, avgLatency: 45, errorRate: 0.01 },
        createdAt: new Date(Date.now() - 365 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: '2', name: 'SSH Gateway', type: 'SSH', status: 'RUNNING', listenAddress: '0.0.0.0', listenPort: 2222,
        ssl: { enabled: false },
        routes: [
          { id: 'r5', path: '/ssh/*', method: 'ALL', target: 'ssh://ssh-proxy:22', protocol: 'SSH', enabled: true, timeout: 0, retries: 0, healthCheck: true, requestCount: 156000, errorCount: 15 },
        ],
        rateLimit: { enabled: true, maxRequests: 100, windowSeconds: 60 },
        authentication: { type: 'MTLS', required: true },
        cors: { enabled: false, origins: [] },
        logging: { enabled: true, level: 'INFO' },
        stats: { totalRequests: 156000, activeConnections: 89, avgLatency: 12, errorRate: 0.009 },
        createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 2 * 3600000).toISOString()
      },
      {
        id: '3', name: 'WebSocket Gateway', type: 'WEBSOCKET', status: 'RUNNING', listenAddress: '0.0.0.0', listenPort: 8443,
        ssl: { enabled: true, certificate: 'ws.jaterm.io', expiry: new Date(Date.now() + 90 * 24 * 3600000).toISOString() },
        routes: [
          { id: 'r6', path: '/terminal/*', method: 'ALL', target: 'ws://terminal-service:3000', protocol: 'WSS', enabled: true, timeout: 0, retries: 0, healthCheck: true, requestCount: 234000, errorCount: 12 },
          { id: 'r7', path: '/notifications/*', method: 'ALL', target: 'ws://notification-service:3001', protocol: 'WSS', enabled: true, timeout: 0, retries: 0, healthCheck: true, requestCount: 89000, errorCount: 5 },
        ],
        rateLimit: { enabled: false, maxRequests: 0, windowSeconds: 0 },
        authentication: { type: 'JWT', required: true },
        cors: { enabled: true, origins: ['https://jaterm.io'] },
        logging: { enabled: true, level: 'WARN' },
        stats: { totalRequests: 323000, activeConnections: 234, avgLatency: 8, errorRate: 0.005 },
        createdAt: new Date(Date.now() - 120 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: '4', name: 'Internal API Gateway', type: 'API', status: 'STOPPED', listenAddress: '127.0.0.1', listenPort: 8080,
        ssl: { enabled: false },
        routes: [
          { id: 'r8', path: '/metrics/*', method: 'GET', target: 'http://metrics-service:9090', protocol: 'HTTP', enabled: true, timeout: 5, retries: 1, healthCheck: false, requestCount: 45000, errorCount: 0 },
          { id: 'r9', path: '/health/*', method: 'GET', target: 'http://health-service:9091', protocol: 'HTTP', enabled: true, timeout: 2, retries: 0, healthCheck: false, requestCount: 120000, errorCount: 0 },
        ],
        rateLimit: { enabled: false, maxRequests: 0, windowSeconds: 0 },
        authentication: { type: 'NONE', required: false },
        cors: { enabled: false, origins: [] },
        logging: { enabled: true, level: 'DEBUG' },
        stats: { totalRequests: 165000, activeConnections: 0, avgLatency: 2, errorRate: 0 },
        createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString()
      },
    ];
    setGateways(mockGateways);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'API': return { color: '#3b82f6', label: 'API', icon: '🔌' };
      case 'SSH': return { color: '#10b981', label: 'SSH', icon: '🔐' };
      case 'WEBSOCKET': return { color: '#8b5cf6', label: 'WebSocket', icon: '🔗' };
      case 'MIXED': return { color: '#f59e0b', label: '혼합', icon: '🔀' };
      default: return { color: '#6b7280', label: type, icon: '?' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'RUNNING': return { color: '#10b981', label: '실행중', icon: '▶️' };
      case 'STOPPED': return { color: '#6b7280', label: '중지', icon: '⏹️' };
      case 'ERROR': return { color: '#ef4444', label: '오류', icon: '❌' };
      default: return { color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getAuthConfig = (type: string) => {
    switch (type) {
      case 'JWT': return { label: 'JWT', icon: '🔑' };
      case 'API_KEY': return { label: 'API Key', icon: '🗝️' };
      case 'OAUTH': return { label: 'OAuth', icon: '🔐' };
      case 'MTLS': return { label: 'mTLS', icon: '📜' };
      case 'NONE': return { label: '없음', icon: '🔓' };
      default: return { label: type, icon: '?' };
    }
  };

  const getProtocolConfig = (protocol: string) => {
    switch (protocol) {
      case 'HTTP': return { color: '#3b82f6' };
      case 'HTTPS': return { color: '#10b981' };
      case 'WS': return { color: '#8b5cf6' };
      case 'WSS': return { color: '#06b6d4' };
      case 'SSH': return { color: '#f59e0b' };
      default: return { color: '#6b7280' };
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const totalRequests = gateways.reduce((a, g) => a + g.stats.totalRequests, 0);
  const totalActive = gateways.reduce((a, g) => a + g.stats.activeConnections, 0);
  const runningGateways = gateways.filter(g => g.status === 'RUNNING').length;

  return (
    <AdminLayout 
      title="게이트웨이 설정" 
      description="API 게이트웨이 및 라우팅 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">게이트웨이</div>
          <div className="stat-value">{gateways.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">▶️ 실행중</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{runningGateways}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 라우트</div>
          <div className="stat-value">{gateways.reduce((a, g) => a + g.routes.length, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 연결</div>
          <div className="stat-value">{totalActive.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 요청</div>
          <div className="stat-value">{formatNumber(totalRequests)}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ 게이트웨이 추가</button>
      </div>

      {/* Gateways */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {gateways.map(gw => {
            const typeConfig = getTypeConfig(gw.type);
            const statusConfig = getStatusConfig(gw.status);
            const authConfig = getAuthConfig(gw.authentication.type);
            return (
              <div key={gw.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${statusConfig.color}`, cursor: 'pointer' }} onClick={() => setSelectedGateway(gw)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{typeConfig.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{gw.name}</span>
                      <span style={{ padding: '4px 10px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>{statusConfig.icon} {statusConfig.label}</span>
                      <span style={{ padding: '4px 10px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '6px', fontSize: '0.8rem' }}>{typeConfig.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <span>🔌 {gw.listenAddress}:{gw.listenPort}</span>
                      <span>{authConfig.icon} {authConfig.label}</span>
                      {gw.ssl.enabled && <span>🔒 SSL</span>}
                      <span>📊 {formatNumber(gw.stats.totalRequests)} 요청</span>
                      <span>⏱️ {gw.stats.avgLatency}ms</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {gw.routes.map(route => (
                    <span key={route.id} style={{ padding: '4px 10px', background: `${getProtocolConfig(route.protocol).color}15`, color: getProtocolConfig(route.protocol).color, borderRadius: '6px', fontSize: '0.8rem', opacity: route.enabled ? 1 : 0.5 }}>
                      {route.method !== 'ALL' && <span style={{ marginRight: '4px', fontWeight: 600 }}>{route.method}</span>}
                      {route.path}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gateway Detail Modal */}
      {selectedGateway && (
        <div className="modal-overlay active" onClick={() => setSelectedGateway(null)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedGateway.type).icon} {selectedGateway.name}</h3>
              <button className="modal-close" onClick={() => setSelectedGateway(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getStatusConfig(selectedGateway.status).color}20`, color: getStatusConfig(selectedGateway.status).color, borderRadius: '6px' }}>{getStatusConfig(selectedGateway.status).icon} {getStatusConfig(selectedGateway.status).label}</span>
                <span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>{selectedGateway.listenAddress}:{selectedGateway.listenPort}</span>
                {selectedGateway.ssl.enabled && <span style={{ padding: '4px 10px', background: '#10b98120', color: '#10b981', borderRadius: '6px' }}>🔒 SSL</span>}
              </div>
              
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <button className={`btn btn-ghost btn-sm ${activeTab === 'routes' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('routes')}>라우트</button>
                <button className={`btn btn-ghost btn-sm ${activeTab === 'security' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('security')}>보안</button>
                <button className={`btn btn-ghost btn-sm ${activeTab === 'settings' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('settings')}>설정</button>
              </div>
              
              {activeTab === 'routes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflow: 'auto' }}>
                  {selectedGateway.routes.map(route => (
                    <div key={route.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '8px', opacity: route.enabled ? 1 : 0.5 }}>
                      <span style={{ padding: '2px 8px', background: `${getProtocolConfig(route.protocol).color}20`, color: getProtocolConfig(route.protocol).color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{route.protocol}</span>
                      <span style={{ fontWeight: 500, flex: 1 }}>{route.path}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>→ {route.target}</span>
                      <span style={{ fontSize: '0.8rem' }}>{formatNumber(route.requestCount)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'security' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>인증</div>
                    <div>{getAuthConfig(selectedGateway.authentication.type).icon} {getAuthConfig(selectedGateway.authentication.type).label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>필수: {selectedGateway.authentication.required ? '예' : '아니오'}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Rate Limit</div>
                    {selectedGateway.rateLimit.enabled ? (
                      <div>{selectedGateway.rateLimit.maxRequests}/{selectedGateway.rateLimit.windowSeconds}s</div>
                    ) : (
                      <div style={{ color: 'var(--color-text-muted)' }}>비활성</div>
                    )}
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>CORS</div>
                    {selectedGateway.cors.enabled ? (
                      <div style={{ fontSize: '0.8rem' }}>{selectedGateway.cors.origins.join(', ')}</div>
                    ) : (
                      <div style={{ color: 'var(--color-text-muted)' }}>비활성</div>
                    )}
                  </div>
                  {selectedGateway.ssl.enabled && selectedGateway.ssl.certificate && (
                    <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>SSL 인증서</div>
                      <div>{selectedGateway.ssl.certificate}</div>
                      {selectedGateway.ssl.expiry && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>만료: {new Date(selectedGateway.ssl.expiry).toLocaleDateString('ko-KR')}</div>}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>로깅:</span> {selectedGateway.logging.enabled ? selectedGateway.logging.level : '비활성'}</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>활성 연결:</span> {selectedGateway.stats.activeConnections}</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>평균 지연:</span> {selectedGateway.stats.avgLatency}ms</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>에러율:</span> {(selectedGateway.stats.errorRate * 100).toFixed(2)}%</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedGateway.status === 'RUNNING' ? (
                <button className="btn btn-secondary">⏹️ 중지</button>
              ) : (
                <button className="btn btn-primary">▶️ 시작</button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedGateway(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Gateway Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">+ 게이트웨이 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">이름</label>
                <input type="text" className="form-input" placeholder="게이트웨이 이름" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">유형</label>
                  <select className="form-input">
                    <option value="API">API</option>
                    <option value="SSH">SSH</option>
                    <option value="WEBSOCKET">WebSocket</option>
                    <option value="MIXED">혼합</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">포트</label>
                  <input type="number" className="form-input" placeholder="443" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">인증 방식</label>
                <select className="form-input">
                  <option value="JWT">JWT</option>
                  <option value="API_KEY">API Key</option>
                  <option value="OAUTH">OAuth</option>
                  <option value="MTLS">mTLS</option>
                  <option value="NONE">없음</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" defaultChecked />
                <span>SSL 활성화</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary">생성</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

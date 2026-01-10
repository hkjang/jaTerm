'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Integration {
  id: string;
  name: string;
  type: 'OAUTH' | 'WEBHOOK' | 'API' | 'SAML' | 'LDAP';
  provider: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';
  lastSync: string;
  syncCount: number;
  config: Record<string, string>;
}

export default function IntegrationHubPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setIntegrations([
      { id: '1', name: 'Slack 알림', type: 'WEBHOOK', provider: 'Slack', status: 'CONNECTED', lastSync: '2026-01-10 14:25', syncCount: 12500, config: { channel: '#alerts', webhook: 'https://hooks.slack.com/...' } },
      { id: '2', name: 'GitHub SSO', type: 'OAUTH', provider: 'GitHub', status: 'CONNECTED', lastSync: '2026-01-10 14:00', syncCount: 450, config: { clientId: 'gh_xxx', scope: 'user,repo' } },
      { id: '3', name: 'Jira 연동', type: 'API', provider: 'Atlassian', status: 'CONNECTED', lastSync: '2026-01-10 13:30', syncCount: 890, config: { baseUrl: 'https://company.atlassian.net', project: 'JATERM' } },
      { id: '4', name: 'Active Directory', type: 'LDAP', provider: 'Microsoft', status: 'CONNECTED', lastSync: '2026-01-10 12:00', syncCount: 1250, config: { server: 'ldap.company.com', baseDn: 'dc=company,dc=com' } },
      { id: '5', name: 'Okta SAML', type: 'SAML', provider: 'Okta', status: 'PENDING', lastSync: '-', syncCount: 0, config: { entityId: 'jaterm-prod', ssoUrl: 'https://company.okta.com/...' } },
      { id: '6', name: 'PagerDuty', type: 'WEBHOOK', provider: 'PagerDuty', status: 'ERROR', lastSync: '2026-01-09 18:00', syncCount: 45, config: { serviceId: 'P12345', routingKey: 'xxx' } },
      { id: '7', name: 'Datadog 메트릭', type: 'API', provider: 'Datadog', status: 'CONNECTED', lastSync: '2026-01-10 14:27', syncCount: 45000, config: { apiKey: 'dd_xxx', site: 'datadoghq.com' } },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleSync = (i: Integration) => { setSuccess(`${i.name} 동기화 중...`); setIntegrations(integrations.map(int => int.id === i.id ? { ...int, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '), syncCount: int.syncCount + 1 } : int)); };
  const handleDisconnect = (i: Integration) => { if (confirm('연결 해제?')) { setIntegrations(integrations.map(int => int.id === i.id ? { ...int, status: 'DISCONNECTED' } : int)); setSuccess(`${i.name} 연결 해제됨`); setSelectedIntegration(null); } };
  const handleReconnect = (i: Integration) => { setIntegrations(integrations.map(int => int.id === i.id ? { ...int, status: 'CONNECTED' } : int)); setSuccess(`${i.name} 재연결됨`); };

  const getStatusColor = (s: string) => ({ CONNECTED: '#10b981', DISCONNECTED: '#6b7280', ERROR: '#ef4444', PENDING: '#f59e0b' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ OAUTH: '🔐', WEBHOOK: '🪝', API: '🔌', SAML: '🎫', LDAP: '📁' }[t] || '🔗');
  const getProviderIcon = (p: string) => ({ Slack: '💬', GitHub: '🐙', Atlassian: '🔵', Microsoft: '🪟', Okta: '🔒', PagerDuty: '📟', Datadog: '🐕' }[p] || '🏢');

  return (
    <AdminLayout title="통합 허브" description="외부 서비스 연동 관리" actions={<button className="btn btn-primary">+ 연동 추가</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 연동</div><div className="stat-value">{integrations.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 연결됨</div><div className="stat-value" style={{ color: '#10b981' }}>{integrations.filter(i => i.status === 'CONNECTED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 오류</div><div className="stat-value" style={{ color: '#ef4444' }}>{integrations.filter(i => i.status === 'ERROR').length}</div></div>
        <div className="stat-card"><div className="stat-label">총 동기화</div><div className="stat-value">{(integrations.reduce((a, i) => a + i.syncCount, 0) / 1000).toFixed(1)}K</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {integrations.map(i => (
            <div key={i.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(i.status)}`, cursor: 'pointer' }} onClick={() => setSelectedIntegration(i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontSize: '1.5rem', marginRight: 8 }}>{getProviderIcon(i.provider)}</span><span style={{ fontWeight: 700 }}>{i.name}</span><div style={{ display: 'flex', gap: 6, marginTop: 4 }}><span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.7rem' }}>{getTypeIcon(i.type)} {i.type}</span></div></div>
                <span style={{ padding: '2px 8px', background: `${getStatusColor(i.status)}20`, color: getStatusColor(i.status), borderRadius: 4, fontSize: '0.75rem', height: 'fit-content' }}>{i.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}><span style={{ color: 'var(--color-text-muted)' }}>동기화: {i.syncCount.toLocaleString()}회</span></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>마지막: {i.lastSync}</div>
            </div>
          ))}
        </div>
      )}
      {selectedIntegration && (
        <div className="modal-overlay active" onClick={() => setSelectedIntegration(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getProviderIcon(selectedIntegration.provider)} {selectedIntegration.name}</h3><button className="modal-close" onClick={() => setSelectedIntegration(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedIntegration.status)}20`, color: getStatusColor(selectedIntegration.status), borderRadius: 6 }}>{selectedIntegration.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{getTypeIcon(selectedIntegration.type)} {selectedIntegration.type}</span></div>
            <div style={{ marginBottom: 16 }}><b>프로바이더:</b> {selectedIntegration.provider} · <b>동기화:</b> {selectedIntegration.syncCount.toLocaleString()}회</div>
            <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, marginBottom: 16 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>설정</div>{Object.entries(selectedIntegration.config).map(([k, v]) => <div key={k} style={{ fontSize: '0.85rem', marginBottom: 4 }}><b>{k}:</b> <code style={{ fontSize: '0.8rem' }}>{v.length > 30 ? v.slice(0, 30) + '...' : v}</code></div>)}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleSync(selectedIntegration)}>🔄 동기화</button>{selectedIntegration.status === 'CONNECTED' ? <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDisconnect(selectedIntegration)}>🔌 연결 해제</button> : <button className="btn btn-primary" onClick={() => { handleReconnect(selectedIntegration); setSelectedIntegration(null); }}>🔗 재연결</button>}<button className="btn btn-ghost" onClick={() => setSelectedIntegration(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

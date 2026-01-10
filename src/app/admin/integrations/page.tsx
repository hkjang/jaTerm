'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Integration {
  id: string;
  name: string;
  type: 'SLACK' | 'WEBHOOK' | 'SIEM' | 'EMAIL' | 'TEAMS' | 'JIRA';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  config: Record<string, string>;
  lastSync?: string;
  eventsCount: number;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [slackChannel, setSlackChannel] = useState('');

  useEffect(() => {
    setLoading(true);
    const mockIntegrations: Integration[] = [
      { id: '1', name: 'Security Alerts', type: 'SLACK', status: 'CONNECTED', config: { channel: '#security-alerts', workspace: 'example-corp' }, lastSync: new Date(Date.now() - 5 * 60000).toISOString(), eventsCount: 1250 },
      { id: '2', name: 'SIEM Integration', type: 'SIEM', status: 'CONNECTED', config: { endpoint: 'https://siem.example.com/api/events', format: 'CEF' }, lastSync: new Date(Date.now() - 2 * 60000).toISOString(), eventsCount: 45000 },
      { id: '3', name: 'Incident Webhook', type: 'WEBHOOK', status: 'CONNECTED', config: { url: 'https://api.pagerduty.com/v2/events' }, lastSync: new Date(Date.now() - 30 * 60000).toISOString(), eventsCount: 89 },
      { id: '4', name: 'Admin Notifications', type: 'EMAIL', status: 'CONNECTED', config: { recipients: 'admin@example.com, security@example.com' }, eventsCount: 567 },
      { id: '5', name: 'Jira Tickets', type: 'JIRA', status: 'ERROR', config: { project: 'SEC', url: 'https://example.atlassian.net' }, eventsCount: 0 },
    ];
    setIntegrations(mockIntegrations);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleConnect = () => {
    setMessage({ type: 'success', text: '연동이 설정되었습니다.' });
    setShowAddModal(false);
    setSelectedType(null);
    setWebhookUrl('');
    setSlackChannel('');
  };

  const handleDisconnect = (integration: Integration) => {
    if (!confirm(`'${integration.name}' 연동을 해제하시겠습니까?`)) return;
    setIntegrations(integrations.map(i => i.id === integration.id ? { ...i, status: 'DISCONNECTED' } : i));
    setMessage({ type: 'success', text: '연동이 해제되었습니다.' });
  };

  const handleReconnect = (integration: Integration) => {
    setIntegrations(integrations.map(i => i.id === integration.id ? { ...i, status: 'CONNECTED' } : i));
    setMessage({ type: 'success', text: '재연결되었습니다.' });
  };

  const handleTest = (integration: Integration) => {
    setMessage({ type: 'success', text: '테스트 이벤트가 전송되었습니다.' });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'SLACK': return { color: '#e01e5a', bg: '#e01e5a20', icon: '💬', label: 'Slack' };
      case 'WEBHOOK': return { color: '#6366f1', bg: '#6366f120', icon: '🔗', label: 'Webhook' };
      case 'SIEM': return { color: '#10b981', bg: '#10b98120', icon: '🛡️', label: 'SIEM' };
      case 'EMAIL': return { color: '#f59e0b', bg: '#f59e0b20', icon: '📧', label: 'Email' };
      case 'TEAMS': return { color: '#6264a7', bg: '#6264a720', icon: '💼', label: 'Teams' };
      case 'JIRA': return { color: '#0052cc', bg: '#0052cc20', icon: '🎫', label: 'Jira' };
      default: return { color: '#6b7280', bg: '#6b728020', icon: '🔌', label: type };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CONNECTED': return { color: '#10b981', label: '연결됨' };
      case 'DISCONNECTED': return { color: '#6b7280', label: '연결 해제' };
      case 'ERROR': return { color: '#ef4444', label: '오류' };
      default: return { color: '#6b7280', label: status };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const availableIntegrations = [
    { type: 'SLACK', name: 'Slack', desc: '보안 알림을 Slack 채널로 전송' },
    { type: 'WEBHOOK', name: 'Webhook', desc: '커스텀 HTTP 엔드포인트로 이벤트 전송' },
    { type: 'SIEM', name: 'SIEM', desc: 'Splunk, ELK 등 SIEM 시스템 연동' },
    { type: 'EMAIL', name: 'Email', desc: '이메일로 알림 전송' },
    { type: 'TEAMS', name: 'Microsoft Teams', desc: 'Teams 채널로 알림 전송' },
    { type: 'JIRA', name: 'Jira', desc: '보안 이벤트를 Jira 티켓으로 생성' },
  ];

  const connectedCount = integrations.filter(i => i.status === 'CONNECTED').length;
  const totalEvents = integrations.reduce((sum, i) => sum + i.eventsCount, 0);

  return (
    <AdminLayout 
      title="외부 연동" 
      description="알림 및 SIEM 시스템 연동 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 연동 추가
        </button>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 연동</div>
          <div className="stat-value">{integrations.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 연동</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{connectedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전송된 이벤트</div>
          <div className="stat-value">{totalEvents.toLocaleString()}</div>
        </div>
      </div>

      {/* Integrations List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {integrations.map(integration => {
            const type = getTypeConfig(integration.type);
            const status = getStatusConfig(integration.status);
            return (
              <div key={integration.id} className="card" style={{ padding: '20px', borderLeft: `4px solid ${status.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{integration.name}</span>
                          <span style={{ padding: '2px 8px', background: type.bg, color: type.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {type.label}
                          </span>
                          <span style={{ padding: '2px 8px', background: status.color + '20', color: status.color, borderRadius: '4px', fontSize: '0.7rem' }}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginLeft: '44px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {Object.entries(integration.config).map(([key, value]) => (
                        <span key={key} style={{ marginRight: '16px' }}>{key}: <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span></span>
                      ))}
                    </div>
                    <div style={{ marginLeft: '44px', marginTop: '8px', display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {integration.lastSync && <span>🔄 마지막 동기화: {getTimeAgo(integration.lastSync)}</span>}
                      <span>📊 이벤트: {integration.eventsCount.toLocaleString()}건</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {integration.status === 'CONNECTED' && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleTest(integration)}>🧪 테스트</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDisconnect(integration)}>⏏️ 해제</button>
                      </>
                    )}
                    {integration.status === 'DISCONNECTED' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleReconnect(integration)}>🔗 재연결</button>
                    )}
                    {integration.status === 'ERROR' && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleReconnect(integration)}>🔄 재시도</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>⚙️ 설정</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => { setShowAddModal(false); setSelectedType(null); }}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ 연동 추가</h3>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setSelectedType(null); }}>×</button>
            </div>
            <div className="modal-body">
              {!selectedType ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {availableIntegrations.map(int => {
                    const config = getTypeConfig(int.type);
                    return (
                      <div 
                        key={int.type}
                        style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => setSelectedType(int.type)}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = config.color)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '1.5rem' }}>{config.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{int.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{int.desc}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getTypeConfig(selectedType).icon}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{availableIntegrations.find(i => i.type === selectedType)?.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{availableIntegrations.find(i => i.type === selectedType)?.desc}</div>
                    </div>
                  </div>
                  {selectedType === 'SLACK' && (
                    <div className="form-group">
                      <label className="form-label">Slack Webhook URL</label>
                      <input type="text" className="form-input" placeholder="https://hooks.slack.com/services/..." value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                    </div>
                  )}
                  {selectedType === 'WEBHOOK' && (
                    <div className="form-group">
                      <label className="form-label">Webhook URL</label>
                      <input type="text" className="form-input" placeholder="https://your-endpoint.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                    </div>
                  )}
                  {(selectedType === 'SIEM' || selectedType === 'EMAIL' || selectedType === 'TEAMS' || selectedType === 'JIRA') && (
                    <div className="form-group">
                      <label className="form-label">설정</label>
                      <div style={{ padding: '20px', background: 'var(--color-surface)', borderRadius: '8px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        추가 설정이 필요합니다. 관리자에게 문의하세요.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              {selectedType && <button className="btn btn-ghost" onClick={() => setSelectedType(null)}>← 뒤로</button>}
              <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setSelectedType(null); }}>취소</button>
              {selectedType && <button className="btn btn-primary" onClick={handleConnect}>연결</button>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

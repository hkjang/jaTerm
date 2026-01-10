'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SLACK' | 'TEAMS' | 'PAGERDUTY' | 'SMS' | 'WEBHOOK';
  config: Record<string, string>;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastUsed: string;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface NotificationRule {
  id: string;
  name: string;
  event: string;
  channels: string[];
  conditions: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  triggerCount: number;
  lastTriggered: string;
}

export default function NotificationCenterPage() {
  const [activeTab, setActiveTab] = useState<'channels' | 'rules'>('channels');
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [success, setSuccess] = useState('');
  const [channelForm, setChannelForm] = useState({ name: '', type: 'EMAIL', email: '', webhookUrl: '' });

  useEffect(() => {
    setChannels([
      { id: '1', name: '운영팀 이메일', type: 'EMAIL', config: { to: 'ops@company.com' }, status: 'ACTIVE', lastUsed: '2026-01-10 14:50', sentCount: 4520, failedCount: 15, createdAt: '2025-01-15' },
      { id: '2', name: '#alerts 슬랙', type: 'SLACK', config: { channel: '#alerts' }, status: 'ACTIVE', lastUsed: '2026-01-10 14:48', sentCount: 12500, failedCount: 25, createdAt: '2025-02-01' },
      { id: '3', name: 'PagerDuty 온콜', type: 'PAGERDUTY', config: { serviceKey: 'xxxx' }, status: 'ACTIVE', lastUsed: '2026-01-08 03:15', sentCount: 280, failedCount: 2, createdAt: '2025-03-20' },
      { id: '4', name: 'MS Teams 보안팀', type: 'TEAMS', config: { webhook: 'https://...' }, status: 'INACTIVE', lastUsed: '2025-12-15', sentCount: 850, failedCount: 50, createdAt: '2025-06-01' },
      { id: '5', name: 'SMS 긴급 알림', type: 'SMS', config: { phone: '+82-10-xxxx-xxxx' }, status: 'ACTIVE', lastUsed: '2026-01-05 02:00', sentCount: 45, failedCount: 0, createdAt: '2025-08-15' },
    ]);
    setRules([
      { id: '1', name: '로그인 실패 알림', event: 'login.failed', channels: ['운영팀 이메일', '#alerts 슬랙'], conditions: 'attempts > 3', priority: 'HIGH', enabled: true, triggerCount: 125, lastTriggered: '2026-01-10 14:30' },
      { id: '2', name: '긴급 접근 알림', event: 'emergency.granted', channels: ['PagerDuty 온콜', 'SMS 긴급 알림'], conditions: 'always', priority: 'CRITICAL', enabled: true, triggerCount: 8, lastTriggered: '2026-01-08 03:15' },
      { id: '3', name: '세션 타임아웃', event: 'session.timeout', channels: ['#alerts 슬랙'], conditions: 'duration > 8h', priority: 'LOW', enabled: true, triggerCount: 450, lastTriggered: '2026-01-10 12:00' },
      { id: '4', name: '정책 위반', event: 'policy.violated', channels: ['운영팀 이메일', '#alerts 슬랙', 'PagerDuty 온콜'], conditions: 'severity = CRITICAL', priority: 'CRITICAL', enabled: true, triggerCount: 32, lastTriggered: '2026-01-09 18:45' },
      { id: '5', name: '시스템 장애', event: 'health.unhealthy', channels: ['PagerDuty 온콜', 'SMS 긴급 알림'], conditions: 'consecutive_failures >= 3', priority: 'CRITICAL', enabled: true, triggerCount: 15, lastTriggered: '2026-01-07 05:20' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreateChannel = (e: React.FormEvent) => { e.preventDefault(); setChannels([{ id: String(Date.now()), name: channelForm.name, type: channelForm.type as NotificationChannel['type'], config: channelForm.type === 'EMAIL' ? { to: channelForm.email } : { webhook: channelForm.webhookUrl }, status: 'ACTIVE', lastUsed: '-', sentCount: 0, failedCount: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...channels]); setSuccess('채널 생성됨'); setShowCreateChannel(false); setChannelForm({ name: '', type: 'EMAIL', email: '', webhookUrl: '' }); };
  const handleTestChannel = (c: NotificationChannel) => { setSuccess(`${c.name} 테스트 알림 전송 중...`); };
  const handleToggleChannel = (c: NotificationChannel) => { setChannels(channels.map(ch => ch.id === c.id ? { ...ch, status: ch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : ch)); setSuccess(`${c.name} ${c.status === 'ACTIVE' ? '비활성화' : '활성화'}됨`); };
  const handleToggleRule = (r: NotificationRule) => { setRules(rules.map(rule => rule.id === r.id ? { ...rule, enabled: !rule.enabled } : rule)); setSuccess(`${r.name} ${r.enabled ? '비활성화' : '활성화'}됨`); };

  const getTypeIcon = (t: string) => ({ EMAIL: '📧', SLACK: '💬', TEAMS: '👥', PAGERDUTY: '📟', SMS: '📱', WEBHOOK: '🔗' }[t] || '🔔');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', INACTIVE: '#6b7280', ERROR: '#ef4444' }[s] || '#6b7280');
  const getPriorityColor = (p: string) => ({ LOW: '#6b7280', MEDIUM: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444' }[p] || '#6b7280');

  const totalSent = channels.reduce((a, c) => a + c.sentCount, 0);
  const totalFailed = channels.reduce((a, c) => a + c.failedCount, 0);

  return (
    <AdminLayout title="알림 센터" description="알림 채널 및 규칙 관리">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">📢 채널</div><div className="stat-value">{channels.length}</div></div>
        <div className="stat-card"><div className="stat-label">📋 규칙</div><div className="stat-value">{rules.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 전송 성공</div><div className="stat-value" style={{ color: '#10b981' }}>{totalSent.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 전송 실패</div><div className="stat-value" style={{ color: totalFailed > 0 ? '#ef4444' : 'inherit' }}>{totalFailed.toLocaleString()}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${activeTab === 'channels' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('channels')}>📢 채널</button>
        <button className={`btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('rules')}>📋 규칙</button>
        {activeTab === 'channels' && <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowCreateChannel(true)}>+ 채널</button>}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : activeTab === 'channels' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {channels.map(c => (
            <div key={c.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(c.status)}`, cursor: 'pointer' }} onClick={() => setSelectedChannel(c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div><span style={{ fontSize: '1.3rem', marginRight: 8 }}>{getTypeIcon(c.type)}</span><span style={{ fontWeight: 700 }}>{c.name}</span></div>
                <span style={{ padding: '2px 8px', background: `${getStatusColor(c.status)}20`, color: getStatusColor(c.status), borderRadius: 4, fontSize: '0.75rem' }}>{c.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><span>전송: {c.sentCount.toLocaleString()}</span><span>실패: {c.failedCount}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>규칙</th><th>이벤트</th><th>조건</th><th>우선순위</th><th>채널</th><th>트리거</th><th>상태</th></tr></thead>
            <tbody>{rules.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td><code style={{ fontSize: '0.85rem' }}>{r.event}</code></td>
                <td style={{ fontSize: '0.85rem' }}>{r.conditions}</td>
                <td><span style={{ padding: '2px 8px', background: `${getPriorityColor(r.priority)}20`, color: getPriorityColor(r.priority), borderRadius: 4, fontSize: '0.75rem' }}>{r.priority}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{r.channels.join(', ')}</td>
                <td>{r.triggerCount}</td>
                <td><button className={`btn btn-ghost btn-sm`} style={{ color: r.enabled ? '#10b981' : '#6b7280' }} onClick={() => handleToggleRule(r)}>{r.enabled ? '✅' : '⏸️'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedChannel && (
        <div className="modal-overlay active" onClick={() => setSelectedChannel(null)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedChannel.type)} {selectedChannel.name}</h3><button className="modal-close" onClick={() => setSelectedChannel(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedChannel.status)}20`, color: getStatusColor(selectedChannel.status), borderRadius: 6 }}>{selectedChannel.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedChannel.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>전송:</b> {selectedChannel.sentCount.toLocaleString()}</div><div><b>실패:</b> {selectedChannel.failedCount}</div>
              <div><b>마지막 사용:</b> {selectedChannel.lastUsed}</div><div><b>생성일:</b> {selectedChannel.createdAt}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>설정</div>{Object.entries(selectedChannel.config).map(([k, v]) => <div key={k} style={{ fontSize: '0.85rem' }}><b>{k}:</b> {v}</div>)}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleTestChannel(selectedChannel)}>🔔 테스트</button><button className="btn btn-secondary" onClick={() => handleToggleChannel(selectedChannel)}>{selectedChannel.status === 'ACTIVE' ? '⏸️' : '▶️'}</button><button className="btn btn-ghost" onClick={() => setSelectedChannel(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreateChannel && (
        <div className="modal-overlay active" onClick={() => setShowCreateChannel(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📢 채널 추가</h3><button className="modal-close" onClick={() => setShowCreateChannel(false)}>×</button></div>
          <form onSubmit={handleCreateChannel}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={channelForm.type} onChange={e => setChannelForm({ ...channelForm, type: e.target.value })}><option value="EMAIL">이메일</option><option value="SLACK">Slack</option><option value="TEAMS">MS Teams</option><option value="PAGERDUTY">PagerDuty</option><option value="SMS">SMS</option><option value="WEBHOOK">Webhook</option></select></div>
            {channelForm.type === 'EMAIL' ? <div className="form-group"><label className="form-label">이메일 주소</label><input type="email" className="form-input" value={channelForm.email} onChange={e => setChannelForm({ ...channelForm, email: e.target.value })} required /></div> : <div className="form-group"><label className="form-label">Webhook URL</label><input type="url" className="form-input" value={channelForm.webhookUrl} onChange={e => setChannelForm({ ...channelForm, webhookUrl: e.target.value })} /></div>}
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreateChannel(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

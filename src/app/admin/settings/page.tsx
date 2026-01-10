'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Settings {
  general: {
    siteName: string;
    siteUrl: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordExpireDays: number;
  };
  security: {
    mfaRequired: boolean;
    ipWhitelistEnabled: boolean;
    commandFilterEnabled: boolean;
    sessionRecordingEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    webhookEnabled: boolean;
  };
}

const defaultSettings: Settings = {
  general: { siteName: 'jaTerm', siteUrl: 'https://jaterm.company.com', sessionTimeout: 30, maxLoginAttempts: 5, passwordExpireDays: 90 },
  security: { mfaRequired: true, ipWhitelistEnabled: true, commandFilterEnabled: true, sessionRecordingEnabled: true },
  notifications: { emailEnabled: true, slackEnabled: false, webhookEnabled: true },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleSave = () => {
    setSuccess('설정이 저장되었습니다.');
  };

  const tabs = [
    { id: 'general' as const, label: '일반', icon: '⚙️' },
    { id: 'security' as const, label: '보안', icon: '🛡️' },
    { id: 'notifications' as const, label: '알림', icon: '🔔' },
  ];

  return (
    <AdminLayout title="시스템 설정" description="전역 시스템 설정 관리">
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.id} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(tab.id)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      <div className="card">
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0 }}>⚙️ 일반 설정</h3>
            <div className="form-group"><label className="form-label">사이트 이름</label><input className="form-input" value={settings.general.siteName} onChange={e => setSettings({ ...settings, general: { ...settings.general, siteName: e.target.value } })} /></div>
            <div className="form-group"><label className="form-label">사이트 URL</label><input className="form-input" value={settings.general.siteUrl} onChange={e => setSettings({ ...settings, general: { ...settings.general, siteUrl: e.target.value } })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">세션 타임아웃 (분)</label><input type="number" className="form-input" value={settings.general.sessionTimeout} onChange={e => setSettings({ ...settings, general: { ...settings.general, sessionTimeout: parseInt(e.target.value) } })} /></div>
              <div className="form-group"><label className="form-label">최대 로그인 시도</label><input type="number" className="form-input" value={settings.general.maxLoginAttempts} onChange={e => setSettings({ ...settings, general: { ...settings.general, maxLoginAttempts: parseInt(e.target.value) } })} /></div>
              <div className="form-group"><label className="form-label">비밀번호 만료 (일)</label><input type="number" className="form-input" value={settings.general.passwordExpireDays} onChange={e => setSettings({ ...settings, general: { ...settings.general, passwordExpireDays: parseInt(e.target.value) } })} /></div>
            </div>
          </div>
        )}
        
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0 }}>🛡️ 보안 설정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.security.mfaRequired} onChange={e => setSettings({ ...settings, security: { ...settings.security, mfaRequired: e.target.checked } })} />
                <div><div style={{ fontWeight: 600 }}>MFA 필수</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>모든 사용자에게 MFA 인증 요구</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.security.ipWhitelistEnabled} onChange={e => setSettings({ ...settings, security: { ...settings.security, ipWhitelistEnabled: e.target.checked } })} />
                <div><div style={{ fontWeight: 600 }}>IP 화이트리스트</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>허용된 IP에서만 접근</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.security.commandFilterEnabled} onChange={e => setSettings({ ...settings, security: { ...settings.security, commandFilterEnabled: e.target.checked } })} />
                <div><div style={{ fontWeight: 600 }}>명령어 필터링</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>위험 명령어 차단</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.security.sessionRecordingEnabled} onChange={e => setSettings({ ...settings, security: { ...settings.security, sessionRecordingEnabled: e.target.checked } })} />
                <div><div style={{ fontWeight: 600 }}>세션 녹화</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>모든 세션 자동 녹화</div></div>
              </label>
            </div>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0 }}>🔔 알림 설정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.notifications.emailEnabled} onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, emailEnabled: e.target.checked } })} />
                <div><div style={{ fontWeight: 600 }}>📧 이메일 알림</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>보안 알림을 이메일로 전송</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.notifications.slackEnabled} onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, slackEnabled: e.target.checked } })} />
                <div><div style={{ fontWeight: 600 }}>💬 Slack 알림</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Slack 채널로 알림 전송</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.notifications.webhookEnabled} onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, webhookEnabled: e.target.checked } })} />
                <div><div style={{ fontWeight: 600 }}>🔗 Webhook</div><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>외부 시스템에 웹훅 전송</div></div>
              </label>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-primary" onClick={handleSave}>💾 설정 저장</button>
        </div>
      </div>
    </AdminLayout>
  );
}

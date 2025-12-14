'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('terminal');

  const tabs = [
    { id: 'terminal', label: '터미널', icon: '⌨️' },
    { id: 'security', label: '보안', icon: '🔒' },
    { id: 'session', label: '세션', icon: '📺' },
    { id: 'logs', label: '로그', icon: '📝' },
    { id: 'encryption', label: '암호화', icon: '🔐' },
    { id: 'integration', label: '외부 연동', icon: '🔗' },
  ];

  return (
    <AdminLayout title="시스템 설정" description="터미널, 보안, 세션 정책 및 외부 연동 설정"
      actions={<button className="btn btn-primary">💾 저장</button>}>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Tab Navigation */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '8px' }}>
            {tabs.map(tab => (
              <button key={tab.id} className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
                onClick={() => setActiveTab(tab.id)} >
                <span className="sidebar-link-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'terminal' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>터미널 기본 설정</h3>
              <div className="form-group"><label className="form-label">테마</label>
                <select className="form-input form-select"><option value="dark">Dark</option><option value="light">Light</option><option value="dracula">Dracula</option><option value="monokai">Monokai</option></select></div>
              <div className="form-group"><label className="form-label">폰트</label>
                <select className="form-input form-select"><option>JetBrains Mono</option><option>Fira Code</option><option>Consolas</option><option>Monaco</option></select></div>
              <div className="form-group"><label className="form-label">폰트 크기</label><input type="number" className="form-input" defaultValue={14} style={{ width: '100px' }} /></div>
              <div className="form-group"><label className="form-label">줄 높이</label><input type="number" className="form-input" defaultValue={1.4} step={0.1} style={{ width: '100px' }} /></div>
              <div className="form-group"><label className="form-label">커서 스타일</label>
                <select className="form-input form-select"><option value="block">Block</option><option value="underline">Underline</option><option value="bar">Bar</option></select></div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>보안 옵션</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 붙여넣기 필터링 (위험 명령 감지)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 타이핑 감지 (자동 입력 차단)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 워터마크 표시</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 위험 명령 확인 대화상자</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 민감 데이터 마스킹</label>
              </div>
            </div>
          )}

          {activeTab === 'session' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>세션 정책</h3>
              <div className="form-group"><label className="form-label">세션 타임아웃 (분)</label><input type="number" className="form-input" defaultValue={30} style={{ width: '100px' }} /></div>
              <div className="form-group"><label className="form-label">자동 잠금 시간 (초)</label><input type="number" className="form-input" defaultValue={300} style={{ width: '100px' }} /></div>
              <div className="form-group"><label className="form-label">최대 동시 세션</label><input type="number" className="form-input" defaultValue={5} style={{ width: '100px' }} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}><input type="checkbox" defaultChecked /> 비활성 세션 자동 종료</label>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>로그 정책</h3>
              <div className="form-group"><label className="form-label">로그 레벨</label>
                <select className="form-input form-select"><option value="DEBUG">DEBUG</option><option value="INFO">INFO</option><option value="WARN">WARN</option><option value="ERROR">ERROR</option></select></div>
              <div className="form-group"><label className="form-label">로그 보존 기간 (일)</label><input type="number" className="form-input" defaultValue={90} style={{ width: '100px' }} /></div>
              <div className="form-group"><label className="form-label">최대 로그 용량 (GB)</label><input type="number" className="form-input" defaultValue={100} style={{ width: '100px' }} /></div>
            </div>
          )}

          {activeTab === 'encryption' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>암호화 설정</h3>
              <div className="form-group"><label className="form-label">TLS 버전</label>
                <select className="form-input form-select"><option value="1.3">TLS 1.3 (권장)</option><option value="1.2">TLS 1.2</option></select></div>
              <div className="form-group"><label className="form-label">암호화 알고리즘</label>
                <select className="form-input form-select"><option value="AES-256-GCM">AES-256-GCM</option><option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option></select></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}><input type="checkbox" defaultChecked /> 세션 녹화 암호화</label>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>외부 연동</h3>
              <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 500, marginBottom: '12px' }}>SIEM 연동</div>
                <div className="form-group"><label className="form-label">Endpoint URL</label><input type="text" className="form-input" placeholder="https://siem.company.com/api/logs" /></div>
                <div className="form-group"><label className="form-label">API Key</label><input type="password" className="form-input" placeholder="****" /></div>
              </div>
              <div style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 500, marginBottom: '12px' }}>Slack 알림</div>
                <div className="form-group"><label className="form-label">Webhook URL</label><input type="text" className="form-input" placeholder="https://hooks.slack.com/..." /></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

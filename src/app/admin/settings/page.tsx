'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

type MFAPolicy = 'DISABLED' | 'OPTIONAL' | 'ROLE_BASED' | 'REQUIRED';

interface SystemMFASettings {
  policy: MFAPolicy;
  requiredRoles: string[];
  gracePeriodDays: number;
  enforcementDate: string | null;
}

const ALL_ROLES = ['SUPER', 'ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER', 'USER'];

const POLICY_DESCRIPTIONS: Record<MFAPolicy, { title: string; description: string; color: string }> = {
  DISABLED: {
    title: '비활성화',
    description: '모든 사용자에게 MFA가 비활성화됩니다. 보안 수준이 가장 낮습니다.',
    color: '#94a3b8',
  },
  OPTIONAL: {
    title: '선택적 사용',
    description: '사용자가 개별적으로 MFA 활성화 여부를 선택할 수 있습니다.',
    color: '#60a5fa',
  },
  ROLE_BASED: {
    title: '역할 기반',
    description: '선택한 역할의 사용자만 MFA가 필수입니다.',
    color: '#f59e0b',
  },
  REQUIRED: {
    title: '전체 필수',
    description: '모든 사용자가 MFA를 설정해야 합니다. 보안 수준이 가장 높습니다.',
    color: '#10b981',
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('mfa');
  const [mfaSettings, setMfaSettings] = useState<SystemMFASettings>({
    policy: 'OPTIONAL',
    requiredRoles: ['ADMIN', 'SUPER'],
    gracePeriodDays: 7,
    enforcementDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tabs = [
    { id: 'mfa', label: 'MFA 정책', icon: '🔐' },
    { id: 'terminal', label: '터미널', icon: '⌨️' },
    { id: 'security', label: '보안', icon: '🔒' },
    { id: 'session', label: '세션', icon: '📺' },
    { id: 'logs', label: '로그', icon: '📝' },
    { id: 'encryption', label: '암호화', icon: '🔐' },
    { id: 'integration', label: '외부 연동', icon: '🔗' },
  ];

  // Same auth pattern as other admin pages
  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const user = localStorage.getItem('user');
    if (!user) return {};
    try {
      const { id } = JSON.parse(user);
      return { 'Authorization': `Bearer ${id}` };
    } catch {
      return {};
    }
  };

  const fetchMFASettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings/mfa', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setMfaSettings(data);
      } else if (response.status === 401) {
        setMessage({ type: 'error', text: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' });
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: '관리자 권한이 필요합니다.' });
      }
    } catch (error) {
      console.error('Failed to fetch MFA settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMFASettings();
  }, [fetchMFASettings]);

  const saveMFASettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/settings/mfa', {
        method: 'PUT',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mfaSettings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'MFA 정책이 저장되었습니다.' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || '저장에 실패했습니다.' });
      }
    } catch (error) {
      console.error('Failed to save MFA settings:', error);
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    setMfaSettings(prev => ({
      ...prev,
      requiredRoles: prev.requiredRoles.includes(role)
        ? prev.requiredRoles.filter(r => r !== role)
        : [...prev.requiredRoles, role],
    }));
  };

  return (
    <AdminLayout 
      title="시스템 설정" 
      description="터미널, 보안, 세션 정책 및 외부 연동 설정"
      actions={
        activeTab === 'mfa' ? (
          <button 
            className="btn btn-primary" 
            onClick={saveMFASettings}
            disabled={saving}
          >
            {saving ? '⏳ 저장 중...' : '💾 MFA 정책 저장'}
          </button>
        ) : (
          <button className="btn btn-primary">💾 저장</button>
        )
      }
    >
      
      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          background: message.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          fontWeight: 500,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Tab Navigation */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '8px' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="sidebar-link-icon">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'mfa' && (
                  <span 
                    className="badge" 
                    style={{ 
                      marginLeft: 'auto', 
                      background: POLICY_DESCRIPTIONS[mfaSettings.policy].color,
                      fontSize: '0.65rem',
                    }}
                  >
                    {mfaSettings.policy}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'mfa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Policy Overview Card */}
              <div className="card" style={{ 
                background: `linear-gradient(135deg, ${POLICY_DESCRIPTIONS[mfaSettings.policy].color}15, ${POLICY_DESCRIPTIONS[mfaSettings.policy].color}05)`,
                borderLeft: `4px solid ${POLICY_DESCRIPTIONS[mfaSettings.policy].color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔐</span>
                  <div>
                    <h3 style={{ fontWeight: 600, margin: 0 }}>
                      현재 정책: {POLICY_DESCRIPTIONS[mfaSettings.policy].title}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                      {POLICY_DESCRIPTIONS[mfaSettings.policy].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Selection */}
              <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>MFA 정책 설정</h3>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    ⏳ 설정 불러오는 중...
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">MFA 정책 모드</label>
                      <select 
                        className="form-input form-select"
                        value={mfaSettings.policy}
                        onChange={(e) => setMfaSettings(prev => ({ ...prev, policy: e.target.value as MFAPolicy }))}
                        style={{ maxWidth: '300px' }}
                      >
                        <option value="DISABLED">🔓 비활성화 - MFA 사용 안함</option>
                        <option value="OPTIONAL">🔵 선택적 - 사용자 선택</option>
                        <option value="ROLE_BASED">🟡 역할 기반 - 특정 역할만 필수</option>
                        <option value="REQUIRED">🟢 전체 필수 - 모든 사용자</option>
                      </select>
                    </div>

                    {/* Role Selection (only for ROLE_BASED) */}
                    {mfaSettings.policy === 'ROLE_BASED' && (
                      <div className="form-group" style={{ marginTop: '20px' }}>
                        <label className="form-label">MFA 필수 역할</label>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                          선택한 역할의 사용자는 MFA를 반드시 설정해야 합니다.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {ALL_ROLES.map(role => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => toggleRole(role)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: mfaSettings.requiredRoles.includes(role) 
                                  ? '2px solid #10b981' 
                                  : '2px solid var(--color-border)',
                                background: mfaSettings.requiredRoles.includes(role) 
                                  ? '#10b98120' 
                                  : 'var(--color-surface)',
                                color: mfaSettings.requiredRoles.includes(role) 
                                  ? '#10b981' 
                                  : 'var(--color-text)',
                                cursor: 'pointer',
                                fontWeight: mfaSettings.requiredRoles.includes(role) ? 600 : 400,
                                transition: 'all 0.2s',
                              }}
                            >
                              {mfaSettings.requiredRoles.includes(role) ? '✓ ' : ''}{role}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advanced Settings */}
                    {(mfaSettings.policy === 'ROLE_BASED' || mfaSettings.policy === 'REQUIRED') && (
                      <div style={{ 
                        marginTop: '24px', 
                        padding: '16px', 
                        background: 'var(--color-surface)', 
                        borderRadius: 'var(--radius-md)' 
                      }}>
                        <h4 style={{ fontWeight: 500, marginBottom: '16px' }}>고급 설정</h4>
                        
                        <div className="form-group">
                          <label className="form-label">신규 사용자 유예 기간 (일)</label>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                            신규 사용자가 MFA를 설정해야 하는 기한입니다.
                          </p>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={mfaSettings.gracePeriodDays}
                            onChange={(e) => setMfaSettings(prev => ({ 
                              ...prev, 
                              gracePeriodDays: parseInt(e.target.value) || 0 
                            }))}
                            min={0}
                            max={365}
                            style={{ width: '100px' }} 
                          />
                        </div>

                        <div className="form-group" style={{ marginTop: '16px' }}>
                          <label className="form-label">시행 시작일 (선택)</label>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                            지정 시 해당 날짜부터 MFA 정책이 강제 적용됩니다.
                          </p>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={mfaSettings.enforcementDate || ''}
                            onChange={(e) => setMfaSettings(prev => ({ 
                              ...prev, 
                              enforcementDate: e.target.value || null 
                            }))}
                            style={{ width: '200px' }} 
                          />
                          {mfaSettings.enforcementDate && (
                            <button
                              type="button"
                              onClick={() => setMfaSettings(prev => ({ ...prev, enforcementDate: null }))}
                              style={{
                                marginLeft: '8px',
                                padding: '8px 12px',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              ✕ 날짜 제거
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="card" style={{ background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📊</div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>정책 영향 범위</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {mfaSettings.policy === 'DISABLED' && '모든 사용자 - MFA 불필요'}
                    {mfaSettings.policy === 'OPTIONAL' && '모든 사용자 - 자율 선택'}
                    {mfaSettings.policy === 'ROLE_BASED' && `${mfaSettings.requiredRoles.join(', ')} 역할만 필수`}
                    {mfaSettings.policy === 'REQUIRED' && '모든 사용자 - 필수'}
                  </div>
                </div>
                <div className="card" style={{ background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🛡️</div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>보안 수준</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {mfaSettings.policy === 'DISABLED' && '낮음 - 비밀번호만 사용'}
                    {mfaSettings.policy === 'OPTIONAL' && '보통 - 사용자 의존적'}
                    {mfaSettings.policy === 'ROLE_BASED' && '높음 - 핵심 역할 보호'}
                    {mfaSettings.policy === 'REQUIRED' && '최고 - 전체 2단계 인증'}
                  </div>
                </div>
              </div>
            </div>
          )}

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

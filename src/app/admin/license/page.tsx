'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface License {
  key: string;
  type: 'ENTERPRISE' | 'PROFESSIONAL' | 'TEAM' | 'TRIAL';
  status: 'ACTIVE' | 'EXPIRED' | 'GRACE_PERIOD';
  owner: string;
  email: string;
  maxUsers: number;
  maxServers: number;
  features: string[];
  issuedAt: string;
  expiresAt: string;
  supportLevel: 'PREMIUM' | 'STANDARD' | 'COMMUNITY';
}

interface UsageStats {
  currentUsers: number;
  currentServers: number;
  currentSessions: number;
  storageUsed: number; // GB
}

export default function LicensePage() {
  const [license, setLicense] = useState<License | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    const mockLicense: License = {
      key: 'JT-ENT-2026-XXXX-XXXX-XXXX',
      type: 'ENTERPRISE',
      status: 'ACTIVE',
      owner: 'Example Corp',
      email: 'admin@example.com',
      maxUsers: 100,
      maxServers: 50,
      features: ['무제한 세션', '세션 녹화', '감사 로그', 'SSO/SAML', 'API 접근', '우선 지원', 'SLA 보장'],
      issuedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 185 * 86400000).toISOString(),
      supportLevel: 'PREMIUM',
    };

    const mockUsage: UsageStats = {
      currentUsers: 25,
      currentServers: 12,
      currentSessions: 847,
      storageUsed: 45.2,
    };

    setLicense(mockLicense);
    setUsage(mockUsage);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleActivate = () => {
    if (!newLicenseKey) return;
    setMessage({ type: 'success', text: '라이선스가 활성화되었습니다.' });
    setShowActivateModal(false);
    setNewLicenseKey('');
  };

  const getRemainingDays = () => {
    if (!license) return 0;
    return Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / 86400000);
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'ENTERPRISE': return { color: '#8b5cf6', bg: '#8b5cf620', label: 'Enterprise', icon: '👑' };
      case 'PROFESSIONAL': return { color: '#3b82f6', bg: '#3b82f620', label: 'Professional', icon: '⭐' };
      case 'TEAM': return { color: '#10b981', bg: '#10b98120', label: 'Team', icon: '🏢' };
      case 'TRIAL': return { color: '#f59e0b', bg: '#f59e0b20', label: 'Trial', icon: '🎁' };
      default: return { color: '#6b7280', bg: '#6b728020', label: type, icon: '📋' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: '#10b981', bg: '#10b98120', label: '활성' };
      case 'EXPIRED': return { color: '#ef4444', bg: '#ef444420', label: '만료됨' };
      case 'GRACE_PERIOD': return { color: '#f59e0b', bg: '#f59e0b20', label: '유예 기간' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status };
    }
  };

  const remainingDays = getRemainingDays();

  return (
    <AdminLayout 
      title="라이선스" 
      description="라이선스 및 구독 관리"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => setShowActivateModal(true)}>🔑 라이선스 등록</button>
          <button className="btn btn-primary" onClick={() => setShowUpgradeModal(true)}>⬆️ 업그레이드</button>
        </div>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : license && usage && (
        <>
          {/* License Card */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px', background: `linear-gradient(135deg, ${getTypeConfig(license.type).bg} 0%, var(--color-surface) 100%)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '2rem' }}>{getTypeConfig(license.type).icon}</span>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getTypeConfig(license.type).color }}>
                      {getTypeConfig(license.type).label}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{license.owner}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '4px 12px', background: getStatusConfig(license.status).bg, color: getStatusConfig(license.status).color, borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  {getStatusConfig(license.status).label}
                </span>
                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {remainingDays > 0 ? `${remainingDays}일 남음` : '만료됨'}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', padding: '12px', background: 'var(--color-bg)', borderRadius: '6px', marginBottom: '16px' }}>
              {license.key}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {license.features.map(feature => (
                <span key={feature} style={{ padding: '4px 10px', background: 'var(--color-surface)', borderRadius: '6px', fontSize: '0.8rem' }}>
                  ✓ {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">사용자</div>
              <div className="stat-value">{usage.currentUsers} / {license.maxUsers}</div>
              <div style={{ height: '6px', background: 'var(--color-surface)', borderRadius: '3px', marginTop: '8px' }}>
                <div style={{ height: '100%', width: `${(usage.currentUsers / license.maxUsers) * 100}%`, background: '#10b981', borderRadius: '3px' }} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">서버</div>
              <div className="stat-value">{usage.currentServers} / {license.maxServers}</div>
              <div style={{ height: '6px', background: 'var(--color-surface)', borderRadius: '3px', marginTop: '8px' }}>
                <div style={{ height: '100%', width: `${(usage.currentServers / license.maxServers) * 100}%`, background: '#3b82f6', borderRadius: '3px' }} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">월간 세션</div>
              <div className="stat-value">{usage.currentSessions.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>무제한</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">저장 공간</div>
              <div className="stat-value">{usage.storageUsed} GB</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>녹화 저장</div>
            </div>
          </div>

          {/* License Details */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>📋 라이선스 정보</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>발급일</div>
                <div>{new Date(license.issuedAt).toLocaleDateString('ko-KR')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>만료일</div>
                <div>{new Date(license.expiresAt).toLocaleDateString('ko-KR')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>담당자 이메일</div>
                <div>{license.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>지원 레벨</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#f59e0b' }}>⭐</span>
                  {license.supportLevel}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Activate Modal */}
      {showActivateModal && (
        <div className="modal-overlay active" onClick={() => setShowActivateModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔑 라이선스 등록</h3>
              <button className="modal-close" onClick={() => setShowActivateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">라이선스 키</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="JT-XXX-XXXX-XXXX-XXXX-XXXX"
                  value={newLicenseKey}
                  onChange={(e) => setNewLicenseKey(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowActivateModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleActivate} disabled={!newLicenseKey}>활성화</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay active" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⬆️ 플랜 업그레이드</h3>
              <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { type: 'TEAM', price: '₩99,000', users: 10, servers: 10 },
                  { type: 'PROFESSIONAL', price: '₩299,000', users: 50, servers: 25 },
                  { type: 'ENTERPRISE', price: '문의', users: 100, servers: 50 },
                ].map(plan => {
                  const config = getTypeConfig(plan.type);
                  const isCurrent = license?.type === plan.type;
                  return (
                    <div key={plan.type} style={{ padding: '20px', background: isCurrent ? config.bg : 'var(--color-surface)', borderRadius: '12px', border: isCurrent ? `2px solid ${config.color}` : '2px solid transparent', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{config.icon}</div>
                      <div style={{ fontWeight: 600, color: config.color, marginBottom: '4px' }}>{config.label}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>{plan.price}<span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/월</span></div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                        <div>사용자 {plan.users}명</div>
                        <div>서버 {plan.servers}개</div>
                      </div>
                      <button className="btn btn-sm" style={{ width: '100%', background: isCurrent ? 'var(--color-surface)' : config.color, color: isCurrent ? 'var(--color-text-muted)' : 'white' }} disabled={isCurrent}>
                        {isCurrent ? '현재 플랜' : '선택'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUpgradeModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

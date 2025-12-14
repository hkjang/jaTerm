'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Policy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  allowedRoles: string[];
  commandMode: 'BLACKLIST' | 'WHITELIST';
  requireApproval: boolean;
  allowedDays: number[];
  allowedStartTime: string;
  allowedEndTime: string;
  serverCount: number;
}

const mockPolicies: Policy[] = [
  { 
    id: '1', 
    name: 'Production Full Access', 
    description: 'ADMIN 역할 전용 프로덕션 서버 접근 정책',
    isActive: true,
    allowedRoles: ['ADMIN'],
    commandMode: 'BLACKLIST',
    requireApproval: false,
    allowedDays: [1, 2, 3, 4, 5],
    allowedStartTime: '09:00',
    allowedEndTime: '18:00',
    serverCount: 5
  },
  { 
    id: '2', 
    name: 'Production Read Only', 
    description: 'OPERATOR 역할 프로덕션 조회 전용 정책',
    isActive: true,
    allowedRoles: ['OPERATOR'],
    commandMode: 'WHITELIST',
    requireApproval: true,
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedStartTime: '00:00',
    allowedEndTime: '23:59',
    serverCount: 5
  },
  { 
    id: '3', 
    name: 'Staging Access', 
    description: '개발자 스테이징 환경 접근 정책',
    isActive: true,
    allowedRoles: ['DEVELOPER', 'OPERATOR'],
    commandMode: 'BLACKLIST',
    requireApproval: false,
    allowedDays: [1, 2, 3, 4, 5],
    allowedStartTime: '08:00',
    allowedEndTime: '22:00',
    serverCount: 4
  },
  { 
    id: '4', 
    name: 'Development Free Access', 
    description: '개발 환경 자유 접근 정책',
    isActive: true,
    allowedRoles: ['DEVELOPER', 'OPERATOR', 'ADMIN'],
    commandMode: 'BLACKLIST',
    requireApproval: false,
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedStartTime: '00:00',
    allowedEndTime: '23:59',
    serverCount: 6
  },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState(mockPolicies);
  const [showModal, setShowModal] = useState(false);

  const getDayNames = (days: number[]) => {
    const names = ['일', '월', '화', '수', '목', '금', '토'];
    return days.map(d => names[d]).join(', ');
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      <aside className="sidebar" style={{ position: 'relative', height: '100vh' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="header-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>⌘</div>
          <span style={{ fontWeight: 600 }}>jaTerm Admin</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Overview</div>
            <Link href="/admin" className="sidebar-link"><span className="sidebar-link-icon">📊</span><span>대시보드</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Management</div>
            <Link href="/admin/users" className="sidebar-link"><span className="sidebar-link-icon">👥</span><span>사용자 관리</span></Link>
            <Link href="/admin/servers" className="sidebar-link"><span className="sidebar-link-icon">🖥️</span><span>서버 관리</span></Link>
            <Link href="/admin/policies" className="sidebar-link active"><span className="sidebar-link-icon">📋</span><span>정책 관리</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Monitoring</div>
            <Link href="/admin/sessions" className="sidebar-link"><span className="sidebar-link-icon">📺</span><span>세션 관제</span></Link>
            <Link href="/admin/audit" className="sidebar-link"><span className="sidebar-link-icon">📝</span><span>감사 로그</span></Link>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>정책 관리</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>서버 접근 정책 및 명령어 제어 설정</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 정책 추가
          </button>
        </div>

        {/* Policies Grid */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {policies.map(policy => (
            <div key={policy.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{policy.name}</h3>
                    <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {policy.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{policy.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm">수정</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>삭제</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>허용 역할</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {policy.allowedRoles.map(role => (
                      <span key={role} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{role}</span>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>명령 제어</div>
                  <div>
                    <span className={`badge ${policy.commandMode === 'WHITELIST' ? 'badge-warning' : 'badge-info'}`}>
                      {policy.commandMode === 'WHITELIST' ? '화이트리스트' : '블랙리스트'}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>접근 시간</div>
                  <div style={{ fontSize: '0.9rem' }}>
                    {getDayNames(policy.allowedDays)}<br />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {policy.allowedStartTime} - {policy.allowedEndTime}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>승인 필요</div>
                  <div>
                    {policy.requireApproval ? (
                      <span style={{ color: 'var(--color-warning)' }}>⚠️ 사전 승인 필요</span>
                    ) : (
                      <span style={{ color: 'var(--color-success)' }}>✓ 즉시 접근 가능</span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>적용 서버</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {policy.serverCount}대
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Policy Modal */}
        {showModal && (
          <div className="modal-overlay active" onClick={() => setShowModal(false)}>
            <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">정책 추가</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">정책 이름</label>
                  <input type="text" className="form-input" placeholder="Production Read Only" />
                </div>
                <div className="form-group">
                  <label className="form-label">설명</label>
                  <input type="text" className="form-input" placeholder="정책 설명..." />
                </div>
                <div className="form-group">
                  <label className="form-label">허용 역할</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER'].map(role => (
                      <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">명령 제어 모드</label>
                  <select className="form-input form-select">
                    <option value="BLACKLIST">블랙리스트 (위험 명령 차단)</option>
                    <option value="WHITELIST">화이트리스트 (허용 명령만)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">시작 시간</label>
                    <input type="time" className="form-input" defaultValue="09:00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">종료 시간</label>
                    <input type="time" className="form-input" defaultValue="18:00" />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    사전 승인 필요
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button className="btn btn-primary">추가</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

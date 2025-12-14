'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EmergencyAccess {
  id: string;
  requester: { name: string; email: string; role: string };
  server: { name: string; environment: string };
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
  commandsExecuted: number;
}

const mockEmergencyAccess: EmergencyAccess[] = [
  {
    id: '1',
    requester: { name: '홍길동', email: 'admin@jaterm.com', role: 'ADMIN' },
    server: { name: 'prod-web-01', environment: 'PROD' },
    reason: '긴급 서비스 장애 대응 - 502 에러 다수 발생',
    status: 'ACTIVE',
    grantedAt: new Date(Date.now() - 1800000),
    expiresAt: new Date(Date.now() + 1800000),
    commandsExecuted: 15,
  },
  {
    id: '2',
    requester: { name: '김철수', email: 'operator@jaterm.com', role: 'OPERATOR' },
    server: { name: 'prod-db-01', environment: 'PROD' },
    reason: '데이터베이스 복구 작업',
    status: 'EXPIRED',
    grantedAt: new Date(Date.now() - 7200000),
    expiresAt: new Date(Date.now() - 3600000),
    commandsExecuted: 42,
  },
  {
    id: '3',
    requester: { name: '이영희', email: 'dev@jaterm.com', role: 'DEVELOPER' },
    server: { name: 'prod-api-01', environment: 'PROD' },
    reason: '배포 실패 롤백',
    status: 'REVOKED',
    grantedAt: new Date(Date.now() - 86400000),
    expiresAt: new Date(Date.now() - 82800000),
    revokedAt: new Date(Date.now() - 85000000),
    revokedBy: '홍길동',
    commandsExecuted: 8,
  },
];

export default function EmergencyPage() {
  const [accesses, setAccesses] = useState(mockEmergencyAccess);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<EmergencyAccess | null>(null);

  const handleRevoke = (id: string) => {
    setAccesses(prev => prev.map(access =>
      access.id === id
        ? { ...access, status: 'REVOKED' as const, revokedAt: new Date(), revokedBy: '현재 관리자' }
        : access
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { class: 'badge-success', label: '활성' };
      case 'EXPIRED': return { class: 'badge-warning', label: '만료' };
      case 'REVOKED': return { class: 'badge-danger', label: '취소됨' };
      default: return { class: 'badge-info', label: status };
    }
  };

  const activeCount = accesses.filter(a => a.status === 'ACTIVE').length;

  return (
    <AdminLayout
      title="긴급 접근 (Break Glass)"
      description="긴급 상황 시 임시 접근 권한 부여 및 관리"
      actions={
        <button className="btn btn-danger" onClick={() => setShowGrantModal(true)}>
          🚨 긴급 접근 부여
        </button>
      }
    >
      {/* Warning Banner */}
      {activeCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>현재 {activeCount}건의 긴급 접근이 활성 상태입니다</div>
            <div style={{ fontSize: '0.85rem' }}>모든 활동이 실시간으로 모니터링됩니다</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">활성 긴급 접근</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">오늘 발급</div>
          <div className="stat-value">{accesses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">만료됨</div>
          <div className="stat-value">{accesses.filter(a => a.status === 'EXPIRED').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">취소됨</div>
          <div className="stat-value">{accesses.filter(a => a.status === 'REVOKED').length}</div>
        </div>
      </div>

      {/* Access List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {accesses.map(access => {
          const statusBadge = getStatusBadge(access.status);
          return (
            <div 
              key={access.id} 
              className="card" 
              style={{ 
                padding: '20px',
                borderLeft: access.status === 'ACTIVE' ? '4px solid var(--color-danger)' : undefined
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                    <span className="badge badge-danger">{access.server.environment}</span>
                    <span style={{ fontWeight: 600 }}>{access.server.name}</span>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사유</div>
                    <div style={{ fontWeight: 500 }}>{access.reason}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>요청자</div>
                      <div style={{ fontWeight: 500 }}>{access.requester.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{access.requester.role}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>시작 시간</div>
                      <div style={{ fontWeight: 500 }}>{access.grantedAt.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>만료 시간</div>
                      <div style={{ fontWeight: 500 }}>{access.expiresAt.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>실행 명령</div>
                      <div style={{ fontWeight: 500, fontSize: '1.25rem' }}>{access.commandsExecuted}개</div>
                    </div>
                  </div>

                  {access.revokedBy && (
                    <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      취소: {access.revokedBy} ({access.revokedAt?.toLocaleString()})
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAccess(access)}>
                    상세
                  </button>
                  {access.status === 'ACTIVE' && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRevoke(access.id)}
                    >
                      즉시 취소
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="modal-overlay active" onClick={() => setShowGrantModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚨 긴급 접근 부여</h3>
              <button className="modal-close" onClick={() => setShowGrantModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                <span>⚠️</span>
                <span>긴급 접근은 모든 정책을 우회합니다. 신중하게 사용하세요.</span>
              </div>
              <div className="form-group">
                <label className="form-label">대상 사용자</label>
                <select className="form-input form-select">
                  <option value="">사용자 선택</option>
                  <option value="1">홍길동 (ADMIN)</option>
                  <option value="2">김철수 (OPERATOR)</option>
                  <option value="3">이영희 (DEVELOPER)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">대상 서버</label>
                <select className="form-input form-select">
                  <option value="">서버 선택</option>
                  <option value="1">prod-web-01 (PROD)</option>
                  <option value="2">prod-api-01 (PROD)</option>
                  <option value="3">prod-db-01 (PROD)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">긴급 접근 사유</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="긴급 접근이 필요한 상세 사유를 입력하세요..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">접근 유효 시간</label>
                <select className="form-input form-select">
                  <option value="30">30분</option>
                  <option value="60">1시간</option>
                  <option value="120">2시간</option>
                  <option value="240">4시간</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGrantModal(false)}>취소</button>
              <button className="btn btn-danger">긴급 접근 부여</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAccess && (
        <div className="modal-overlay active" onClick={() => setSelectedAccess(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">긴급 접근 상세</h3>
              <button className="modal-close" onClick={() => setSelectedAccess(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                background: 'var(--terminal-bg)', 
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }}># 실행된 명령어 로그 (샘플)</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> systemctl status nginx</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> tail -100 /var/log/nginx/error.log</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> systemctl restart nginx</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> curl -I localhost</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAccess(null)}>닫기</button>
              {selectedAccess.status === 'ACTIVE' && (
                <button className="btn btn-danger" onClick={() => { handleRevoke(selectedAccess.id); setSelectedAccess(null); }}>
                  즉시 취소
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

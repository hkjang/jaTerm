'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CommandPolicy {
  id: string;
  name: string;
  type: 'BLACKLIST' | 'WHITELIST';
  patterns: string[];
  isRegex: boolean;
  environment: string[];
  roles: string[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const mockCommandPolicies: CommandPolicy[] = [
  {
    id: '1',
    name: '위험 명령 차단',
    type: 'BLACKLIST',
    patterns: ['rm -rf /', 'rm -rf /*', 'mkfs', 'dd if=/dev/zero', ':(){:|:&};:'],
    isRegex: false,
    environment: ['PROD', 'STAGE'],
    roles: ['DEVELOPER', 'OPERATOR'],
    isActive: true,
    version: 3,
    createdAt: new Date(Date.now() - 86400000 * 30),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    name: 'Production 엄격 모드',
    type: 'WHITELIST',
    patterns: ['ls', 'cat', 'tail', 'head', 'grep', 'ps', 'top', 'df', 'du'],
    isRegex: false,
    environment: ['PROD'],
    roles: ['OPERATOR'],
    isActive: true,
    version: 5,
    createdAt: new Date(Date.now() - 86400000 * 60),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: '3',
    name: '정규식 패턴 차단',
    type: 'BLACKLIST',
    patterns: ['chmod\\s+777', 'curl.*\\|.*sh', 'wget.*\\|.*bash', '>(\\s*/dev/sd[a-z])'],
    isRegex: true,
    environment: ['PROD', 'STAGE', 'DEV'],
    roles: ['DEVELOPER', 'OPERATOR', 'ADMIN'],
    isActive: true,
    version: 2,
    createdAt: new Date(Date.now() - 86400000 * 15),
    updatedAt: new Date(Date.now() - 86400000 * 5),
  },
];

export default function CommandsPage() {
  const [policies, setPolicies] = useState(mockCommandPolicies);
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<CommandPolicy | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const filteredPolicies = policies.filter(policy => {
    return !typeFilter || policy.type === typeFilter;
  });

  return (
    <AdminLayout
      title="명령어 통제 정책"
      description="위험 명령 관리, Blacklist/Whitelist, 정규식 패턴 제어"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 정책 추가
        </button>
      }
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Blacklist 정책</div>
          <div className="stat-value">{policies.filter(p => p.type === 'BLACKLIST').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Whitelist 정책</div>
          <div className="stat-value">{policies.filter(p => p.type === 'WHITELIST').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">정규식 패턴</div>
          <div className="stat-value">{policies.filter(p => p.isRegex).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 정책</div>
          <div className="stat-value">{policies.filter(p => p.isActive).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <select
            className="form-input form-select"
            style={{ width: '200px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">모든 유형</option>
            <option value="BLACKLIST">Blacklist</option>
            <option value="WHITELIST">Whitelist</option>
          </select>
        </div>
      </div>

      {/* Policies Grid */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredPolicies.map(policy => (
          <div key={policy.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{policy.name}</h3>
                  <span className={`badge ${policy.type === 'BLACKLIST' ? 'badge-danger' : 'badge-success'}`}>
                    {policy.type}
                  </span>
                  {policy.isRegex && (
                    <span className="badge badge-info">정규식</span>
                  )}
                  <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {policy.isActive ? '활성' : '비활성'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  버전 {policy.version} • 최종 수정: {policy.updatedAt.toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPolicy(policy)}>수정</button>
                <button className="btn btn-ghost btn-sm">이력</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>삭제</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {policy.type === 'BLACKLIST' ? '차단 패턴' : '허용 패턴'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', maxHeight: '80px', overflow: 'auto' }}>
                  {policy.patterns.slice(0, 3).map((pattern, idx) => (
                    <div key={idx} style={{ 
                      padding: '4px 8px', 
                      background: policy.type === 'BLACKLIST' ? 'var(--color-danger)20' : 'var(--color-success)20',
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}>
                      {pattern}
                    </div>
                  ))}
                  {policy.patterns.length > 3 && (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      +{policy.patterns.length - 3}개 더...
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>적용 환경</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {policy.environment.map(env => (
                    <span key={env} className={`badge ${
                      env === 'PROD' ? 'badge-danger' : env === 'STAGE' ? 'badge-warning' : 'badge-success'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {env}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>적용 역할</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {policy.roles.map(role => (
                    <span key={role} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showModal || selectedPolicy) && (
        <div className="modal-overlay active" onClick={() => { setShowModal(false); setSelectedPolicy(null); }}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedPolicy ? '정책 수정' : '정책 추가'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setSelectedPolicy(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">정책 이름</label>
                <input type="text" className="form-input" placeholder="위험 명령 차단" defaultValue={selectedPolicy?.name} />
              </div>
              <div className="form-group">
                <label className="form-label">유형</label>
                <select className="form-input form-select" defaultValue={selectedPolicy?.type || 'BLACKLIST'}>
                  <option value="BLACKLIST">Blacklist (차단 목록)</option>
                  <option value="WHITELIST">Whitelist (허용 목록)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">패턴 (줄바꿈으로 구분)</label>
                <textarea 
                  className="form-input" 
                  rows={5}
                  placeholder="rm -rf /&#10;mkfs&#10;dd if=/dev/zero"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                  defaultValue={selectedPolicy?.patterns.join('\n')}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked={selectedPolicy?.isRegex} />
                  정규식 패턴 사용
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">적용 환경</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['PROD', 'STAGE', 'DEV'].map(env => (
                    <label key={env} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" defaultChecked={selectedPolicy?.environment.includes(env)} />
                      {env}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">적용 역할</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER'].map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" defaultChecked={selectedPolicy?.roles.includes(role)} />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setSelectedPolicy(null); }}>취소</button>
              <button className="btn btn-primary">{selectedPolicy ? '저장' : '추가'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

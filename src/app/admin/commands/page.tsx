'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CommandPolicy {
  id: string;
  name: string;
  description: string | null;
  type: 'BLACKLIST' | 'WHITELIST';
  patterns: string[];
  isRegex: boolean;
  environment: string[];
  roles: string[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CommandsPage() {
  const [policies, setPolicies] = useState<CommandPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<CommandPolicy | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchPolicies = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (typeFilter) params.set('type', typeFilter);

      const response = await fetch(`/api/admin/commands?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch policies');
      
      const data = await response.json();
      setPolicies(data.policies);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('정책 목록을 불러오는데 실패했습니다.');
      console.error('Fetch command policies error:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 정책을 삭제하시겠습니까?')) return;

    try {
      await fetch('/api/admin/commands', {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSuccess('정책이 삭제되었습니다.');
      fetchPolicies();
    } catch (err) {
      setError('정책 삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (policy: CommandPolicy) => {
    try {
      await fetch('/api/admin/commands', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: policy.id, isActive: !policy.isActive }),
      });
      setSuccess(policy.isActive ? '정책이 비활성화되었습니다.' : '정책이 활성화되었습니다.');
      fetchPolicies();
    } catch (err) {
      setError('상태 변경에 실패했습니다.');
    }
  };

  const blacklistCount = policies.filter(p => p.type === 'BLACKLIST').length;
  const whitelistCount = policies.filter(p => p.type === 'WHITELIST').length;
  const regexCount = policies.filter(p => p.isRegex).length;
  const activeCount = policies.filter(p => p.isActive).length;

  return (
    <AdminLayout
      title="명령어 통제 정책"
      description="위험 명령 관리, Blacklist/Whitelist, 정규식 패턴 제어"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 정책 추가</button>}
    >
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}<button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">Blacklist 정책</div><div className="stat-value">{blacklistCount}</div></div>
        <div className="stat-card"><div className="stat-label">Whitelist 정책</div><div className="stat-value">{whitelistCount}</div></div>
        <div className="stat-card"><div className="stat-label">정규식 패턴</div><div className="stat-value">{regexCount}</div></div>
        <div className="stat-card"><div className="stat-label">활성 정책</div><div className="stat-value">{activeCount}</div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <select className="form-input form-select" style={{ width: '200px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">모든 유형</option>
            <option value="BLACKLIST">Blacklist</option>
            <option value="WHITELIST">Whitelist</option>
          </select>
          <button className="btn btn-ghost" onClick={() => fetchPolicies()}>🔄 새로고침</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : policies.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          정책이 없습니다. 새 정책을 추가해주세요.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {policies.map(policy => (
            <div key={policy.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{policy.name}</h3>
                    <span className={`badge ${policy.type === 'BLACKLIST' ? 'badge-danger' : 'badge-success'}`}>{policy.type}</span>
                    {policy.isRegex && <span className="badge badge-info">정규식</span>}
                    <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-danger'}`}>{policy.isActive ? '활성' : '비활성'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    버전 {policy.version} • 최종 수정: {new Date(policy.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPolicy(policy)}>수정</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(policy)}>
                    {policy.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(policy.id)}>삭제</button>
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
                      }}>{pattern}</div>
                    ))}
                    {policy.patterns.length > 3 && (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>+{policy.patterns.length - 3}개 더...</div>
                    )}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>적용 환경</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {policy.environment.map(env => (
                      <span key={env} className={`badge ${env === 'PROD' ? 'badge-danger' : env === 'STAGE' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>{env}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>적용 역할</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {policy.roles.map(role => (
                      <span key={role} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{role}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => fetchPolicies(pagination.page - 1)}>← 이전</button>
          <span style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>{pagination.page} / {pagination.totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchPolicies(pagination.page + 1)}>다음 →</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">정책 추가</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">정책 이름</label><input type="text" className="form-input" placeholder="위험 명령 차단" /></div>
              <div className="form-group"><label className="form-label">유형</label>
                <select className="form-input form-select">
                  <option value="BLACKLIST">Blacklist (차단 목록)</option>
                  <option value="WHITELIST">Whitelist (허용 목록)</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">패턴 (줄바꿈으로 구분)</label>
                <textarea className="form-input" rows={5} placeholder="rm -rf /&#10;mkfs&#10;dd if=/dev/zero" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
              </div>
              <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" /> 정규식 패턴 사용</label></div>
              <div className="form-group"><label className="form-label">적용 환경</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['PROD', 'STAGE', 'DEV'].map(env => (<label key={env} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" />{env}</label>))}
                </div>
              </div>
              <div className="form-group"><label className="form-label">적용 역할</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER'].map(role => (<label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" />{role}</label>))}
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">추가</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

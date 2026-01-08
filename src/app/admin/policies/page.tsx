'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Policy {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  allowedRoles: string[];
  commandMode: 'BLACKLIST' | 'WHITELIST';
  requireApproval: boolean;
  allowedDays: number[];
  allowedStartTime: string | null;
  allowedEndTime: string | null;
  servers: { id: string; name: string }[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowedRoles: [] as string[],
    commandMode: 'BLACKLIST',
    allowedStartTime: '09:00',
    allowedEndTime: '18:00',
    requireApproval: false,
  });

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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/policies?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch policies');
      
      const data = await response.json();
      setPolicies(data.policies);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('정책 목록을 불러오는데 실패했습니다.');
      console.error('Fetch policies error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreatePolicy = async () => {
    try {
      const response = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allowedDays: [1, 2, 3, 4, 5], // Weekdays by default
        }),
      });

      if (!response.ok) throw new Error('Failed to create policy');

      setSuccess('정책이 생성되었습니다.');
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        allowedRoles: [],
        commandMode: 'BLACKLIST',
        allowedStartTime: '09:00',
        allowedEndTime: '18:00',
        requireApproval: false,
      });
      fetchPolicies();
    } catch (err) {
      setError('정책 생성에 실패했습니다.');
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    try {
      await fetch('/api/admin/policies', {
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

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('정말 이 정책을 삭제하시겠습니까?')) return;

    try {
      await fetch('/api/admin/policies', {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: policyId }),
      });

      setSuccess('정책이 삭제되었습니다.');
      fetchPolicies();
    } catch (err) {
      setError('정책 삭제에 실패했습니다.');
    }
  };

  const getDayNames = (days: number[]) => {
    const names = ['일', '월', '화', '수', '목', '금', '토'];
    return days.map(d => names[d]).join(', ');
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter(r => r !== role)
        : [...prev.allowedRoles, role]
    }));
  };

  return (
    <AdminLayout 
      title="접근 정책" 
      description="서버 접근 정책 및 시간 제어 설정"
      actions={
        <>
          <button className="btn btn-secondary" onClick={() => setShowSimulation(true)}>🔍 시뮬레이션</button>
          <button className="btn btn-primary" style={{ marginLeft: '8px' }} onClick={() => setShowModal(true)}>+ 정책 추가</button>
        </>
      }
    >
      {/* Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Policies Grid */}
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
                    <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {policy.isActive ? '활성' : '비활성'}
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      우선순위: {policy.priority}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {policy.description || '설명 없음'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleActive(policy)}
                  >
                    {policy.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleDeletePolicy(policy.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>허용 역할</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {policy.allowedRoles.length > 0 ? (
                      policy.allowedRoles.map(role => (
                        <span key={role} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{role}</span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>전체</span>
                    )}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>명령 제어</div>
                  <span className={`badge ${policy.commandMode === 'WHITELIST' ? 'badge-warning' : 'badge-info'}`}>
                    {policy.commandMode === 'WHITELIST' ? '화이트리스트' : '블랙리스트'}
                  </span>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>접근 시간</div>
                  <div style={{ fontSize: '0.9rem' }}>
                    {policy.allowedDays.length > 0 ? getDayNames(policy.allowedDays) : '매일'}<br />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {policy.allowedStartTime || '00:00'} - {policy.allowedEndTime || '23:59'}
                    </span>
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>승인 필요</div>
                  {policy.requireApproval 
                    ? <span style={{ color: 'var(--color-warning)' }}>⚠️ 사전 승인 필요</span> 
                    : <span style={{ color: 'var(--color-success)' }}>✓ 즉시 접근 가능</span>
                  }
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>적용 서버</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {policy.servers.length}대
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            disabled={pagination.page <= 1}
            onClick={() => fetchPolicies(pagination.page - 1)}
          >
            ← 이전
          </button>
          <span style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button 
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchPolicies(pagination.page + 1)}
          >
            다음 →
          </button>
        </div>
      )}

      {/* Create Policy Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">정책 추가</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">정책 이름 *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: Production Access"
                />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="정책에 대한 설명"
                />
              </div>
              <div className="form-group">
                <label className="form-label">허용 역할</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER'].map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox"
                        checked={formData.allowedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">명령 제어 모드</label>
                <select 
                  className="form-input form-select"
                  value={formData.commandMode}
                  onChange={(e) => setFormData({ ...formData, commandMode: e.target.value })}
                >
                  <option value="BLACKLIST">블랙리스트 (위험 명령 차단)</option>
                  <option value="WHITELIST">화이트리스트 (허용 명령만 실행)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">시작 시간</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.allowedStartTime}
                    onChange={(e) => setFormData({ ...formData, allowedStartTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">종료 시간</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.allowedEndTime}
                    onChange={(e) => setFormData({ ...formData, allowedEndTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={formData.requireApproval}
                    onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
                  />
                  사전 승인 필요
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button 
                className="btn btn-primary"
                onClick={handleCreatePolicy}
                disabled={!formData.name}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimulation && (
        <div className="modal-overlay active" onClick={() => setShowSimulation(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">정책 시뮬레이션</h3>
              <button className="modal-close" onClick={() => setShowSimulation(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">사용자 역할</label>
                <select className="form-input form-select">
                  <option>OPERATOR</option>
                  <option>DEVELOPER</option>
                  <option>ADMIN</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">대상 서버</label>
                <select className="form-input form-select">
                  <option>prod-web-01</option>
                  <option>stage-api-01</option>
                  <option>dev-server-01</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">시간</label>
                <input type="datetime-local" className="form-input" />
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)', marginTop: '16px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>시뮬레이션 결과</div>
                <div style={{ color: 'var(--color-success)' }}>✓ 접근 허용 (해당 정책 적용)</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSimulation(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

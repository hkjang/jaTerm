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
  commandPatterns: string[];
  requireApproval: boolean;
  allowedDays: number[];
  allowedStartTime: string | null;
  allowedEndTime: string | null;
  servers: { id: string; name: string; environment?: string }[];
  serverGroups: { id: string; name: string }[];
  createdAt: string;
}

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SimulationResult {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
  policyName?: string;
  user?: { name: string; email: string; role: string };
  server?: { name: string; environment: string };
  details?: { type: string; message: string; policyName?: string }[];
  evaluatedPolicies?: { name: string; priority: number; matched: boolean; matchReason: string }[];
  restrictions?: { commandMode: string };
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const ROLES = ['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER'];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    priority: 0,
    allowedRoles: [] as string[],
    commandMode: 'BLACKLIST',
    commandPatterns: [] as string[],
    newPattern: '',
    allowedDays: [1, 2, 3, 4, 5] as number[],
    allowedStartTime: '09:00',
    allowedEndTime: '18:00',
    requireApproval: false,
    serverIds: [] as string[],
  });

  // Simulation state
  const [simForm, setSimForm] = useState({
    userId: '',
    serverId: '',
    simulatedTime: new Date().toISOString().slice(0, 16),
  });
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

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

  const fetchServers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/servers?limit=100', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers || []);
      }
    } catch (err) {
      console.error('Fetch servers error:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
    fetchServers();
    fetchUsers();
  }, [fetchPolicies, fetchServers, fetchUsers]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      priority: 0,
      allowedRoles: [],
      commandMode: 'BLACKLIST',
      commandPatterns: [],
      newPattern: '',
      allowedDays: [1, 2, 3, 4, 5],
      allowedStartTime: '09:00',
      allowedEndTime: '18:00',
      requireApproval: false,
      serverIds: [],
    });
    setEditMode(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (policy: Policy) => {
    setFormData({
      id: policy.id,
      name: policy.name,
      description: policy.description || '',
      priority: policy.priority,
      allowedRoles: policy.allowedRoles || [],
      commandMode: policy.commandMode,
      commandPatterns: policy.commandPatterns || [],
      newPattern: '',
      allowedDays: policy.allowedDays || [],
      allowedStartTime: policy.allowedStartTime || '09:00',
      allowedEndTime: policy.allowedEndTime || '18:00',
      requireApproval: policy.requireApproval,
      serverIds: policy.servers.map(s => s.id),
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openDuplicateModal = (policy: Policy) => {
    setFormData({
      id: '',
      name: `${policy.name} (복사)`,
      description: policy.description || '',
      priority: policy.priority,
      allowedRoles: policy.allowedRoles || [],
      commandMode: policy.commandMode,
      commandPatterns: policy.commandPatterns || [],
      newPattern: '',
      allowedDays: policy.allowedDays || [],
      allowedStartTime: policy.allowedStartTime || '09:00',
      allowedEndTime: policy.allowedEndTime || '18:00',
      requireApproval: policy.requireApproval,
      serverIds: policy.servers.map(s => s.id),
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleSavePolicy = async () => {
    try {
      const method = editMode ? 'PUT' : 'POST';
      const payload: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        allowedRoles: formData.allowedRoles,
        commandMode: formData.commandMode,
        commandPatterns: formData.commandPatterns,
        allowedDays: formData.allowedDays,
        allowedStartTime: formData.allowedStartTime,
        allowedEndTime: formData.allowedEndTime,
        requireApproval: formData.requireApproval,
        serverIds: formData.serverIds,
      };

      if (editMode) {
        payload.id = formData.id;
      }

      const response = await fetch('/api/admin/policies', {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save policy');

      setSuccess(editMode ? '정책이 수정되었습니다.' : '정책이 생성되었습니다.');
      setShowModal(false);
      resetForm();
      fetchPolicies();
    } catch (err) {
      setError(editMode ? '정책 수정에 실패했습니다.' : '정책 생성에 실패했습니다.');
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

  const handleSimulation = async () => {
    if (!simForm.userId || !simForm.serverId) {
      setError('사용자와 서버를 선택해주세요.');
      return;
    }

    setSimLoading(true);
    try {
      const response = await fetch('/api/admin/policies/simulate', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(simForm),
      });

      if (!response.ok) throw new Error('Simulation failed');
      
      const result = await response.json();
      setSimResult(result);
    } catch (err) {
      setError('시뮬레이션에 실패했습니다.');
    } finally {
      setSimLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter(r => r !== role)
        : [...prev.allowedRoles, role]
    }));
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      allowedDays: prev.allowedDays.includes(day)
        ? prev.allowedDays.filter(d => d !== day)
        : [...prev.allowedDays, day].sort()
    }));
  };

  const handleServerToggle = (serverId: string) => {
    setFormData(prev => ({
      ...prev,
      serverIds: prev.serverIds.includes(serverId)
        ? prev.serverIds.filter(s => s !== serverId)
        : [...prev.serverIds, serverId]
    }));
  };

  const addCommandPattern = () => {
    if (!formData.newPattern.trim()) return;
    setFormData(prev => ({
      ...prev,
      commandPatterns: [...prev.commandPatterns, prev.newPattern.trim()],
      newPattern: '',
    }));
  };

  const removeCommandPattern = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      commandPatterns: prev.commandPatterns.filter((_, i) => i !== idx),
    }));
  };

  const getDayNames = (days: number[]) => {
    return days.map(d => DAY_NAMES[d]).join(', ');
  };

  // Stats calculation
  const activeCount = policies.filter(p => p.isActive).length;
  const approvalRequiredCount = policies.filter(p => p.requireApproval).length;
  const whitelistCount = policies.filter(p => p.commandMode === 'WHITELIST').length;

  return (
    <AdminLayout 
      title="접근 정책" 
      description="서버 접근 정책 및 시간 제어 설정"
      actions={
        <>
          <button className="btn btn-secondary" onClick={() => { setShowSimulation(true); setSimResult(null); }}>🔍 시뮬레이션</button>
          <button className="btn btn-primary" style={{ marginLeft: '8px' }} onClick={openCreateModal}>+ 정책 추가</button>
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

      {/* Stats Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 정책</div>
          <div className="stat-value">{policies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 정책</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">승인 필요</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{approvalRequiredCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">화이트리스트</div>
          <div className="stat-value" style={{ color: 'var(--color-info)' }}>{whitelistCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('list')}
        >
          📋 정책 목록
        </button>
        <button 
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 환경별 현황
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
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
                        onClick={() => { setSelectedPolicy(policy); setShowDetailModal(true); }}
                      >
                        상세
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditModal(policy)}
                      >
                        편집
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => openDuplicateModal(policy)}
                      >
                        복제
                      </button>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
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
                      {policy.commandPatterns && policy.commandPatterns.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          {policy.commandPatterns.length}개 패턴
                        </div>
                      )}
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
        </>
      ) : (
        /* Stats Tab */
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>환경별 정책 현황</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {['PROD', 'STAGE', 'DEV'].map(env => {
              const envServers = servers.filter(s => s.environment === env);
              const coveredServers = envServers.filter(s => 
                policies.some(p => p.servers.some(ps => ps.id === s.id))
              );
              return (
                <div key={env} className="stat-card">
                  <div className="stat-label">
                    <span className={`badge ${env === 'PROD' ? 'badge-danger' : env === 'STAGE' ? 'badge-warning' : 'badge-success'}`}>
                      {env}
                    </span>
                  </div>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                    {coveredServers.length}/{envServers.length}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    서버에 정책 적용
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Policy Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editMode ? '정책 수정' : '정책 추가'}</h3>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">우선순위</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>높을수록 먼저 평가</small>
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
              </div>

              <div className="form-group">
                <label className="form-label">허용 역할</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {ROLES.map(role => (
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
                <small style={{ color: 'var(--color-text-muted)' }}>선택 안함 = 전체 역할</small>
              </div>

              <div className="form-group">
                <label className="form-label">허용 요일</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAY_NAMES.map((name, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn btn-sm ${formData.allowedDays.includes(idx) ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleDayToggle(idx)}
                      style={{ minWidth: '40px' }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
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
                <label className="form-label">명령 패턴 ({formData.commandMode === 'WHITELIST' ? '허용' : '차단'})</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.newPattern}
                    onChange={(e) => setFormData({ ...formData, newPattern: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCommandPattern())}
                    placeholder="rm -rf, shutdown, reboot..."
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-secondary" onClick={addCommandPattern}>추가</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {formData.commandPatterns.map((pattern, idx) => (
                    <span key={idx} className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <code>{pattern}</code>
                      <button 
                        onClick={() => removeCommandPattern(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">적용 서버</label>
                <div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                  {servers.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', padding: '8px' }}>서버가 없습니다.</div>
                  ) : (
                    servers.map(server => (
                      <label 
                        key={server.id} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}
                      >
                        <input 
                          type="checkbox"
                          checked={formData.serverIds.includes(server.id)}
                          onChange={() => handleServerToggle(server.id)}
                        />
                        <span className={`badge ${server.environment === 'PROD' ? 'badge-danger' : server.environment === 'STAGE' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                          {server.environment}
                        </span>
                        <span>{server.name}</span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{server.hostname}</span>
                      </label>
                    ))
                  )}
                </div>
                <small style={{ color: 'var(--color-text-muted)' }}>{formData.serverIds.length}개 선택됨</small>
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
                onClick={handleSavePolicy}
                disabled={!formData.name}
              >
                {editMode ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Detail Modal */}
      {showDetailModal && selectedPolicy && (
        <div className="modal-overlay active" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">정책 상세: {selectedPolicy.name}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>설명</div>
                  <div style={{ fontWeight: 500 }}>{selectedPolicy.description || '없음'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>명령 패턴</div>
                  {selectedPolicy.commandPatterns && selectedPolicy.commandPatterns.length > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {selectedPolicy.commandPatterns.map((p, idx) => (
                        <code key={idx} style={{ padding: '2px 6px', background: 'var(--color-surface)', borderRadius: '4px', fontSize: '0.85rem' }}>{p}</code>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>없음</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>적용 서버</div>
                  {selectedPolicy.servers.length > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedPolicy.servers.map(server => (
                        <span key={server.id} className="badge badge-info">{server.name}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>없음</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>생성일</div>
                  <div>{new Date(selectedPolicy.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>닫기</button>
              <button className="btn btn-primary" onClick={() => { setShowDetailModal(false); openEditModal(selectedPolicy); }}>편집</button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimulation && (
        <div className="modal-overlay active" onClick={() => setShowSimulation(false)}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔍 정책 시뮬레이션</h3>
              <button className="modal-close" onClick={() => setShowSimulation(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">사용자</label>
                  <select 
                    className="form-input form-select"
                    value={simForm.userId}
                    onChange={(e) => setSimForm({ ...simForm, userId: e.target.value })}
                  >
                    <option value="">사용자 선택</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">대상 서버</label>
                  <select 
                    className="form-input form-select"
                    value={simForm.serverId}
                    onChange={(e) => setSimForm({ ...simForm, serverId: e.target.value })}
                  >
                    <option value="">서버 선택</option>
                    {servers.map(server => (
                      <option key={server.id} value={server.id}>
                        [{server.environment}] {server.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">시뮬레이션 시간</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={simForm.simulatedTime}
                  onChange={(e) => setSimForm({ ...simForm, simulatedTime: e.target.value })}
                />
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '8px' }}
                onClick={handleSimulation}
                disabled={simLoading || !simForm.userId || !simForm.serverId}
              >
                {simLoading ? '평가 중...' : '🔍 시뮬레이션 실행'}
              </button>

              {simResult && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                    background: simResult.allowed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    padding: '16px', 
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${simResult.allowed ? 'var(--color-success)' : 'var(--color-danger)'}`,
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{simResult.allowed ? '✅' : '❌'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {simResult.allowed ? '접근 허용' : '접근 거부'}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                          {simResult.reason}
                        </div>
                      </div>
                    </div>
                    {simResult.requiresApproval && (
                      <div className="badge badge-warning">사전 승인 필요</div>
                    )}
                    {simResult.policyName && (
                      <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        적용 정책: <strong>{simResult.policyName}</strong>
                      </div>
                    )}
                    {simResult.restrictions?.commandMode && (
                      <div style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                        명령 제어: <span className="badge badge-info">{simResult.restrictions.commandMode}</span>
                      </div>
                    )}
                  </div>

                  {simResult.details && simResult.details.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>평가 과정</div>
                      {simResult.details.map((detail, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '6px 0',
                          borderBottom: '1px solid var(--color-border)'
                        }}>
                          <span>
                            {detail.type === 'success' ? '✓' : detail.type === 'error' ? '✗' : detail.type === 'warning' ? '⚠' : 'ℹ'}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>{detail.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {simResult.evaluatedPolicies && simResult.evaluatedPolicies.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>평가된 정책</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {simResult.evaluatedPolicies.map((p, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '8px',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)'
                          }}>
                            <div>
                              <span style={{ fontWeight: 500 }}>{p.name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>우선순위 {p.priority}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: p.matched ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                              {p.matchReason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

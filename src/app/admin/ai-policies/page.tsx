'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AIPolicy {
  id: string;
  name: string;
  description: string | null;
  allowedFeatures: string;
  rateLimit: number;
  promptMaxLength: number;
  allowedRoles: string;
  riskThreshold: number;
  autoBlock: boolean;
  resultMasking: boolean;
  timeRestriction: string | null;
  isActive: boolean;
}

interface PolicyForm {
  name: string;
  description: string;
  allowedFeatures: string[];
  rateLimit: number;
  promptMaxLength: number;
  allowedRoles: string[];
  riskThreshold: number;
  autoBlock: boolean;
  resultMasking: boolean;
  timeRestrictionEnabled: boolean;
  timeStart: string;
  timeEnd: string;
  isActive: boolean;
}

const features = [
  { value: 'explain', label: '명령 설명' },
  { value: 'generate', label: '명령 생성' },
  { value: 'analyze', label: '위험 분석' },
  { value: 'summarize', label: '로그 요약' },
];

const roles = ['SUPER', 'ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER', 'USER'];

const defaultForm: PolicyForm = {
  name: '',
  description: '',
  allowedFeatures: ['explain', 'generate', 'analyze', 'summarize'],
  rateLimit: 100,
  promptMaxLength: 2000,
  allowedRoles: ['ADMIN', 'OPERATOR'],
  riskThreshold: 0.7,
  autoBlock: false,
  resultMasking: false,
  timeRestrictionEnabled: false,
  timeStart: '09:00',
  timeEnd: '18:00',
  isActive: true,
};

export default function AIPoliciesPage() {
  const [policies, setPolicies] = useState<AIPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/admin/ai-policies');
      const data = await res.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (policy: AIPolicy) => {
    const timeRestriction = policy.timeRestriction ? JSON.parse(policy.timeRestriction) : null;
    
    setForm({
      name: policy.name,
      description: policy.description || '',
      allowedFeatures: JSON.parse(policy.allowedFeatures),
      rateLimit: policy.rateLimit,
      promptMaxLength: policy.promptMaxLength,
      allowedRoles: JSON.parse(policy.allowedRoles),
      riskThreshold: policy.riskThreshold,
      autoBlock: policy.autoBlock,
      resultMasking: policy.resultMasking,
      timeRestrictionEnabled: !!timeRestriction,
      timeStart: timeRestriction?.start || '09:00',
      timeEnd: timeRestriction?.end || '18:00',
      isActive: policy.isActive,
    });
    setEditingId(policy.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/ai-policies/${editingId}`
        : '/api/admin/ai-policies';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        name: form.name,
        description: form.description || null,
        allowedFeatures: form.allowedFeatures,
        rateLimit: form.rateLimit,
        promptMaxLength: form.promptMaxLength,
        allowedRoles: form.allowedRoles,
        riskThreshold: form.riskThreshold,
        autoBlock: form.autoBlock,
        resultMasking: form.resultMasking,
        timeRestriction: form.timeRestrictionEnabled 
          ? { start: form.timeStart, end: form.timeEnd }
          : null,
        isActive: form.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchPolicies();
      } else {
        const data = await res.json();
        alert(data.error || 'Save failed');
      }
    } catch (error) {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/admin/ai-policies/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPolicies();
      }
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
    <AdminLayout title="AI 정책 관리" description="AI 기능 사용 정책 및 제한 설정">
      {/* 통계 카드 */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 정책</div>
          <div className="stat-value">{policies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 정책</div>
          <div className="stat-value">{policies.filter(p => p.isActive).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">자동 차단 활성</div>
          <div className="stat-value">{policies.filter(p => p.autoBlock).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">결과 마스킹</div>
          <div className="stat-value">{policies.filter(p => p.resultMasking).length}</div>
        </div>
      </div>

      {/* 정책 목록 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600 }}>🔒 AI 정책 목록</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            + 정책 추가
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : policies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            등록된 정책이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {policies.map(policy => (
              <div
                key={policy.id}
                style={{
                  padding: '16px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: policy.isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{policy.name}</span>
                      <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {policy.isActive ? '활성' : '비활성'}
                      </span>
                      {policy.autoBlock && <span className="badge badge-warning">자동 차단</span>}
                      {policy.resultMasking && <span className="badge badge-info">마스킹</span>}
                    </div>
                    {policy.description && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        {policy.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Rate Limit:</span>{' '}
                        <strong>{policy.rateLimit}회/시간</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Max Prompt:</span>{' '}
                        <strong>{policy.promptMaxLength}자</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>위험 임계치:</span>{' '}
                        <strong>{Math.round(policy.riskThreshold * 100)}%</strong>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      허용 기능: {JSON.parse(policy.allowedFeatures).join(', ')} |{' '}
                      허용 Role: {JSON.parse(policy.allowedRoles).join(', ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(policy)}>
                      수정
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(policy.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? '정책 수정' : '정책 추가'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">정책 이름 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 기본 AI 사용 정책"
                />
              </div>

              <div className="form-group">
                <label className="form-label">설명</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="정책 설명"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label className="form-label">허용 기능</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {features.map(f => (
                    <label key={f.value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={form.allowedFeatures.includes(f.value)}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm({ ...form, allowedFeatures: [...form.allowedFeatures, f.value] });
                          } else {
                            setForm({ ...form, allowedFeatures: form.allowedFeatures.filter(v => v !== f.value) });
                          }
                        }}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">허용 Role</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {roles.map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={form.allowedRoles.includes(role)}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm({ ...form, allowedRoles: [...form.allowedRoles, role] });
                          } else {
                            setForm({ ...form, allowedRoles: form.allowedRoles.filter(r => r !== role) });
                          }
                        }}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Rate Limit (회/시간)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.rateLimit}
                    onChange={e => setForm({ ...form, rateLimit: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Prompt (자)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.promptMaxLength}
                    onChange={e => setForm({ ...form, promptMaxLength: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">위험 임계치 (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={Math.round(form.riskThreshold * 100)}
                    onChange={e => setForm({ ...form, riskThreshold: parseInt(e.target.value) / 100 })}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.autoBlock}
                    onChange={e => setForm({ ...form, autoBlock: e.target.checked })}
                  />
                  자동 차단
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.resultMasking}
                    onChange={e => setForm({ ...form, resultMasking: e.target.checked })}
                  />
                  결과 마스킹
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  />
                  활성화
                </label>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    checked={form.timeRestrictionEnabled}
                    onChange={e => setForm({ ...form, timeRestrictionEnabled: e.target.checked })}
                  />
                  <strong>시간 제한 적용</strong>
                </label>
                {form.timeRestrictionEnabled && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">시작 시간</label>
                      <input
                        type="time"
                        className="form-input"
                        value={form.timeStart}
                        onChange={e => setForm({ ...form, timeStart: e.target.value })}
                      />
                    </div>
                    <span>~</span>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">종료 시간</label>
                      <input
                        type="time"
                        className="form-input"
                        value={form.timeEnd}
                        onChange={e => setForm({ ...form, timeEnd: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.name || form.allowedFeatures.length === 0 || form.allowedRoles.length === 0}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

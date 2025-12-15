'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string | null;
  allowedRoles: string | null;
  isActive: boolean;
}

interface TemplateForm {
  name: string;
  category: string;
  template: string;
  variables: string[];
  allowedRoles: string[];
  isActive: boolean;
}

const categories = [
  { value: 'COMMAND_EXPLAIN', label: '명령 설명' },
  { value: 'COMMAND_GENERATE', label: '명령 생성' },
  { value: 'RISK_ANALYSIS', label: '위험 분석' },
  { value: 'LOG_SUMMARY', label: '로그 요약' },
];

const roles = ['SUPER', 'ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER', 'USER'];

const defaultForm: TemplateForm = {
  name: '',
  category: 'COMMAND_EXPLAIN',
  template: '',
  variables: [],
  allowedRoles: [],
  isActive: true,
};

export default function AIPromptsPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/ai-prompts');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (template: PromptTemplate) => {
    setForm({
      name: template.name,
      category: template.category,
      template: template.template,
      variables: template.variables ? JSON.parse(template.variables) : [],
      allowedRoles: template.allowedRoles ? JSON.parse(template.allowedRoles) : [],
      isActive: template.isActive,
    });
    setEditingId(template.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/ai-prompts/${editingId}`
        : '/api/admin/ai-prompts';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          variables: form.variables.length > 0 ? form.variables : null,
          allowedRoles: form.allowedRoles.length > 0 ? form.allowedRoles : null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchTemplates();
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
      const res = await fetch(`/api/admin/ai-prompts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      alert('Delete failed');
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const filteredTemplates = filterCategory
    ? templates.filter(t => t.category === filterCategory)
    : templates;

  return (
    <AdminLayout title="프롬프트 템플릿 관리" description="AI 기능별 프롬프트 템플릿 설정">
      {/* 통계 카드 */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 템플릿</div>
          <div className="stat-value">{templates.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 템플릿</div>
          <div className="stat-value">{templates.filter(t => t.isActive).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">명령 설명</div>
          <div className="stat-value">{templates.filter(t => t.category === 'COMMAND_EXPLAIN').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">명령 생성</div>
          <div className="stat-value">{templates.filter(t => t.category === 'COMMAND_GENERATE').length}</div>
        </div>
      </div>

      {/* 템플릿 목록 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontWeight: 600 }}>📝 프롬프트 템플릿</h3>
            <select
              className="form-input form-select"
              style={{ width: '150px' }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">전체 카테고리</option>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            + 템플릿 추가
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            등록된 템플릿이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                style={{
                  padding: '16px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{template.name}</span>
                      <span className="badge badge-info">{getCategoryLabel(template.category)}</span>
                      <span className={`badge ${template.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {template.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--color-text-muted)',
                      background: 'var(--color-bg)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '100px',
                      overflow: 'auto',
                    }}>
                      {template.template.slice(0, 200)}
                      {template.template.length > 200 && '...'}
                    </div>
                    {template.allowedRoles && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        허용 Role: {JSON.parse(template.allowedRoles).join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(template)}>
                      수정
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(template.id)}>
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
              <h3 className="modal-title">{editingId ? '템플릿 수정' : '템플릿 추가'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">이름 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 기본 명령 설명"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">카테고리 *</label>
                  <select
                    className="form-input form-select"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">템플릿 내용 *</label>
                <textarea
                  className="form-input"
                  value={form.template}
                  onChange={e => setForm({ ...form, template: e.target.value })}
                  placeholder="프롬프트 템플릿 내용을 입력하세요. {{변수명}} 형식으로 변수 사용 가능"
                  rows={8}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">변수 (쉼표로 구분)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.variables.join(', ')}
                  onChange={e => setForm({ 
                    ...form, 
                    variables: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                  })}
                  placeholder="예: command, context"
                />
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
                <small style={{ color: 'var(--color-text-muted)' }}>
                  선택하지 않으면 모든 Role 허용
                </small>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                />
                활성화
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.name || !form.template}
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

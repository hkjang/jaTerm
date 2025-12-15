'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AIModel {
  id: string;
  providerId: string;
  name: string;
  displayName: string | null;
  description: string | null;
  maxTokens: number;
  isActive: boolean;
  isDefault: boolean;
  provider: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
  };
}

interface AIProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface ModelForm {
  providerId: string;
  name: string;
  displayName: string;
  description: string;
  maxTokens: number;
  isActive: boolean;
  isDefault: boolean;
}

const defaultForm: ModelForm = {
  providerId: '',
  name: '',
  displayName: '',
  description: '',
  maxTokens: 4096,
  isActive: true,
  isDefault: false,
};

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModelForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filterProvider, setFilterProvider] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [modelsRes, providersRes] = await Promise.all([
        fetch('/api/admin/ai-models'),
        fetch('/api/admin/ai-providers'),
      ]);
      const modelsData = await modelsRes.json();
      const providersData = await providersRes.json();
      setModels(modelsData.models || []);
      setProviders(providersData.providers || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({
      ...defaultForm,
      providerId: providers[0]?.id || '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (model: AIModel) => {
    setForm({
      providerId: model.providerId,
      name: model.name,
      displayName: model.displayName || '',
      description: model.description || '',
      maxTokens: model.maxTokens,
      isActive: model.isActive,
      isDefault: model.isDefault,
    });
    setEditingId(model.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/ai-models/${editingId}`
        : '/api/admin/ai-models';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
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
      const res = await fetch(`/api/admin/ai-models/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleToggleActive = async (model: AIModel) => {
    try {
      await fetch(`/api/admin/ai-models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !model.isActive }),
      });
      fetchData();
    } catch (error) {
      alert('Update failed');
    }
  };

  const handleSetDefault = async (model: AIModel) => {
    try {
      await fetch(`/api/admin/ai-models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      fetchData();
    } catch (error) {
      alert('Update failed');
    }
  };

  const filteredModels = filterProvider
    ? models.filter(m => m.providerId === filterProvider)
    : models;

  return (
    <AdminLayout title="AI 모델 관리" description="AI Provider별 사용 모델 설정 및 관리">
      {/* 통계 카드 */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 모델</div>
          <div className="stat-value">{models.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 모델</div>
          <div className="stat-value">{models.filter(m => m.isActive).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">기본 모델</div>
          <div className="stat-value">{models.filter(m => m.isDefault).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">연결된 Provider</div>
          <div className="stat-value">{new Set(models.map(m => m.providerId)).size}</div>
        </div>
      </div>

      {/* 모델 목록 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontWeight: 600 }}>🧠 AI 모델 목록</h3>
            <select
              className="form-input form-select"
              style={{ width: '200px' }}
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
            >
              <option value="">전체 Provider</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={openCreateModal}
            disabled={providers.length === 0}
          >
            + 모델 추가
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : providers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            먼저 AI Provider를 등록해주세요.
          </div>
        ) : filteredModels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            등록된 모델이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredModels.map(model => (
              <div
                key={model.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: model.isDefault ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{model.displayName || model.name}</span>
                    <span className="badge badge-secondary">{model.name}</span>
                    <span className="badge badge-info">{model.provider.name}</span>
                    {model.isDefault && <span className="badge badge-primary">기본</span>}
                    <span className={`badge ${model.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {model.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {model.description || 'No description'} | Max Tokens: {model.maxTokens}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleActive(model)}
                    title={model.isActive ? '비활성화' : '활성화'}
                  >
                    {model.isActive ? '🔴' : '🟢'}
                  </button>
                  {!model.isDefault && model.isActive && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleSetDefault(model)}
                      title="기본으로 설정"
                    >
                      ⭐
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(model)}>
                    수정
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(model.id)}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? '모델 수정' : '모델 추가'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Provider *</label>
                <select
                  className="form-input form-select"
                  value={form.providerId}
                  onChange={e => setForm({ ...form, providerId: e.target.value })}
                  disabled={!!editingId}
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">모델 이름 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="예: llama3.2:latest"
                />
                <small style={{ color: 'var(--color-text-muted)' }}>
                  Provider에서 사용하는 실제 모델 이름
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">표시 이름</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  placeholder="예: Llama 3.2"
                />
              </div>

              <div className="form-group">
                <label className="form-label">설명</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="모델 설명"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Tokens</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.maxTokens}
                  onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  />
                  활성화
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  기본 모델
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.providerId || !form.name}
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

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AIProvider {
  id: string;
  name: string;
  type: 'OLLAMA' | 'VLLM';
  baseUrl: string;
  hasApiKey: boolean;
  isActive: boolean;
  isDefault: boolean;
  timeout: number;
  maxTokens: number;
  streaming: boolean;
  models: Array<{
    id: string;
    name: string;
    displayName: string;
    isActive: boolean;
    isDefault: boolean;
  }>;
}

interface ProviderForm {
  name: string;
  type: 'OLLAMA' | 'VLLM';
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxTokens: number;
  streaming: boolean;
  isActive: boolean;
  isDefault: boolean;
}

const defaultForm: ProviderForm = {
  name: '',
  type: 'OLLAMA',
  baseUrl: 'http://localhost:11434',
  apiKey: '',
  timeout: 30000,
  maxTokens: 4096,
  streaming: true,
  isActive: false,
  isDefault: false,
};

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProviderForm>(defaultForm);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    availableModels?: string[];
    error?: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/ai-providers');
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingId(null);
    setTestResult(null);
    setShowModal(true);
  };

  const openEditModal = (provider: AIProvider) => {
    setForm({
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      apiKey: '',
      timeout: provider.timeout,
      maxTokens: provider.maxTokens,
      streaming: provider.streaming,
      isActive: provider.isActive,
      isDefault: provider.isDefault,
    });
    setEditingId(provider.id);
    setTestResult(null);
    setShowModal(true);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/admin/ai-providers/${editingId || 'test'}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          baseUrl: form.baseUrl,
          apiKey: form.apiKey || undefined,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/ai-providers/${editingId}`
        : '/api/admin/ai-providers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchProviders();
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
      const res = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProviders();
      }
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleToggleActive = async (provider: AIProvider) => {
    try {
      await fetch(`/api/admin/ai-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !provider.isActive }),
      });
      fetchProviders();
    } catch (error) {
      alert('Update failed');
    }
  };

  const handleSetDefault = async (provider: AIProvider) => {
    try {
      await fetch(`/api/admin/ai-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      fetchProviders();
    } catch (error) {
      alert('Update failed');
    }
  };

  return (
    <AdminLayout title="AI Provider 관리" description="AI 서비스 연결 Provider 설정 및 관리">
      {/* 통계 카드 */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 Provider</div>
          <div className="stat-value">{providers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 Provider</div>
          <div className="stat-value">{providers.filter(p => p.isActive).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ollama</div>
          <div className="stat-value">{providers.filter(p => p.type === 'OLLAMA').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">vLLM</div>
          <div className="stat-value">{providers.filter(p => p.type === 'VLLM').length}</div>
        </div>
      </div>

      {/* Provider 목록 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600 }}>🤖 AI Provider 목록</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            + Provider 추가
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : providers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            등록된 Provider가 없습니다. Provider를 추가해주세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {providers.map(provider => (
              <div
                key={provider.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: provider.isDefault ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{provider.name}</span>
                    <span className={`badge ${provider.type === 'OLLAMA' ? 'badge-info' : 'badge-warning'}`}>
                      {provider.type}
                    </span>
                    {provider.isDefault && <span className="badge badge-primary">기본</span>}
                    <span className={`badge ${provider.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {provider.isActive ? '활성' : '비활성'}
                    </span>
                    {provider.hasApiKey && <span className="badge badge-secondary">🔑 Key</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {provider.baseUrl} | Timeout: {provider.timeout}ms | Max Tokens: {provider.maxTokens}
                  </div>
                  {provider.models.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      모델: {provider.models.map(m => m.displayName || m.name).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleActive(provider)}
                    title={provider.isActive ? '비활성화' : '활성화'}
                  >
                    {provider.isActive ? '🔴' : '🟢'}
                  </button>
                  {!provider.isDefault && provider.isActive && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleSetDefault(provider)}
                      title="기본으로 설정"
                    >
                      ⭐
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(provider)}>
                    수정
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(provider.id)}>
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
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Provider 수정' : 'Provider 추가'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">이름 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="예: Local Ollama"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Provider Type *</label>
                <select
                  className="form-input form-select"
                  value={form.type}
                  onChange={e => {
                    const type = e.target.value as 'OLLAMA' | 'VLLM';
                    setForm({
                      ...form,
                      type,
                      baseUrl: type === 'OLLAMA' ? 'http://localhost:11434' : 'http://localhost:8000',
                    });
                  }}
                >
                  <option value="OLLAMA">Ollama</option>
                  <option value="VLLM">vLLM</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base URL *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.baseUrl}
                  onChange={e => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>

              <div className="form-group">
                <label className="form-label">API Key (선택)</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.apiKey}
                  onChange={e => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={editingId ? '변경하려면 새 키 입력' : '필요시 입력'}
                />
                <small style={{ color: 'var(--color-text-muted)' }}>
                  API Key는 암호화되어 저장됩니다.
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Timeout (ms)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.timeout}
                    onChange={e => setForm({ ...form, timeout: parseInt(e.target.value) })}
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
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.streaming}
                    onChange={e => setForm({ ...form, streaming: e.target.checked })}
                  />
                  Streaming 활성화
                </label>
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
                  기본 Provider
                </label>
              </div>

              {/* 연결 테스트 */}
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500 }}>연결 테스트</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleTest}
                    disabled={testing || !form.baseUrl}
                  >
                    {testing ? '테스트 중...' : '테스트'}
                  </button>
                </div>
                {testResult && (
                  <div style={{ fontSize: '0.85rem' }}>
                    {testResult.success ? (
                      <>
                        <div style={{ color: 'var(--color-success)' }}>
                          ✅ 연결 성공 ({testResult.latencyMs}ms)
                        </div>
                        {testResult.availableModels && testResult.availableModels.length > 0 && (
                          <div style={{ marginTop: '4px', color: 'var(--color-text-muted)' }}>
                            사용 가능 모델: {testResult.availableModels.slice(0, 5).join(', ')}
                            {testResult.availableModels.length > 5 && ` 외 ${testResult.availableModels.length - 5}개`}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: 'var(--color-danger)' }}>
                        ❌ 연결 실패: {testResult.error}
                      </div>
                    )}
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
                disabled={saving || !form.name || !form.baseUrl}
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

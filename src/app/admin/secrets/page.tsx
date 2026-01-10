'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Secret {
  id: string;
  key: string;
  description: string;
  scope: 'GLOBAL' | 'SERVER' | 'USER';
  scopeValue?: string;
  lastUpdated: string;
  updatedBy: string;
  isEncrypted: boolean;
  usageCount: number;
}

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('all');

  // Form state
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newScope, setNewScope] = useState<'GLOBAL' | 'SERVER' | 'USER'>('GLOBAL');

  useEffect(() => {
    setLoading(true);
    const mockSecrets: Secret[] = [
      { id: '1', key: 'DATABASE_URL', description: '메인 데이터베이스 연결 문자열', scope: 'GLOBAL', lastUpdated: new Date(Date.now() - 30 * 86400000).toISOString(), updatedBy: '관리자', isEncrypted: true, usageCount: 45 },
      { id: '2', key: 'AWS_ACCESS_KEY', description: 'AWS S3 접근 키', scope: 'GLOBAL', lastUpdated: new Date(Date.now() - 60 * 86400000).toISOString(), updatedBy: '관리자', isEncrypted: true, usageCount: 120 },
      { id: '3', key: 'AWS_SECRET_KEY', description: 'AWS S3 시크릿 키', scope: 'GLOBAL', lastUpdated: new Date(Date.now() - 60 * 86400000).toISOString(), updatedBy: '관리자', isEncrypted: true, usageCount: 120 },
      { id: '4', key: 'SLACK_WEBHOOK', description: 'Slack 알림 웹훅 URL', scope: 'GLOBAL', lastUpdated: new Date(Date.now() - 10 * 86400000).toISOString(), updatedBy: '운영팀', isEncrypted: true, usageCount: 890 },
      { id: '5', key: 'SSH_PRIVATE_KEY', description: 'prod-web-01 접속용 개인키', scope: 'SERVER', scopeValue: 'prod-web-01', lastUpdated: new Date(Date.now() - 5 * 86400000).toISOString(), updatedBy: '관리자', isEncrypted: true, usageCount: 230 },
      { id: '6', key: 'REDIS_PASSWORD', description: 'Redis 캐시 서버 비밀번호', scope: 'GLOBAL', lastUpdated: new Date(Date.now() - 90 * 86400000).toISOString(), updatedBy: '관리자', isEncrypted: true, usageCount: 67 },
      { id: '7', key: 'API_TOKEN', description: '개인 API 토큰', scope: 'USER', scopeValue: 'kim@example.com', lastUpdated: new Date(Date.now() - 2 * 86400000).toISOString(), updatedBy: 'kim@example.com', isEncrypted: true, usageCount: 15 },
    ];
    setSecrets(mockSecrets);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAdd = () => {
    if (!newKey || !newValue) return;
    setMessage({ type: 'success', text: '시크릿이 추가되었습니다.' });
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (secret: Secret) => {
    setMessage({ type: 'success', text: '시크릿이 업데이트되었습니다.' });
  };

  const handleDelete = (secret: Secret) => {
    if (!confirm(`'${secret.key}' 시크릿을 삭제하시겠습니까?`)) return;
    setSecrets(secrets.filter(s => s.id !== secret.id));
    setMessage({ type: 'success', text: '시크릿이 삭제되었습니다.' });
  };

  const resetForm = () => {
    setNewKey('');
    setNewValue('');
    setNewDescription('');
    setNewScope('GLOBAL');
  };

  const getScopeConfig = (scope: string) => {
    switch (scope) {
      case 'GLOBAL': return { color: '#8b5cf6', bg: '#8b5cf620', label: '전역', icon: '🌐' };
      case 'SERVER': return { color: '#3b82f6', bg: '#3b82f620', label: '서버', icon: '🖥️' };
      case 'USER': return { color: '#10b981', bg: '#10b98120', label: '사용자', icon: '👤' };
      default: return { color: '#6b7280', bg: '#6b728020', label: scope, icon: '📦' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '오늘';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  const filteredSecrets = secrets.filter(secret => {
    const matchesScope = selectedScope === 'all' || secret.scope === selectedScope;
    const matchesSearch = searchQuery === '' || 
      secret.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      secret.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesScope && matchesSearch;
  });

  const globalCount = secrets.filter(s => s.scope === 'GLOBAL').length;
  const serverCount = secrets.filter(s => s.scope === 'SERVER').length;
  const userCount = secrets.filter(s => s.scope === 'USER').length;

  return (
    <AdminLayout 
      title="시크릿 관리" 
      description="환경 변수 및 비밀 키 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 시크릿 추가
        </button>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 시크릿</div>
          <div className="stat-value">{secrets.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🌐 전역</div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>{globalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🖥️ 서버</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{serverCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">👤 사용자</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{userCount}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 시크릿 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'GLOBAL', 'SERVER', 'USER'].map(scope => (
            <button 
              key={scope}
              className={`btn btn-sm ${selectedScope === scope ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedScope(scope)}
            >
              {scope === 'all' ? '전체' : getScopeConfig(scope).label}
            </button>
          ))}
        </div>
      </div>

      {/* Secrets List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>키</th>
                  <th>설명</th>
                  <th>범위</th>
                  <th>사용 횟수</th>
                  <th>마지막 수정</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredSecrets.map(secret => {
                  const scope = getScopeConfig(secret.scope);
                  return (
                    <tr key={secret.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#f59e0b' }}>🔐</span>
                          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>{secret.key}</code>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{secret.description}</td>
                      <td>
                        <span style={{ padding: '2px 8px', background: scope.bg, color: scope.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {scope.icon} {scope.label}
                        </span>
                        {secret.scopeValue && (
                          <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            ({secret.scopeValue})
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{secret.usageCount}회</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {getTimeAgo(secret.lastUpdated)}
                        <div style={{ fontSize: '0.75rem' }}>by {secret.updatedBy}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(secret)}>✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(secret)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔐 시크릿 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">키 이름</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: DATABASE_URL"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">값</label>
                <textarea 
                  className="form-input" 
                  placeholder="시크릿 값 입력"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  rows={3}
                  style={{ fontFamily: 'var(--font-mono)', resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="시크릿에 대한 설명"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">범위</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['GLOBAL', 'SERVER', 'USER'] as const).map(scope => {
                    const config = getScopeConfig(scope);
                    return (
                      <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: newScope === scope ? config.bg : 'var(--color-surface)', borderRadius: '8px', border: newScope === scope ? `2px solid ${config.color}` : '2px solid transparent', cursor: 'pointer', flex: 1 }}>
                        <input type="radio" name="scope" checked={newScope === scope} onChange={() => setNewScope(scope)} style={{ display: 'none' }} />
                        <span>{config.icon}</span>
                        <span style={{ fontWeight: 500 }}>{config.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newKey || !newValue}>추가</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  scope: 'GLOBAL' | 'SERVER' | 'GROUP';
  scopeTarget?: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  usedIn: number;
}

export default function EnvironmentVariablesPage() {
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newScope, setNewScope] = useState<EnvVariable['scope']>('GLOBAL');
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    setLoading(true);
    const mockVariables: EnvVariable[] = [
      { id: '1', key: 'DB_HOST', value: 'db-master-01.internal', isSecret: false, scope: 'GLOBAL', description: '프로덕션 데이터베이스 호스트', createdBy: '관리자', createdAt: new Date(Date.now() - 180 * 86400000).toISOString(), lastModified: new Date(Date.now() - 30 * 86400000).toISOString(), usedIn: 15 },
      { id: '2', key: 'DB_PASSWORD', value: 'super_secret_password_123', isSecret: true, scope: 'GLOBAL', description: '데이터베이스 비밀번호', createdBy: '보안팀', createdAt: new Date(Date.now() - 180 * 86400000).toISOString(), lastModified: new Date(Date.now() - 7 * 86400000).toISOString(), usedIn: 15 },
      { id: '3', key: 'API_KEY', value: 'sk_live_abcd1234efgh5678', isSecret: true, scope: 'GLOBAL', description: '외부 API 키', createdBy: '개발팀', createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), lastModified: new Date(Date.now() - 14 * 86400000).toISOString(), usedIn: 8 },
      { id: '4', key: 'LOG_LEVEL', value: 'INFO', isSecret: false, scope: 'GLOBAL', description: '로깅 레벨', createdBy: '관리자', createdAt: new Date(Date.now() - 365 * 86400000).toISOString(), lastModified: new Date(Date.now() - 60 * 86400000).toISOString(), usedIn: 25 },
      { id: '5', key: 'REDIS_URL', value: 'redis://redis-01.internal:6379', isSecret: false, scope: 'GROUP', scopeTarget: 'Production', description: 'Redis 캐시 URL', createdBy: '관리자', createdAt: new Date(Date.now() - 120 * 86400000).toISOString(), lastModified: new Date(Date.now() - 45 * 86400000).toISOString(), usedIn: 10 },
      { id: '6', key: 'DEBUG_MODE', value: 'true', isSecret: false, scope: 'SERVER', scopeTarget: 'dev-web-01', description: '디버그 모드 활성화', createdBy: '개발팀', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), lastModified: new Date(Date.now() - 2 * 86400000).toISOString(), usedIn: 1 },
      { id: '7', key: 'SLACK_WEBHOOK', value: 'https://hooks.slack.com/services/xxx', isSecret: true, scope: 'GLOBAL', description: 'Slack 웹훅 URL', createdBy: '운영팀', createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), lastModified: new Date(Date.now() - 20 * 86400000).toISOString(), usedIn: 5 },
      { id: '8', key: 'JAVA_HOME', value: '/usr/lib/jvm/java-17', isSecret: false, scope: 'GROUP', scopeTarget: 'Java Apps', description: 'Java 홈 디렉토리', createdBy: '개발팀', createdAt: new Date(Date.now() - 200 * 86400000).toISOString(), lastModified: new Date(Date.now() - 100 * 86400000).toISOString(), usedIn: 6 },
    ];
    setVariables(mockVariables);
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
    setMessage({ type: 'success', text: '환경 변수가 추가되었습니다.' });
    setShowAddModal(false);
    setNewKey('');
    setNewValue('');
    setNewScope('GLOBAL');
    setNewIsSecret(false);
    setNewDescription('');
  };

  const handleDelete = (variable: EnvVariable) => {
    if (variable.usedIn > 0) {
      alert(`이 변수는 ${variable.usedIn}개의 서버에서 사용 중입니다.`);
      return;
    }
    if (!confirm(`'${variable.key}' 변수를 삭제하시겠습니까?`)) return;
    setVariables(variables.filter(v => v.id !== variable.id));
    setMessage({ type: 'success', text: '변수가 삭제되었습니다.' });
  };

  const getScopeConfig = (scope: string) => {
    switch (scope) {
      case 'GLOBAL': return { color: '#3b82f6', icon: '🌍', label: '전역' };
      case 'SERVER': return { color: '#10b981', icon: '🖥️', label: '서버' };
      case 'GROUP': return { color: '#8b5cf6', icon: '📦', label: '그룹' };
      default: return { color: '#6b7280', icon: '📋', label: scope };
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

  const filteredVariables = variables.filter(v => {
    if (selectedScope !== 'all' && v.scope !== selectedScope) return false;
    if (searchQuery && !v.key.toLowerCase().includes(searchQuery.toLowerCase()) && !v.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const secretCount = variables.filter(v => v.isSecret).length;
  const globalCount = variables.filter(v => v.scope === 'GLOBAL').length;

  return (
    <AdminLayout 
      title="환경 변수" 
      description="전역 및 서버별 환경 변수 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 변수 추가
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
          <div className="stat-label">총 변수</div>
          <div className="stat-value">{variables.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🌍 전역</div>
          <div className="stat-value">{globalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔒 시크릿</div>
          <div className="stat-value">{secretCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">사용 중</div>
          <div className="stat-value">{variables.reduce((sum, v) => sum + v.usedIn, 0)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 키 또는 설명 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'GLOBAL', 'SERVER', 'GROUP'].map(scope => {
            const config = scope !== 'all' ? getScopeConfig(scope) : null;
            return (
              <button
                key={scope}
                className={`btn btn-sm ${selectedScope === scope ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedScope(scope)}
              >
                {config && <span style={{ marginRight: '4px' }}>{config.icon}</span>}
                {scope === 'all' ? '전체' : config?.label}
              </button>
            );
          })}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', cursor: 'pointer' }}>
          <input type="checkbox" checked={showSecrets} onChange={(e) => setShowSecrets(e.target.checked)} />
          <span style={{ fontSize: '0.85rem' }}>시크릿 표시</span>
        </label>
      </div>

      {/* Variables Table */}
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
                  <th>값</th>
                  <th>범위</th>
                  <th>설명</th>
                  <th>사용</th>
                  <th>수정일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariables.map(variable => {
                  const scopeConfig = getScopeConfig(variable.scope);
                  return (
                    <tr key={variable.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {variable.isSecret && <span title="시크릿">🔒</span>}
                          <code style={{ fontWeight: 600 }}>{variable.key}</code>
                        </div>
                      </td>
                      <td>
                        {variable.isSecret && !showSecrets ? (
                          <span style={{ color: 'var(--color-text-muted)' }}>••••••••</span>
                        ) : (
                          <code style={{ fontSize: '0.8rem', maxWidth: '200px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {variable.value}
                          </code>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ padding: '2px 6px', background: scopeConfig.color + '20', color: scopeConfig.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {scopeConfig.icon} {scopeConfig.label}
                          </span>
                          {variable.scopeTarget && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              ({variable.scopeTarget})
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '150px' }}>
                        {variable.description || '-'}
                      </td>
                      <td>{variable.usedIn}개</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{getTimeAgo(variable.lastModified)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm">✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(variable)}>🗑️</button>
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
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ 환경 변수 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">키</label>
                <input type="text" className="form-input" placeholder="예: DATABASE_URL" value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">값</label>
                <input type={newIsSecret ? 'password' : 'text'} className="form-input" placeholder="값 입력" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">범위</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['GLOBAL', 'SERVER', 'GROUP'] as const).map(scope => {
                    const config = getScopeConfig(scope);
                    return (
                      <label key={scope} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: newScope === scope ? config.color + '20' : 'var(--color-surface)', borderRadius: '6px', border: newScope === scope ? `2px solid ${config.color}` : '2px solid transparent', cursor: 'pointer' }}>
                        <input type="radio" name="scope" checked={newScope === scope} onChange={() => setNewScope(scope)} style={{ display: 'none' }} />
                        <span>{config.icon}</span>
                        <span style={{ fontSize: '0.85rem' }}>{config.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">설명 (선택)</label>
                <input type="text" className="form-input" placeholder="변수에 대한 설명" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={newIsSecret} onChange={(e) => setNewIsSecret(e.target.checked)} />
                <span>🔒 시크릿으로 저장 (암호화됨)</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newKey || !newValue}>추가</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

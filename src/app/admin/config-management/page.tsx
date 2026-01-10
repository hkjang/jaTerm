'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SECRET';
  category: string;
  description: string;
  isEncrypted: boolean;
  isReadOnly: boolean;
  lastModified: string;
  modifiedBy: { id: string; name: string };
  version: number;
  history: { version: number; value: string; modifiedAt: string; modifiedBy: string }[];
}

interface ConfigSnapshot {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  size: number;
  createdAt: string;
  createdBy: { id: string; name: string };
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
}

export default function ConfigManagementPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [snapshots, setSnapshots] = useState<ConfigSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'configs' | 'snapshots'>('configs');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  useEffect(() => {
    const categories = ['general', 'security', 'database', 'cache', 'email', 'ssh', 'logging', 'feature'];
    const mockConfigs: ConfigItem[] = [
      { id: '1', key: 'app.name', value: 'jaTerm', type: 'STRING', category: 'general', description: '애플리케이션 이름', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 3, history: [] },
      { id: '2', key: 'app.max_sessions', value: '100', type: 'NUMBER', category: 'general', description: '최대 동시 세션 수', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 5, history: [] },
      { id: '3', key: 'security.jwt_secret', value: '********', type: 'SECRET', category: 'security', description: 'JWT 서명 시크릿', isEncrypted: true, isReadOnly: false, lastModified: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 2, history: [] },
      { id: '4', key: 'security.session_timeout', value: '3600', type: 'NUMBER', category: 'security', description: '세션 타임아웃 (초)', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 14 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u2', name: '박개발' }, version: 4, history: [] },
      { id: '5', key: 'security.mfa_required', value: 'true', type: 'BOOLEAN', category: 'security', description: 'MFA 필수 여부', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 2, history: [] },
      { id: '6', key: 'database.connection_pool', value: '{"min":5,"max":20,"idle":10000}', type: 'JSON', category: 'database', description: 'DB 연결 풀 설정', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 3, history: [] },
      { id: '7', key: 'database.password', value: '********', type: 'SECRET', category: 'database', description: 'DB 비밀번호', isEncrypted: true, isReadOnly: false, lastModified: new Date(Date.now() - 120 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 1, history: [] },
      { id: '8', key: 'cache.redis_url', value: 'redis://localhost:6379', type: 'STRING', category: 'cache', description: 'Redis 서버 URL', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 1, history: [] },
      { id: '9', key: 'ssh.default_port', value: '22', type: 'NUMBER', category: 'ssh', description: 'SSH 기본 포트', isEncrypted: false, isReadOnly: true, lastModified: new Date(Date.now() - 365 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 1, history: [] },
      { id: '10', key: 'ssh.max_connections', value: '50', type: 'NUMBER', category: 'ssh', description: 'SSH 최대 연결 수', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u2', name: '박개발' }, version: 2, history: [] },
      { id: '11', key: 'email.smtp_host', value: 'smtp.example.com', type: 'STRING', category: 'email', description: 'SMTP 서버 주소', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 200 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 1, history: [] },
      { id: '12', key: 'logging.level', value: 'INFO', type: 'STRING', category: 'logging', description: '로그 레벨', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u3', name: '이백엔드' }, version: 8, history: [] },
      { id: '13', key: 'feature.dark_mode', value: 'true', type: 'BOOLEAN', category: 'feature', description: '다크 모드 활성화', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 1 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u2', name: '박개발' }, version: 1, history: [] },
      { id: '14', key: 'feature.session_recording', value: 'true', type: 'BOOLEAN', category: 'feature', description: '세션 녹화 활성화', isEncrypted: false, isReadOnly: false, lastModified: new Date(Date.now() - 5 * 24 * 3600000).toISOString(), modifiedBy: { id: 'u1', name: '김관리' }, version: 2, history: [] },
    ];
    const mockSnapshots: ConfigSnapshot[] = [
      { id: '1', name: 'prod-2026-01-10', description: '프로덕션 배포 전 스냅샷', itemCount: 14, size: 2450, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), createdBy: { id: 'u1', name: '김관리' }, environment: 'PRODUCTION' },
      { id: '2', name: 'staging-2026-01-08', description: '스테이징 테스트용', itemCount: 14, size: 2380, createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), createdBy: { id: 'u2', name: '박개발' }, environment: 'STAGING' },
      { id: '3', name: 'backup-monthly', description: '월간 백업', itemCount: 12, size: 2100, createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), createdBy: { id: 'u1', name: '김관리' }, environment: 'PRODUCTION' },
    ];
    setConfigs(mockConfigs);
    setSnapshots(mockSnapshots);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'STRING': return { color: '#3b82f6', label: '문자열', icon: '📝' };
      case 'NUMBER': return { color: '#10b981', label: '숫자', icon: '🔢' };
      case 'BOOLEAN': return { color: '#8b5cf6', label: '불린', icon: '✓' };
      case 'JSON': return { color: '#f59e0b', label: 'JSON', icon: '{}' };
      case 'SECRET': return { color: '#ef4444', label: '시크릿', icon: '🔒' };
      default: return { color: '#6b7280', label: type, icon: '?' };
    }
  };

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'general': return { color: '#3b82f6', label: '일반', icon: '⚙️' };
      case 'security': return { color: '#ef4444', label: '보안', icon: '🔐' };
      case 'database': return { color: '#10b981', label: 'DB', icon: '🗄️' };
      case 'cache': return { color: '#f59e0b', label: '캐시', icon: '⚡' };
      case 'email': return { color: '#8b5cf6', label: '이메일', icon: '📧' };
      case 'ssh': return { color: '#06b6d4', label: 'SSH', icon: '🔑' };
      case 'logging': return { color: '#6b7280', label: '로깅', icon: '📋' };
      case 'feature': return { color: '#ec4899', label: '기능', icon: '🎛️' };
      default: return { color: '#6b7280', label: category, icon: '📦' };
    }
  };

  const getEnvConfig = (env: string) => {
    switch (env) {
      case 'PRODUCTION': return { color: '#ef4444', label: '프로덕션' };
      case 'STAGING': return { color: '#f59e0b', label: '스테이징' };
      case 'DEVELOPMENT': return { color: '#3b82f6', label: '개발' };
      default: return { color: '#6b7280', label: env };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return `${Math.floor(diff / 86400000)}일 전`;
  };

  const filteredConfigs = configs.filter(c => {
    if (searchQuery && !c.key.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.includes(searchQuery)) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    return true;
  });

  const categories = [...new Set(configs.map(c => c.category))];
  const encryptedCount = configs.filter(c => c.isEncrypted).length;

  return (
    <AdminLayout 
      title="설정 관리" 
      description="시스템 설정 및 환경 변수 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 설정</div>
          <div className="stat-value">{configs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">카테고리</div>
          <div className="stat-value">{categories.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔒 암호화</div>
          <div className="stat-value">{encryptedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📸 스냅샷</div>
          <div className="stat-value">{snapshots.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">최근 변경</div>
          <div className="stat-value" style={{ fontSize: '0.9rem' }}>{getTimeAgo(configs.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())[0]?.lastModified || '')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
        <button className={`btn btn-ghost ${activeTab === 'configs' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('configs')} style={{ borderRadius: '8px 8px 0 0' }}>⚙️ 설정</button>
        <button className={`btn btn-ghost ${activeTab === 'snapshots' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('snapshots')} style={{ borderRadius: '8px 8px 0 0' }}>📸 스냅샷</button>
      </div>

      {/* Configs Tab */}
      {activeTab === 'configs' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input type="text" className="form-input" placeholder="🔍 키 또는 설명 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '250px' }} />
            <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ maxWidth: '150px' }}>
              <option value="all">전체 카테고리</option>
              {categories.map(cat => <option key={cat} value={cat}>{getCategoryConfig(cat).icon} {getCategoryConfig(cat).label}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <button className="btn btn-secondary" onClick={() => setShowSnapshotModal(true)}>📸 스냅샷 생성</button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ 설정 추가</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>키</th>
                      <th>값</th>
                      <th>카테고리</th>
                      <th>유형</th>
                      <th>수정일</th>
                      <th>버전</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConfigs.map(cfg => {
                      const typeConfig = getTypeConfig(cfg.type);
                      const catConfig = getCategoryConfig(cfg.category);
                      return (
                        <tr key={cfg.id} style={{ cursor: 'pointer', opacity: cfg.isReadOnly ? 0.7 : 1 }} onClick={() => setSelectedConfig(cfg)}>
                          <td>
                            <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{cfg.key}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cfg.description}</div>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {cfg.isEncrypted ? '••••••••' : cfg.value.length > 30 ? cfg.value.slice(0, 30) + '...' : cfg.value}
                            </code>
                          </td>
                          <td><span style={{ padding: '3px 8px', background: `${catConfig.color}20`, color: catConfig.color, borderRadius: '4px', fontSize: '0.8rem' }}>{catConfig.icon} {catConfig.label}</span></td>
                          <td><span style={{ padding: '3px 8px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.8rem' }}>{typeConfig.label}</span></td>
                          <td>
                            <div>{getTimeAgo(cfg.lastModified)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>by {cfg.modifiedBy.name}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem' }}>v{cfg.version}</span>
                            {cfg.isReadOnly && <span style={{ marginLeft: '6px', color: '#f59e0b' }}>🔒</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Snapshots Tab */}
      {activeTab === 'snapshots' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn btn-primary" onClick={() => setShowSnapshotModal(true)}>+ 스냅샷 생성</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {snapshots.map(snap => {
                const envConfig = getEnvConfig(snap.environment);
                return (
                  <div key={snap.id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>📸</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{snap.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{snap.description}</div>
                      </div>
                      <span style={{ padding: '4px 10px', background: `${envConfig.color}20`, color: envConfig.color, borderRadius: '6px', fontSize: '0.8rem' }}>{envConfig.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                      <span>📋 {snap.itemCount} 항목</span>
                      <span>💾 {(snap.size / 1024).toFixed(1)} KB</span>
                      <span>🕐 {getTimeAgo(snap.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-secondary">🔄 복원</button>
                      <button className="btn btn-sm btn-ghost">⬇️ 다운로드</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Config Detail Modal */}
      {selectedConfig && (
        <div className="modal-overlay active" onClick={() => setSelectedConfig(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedConfig.type).icon} {selectedConfig.key}</h3>
              <button className="modal-close" onClick={() => setSelectedConfig(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getCategoryConfig(selectedConfig.category).color}20`, color: getCategoryConfig(selectedConfig.category).color, borderRadius: '6px' }}>{getCategoryConfig(selectedConfig.category).icon} {getCategoryConfig(selectedConfig.category).label}</span>
                <span style={{ padding: '4px 10px', background: `${getTypeConfig(selectedConfig.type).color}20`, color: getTypeConfig(selectedConfig.type).color, borderRadius: '6px' }}>{getTypeConfig(selectedConfig.type).label}</span>
                {selectedConfig.isReadOnly && <span style={{ padding: '4px 10px', background: '#f59e0b20', color: '#f59e0b', borderRadius: '6px' }}>🔒 읽기 전용</span>}
              </div>
              
              <div className="form-group">
                <label className="form-label">설명</label>
                <div style={{ padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>{selectedConfig.description}</div>
              </div>
              
              <div className="form-group">
                <label className="form-label">값</label>
                {selectedConfig.isEncrypted ? (
                  <div style={{ padding: '10px', background: '#1e1e1e', color: '#d4d4d4', borderRadius: '6px', fontFamily: 'monospace' }}>••••••••••••••••</div>
                ) : selectedConfig.isReadOnly ? (
                  <div style={{ padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedConfig.value}</div>
                ) : (
                  <textarea className="form-input" rows={selectedConfig.type === 'JSON' ? 4 : 2} defaultValue={selectedConfig.value} style={{ fontFamily: 'monospace' }} />
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>버전:</span> v{selectedConfig.version}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>수정자:</span> {selectedConfig.modifiedBy.name}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>수정일:</span> {getTimeAgo(selectedConfig.lastModified)}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>암호화:</span> {selectedConfig.isEncrypted ? '예' : '아니오'}</div>
              </div>
            </div>
            <div className="modal-footer">
              {!selectedConfig.isReadOnly && <button className="btn btn-primary">💾 저장</button>}
              <button className="btn btn-ghost" onClick={() => setSelectedConfig(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Config Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">+ 설정 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">키</label>
                <input type="text" className="form-input" placeholder="app.new_setting" style={{ fontFamily: 'monospace' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">카테고리</label>
                  <select className="form-input">
                    {categories.map(cat => <option key={cat} value={cat}>{getCategoryConfig(cat).label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">유형</label>
                  <select className="form-input">
                    <option value="STRING">문자열</option>
                    <option value="NUMBER">숫자</option>
                    <option value="BOOLEAN">불린</option>
                    <option value="JSON">JSON</option>
                    <option value="SECRET">시크릿</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">값</label>
                <textarea className="form-input" rows={2} style={{ fontFamily: 'monospace' }} />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <input type="text" className="form-input" placeholder="설정에 대한 설명" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" />
                <span>🔒 암호화하여 저장</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary">추가</button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Modal */}
      {showSnapshotModal && (
        <div className="modal-overlay active" onClick={() => setShowSnapshotModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📸 스냅샷 생성</h3>
              <button className="modal-close" onClick={() => setShowSnapshotModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">스냅샷 이름</label>
                <input type="text" className="form-input" placeholder="prod-2026-01-10" />
              </div>
              <div className="form-group">
                <label className="form-label">환경</label>
                <select className="form-input">
                  <option value="PRODUCTION">프로덕션</option>
                  <option value="STAGING">스테이징</option>
                  <option value="DEVELOPMENT">개발</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <textarea className="form-input" rows={2} placeholder="스냅샷 생성 사유" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowSnapshotModal(false)}>취소</button>
              <button className="btn btn-primary">📸 생성</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

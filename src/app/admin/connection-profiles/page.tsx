'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ConnectionProfile {
  id: string;
  name: string;
  description?: string;
  server: { name: string; ip: string; port: number };
  authMethod: 'PASSWORD' | 'SSH_KEY' | 'CERTIFICATE';
  username: string;
  credentialId?: string;
  autoConnect: boolean;
  jumpHost?: { name: string; ip: string };
  environment: string[];
  tags: string[];
  usageCount: number;
  lastUsed?: string;
  createdBy: string;
  createdAt: string;
  isShared: boolean;
}

export default function ConnectionProfilesPage() {
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ConnectionProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newServer, setNewServer] = useState('');
  const [newPort, setNewPort] = useState('22');
  const [newUsername, setNewUsername] = useState('');
  const [newAuthMethod, setNewAuthMethod] = useState<ConnectionProfile['authMethod']>('SSH_KEY');

  useEffect(() => {
    setLoading(true);
    const mockProfiles: ConnectionProfile[] = [
      { id: '1', name: 'Prod Web Server', description: '프로덕션 웹 서버 접속', server: { name: 'prod-web-01', ip: '10.0.1.10', port: 22 }, authMethod: 'SSH_KEY', username: 'deploy', autoConnect: true, environment: ['PRODUCTION'], tags: ['web', 'production'], usageCount: 156, lastUsed: new Date(Date.now() - 2 * 3600000).toISOString(), createdBy: '김개발', createdAt: new Date(Date.now() - 180 * 86400000).toISOString(), isShared: true },
      { id: '2', name: 'DB Master SSH', description: 'DB 마스터 서버 직접 접속', server: { name: 'db-master-01', ip: '10.0.3.10', port: 22 }, authMethod: 'SSH_KEY', username: 'dba', autoConnect: false, jumpHost: { name: 'bastion-01', ip: '10.0.0.5' }, environment: ['PRODUCTION'], tags: ['database', 'production'], usageCount: 89, lastUsed: new Date(Date.now() - 8 * 3600000).toISOString(), createdBy: '박DBA', createdAt: new Date(Date.now() - 120 * 86400000).toISOString(), isShared: true },
      { id: '3', name: 'Staging App', description: '스테이징 앱 서버', server: { name: 'stage-app-01', ip: '10.0.2.10', port: 22 }, authMethod: 'PASSWORD', username: 'developer', autoConnect: true, environment: ['STAGING'], tags: ['app', 'staging'], usageCount: 234, lastUsed: new Date(Date.now() - 30 * 60000).toISOString(), createdBy: '이테스터', createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), isShared: false },
      { id: '4', name: 'Redis Cache', server: { name: 'redis-01', ip: '10.0.4.10', port: 22 }, authMethod: 'SSH_KEY', username: 'redis', autoConnect: false, environment: ['PRODUCTION'], tags: ['cache', 'production'], usageCount: 45, lastUsed: new Date(Date.now() - 2 * 86400000).toISOString(), createdBy: '관리자', createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), isShared: true },
      { id: '5', name: 'Dev Local VM', description: '개발용 로컬 VM', server: { name: 'dev-vm', ip: '192.168.1.100', port: 2222 }, authMethod: 'PASSWORD', username: 'dev', autoConnect: true, environment: ['DEV'], tags: ['development', 'local'], usageCount: 567, lastUsed: new Date(Date.now() - 15 * 60000).toISOString(), createdBy: '김개발', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), isShared: false },
      { id: '6', name: 'API Gateway', server: { name: 'api-gw-01', ip: '10.0.1.50', port: 22 }, authMethod: 'CERTIFICATE', username: 'admin', autoConnect: false, environment: ['PRODUCTION'], tags: ['api', 'production'], usageCount: 78, lastUsed: new Date(Date.now() - 12 * 3600000).toISOString(), createdBy: '운영팀', createdAt: new Date(Date.now() - 45 * 86400000).toISOString(), isShared: true },
    ];
    setProfiles(mockProfiles);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleConnect = (profile: ConnectionProfile) => {
    setMessage({ type: 'success', text: `'${profile.server.name}'에 연결 중...` });
  };

  const handleAdd = () => {
    if (!newName || !newServer || !newUsername) return;
    setMessage({ type: 'success', text: '연결 프로필이 생성되었습니다.' });
    setShowAddModal(false);
    setNewName('');
    setNewServer('');
    setNewPort('22');
    setNewUsername('');
    setNewAuthMethod('SSH_KEY');
  };

  const handleDelete = (profile: ConnectionProfile) => {
    if (!confirm(`'${profile.name}' 프로필을 삭제하시겠습니까?`)) return;
    setProfiles(profiles.filter(p => p.id !== profile.id));
    setMessage({ type: 'success', text: '프로필이 삭제되었습니다.' });
  };

  const getAuthIcon = (method: string) => {
    switch (method) {
      case 'SSH_KEY': return '🔑';
      case 'PASSWORD': return '🔒';
      case 'CERTIFICATE': return '📜';
      default: return '🔐';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const allTags = [...new Set(profiles.flatMap(p => p.tags))];
  const filteredProfiles = profiles.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.server.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTag !== 'all' && !p.tags.includes(filterTag)) return false;
    return true;
  });

  const sharedCount = profiles.filter(p => p.isShared).length;
  const autoConnectCount = profiles.filter(p => p.autoConnect).length;

  return (
    <AdminLayout 
      title="연결 프로필" 
      description="저장된 SSH 연결 설정 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 프로필 추가
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
          <div className="stat-label">총 프로필</div>
          <div className="stat-value">{profiles.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔗 공유됨</div>
          <div className="stat-value">{sharedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚡ 자동연결</div>
          <div className="stat-value">{autoConnectCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 사용</div>
          <div className="stat-value">{profiles.reduce((sum, p) => sum + p.usageCount, 0)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 프로필 또는 서버 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${filterTag === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterTag('all')}>전체</button>
          {allTags.map(tag => (
            <button key={tag} className={`btn btn-sm ${filterTag === tag ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterTag(tag)}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredProfiles.map(profile => (
            <div key={profile.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{profile.name}</span>
                    {profile.autoConnect && <span title="자동 연결" style={{ fontSize: '0.8rem' }}>⚡</span>}
                    {profile.isShared && <span title="공유됨" style={{ fontSize: '0.8rem' }}>👥</span>}
                  </div>
                  {profile.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{profile.description}</div>
                  )}
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleConnect(profile)}>
                  🔗 연결
                </button>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span>{getAuthIcon(profile.authMethod)}</span>
                  <code style={{ fontWeight: 500 }}>{profile.username}@{profile.server.ip}:{profile.server.port}</code>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {profile.server.name}
                  {profile.jumpHost && <span> (via {profile.jumpHost.name})</span>}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                {profile.tags.map(tag => (
                  <span key={tag} style={{ padding: '2px 8px', background: 'var(--color-primary)20', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '0.7rem' }}>
                    {tag}
                  </span>
                ))}
                {profile.environment.map(env => (
                  <span key={env} style={{ padding: '2px 8px', background: env === 'PRODUCTION' ? '#ef444420' : env === 'STAGING' ? '#f59e0b20' : '#10b98120', color: env === 'PRODUCTION' ? '#ef4444' : env === 'STAGING' ? '#f59e0b' : '#10b981', borderRadius: '4px', fontSize: '0.7rem' }}>
                    {env}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>📊 {profile.usageCount}회 사용</span>
                <span>{profile.lastUsed ? getTimeAgo(profile.lastUsed) : '미사용'}</span>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProfile(profile)}>✏️ 수정</button>
                <button className="btn btn-ghost btn-sm">📋 복제</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(profile)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ 연결 프로필 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">프로필 이름</label>
                <input type="text" className="form-input" placeholder="예: Prod Web Server" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">서버 주소</label>
                  <input type="text" className="form-input" placeholder="10.0.1.10" value={newServer} onChange={(e) => setNewServer(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">포트</label>
                  <input type="number" className="form-input" value={newPort} onChange={(e) => setNewPort(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">사용자</label>
                <input type="text" className="form-input" placeholder="deploy" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">인증 방식</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['SSH_KEY', 'PASSWORD', 'CERTIFICATE'] as const).map(method => (
                    <label key={method} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: newAuthMethod === method ? 'var(--color-primary)20' : 'var(--color-surface)', borderRadius: '6px', border: newAuthMethod === method ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer' }}>
                      <input type="radio" name="authMethod" checked={newAuthMethod === method} onChange={() => setNewAuthMethod(method)} style={{ display: 'none' }} />
                      <span>{getAuthIcon(method)}</span>
                      <span style={{ fontSize: '0.8rem' }}>{method === 'SSH_KEY' ? 'SSH 키' : method === 'PASSWORD' ? '비밀번호' : '인증서'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newName || !newServer || !newUsername}>저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

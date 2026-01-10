'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SSHKeyEntry {
  id: string;
  name: string;
  type: 'RSA' | 'ED25519' | 'ECDSA' | 'DSA';
  keySize: number;
  fingerprint: string;
  publicKey: string;
  owner: { id: string; name: string; email: string };
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';
  expiresAt?: string;
  usageCount: number;
  linkedServers: { id: string; name: string }[];
  lastUsed?: string;
  createdAt: string;
  comment?: string;
}

export default function SSHKeyVaultPage() {
  const [keys, setKeys] = useState<SSHKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedKey, setSelectedKey] = useState<SSHKeyEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);

  useEffect(() => {
    const mockKeys: SSHKeyEntry[] = [
      { id: '1', name: 'admin-prod-key', type: 'ED25519', keySize: 256, fingerprint: 'SHA256:abc123def456ghi789...', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI...', owner: { id: 'u1', name: '김관리', email: 'kim@example.com' }, status: 'ACTIVE', usageCount: 1250, linkedServers: [{ id: 's1', name: 'prod-web-01' }, { id: 's2', name: 'prod-web-02' }, { id: 's3', name: 'prod-db-01' }], lastUsed: new Date(Date.now() - 2 * 3600000).toISOString(), createdAt: new Date(Date.now() - 365 * 24 * 3600000).toISOString(), comment: '프로덕션 관리자 키' },
      { id: '2', name: 'deploy-key', type: 'RSA', keySize: 4096, fingerprint: 'SHA256:jkl012mno345pqr678...', publicKey: 'ssh-rsa AAAAB3NzaC1yc2E...', owner: { id: 'u2', name: '박개발', email: 'park@example.com' }, status: 'ACTIVE', usageCount: 3420, linkedServers: [{ id: 's1', name: 'prod-web-01' }, { id: 's4', name: 'staging-01' }], lastUsed: new Date(Date.now() - 30 * 60000).toISOString(), createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), comment: 'CI/CD 배포용' },
      { id: '3', name: 'dev-team-shared', type: 'RSA', keySize: 2048, fingerprint: 'SHA256:stu901vwx234yz...', publicKey: 'ssh-rsa AAAAB3NzaC1yc2E...', owner: { id: 'u3', name: '이백엔드', email: 'lee@example.com' }, status: 'ACTIVE', expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(), usageCount: 890, linkedServers: [{ id: 's4', name: 'staging-01' }, { id: 's5', name: 'dev-01' }], lastUsed: new Date(Date.now() - 4 * 3600000).toISOString(), createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), comment: '개발팀 공유 키' },
      { id: '4', name: 'bastion-access', type: 'ECDSA', keySize: 384, fingerprint: 'SHA256:abc789def012...', publicKey: 'ecdsa-sha2-nistp384 AAAAE2VjZHNh...', owner: { id: 'u1', name: '김관리', email: 'kim@example.com' }, status: 'ACTIVE', usageCount: 456, linkedServers: [{ id: 's6', name: 'bastion-01' }], lastUsed: new Date(Date.now() - 1 * 24 * 3600000).toISOString(), createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), comment: '점프 호스트 접속용' },
      { id: '5', name: 'old-legacy-key', type: 'DSA', keySize: 1024, fingerprint: 'SHA256:legacy123...', publicKey: 'ssh-dss AAAAB3NzaC1kc3M...', owner: { id: 'u4', name: '정테스트', email: 'jung@example.com' }, status: 'EXPIRED', usageCount: 23, linkedServers: [], lastUsed: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), createdAt: new Date(Date.now() - 730 * 24 * 3600000).toISOString(), comment: '(폐기 예정)' },
      { id: '6', name: 'contractor-temp', type: 'ED25519', keySize: 256, fingerprint: 'SHA256:temp456...', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI...', owner: { id: 'u5', name: '외부개발자', email: 'ext@contractor.com' }, status: 'REVOKED', usageCount: 45, linkedServers: [], createdAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), comment: '외주 작업용 (계약 종료)' },
      { id: '7', name: 'new-engineer-key', type: 'ED25519', keySize: 256, fingerprint: 'SHA256:new789...', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI...', owner: { id: 'u6', name: '신입사원', email: 'new@example.com' }, status: 'PENDING', usageCount: 0, linkedServers: [], createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(), comment: '승인 대기중' },
    ];
    setKeys(mockKeys);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'ED25519': return { color: '#10b981', label: 'ED25519', icon: '🔐', security: 'high' };
      case 'RSA': return { color: '#3b82f6', label: 'RSA', icon: '🔑', security: 'medium' };
      case 'ECDSA': return { color: '#8b5cf6', label: 'ECDSA', icon: '🔏', security: 'high' };
      case 'DSA': return { color: '#ef4444', label: 'DSA', icon: '⚠️', security: 'low' };
      default: return { color: '#6b7280', label: type, icon: '?', security: 'unknown' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: '#10b981', label: '활성', icon: '✓' };
      case 'EXPIRED': return { color: '#f59e0b', label: '만료', icon: '⏰' };
      case 'REVOKED': return { color: '#ef4444', label: '폐기', icon: '✗' };
      case 'PENDING': return { color: '#3b82f6', label: '승인 대기', icon: '⏳' };
      default: return { color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return `${Math.floor(diff / 86400000)}일 전`;
  };

  const getExpiryStatus = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff < 0) return { color: '#ef4444', text: '만료됨' };
    if (diff < 7 * 24 * 3600000) return { color: '#f59e0b', text: `${Math.floor(diff / (24 * 3600000))}일 후 만료` };
    if (diff < 30 * 24 * 3600000) return { color: '#eab308', text: `${Math.floor(diff / (24 * 3600000))}일 후 만료` };
    return null;
  };

  const filteredKeys = keys.filter(k => {
    if (searchQuery && !k.name.toLowerCase().includes(searchQuery.toLowerCase()) && !k.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) && !k.fingerprint.includes(searchQuery)) return false;
    if (filterType !== 'all' && k.type !== filterType) return false;
    if (filterStatus !== 'all' && k.status !== filterStatus) return false;
    return true;
  });

  const activeKeys = keys.filter(k => k.status === 'ACTIVE').length;
  const pendingKeys = keys.filter(k => k.status === 'PENDING').length;
  const expiringSoon = keys.filter(k => k.expiresAt && new Date(k.expiresAt).getTime() - Date.now() < 30 * 24 * 3600000 && new Date(k.expiresAt).getTime() > Date.now()).length;

  return (
    <AdminLayout 
      title="SSH 키 보관소" 
      description="SSH 키 관리 및 접근 제어"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 키</div>
          <div className="stat-value">{keys.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 활성</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{activeKeys}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⏳ 승인 대기</div>
          <div className="stat-value" style={{ color: pendingKeys > 0 ? '#3b82f6' : 'inherit' }}>{pendingKeys}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⏰ 곧 만료</div>
          <div className="stat-value" style={{ color: expiringSoon > 0 ? '#f59e0b' : 'inherit' }}>{expiringSoon}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔐 ED25519</div>
          <div className="stat-value">{keys.filter(k => k.type === 'ED25519').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" className="form-input" placeholder="🔍 이름, 소유자, 핑거프린트..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '250px' }} />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 유형</option>
          <option value="ED25519">🔐 ED25519</option>
          <option value="RSA">🔑 RSA</option>
          <option value="ECDSA">🔏 ECDSA</option>
          <option value="DSA">⚠️ DSA</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'ACTIVE', 'PENDING', 'EXPIRED', 'REVOKED'].map(status => (
            <button key={status} className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterStatus(status)}>{status === 'all' ? '전체' : getStatusConfig(status).label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ 키 등록</button>
      </div>

      {/* Keys Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>키 이름</th>
                  <th>유형</th>
                  <th>소유자</th>
                  <th>상태</th>
                  <th>연결 서버</th>
                  <th>사용</th>
                  <th>마지막 사용</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map(key => {
                  const typeConfig = getTypeConfig(key.type);
                  const statusConfig = getStatusConfig(key.status);
                  const expiryStatus = getExpiryStatus(key.expiresAt);
                  return (
                    <tr key={key.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedKey(key)}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{typeConfig.icon} {key.name}</div>
                        <code style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{key.fingerprint.slice(0, 25)}...</code>
                      </td>
                      <td>
                        <span style={{ padding: '3px 8px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.8rem' }}>{typeConfig.label}</span>
                        <span style={{ marginLeft: '4px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{key.keySize}bit</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>{key.owner.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{key.owner.email}</div>
                      </td>
                      <td>
                        <span style={{ color: statusConfig.color, fontWeight: 500 }}>{statusConfig.icon} {statusConfig.label}</span>
                        {expiryStatus && <div style={{ fontSize: '0.75rem', color: expiryStatus.color }}>{expiryStatus.text}</div>}
                      </td>
                      <td>
                        {key.linkedServers.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {key.linkedServers.slice(0, 2).map(s => <span key={s.id} style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: '4px', fontSize: '0.75rem' }}>{s.name}</span>)}
                            {key.linkedServers.length > 2 && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>+{key.linkedServers.length - 2}</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>없음</span>
                        )}
                      </td>
                      <td><span style={{ fontWeight: 500 }}>{key.usageCount.toLocaleString()}</span></td>
                      <td>
                        {key.lastUsed ? <span>{getTimeAgo(key.lastUsed)}</span> : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Detail Modal */}
      {selectedKey && (
        <div className="modal-overlay active" onClick={() => { setSelectedKey(null); setShowPublicKey(false); }}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedKey.type).icon} {selectedKey.name}</h3>
              <button className="modal-close" onClick={() => { setSelectedKey(null); setShowPublicKey(false); }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getStatusConfig(selectedKey.status).color}20`, color: getStatusConfig(selectedKey.status).color, borderRadius: '6px' }}>{getStatusConfig(selectedKey.status).icon} {getStatusConfig(selectedKey.status).label}</span>
                <span style={{ padding: '4px 10px', background: `${getTypeConfig(selectedKey.type).color}20`, color: getTypeConfig(selectedKey.type).color, borderRadius: '6px' }}>{getTypeConfig(selectedKey.type).label} {selectedKey.keySize}bit</span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>핑거프린트</div>
                <code style={{ wordBreak: 'break-all', fontSize: '0.85rem', display: 'block', padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>{selectedKey.fingerprint}</code>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>공개키</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowPublicKey(!showPublicKey)}>{showPublicKey ? '숨기기' : '보기'}</button>
                </div>
                {showPublicKey && <code style={{ wordBreak: 'break-all', fontSize: '0.75rem', display: 'block', padding: '8px', background: '#1e1e1e', color: '#d4d4d4', borderRadius: '6px', maxHeight: '100px', overflow: 'auto' }}>{selectedKey.publicKey}</code>}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>소유자:</span> {selectedKey.owner.name}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>이메일:</span> {selectedKey.owner.email}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>사용 횟수:</span> {selectedKey.usageCount.toLocaleString()}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>생성일:</span> {new Date(selectedKey.createdAt).toLocaleDateString('ko-KR')}</div>
                {selectedKey.expiresAt && <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>만료일:</span> {new Date(selectedKey.expiresAt).toLocaleDateString('ko-KR')}</div>}
                {selectedKey.lastUsed && <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>마지막 사용:</span> {getTimeAgo(selectedKey.lastUsed)}</div>}
              </div>
              
              {selectedKey.linkedServers.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>연결된 서버 ({selectedKey.linkedServers.length})</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedKey.linkedServers.map(s => <span key={s.id} style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.85rem' }}>🖥️ {s.name}</span>)}
                  </div>
                </div>
              )}
              
              {selectedKey.comment && (
                <div style={{ padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.9rem' }}>💬 {selectedKey.comment}</div>
              )}
            </div>
            <div className="modal-footer">
              {selectedKey.status === 'PENDING' && <button className="btn btn-primary">✓ 승인</button>}
              {selectedKey.status === 'ACTIVE' && <button className="btn btn-secondary">🔄 갱신</button>}
              {selectedKey.status !== 'REVOKED' && <button className="btn btn-ghost" style={{ color: '#ef4444' }}>폐기</button>}
              <button className="btn btn-ghost" onClick={() => { setSelectedKey(null); setShowPublicKey(false); }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">+ SSH 키 등록</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">키 이름</label>
                <input type="text" className="form-input" placeholder="my-ssh-key" />
              </div>
              <div className="form-group">
                <label className="form-label">공개키</label>
                <textarea className="form-input" rows={4} placeholder="ssh-ed25519 AAAA..." style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">만료일 (선택)</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">연결 서버</label>
                  <select className="form-input">
                    <option value="">선택...</option>
                    <option value="all">전체 서버</option>
                    <option value="prod">프로덕션</option>
                    <option value="staging">스테이징</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">설명 (선택)</label>
                <input type="text" className="form-input" placeholder="키 용도 설명" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary">등록</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Server {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  authType: 'KEY' | 'PASSWORD';
  description: string | null;
  tags: string[];
  isActive: boolean;
  sessionCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [envFilter, setEnvFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    port: 22,
    username: 'root',
    authType: 'KEY',
    environment: 'DEV',
    description: '',
    tags: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const user = localStorage.getItem('user');
    if (!user) return {};
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  };

  const fetchServers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (envFilter) params.set('environment', envFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/servers?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch servers');
      
      const data = await response.json();
      setServers(data.servers);
      setPagination(data.pagination);
    } catch (err) {
      setError('서버 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [envFilter, searchQuery]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/admin/servers', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create server');
      }

      setSuccess('서버가 등록되었습니다.');
      setShowModal(false);
      setFormData({ name: '', hostname: '', port: 22, username: 'root', authType: 'KEY', environment: 'DEV', description: '', tags: '' });
      fetchServers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '서버 등록에 실패했습니다.');
    }
  };

  const handleUpdateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return;
    setError('');

    try {
      const response = await fetch('/api/admin/servers', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedServer.id,
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error('Failed to update server');

      setSuccess('서버 정보가 수정되었습니다.');
      setShowEditModal(false);
      setSelectedServer(null);
      fetchServers();
    } catch (err) {
      setError('서버 수정에 실패했습니다.');
    }
  };

  const handleToggleActive = async (server: Server) => {
    try {
      await fetch('/api/admin/servers', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: server.id, isActive: !server.isActive }),
      });

      setSuccess(server.isActive ? '서버가 비활성화되었습니다.' : '서버가 활성화되었습니다.');
      fetchServers();
    } catch (err) {
      setError('상태 변경에 실패했습니다.');
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('정말 이 서버를 삭제하시겠습니까?')) return;

    try {
      await fetch('/api/admin/servers', {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serverId }),
      });

      setSuccess('서버가 삭제되었습니다.');
      fetchServers();
    } catch (err) {
      setError('서버 삭제에 실패했습니다.');
    }
  };

  const openEditModal = (server: Server) => {
    setSelectedServer(server);
    setFormData({
      name: server.name,
      hostname: server.hostname,
      port: server.port,
      username: server.username,
      authType: server.authType,
      environment: server.environment,
      description: server.description || '',
      tags: server.tags.join(', '),
    });
    setShowEditModal(true);
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  // Stats
  const envStats = {
    PROD: servers.filter(s => s.environment === 'PROD'),
    STAGE: servers.filter(s => s.environment === 'STAGE'),
    DEV: servers.filter(s => s.environment === 'DEV'),
  };

  return (
    <AdminLayout 
      title="서버 관리" 
      description="SSH 접속 대상 서버 등록 및 상태 관리"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 서버 등록</button>}
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

      {/* Environment Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {(['PROD', 'STAGE', 'DEV'] as const).map(env => {
          const list = envStats[env];
          const activeCount = list.filter(s => s.isActive).length;
          return (
            <div 
              key={env} 
              className="card" 
              style={{ 
                padding: '20px', 
                borderLeft: `3px solid ${getEnvColor(env)}`, 
                cursor: 'pointer', 
                background: envFilter === env ? 'var(--color-surface)' : undefined 
              }}
              onClick={() => setEnvFilter(envFilter === env ? '' : env)}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                {env === 'PROD' ? 'Production' : env === 'STAGE' ? 'Staging' : 'Development'}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: getEnvColor(env) }}>{list.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{activeCount} Active</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="서버 이름, 호스트, 설명 검색..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Servers Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>서버</th>
                  <th>환경</th>
                  <th>호스트</th>
                  <th>인증</th>
                  <th>태그</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {servers.map(server => (
                  <tr key={server.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{server.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{server.description || '-'}</div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        background: getEnvColor(server.environment) + '20', 
                        color: getEnvColor(server.environment) 
                      }}>
                        {server.environment}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {server.hostname}:{server.port}
                    </td>
                    <td>
                      <span className={`badge ${server.authType === 'KEY' ? 'badge-success' : 'badge-warning'}`}>
                        {server.authType === 'KEY' ? '🔑 Key' : '🔒 Password'}
                      </span>
                    </td>
                    <td>
                      {server.tags.map(t => (
                        <span key={t} className="badge badge-info" style={{ marginRight: '4px', fontSize: '0.65rem' }}>{t}</span>
                      ))}
                    </td>
                    <td>
                      <span className={`badge ${server.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {server.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(server)}>수정</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(server)}>
                          {server.isActive ? '비활성' : '활성'}
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteServer(server.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Server Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">서버 등록</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateServer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">서버 이름 *</label>
                  <input type="text" className="form-input" placeholder="prod-web-01" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">호스트 주소 *</label>
                    <input type="text" className="form-input" placeholder="192.168.1.10" value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">포트</label>
                    <input type="number" className="form-input" value={formData.port} onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">사용자명 *</label>
                  <input type="text" className="form-input" placeholder="root" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">환경</label>
                    <select className="form-input form-select" value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value })}>
                      <option value="DEV">Development</option>
                      <option value="STAGE">Staging</option>
                      <option value="PROD">Production</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">인증 방식</label>
                    <select className="form-input form-select" value={formData.authType} onChange={(e) => setFormData({ ...formData, authType: e.target.value })}>
                      <option value="KEY">SSH Key (권장)</option>
                      <option value="PASSWORD">Password</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">설명</label>
                  <input type="text" className="form-input" placeholder="Production Web Server 1" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">태그 (쉼표 구분)</label>
                  <input type="text" className="form-input" placeholder="web, nginx" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Server Modal */}
      {showEditModal && selectedServer && (
        <div className="modal-overlay active" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">서버 수정</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateServer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">서버 이름</label>
                  <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">호스트 주소</label>
                    <input type="text" className="form-input" value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">포트</label>
                    <input type="number" className="form-input" value={formData.port} onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">환경</label>
                    <select className="form-input form-select" value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value })}>
                      <option value="DEV">Development</option>
                      <option value="STAGE">Staging</option>
                      <option value="PROD">Production</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">인증 방식</label>
                    <select className="form-input form-select" value={formData.authType} onChange={(e) => setFormData({ ...formData, authType: e.target.value })}>
                      <option value="KEY">SSH Key</option>
                      <option value="PASSWORD">Password</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">설명</label>
                  <input type="text" className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">태그 (쉼표 구분)</label>
                  <input type="text" className="form-input" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

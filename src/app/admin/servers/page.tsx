'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  lastConnectedAt: string | null;
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
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    port: 22,
    username: 'root',
    authType: 'KEY',
    environment: 'DEV',
    description: '',
    tags: '',
    privateKey: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
          privateKey: formData.authType === 'KEY' ? formData.privateKey : undefined,
          password: formData.authType === 'PASSWORD' ? formData.password : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create server');
      }

      setSuccess('서버가 등록되었습니다.');
      setShowModal(false);
      resetForm();
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

  const handleTestConnection = async (server: Server) => {
    setTestingConnection(server.id);
    try {
      const response = await fetch('/api/admin/servers/test', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: server.id }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`✅ ${server.name}: ${result.message} (${result.duration}ms)`);
      } else {
        setError(`❌ ${server.name}: ${result.message || '연결 실패'}`);
      }
    } catch (err) {
      setError(`${server.name} 연결 테스트 실패`);
    } finally {
      setTestingConnection(null);
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

  const handleKeyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, privateKey: event.target?.result as string });
      };
      reader.readAsText(file);
    }
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const servers = data.servers || data; // Support both {servers: [...]} and [...]
          
          if (!Array.isArray(servers) || servers.length === 0) {
            setError('유효한 서버 목록이 없습니다.');
            return;
          }

          // Call bulk import API
          const response = await fetch('/api/admin/servers/bulk', {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ servers }),
          });
          
          const result = await response.json();
          
          if (result.success > 0) {
            setSuccess(`✅ ${result.success}개 서버 등록 완료` + (result.failed > 0 ? `, ${result.failed}개 실패` : ''));
            fetchServers();
          } else {
            setError(`❌ 서버 등록 실패: ${result.errors?.join(', ') || '알 수 없는 오류'}`);
          }
        } catch (err) {
          setError('JSON 파일 파싱에 실패했습니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportServers = () => {
    const exportData = servers.map(s => ({
      name: s.name,
      hostname: s.hostname,
      port: s.port,
      username: s.username,
      environment: s.environment,
      authType: s.authType,
      description: s.description,
      tags: s.tags,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `servers-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      hostname: '',
      port: 22,
      username: 'root',
      authType: 'KEY',
      environment: 'DEV',
      description: '',
      tags: '',
      privateKey: '',
      password: '',
    });
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
      privateKey: '',
      password: '',
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

  const getEnvGradient = (env: string) => {
    switch (env) {
      case 'PROD': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'STAGE': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'DEV': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  };

  // Stats
  const envStats = {
    PROD: servers.filter(s => s.environment === 'PROD'),
    STAGE: servers.filter(s => s.environment === 'STAGE'),
    DEV: servers.filter(s => s.environment === 'DEV'),
  };
  const totalActive = servers.filter(s => s.isActive).length;

  return (
    <AdminLayout 
      title="서버 관리" 
      description="SSH 접속 대상 서버 등록 및 상태 관리"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => uploadInputRef.current?.click()}>
            📥 JSON 가져오기
          </button>
          <button className="btn btn-secondary" onClick={handleExportServers}>
            📤 내보내기
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + 서버 등록
          </button>
          <input ref={uploadInputRef} type="file" accept=".json" onChange={handleBulkImport} style={{ display: 'none' }} />
        </div>
      }
    >
      {/* Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>❌ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>전체 서버</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{servers.length}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{totalActive} active</div>
        </div>
        {(['PROD', 'STAGE', 'DEV'] as const).map(env => {
          const list = envStats[env];
          const activeCount = list.filter(s => s.isActive).length;
          return (
            <div 
              key={env} 
              className="card" 
              style={{ 
                padding: '20px', 
                background: getEnvGradient(env),
                color: 'white',
                cursor: 'pointer', 
                opacity: envFilter && envFilter !== env ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
              onClick={() => setEnvFilter(envFilter === env ? '' : env)}
            >
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {env === 'PROD' ? 'Production' : env === 'STAGE' ? 'Staging' : 'Development'}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{list.length}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{activeCount} active</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="🔍 서버 이름, 호스트, 설명, 태그 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', borderRadius: '8px', padding: '4px' }}>
          <button 
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('table')}
            style={{ padding: '6px 12px' }}
          >
            📋 테이블
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
            style={{ padding: '6px 12px' }}
          >
            📦 카드
          </button>
        </div>
        <button className="btn btn-ghost" onClick={() => fetchServers()}>
          🔄 새로고침
        </button>
      </div>

      {/* Content */}
      <div className="card" style={{ padding: viewMode === 'grid' ? '16px' : 0 }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--color-text-muted)' }}>서버 목록을 불러오는 중...</div>
          </div>
        ) : servers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🖥️</div>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              {searchQuery ? '검색 결과가 없습니다' : '등록된 서버가 없습니다'}
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + 첫 서버 등록하기
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {servers.map(server => (
              <div 
                key={server.id} 
                className="card" 
                style={{ 
                  padding: '20px', 
                  border: '1px solid var(--color-border)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: getEnvGradient(server.environment) }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{server.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {server.hostname}:{server.port}
                    </div>
                  </div>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.7rem', 
                    fontWeight: 600, 
                    background: getEnvColor(server.environment) + '20', 
                    color: getEnvColor(server.environment) 
                  }}>
                    {server.environment}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  {server.description || '설명 없음'}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span className={`badge ${server.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                    {server.isActive ? '🟢 활성' : '🔴 비활성'}
                  </span>
                  <span className={`badge ${server.authType === 'KEY' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                    {server.authType === 'KEY' ? '🔑 Key' : '🔒 Password'}
                  </span>
                  {server.tags.slice(0, 2).map(t => (
                    <span key={t} className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-surface)' }}>{t}</span>
                  ))}
                  {server.tags.length > 2 && (
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-surface)' }}>+{server.tags.length - 2}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => handleTestConnection(server)}
                    disabled={testingConnection === server.id}
                  >
                    {testingConnection === server.id ? '테스트 중...' : '🔗 연결 테스트'}
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(server)}>✏️</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeleteServer(server.id)}>🗑️</button>
                </div>
              </div>
            ))}
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
                  <th style={{ width: '200px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {servers.map(server => (
                  <tr key={server.id} style={{ opacity: server.isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{server.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{server.description || '-'}</div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
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
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {server.tags.slice(0, 3).map(t => (
                          <span key={t} className="badge badge-info" style={{ fontSize: '0.65rem' }}>{t}</span>
                        ))}
                        {server.tags.length > 3 && (
                          <span className="badge" style={{ fontSize: '0.65rem' }}>+{server.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${server.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {server.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => handleTestConnection(server)}
                          disabled={testingConnection === server.id}
                          title="연결 테스트"
                        >
                          {testingConnection === server.id ? '⏳' : '🔗'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(server)} title="수정">✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(server)} title={server.isActive ? '비활성화' : '활성화'}>
                          {server.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteServer(server.id)}
                          title="삭제"
                        >
                          🗑️
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <button
              key={i}
              className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => fetchServers(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Create Server Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🖥️ 서버 등록</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateServer}>
              <div className="modal-body">
                {/* Server Info */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>기본 정보</h4>
                  <div className="form-group">
                    <label className="form-label">서버 이름 *</label>
                    <input type="text" className="form-input" placeholder="prod-web-01" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">호스트 주소 *</label>
                      <input type="text" className="form-input" placeholder="192.168.1.10 또는 example.com" value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} required />
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
                        <option value="DEV">🟢 Development</option>
                        <option value="STAGE">🟡 Staging</option>
                        <option value="PROD">🔴 Production</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">사용자명 *</label>
                      <input type="text" className="form-input" placeholder="root" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                    </div>
                  </div>
                </div>

                {/* Authentication */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>인증 설정</h4>
                  <div className="form-group">
                    <label className="form-label">인증 방식</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', border: formData.authType === 'KEY' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: '8px', flex: 1 }}>
                        <input type="radio" name="authType" value="KEY" checked={formData.authType === 'KEY'} onChange={(e) => setFormData({ ...formData, authType: e.target.value })} />
                        <span>🔑 SSH Key (권장)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', border: formData.authType === 'PASSWORD' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: '8px', flex: 1 }}>
                        <input type="radio" name="authType" value="PASSWORD" checked={formData.authType === 'PASSWORD'} onChange={(e) => setFormData({ ...formData, authType: e.target.value })} />
                        <span>🔒 Password</span>
                      </label>
                    </div>
                  </div>
                  {formData.authType === 'KEY' ? (
                    <div className="form-group">
                      <label className="form-label">SSH 개인키</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                          📁 파일 선택
                        </button>
                        <input ref={fileInputRef} type="file" accept=".pem,.key" onChange={handleKeyFileUpload} style={{ display: 'none' }} />
                        {formData.privateKey && <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>✅ 키 로드됨</span>}
                      </div>
                      <textarea 
                        className="form-input" 
                        placeholder="또는 여기에 SSH 개인키를 직접 붙여넣기..."
                        value={formData.privateKey}
                        onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                        style={{ height: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">비밀번호</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="SSH 비밀번호"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Description & Tags */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>추가 정보</h4>
                  <div className="form-group">
                    <label className="form-label">설명</label>
                    <input type="text" className="form-input" placeholder="Production Web Server 1" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">태그 (쉼표 구분)</label>
                    <input type="text" className="form-input" placeholder="web, nginx, frontend" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">🖥️ 서버 등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Server Modal */}
      {showEditModal && selectedServer && (
        <div className="modal-overlay active" onClick={() => setShowEditModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ 서버 수정</h3>
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
                      <option value="DEV">🟢 Development</option>
                      <option value="STAGE">🟡 Staging</option>
                      <option value="PROD">🔴 Production</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">인증 방식</label>
                    <select className="form-input form-select" value={formData.authType} onChange={(e) => setFormData({ ...formData, authType: e.target.value })}>
                      <option value="KEY">🔑 SSH Key</option>
                      <option value="PASSWORD">🔒 Password</option>
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
                <button type="submit" className="btn btn-primary">💾 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

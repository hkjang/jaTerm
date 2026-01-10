'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  category: string;
  auth: 'NONE' | 'API_KEY' | 'JWT' | 'SESSION';
  rateLimit?: number; // requests per minute
  deprecated: boolean;
  version: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  responses: { code: number; description: string }[];
  example?: { request?: string; response?: string };
}

export default function APIDocumentationPage() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mockEndpoints: APIEndpoint[] = [
      { id: '1', method: 'GET', path: '/api/servers', description: '서버 목록 조회', category: '서버', auth: 'JWT', rateLimit: 100, deprecated: false, version: 'v1', parameters: [{ name: 'page', type: 'number', required: false, description: '페이지 번호' }, { name: 'limit', type: 'number', required: false, description: '페이지당 개수' }], responses: [{ code: 200, description: '서버 목록 반환' }, { code: 401, description: '인증 실패' }] },
      { id: '2', method: 'POST', path: '/api/servers', description: '서버 등록', category: '서버', auth: 'JWT', rateLimit: 20, deprecated: false, version: 'v1', parameters: [{ name: 'name', type: 'string', required: true, description: '서버 이름' }, { name: 'host', type: 'string', required: true, description: '호스트 주소' }, { name: 'port', type: 'number', required: true, description: 'SSH 포트' }], responses: [{ code: 201, description: '서버 생성 완료' }, { code: 400, description: '잘못된 요청' }] },
      { id: '3', method: 'GET', path: '/api/servers/:id', description: '서버 상세 조회', category: '서버', auth: 'JWT', rateLimit: 100, deprecated: false, version: 'v1', responses: [{ code: 200, description: '서버 정보 반환' }, { code: 404, description: '서버 없음' }] },
      { id: '4', method: 'PUT', path: '/api/servers/:id', description: '서버 정보 수정', category: '서버', auth: 'JWT', rateLimit: 20, deprecated: false, version: 'v1', responses: [{ code: 200, description: '수정 완료' }, { code: 404, description: '서버 없음' }] },
      { id: '5', method: 'DELETE', path: '/api/servers/:id', description: '서버 삭제', category: '서버', auth: 'JWT', rateLimit: 10, deprecated: false, version: 'v1', responses: [{ code: 204, description: '삭제 완료' }, { code: 404, description: '서버 없음' }] },
      { id: '6', method: 'GET', path: '/api/users', description: '사용자 목록 조회', category: '사용자', auth: 'JWT', rateLimit: 100, deprecated: false, version: 'v1', responses: [{ code: 200, description: '사용자 목록 반환' }] },
      { id: '7', method: 'POST', path: '/api/auth/login', description: '로그인', category: '인증', auth: 'NONE', rateLimit: 10, deprecated: false, version: 'v1', parameters: [{ name: 'email', type: 'string', required: true, description: '이메일' }, { name: 'password', type: 'string', required: true, description: '비밀번호' }], responses: [{ code: 200, description: '로그인 성공, JWT 토큰 반환' }, { code: 401, description: '인증 실패' }] },
      { id: '8', method: 'POST', path: '/api/auth/logout', description: '로그아웃', category: '인증', auth: 'JWT', deprecated: false, version: 'v1', responses: [{ code: 200, description: '로그아웃 완료' }] },
      { id: '9', method: 'GET', path: '/api/sessions', description: '활성 세션 조회', category: '세션', auth: 'JWT', rateLimit: 50, deprecated: false, version: 'v1', responses: [{ code: 200, description: '세션 목록 반환' }] },
      { id: '10', method: 'POST', path: '/api/sessions/:id/connect', description: 'SSH 연결', category: '세션', auth: 'JWT', rateLimit: 30, deprecated: false, version: 'v1', responses: [{ code: 200, description: '연결 성공' }, { code: 403, description: '권한 없음' }] },
      { id: '11', method: 'DELETE', path: '/api/sessions/:id', description: '세션 종료', category: '세션', auth: 'JWT', deprecated: false, version: 'v1', responses: [{ code: 204, description: '세션 종료 완료' }] },
      { id: '12', method: 'GET', path: '/api/audit-logs', description: '감사 로그 조회', category: '감사', auth: 'JWT', rateLimit: 50, deprecated: false, version: 'v1', parameters: [{ name: 'startDate', type: 'date', required: false, description: '시작일' }, { name: 'endDate', type: 'date', required: false, description: '종료일' }], responses: [{ code: 200, description: '감사 로그 반환' }] },
      { id: '13', method: 'GET', path: '/api/v0/servers', description: '[Deprecated] 서버 목록', category: '서버', auth: 'API_KEY', deprecated: true, version: 'v0', responses: [{ code: 200, description: '서버 목록 반환' }] },
    ];
    setEndpoints(mockEndpoints);
    
    // Expand all categories by default
    const categories = [...new Set(mockEndpoints.map(e => e.category))];
    setExpandedCategories(new Set(categories));
    
    setLoading(false);
  }, []);

  const getMethodConfig = (method: string) => {
    switch (method) {
      case 'GET': return { color: '#10b981', bg: '#10b98120' };
      case 'POST': return { color: '#3b82f6', bg: '#3b82f620' };
      case 'PUT': return { color: '#f59e0b', bg: '#f59e0b20' };
      case 'PATCH': return { color: '#8b5cf6', bg: '#8b5cf620' };
      case 'DELETE': return { color: '#ef4444', bg: '#ef444420' };
      default: return { color: '#6b7280', bg: '#6b728020' };
    }
  };

  const getAuthConfig = (auth: string) => {
    switch (auth) {
      case 'JWT': return { label: '🔐 JWT', color: '#3b82f6' };
      case 'API_KEY': return { label: '🔑 API Key', color: '#8b5cf6' };
      case 'SESSION': return { label: '🍪 Session', color: '#f59e0b' };
      case 'NONE': return { label: '🌐 공개', color: '#10b981' };
      default: return { label: auth, color: '#6b7280' };
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) newSet.delete(category);
      else newSet.add(category);
      return newSet;
    });
  };

  const filteredEndpoints = endpoints.filter(e => {
    if (searchQuery && !e.path.toLowerCase().includes(searchQuery.toLowerCase()) && !e.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterMethod !== 'all' && e.method !== filterMethod) return false;
    return true;
  });

  const categories = [...new Set(endpoints.map(e => e.category))];
  const groupedEndpoints = categories.reduce((acc, cat) => {
    acc[cat] = filteredEndpoints.filter(e => e.category === cat);
    return acc;
  }, {} as Record<string, APIEndpoint[]>);

  return (
    <AdminLayout 
      title="API 문서" 
      description="REST API 엔드포인트 참조"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 엔드포인트</div>
          <div className="stat-value">{endpoints.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#10b981' }}>GET</div>
          <div className="stat-value">{endpoints.filter(e => e.method === 'GET').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#3b82f6' }}>POST</div>
          <div className="stat-value">{endpoints.filter(e => e.method === 'POST').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#f59e0b' }}>PUT/PATCH</div>
          <div className="stat-value">{endpoints.filter(e => e.method === 'PUT' || e.method === 'PATCH').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#ef4444' }}>DELETE</div>
          <div className="stat-value">{endpoints.filter(e => e.method === 'DELETE').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 경로 또는 설명 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 카테고리</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'GET', 'POST', 'PUT', 'DELETE'].map(method => {
            const config = method !== 'all' ? getMethodConfig(method) : null;
            return (
              <button
                key={method}
                className={`btn btn-sm ${filterMethod === method ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterMethod(method)}
                style={method !== 'all' && filterMethod !== method ? { color: config?.color } : {}}
              >
                {method === 'all' ? '전체' : method}
              </button>
            );
          })}
        </div>
      </div>

      {/* Endpoints List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map(category => {
            const categoryEndpoints = groupedEndpoints[category];
            if (categoryEndpoints.length === 0) return null;
            const isExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="card" style={{ padding: 0 }}>
                <div 
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none' }}
                  onClick={() => toggleCategory(category)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem' }}>{isExpanded ? '▼' : '▶'}</span>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{category}</span>
                    <span style={{ padding: '2px 8px', background: 'var(--color-bg-tertiary)', borderRadius: '10px', fontSize: '0.75rem' }}>{categoryEndpoints.length}</span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div>
                    {categoryEndpoints.map(endpoint => {
                      const methodConfig = getMethodConfig(endpoint.method);
                      const authConfig = getAuthConfig(endpoint.auth);
                      return (
                        <div 
                          key={endpoint.id}
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', opacity: endpoint.deprecated ? 0.6 : 1 }}
                          onClick={() => setSelectedEndpoint(endpoint)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ padding: '4px 10px', background: methodConfig.bg, color: methodConfig.color, borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', minWidth: '60px', textAlign: 'center' }}>{endpoint.method}</span>
                            <code style={{ fontSize: '0.9rem', textDecoration: endpoint.deprecated ? 'line-through' : 'none' }}>{endpoint.path}</code>
                            {endpoint.deprecated && <span style={{ padding: '2px 6px', background: '#ef444420', color: '#ef4444', borderRadius: '4px', fontSize: '0.7rem' }}>Deprecated</span>}
                            <span style={{ fontSize: '0.7rem', color: authConfig.color }}>{authConfig.label}</span>
                            <div style={{ flex: 1 }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{endpoint.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEndpoint && (
        <div className="modal-overlay active" onClick={() => setSelectedEndpoint(null)}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ padding: '4px 10px', background: getMethodConfig(selectedEndpoint.method).bg, color: getMethodConfig(selectedEndpoint.method).color, borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>{selectedEndpoint.method}</span>
                <code style={{ fontSize: '1rem' }}>{selectedEndpoint.path}</code>
              </h3>
              <button className="modal-close" onClick={() => setSelectedEndpoint(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{selectedEndpoint.description}</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                  <span style={{ color: getAuthConfig(selectedEndpoint.auth).color }}>{getAuthConfig(selectedEndpoint.auth).label}</span>
                  {selectedEndpoint.rateLimit && <span>📊 {selectedEndpoint.rateLimit} req/min</span>}
                  <span>v{selectedEndpoint.version}</span>
                </div>
              </div>

              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>📥 파라미터</div>
                  <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                    {selectedEndpoint.parameters.map((param, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <code style={{ fontWeight: 600 }}>{param.name}</code>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{param.type}</span>
                        {param.required && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>필수</span>}
                        <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>{param.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>📤 응답</div>
                <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                  {selectedEndpoint.responses.map((res, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ padding: '2px 8px', background: res.code < 300 ? '#10b98120' : res.code < 400 ? '#f59e0b20' : '#ef444420', color: res.code < 300 ? '#10b981' : res.code < 400 ? '#f59e0b' : '#ef4444', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>{res.code}</span>
                      <span style={{ fontSize: '0.85rem' }}>{res.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">📋 복사</button>
              <button className="btn btn-ghost" onClick={() => setSelectedEndpoint(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

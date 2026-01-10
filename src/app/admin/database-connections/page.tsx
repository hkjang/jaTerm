'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'MYSQL' | 'POSTGRESQL' | 'MONGODB' | 'REDIS' | 'ELASTICSEARCH' | 'ORACLE';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONNECTING';
  ssl: boolean;
  pool: { min: number; max: number; current: number };
  lastConnected?: string;
  latency?: number; // ms
  queryCount?: number;
  errorCount?: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
}

export default function DatabaseConnectionsPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const mockConnections: DatabaseConnection[] = [
      { id: '1', name: 'prod-mysql-01', type: 'MYSQL', host: 'db.production.internal', port: 3306, database: 'jaterm_prod', username: 'app_user', status: 'CONNECTED', ssl: true, pool: { min: 5, max: 20, current: 8 }, lastConnected: new Date().toISOString(), latency: 2.3, queryCount: 125847, errorCount: 12, createdBy: 'admin', createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), tags: ['production', 'primary'] },
      { id: '2', name: 'prod-mysql-02', type: 'MYSQL', host: 'db-replica.production.internal', port: 3306, database: 'jaterm_prod', username: 'app_reader', status: 'CONNECTED', ssl: true, pool: { min: 3, max: 10, current: 5 }, lastConnected: new Date().toISOString(), latency: 1.8, queryCount: 89234, errorCount: 3, createdBy: 'admin', createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), tags: ['production', 'replica'] },
      { id: '3', name: 'staging-postgres', type: 'POSTGRESQL', host: 'pg.staging.internal', port: 5432, database: 'jaterm_stage', username: 'stage_user', status: 'CONNECTED', ssl: true, pool: { min: 2, max: 10, current: 3 }, lastConnected: new Date().toISOString(), latency: 5.1, queryCount: 34521, errorCount: 0, createdBy: 'admin', createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), tags: ['staging'] },
      { id: '4', name: 'cache-redis', type: 'REDIS', host: 'redis.production.internal', port: 6379, database: '0', username: 'default', status: 'CONNECTED', ssl: false, pool: { min: 1, max: 5, current: 2 }, lastConnected: new Date().toISOString(), latency: 0.5, queryCount: 892341, errorCount: 0, createdBy: 'admin', createdAt: new Date(Date.now() - 120 * 24 * 3600000).toISOString(), tags: ['production', 'cache'] },
      { id: '5', name: 'logs-elastic', type: 'ELASTICSEARCH', host: 'es.production.internal', port: 9200, database: 'jaterm-logs', username: 'elastic', status: 'CONNECTED', ssl: true, pool: { min: 1, max: 3, current: 2 }, lastConnected: new Date().toISOString(), latency: 12.4, queryCount: 23456, errorCount: 5, createdBy: 'admin', createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), tags: ['production', 'logs'] },
      { id: '6', name: 'audit-mongodb', type: 'MONGODB', host: 'mongo.production.internal', port: 27017, database: 'audit', username: 'audit_writer', status: 'ERROR', ssl: true, pool: { min: 2, max: 10, current: 0 }, lastConnected: new Date(Date.now() - 3600000).toISOString(), latency: 0, queryCount: 45678, errorCount: 234, createdBy: 'admin', createdAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), tags: ['production', 'audit'] },
      { id: '7', name: 'dev-mysql', type: 'MYSQL', host: 'localhost', port: 3306, database: 'jaterm_dev', username: 'dev', status: 'DISCONNECTED', ssl: false, pool: { min: 1, max: 5, current: 0 }, createdBy: '김개발', createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), tags: ['development'] },
      { id: '8', name: 'oracle-legacy', type: 'ORACLE', host: 'oracle.internal', port: 1521, database: 'ORCL', username: 'jaterm', status: 'CONNECTING', ssl: true, pool: { min: 2, max: 8, current: 1 }, lastConnected: new Date(Date.now() - 60000).toISOString(), createdBy: 'admin', createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), tags: ['legacy', 'migration'] },
    ];
    setConnections(mockConnections);
    setLoading(false);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CONNECTED': return { color: '#10b981', bg: '#10b98120', label: '연결됨', icon: '●' };
      case 'DISCONNECTED': return { color: '#6b7280', bg: '#6b728020', label: '연결 끊김', icon: '○' };
      case 'ERROR': return { color: '#ef4444', bg: '#ef444420', label: '오류', icon: '✗' };
      case 'CONNECTING': return { color: '#f59e0b', bg: '#f59e0b20', label: '연결중', icon: '◐' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '?' };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'MYSQL': return { color: '#00758f', icon: '🐬' };
      case 'POSTGRESQL': return { color: '#336791', icon: '🐘' };
      case 'MONGODB': return { color: '#47a248', icon: '🍃' };
      case 'REDIS': return { color: '#dc382d', icon: '⚡' };
      case 'ELASTICSEARCH': return { color: '#005571', icon: '🔍' };
      case 'ORACLE': return { color: '#f80000', icon: '🔶' };
      default: return { color: '#6b7280', icon: '💾' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const filteredConnections = connections.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.host.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const connectedCount = connections.filter(c => c.status === 'CONNECTED').length;
  const errorCount = connections.filter(c => c.status === 'ERROR').length;
  const totalQueries = connections.reduce((sum, c) => sum + (c.queryCount || 0), 0);

  return (
    <AdminLayout 
      title="데이터베이스 연결" 
      description="데이터베이스 연결 관리 및 모니터링"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 연결</div>
          <div className="stat-value">{connections.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">● 활성</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{connectedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✗ 오류</div>
          <div className="stat-value" style={{ color: errorCount > 0 ? '#ef4444' : 'inherit' }}>{errorCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📊 총 쿼리</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>{totalQueries.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 연결명 또는 호스트..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="all">전체 유형</option>
          <option value="MYSQL">MySQL</option>
          <option value="POSTGRESQL">PostgreSQL</option>
          <option value="MONGODB">MongoDB</option>
          <option value="REDIS">Redis</option>
          <option value="ELASTICSEARCH">Elasticsearch</option>
          <option value="ORACLE">Oracle</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'CONNECTED', 'DISCONNECTED', 'ERROR'].map(status => {
            const config = status !== 'all' ? getStatusConfig(status) : null;
            return (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '전체' : config?.label}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 새 연결</button>
      </div>

      {/* Connections Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filteredConnections.map(conn => {
            const statusConfig = getStatusConfig(conn.status);
            const typeConfig = getTypeConfig(conn.type);
            return (
              <div key={conn.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedConnection(conn)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{typeConfig.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{conn.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{conn.type}</div>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                  <code style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {conn.host}:{conn.port}/{conn.database}
                  </code>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Pool</div>
                    <div style={{ fontWeight: 500 }}>{conn.pool.current}/{conn.pool.max}</div>
                  </div>
                  {conn.latency !== undefined && (
                    <div>
                      <div style={{ color: 'var(--color-text-muted)' }}>지연</div>
                      <div style={{ fontWeight: 500, color: conn.latency < 5 ? '#10b981' : conn.latency < 20 ? '#f59e0b' : '#ef4444' }}>{conn.latency}ms</div>
                    </div>
                  )}
                  {conn.lastConnected && (
                    <div>
                      <div style={{ color: 'var(--color-text-muted)' }}>연결</div>
                      <div style={{ fontWeight: 500 }}>{getTimeAgo(conn.lastConnected)}</div>
                    </div>
                  )}
                </div>

                {conn.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {conn.tags.map(tag => (
                      <span key={tag} style={{ padding: '2px 6px', background: '#3b82f620', color: '#3b82f6', borderRadius: '4px', fontSize: '0.7rem' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedConnection && (
        <div className="modal-overlay active" onClick={() => setSelectedConnection(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedConnection.type).icon} {selectedConnection.name}</h3>
              <button className="modal-close" onClick={() => setSelectedConnection(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>유형</div>
                  <div>{selectedConnection.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>상태</div>
                  <span style={{ padding: '4px 10px', background: getStatusConfig(selectedConnection.status).bg, color: getStatusConfig(selectedConnection.status).color, borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                    {getStatusConfig(selectedConnection.status).label}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>연결 문자열</div>
                  <code style={{ fontSize: '0.85rem' }}>{selectedConnection.host}:{selectedConnection.port}/{selectedConnection.database}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>사용자</div>
                  <div>{selectedConnection.username}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>SSL</div>
                  <div>{selectedConnection.ssl ? '🔒 사용' : '❌ 미사용'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Connection Pool</div>
                  <div>Min: {selectedConnection.pool.min} / Max: {selectedConnection.pool.max} / 현재: {selectedConnection.pool.current}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>지연 시간</div>
                  <div>{selectedConnection.latency !== undefined ? `${selectedConnection.latency}ms` : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>총 쿼리</div>
                  <div>{selectedConnection.queryCount?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>오류</div>
                  <div style={{ color: selectedConnection.errorCount ? '#ef4444' : 'inherit' }}>{selectedConnection.errorCount || 0}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedConnection.status === 'CONNECTED' && <button className="btn btn-warning">연결 끊기</button>}
              {selectedConnection.status !== 'CONNECTED' && <button className="btn btn-primary">연결 시도</button>}
              <button className="btn btn-secondary">테스트</button>
              <button className="btn btn-ghost" onClick={() => setSelectedConnection(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Connection Modal */}
      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">+ 새 연결 추가</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">연결 이름</label>
                <input type="text" className="form-input" placeholder="my-database" />
              </div>
              <div className="form-group">
                <label className="form-label">데이터베이스 유형</label>
                <select className="form-input">
                  <option value="MYSQL">MySQL</option>
                  <option value="POSTGRESQL">PostgreSQL</option>
                  <option value="MONGODB">MongoDB</option>
                  <option value="REDIS">Redis</option>
                  <option value="ELASTICSEARCH">Elasticsearch</option>
                  <option value="ORACLE">Oracle</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">호스트</label>
                  <input type="text" className="form-input" placeholder="localhost" />
                </div>
                <div className="form-group">
                  <label className="form-label">포트</label>
                  <input type="number" className="form-input" placeholder="3306" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">데이터베이스명</label>
                <input type="text" className="form-input" placeholder="mydb" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">사용자명</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">비밀번호</label>
                  <input type="password" className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" />
                  <span>SSL 사용</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>취소</button>
              <button className="btn btn-secondary">연결 테스트</button>
              <button className="btn btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

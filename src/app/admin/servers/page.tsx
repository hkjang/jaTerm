'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Server {
  id: string;
  name: string;
  hostname: string;
  port: number;
  environment: 'PROD' | 'STAGE' | 'DEV';
  authType: 'KEY' | 'PASSWORD';
  description: string;
  isActive: boolean;
  lastConnected: Date | null;
}

const mockServers: Server[] = [
  { id: '1', name: 'prod-web-01', hostname: '192.168.1.10', port: 22, environment: 'PROD', authType: 'KEY', description: 'Production Web Server 1', isActive: true, lastConnected: new Date() },
  { id: '2', name: 'prod-api-01', hostname: '192.168.1.11', port: 22, environment: 'PROD', authType: 'KEY', description: 'Production API Server 1', isActive: true, lastConnected: new Date(Date.now() - 3600000) },
  { id: '3', name: 'stage-web-01', hostname: '192.168.2.10', port: 22, environment: 'STAGE', authType: 'KEY', description: 'Staging Web Server', isActive: true, lastConnected: new Date(Date.now() - 86400000) },
  { id: '4', name: 'dev-server-01', hostname: '192.168.3.10', port: 22, environment: 'DEV', authType: 'PASSWORD', description: 'Development Server', isActive: true, lastConnected: null },
  { id: '5', name: 'dev-database', hostname: '192.168.3.20', port: 22, environment: 'DEV', authType: 'KEY', description: 'Development Database', isActive: false, lastConnected: new Date(Date.now() - 604800000) },
];

export default function ServersPage() {
  const [servers, setServers] = useState(mockServers);
  const [envFilter, setEnvFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const filteredServers = servers.filter(server => {
    return !envFilter || server.environment === envFilter;
  });

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      <aside className="sidebar" style={{ position: 'relative', height: '100vh' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="header-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>⌘</div>
          <span style={{ fontWeight: 600 }}>jaTerm Admin</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Overview</div>
            <Link href="/admin" className="sidebar-link"><span className="sidebar-link-icon">📊</span><span>대시보드</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Management</div>
            <Link href="/admin/users" className="sidebar-link"><span className="sidebar-link-icon">👥</span><span>사용자 관리</span></Link>
            <Link href="/admin/servers" className="sidebar-link active"><span className="sidebar-link-icon">🖥️</span><span>서버 관리</span></Link>
            <Link href="/admin/policies" className="sidebar-link"><span className="sidebar-link-icon">📋</span><span>정책 관리</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Monitoring</div>
            <Link href="/admin/sessions" className="sidebar-link"><span className="sidebar-link-icon">📺</span><span>세션 관제</span></Link>
            <Link href="/admin/audit" className="sidebar-link"><span className="sidebar-link-icon">📝</span><span>감사 로그</span></Link>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>서버 관리</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>SSH 접속 대상 서버 등록 및 관리</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 서버 등록
          </button>
        </div>

        {/* Environment Stats */}
        <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {['PROD', 'STAGE', 'DEV'].map(env => {
            const count = servers.filter(s => s.environment === env).length;
            const activeCount = servers.filter(s => s.environment === env && s.isActive).length;
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
                <div style={{ fontSize: '2rem', fontWeight: 700, color: getEnvColor(env) }}>{count}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {activeCount} 활성
                </div>
              </div>
            );
          })}
        </div>

        {/* Servers Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>서버</th>
                  <th>환경</th>
                  <th>호스트</th>
                  <th>인증</th>
                  <th>상태</th>
                  <th>최근 접속</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredServers.map(server => (
                  <tr key={server.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{server.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{server.description}</div>
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
                      <span className={`badge ${server.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {server.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {server.lastConnected ? new Date(server.lastConnected).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm">연결 테스트</button>
                        <button className="btn btn-ghost btn-sm">수정</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Server Modal */}
        {showModal && (
          <div className="modal-overlay active" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">서버 등록</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">서버 이름</label>
                  <input type="text" className="form-input" placeholder="prod-web-01" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">호스트 주소</label>
                    <input type="text" className="form-input" placeholder="192.168.1.10" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">포트</label>
                    <input type="number" className="form-input" defaultValue={22} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">환경</label>
                  <select className="form-input form-select">
                    <option value="DEV">Development</option>
                    <option value="STAGE">Staging</option>
                    <option value="PROD">Production</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">인증 방식</label>
                  <select className="form-input form-select">
                    <option value="KEY">SSH Key</option>
                    <option value="PASSWORD">Password</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">사용자명</label>
                  <input type="text" className="form-input" placeholder="root" />
                </div>
                <div className="form-group">
                  <label className="form-label">설명</label>
                  <input type="text" className="form-input" placeholder="서버 설명..." />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button className="btn btn-primary">등록</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

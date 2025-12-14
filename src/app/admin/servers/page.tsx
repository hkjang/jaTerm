'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Server {
  id: string;
  name: string;
  hostname: string;
  port: number;
  environment: 'PROD' | 'STAGE' | 'DEV';
  authType: 'KEY' | 'PASSWORD';
  description: string;
  tags: string[];
  isActive: boolean;
  isAlive: boolean;
  lastConnected: Date | null;
}

const mockServers: Server[] = [
  { id: '1', name: 'prod-web-01', hostname: '192.168.1.10', port: 22, environment: 'PROD', authType: 'KEY', description: 'Production Web Server 1', tags: ['web', 'nginx'], isActive: true, isAlive: true, lastConnected: new Date() },
  { id: '2', name: 'prod-api-01', hostname: '192.168.1.11', port: 22, environment: 'PROD', authType: 'KEY', description: 'Production API Server 1', tags: ['api', 'node'], isActive: true, isAlive: true, lastConnected: new Date(Date.now() - 3600000) },
  { id: '3', name: 'stage-web-01', hostname: '192.168.2.10', port: 22, environment: 'STAGE', authType: 'KEY', description: 'Staging Web Server', tags: ['web'], isActive: true, isAlive: true, lastConnected: new Date(Date.now() - 86400000) },
  { id: '4', name: 'dev-server-01', hostname: '192.168.3.10', port: 22, environment: 'DEV', authType: 'PASSWORD', description: 'Development Server', tags: ['dev'], isActive: true, isAlive: false, lastConnected: null },
  { id: '5', name: 'dev-database', hostname: '192.168.3.20', port: 22, environment: 'DEV', authType: 'KEY', description: 'Development Database', tags: ['db', 'mysql'], isActive: false, isAlive: false, lastConnected: new Date(Date.now() - 604800000) },
];

export default function ServersPage() {
  const [servers, setServers] = useState(mockServers);
  const [envFilter, setEnvFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const filteredServers = servers.filter(server => !envFilter || server.environment === envFilter);

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <AdminLayout title="서버 관리" description="SSH 접속 대상 서버 등록 및 상태 관리"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 서버 등록</button>}>

      {/* Environment Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {['PROD', 'STAGE', 'DEV'].map(env => {
          const count = servers.filter(s => s.environment === env).length;
          const aliveCount = servers.filter(s => s.environment === env && s.isAlive).length;
          return (
            <div key={env} className="card" style={{ padding: '20px', borderLeft: `3px solid ${getEnvColor(env)}`, cursor: 'pointer', background: envFilter === env ? 'var(--color-surface)' : undefined }}
              onClick={() => setEnvFilter(envFilter === env ? '' : env)}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{env === 'PROD' ? 'Production' : env === 'STAGE' ? 'Staging' : 'Development'}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: getEnvColor(env) }}>{count}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{aliveCount} Alive</div>
            </div>
          );
        })}
      </div>

      {/* Servers Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>서버</th><th>환경</th><th>호스트</th><th>인증</th><th>태그</th><th>상태</th><th>최근 접속</th><th>작업</th></tr></thead>
            <tbody>
              {filteredServers.map(server => (
                <tr key={server.id}>
                  <td><div style={{ fontWeight: 500 }}>{server.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{server.description}</div></td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: getEnvColor(server.environment) + '20', color: getEnvColor(server.environment) }}>{server.environment}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{server.hostname}:{server.port}</td>
                  <td><span className={`badge ${server.authType === 'KEY' ? 'badge-success' : 'badge-warning'}`}>{server.authType === 'KEY' ? '🔑 Key' : '🔒 Password'}</span></td>
                  <td>{server.tags.map(t => <span key={t} className="badge badge-info" style={{ marginRight: '4px', fontSize: '0.65rem' }}>{t}</span>)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={`badge ${server.isActive ? 'badge-success' : 'badge-danger'}`}>{server.isActive ? '활성' : '비활성'}</span>
                      <span style={{ color: server.isAlive ? 'var(--color-success)' : 'var(--color-danger)' }}>{server.isAlive ? '● Alive' : '○ Down'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{server.lastConnected ? new Date(server.lastConnected).toLocaleDateString() : '-'}</td>
                  <td><div style={{ display: 'flex', gap: '8px' }}><button className="btn btn-ghost btn-sm">🔄 체크</button><button className="btn btn-ghost btn-sm">수정</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">서버 등록</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">서버 이름</label><input type="text" className="form-input" placeholder="prod-web-01" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group"><label className="form-label">호스트 주소</label><input type="text" className="form-input" placeholder="192.168.1.10" /></div>
                <div className="form-group"><label className="form-label">포트</label><input type="number" className="form-input" defaultValue={22} /></div>
              </div>
              <div className="form-group"><label className="form-label">환경</label><select className="form-input form-select"><option value="DEV">Development</option><option value="STAGE">Staging</option><option value="PROD">Production</option></select></div>
              <div className="form-group"><label className="form-label">인증 방식</label><select className="form-input form-select"><option value="KEY">SSH Key (권장)</option><option value="PASSWORD">Password</option></select></div>
              <div className="form-group"><label className="form-label">태그 (쉼표 구분)</label><input type="text" className="form-input" placeholder="web, nginx" /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">등록</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

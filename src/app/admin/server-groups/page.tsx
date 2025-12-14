'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ServerGroup {
  id: string;
  name: string;
  description: string;
  environment: string;
  serverCount: number;
  servers: { id: string; name: string; hostname: string }[];
}

const mockServerGroups: ServerGroup[] = [
  { id: '1', name: 'Production Web', description: '프로덕션 웹 서버', environment: 'PROD', serverCount: 3,
    servers: [{ id: '1', name: 'prod-web-01', hostname: '192.168.1.10' }, { id: '2', name: 'prod-web-02', hostname: '192.168.1.11' }]},
  { id: '2', name: 'Production API', description: '프로덕션 API 서버', environment: 'PROD', serverCount: 2,
    servers: [{ id: '3', name: 'prod-api-01', hostname: '192.168.1.20' }]},
  { id: '3', name: 'Staging All', description: '스테이징 환경', environment: 'STAGE', serverCount: 4,
    servers: [{ id: '4', name: 'stage-web-01', hostname: '192.168.2.10' }]},
  { id: '4', name: 'Development', description: '개발 환경 서버', environment: 'DEV', serverCount: 2,
    servers: [{ id: '5', name: 'dev-server-01', hostname: '192.168.3.10' }]},
];

export default function ServerGroupsPage() {
  const [groups] = useState(mockServerGroups);
  const [showModal, setShowModal] = useState(false);

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <AdminLayout title="서버 그룹" description="서버를 논리적으로 그룹화하여 관리"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 그룹 추가</button>}>
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">PROD 그룹</div><div className="stat-value">{groups.filter(g => g.environment === 'PROD').length}</div></div>
        <div className="stat-card"><div className="stat-label">STAGE 그룹</div><div className="stat-value">{groups.filter(g => g.environment === 'STAGE').length}</div></div>
        <div className="stat-card"><div className="stat-label">DEV 그룹</div><div className="stat-value">{groups.filter(g => g.environment === 'DEV').length}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {groups.map(group => (
          <div key={group.id} className="card" style={{ padding: '20px', borderTop: `3px solid ${getEnvColor(group.environment)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h3 style={{ fontWeight: 600 }}>{group.name}</h3>
                  <span className={`badge badge-${group.environment === 'PROD' ? 'danger' : group.environment === 'STAGE' ? 'warning' : 'success'}`}>{group.environment}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{group.description}</p>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getEnvColor(group.environment) }}>{group.serverCount}</div>
            </div>
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              {group.servers.slice(0, 2).map(server => (
                <div key={server.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>{server.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{server.hostname}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="btn btn-ghost btn-sm">수정</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">서버 그룹 추가</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">그룹 이름</label><input type="text" className="form-input" placeholder="Production Web" /></div>
              <div className="form-group"><label className="form-label">설명</label><input type="text" className="form-input" placeholder="프로덕션 웹 서버 그룹" /></div>
              <div className="form-group"><label className="form-label">환경</label><select className="form-input form-select"><option value="DEV">Development</option><option value="STAGE">Staging</option><option value="PROD">Production</option></select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">추가</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

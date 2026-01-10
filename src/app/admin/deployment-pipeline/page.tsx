'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Deployment {
  id: string;
  name: string;
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
  version: string;
  status: 'DEPLOYED' | 'DEPLOYING' | 'FAILED' | 'ROLLED_BACK';
  replicas: { current: number; desired: number };
  image: string;
  deployedAt: string;
  deployedBy: string;
  healthCheck: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';
}

export default function DeploymentPipelinePage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeploy, setSelectedDeploy] = useState<Deployment | null>(null);
  const [success, setSuccess] = useState('');
  const [filterEnv, setFilterEnv] = useState('all');

  useEffect(() => {
    setDeployments([
      { id: '1', name: 'api-server', environment: 'PRODUCTION', version: 'v2.4.1', status: 'DEPLOYED', replicas: { current: 5, desired: 5 }, image: 'jaterm/api:v2.4.1', deployedAt: '2026-01-10 10:30', deployedBy: 'admin@jaterm.io', healthCheck: 'HEALTHY' },
      { id: '2', name: 'web-frontend', environment: 'PRODUCTION', version: 'v3.1.0', status: 'DEPLOYED', replicas: { current: 3, desired: 3 }, image: 'jaterm/web:v3.1.0', deployedAt: '2026-01-09 18:00', deployedBy: 'dev@jaterm.io', healthCheck: 'HEALTHY' },
      { id: '3', name: 'api-server', environment: 'STAGING', version: 'v2.5.0-beta', status: 'DEPLOYING', replicas: { current: 2, desired: 3 }, image: 'jaterm/api:v2.5.0-beta', deployedAt: '2026-01-10 14:20', deployedBy: 'ci-bot', healthCheck: 'UNKNOWN' },
      { id: '4', name: 'worker-service', environment: 'PRODUCTION', version: 'v1.8.3', status: 'DEPLOYED', replicas: { current: 4, desired: 4 }, image: 'jaterm/worker:v1.8.3', deployedAt: '2026-01-08 14:15', deployedBy: 'ops@jaterm.io', healthCheck: 'HEALTHY' },
      { id: '5', name: 'notification-service', environment: 'STAGING', version: 'v1.2.0', status: 'FAILED', replicas: { current: 0, desired: 2 }, image: 'jaterm/notify:v1.2.0', deployedAt: '2026-01-10 13:45', deployedBy: 'dev@jaterm.io', healthCheck: 'UNHEALTHY' },
      { id: '6', name: 'api-server', environment: 'DEVELOPMENT', version: 'v2.6.0-dev', status: 'DEPLOYED', replicas: { current: 1, desired: 1 }, image: 'jaterm/api:latest', deployedAt: '2026-01-10 14:25', deployedBy: 'developer', healthCheck: 'HEALTHY' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleRollback = (d: Deployment) => { if (confirm('이전 버전으로 롤백?')) { setDeployments(deployments.map(dep => dep.id === d.id ? { ...dep, status: 'ROLLED_BACK' } : dep)); setSuccess(`${d.name} 롤백됨`); setSelectedDeploy(null); } };
  const handleRestart = (d: Deployment) => { setDeployments(deployments.map(dep => dep.id === d.id ? { ...dep, status: 'DEPLOYING', replicas: { ...dep.replicas, current: 0 } } : dep)); setSuccess(`${d.name} 재시작 중...`); setTimeout(() => setDeployments(prev => prev.map(dep => dep.id === d.id ? { ...dep, status: 'DEPLOYED', replicas: { ...dep.replicas, current: dep.replicas.desired } } : dep)), 3000); };
  const handleScale = (d: Deployment, count: number) => { setDeployments(deployments.map(dep => dep.id === d.id ? { ...dep, replicas: { ...dep.replicas, desired: count } } : dep)); setSuccess(`${d.name} 스케일 조정됨: ${count}`); };

  const getStatusColor = (s: string) => ({ DEPLOYED: '#10b981', DEPLOYING: '#3b82f6', FAILED: '#ef4444', ROLLED_BACK: '#f59e0b' }[s] || '#6b7280');
  const getEnvColor = (e: string) => ({ PRODUCTION: '#ef4444', STAGING: '#f59e0b', DEVELOPMENT: '#3b82f6' }[e] || '#6b7280');
  const getHealthIcon = (h: string) => ({ HEALTHY: '💚', UNHEALTHY: '💔', UNKNOWN: '❓' }[h] || '❓');
  const filtered = deployments.filter(d => filterEnv === 'all' || d.environment === filterEnv);

  return (
    <AdminLayout title="배포 파이프라인" description="애플리케이션 배포 관리" actions={<button className="btn btn-primary">🚀 새 배포</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 배포</div><div className="stat-value">{deployments.length}</div></div>
        <div className="stat-card"><div className="stat-label">💚 정상</div><div className="stat-value" style={{ color: '#10b981' }}>{deployments.filter(d => d.healthCheck === 'HEALTHY').length}</div></div>
        <div className="stat-card"><div className="stat-label">🚀 배포중</div><div className="stat-value" style={{ color: '#3b82f6' }}>{deployments.filter(d => d.status === 'DEPLOYING').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{deployments.filter(d => d.status === 'FAILED').length}</div></div>
      </div>
      <div style={{ marginBottom: 16 }}><select className="form-input" value={filterEnv} onChange={e => setFilterEnv(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 환경</option><option value="PRODUCTION">Production</option><option value="STAGING">Staging</option><option value="DEVELOPMENT">Development</option></select></div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(d => (
            <div key={d.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(d.status)}`, cursor: 'pointer' }} onClick={() => setSelectedDeploy(d)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{d.name}</span><div style={{ display: 'flex', gap: 6, marginTop: 4 }}><span style={{ padding: '2px 8px', background: `${getEnvColor(d.environment)}20`, color: getEnvColor(d.environment), borderRadius: 4, fontSize: '0.75rem' }}>{d.environment}</span><span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{d.version}</span></div></div>
                <span style={{ fontSize: '1.5rem' }}>{getHealthIcon(d.healthCheck)}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}><span>Replicas</span><span>{d.replicas.current}/{d.replicas.desired}</span></div>
                <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 4, height: 6, overflow: 'hidden' }}><div style={{ width: `${(d.replicas.current / d.replicas.desired) * 100}%`, height: '100%', background: getStatusColor(d.status), transition: 'width 0.3s' }} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}><span>{d.deployedBy}</span><span>{d.deployedAt}</span></div>
            </div>
          ))}
        </div>
      )}
      {selectedDeploy && (
        <div className="modal-overlay active" onClick={() => setSelectedDeploy(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🚀 {selectedDeploy.name}</h3><button className="modal-close" onClick={() => setSelectedDeploy(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getEnvColor(selectedDeploy.environment)}20`, color: getEnvColor(selectedDeploy.environment), borderRadius: 6 }}>{selectedDeploy.environment}</span><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedDeploy.status)}20`, color: getStatusColor(selectedDeploy.status), borderRadius: 6 }}>{selectedDeploy.status}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>버전:</b> {selectedDeploy.version}</div><div><b>상태:</b> {getHealthIcon(selectedDeploy.healthCheck)} {selectedDeploy.healthCheck}</div>
              <div><b>Replicas:</b> {selectedDeploy.replicas.current}/{selectedDeploy.replicas.desired}</div><div><b>배포자:</b> {selectedDeploy.deployedBy}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: 16 }}>{selectedDeploy.image}</div>
            <div className="form-group"><label className="form-label">스케일 조정</label><input type="range" min={1} max={10} value={selectedDeploy.replicas.desired} onChange={e => handleScale(selectedDeploy, parseInt(e.target.value))} style={{ width: '100%' }} /><div style={{ textAlign: 'center' }}>{selectedDeploy.replicas.desired} 인스턴스</div></div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleRestart(selectedDeploy)}>🔄 재시작</button><button className="btn btn-warning" onClick={() => handleRollback(selectedDeploy)}>⏪ 롤백</button><button className="btn btn-ghost" onClick={() => setSelectedDeploy(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

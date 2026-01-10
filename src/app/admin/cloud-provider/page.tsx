'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CloudProvider {
  id: string;
  name: string;
  type: 'AWS' | 'GCP' | 'AZURE' | 'ALIBABA' | 'NCLOUD' | 'ON_PREMISE';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';
  region: string;
  accountId: string;
  resources: { instances: number; databases: number; storage: number; networks: number };
  lastSync: string;
  monthlyCost: number;
  credentials: { type: string; expiresAt: string };
}

export default function CloudProviderPage() {
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'AWS', region: '', accountId: '', accessKey: '', secretKey: '' });

  useEffect(() => {
    const mock: CloudProvider[] = [
      { id: '1', name: 'AWS Production', type: 'AWS', status: 'CONNECTED', region: 'ap-northeast-2', accountId: '123456789012', resources: { instances: 45, databases: 8, storage: 15, networks: 12 }, lastSync: '2026-01-10 13:00', monthlyCost: 15420.50, credentials: { type: 'IAM Role', expiresAt: '2027-01-10' } },
      { id: '2', name: 'GCP Analytics', type: 'GCP', status: 'CONNECTED', region: 'asia-northeast3', accountId: 'my-project-12345', resources: { instances: 12, databases: 3, storage: 8, networks: 4 }, lastSync: '2026-01-10 12:55', monthlyCost: 4850.00, credentials: { type: 'Service Account', expiresAt: 'No Expiry' } },
      { id: '3', name: 'Azure Staging', type: 'AZURE', status: 'SYNCING', region: 'koreacentral', accountId: 'sub-abc-123-def', resources: { instances: 8, databases: 2, storage: 5, networks: 3 }, lastSync: '2026-01-10 12:30', monthlyCost: 2100.00, credentials: { type: 'App Registration', expiresAt: '2026-06-15' } },
      { id: '4', name: 'NCloud DR', type: 'NCLOUD', status: 'CONNECTED', region: 'KR', accountId: 'ncloud-acc-001', resources: { instances: 4, databases: 1, storage: 3, networks: 2 }, lastSync: '2026-01-10 11:00', monthlyCost: 890.00, credentials: { type: 'API Key', expiresAt: '2026-12-31' } },
      { id: '5', name: 'On-Premise DC', type: 'ON_PREMISE', status: 'CONNECTED', region: 'Seoul DC1', accountId: 'local', resources: { instances: 120, databases: 15, storage: 50, networks: 20 }, lastSync: '2026-01-10 13:10', monthlyCost: 0, credentials: { type: 'Local', expiresAt: 'N/A' } },
      { id: '6', name: 'AWS Legacy', type: 'AWS', status: 'ERROR', region: 'us-east-1', accountId: '098765432100', resources: { instances: 0, databases: 0, storage: 0, networks: 0 }, lastSync: '2026-01-08 09:00', monthlyCost: 0, credentials: { type: 'IAM User', expiresAt: '2025-12-01' } },
    ];
    setProviders(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newProvider: CloudProvider = {
      id: String(providers.length + 1), name: formData.name, type: formData.type as CloudProvider['type'], status: 'SYNCING', region: formData.region, accountId: formData.accountId, resources: { instances: 0, databases: 0, storage: 0, networks: 0 }, lastSync: '-', monthlyCost: 0, credentials: { type: 'API Key', expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    };
    setProviders([newProvider, ...providers]);
    setSuccess('프로바이더가 추가되었습니다.');
    setShowCreateModal(false);
    setFormData({ name: '', type: 'AWS', region: '', accountId: '', accessKey: '', secretKey: '' });
    setTimeout(() => { setProviders(prev => prev.map(p => p.id === newProvider.id ? { ...p, status: 'CONNECTED', lastSync: new Date().toLocaleString('ko-KR') } : p)); }, 3000);
  };

  const handleSync = (provider: CloudProvider) => { setProviders(providers.map(p => p.id === provider.id ? { ...p, status: 'SYNCING' } : p)); setSuccess(`${provider.name} 동기화 시작`); setTimeout(() => { setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, status: 'CONNECTED', lastSync: new Date().toLocaleString('ko-KR') } : p)); setSuccess(`${provider.name} 동기화 완료`); }, 3000); };
  const handleDisconnect = (provider: CloudProvider) => { if (confirm('연결을 해제하시겠습니까?')) { setProviders(providers.map(p => p.id === provider.id ? { ...p, status: 'DISCONNECTED' } : p)); setSuccess('연결이 해제되었습니다.'); } };
  const handleDelete = (id: string) => { if (confirm('삭제하시겠습니까?')) { setProviders(providers.filter(p => p.id !== id)); setSuccess('삭제되었습니다.'); setSelectedProvider(null); } };

  const getTypeIcon = (t: string) => ({ AWS: '☁️', GCP: '🔷', AZURE: '🔵', ALIBABA: '🟠', NCLOUD: '🟢', ON_PREMISE: '🏢' }[t] || '☁️');
  const getTypeColor = (t: string) => ({ AWS: '#ff9900', GCP: '#4285f4', AZURE: '#0078d4', ALIBABA: '#ff6a00', NCLOUD: '#03cf5d', ON_PREMISE: '#6b7280' }[t] || '#6b7280');
  const getStatusStyle = (s: string) => ({ CONNECTED: '#10b981', DISCONNECTED: '#6b7280', ERROR: '#ef4444', SYNCING: '#3b82f6' }[s] || '#6b7280');
  const getStatusLabel = (s: string) => ({ CONNECTED: '🟢 연결됨', DISCONNECTED: '⚫ 해제됨', ERROR: '🔴 오류', SYNCING: '🔄 동기화중' }[s] || s);

  const totalResources = providers.reduce((acc, p) => ({ instances: acc.instances + p.resources.instances, databases: acc.databases + p.resources.databases, storage: acc.storage + p.resources.storage, networks: acc.networks + p.resources.networks }), { instances: 0, databases: 0, storage: 0, networks: 0 });
  const totalCost = providers.reduce((acc, p) => acc + p.monthlyCost, 0);

  return (
    <AdminLayout title="클라우드 프로바이더" description="멀티 클라우드 연결 및 리소스 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 프로바이더 추가</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>❌ {error}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">프로바이더</div><div className="stat-value">{providers.length}</div></div>
        <div className="stat-card"><div className="stat-label">🖥️ 인스턴스</div><div className="stat-value">{totalResources.instances}</div></div>
        <div className="stat-card"><div className="stat-label">🗄️ 데이터베이스</div><div className="stat-value">{totalResources.databases}</div></div>
        <div className="stat-card"><div className="stat-label">🌐 네트워크</div><div className="stat-value">{totalResources.networks}</div></div>
        <div className="stat-card"><div className="stat-label">💰 월 비용</div><div className="stat-value">${totalCost.toLocaleString()}</div></div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {providers.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${getTypeColor(p.type)}` }} onClick={() => setSelectedProvider(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: '2rem' }}>{getTypeIcon(p.type)}</span><div><div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{p.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.type} · {p.region}</div></div></div>
                <span style={{ padding: '4px 10px', background: `${getStatusStyle(p.status)}20`, color: getStatusStyle(p.status), borderRadius: 6, fontSize: '0.75rem' }}>{getStatusLabel(p.status)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12, textAlign: 'center' }}>
                <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.resources.instances}</div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>인스턴스</div></div>
                <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.resources.databases}</div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>DB</div></div>
                <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.resources.storage}</div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>스토리지</div></div>
                <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.resources.networks}</div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>네트워크</div></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}><span>마지막 동기화: {p.lastSync}</span>{p.monthlyCost > 0 && <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>💰 ${p.monthlyCost.toLocaleString()}/월</span>}</div>
            </div>
          ))}
        </div>
      )}

      {selectedProvider && (
        <div className="modal-overlay active" onClick={() => setSelectedProvider(null)}>
          <div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedProvider.type)} {selectedProvider.name}</h3><button className="modal-close" onClick={() => setSelectedProvider(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getTypeColor(selectedProvider.type)}20`, color: getTypeColor(selectedProvider.type), borderRadius: 6 }}>{selectedProvider.type}</span><span style={{ padding: '4px 10px', background: `${getStatusStyle(selectedProvider.status)}20`, color: getStatusStyle(selectedProvider.status), borderRadius: 6 }}>{getStatusLabel(selectedProvider.status)}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><div>지역: <b>{selectedProvider.region}</b></div><div>Account: <b style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{selectedProvider.accountId}</b></div><div>마지막 동기화: <b>{selectedProvider.lastSync}</b></div><div>월 비용: <b style={{ color: '#f59e0b' }}>${selectedProvider.monthlyCost.toLocaleString()}</b></div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedProvider.resources.instances}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>인스턴스</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedProvider.resources.databases}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>DB</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedProvider.resources.storage}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>스토리지</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedProvider.resources.networks}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>네트워크</div></div>
              </div>
              <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8 }}><b>인증 정보</b><div style={{ marginTop: 8, fontSize: '0.85rem' }}>유형: {selectedProvider.credentials.type} · 만료: {selectedProvider.credentials.expiresAt}</div></div>
            </div>
            <div className="modal-footer">{selectedProvider.status !== 'SYNCING' && <button className="btn btn-secondary" onClick={() => { handleSync(selectedProvider); setSelectedProvider(null); }}>🔄 동기화</button>}{selectedProvider.status === 'CONNECTED' && <button className="btn btn-ghost" onClick={() => { handleDisconnect(selectedProvider); setSelectedProvider(null); }}>🔌 연결 해제</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedProvider.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedProvider(null)}>닫기</button></div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">☁️ 프로바이더 추가</h3><button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="AWS Production" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="AWS">☁️ AWS</option><option value="GCP">🔷 GCP</option><option value="AZURE">🔵 Azure</option><option value="NCLOUD">🟢 NCloud</option><option value="ALIBABA">🟠 Alibaba</option><option value="ON_PREMISE">🏢 On-Premise</option></select></div>
                  <div className="form-group"><label className="form-label">지역</label><input className="form-input" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="ap-northeast-2" /></div>
                </div>
                <div className="form-group"><label className="form-label">Account ID</label><input className="form-input" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Access Key</label><input className="form-input" type="password" value={formData.accessKey} onChange={e => setFormData({...formData, accessKey: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Secret Key</label><input className="form-input" type="password" value={formData.secretKey} onChange={e => setFormData({...formData, secretKey: e.target.value})} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button><button type="submit" className="btn btn-primary">연결</button></div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface PluginItem {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: 'AUTHENTICATION' | 'INTEGRATION' | 'SECURITY' | 'UI' | 'UTILITY';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'UPDATING';
  installedAt: string;
  updatedAt: string;
  hasUpdate: boolean;
  latestVersion: string | null;
  usageCount: number;
  config: Record<string, string>;
}

export default function PluginMarketplacePage() {
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setPlugins([
      { id: '1', name: 'LDAP Connector', version: '2.5.0', author: 'jaTerm', description: 'Active Directory / LDAP 인증 연동', category: 'AUTHENTICATION', status: 'ACTIVE', installedAt: '2025-06-01', updatedAt: '2026-01-05', hasUpdate: true, latestVersion: '2.6.0', usageCount: 1250, config: { server: 'ldap.company.com', baseDn: 'dc=company,dc=com' } },
      { id: '2', name: 'Slack Notifications', version: '1.8.2', author: 'jaTerm', description: 'Slack으로 알림 전송', category: 'INTEGRATION', status: 'ACTIVE', installedAt: '2025-03-15', updatedAt: '2025-12-20', hasUpdate: false, latestVersion: null, usageCount: 890, config: { webhook: 'https://hooks.slack.com/...' } },
      { id: '3', name: 'SSH Key Vault', version: '3.1.0', author: 'SecureTools', description: 'SSH 키 안전 저장 및 관리', category: 'SECURITY', status: 'ACTIVE', installedAt: '2025-01-10', updatedAt: '2025-11-15', hasUpdate: true, latestVersion: '3.2.1', usageCount: 2150, config: { vault: 'hashicorp-vault' } },
      { id: '4', name: 'Custom Theme Pack', version: '1.2.0', author: 'Community', description: '다크/라이트 커스텀 테마', category: 'UI', status: 'ACTIVE', installedAt: '2025-08-20', updatedAt: '2025-10-01', hasUpdate: false, latestVersion: null, usageCount: 450, config: {} },
      { id: '5', name: 'Session Export', version: '2.0.1', author: 'jaTerm', description: '세션 녹화 내보내기', category: 'UTILITY', status: 'INACTIVE', installedAt: '2025-04-05', updatedAt: '2025-09-10', hasUpdate: true, latestVersion: '2.1.0', usageCount: 320, config: { format: 'mp4' } },
      { id: '6', name: 'MFA Enforcer', version: '1.0.0', author: 'SecureTools', description: 'MFA 강제 정책 적용', category: 'SECURITY', status: 'ERROR', installedAt: '2026-01-08', updatedAt: '2026-01-08', hasUpdate: false, latestVersion: null, usageCount: 0, config: {} },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleToggle = (p: PluginItem) => { setPlugins(plugins.map(pl => pl.id === p.id ? { ...pl, status: pl.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : pl)); setSuccess(`${p.name} ${p.status === 'ACTIVE' ? '비활성화' : '활성화'}됨`); };
  const handleUpdate = (p: PluginItem) => { setPlugins(plugins.map(pl => pl.id === p.id ? { ...pl, status: 'UPDATING' } : pl)); setTimeout(() => { setPlugins(plugins.map(pl => pl.id === p.id ? { ...pl, status: 'ACTIVE', version: pl.latestVersion || pl.version, hasUpdate: false, latestVersion: null, updatedAt: new Date().toISOString().slice(0, 10) } : pl)); setSuccess(`${p.name} 업데이트됨`); }, 1500); };
  const handleUninstall = (id: string) => { if (confirm('삭제?')) { setPlugins(plugins.filter(p => p.id !== id)); setSuccess('삭제됨'); setSelectedPlugin(null); } };

  const getCategoryIcon = (c: string) => ({ AUTHENTICATION: '🔐', INTEGRATION: '🔗', SECURITY: '🛡️', UI: '🎨', UTILITY: '🔧' }[c] || '📦');
  const getCategoryColor = (c: string) => ({ AUTHENTICATION: '#8b5cf6', INTEGRATION: '#3b82f6', SECURITY: '#ef4444', UI: '#f59e0b', UTILITY: '#10b981' }[c] || '#6b7280');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', INACTIVE: '#6b7280', ERROR: '#ef4444', UPDATING: '#3b82f6' }[s] || '#6b7280');

  const filtered = plugins.filter(p => (filterCategory === 'all' || p.category === filterCategory) && (search === '' || p.name.toLowerCase().includes(search.toLowerCase())));
  const updateCount = plugins.filter(p => p.hasUpdate).length;

  return (
    <AdminLayout title="플러그인 마켓" description="플러그인 및 확장 관리" actions={<button className="btn btn-primary">🛒 마켓 브라우저</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">설치된 플러그인</div><div className="stat-value">{plugins.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{plugins.filter(p => p.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔄 업데이트 가능</div><div className="stat-value" style={{ color: updateCount > 0 ? '#3b82f6' : 'inherit' }}>{updateCount}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 오류</div><div className="stat-value" style={{ color: '#ef4444' }}>{plugins.filter(p => p.status === 'ERROR').length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 플러그인 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 카테고리</option><option value="AUTHENTICATION">인증</option><option value="INTEGRATION">연동</option><option value="SECURITY">보안</option><option value="UI">UI</option><option value="UTILITY">유틸리티</option></select>
        {updateCount > 0 && <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}>🔄 모두 업데이트 ({updateCount})</button>}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ borderLeft: `4px solid ${getCategoryColor(p.category)}`, cursor: 'pointer', opacity: p.status === 'INACTIVE' ? 0.7 : 1 }} onClick={() => setSelectedPlugin(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div><span style={{ fontSize: '1.3rem', marginRight: 8 }}>{getCategoryIcon(p.category)}</span><span style={{ fontWeight: 700 }}>{p.name}</span></div>
                <span style={{ padding: '2px 8px', background: `${getStatusColor(p.status)}20`, color: getStatusColor(p.status), borderRadius: 4, fontSize: '0.75rem' }}>{p.status}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{p.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>v{p.version} · {p.author}</span>
                {p.hasUpdate && <span style={{ color: '#3b82f6' }}>🔄 v{p.latestVersion}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedPlugin && (
        <div className="modal-overlay active" onClick={() => setSelectedPlugin(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getCategoryIcon(selectedPlugin.category)} {selectedPlugin.name}</h3><button className="modal-close" onClick={() => setSelectedPlugin(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedPlugin.status)}20`, color: getStatusColor(selectedPlugin.status), borderRadius: 6 }}>{selectedPlugin.status}</span><span style={{ padding: '4px 10px', background: `${getCategoryColor(selectedPlugin.category)}20`, color: getCategoryColor(selectedPlugin.category), borderRadius: 6 }}>{selectedPlugin.category}</span></div>
            <p style={{ marginBottom: 16 }}>{selectedPlugin.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>버전:</b> v{selectedPlugin.version}</div><div><b>개발자:</b> {selectedPlugin.author}</div>
              <div><b>설치일:</b> {selectedPlugin.installedAt}</div><div><b>업데이트:</b> {selectedPlugin.updatedAt}</div>
              <div><b>사용량:</b> {selectedPlugin.usageCount.toLocaleString()}</div>
            </div>
            {selectedPlugin.hasUpdate && <div style={{ padding: 12, background: '#3b82f620', borderRadius: 8, color: '#3b82f6', marginBottom: 16 }}>🔄 새 버전 v{selectedPlugin.latestVersion} 사용 가능</div>}
            {Object.keys(selectedPlugin.config).length > 0 && <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>설정</div>{Object.entries(selectedPlugin.config).map(([k, v]) => <div key={k} style={{ fontSize: '0.85rem' }}><b>{k}:</b> <code>{v}</code></div>)}</div>}
          </div>
          <div className="modal-footer">{selectedPlugin.hasUpdate && <button className="btn btn-primary" onClick={() => { handleUpdate(selectedPlugin); setSelectedPlugin(null); }}>🔄 업데이트</button>}<button className="btn btn-secondary" onClick={() => handleToggle(selectedPlugin)}>{selectedPlugin.status === 'ACTIVE' ? '⏸️ 비활성화' : '▶️ 활성화'}</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleUninstall(selectedPlugin.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedPlugin(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

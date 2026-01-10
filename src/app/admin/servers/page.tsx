'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Server {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  port: number;
  type: 'LINUX' | 'WINDOWS' | 'CONTAINER' | 'DATABASE';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'WARNING';
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
  group?: string;
  cpu: number;
  memory: number;
  disk: number;
  lastSeen: string;
  tags: string[];
}

const initialServers: Server[] = [
  { id: '1', name: 'prod-db-01', hostname: 'prod-db-01.internal', ip: '10.0.1.10', port: 22, type: 'DATABASE', status: 'ONLINE', environment: 'PRODUCTION', group: 'Database', cpu: 45, memory: 72, disk: 68, lastSeen: '방금 전', tags: ['postgresql', 'primary'] },
  { id: '2', name: 'prod-api-01', hostname: 'prod-api-01.internal', ip: '10.0.1.20', port: 22, type: 'LINUX', status: 'ONLINE', environment: 'PRODUCTION', group: 'API', cpu: 32, memory: 58, disk: 45, lastSeen: '10초 전', tags: ['node', 'api'] },
  { id: '3', name: 'prod-web-01', hostname: 'prod-web-01.internal', ip: '10.0.1.30', port: 22, type: 'LINUX', status: 'WARNING', environment: 'PRODUCTION', group: 'Web', cpu: 85, memory: 78, disk: 52, lastSeen: '5초 전', tags: ['nginx', 'frontend'] },
  { id: '4', name: 'staging-api-01', hostname: 'staging-api-01.internal', ip: '10.0.2.20', port: 22, type: 'LINUX', status: 'ONLINE', environment: 'STAGING', group: 'API', cpu: 15, memory: 35, disk: 28, lastSeen: '30초 전', tags: ['staging'] },
  { id: '5', name: 'prod-k8s-master', hostname: 'k8s-master.internal', ip: '10.0.1.100', port: 22, type: 'CONTAINER', status: 'ONLINE', environment: 'PRODUCTION', group: 'Kubernetes', cpu: 28, memory: 45, disk: 38, lastSeen: '방금 전', tags: ['k8s', 'master'] },
  { id: '6', name: 'dev-server-01', hostname: 'dev-01.internal', ip: '10.0.3.10', port: 22, type: 'LINUX', status: 'ONLINE', environment: 'DEVELOPMENT', cpu: 12, memory: 25, disk: 42, lastSeen: '1분 전', tags: ['dev'] },
  { id: '7', name: 'windows-rdp-01', hostname: 'win-rdp-01.internal', ip: '10.0.3.50', port: 3389, type: 'WINDOWS', status: 'OFFLINE', environment: 'DEVELOPMENT', cpu: 0, memory: 0, disk: 65, lastSeen: '2시간 전', tags: ['windows', 'rdp'] },
  { id: '8', name: 'prod-db-02', hostname: 'prod-db-02.internal', ip: '10.0.1.11', port: 22, type: 'DATABASE', status: 'MAINTENANCE', environment: 'PRODUCTION', group: 'Database', cpu: 0, memory: 0, disk: 70, lastSeen: '5분 전', tags: ['postgresql', 'replica'] },
];

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [loading] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEnv, setFilterEnv] = useState('');
  const [form, setForm] = useState({ name: '', hostname: '', ip: '', port: 22, type: 'LINUX', environment: 'DEVELOPMENT', group: '', tags: '' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const resetForm = useCallback(() => {
    setForm({ name: '', hostname: '', ip: '', port: 22, type: 'LINUX', environment: 'DEVELOPMENT', group: '', tags: '' });
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newServer: Server = {
      id: String(Date.now()),
      name: form.name,
      hostname: form.hostname,
      ip: form.ip,
      port: form.port,
      type: form.type as Server['type'],
      environment: form.environment as Server['environment'],
      group: form.group || undefined,
      status: 'ONLINE',
      cpu: 0,
      memory: 0,
      disk: 0,
      lastSeen: '방금 전',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setServers([newServer, ...servers]);
    setSuccess('서버가 추가되었습니다.');
    setShowCreate(false);
    resetForm();
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return;
    setServers(servers.map(s => s.id === selectedServer.id ? {
      ...s,
      name: form.name,
      hostname: form.hostname,
      ip: form.ip,
      port: form.port,
      type: form.type as Server['type'],
      environment: form.environment as Server['environment'],
      group: form.group || undefined,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    } : s));
    setSuccess('수정되었습니다.');
    setShowEdit(false);
    setSelectedServer(null);
    resetForm();
  };

  const openEdit = (server: Server) => {
    setForm({ name: server.name, hostname: server.hostname, ip: server.ip, port: server.port, type: server.type, environment: server.environment, group: server.group || '', tags: server.tags.join(', ') });
    setSelectedServer(server);
    setShowEdit(true);
  };

  const handleConnect = (s: Server) => { setSuccess(`${s.name} 연결 중...`); };
  const handleMaintenance = (s: Server) => {
    setServers(servers.map(srv => srv.id === s.id ? { ...srv, status: srv.status === 'MAINTENANCE' ? 'ONLINE' : 'MAINTENANCE' } : srv));
    setSuccess(s.status === 'MAINTENANCE' ? '유지보수 해제됨' : '유지보수 모드 설정');
    setSelectedServer(null);
  };
  const handleDelete = (id: string) => {
    if (confirm('서버를 삭제하시겠습니까?')) {
      setServers(servers.filter(s => s.id !== id));
      setSuccess('삭제되었습니다.');
      setSelectedServer(null);
    }
  };

  const getStatusColor = (s: string) => ({ ONLINE: '#10b981', OFFLINE: '#6b7280', MAINTENANCE: '#3b82f6', WARNING: '#f59e0b' }[s] || '#6b7280');
  const getEnvColor = (e: string) => ({ PRODUCTION: '#ef4444', STAGING: '#f59e0b', DEVELOPMENT: '#10b981' }[e] || '#6b7280');
  const getTypeIcon = (t: string) => ({ LINUX: '🐧', WINDOWS: '🪟', CONTAINER: '🐳', DATABASE: '🗄️' }[t] || '🖥️');

  const filtered = servers.filter(s => (filterEnv === '' || s.environment === filterEnv) && (search === '' || s.name.includes(search) || s.hostname.includes(search) || s.ip.includes(search)));
  const onlineCount = servers.filter(s => s.status === 'ONLINE').length;

  return (
    <AdminLayout title="서버 관리" description="SSH/RDP 서버 목록 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 서버</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체 서버</div><div className="stat-value">{servers.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 온라인</div><div className="stat-value" style={{ color: '#10b981' }}>{onlineCount}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 경고</div><div className="stat-value" style={{ color: '#f59e0b' }}>{servers.filter(s => s.status === 'WARNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 오프라인</div><div className="stat-value" style={{ color: '#6b7280' }}>{servers.filter(s => s.status === 'OFFLINE').length}</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 서버 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="form-input" value={filterEnv} onChange={e => setFilterEnv(e.target.value)} style={{ width: 150 }}>
          <option value="">전체 환경</option><option value="PRODUCTION">운영</option><option value="STAGING">스테이징</option><option value="DEVELOPMENT">개발</option>
        </select>
      </div>
      
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>서버</th><th>호스트</th><th>환경</th><th>CPU</th><th>메모리</th><th>디스크</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>{filtered.map(s => (
              <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedServer(s)}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{getTypeIcon(s.type)}</span><div><div style={{ fontWeight: 600 }}>{s.name}</div>{s.group && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.group}</div>}</div></div></td>
                <td><div style={{ fontSize: '0.85rem' }}>{s.ip}:{s.port}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.hostname}</div></td>
                <td><span style={{ padding: '2px 8px', background: `${getEnvColor(s.environment)}20`, color: getEnvColor(s.environment), borderRadius: 4, fontSize: '0.75rem' }}>{s.environment}</span></td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 40, height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${s.cpu}%`, background: s.cpu > 80 ? '#ef4444' : s.cpu > 60 ? '#f59e0b' : '#10b981' }} /></div><span style={{ fontSize: '0.8rem' }}>{s.cpu}%</span></div></td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 40, height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${s.memory}%`, background: s.memory > 80 ? '#ef4444' : s.memory > 60 ? '#f59e0b' : '#10b981' }} /></div><span style={{ fontSize: '0.8rem' }}>{s.memory}%</span></div></td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 40, height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${s.disk}%`, background: s.disk > 80 ? '#ef4444' : s.disk > 60 ? '#f59e0b' : '#10b981' }} /></div><span style={{ fontSize: '0.8rem' }}>{s.disk}%</span></div></td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), borderRadius: 4, fontSize: '0.75rem' }}>{s.status}</span></td>
                <td onClick={e => e.stopPropagation()}>
                  {s.status === 'ONLINE' && <button className="btn btn-ghost btn-sm" onClick={() => handleConnect(s)}>🔗</button>}
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleMaintenance(s)}>🔧</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      
      {/* Detail Modal */}
      {selectedServer && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedServer(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedServer.type)} {selectedServer.name}</h3><button className="modal-close" onClick={() => setSelectedServer(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span style={{ padding: '4px 10px', background: `${getStatusColor(selectedServer.status)}20`, color: getStatusColor(selectedServer.status), borderRadius: 6 }}>{selectedServer.status}</span>
                <span style={{ padding: '4px 10px', background: `${getEnvColor(selectedServer.environment)}20`, color: getEnvColor(selectedServer.environment), borderRadius: 6 }}>{selectedServer.environment}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><b>호스트명:</b> {selectedServer.hostname}</div>
                <div><b>IP:</b> {selectedServer.ip}:{selectedServer.port}</div>
                {selectedServer.group && <div><b>그룹:</b> {selectedServer.group}</div>}
                <div><b>마지막 확인:</b> {selectedServer.lastSeen}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center', padding: 16, background: 'var(--color-bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
                <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>CPU</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedServer.cpu}%</div></div>
                <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Memory</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedServer.memory}%</div></div>
                <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Disk</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedServer.disk}%</div></div>
              </div>
              {selectedServer.tags.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{selectedServer.tags.map(t => <span key={t} style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.85rem' }}>{t}</span>)}</div>}
            </div>
            <div className="modal-footer">
              {selectedServer.status === 'ONLINE' && <button className="btn btn-primary" onClick={() => handleConnect(selectedServer)}>🔗 연결</button>}
              <button className="btn btn-secondary" onClick={() => openEdit(selectedServer)}>✏️ 수정</button>
              <button className="btn btn-secondary" onClick={() => handleMaintenance(selectedServer)}>{selectedServer.status === 'MAINTENANCE' ? '✅ 유지보수 해제' : '🔧 유지보수'}</button>
              <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedServer.id)}>🗑️</button>
              <button className="btn btn-ghost" onClick={() => setSelectedServer(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">🖥️ 서버 추가</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">서버 이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="prod-api-01" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">호스트명</label><input className="form-input" value={form.hostname} onChange={e => setForm({ ...form, hostname: e.target.value })} required placeholder="prod-api-01.internal" /></div>
                  <div className="form-group"><label className="form-label">포트</label><input type="number" className="form-input" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) })} /></div>
                </div>
                <div className="form-group"><label className="form-label">IP 주소</label><input className="form-input" value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} required placeholder="10.0.1.20" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="LINUX">Linux</option><option value="WINDOWS">Windows</option><option value="CONTAINER">Container</option><option value="DATABASE">Database</option></select></div>
                  <div className="form-group"><label className="form-label">환경</label><select className="form-input" value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}><option value="DEVELOPMENT">개발</option><option value="STAGING">스테이징</option><option value="PRODUCTION">운영</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">그룹 (선택)</label><input className="form-input" value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} placeholder="API" /></div>
                <div className="form-group"><label className="form-label">태그 (쉼표 구분)</label><input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="node, api" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button>
                <button type="submit" className="btn btn-primary">추가</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEdit && selectedServer && (
        <div className="modal-overlay active" onClick={() => { setShowEdit(false); setSelectedServer(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">✏️ 서버 수정</h3><button className="modal-close" onClick={() => { setShowEdit(false); setSelectedServer(null); }}>×</button></div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">서버 이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">호스트명</label><input className="form-input" value={form.hostname} onChange={e => setForm({ ...form, hostname: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">포트</label><input type="number" className="form-input" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) })} /></div>
                </div>
                <div className="form-group"><label className="form-label">IP 주소</label><input className="form-input" value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="LINUX">Linux</option><option value="WINDOWS">Windows</option><option value="CONTAINER">Container</option><option value="DATABASE">Database</option></select></div>
                  <div className="form-group"><label className="form-label">환경</label><select className="form-input" value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}><option value="DEVELOPMENT">개발</option><option value="STAGING">스테이징</option><option value="PRODUCTION">운영</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">그룹</label><input className="form-input" value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">태그</label><input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEdit(false); setSelectedServer(null); }}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

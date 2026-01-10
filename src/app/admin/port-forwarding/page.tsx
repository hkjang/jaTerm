'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface PortForward {
  id: string;
  name: string;
  type: 'LOCAL' | 'REMOTE' | 'DYNAMIC';
  status: 'ACTIVE' | 'STOPPED' | 'ERROR';
  sourceHost: string;
  sourcePort: number;
  targetHost: string;
  targetPort: number;
  user: string;
  server: string;
  createdAt: string;
  traffic: { in: string; out: string };
}

export default function PortForwardingPage() {
  const [forwards, setForwards] = useState<PortForward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForward, setSelectedForward] = useState<PortForward | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'LOCAL', sourcePort: 8080, targetHost: 'localhost', targetPort: 3306, server: '' });

  useEffect(() => {
    setForwards([
      { id: '1', name: 'MySQL Tunnel', type: 'LOCAL', status: 'ACTIVE', sourceHost: 'localhost', sourcePort: 3307, targetHost: 'db.internal', targetPort: 3306, user: '김개발', server: 'prod-bastion-01', createdAt: '2026-01-10 09:00', traffic: { in: '125 MB', out: '45 MB' } },
      { id: '2', name: 'Redis Debug', type: 'LOCAL', status: 'ACTIVE', sourceHost: 'localhost', sourcePort: 6380, targetHost: 'redis.internal', targetPort: 6379, user: '이운영', server: 'prod-bastion-01', createdAt: '2026-01-10 10:30', traffic: { in: '8 MB', out: '2 MB' } },
      { id: '3', name: 'API Gateway', type: 'REMOTE', status: 'STOPPED', sourceHost: '0.0.0.0', sourcePort: 8080, targetHost: 'localhost', targetPort: 8080, user: '박테스트', server: 'dev-jump-01', createdAt: '2026-01-09 14:00', traffic: { in: '0', out: '0' } },
      { id: '4', name: 'SOCKS Proxy', type: 'DYNAMIC', status: 'ACTIVE', sourceHost: 'localhost', sourcePort: 1080, targetHost: '-', targetPort: 0, user: '최보안', server: 'secure-tunnel-01', createdAt: '2026-01-10 08:00', traffic: { in: '1.2 GB', out: '890 MB' } },
      { id: '5', name: 'MongoDB Tunnel', type: 'LOCAL', status: 'ERROR', sourceHost: 'localhost', sourcePort: 27018, targetHost: 'mongo.internal', targetPort: 27017, user: '김개발', server: 'prod-bastion-01', createdAt: '2026-01-10 11:00', traffic: { in: '0', out: '0' } },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setForwards([{ id: String(Date.now()), name: form.name, type: form.type as PortForward['type'], status: 'ACTIVE', sourceHost: 'localhost', sourcePort: form.sourcePort, targetHost: form.targetHost, targetPort: form.targetPort, user: 'admin', server: form.server || 'bastion-01', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '), traffic: { in: '0', out: '0' } }, ...forwards]); setSuccess('포트 포워딩 생성됨'); setShowCreate(false); };
  const handleStop = (f: PortForward) => { setForwards(forwards.map(fw => fw.id === f.id ? { ...fw, status: 'STOPPED' } : fw)); setSuccess('중지됨'); setSelectedForward(null); };
  const handleStart = (f: PortForward) => { setForwards(forwards.map(fw => fw.id === f.id ? { ...fw, status: 'ACTIVE' } : fw)); setSuccess('시작됨'); setSelectedForward(null); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setForwards(forwards.filter(f => f.id !== id)); setSuccess('삭제됨'); setSelectedForward(null); } };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', STOPPED: '#6b7280', ERROR: '#ef4444' }[s] || '#6b7280');
  const getTypeColor = (t: string) => ({ LOCAL: '#3b82f6', REMOTE: '#f59e0b', DYNAMIC: '#8b5cf6' }[t] || '#6b7280');

  return (
    <AdminLayout title="포트 포워딩" description="SSH 터널 및 포트 포워딩 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 포트 포워딩</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 터널</div><div className="stat-value">{forwards.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{forwards.filter(f => f.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 에러</div><div className="stat-value" style={{ color: '#ef4444' }}>{forwards.filter(f => f.status === 'ERROR').length}</div></div>
        <div className="stat-card"><div className="stat-label">📊 트래픽</div><div className="stat-value" style={{ fontSize: '1rem' }}>2.2 GB</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>이름</th><th>유형</th><th>로컬</th><th>원격</th><th>서버</th><th>사용자</th><th>트래픽</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>{forwards.map(f => (
              <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedForward(f)}>
                <td style={{ fontWeight: 600 }}>{f.name}</td>
                <td><span style={{ padding: '2px 8px', background: `${getTypeColor(f.type)}20`, color: getTypeColor(f.type), borderRadius: 4, fontSize: '0.75rem' }}>{f.type}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{f.sourceHost}:{f.sourcePort}</td>
                <td style={{ fontSize: '0.85rem' }}>{f.targetHost}:{f.targetPort}</td>
                <td style={{ fontSize: '0.85rem' }}>{f.server}</td>
                <td style={{ fontSize: '0.85rem' }}>{f.user}</td>
                <td style={{ fontSize: '0.85rem' }}>↓{f.traffic.in} ↑{f.traffic.out}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(f.status)}20`, color: getStatusColor(f.status), borderRadius: 4, fontSize: '0.75rem' }}>{f.status}</span></td>
                <td onClick={e => e.stopPropagation()}>{f.status === 'ACTIVE' ? <button className="btn btn-ghost btn-sm" onClick={() => handleStop(f)}>⏹️</button> : <button className="btn btn-ghost btn-sm" onClick={() => handleStart(f)}>▶️</button>}<button className="btn btn-ghost btn-sm" onClick={() => handleDelete(f.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedForward && (
        <div className="modal-overlay active" onClick={() => setSelectedForward(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔀 {selectedForward.name}</h3><button className="modal-close" onClick={() => setSelectedForward(null)}>×</button></div>
          <div className="modal-body"><div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedForward.status)}20`, color: getStatusColor(selectedForward.status), borderRadius: 6 }}>{selectedForward.status}</span><span style={{ padding: '4px 10px', background: `${getTypeColor(selectedForward.type)}20`, color: getTypeColor(selectedForward.type), borderRadius: 6 }}>{selectedForward.type}</span></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>로컬:</b> {selectedForward.sourceHost}:{selectedForward.sourcePort}</div><div><b>원격:</b> {selectedForward.targetHost}:{selectedForward.targetPort}</div><div><b>서버:</b> {selectedForward.server}</div><div><b>사용자:</b> {selectedForward.user}</div><div><b>생성:</b> {selectedForward.createdAt}</div><div><b>트래픽:</b> ↓{selectedForward.traffic.in} ↑{selectedForward.traffic.out}</div></div></div>
          <div className="modal-footer">{selectedForward.status === 'ACTIVE' ? <button className="btn btn-secondary" onClick={() => handleStop(selectedForward)}>⏹️ 중지</button> : <button className="btn btn-primary" onClick={() => handleStart(selectedForward)}>▶️ 시작</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedForward.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedForward(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔀 포트 포워딩 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="LOCAL">Local</option><option value="REMOTE">Remote</option><option value="DYNAMIC">Dynamic (SOCKS)</option></select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}><div className="form-group"><label className="form-label">로컬 포트</label><input type="number" className="form-input" value={form.sourcePort} onChange={e => setForm({ ...form, sourcePort: parseInt(e.target.value) })} /></div><div className="form-group"><label className="form-label">원격 호스트</label><input className="form-input" value={form.targetHost} onChange={e => setForm({ ...form, targetHost: e.target.value })} /></div><div className="form-group"><label className="form-label">원격 포트</label><input type="number" className="form-input" value={form.targetPort} onChange={e => setForm({ ...form, targetPort: parseInt(e.target.value) })} /></div><div className="form-group"><label className="form-label">서버</label><input className="form-input" value={form.server} onChange={e => setForm({ ...form, server: e.target.value })} /></div></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

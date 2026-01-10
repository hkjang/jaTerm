'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface VPNConnection {
  id: string;
  name: string;
  type: 'SITE_TO_SITE' | 'CLIENT_VPN' | 'IPSEC' | 'WIREGUARD';
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  localNetwork: string;
  remoteNetwork: string;
  publicIp: string;
  connectedClients: number;
  bytesIn: number;
  bytesOut: number;
  uptime: string;
  lastActivity: string;
}

export default function VPNManagementPage() {
  const [vpns, setVpns] = useState<VPNConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVpn, setSelectedVpn] = useState<VPNConnection | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'WIREGUARD', localNetwork: '10.0.0.0/24', remoteNetwork: '', publicIp: '' });

  useEffect(() => {
    setVpns([
      { id: '1', name: 'HQ-Branch-VPN', type: 'SITE_TO_SITE', status: 'CONNECTED', localNetwork: '10.0.0.0/16', remoteNetwork: '192.168.0.0/16', publicIp: '203.0.113.1', connectedClients: 0, bytesIn: 1234567890, bytesOut: 987654321, uptime: '15d 4h 32m', lastActivity: '2026-01-10 14:25' },
      { id: '2', name: 'Remote-Workers', type: 'CLIENT_VPN', status: 'CONNECTED', localNetwork: '10.10.0.0/24', remoteNetwork: '-', publicIp: '203.0.113.2', connectedClients: 24, bytesIn: 567890123, bytesOut: 234567890, uptime: '30d 12h', lastActivity: '2026-01-10 14:26' },
      { id: '3', name: 'AWS-Tunnel', type: 'IPSEC', status: 'CONNECTED', localNetwork: '10.20.0.0/24', remoteNetwork: '172.16.0.0/16', publicIp: '203.0.113.3', connectedClients: 0, bytesIn: 345678901, bytesOut: 456789012, uptime: '7d 8h 15m', lastActivity: '2026-01-10 14:20' },
      { id: '4', name: 'Dev-WireGuard', type: 'WIREGUARD', status: 'DISCONNECTED', localNetwork: '10.30.0.0/24', remoteNetwork: '10.40.0.0/24', publicIp: '203.0.113.4', connectedClients: 0, bytesIn: 0, bytesOut: 0, uptime: '-', lastActivity: '2026-01-09 18:30' },
      { id: '5', name: 'Partner-Network', type: 'SITE_TO_SITE', status: 'ERROR', localNetwork: '10.50.0.0/24', remoteNetwork: '192.168.100.0/24', publicIp: '203.0.113.5', connectedClients: 0, bytesIn: 123456, bytesOut: 654321, uptime: '-', lastActivity: '2026-01-10 10:15' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const formatBytes = (b: number) => { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB'; return (b / 1073741824).toFixed(2) + ' GB'; };
  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setVpns([{ id: String(Date.now()), name: form.name, type: form.type as VPNConnection['type'], status: 'DISCONNECTED', localNetwork: form.localNetwork, remoteNetwork: form.remoteNetwork, publicIp: form.publicIp, connectedClients: 0, bytesIn: 0, bytesOut: 0, uptime: '-', lastActivity: '-' }, ...vpns]); setSuccess('VPN 생성됨'); setShowCreate(false); setForm({ name: '', type: 'WIREGUARD', localNetwork: '10.0.0.0/24', remoteNetwork: '', publicIp: '' }); };
  const handleConnect = (vpn: VPNConnection) => { setVpns(vpns.map(v => v.id === vpn.id ? { ...v, status: 'CONNECTING' } : v)); setSuccess(`${vpn.name} 연결 중...`); setTimeout(() => setVpns(prev => prev.map(v => v.id === vpn.id ? { ...v, status: 'CONNECTED', uptime: '0d 0h 0m' } : v)), 2000); };
  const handleDisconnect = (vpn: VPNConnection) => { setVpns(vpns.map(v => v.id === vpn.id ? { ...v, status: 'DISCONNECTED', uptime: '-' } : v)); setSuccess(`${vpn.name} 연결 해제됨`); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setVpns(vpns.filter(v => v.id !== id)); setSuccess('삭제됨'); setSelectedVpn(null); } };

  const getStatusColor = (s: string) => ({ CONNECTED: '#10b981', DISCONNECTED: '#6b7280', CONNECTING: '#3b82f6', ERROR: '#ef4444' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ SITE_TO_SITE: '🏢', CLIENT_VPN: '👥', IPSEC: '🔐', WIREGUARD: '🔷' }[t] || '🔒');

  return (
    <AdminLayout title="VPN 관리" description="가상 사설망 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ VPN</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 VPN</div><div className="stat-value">{vpns.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 연결됨</div><div className="stat-value" style={{ color: '#10b981' }}>{vpns.filter(v => v.status === 'CONNECTED').length}</div></div>
        <div className="stat-card"><div className="stat-label">👥 클라이언트</div><div className="stat-value">{vpns.reduce((a, v) => a + v.connectedClients, 0)}</div></div>
        <div className="stat-card"><div className="stat-label">📊 트래픽</div><div className="stat-value">{formatBytes(vpns.reduce((a, v) => a + v.bytesIn + v.bytesOut, 0))}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {vpns.map(vpn => (
            <div key={vpn.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(vpn.status)}`, cursor: 'pointer' }} onClick={() => setSelectedVpn(vpn)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontSize: '1.5rem', marginRight: 8 }}>{getTypeIcon(vpn.type)}</span><span style={{ fontWeight: 700 }}>{vpn.name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{vpn.type}</div></div>
                <span style={{ padding: '4px 10px', background: `${getStatusColor(vpn.status)}20`, color: getStatusColor(vpn.status), borderRadius: 6, fontSize: '0.8rem', height: 'fit-content' }}>{vpn.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem', marginBottom: 12 }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Local:</span> {vpn.localNetwork}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Remote:</span> {vpn.remoteNetwork}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem' }}>
                <span>⬇️ {formatBytes(vpn.bytesIn)}</span><span>⬆️ {formatBytes(vpn.bytesOut)}</span>
                {vpn.connectedClients > 0 && <span>👥 {vpn.connectedClients}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedVpn && (
        <div className="modal-overlay active" onClick={() => setSelectedVpn(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedVpn.type)} {selectedVpn.name}</h3><button className="modal-close" onClick={() => setSelectedVpn(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedVpn.status)}20`, color: getStatusColor(selectedVpn.status), borderRadius: 6 }}>{selectedVpn.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedVpn.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>Public IP:</b> {selectedVpn.publicIp}</div><div><b>Uptime:</b> {selectedVpn.uptime}</div>
              <div><b>Local:</b> {selectedVpn.localNetwork}</div><div><b>Remote:</b> {selectedVpn.remoteNetwork}</div>
              <div><b>Download:</b> {formatBytes(selectedVpn.bytesIn)}</div><div><b>Upload:</b> {formatBytes(selectedVpn.bytesOut)}</div>
            </div>
            {selectedVpn.connectedClients > 0 && <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, marginBottom: 16 }}><b>연결된 클라이언트:</b> {selectedVpn.connectedClients}명</div>}
          </div>
          <div className="modal-footer">
            {selectedVpn.status === 'CONNECTED' ? <button className="btn btn-secondary" onClick={() => { handleDisconnect(selectedVpn); setSelectedVpn(null); }}>⏹️ 연결 해제</button> : <button className="btn btn-primary" onClick={() => { handleConnect(selectedVpn); setSelectedVpn(null); }}>▶️ 연결</button>}
            <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedVpn.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedVpn(null)}>닫기</button>
          </div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔒 VPN 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="WIREGUARD">WireGuard</option><option value="IPSEC">IPSec</option><option value="SITE_TO_SITE">Site-to-Site</option><option value="CLIENT_VPN">Client VPN</option></select></div>
            <div className="form-group"><label className="form-label">로컬 네트워크</label><input className="form-input" value={form.localNetwork} onChange={e => setForm({ ...form, localNetwork: e.target.value })} placeholder="10.0.0.0/24" required /></div>
            <div className="form-group"><label className="form-label">원격 네트워크</label><input className="form-input" value={form.remoteNetwork} onChange={e => setForm({ ...form, remoteNetwork: e.target.value })} placeholder="192.168.0.0/24" /></div>
            <div className="form-group"><label className="form-label">Public IP</label><input className="form-input" value={form.publicIp} onChange={e => setForm({ ...form, publicIp: e.target.value })} placeholder="203.0.113.x" required /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Secret {
  id: string;
  name: string;
  type: 'API_KEY' | 'DB_PASSWORD' | 'SSH_KEY' | 'CERTIFICATE' | 'TOKEN' | 'ENCRYPTION_KEY';
  service: string;
  lastRotated: string;
  nextRotation: string;
  status: 'CURRENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'ROTATING';
  rotationPolicy: string;
  autoRotate: boolean;
  rotationHistory: { date: string; status: string; by: string }[];
}

export default function SecretRotationPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const mockSecrets: Secret[] = [
      { id: '1', name: 'aws-prod-api-key', type: 'API_KEY', service: 'AWS', lastRotated: '2025-12-15', nextRotation: '2026-01-14', status: 'EXPIRING_SOON', rotationPolicy: '30일', autoRotate: true, rotationHistory: [{ date: '2025-12-15', status: '성공', by: 'System' }, { date: '2025-11-15', status: '성공', by: 'System' }] },
      { id: '2', name: 'db-master-password', type: 'DB_PASSWORD', service: 'PostgreSQL', lastRotated: '2026-01-05', nextRotation: '2026-02-04', status: 'CURRENT', rotationPolicy: '30일', autoRotate: true, rotationHistory: [{ date: '2026-01-05', status: '성공', by: 'admin' }] },
      { id: '3', name: 'ssh-deploy-key', type: 'SSH_KEY', service: 'GitHub', lastRotated: '2025-10-01', nextRotation: '2026-01-01', status: 'EXPIRED', rotationPolicy: '90일', autoRotate: false, rotationHistory: [{ date: '2025-10-01', status: '성공', by: 'admin' }] },
      { id: '4', name: 'ssl-wildcard-cert', type: 'CERTIFICATE', service: 'Nginx', lastRotated: '2025-06-15', nextRotation: '2026-06-15', status: 'CURRENT', rotationPolicy: '365일', autoRotate: true, rotationHistory: [{ date: '2025-06-15', status: '성공', by: 'LetsEncrypt' }] },
      { id: '5', name: 'jwt-signing-token', type: 'TOKEN', service: 'Auth Service', lastRotated: '2026-01-08', nextRotation: '2026-01-15', status: 'CURRENT', rotationPolicy: '7일', autoRotate: true, rotationHistory: [{ date: '2026-01-08', status: '성공', by: 'System' }, { date: '2026-01-01', status: '성공', by: 'System' }] },
      { id: '6', name: 'data-encryption-key', type: 'ENCRYPTION_KEY', service: 'Vault', lastRotated: '2025-12-01', nextRotation: '2026-03-01', status: 'CURRENT', rotationPolicy: '90일', autoRotate: true, rotationHistory: [{ date: '2025-12-01', status: '성공', by: 'Vault' }] },
      { id: '7', name: 'stripe-api-secret', type: 'API_KEY', service: 'Stripe', lastRotated: '2025-11-20', nextRotation: '2026-01-19', status: 'EXPIRING_SOON', rotationPolicy: '60일', autoRotate: false, rotationHistory: [{ date: '2025-11-20', status: '성공', by: 'admin' }] },
      { id: '8', name: 'redis-auth-pass', type: 'DB_PASSWORD', service: 'Redis', lastRotated: '2026-01-10', nextRotation: '2026-02-09', status: 'ROTATING', rotationPolicy: '30일', autoRotate: true, rotationHistory: [{ date: '2026-01-10', status: '진행중', by: 'System' }] },
    ];
    
    setSecrets(mockSecrets);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'API_KEY': return { color: '#3b82f6', icon: '🔑' };
      case 'DB_PASSWORD': return { color: '#8b5cf6', icon: '🗄️' };
      case 'SSH_KEY': return { color: '#10b981', icon: '🔐' };
      case 'CERTIFICATE': return { color: '#f59e0b', icon: '📜' };
      case 'TOKEN': return { color: '#06b6d4', icon: '🎫' };
      case 'ENCRYPTION_KEY': return { color: '#ec4899', icon: '🔒' };
      default: return { color: '#6b7280', icon: '?' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CURRENT': return { color: '#10b981', label: '정상' };
      case 'EXPIRING_SOON': return { color: '#f59e0b', label: '곧 만료' };
      case 'EXPIRED': return { color: '#ef4444', label: '만료됨' };
      case 'ROTATING': return { color: '#3b82f6', label: '교체중' };
      default: return { color: '#6b7280', label: status };
    }
  };

  const filteredSecrets = secrets.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.service.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const expiringSoon = secrets.filter(s => s.status === 'EXPIRING_SOON').length;
  const expired = secrets.filter(s => s.status === 'EXPIRED').length;

  return (
    <AdminLayout title="시크릿 로테이션" description="시크릿/자격증명 자동 교체 관리">
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 시크릿</div><div className="stat-value">{secrets.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 정상</div><div className="stat-value" style={{ color: '#10b981' }}>{secrets.filter(s => s.status === 'CURRENT').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 곧 만료</div><div className="stat-value" style={{ color: '#f59e0b' }}>{expiringSoon}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 만료됨</div><div className="stat-value" style={{ color: '#ef4444' }}>{expired}</div></div>
        <div className="stat-card"><div className="stat-label">자동교체</div><div className="stat-value">{secrets.filter(s => s.autoRotate).length}</div></div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="🔍 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '180px' }} />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '140px' }}>
          <option value="all">전체 유형</option>
          <option value="API_KEY">API Key</option>
          <option value="DB_PASSWORD">DB Password</option>
          <option value="SSH_KEY">SSH Key</option>
          <option value="CERTIFICATE">Certificate</option>
          <option value="TOKEN">Token</option>
          <option value="ENCRYPTION_KEY">Encryption Key</option>
        </select>
        <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ maxWidth: '120px' }}>
          <option value="all">전체 상태</option>
          <option value="CURRENT">정상</option>
          <option value="EXPIRING_SOON">곧 만료</option>
          <option value="EXPIRED">만료됨</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary">+ 시크릿 추가</button>
      </div>

      {/* Secrets Table */}
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>시크릿</th><th>유형</th><th>서비스</th><th>상태</th><th>마지막 교체</th><th>다음 교체</th><th>정책</th><th>자동</th><th>작업</th></tr></thead>
              <tbody>
                {filteredSecrets.map(secret => {
                  const typeConfig = getTypeConfig(secret.type);
                  const statusConfig = getStatusConfig(secret.status);
                  return (
                    <tr key={secret.id}>
                      <td><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '1.2rem' }}>{typeConfig.icon}</span><span style={{ fontWeight: 500 }}>{secret.name}</span></span></td>
                      <td><span style={{ padding: '3px 8px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.8rem' }}>{secret.type}</span></td>
                      <td>{secret.service}</td>
                      <td><span style={{ padding: '3px 8px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '4px', fontSize: '0.8rem' }}>{statusConfig.label}</span></td>
                      <td>{secret.lastRotated}</td>
                      <td style={{ color: secret.status === 'EXPIRED' ? '#ef4444' : secret.status === 'EXPIRING_SOON' ? '#f59e0b' : 'inherit' }}>{secret.nextRotation}</td>
                      <td>{secret.rotationPolicy}</td>
                      <td>{secret.autoRotate ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSecret(secret)}>상세</button>
                          <button className="btn btn-primary btn-sm" disabled={secret.status === 'ROTATING'}>🔄 교체</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSecret && (
        <div className="modal-overlay active" onClick={() => setSelectedSecret(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedSecret.type).icon} {selectedSecret.name}</h3>
              <button className="modal-close" onClick={() => setSelectedSecret(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getTypeConfig(selectedSecret.type).color}20`, color: getTypeConfig(selectedSecret.type).color, borderRadius: '6px' }}>{selectedSecret.type}</span>
                <span style={{ padding: '4px 10px', background: `${getStatusConfig(selectedSecret.status).color}20`, color: getStatusConfig(selectedSecret.status).color, borderRadius: '6px' }}>{getStatusConfig(selectedSecret.status).label}</span>
                {selectedSecret.autoRotate && <span style={{ padding: '4px 10px', background: '#10b98120', color: '#10b981', borderRadius: '6px' }}>🔄 자동교체</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>서비스:</span><br /><b>{selectedSecret.service}</b></div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>정책:</span><br /><b>{selectedSecret.rotationPolicy}</b></div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>마지막 교체:</span><br />{selectedSecret.lastRotated}</div>
                <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>다음 교체:</span><br /><span style={{ color: selectedSecret.status === 'EXPIRED' ? '#ef4444' : 'inherit' }}>{selectedSecret.nextRotation}</span></div>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>📜 교체 이력</div>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                {selectedSecret.rotationHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: i < selectedSecret.rotationHistory.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <span>{h.date}</span>
                    <span style={{ color: h.status === '성공' ? '#10b981' : h.status === '진행중' ? '#3b82f6' : '#ef4444' }}>{h.status}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>by {h.by}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary">🔄 지금 교체</button>
              <button className="btn btn-ghost" onClick={() => setSelectedSecret(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface IPEntry {
  id: string;
  ip: string;
  type: 'SINGLE' | 'RANGE' | 'CIDR';
  label: string;
  description?: string;
  scope: 'GLOBAL' | 'USER' | 'SERVER';
  scopeTarget?: string;
  status: 'ACTIVE' | 'DISABLED' | 'EXPIRED';
  expiresAt?: string;
  hitCount: number;
  lastHit?: string;
  createdBy: string;
  createdAt: string;
}

export default function IPWhitelistPage() {
  const [entries, setEntries] = useState<IPEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [newIP, setNewIP] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<IPEntry['type']>('SINGLE');
  const [newScope, setNewScope] = useState<IPEntry['scope']>('GLOBAL');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const mockEntries: IPEntry[] = [
      { id: '1', ip: '192.168.1.0/24', type: 'CIDR', label: '사내 네트워크', description: '본사 사무실 IP 대역', scope: 'GLOBAL', status: 'ACTIVE', hitCount: 15420, lastHit: new Date(Date.now() - 5 * 60000).toISOString(), createdBy: '관리자', createdAt: new Date(Date.now() - 365 * 86400000).toISOString() },
      { id: '2', ip: '10.0.0.1', type: 'SINGLE', label: 'VPN Gateway', description: 'VPN 게이트웨이 서버', scope: 'GLOBAL', status: 'ACTIVE', hitCount: 8956, lastHit: new Date(Date.now() - 2 * 3600000).toISOString(), createdBy: '보안팀', createdAt: new Date(Date.now() - 180 * 86400000).toISOString() },
      { id: '3', ip: '203.0.113.50-60', type: 'RANGE', label: '협력사 A', description: '외부 협력사 접속 허용', scope: 'SERVER', scopeTarget: 'stage-app-01', status: 'ACTIVE', hitCount: 234, lastHit: new Date(Date.now() - 12 * 3600000).toISOString(), createdBy: '운영팀', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
      { id: '4', ip: '1.2.3.4', type: 'SINGLE', label: '임시 접속', description: '외부 컨설턴트 접속', scope: 'USER', scopeTarget: '김외부', status: 'EXPIRED', expiresAt: new Date(Date.now() - 7 * 86400000).toISOString(), hitCount: 45, lastHit: new Date(Date.now() - 8 * 86400000).toISOString(), createdBy: '관리자', createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
      { id: '5', ip: '172.16.0.0/16', type: 'CIDR', label: '개발망', description: '개발 환경 네트워크', scope: 'GLOBAL', status: 'ACTIVE', hitCount: 6789, lastHit: new Date(Date.now() - 15 * 60000).toISOString(), createdBy: '개발팀', createdAt: new Date(Date.now() - 200 * 86400000).toISOString() },
      { id: '6', ip: '8.8.8.8', type: 'SINGLE', label: 'Google DNS', scope: 'GLOBAL', status: 'DISABLED', hitCount: 0, createdBy: '테스트', createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
    ];
    setEntries(mockEntries);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAdd = () => {
    if (!newIP || !newLabel) return;
    setMessage({ type: 'success', text: 'IP가 화이트리스트에 추가되었습니다.' });
    setShowAddModal(false);
    setNewIP('');
    setNewLabel('');
    setNewType('SINGLE');
    setNewScope('GLOBAL');
    setNewDescription('');
  };

  const handleDelete = (entry: IPEntry) => {
    if (!confirm(`'${entry.label}' (${entry.ip})을 삭제하시겠습니까?`)) return;
    setEntries(entries.filter(e => e.id !== entry.id));
    setMessage({ type: 'success', text: 'IP가 삭제되었습니다.' });
  };

  const handleToggle = (entry: IPEntry) => {
    setEntries(entries.map(e => 
      e.id === entry.id 
        ? { ...e, status: e.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } 
        : e
    ));
    setMessage({ type: 'success', text: `IP가 ${entry.status === 'ACTIVE' ? '비활성화' : '활성화'}되었습니다.` });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: '#10b981', bg: '#10b98120', label: '활성' };
      case 'DISABLED': return { color: '#6b7280', bg: '#6b728020', label: '비활성' };
      case 'EXPIRED': return { color: '#ef4444', bg: '#ef444420', label: '만료' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status };
    }
  };

  const getScopeConfig = (scope: string) => {
    switch (scope) {
      case 'GLOBAL': return { color: '#3b82f6', icon: '🌍' };
      case 'USER': return { color: '#8b5cf6', icon: '👤' };
      case 'SERVER': return { color: '#10b981', icon: '🖥️' };
      default: return { color: '#6b7280', icon: '📋' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const filteredEntries = entries.filter(e => {
    if (searchQuery && !e.ip.includes(searchQuery) && !e.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterScope !== 'all' && e.scope !== filterScope) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  });

  const activeCount = entries.filter(e => e.status === 'ACTIVE').length;
  const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);

  return (
    <AdminLayout 
      title="IP 화이트리스트" 
      description="허용된 IP 주소 관리"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ IP 추가
        </button>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 IP</div>
          <div className="stat-value">{entries.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ 활성</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📊 총 히트</div>
          <div className="stat-value">{totalHits.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🌍 전역</div>
          <div className="stat-value">{entries.filter(e => e.scope === 'GLOBAL').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 IP 또는 레이블 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterScope} onChange={(e) => setFilterScope(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">모든 범위</option>
          <option value="GLOBAL">🌍 전역</option>
          <option value="SERVER">🖥️ 서버</option>
          <option value="USER">👤 사용자</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'ACTIVE', 'DISABLED', 'EXPIRED'].map(status => {
            const config = status !== 'all' ? getStatusConfig(status) : null;
            return (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '전체' : config?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* IP Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>IP / 레이블</th>
                  <th>유형</th>
                  <th>범위</th>
                  <th>상태</th>
                  <th>히트</th>
                  <th>마지막 히트</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map(entry => {
                  const statusConfig = getStatusConfig(entry.status);
                  const scopeConfig = getScopeConfig(entry.scope);
                  return (
                    <tr key={entry.id} style={{ opacity: entry.status === 'DISABLED' ? 0.6 : 1 }}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{entry.label}</div>
                          <code style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{entry.ip}</code>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: 'var(--color-surface)', borderRadius: '4px' }}>
                          {entry.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{scopeConfig.icon}</span>
                          {entry.scopeTarget && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({entry.scopeTarget})</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>{entry.hitCount.toLocaleString()}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {entry.lastHit ? getTimeAgo(entry.lastHit) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(entry)} title={entry.status === 'ACTIVE' ? '비활성화' : '활성화'}>
                            {entry.status === 'ACTIVE' ? '⏸️' : '▶️'}
                          </button>
                          <button className="btn btn-ghost btn-sm">✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(entry)}>🗑️</button>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ IP 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">유형</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['SINGLE', 'RANGE', 'CIDR'] as const).map(type => (
                    <label key={type} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: newType === type ? 'var(--color-primary)20' : 'var(--color-surface)', borderRadius: '6px', border: newType === type ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer' }}>
                      <input type="radio" name="type" checked={newType === type} onChange={() => setNewType(type)} style={{ display: 'none' }} />
                      <span style={{ fontSize: '0.85rem' }}>{type === 'SINGLE' ? '단일 IP' : type === 'RANGE' ? 'IP 범위' : 'CIDR'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">IP 주소</label>
                <input type="text" className="form-input" placeholder={newType === 'SINGLE' ? '192.168.1.1' : newType === 'RANGE' ? '192.168.1.1-10' : '192.168.1.0/24'} value={newIP} onChange={(e) => setNewIP(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">레이블</label>
                <input type="text" className="form-input" placeholder="예: 본사 네트워크" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">범위</label>
                <select className="form-input" value={newScope} onChange={(e) => setNewScope(e.target.value as IPEntry['scope'])}>
                  <option value="GLOBAL">🌍 전역</option>
                  <option value="SERVER">🖥️ 서버</option>
                  <option value="USER">👤 사용자</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">설명 (선택)</label>
                <input type="text" className="form-input" placeholder="IP에 대한 설명" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newIP || !newLabel}>추가</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

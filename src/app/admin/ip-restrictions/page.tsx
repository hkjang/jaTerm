'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface IpRule {
  id: string;
  type: 'WHITELIST' | 'BLACKLIST';
  ipRange: string;
  description: string;
  environment?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string };
  hitCount: number;
  lastHit?: string;
}

export default function IpRestrictionsPage() {
  const [rules, setRules] = useState<IpRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'whitelist' | 'blacklist'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [newType, setNewType] = useState<'WHITELIST' | 'BLACKLIST'>('WHITELIST');
  const [newIpRange, setNewIpRange] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEnvironment, setNewEnvironment] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const mockRules: IpRule[] = [
        { id: '1', type: 'WHITELIST', ipRange: '192.168.1.0/24', description: '사내 네트워크', isActive: true, createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), createdBy: { name: '관리자' }, hitCount: 1250, lastHit: new Date(Date.now() - 5 * 60000).toISOString() },
        { id: '2', type: 'WHITELIST', ipRange: '10.0.0.0/8', description: 'VPN 대역', isActive: true, createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), createdBy: { name: '관리자' }, hitCount: 890, lastHit: new Date(Date.now() - 15 * 60000).toISOString() },
        { id: '3', type: 'BLACKLIST', ipRange: '45.33.32.0/24', description: '악성 IP 차단 (중국)', isActive: true, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), createdBy: { name: '보안팀' }, hitCount: 156, lastHit: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: '4', type: 'BLACKLIST', ipRange: '185.220.100.0/24', description: 'Tor Exit Node 차단', isActive: true, createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), createdBy: { name: '보안팀' }, hitCount: 42, lastHit: new Date(Date.now() - 6 * 3600000).toISOString() },
        { id: '5', type: 'WHITELIST', ipRange: '203.0.113.50', description: '외부 개발자 (홍길동)', environment: 'DEV', isActive: true, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), createdBy: { name: '관리자' }, hitCount: 35, lastHit: new Date(Date.now() - 24 * 3600000).toISOString() },
      ];

      let filtered = mockRules;
      if (filterType === 'whitelist') filtered = mockRules.filter(r => r.type === 'WHITELIST');
      if (filterType === 'blacklist') filtered = mockRules.filter(r => r.type === 'BLACKLIST');

      setRules(filtered);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAdd = () => {
    if (!newIpRange) return;
    setMessage({ type: 'success', text: `IP 규칙이 추가되었습니다: ${newIpRange}` });
    setShowAddModal(false);
    resetForm();
    fetchRules();
  };

  const handleToggle = (rule: IpRule) => {
    setRules(rules.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
    setMessage({ type: 'success', text: rule.isActive ? '규칙이 비활성화되었습니다.' : '규칙이 활성화되었습니다.' });
  };

  const handleDelete = (rule: IpRule) => {
    if (!confirm(`'${rule.ipRange}' 규칙을 삭제하시겠습니까?`)) return;
    setRules(rules.filter(r => r.id !== rule.id));
    setMessage({ type: 'success', text: '규칙이 삭제되었습니다.' });
  };

  const resetForm = () => {
    setNewType('WHITELIST');
    setNewIpRange('');
    setNewDescription('');
    setNewEnvironment('');
  };

  const formatNumber = (n: number) => n.toLocaleString();

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const whitelistCount = rules.filter(r => r.type === 'WHITELIST').length;
  const blacklistCount = rules.filter(r => r.type === 'BLACKLIST').length;
  const totalHits = rules.reduce((sum, r) => sum + r.hitCount, 0);

  return (
    <AdminLayout 
      title="IP 제한 관리" 
      description="허용/차단 IP 규칙 설정"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 규칙 추가
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
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: filterType === 'all' ? '3px solid var(--color-primary)' : 'none' }} onClick={() => setFilterType('all')}>
          <div className="stat-label">전체 규칙</div>
          <div className="stat-value">{rules.length}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: filterType === 'whitelist' ? '3px solid #10b981' : 'none' }} onClick={() => setFilterType('whitelist')}>
          <div className="stat-label">화이트리스트</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{whitelistCount}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: filterType === 'blacklist' ? '3px solid #ef4444' : 'none' }} onClick={() => setFilterType('blacklist')}>
          <div className="stat-label">블랙리스트</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{blacklistCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 적용 횟수</div>
          <div className="stat-value">{formatNumber(totalHits)}</div>
        </div>
      </div>

      {/* Rules List */}
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
                  <th>유형</th>
                  <th>IP 범위</th>
                  <th>설명</th>
                  <th>적용 횟수</th>
                  <th>마지막 적용</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} style={{ opacity: rule.isActive ? 1 : 0.5 }}>
                    <td>
                      <span style={{ padding: '4px 10px', background: rule.type === 'WHITELIST' ? '#10b98120' : '#ef444420', color: rule.type === 'WHITELIST' ? '#10b981' : '#ef4444', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {rule.type === 'WHITELIST' ? '✅ 허용' : '🚫 차단'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                      {rule.ipRange}
                      {rule.environment && (
                        <span style={{ marginLeft: '8px', padding: '1px 4px', background: 'var(--color-surface)', borderRadius: '3px', fontSize: '0.7rem' }}>
                          {rule.environment}
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rule.description}>
                        {rule.description}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatNumber(rule.hitCount)}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {rule.lastHit ? getTimeAgo(rule.lastHit) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {rule.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(rule)}>
                          {rule.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(rule)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ IP 규칙 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">규칙 유형</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', background: newType === 'WHITELIST' ? '#10b98120' : 'var(--color-surface)', borderRadius: '8px', border: newType === 'WHITELIST' ? '2px solid #10b981' : '2px solid transparent', flex: 1 }}>
                    <input type="radio" name="type" checked={newType === 'WHITELIST'} onChange={() => setNewType('WHITELIST')} style={{ display: 'none' }} />
                    <span>✅ 화이트리스트</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', background: newType === 'BLACKLIST' ? '#ef444420' : 'var(--color-surface)', borderRadius: '8px', border: newType === 'BLACKLIST' ? '2px solid #ef4444' : '2px solid transparent', flex: 1 }}>
                    <input type="radio" name="type" checked={newType === 'BLACKLIST'} onChange={() => setNewType('BLACKLIST')} style={{ display: 'none' }} />
                    <span>🚫 블랙리스트</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">IP 주소 또는 범위</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 192.168.1.0/24 또는 10.0.0.1"
                  value={newIpRange}
                  onChange={(e) => setNewIpRange(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">설명</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="규칙에 대한 설명"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">환경 제한 (선택)</label>
                <select className="form-input form-select" value={newEnvironment} onChange={(e) => setNewEnvironment(e.target.value)}>
                  <option value="">모든 환경</option>
                  <option value="PROD">PROD</option>
                  <option value="STAGE">STAGE</option>
                  <option value="DEV">DEV</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newIpRange}>
                규칙 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

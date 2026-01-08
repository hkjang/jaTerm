'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EmergencyAccess {
  id: string;
  requester: { name: string; email: string; role: string };
  server: { name: string; environment: string };
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedAt: string;
  expiresAt: string;
  revokedAt?: string;
  revokedBy?: string;
  commandsExecuted: number;
}

export default function EmergencyPage() {
  const [accesses, setAccesses] = useState<EmergencyAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<EmergencyAccess | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const user = localStorage.getItem('user');
    if (!user) return {};
    try {
      const { id } = JSON.parse(user);
      return { 'Authorization': `Bearer ${id}` };
    } catch {
      return {};
    }
  };

  const fetchAccesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/emergency', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAccesses(data.accesses);
      setError('');
    } catch (err) {
      setError('긴급 접근 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);

  const handleRevoke = async (id: string) => {
    try {
      await fetch('/api/admin/emergency', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'revoke' }),
      });
      setSuccess('긴급 접근이 취소되었습니다.');
      fetchAccesses();
    } catch (err) {
      setError('취소에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { class: 'badge-success', label: '활성' };
      case 'EXPIRED': return { class: 'badge-warning', label: '만료' };
      case 'REVOKED': return { class: 'badge-danger', label: '취소됨' };
      default: return { class: 'badge-info', label: status };
    }
  };

  const activeCount = accesses.filter(a => a.status === 'ACTIVE').length;

  return (
    <AdminLayout
      title="긴급 접근 (Break Glass)"
      description="긴급 상황 시 임시 접근 권한 부여 및 관리"
      actions={<button className="btn btn-danger" onClick={() => setShowGrantModal(true)}>🚨 긴급 접근 부여</button>}
    >
      {success && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{success}<button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>}
      {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>}

      {activeCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>현재 {activeCount}건의 긴급 접근이 활성 상태입니다</div>
            <div style={{ fontSize: '0.85rem' }}>모든 활동이 실시간으로 모니터링됩니다</div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">활성 긴급 접근</div><div className="stat-value" style={{ color: 'var(--color-danger)' }}>{activeCount}</div></div>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{accesses.length}</div></div>
        <div className="stat-card"><div className="stat-label">만료됨</div><div className="stat-value">{accesses.filter(a => a.status === 'EXPIRED').length}</div></div>
        <div className="stat-card"><div className="stat-label">취소됨</div><div className="stat-value">{accesses.filter(a => a.status === 'REVOKED').length}</div></div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><span className="spinner" style={{ width: '32px', height: '32px' }} /></div>
      ) : accesses.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>긴급 접근 기록이 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {accesses.map(access => {
            const statusBadge = getStatusBadge(access.status);
            return (
              <div key={access.id} className="card" style={{ padding: '20px', borderLeft: access.status === 'ACTIVE' ? '4px solid var(--color-danger)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                      <span className="badge badge-danger">{access.server.environment}</span>
                      <span style={{ fontWeight: 600 }}>{access.server.name}</span>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사유</div>
                      <div style={{ fontWeight: 500 }}>{access.reason}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                      <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>요청자</div><div style={{ fontWeight: 500 }}>{access.requester.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{access.requester.role}</div></div>
                      <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>시작 시간</div><div style={{ fontWeight: 500 }}>{new Date(access.grantedAt).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>만료 시간</div><div style={{ fontWeight: 500 }}>{new Date(access.expiresAt).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>실행 명령</div><div style={{ fontWeight: 500, fontSize: '1.25rem' }}>{access.commandsExecuted}개</div></div>
                    </div>
                    {access.revokedBy && <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>취소: {access.revokedBy} ({access.revokedAt ? new Date(access.revokedAt).toLocaleString() : ''})</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAccess(access)}>상세</button>
                    {access.status === 'ACTIVE' && <button className="btn btn-danger btn-sm" onClick={() => handleRevoke(access.id)}>즉시 취소</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showGrantModal && (
        <div className="modal-overlay active" onClick={() => setShowGrantModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">🚨 긴급 접근 부여</h3><button className="modal-close" onClick={() => setShowGrantModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}><span>⚠️</span><span>긴급 접근은 모든 정책을 우회합니다. 신중하게 사용하세요.</span></div>
              <div className="form-group"><label className="form-label">대상 사용자</label><select className="form-input form-select"><option value="">사용자 선택</option></select></div>
              <div className="form-group"><label className="form-label">대상 서버</label><select className="form-input form-select"><option value="">서버 선택</option></select></div>
              <div className="form-group"><label className="form-label">긴급 접근 사유</label><textarea className="form-input" rows={3} placeholder="긴급 접근이 필요한 상세 사유..." /></div>
              <div className="form-group"><label className="form-label">접근 유효 시간</label><select className="form-input form-select"><option value="30">30분</option><option value="60">1시간</option><option value="120">2시간</option></select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowGrantModal(false)}>취소</button><button className="btn btn-danger">긴급 접근 부여</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

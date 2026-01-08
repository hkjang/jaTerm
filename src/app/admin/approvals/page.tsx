'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ApprovalRequest {
  id: string;
  requester: { id: string; name: string; email: string; role: string };
  server: { id: string; name: string; environment: string };
  purpose: string;
  requestType: 'PRIOR' | 'REALTIME';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approver?: { name: string; email: string };
  requestedAt: string;
  expiresAt: string;
  approvedAt?: string;
  notes?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchNotes, setBatchNotes] = useState('');

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

  const fetchRequests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/approvals?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      setRequests(data.requests);
      setPagination(data.pagination);
      setError('');
      setSelectedIds(new Set());
    } catch (err) {
      setError('승인 요청 목록을 불러오는데 실패했습니다.');
      console.error('Fetch approvals error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });

      if (!response.ok) throw new Error('Failed to approve');

      setSuccess('요청이 승인되었습니다.');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      setError('승인 처리에 실패했습니다.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', notes: rejectReason }),
      });

      if (!response.ok) throw new Error('Failed to reject');

      setSuccess('요청이 거절되었습니다.');
      setSelectedRequest(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      setError('거절 처리에 실패했습니다.');
    }
  };

  const handleBatchAction = async () => {
    if (selectedIds.size === 0) return;
    
    setBatchLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch('/api/admin/approvals', {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id, 
            action: batchAction,
            notes: batchAction === 'reject' ? batchNotes : undefined,
          }),
        })
      );

      await Promise.all(promises);
      
      setSuccess(`${selectedIds.size}건의 요청이 ${batchAction === 'approve' ? '승인' : '거절'}되었습니다.`);
      setShowBatchModal(false);
      setBatchNotes('');
      fetchRequests();
    } catch (err) {
      setError('일괄 처리에 실패했습니다.');
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = requests.filter(r => r.status === 'PENDING').map(r => r.id);
    if (selectedIds.size === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { class: 'badge-warning', label: '대기중' };
      case 'APPROVED': return { class: 'badge-success', label: '승인됨' };
      case 'REJECTED': return { class: 'badge-danger', label: '거절됨' };
      case 'EXPIRED': return { class: 'badge-info', label: '만료됨' };
      default: return { class: 'badge-info', label: status };
    }
  };

  const getEnvBadge = (env: string) => {
    switch (env) {
      case 'PROD': return 'badge-danger';
      case 'STAGE': return 'badge-warning';
      default: return 'badge-success';
    }
  };

  const isEscalated = (request: ApprovalRequest) => {
    if (request.status !== 'PENDING') return false;
    const waitTime = Date.now() - new Date(request.requestedAt).getTime();
    return waitTime > 30 * 60 * 1000; // 30 minutes
  };

  // Stats
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;
  const escalatedCount = requests.filter(isEscalated).length;
  const pendingIds = requests.filter(r => r.status === 'PENDING').map(r => r.id);

  return (
    <AdminLayout
      title="승인 워크플로"
      description="사전/실시간 접근 승인 요청 관리"
      actions={
        <>
          {selectedIds.size > 0 && (
            <>
              <button 
                className="btn btn-success" 
                onClick={() => { setBatchAction('approve'); setShowBatchModal(true); }}
              >
                ✓ 일괄 승인 ({selectedIds.size})
              </button>
              <button 
                className="btn btn-danger" 
                style={{ marginLeft: '8px' }}
                onClick={() => { setBatchAction('reject'); setShowBatchModal(true); }}
              >
                ✗ 일괄 거절
              </button>
            </>
          )}
        </>
      }
    >
      {/* Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Escalation Alert */}
      {escalatedCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>⏰</span>
          <div>
            <strong>{escalatedCount}건</strong>의 요청이 30분 이상 대기 중입니다. 신속한 처리가 필요합니다.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">대기중</div>
          <div className="stat-value" style={{ color: pendingCount > 0 ? 'var(--color-warning)' : undefined }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">승인됨</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{approvedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">거절됨</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{rejectedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">에스컬레이션</div>
          <div className="stat-value" style={{ color: escalatedCount > 0 ? 'var(--color-danger)' : undefined }}>{escalatedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select
            className="form-input form-select"
            style={{ width: '200px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">모든 상태</option>
            <option value="PENDING">대기중</option>
            <option value="APPROVED">승인됨</option>
            <option value="REJECTED">거절됨</option>
            <option value="EXPIRED">만료됨</option>
          </select>
          <button className="btn btn-ghost" onClick={() => fetchRequests()}>
            🔄 새로고침
          </button>
          <div style={{ flex: 1 }} />
          {pendingIds.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={selectedIds.size === pendingIds.length && pendingIds.length > 0}
                onChange={toggleSelectAll}
              />
              전체 선택 ({pendingIds.length})
            </label>
          )}
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          승인 요청이 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>요청자</th>
                  <th>대상 서버</th>
                  <th>목적</th>
                  <th>유형</th>
                  <th>상태</th>
                  <th>요청 시간</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => {
                  const statusBadge = getStatusBadge(request.status);
                  const escalated = isEscalated(request);
                  return (
                    <tr 
                      key={request.id} 
                      style={{ 
                        background: escalated ? 'rgba(234, 179, 8, 0.05)' : undefined,
                        borderLeft: escalated ? '3px solid var(--color-warning)' : undefined,
                      }}
                    >
                      <td>
                        {request.status === 'PENDING' && (
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(request.id)}
                            onChange={() => toggleSelection(request.id)}
                          />
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{request.requester.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {request.requester.email}
                          <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>
                            {request.requester.role}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${getEnvBadge(request.server.environment)}`} style={{ fontSize: '0.65rem' }}>
                            {request.server.environment}
                          </span>
                          <span>{request.server.name}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {request.purpose}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${request.requestType === 'REALTIME' ? 'badge-warning' : 'badge-info'}`}>
                          {request.requestType === 'REALTIME' ? '실시간' : '사전'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                          {escalated && <span title="30분 이상 대기 중">⏰</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {new Date(request.requestedAt).toLocaleString()}
                      </td>
                      <td>
                        {request.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(request.id)}
                            >
                              승인
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              거절
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRequest(request)}>
                            상세
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            disabled={pagination.page <= 1}
            onClick={() => fetchRequests(pagination.page - 1)}
          >
            ← 이전
          </button>
          <span style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button 
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchRequests(pagination.page + 1)}
          >
            다음 →
          </button>
        </div>
      )}

      {/* Detail/Reject Modal */}
      {selectedRequest && (
        <div className="modal-overlay active" onClick={() => setSelectedRequest(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">승인 요청 상세</h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>요청자</div>
                    <div style={{ fontWeight: 500 }}>{selectedRequest.requester.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedRequest.requester.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>대상 서버</div>
                    <div style={{ fontWeight: 500 }}>{selectedRequest.server.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedRequest.server.environment}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>접근 목적</div>
                  <div style={{ fontWeight: 500, padding: '8px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginTop: '4px' }}>
                    {selectedRequest.purpose}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>요청 시간</div>
                    <div style={{ fontWeight: 500 }}>{new Date(selectedRequest.requestedAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>만료 시간</div>
                    <div style={{ fontWeight: 500 }}>{new Date(selectedRequest.expiresAt).toLocaleString()}</div>
                  </div>
                </div>
                {selectedRequest.approver && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>처리자</div>
                    <div style={{ fontWeight: 500 }}>{selectedRequest.approver.name}</div>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>사유</div>
                    <div style={{ fontWeight: 500, padding: '8px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginTop: '4px' }}>
                      {selectedRequest.notes}
                    </div>
                  </div>
                )}
                {selectedRequest.status === 'PENDING' && (
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <label className="form-label">거절 사유</label>
                    <textarea 
                      className="form-input" 
                      rows={3} 
                      placeholder="거절 사유를 입력하세요..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>닫기</button>
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button className="btn btn-success" onClick={() => handleApprove(selectedRequest.id)}>승인</button>
                  <button className="btn btn-danger" onClick={() => handleReject(selectedRequest.id)}>거절</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Action Modal */}
      {showBatchModal && (
        <div className="modal-overlay active" onClick={() => setShowBatchModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {batchAction === 'approve' ? '일괄 승인' : '일괄 거절'}
              </h3>
              <button className="modal-close" onClick={() => setShowBatchModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className={`alert ${batchAction === 'approve' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
                <strong>{selectedIds.size}건</strong>의 요청을 {batchAction === 'approve' ? '승인' : '거절'}합니다.
              </div>
              
              {batchAction === 'reject' && (
                <div className="form-group">
                  <label className="form-label">거절 사유</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    placeholder="일괄 거절 사유를 입력하세요..."
                  />
                </div>
              )}

              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                선택된 요청 목록:
                <div style={{ marginTop: '8px', maxHeight: '100px', overflow: 'auto', padding: '8px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                  {Array.from(selectedIds).map(id => {
                    const req = requests.find(r => r.id === id);
                    return req ? (
                      <div key={id} style={{ marginBottom: '4px' }}>
                        • {req.requester.name} → {req.server.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBatchModal(false)}>취소</button>
              <button 
                className={`btn ${batchAction === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleBatchAction}
                disabled={batchLoading}
              >
                {batchLoading ? '처리 중...' : `${selectedIds.size}건 ${batchAction === 'approve' ? '승인' : '거절'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

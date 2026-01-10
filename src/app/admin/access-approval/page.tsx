'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AccessRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requester: { id: string; name: string; email: string; role: string };
  server: { id: string; name: string; hostname: string; environment: string };
  reason: string;
  accessLevel: 'full' | 'read' | 'limited';
  duration: number; // minutes
  requestedAt: string;
  reviewedAt?: string;
  reviewer?: { name: string; email: string };
  note?: string;
}

export default function AccessApprovalPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [reviewNote, setReviewNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const user = localStorage.getItem('user');
    if (!user) return {};
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockRequests: AccessRequest[] = [
        {
          id: '1',
          status: 'PENDING',
          requester: { id: 'u1', name: '김개발', email: 'dev@example.com', role: 'DEVELOPER' },
          server: { id: 's1', name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD' },
          reason: '긴급 배포를 위한 접근 요청',
          accessLevel: 'full',
          duration: 60,
          requestedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        },
        {
          id: '2',
          status: 'PENDING',
          requester: { id: 'u2', name: '박운영', email: 'ops@example.com', role: 'OPERATOR' },
          server: { id: 's2', name: 'prod-db-01', hostname: '192.168.1.20', environment: 'PROD' },
          reason: '데이터베이스 점검 작업',
          accessLevel: 'read',
          duration: 120,
          requestedAt: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        {
          id: '3',
          status: 'APPROVED',
          requester: { id: 'u1', name: '김개발', email: 'dev@example.com', role: 'DEVELOPER' },
          server: { id: 's3', name: 'stage-web-01', hostname: '192.168.2.10', environment: 'STAGE' },
          reason: '테스트 환경 확인',
          accessLevel: 'full',
          duration: 60,
          requestedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
          reviewedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
          reviewer: { name: '이관리', email: 'admin@example.com' },
        },
        {
          id: '4',
          status: 'REJECTED',
          requester: { id: 'u3', name: '최신입', email: 'new@example.com', role: 'VIEWER' },
          server: { id: 's1', name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD' },
          reason: '로그 확인',
          accessLevel: 'read',
          duration: 30,
          requestedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
          reviewedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
          reviewer: { name: '이관리', email: 'admin@example.com' },
          note: 'VIEWER 역할은 PROD 접근 불가',
        },
      ];
      
      const filtered = statusFilter === 'ALL' 
        ? mockRequests 
        : mockRequests.filter(r => r.status === statusFilter);
      
      setRequests(filtered);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleApprove = (request: AccessRequest) => {
    setMessage({ type: 'success', text: `${request.requester.name}의 ${request.server.name} 접근 요청이 승인되었습니다.` });
    setRequests(requests.filter(r => r.id !== request.id));
    setSelectedRequest(null);
    setReviewNote('');
  };

  const handleReject = (request: AccessRequest) => {
    setMessage({ type: 'error', text: `${request.requester.name}의 ${request.server.name} 접근 요청이 거부되었습니다.` });
    setRequests(requests.filter(r => r.id !== request.id));
    setSelectedRequest(null);
    setReviewNote('');
  };

  const handleBulkApprove = () => {
    const pending = requests.filter(r => r.status === 'PENDING');
    setMessage({ type: 'success', text: `${pending.length}개 요청이 일괄 승인되었습니다.` });
    setRequests([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { class: 'badge-warning', label: '대기중' };
      case 'APPROVED': return { class: 'badge-success', label: '승인됨' };
      case 'REJECTED': return { class: 'badge-danger', label: '거부됨' };
      case 'EXPIRED': return { class: 'badge-info', label: '만료됨' };
      default: return { class: '', label: status };
    }
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#ef4444';
      case 'OPERATOR': return '#f59e0b';
      case 'DEVELOPER': return '#3b82f6';
      case 'VIEWER': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <AdminLayout 
      title="접근 요청 승인" 
      description="서버 접근 요청 검토 및 승인"
      actions={
        pendingCount > 0 ? (
          <button className="btn btn-primary" onClick={handleBulkApprove}>
            ✅ 전체 승인 ({pendingCount})
          </button>
        ) : null
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: statusFilter === 'PENDING' ? '3px solid var(--color-warning)' : 'none' }} onClick={() => setStatusFilter('PENDING')}>
          <div className="stat-label">대기중</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{pendingCount}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: statusFilter === 'APPROVED' ? '3px solid var(--color-success)' : 'none' }} onClick={() => setStatusFilter('APPROVED')}>
          <div className="stat-label">승인됨</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>12</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: statusFilter === 'REJECTED' ? '3px solid var(--color-danger)' : 'none' }} onClick={() => setStatusFilter('REJECTED')}>
          <div className="stat-label">거부됨</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>3</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', borderLeft: statusFilter === 'ALL' ? '3px solid var(--color-primary)' : 'none' }} onClick={() => setStatusFilter('ALL')}>
          <div className="stat-label">전체</div>
          <div className="stat-value">17</div>
        </div>
      </div>

      {/* Request List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
          {statusFilter === 'PENDING' ? '대기중인 요청이 없습니다.' : '요청이 없습니다.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map(request => {
            const badge = getStatusBadge(request.status);
            return (
              <div 
                key={request.id} 
                className="card" 
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer',
                  borderLeft: request.status === 'PENDING' ? '3px solid var(--color-warning)' : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelectedRequest(request)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span className={`badge ${badge.class}`}>{badge.label}</span>
                      <span style={{ fontWeight: 600 }}>{request.requester.name}</span>
                      <span style={{ padding: '2px 6px', background: getRoleColor(request.requester.role) + '20', color: getRoleColor(request.requester.role), borderRadius: '4px', fontSize: '0.7rem' }}>
                        {request.requester.role}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>→</span>
                      <span style={{ padding: '2px 8px', background: getEnvColor(request.server.environment) + '20', color: getEnvColor(request.server.environment), borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {request.server.environment}
                      </span>
                      <span style={{ fontWeight: 500 }}>{request.server.name}</span>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      💬 {request.reason}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span>⏱️ {request.duration}분</span>
                      <span>🔐 {request.accessLevel === 'full' ? '전체 권한' : request.accessLevel === 'read' ? '읽기 전용' : '제한됨'}</span>
                      <span>📅 {getTimeAgo(request.requestedAt)}</span>
                    </div>
                  </div>
                  {request.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm" style={{ background: '#ef444420', color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleReject(request); }}>
                        ❌ 거부
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleApprove(request); }}>
                        ✅ 승인
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay active" onClick={() => setSelectedRequest(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 접근 요청 상세</h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Requester */}
              <div className="form-group">
                <label className="form-label">요청자</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                    {selectedRequest.requester.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{selectedRequest.requester.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{selectedRequest.requester.email}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', padding: '2px 8px', background: getRoleColor(selectedRequest.requester.role) + '20', color: getRoleColor(selectedRequest.requester.role), borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {selectedRequest.requester.role}
                  </span>
                </div>
              </div>

              {/* Server */}
              <div className="form-group">
                <label className="form-label">대상 서버</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                  <span style={{ padding: '4px 10px', background: getEnvColor(selectedRequest.server.environment) + '20', color: getEnvColor(selectedRequest.server.environment), borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {selectedRequest.server.environment}
                  </span>
                  <span style={{ fontWeight: 500 }}>{selectedRequest.server.name}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedRequest.server.hostname}</span>
                </div>
              </div>

              {/* Request Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">접근 수준</label>
                  <div style={{ padding: '10px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                    {selectedRequest.accessLevel === 'full' ? '🔓 전체 권한' : selectedRequest.accessLevel === 'read' ? '👁️ 읽기 전용' : '🔒 제한됨'}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">요청 기간</label>
                  <div style={{ padding: '10px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                    ⏱️ {selectedRequest.duration}분
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">요청 사유</label>
                <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Review Note */}
              {selectedRequest.status === 'PENDING' && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">검토 의견 (선택)</label>
                  <textarea 
                    className="form-input"
                    placeholder="승인/거부 사유를 입력하세요..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              {/* Previous Review */}
              {selectedRequest.reviewer && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-surface)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    검토자: {selectedRequest.reviewer.name} ({formatTime(selectedRequest.reviewedAt!)})
                  </div>
                  {selectedRequest.note && (
                    <div style={{ fontSize: '0.9rem' }}>{selectedRequest.note}</div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>닫기</button>
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button className="btn" style={{ background: '#ef444420', color: '#ef4444' }} onClick={() => handleReject(selectedRequest)}>
                    ❌ 거부
                  </button>
                  <button className="btn btn-primary" onClick={() => handleApprove(selectedRequest)}>
                    ✅ 승인
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

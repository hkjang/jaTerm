'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ApprovalRequest {
  id: string;
  requester: { name: string; email: string; role: string };
  server: { name: string; environment: string };
  purpose: string;
  requestType: 'PRIOR' | 'REALTIME';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approver?: { name: string; email: string };
  requestedAt: Date;
  expiresAt: Date;
  approvedAt?: Date;
  notes?: string;
}

const mockRequests: ApprovalRequest[] = [
  {
    id: '1',
    requester: { name: '김철수', email: 'operator@jaterm.com', role: 'OPERATOR' },
    server: { name: 'prod-web-01', environment: 'PROD' },
    purpose: '긴급 장애 대응 - 로그 확인',
    requestType: 'PRIOR',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 1800000),
    expiresAt: new Date(Date.now() + 3600000),
  },
  {
    id: '2',
    requester: { name: '이영희', email: 'dev@jaterm.com', role: 'DEVELOPER' },
    server: { name: 'prod-api-01', environment: 'PROD' },
    purpose: '배포 후 모니터링',
    requestType: 'REALTIME',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 600000),
    expiresAt: new Date(Date.now() + 1800000),
  },
  {
    id: '3',
    requester: { name: '박민수', email: 'dev2@jaterm.com', role: 'DEVELOPER' },
    server: { name: 'stage-web-01', environment: 'STAGE' },
    purpose: '테스트 환경 점검',
    requestType: 'PRIOR',
    status: 'APPROVED',
    approver: { name: '홍길동', email: 'admin@jaterm.com' },
    requestedAt: new Date(Date.now() - 7200000),
    expiresAt: new Date(Date.now() + 10800000),
    approvedAt: new Date(Date.now() - 3600000),
  },
  {
    id: '4',
    requester: { name: '정수진', email: 'dev3@jaterm.com', role: 'DEVELOPER' },
    server: { name: 'prod-db-01', environment: 'PROD' },
    purpose: '데이터베이스 쿼리 실행',
    requestType: 'PRIOR',
    status: 'REJECTED',
    approver: { name: '홍길동', email: 'admin@jaterm.com' },
    requestedAt: new Date(Date.now() - 86400000),
    expiresAt: new Date(Date.now() - 82800000),
    notes: '보안 정책 위반 - 직접 DB 접근 불가',
  },
];

export default function ApprovalsPage() {
  const [requests, setRequests] = useState(mockRequests);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

  const filteredRequests = requests.filter(req => {
    return !statusFilter || req.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { class: 'badge-warning', label: '대기중' };
      case 'APPROVED': return { class: 'badge-success', label: '승인됨' };
      case 'REJECTED': return { class: 'badge-danger', label: '거절됨' };
      case 'EXPIRED': return { class: 'badge-info', label: '만료됨' };
      default: return { class: 'badge-info', label: status };
    }
  };

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(req => 
      req.id === id 
        ? { ...req, status: 'APPROVED' as const, approvedAt: new Date(), approver: { name: '현재 관리자', email: 'admin@jaterm.com' } }
        : req
    ));
    setSelectedRequest(null);
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(req => 
      req.id === id 
        ? { ...req, status: 'REJECTED' as const, approver: { name: '현재 관리자', email: 'admin@jaterm.com' } }
        : req
    ));
    setSelectedRequest(null);
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <AdminLayout
      title="승인 워크플로"
      description="사전/실시간 접근 승인 요청 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">대기중</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">오늘 승인</div>
          <div className="stat-value">{requests.filter(r => r.status === 'APPROVED').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">오늘 거절</div>
          <div className="stat-value">{requests.filter(r => r.status === 'REJECTED').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">만료됨</div>
          <div className="stat-value">{requests.filter(r => r.status === 'EXPIRED').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
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
        </div>
      </div>

      {/* Requests Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
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
              {filteredRequests.map(request => {
                const statusBadge = getStatusBadge(request.status);
                return (
                  <tr key={request.id}>
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
                        <span className={`badge ${
                          request.server.environment === 'PROD' ? 'badge-danger' : 
                          request.server.environment === 'STAGE' ? 'badge-warning' : 'badge-success'
                        }`} style={{ fontSize: '0.65rem' }}>
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
                      <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {request.requestedAt.toLocaleString()}
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

      {/* Detail/Reject Modal */}
      {selectedRequest && (
        <div className="modal-overlay active" onClick={() => setSelectedRequest(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">승인 요청 상세</h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '16px' }}>
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
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>접근 목적</div>
                  <div style={{ fontWeight: 500 }}>{selectedRequest.purpose}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>만료 시간</div>
                  <div style={{ fontWeight: 500 }}>{selectedRequest.expiresAt.toLocaleString()}</div>
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
                    <div style={{ fontWeight: 500 }}>{selectedRequest.notes}</div>
                  </div>
                )}
                {selectedRequest.status === 'PENDING' && (
                  <div className="form-group">
                    <label className="form-label">거절 사유</label>
                    <textarea className="form-input" rows={3} placeholder="거절 사유를 입력하세요..." />
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
    </AdminLayout>
  );
}

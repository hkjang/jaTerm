'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AuditUser {
  id: string;
  name: string | null;
  email: string;
}

interface AuditLog {
  id: string;
  userId: string | null;
  user: AuditUser | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const user = localStorage.getItem('user');
    if (!user) return {};
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  };

  const getDateRangeParams = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeParams();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        startDate,
        endDate,
      });
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);

      const response = await fetch(`/api/admin/audit?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError('감사 로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, resourceFilter, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const { startDate, endDate } = getDateRangeParams();
      
      const response = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          action: actionFilter || undefined,
          resource: resourceFilter || undefined,
          format,
        }),
      });

      if (!response.ok) throw new Error('Failed to export logs');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setSuccess('로그가 내보내졌습니다.');
    } catch (err) {
      setError('로그 내보내기에 실패했습니다.');
    }
  };

  const handleVerifyIntegrity = async (logId: string) => {
    try {
      const response = await fetch('/api/admin/audit', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });

      const data = await response.json();
      
      if (data.integrity === 'verified') {
        setSuccess('무결성 검증 완료: 해시가 유효합니다.');
      } else {
        setError('무결성 검증 실패: 로그가 변조되었을 수 있습니다.');
      }
    } catch (err) {
      setError('무결성 검증에 실패했습니다.');
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('BLOCKED') || action.includes('FAILED')) return 'badge-danger';
    if (action.includes('CREATE') || action.includes('START') || action.includes('LOGIN')) return 'badge-success';
    if (action.includes('UPDATE') || action.includes('EXECUTE')) return 'badge-info';
    if (action.includes('DELETE') || action.includes('END') || action.includes('TERMINATED')) return 'badge-warning';
    return 'badge-info';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('SESSION')) return '📺';
    if (action.includes('COMMAND')) return '⌨️';
    if (action.includes('LOGIN') || action.includes('OTP')) return '🔐';
    if (action.includes('POLICY')) return '📋';
    if (action.includes('SERVER')) return '🖥️';
    if (action.includes('USER')) return '👤';
    return '📝';
  };

  return (
    <AdminLayout 
      title="감사 로그" 
      description="모든 시스템 활동 기록 및 검색"
      actions={
        <>
          <button className="btn btn-secondary" onClick={() => setShowRetentionModal(true)}>⚙️ 보존 정책</button>
          <div style={{ display: 'inline-flex', gap: '8px', marginLeft: '8px' }}>
            <button className="btn btn-secondary" onClick={() => handleExport('csv')}>📥 CSV</button>
            <button className="btn btn-secondary" onClick={() => handleExport('json')}>📥 JSON</button>
          </div>
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

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="사용자, 명령어, IP 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="form-input form-select" 
            style={{ width: '180px' }} 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">모든 액션</option>
            <option value="CREATE">생성</option>
            <option value="UPDATE">수정</option>
            <option value="DELETE">삭제</option>
            <option value="LOGIN">로그인</option>
            <option value="LOGIN_FAILED">로그인 실패</option>
            <option value="OTP_SETUP">OTP 설정</option>
            <option value="OTP_RESET">OTP 초기화</option>
            <option value="SESSION_START">세션 시작</option>
            <option value="SESSION_END">세션 종료</option>
            <option value="SESSION_TERMINATED">세션 강제종료</option>
            <option value="COMMAND_BLOCKED">명령 차단</option>
          </select>
          <select 
            className="form-input form-select" 
            style={{ width: '150px' }} 
            value={resourceFilter} 
            onChange={(e) => setResourceFilter(e.target.value)}
          >
            <option value="">모든 리소스</option>
            <option value="User">사용자</option>
            <option value="Server">서버</option>
            <option value="Policy">정책</option>
            <option value="TerminalSession">세션</option>
            <option value="CommandLog">명령</option>
          </select>
          <select 
            className="form-input form-select" 
            style={{ width: '150px' }} 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="1d">최근 1일</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            로그가 없습니다.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>사용자</th>
                  <th>액션</th>
                  <th>리소스</th>
                  <th>상세</th>
                  <th>IP</th>
                  <th>검증</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleDateString()}<br />{new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.user?.name || 'System'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.user?.email || '-'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getActionIcon(log.action)}</span>
                        <span className={`badge ${getActionBadge(log.action)}`}>{log.action}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{log.resource}</div>
                      {log.resourceId && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {log.resourceId.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      {log.details && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {Boolean((log.details as Record<string, unknown>).hash) && (
                            <span style={{ color: 'var(--color-success)' }}>✓ </span>
                          )}
                          {Object.entries(log.details as Record<string, unknown>)
                            .filter(([k]) => k !== 'hash' && k !== 'before' && k !== 'after' && k !== 'changes')
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
                            .join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {log.ipAddress || '-'}
                    </td>
                    <td>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleVerifyIntegrity(log.id)}
                        title="무결성 검증"
                      >
                        🔍
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          <div>총 {pagination.total}개 항목</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              ← 이전
            </button>
            <span style={{ padding: '8px' }}>{pagination.page} / {pagination.totalPages}</span>
            <button 
              className="btn btn-ghost btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Retention Policy Modal */}
      {showRetentionModal && (
        <div className="modal-overlay active" onClick={() => setShowRetentionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">보존 정책 설정</h3>
              <button className="modal-close" onClick={() => setShowRetentionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">로그 보존 기간</label>
                <select 
                  className="form-input form-select"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                >
                  <option value="30">30일</option>
                  <option value="60">60일</option>
                  <option value="90">90일 (권장)</option>
                  <option value="180">180일</option>
                  <option value="365">365일</option>
                </select>
              </div>
              <div className="alert alert-warning" style={{ marginTop: '16px' }}>
                ⚠️ 보존 기간을 초과한 로그는 영구 삭제됩니다.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRetentionModal(false)}>취소</button>
              <button className="btn btn-danger">정책 적용 및 삭제</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

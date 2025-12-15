'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AIAuditLog {
  id: string;
  userId: string;
  providerId: string | null;
  providerName: string | null;
  modelName: string | null;
  feature: string;
  promptHash: string;
  promptLength: number;
  responseTokens: number | null;
  durationMs: number | null;
  status: 'success' | 'failed' | 'blocked';
  errorMessage: string | null;
  ipAddress: string | null;
  timestamp: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AILogsPage() {
  const [logs, setLogs] = useState<AIAuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    feature: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));
      
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.feature) params.set('feature', filters.feature);
      if (filters.status) params.set('status', filters.status);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await fetch(`/api/admin/ai-logs?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({
      userId: '',
      feature: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success">성공</span>;
      case 'failed':
        return <span className="badge badge-danger">실패</span>;
      case 'blocked':
        return <span className="badge badge-warning">차단</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const getFeatureLabel = (feature: string) => {
    const labels: Record<string, string> = {
      explain: '명령 설명',
      generate: '명령 생성',
      analyze: '위험 분석',
      summarize: '로그 요약',
    };
    return labels[feature] || feature;
  };

  // 통계 계산
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    blocked: logs.filter(l => l.status === 'blocked').length,
  };

  return (
    <AdminLayout title="AI 호출 로그" description="AI 기능 사용 기록 및 감사 로그">
      {/* 통계 카드 */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 호출</div>
          <div className="stat-value">{pagination.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">성공</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.success}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">실패</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{stats.failed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">차단</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.blocked}</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>🔍 검색 필터</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">사용자 ID</label>
            <input
              type="text"
              className="form-input"
              value={filters.userId}
              onChange={e => setFilters({ ...filters, userId: e.target.value })}
              placeholder="사용자 ID"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">기능</label>
            <select
              className="form-input form-select"
              value={filters.feature}
              onChange={e => setFilters({ ...filters, feature: e.target.value })}
            >
              <option value="">전체</option>
              <option value="explain">명령 설명</option>
              <option value="generate">명령 생성</option>
              <option value="analyze">위험 분석</option>
              <option value="summarize">로그 요약</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">상태</label>
            <select
              className="form-input form-select"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">전체</option>
              <option value="success">성공</option>
              <option value="failed">실패</option>
              <option value="blocked">차단</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">시작일</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">종료일</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSearch}>검색</button>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>초기화</button>
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600 }}>📋 호출 로그</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            총 {pagination.total}건
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            로그가 없습니다.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>사용자</th>
                    <th>기능</th>
                    <th>Provider</th>
                    <th>모델</th>
                    <th>상태</th>
                    <th>토큰</th>
                    <th>응답시간</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>{log.userId.slice(0, 8)}...</code>
                      </td>
                      <td>
                        <span className="badge badge-info">{getFeatureLabel(log.feature)}</span>
                      </td>
                      <td>{log.providerName || '-'}</td>
                      <td>{log.modelName || '-'}</td>
                      <td>{getStatusBadge(log.status)}</td>
                      <td style={{ textAlign: 'right' }}>{log.responseTokens || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {log.durationMs ? `${log.durationMs}ms` : '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{log.ipAddress || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div style={{ 
                marginTop: '16px', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '8px' 
              }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  이전
                </button>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0 12px',
                  fontSize: '0.9rem' 
                }}>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

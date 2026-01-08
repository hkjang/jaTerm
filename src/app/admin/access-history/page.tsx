'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  email: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  location?: string;
  timestamp: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AccessHistoryPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [error, setError] = useState('');

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

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (actionFilter) params.set('action', actionFilter);

      const response = await fetch(`/api/admin/access-history?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('접근 이력을 불러오는데 실패했습니다.');
      console.error('Fetch access history error:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN': return { class: 'badge-success', label: '로그인' };
      case 'LOGOUT': return { class: 'badge-info', label: '로그아웃' };
      case 'LOGIN_FAILED': return { class: 'badge-danger', label: '로그인 실패' };
      case 'OTP_SETUP': return { class: 'badge-info', label: 'OTP 설정' };
      case 'OTP_VERIFY': return { class: 'badge-success', label: 'MFA 성공' };
      case 'OTP_FAILED': return { class: 'badge-danger', label: 'MFA 실패' };
      case 'OTP_RESET': return { class: 'badge-warning', label: 'OTP 초기화' };
      default: return { class: 'badge-info', label: action };
    }
  };

  const loginCount = logs.filter(l => l.action === 'LOGIN').length;
  const failedCount = logs.filter(l => l.action === 'LOGIN_FAILED' || l.action === 'OTP_FAILED').length;
  const mfaCount = logs.filter(l => l.action.includes('OTP')).length;
  const uniqueUsers = new Set(logs.map(l => l.userId)).size;

  return (
    <AdminLayout 
      title="접근 이력" 
      description="사용자 로그인/로그아웃 기록 조회"
      actions={<button className="btn btn-secondary">📥 내보내기</button>}
    >
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">로그인</div>
          <div className="stat-value">{loginCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">인증 실패</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{failedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MFA 인증</div>
          <div className="stat-value">{mfaCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">고유 사용자</div>
          <div className="stat-value">{uniqueUsers}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <input type="text" className="form-input" placeholder="사용자, IP 검색..." style={{ flex: 1 }} />
          <select 
            className="form-input form-select" 
            style={{ width: '150px' }} 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">모든 액션</option>
            <option value="LOGIN">로그인</option>
            <option value="LOGOUT">로그아웃</option>
            <option value="LOGIN_FAILED">로그인 실패</option>
            <option value="OTP_VERIFY">MFA 성공</option>
            <option value="OTP_FAILED">MFA 실패</option>
          </select>
          <button className="btn btn-ghost" onClick={() => fetchLogs()}>🔄 새로고침</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          접근 이력이 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>시간</th><th>사용자</th><th>액션</th><th>IP 주소</th><th>위치</th><th>브라우저</th></tr></thead>
              <tbody>
                {logs.map(log => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{log.userName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{log.email}</div>
                      </td>
                      <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{log.ipAddress || '-'}</td>
                      <td>{log.location || '-'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{log.userAgent || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            disabled={pagination.page <= 1}
            onClick={() => fetchLogs(pagination.page - 1)}
          >
            ← 이전
          </button>
          <span style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button 
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchLogs(pagination.page + 1)}
          >
            다음 →
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

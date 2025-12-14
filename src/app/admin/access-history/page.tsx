'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  email: string;
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'MFA_SUCCESS' | 'MFA_FAILED';
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
}

const mockAccessLogs: AccessLog[] = [
  { id: '1', userId: '1', userName: '홍길동', email: 'admin@jaterm.com', action: 'LOGIN', ipAddress: '192.168.1.100', userAgent: 'Chrome/120', location: '대한민국 서울', timestamp: new Date() },
  { id: '2', userId: '1', userName: '홍길동', email: 'admin@jaterm.com', action: 'MFA_SUCCESS', ipAddress: '192.168.1.100', userAgent: 'Chrome/120', timestamp: new Date(Date.now() - 60000) },
  { id: '3', userId: '2', userName: '김철수', email: 'operator@jaterm.com', action: 'LOGIN', ipAddress: '192.168.1.101', userAgent: 'Firefox/121', location: '대한민국 부산', timestamp: new Date(Date.now() - 3600000) },
  { id: '4', userId: '3', userName: '이영희', email: 'dev@jaterm.com', action: 'LOGIN_FAILED', ipAddress: '10.0.0.50', userAgent: 'Chrome/120', location: '미상', timestamp: new Date(Date.now() - 7200000) },
  { id: '5', userId: '2', userName: '김철수', email: 'operator@jaterm.com', action: 'LOGOUT', ipAddress: '192.168.1.101', userAgent: 'Firefox/121', timestamp: new Date(Date.now() - 86400000) },
];

export default function AccessHistoryPage() {
  const [logs] = useState(mockAccessLogs);
  const [actionFilter, setActionFilter] = useState<string>('');

  const filteredLogs = logs.filter(log => !actionFilter || log.action === actionFilter);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN': return { class: 'badge-success', label: '로그인' };
      case 'LOGOUT': return { class: 'badge-info', label: '로그아웃' };
      case 'LOGIN_FAILED': return { class: 'badge-danger', label: '로그인 실패' };
      case 'MFA_SUCCESS': return { class: 'badge-success', label: 'MFA 성공' };
      case 'MFA_FAILED': return { class: 'badge-danger', label: 'MFA 실패' };
      default: return { class: 'badge-info', label: action };
    }
  };

  return (
    <AdminLayout title="접근 이력" description="사용자 로그인/로그아웃 기록 조회"
      actions={<button className="btn btn-secondary">📥 내보내기</button>}>
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">오늘 로그인</div><div className="stat-value">{logs.filter(l => l.action === 'LOGIN').length}</div></div>
        <div className="stat-card"><div className="stat-label">로그인 실패</div><div className="stat-value" style={{ color: 'var(--color-danger)' }}>{logs.filter(l => l.action === 'LOGIN_FAILED').length}</div></div>
        <div className="stat-card"><div className="stat-label">MFA 인증</div><div className="stat-value">{logs.filter(l => l.action.includes('MFA')).length}</div></div>
        <div className="stat-card"><div className="stat-label">고유 사용자</div><div className="stat-value">{new Set(logs.map(l => l.userId)).size}</div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <input type="text" className="form-input" placeholder="사용자, IP 검색..." style={{ flex: 1 }} />
          <select className="form-input form-select" style={{ width: '150px' }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">모든 액션</option>
            <option value="LOGIN">로그인</option>
            <option value="LOGOUT">로그아웃</option>
            <option value="LOGIN_FAILED">로그인 실패</option>
            <option value="MFA_SUCCESS">MFA 성공</option>
            <option value="MFA_FAILED">MFA 실패</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>시간</th><th>사용자</th><th>액션</th><th>IP 주소</th><th>위치</th><th>브라우저</th></tr></thead>
            <tbody>
              {filteredLogs.map(log => {
                const badge = getActionBadge(log.action);
                return (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{log.timestamp.toLocaleString()}</td>
                    <td><div style={{ fontWeight: 500 }}>{log.userName}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{log.email}</div></td>
                    <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{log.ipAddress}</td>
                    <td>{log.location || '-'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{log.userAgent}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

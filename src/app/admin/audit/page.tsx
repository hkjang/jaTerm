'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  timestamp: Date;
}

const mockAuditLogs: AuditLog[] = [
  { id: '1', userId: '1', userName: '홍길동', action: 'SESSION_START', resource: 'TerminalSession', resourceId: 'session-123', details: '서버 prod-web-01 접속', ipAddress: '192.168.1.100', timestamp: new Date(Date.now() - 3600000) },
  { id: '2', userId: '1', userName: '홍길동', action: 'COMMAND_EXECUTE', resource: 'CommandLog', resourceId: 'cmd-456', details: 'ls -la /var/log', ipAddress: '192.168.1.100', timestamp: new Date(Date.now() - 3500000) },
  { id: '3', userId: '2', userName: '김철수', action: 'COMMAND_BLOCKED', resource: 'CommandLog', resourceId: 'cmd-789', details: 'rm -rf / 명령 차단됨', ipAddress: '192.168.1.101', timestamp: new Date(Date.now() - 7200000) },
  { id: '4', userId: '1', userName: '홍길동', action: 'SESSION_END', resource: 'TerminalSession', resourceId: 'session-120', details: '세션 정상 종료', ipAddress: '192.168.1.100', timestamp: new Date(Date.now() - 10800000) },
  { id: '5', userId: '3', userName: '이영희', action: 'LOGIN', resource: 'User', resourceId: 'user-3', details: 'MFA 인증 성공', ipAddress: '192.168.1.102', timestamp: new Date(Date.now() - 14400000) },
  { id: '6', userId: '1', userName: '홍길동', action: 'POLICY_UPDATE', resource: 'Policy', resourceId: 'policy-1', details: '프로덕션 정책 수정', ipAddress: '192.168.1.100', timestamp: new Date(Date.now() - 86400000) },
  { id: '7', userId: '2', userName: '김철수', action: 'SERVER_CREATE', resource: 'Server', resourceId: 'server-5', details: 'dev-database 서버 등록', ipAddress: '192.168.1.101', timestamp: new Date(Date.now() - 172800000) },
];

export default function AuditPage() {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('7d');

  const filteredLogs = logs.filter(log => {
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('BLOCKED')) return 'badge-danger';
    if (action.includes('CREATE') || action.includes('START')) return 'badge-success';
    if (action.includes('UPDATE') || action.includes('EXECUTE')) return 'badge-info';
    if (action.includes('DELETE') || action.includes('END')) return 'badge-warning';
    return 'badge-info';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('SESSION')) return '📺';
    if (action.includes('COMMAND')) return '⌨️';
    if (action.includes('LOGIN')) return '🔐';
    if (action.includes('POLICY')) return '📋';
    if (action.includes('SERVER')) return '🖥️';
    if (action.includes('USER')) return '👤';
    return '📝';
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      <aside className="sidebar" style={{ position: 'relative', height: '100vh' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="header-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>⌘</div>
          <span style={{ fontWeight: 600 }}>jaTerm Admin</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Overview</div>
            <Link href="/admin" className="sidebar-link"><span className="sidebar-link-icon">📊</span><span>대시보드</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Management</div>
            <Link href="/admin/users" className="sidebar-link"><span className="sidebar-link-icon">👥</span><span>사용자 관리</span></Link>
            <Link href="/admin/servers" className="sidebar-link"><span className="sidebar-link-icon">🖥️</span><span>서버 관리</span></Link>
            <Link href="/admin/policies" className="sidebar-link"><span className="sidebar-link-icon">📋</span><span>정책 관리</span></Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Monitoring</div>
            <Link href="/admin/sessions" className="sidebar-link"><span className="sidebar-link-icon">📺</span><span>세션 관제</span></Link>
            <Link href="/admin/audit" className="sidebar-link active"><span className="sidebar-link-icon">📝</span><span>감사 로그</span></Link>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>감사 로그</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>모든 시스템 활동 기록 및 검색</p>
          </div>
          <button className="btn btn-secondary">
            📥 내보내기
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="사용자, 명령어, IP 검색..."
              />
            </div>
            <select 
              className="form-input form-select" 
              style={{ width: '180px' }}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">모든 액션</option>
              <option value="SESSION_START">세션 시작</option>
              <option value="SESSION_END">세션 종료</option>
              <option value="COMMAND_EXECUTE">명령 실행</option>
              <option value="COMMAND_BLOCKED">명령 차단</option>
              <option value="LOGIN">로그인</option>
              <option value="POLICY_UPDATE">정책 변경</option>
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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>사용자</th>
                  <th>액션</th>
                  <th>상세</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ 
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.timestamp.toLocaleDateString()}<br />
                      {log.timestamp.toLocaleTimeString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.userName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {log.userId}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getActionIcon(log.action)}</span>
                        <span className={`badge ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontSize: '0.9rem' }}>{log.details}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {log.resource}: {log.resourceId}
                      </div>
                    </td>
                    <td style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '16px',
          color: 'var(--color-text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div>총 {filteredLogs.length}개 항목</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" disabled>← 이전</button>
            <button className="btn btn-ghost btn-sm">다음 →</button>
          </div>
        </div>
      </main>
    </div>
  );
}

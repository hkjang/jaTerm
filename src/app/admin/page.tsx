'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data
const mockStats = {
  activeUsers: 24,
  activeSessions: 12,
  totalServers: 15,
  blockedCommands: 3,
  securityAlerts: 2,
  approvalsPending: 5,
};

const mockRecentSessions = [
  { id: '1', user: 'admin@jaterm.com', server: 'prod-web-01', startedAt: new Date(Date.now() - 3600000), status: 'ACTIVE' },
  { id: '2', user: 'operator@jaterm.com', server: 'stage-api-01', startedAt: new Date(Date.now() - 7200000), status: 'ACTIVE' },
  { id: '3', user: 'dev@jaterm.com', server: 'dev-server-01', startedAt: new Date(Date.now() - 10800000), status: 'DISCONNECTED' },
];

const mockAlerts = [
  { id: '1', type: 'DANGEROUS_COMMAND', severity: 'CRITICAL', message: 'rm -rf / 명령 차단됨', time: new Date(Date.now() - 1800000) },
  { id: '2', type: 'ANOMALY_DETECTED', severity: 'HIGH', message: '비정상적인 접속 시간 감지', time: new Date(Date.now() - 3600000) },
];

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const formatDuration = (startedAt: Date) => {
    const diff = Date.now() - startedAt.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ position: 'relative', height: '100vh' }}>
        <div style={{ 
          padding: '16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div className="header-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>⌘</div>
          <span style={{ fontWeight: 600 }}>jaTerm Admin</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Overview</div>
            <Link href="/admin" className="sidebar-link active">
              <span className="sidebar-link-icon">📊</span>
              <span>대시보드</span>
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Management</div>
            <Link href="/admin/users" className="sidebar-link">
              <span className="sidebar-link-icon">👥</span>
              <span>사용자 관리</span>
            </Link>
            <Link href="/admin/servers" className="sidebar-link">
              <span className="sidebar-link-icon">🖥️</span>
              <span>서버 관리</span>
            </Link>
            <Link href="/admin/policies" className="sidebar-link">
              <span className="sidebar-link-icon">📋</span>
              <span>정책 관리</span>
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Monitoring</div>
            <Link href="/admin/sessions" className="sidebar-link">
              <span className="sidebar-link-icon">📺</span>
              <span>세션 관제</span>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{mockStats.activeSessions}</span>
            </Link>
            <Link href="/admin/audit" className="sidebar-link">
              <span className="sidebar-link-icon">📝</span>
              <span>감사 로그</span>
            </Link>
            <Link href="/admin/alerts" className="sidebar-link">
              <span className="sidebar-link-icon">🚨</span>
              <span>보안 알림</span>
              {mockStats.securityAlerts > 0 && (
                <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{mockStats.securityAlerts}</span>
              )}
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Workflow</div>
            <Link href="/admin/approvals" className="sidebar-link">
              <span className="sidebar-link-icon">✅</span>
              <span>승인 요청</span>
              {mockStats.approvalsPending > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{mockStats.approvalsPending}</span>
              )}
            </Link>
          </div>
        </nav>

        <div style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <Link href="/terminal" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
            터미널로 이동
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)',
        padding: '24px',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>관리자 대시보드</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>시스템 현황 및 보안 모니터링</p>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-label">활성 사용자</div>
            <div className="stat-value">{mockStats.activeUsers}</div>
            <div className="stat-change positive">↑ 12% vs 지난주</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">활성 세션</div>
            <div className="stat-value">{mockStats.activeSessions}</div>
            <div className="stat-change positive">실시간</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">등록된 서버</div>
            <div className="stat-value">{mockStats.totalServers}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              PROD: 5 | STAGE: 4 | DEV: 6
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">차단된 명령</div>
            <div className="stat-value">{mockStats.blockedCommands}</div>
            <div className="stat-change" style={{ color: 'var(--color-danger)' }}>오늘</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Active Sessions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">활성 세션</h2>
              <Link href="/admin/sessions" className="btn btn-ghost btn-sm">전체 보기</Link>
            </div>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>사용자</th>
                    <th>서버</th>
                    <th>시간</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRecentSessions.map(session => (
                    <tr key={session.id}>
                      <td style={{ fontWeight: 500 }}>{session.user.split('@')[0]}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{session.server}</td>
                      <td>{formatDuration(session.startedAt)}</td>
                      <td>
                        <span className={`badge badge-${session.status === 'ACTIVE' ? 'success' : 'info'}`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Alerts */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">보안 알림</h2>
              <Link href="/admin/alerts" className="btn btn-ghost btn-sm">전체 보기</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mockAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`alert alert-${alert.severity === 'CRITICAL' ? 'danger' : 'warning'}`}
                >
                  <span style={{ fontSize: '1.2rem' }}>
                    {alert.severity === 'CRITICAL' ? '⛔' : '⚠️'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{alert.message}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {alert.type} • {new Date(alert.time).toLocaleTimeString()}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm">처리</button>
                </div>
              ))}

              {mockAlerts.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: 'var(--color-text-muted)'
                }}>
                  현재 알림이 없습니다
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">빠른 작업</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/admin/users" className="btn btn-secondary">
              👥 사용자 추가
            </Link>
            <Link href="/admin/servers" className="btn btn-secondary">
              🖥️ 서버 등록
            </Link>
            <Link href="/admin/policies" className="btn btn-secondary">
              📋 정책 생성
            </Link>
            <Link href="/admin/audit" className="btn btn-secondary">
              📝 로그 검색
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

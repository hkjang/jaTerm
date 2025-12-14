'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mock real-time data
const mockStats = {
  activeUsers: 24,
  activeSessions: 12,
  totalServers: 15,
  blockedCommands: 3,
  securityAlerts: 2,
  approvalsPending: 5,
  // New metrics
  commandsToday: 1847,
  avgResponseTime: 23,
  serverLoad: 67,
  slaCompliance: 99.7,
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (startedAt: Date) => {
    const diff = Date.now() - startedAt.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '24px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>관리자 대시보드</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>시스템 현황 및 보안 모니터링</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {currentTime.toLocaleString()}
            </div>
            <span className="badge badge-success">● 시스템 정상</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(6, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-label">동시 세션</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{mockStats.activeSessions}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>실시간</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">명령 실행</div>
            <div className="stat-value">{mockStats.commandsToday.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>오늘</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">차단 건수</div>
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{mockStats.blockedCommands}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>오늘</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">서버 부하</div>
            <div className="stat-value">{mockStats.serverLoad}%</div>
            <div style={{ height: '4px', background: 'var(--color-surface)', borderRadius: '2px', marginTop: '8px' }}>
              <div style={{ width: `${mockStats.serverLoad}%`, height: '100%', background: mockStats.serverLoad > 80 ? 'var(--color-danger)' : 'var(--color-success)', borderRadius: '2px' }} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">AI 경고</div>
            <div className="stat-value" style={{ color: mockStats.securityAlerts > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{mockStats.securityAlerts}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>미해결</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">SLA</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{mockStats.slaCompliance}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>응답 {mockStats.avgResponseTime}ms</div>
          </div>
        </div>

        {/* Approval Pending Banner */}
        {mockStats.approvalsPending > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
            <span>⏳</span>
            <span>대기 중인 승인 요청 {mockStats.approvalsPending}건</span>
            <Link href="/admin/approvals" className="btn btn-warning btn-sm" style={{ marginLeft: 'auto' }}>처리하기</Link>
          </div>
        )}

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
                <thead><tr><th>사용자</th><th>서버</th><th>시간</th><th>상태</th></tr></thead>
                <tbody>
                  {mockRecentSessions.map(session => (
                    <tr key={session.id}>
                      <td style={{ fontWeight: 500 }}>{session.user.split('@')[0]}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{session.server}</td>
                      <td>{formatDuration(session.startedAt)}</td>
                      <td><span className={`badge badge-${session.status === 'ACTIVE' ? 'success' : 'info'}`}>{session.status}</span></td>
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
                <div key={alert.id} className={`alert alert-${alert.severity === 'CRITICAL' ? 'danger' : 'warning'}`}>
                  <span style={{ fontSize: '1.2rem' }}>{alert.severity === 'CRITICAL' ? '⛔' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{alert.message}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{alert.type} • {new Date(alert.time).toLocaleTimeString()}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm">처리</button>
                </div>
              ))}
              {mockAlerts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>현재 알림이 없습니다</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header"><h2 className="card-title">빠른 작업</h2></div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/admin/users" className="btn btn-secondary">👥 사용자 추가</Link>
            <Link href="/admin/servers" className="btn btn-secondary">🖥️ 서버 등록</Link>
            <Link href="/admin/policies" className="btn btn-secondary">📋 정책 생성</Link>
            <Link href="/admin/commands" className="btn btn-secondary">⌨️ 명령 통제</Link>
            <Link href="/admin/audit" className="btn btn-secondary">📝 로그 검색</Link>
            <Link href="/admin/compliance" className="btn btn-secondary">✓ 컴플라이언스</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

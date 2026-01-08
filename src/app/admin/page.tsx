'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface DashboardStats {
  activeUsers: number;
  activeSessions: number;
  totalServers: number;
  blockedCommands: number;
  securityAlerts: number;
  approvalsPending: number;
  commandsToday: number;
  avgResponseTime: number;
  serverLoad: number;
  slaCompliance: number;
}

interface RecentSession {
  id: string;
  user: string;
  userName: string;
  server: string;
  startedAt: string;
  status: string;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  title: string;
  time: string;
}

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.stats);
      setRecentSessions(data.recentSessions);
      setAlerts(data.recentAlerts);
      setError('');
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh dashboard data every 30 seconds
    const dataTimer = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(dataTimer);
  }, [fetchDashboardData]);

  const formatDuration = (startedAt: string) => {
    const diff = Date.now() - new Date(startedAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, action: 'resolve' }),
      });

      if (response.ok) {
        // Refresh data
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // Default stats while loading
  const displayStats = stats || {
    activeUsers: 0,
    activeSessions: 0,
    totalServers: 0,
    blockedCommands: 0,
    securityAlerts: 0,
    approvalsPending: 0,
    commandsToday: 0,
    avgResponseTime: 0,
    serverLoad: 0,
    slaCompliance: 0,
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

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
            {error}
            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <span className="spinner" style={{ width: '40px', height: '40px' }} />
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-label">동시 세션</div>
                <div className="stat-value" style={{ color: 'var(--color-success)' }}>{displayStats.activeSessions}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>실시간</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">명령 실행</div>
                <div className="stat-value">{displayStats.commandsToday.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>오늘</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">차단 건수</div>
                <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{displayStats.blockedCommands}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>오늘</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">서버 부하</div>
                <div className="stat-value">{displayStats.serverLoad}%</div>
                <div style={{ height: '4px', background: 'var(--color-surface)', borderRadius: '2px', marginTop: '8px' }}>
                  <div style={{ width: `${displayStats.serverLoad}%`, height: '100%', background: displayStats.serverLoad > 80 ? 'var(--color-danger)' : 'var(--color-success)', borderRadius: '2px' }} />
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">AI 경고</div>
                <div className="stat-value" style={{ color: displayStats.securityAlerts > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{displayStats.securityAlerts}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>미해결</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">SLA</div>
                <div className="stat-value" style={{ color: 'var(--color-success)' }}>{displayStats.slaCompliance}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>응답 {displayStats.avgResponseTime}ms</div>
              </div>
            </div>

            {/* Approval Pending Banner */}
            {displayStats.approvalsPending > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
                <span>⏳</span>
                <span>대기 중인 승인 요청 {displayStats.approvalsPending}건</span>
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
                      {recentSessions.length > 0 ? (
                        recentSessions.map(session => (
                          <tr key={session.id}>
                            <td style={{ fontWeight: 500 }}>{session.userName || session.user.split('@')[0]}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{session.server}</td>
                            <td>{formatDuration(session.startedAt)}</td>
                            <td><span className={`badge badge-${session.status === 'ACTIVE' ? 'success' : 'info'}`}>{session.status}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
                            활성 세션이 없습니다
                          </td>
                        </tr>
                      )}
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
                  {alerts.length > 0 ? (
                    alerts.map(alert => (
                      <div key={alert.id} className={`alert alert-${alert.severity === 'CRITICAL' ? 'danger' : 'warning'}`}>
                        <span style={{ fontSize: '1.2rem' }}>{alert.severity === 'CRITICAL' ? '⛔' : '⚠️'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{alert.title || alert.message}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{alert.type} • {new Date(alert.time).toLocaleTimeString()}</div>
                        </div>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          처리
                        </button>
                      </div>
                    ))
                  ) : (
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
          </>
        )}
      </main>
    </div>
  );
}

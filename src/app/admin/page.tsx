'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminApi } from '@/hooks/useAdminApi';
import { StatsGridSkeleton, TableSkeleton, CardListSkeleton } from '@/components/admin/Skeleton';

interface DashboardData {
  stats: {
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
  };
  recentSessions: {
    id: string;
    user: string;
    userName: string;
    server: string;
    startedAt: string;
    status: string;
  }[];
  recentAlerts: {
    id: string;
    type: string;
    severity: string;
    message: string;
    title: string;
    time: string;
  }[];
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Use the new hook with auto-refresh every 30 seconds
  const { data, loading, error, refetch } = useAdminApi<DashboardData>(
    '/api/admin/dashboard',
    { autoRefresh: 30000 }
  );

  // Client-only: set mounted and start time updates
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    setLastRefresh(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track last refresh time
  useEffect(() => {
    if (data) setLastRefresh(new Date());
  }, [data]);

  const stats = data?.stats;
  const recentSessions = data?.recentSessions || [];
  const alerts = data?.recentAlerts || [];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'badge-danger';
      case 'HIGH': return 'badge-danger';
      case 'MEDIUM': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'badge-success';
      case 'DISCONNECTED': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  const getTimeSinceRefresh = () => {
    if (!currentTime || !lastRefresh) return '...';
    const seconds = Math.floor((currentTime.getTime() - lastRefresh.getTime()) / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    return `${Math.floor(seconds / 60)}분 전`;
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-main">
        {/* Header with live indicator */}
        <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="content-title">관리자 대시보드</h1>
            <p className="content-description">시스템 현황 및 보안 모니터링</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: loading ? 'var(--color-warning)' : 'var(--color-success)',
                animation: loading ? 'none' : 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {loading ? '업데이트 중...' : `마지막 갱신: ${getTimeSinceRefresh()}`}
              </span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              {mounted && currentTime ? currentTime.toLocaleTimeString('ko-KR') : '--:--:--'}
            </span>
            <button className="btn btn-ghost" onClick={refetch} disabled={loading}>
              🔄 새로고침
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
            {error}
            <button onClick={refetch} style={{ marginLeft: '12px' }} className="btn btn-sm btn-ghost">재시도</button>
          </div>
        )}

        {/* Stats Grid with Skeleton */}
        {loading && !stats ? (
          <StatsGridSkeleton count={5} />
        ) : stats && (
          <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-label">활성 세션</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.activeSessions}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {stats.activeUsers}명 접속 중
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">전체 서버</div>
              <div className="stat-value">{stats.totalServers}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                부하 {stats.serverLoad}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">오늘 명령</div>
              <div className="stat-value">{stats.commandsToday}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '4px' }}>
                {stats.blockedCommands}건 차단
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">보안 알림</div>
              <div className="stat-value" style={{ color: stats.securityAlerts > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {stats.securityAlerts}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">대기 승인</div>
              <div className="stat-value" style={{ color: stats.approvalsPending > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {stats.approvalsPending}
              </div>
            </div>
          </div>
        )}

        {/* SLA Compliance */}
        {stats && (
          <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontWeight: 600 }}>SLA 준수율</h3>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: stats.slaCompliance >= 99 ? 'var(--color-success)' : stats.slaCompliance >= 95 ? 'var(--color-warning)' : 'var(--color-danger)'
              }}>
                {stats.slaCompliance}%
              </span>
            </div>
            <div style={{ height: '8px', background: 'var(--color-surface)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${stats.slaCompliance}%`, 
                background: stats.slaCompliance >= 99 ? 'var(--color-success)' : stats.slaCompliance >= 95 ? 'var(--color-warning)' : 'var(--color-danger)',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <span>평균 응답 시간: {stats.avgResponseTime}ms</span>
              <span>목표: 99.5%</span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {/* Recent Sessions */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 600 }}>최근 세션</h3>
              <Link href="/admin/sessions" className="btn btn-ghost btn-sm">전체 보기 →</Link>
            </div>
            {loading && !recentSessions.length ? (
              <div style={{ padding: '20px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface)', animation: 'skeleton-loading 1.5s infinite' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '60%', height: '14px', background: 'var(--color-surface)', borderRadius: '4px', marginBottom: '8px', animation: 'skeleton-loading 1.5s infinite' }} />
                      <div style={{ width: '40%', height: '12px', background: 'var(--color-surface)', borderRadius: '4px', animation: 'skeleton-loading 1.5s infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>최근 세션 없음</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentSessions.slice(0, 5).map(session => (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                      {session.userName.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{session.userName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{session.server}</div>
                    </div>
                    <span className={`badge ${getStatusBadge(session.status)}`}>{session.status === 'ACTIVE' ? '연결됨' : session.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Alerts */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 600 }}>보안 알림</h3>
              <Link href="/admin/alerts" className="btn btn-ghost btn-sm">전체 보기 →</Link>
            </div>
            {loading && !alerts.length ? (
              <div style={{ padding: '20px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                    <div style={{ width: '80%', height: '14px', background: 'var(--color-bg)', borderRadius: '4px', marginBottom: '8px', animation: 'skeleton-loading 1.5s infinite' }} />
                    <div style={{ width: '50%', height: '12px', background: 'var(--color-bg)', borderRadius: '4px', animation: 'skeleton-loading 1.5s infinite' }} />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-success)' }}>
                <span style={{ fontSize: '2rem' }}>✓</span>
                <div style={{ marginTop: '8px' }}>보안 이슈 없음</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'var(--color-danger)' : alert.severity === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-info)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{alert.title}</span>
                      <span className={`badge ${getSeverityBadge(alert.severity)}`} style={{ fontSize: '0.7rem' }}>{alert.severity}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{alert.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>빠른 작업</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/admin/approvals" className="btn btn-primary">📋 승인 대기 처리</Link>
            <Link href="/admin/alerts" className="btn btn-secondary">🔔 알림 확인</Link>
            <Link href="/admin/sessions" className="btn btn-secondary">👁️ 세션 모니터링</Link>
            <Link href="/admin/audit" className="btn btn-secondary">📜 감사 로그</Link>
            <Link href="/admin/emergency" className="btn btn-danger">🚨 긴급 접근</Link>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

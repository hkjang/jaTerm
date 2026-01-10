'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DailyStats {
  date: string;
  sessions: number;
  uniqueUsers: number;
  totalDuration: number; // minutes
  blockedCommands: number;
}

interface UserStats {
  id: string;
  name: string;
  email: string;
  role: string;
  sessionCount: number;
  totalDuration: number;
  lastAccess: string;
}

interface ServerStats {
  id: string;
  name: string;
  environment: string;
  sessionCount: number;
  uniqueUsers: number;
  avgDuration: number;
}

export default function AccessStatisticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'servers'>('overview');

  useEffect(() => {
    // Generate mock data
    setLoading(true);
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const mockDaily: DailyStats[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      mockDaily.push({
        date: date.toISOString().split('T')[0],
        sessions: Math.floor(Math.random() * 50) + 10,
        uniqueUsers: Math.floor(Math.random() * 15) + 5,
        totalDuration: Math.floor(Math.random() * 500) + 100,
        blockedCommands: Math.floor(Math.random() * 10),
      });
    }
    setDailyStats(mockDaily);

    const mockUsers: UserStats[] = [
      { id: '1', name: '김개발', email: 'dev1@example.com', role: 'DEVELOPER', sessionCount: 45, totalDuration: 1250, lastAccess: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: '2', name: '박운영', email: 'ops@example.com', role: 'OPERATOR', sessionCount: 38, totalDuration: 980, lastAccess: new Date(Date.now() - 1 * 3600000).toISOString() },
      { id: '3', name: '이관리', email: 'admin@example.com', role: 'ADMIN', sessionCount: 25, totalDuration: 620, lastAccess: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: '4', name: '최개발', email: 'dev2@example.com', role: 'DEVELOPER', sessionCount: 22, totalDuration: 540, lastAccess: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: '5', name: '정뷰어', email: 'viewer@example.com', role: 'VIEWER', sessionCount: 8, totalDuration: 120, lastAccess: new Date(Date.now() - 24 * 3600000).toISOString() },
    ];
    setUserStats(mockUsers);

    const mockServers: ServerStats[] = [
      { id: '1', name: 'prod-web-01', environment: 'PROD', sessionCount: 85, uniqueUsers: 12, avgDuration: 45 },
      { id: '2', name: 'prod-db-01', environment: 'PROD', sessionCount: 42, uniqueUsers: 5, avgDuration: 30 },
      { id: '3', name: 'stage-web-01', environment: 'STAGE', sessionCount: 65, uniqueUsers: 8, avgDuration: 60 },
      { id: '4', name: 'dev-server-01', environment: 'DEV', sessionCount: 120, uniqueUsers: 15, avgDuration: 90 },
    ];
    setServerStats(mockServers);

    setLoading(false);
  }, [period]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#ef4444';
      case 'OPERATOR': return '#f59e0b';
      case 'DEVELOPER': return '#3b82f6';
      case 'VIEWER': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  const totalSessions = dailyStats.reduce((sum, d) => sum + d.sessions, 0);
  const totalDuration = dailyStats.reduce((sum, d) => sum + d.totalDuration, 0);
  const totalBlocked = dailyStats.reduce((sum, d) => sum + d.blockedCommands, 0);
  const avgDaily = dailyStats.length > 0 ? Math.round(totalSessions / dailyStats.length) : 0;

  return (
    <AdminLayout 
      title="접근 통계" 
      description="서버 접근 현황 및 사용자 활동 분석"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['7d', '30d', '90d'] as const).map(p => (
            <button 
              key={p} 
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7일' : p === '30d' ? '30일' : '90일'}
            </button>
          ))}
        </div>
      }
    >
      {/* Summary Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 세션</div>
          <div className="stat-value">{totalSessions.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>일 평균 {avgDaily}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 접속 시간</div>
          <div className="stat-value">{formatDuration(totalDuration)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 사용자</div>
          <div className="stat-value">{userStats.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">차단된 명령어</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{totalBlocked}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
        {[
          { id: 'overview', label: '📊 개요' },
          { id: 'users', label: '👥 사용자별' },
          { id: 'servers', label: '🖥️ 서버별' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${selectedTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
            style={{ padding: '8px 16px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: '20px' }}>
          {selectedTab === 'overview' && (
            <>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>일별 세션 추이</h3>
              {/* Simple bar chart visualization */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px', marginBottom: '24px', padding: '0 20px' }}>
                {dailyStats.slice(-14).map((day, idx) => {
                  const maxSessions = Math.max(...dailyStats.slice(-14).map(d => d.sessions));
                  const height = (day.sessions / maxSessions) * 160;
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{day.sessions}</div>
                      <div style={{ 
                        width: '100%', 
                        height: `${height}px`, 
                        background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: '10px',
                      }} />
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                        {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>시간대별 접근 패턴</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px', marginBottom: '8px' }}>
                {Array.from({ length: 24 }, (_, i) => {
                  const value = Math.floor(Math.random() * 50) + (i >= 9 && i <= 18 ? 30 : 5);
                  const height = (value / 80) * 60;
                  return (
                    <div key={i} style={{ 
                      flex: 1, 
                      height: `${height}px`, 
                      background: i >= 9 && i <= 18 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      borderRadius: '2px 2px 0 0',
                      opacity: 0.8,
                    }} title={`${i}시: ${value}건`} />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>0시</span>
                <span>6시</span>
                <span>12시</span>
                <span>18시</span>
                <span>24시</span>
              </div>
            </>
          )}

          {selectedTab === 'users' && (
            <>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>사용자별 접근 통계</h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>사용자</th>
                      <th>역할</th>
                      <th>세션 수</th>
                      <th>총 접속 시간</th>
                      <th>마지막 접근</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                        </td>
                        <td>
                          <span style={{ padding: '2px 8px', background: getRoleColor(user.role) + '20', color: getRoleColor(user.role), borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.sessionCount}</td>
                        <td>{formatDuration(user.totalDuration)}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          {new Date(user.lastAccess).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedTab === 'servers' && (
            <>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>서버별 접근 통계</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {serverStats.map(server => (
                  <div key={server.id} style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', borderLeft: `3px solid ${getEnvColor(server.environment)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{server.name}</div>
                      <span style={{ padding: '2px 8px', background: getEnvColor(server.environment) + '20', color: getEnvColor(server.environment), borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {server.environment}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>세션</div>
                        <div style={{ fontWeight: 600 }}>{server.sessionCount}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>사용자</div>
                        <div style={{ fontWeight: 600 }}>{server.uniqueUsers}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>평균</div>
                        <div style={{ fontWeight: 600 }}>{server.avgDuration}분</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

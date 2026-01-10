'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface UsageData {
  date: string;
  activeUsers: number;
  sessions: number;
  commands: number;
  dataTransfer: number;
}

interface TopItem {
  rank: number;
  name: string;
  value: number;
  change: number;
}

export default function UsageAnalyticsPage() {
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [topUsers, setTopUsers] = useState<TopItem[]>([]);
  const [topServers, setTopServers] = useState<TopItem[]>([]);
  const [topCommands, setTopCommands] = useState<TopItem[]>([]);

  useEffect(() => {
    setUsageData([
      { date: '01/04', activeUsers: 125, sessions: 450, commands: 12500, dataTransfer: 85 },
      { date: '01/05', activeUsers: 132, sessions: 520, commands: 14200, dataTransfer: 92 },
      { date: '01/06', activeUsers: 140, sessions: 580, commands: 15800, dataTransfer: 105 },
      { date: '01/07', activeUsers: 118, sessions: 420, commands: 11200, dataTransfer: 75 },
      { date: '01/08', activeUsers: 145, sessions: 610, commands: 16500, dataTransfer: 115 },
      { date: '01/09', activeUsers: 155, sessions: 680, commands: 18200, dataTransfer: 125 },
      { date: '01/10', activeUsers: 162, sessions: 720, commands: 19500, dataTransfer: 135 },
    ]);
    setTopUsers([
      { rank: 1, name: '김개발', value: 2450, change: 15 },
      { rank: 2, name: '박운영', value: 2180, change: 8 },
      { rank: 3, name: '이서버', value: 1920, change: -5 },
      { rank: 4, name: '최데브옵스', value: 1650, change: 22 },
      { rank: 5, name: '정보안', value: 1420, change: 3 },
    ]);
    setTopServers([
      { rank: 1, name: 'prod-api-01', value: 4520, change: 12 },
      { rank: 2, name: 'prod-db-master', value: 3890, change: 5 },
      { rank: 3, name: 'staging-web', value: 2650, change: 28 },
      { rank: 4, name: 'prod-cache-01', value: 2180, change: -8 },
      { rank: 5, name: 'dev-shared', value: 1950, change: 15 },
    ]);
    setTopCommands([
      { rank: 1, name: 'ls -la', value: 8520, change: 5 },
      { rank: 2, name: 'docker ps', value: 6240, change: 18 },
      { rank: 3, name: 'kubectl get pods', value: 5180, change: 25 },
      { rank: 4, name: 'git status', value: 4950, change: 8 },
      { rank: 5, name: 'cat /var/log/*', value: 3820, change: -3 },
    ]);
    setLoading(false);
  }, [period]);

  const totalUsers = usageData.reduce((a, d) => a + d.activeUsers, 0);
  const totalSessions = usageData.reduce((a, d) => a + d.sessions, 0);
  const totalCommands = usageData.reduce((a, d) => a + d.commands, 0);
  const totalTransfer = usageData.reduce((a, d) => a + d.dataTransfer, 0);
  const maxSessions = Math.max(...usageData.map(d => d.sessions));

  return (
    <AdminLayout title="사용량 분석" description="시스템 사용량 통계 및 분석">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['24h', '7d', '30d', '90d'].map(p => <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(p)}>{p}</button>)}
      </div>
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">👥 활성 사용자</div><div className="stat-value">{(totalUsers / usageData.length).toFixed(0)}</div><div style={{ fontSize: '0.8rem', color: '#10b981' }}>+12% vs 이전</div></div>
        <div className="stat-card"><div className="stat-label">💻 총 세션</div><div className="stat-value">{totalSessions.toLocaleString()}</div><div style={{ fontSize: '0.8rem', color: '#10b981' }}>+8% vs 이전</div></div>
        <div className="stat-card"><div className="stat-label">⌨️ 명령 실행</div><div className="stat-value">{(totalCommands / 1000).toFixed(1)}K</div><div style={{ fontSize: '0.8rem', color: '#10b981' }}>+15% vs 이전</div></div>
        <div className="stat-card"><div className="stat-label">📊 데이터 전송</div><div className="stat-value">{totalTransfer} GB</div><div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>+5% vs 이전</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>📈 세션 추이</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150 }}>
              {usageData.map(d => (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0', height: `${(d.sessions / maxSessions) * 120}px`, minHeight: 20 }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 8 }}>{d.date}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.sessions}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16 }}>🏆 상위 사용자</div>
              {topUsers.map(u => (
                <div key={u.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: u.rank <= 3 ? '#f59e0b' : 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>{u.rank}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{u.name}</span>
                  <span style={{ fontWeight: 600 }}>{u.value.toLocaleString()}</span>
                  <span style={{ fontSize: '0.8rem', color: u.change >= 0 ? '#10b981' : '#ef4444' }}>{u.change >= 0 ? '↑' : '↓'}{Math.abs(u.change)}%</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16 }}>🖥️ 상위 서버</div>
              {topServers.map(s => (
                <div key={s.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: s.rank <= 3 ? '#3b82f6' : 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>{s.rank}</span>
                  <span style={{ flex: 1, fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{s.name}</span>
                  <span style={{ fontWeight: 600 }}>{s.value.toLocaleString()}</span>
                  <span style={{ fontSize: '0.8rem', color: s.change >= 0 ? '#10b981' : '#ef4444' }}>{s.change >= 0 ? '↑' : '↓'}{Math.abs(s.change)}%</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16 }}>⌨️ 상위 명령어</div>
              {topCommands.map(c => (
                <div key={c.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: c.rank <= 3 ? '#10b981' : 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>{c.rank}</span>
                  <code style={{ flex: 1, fontSize: '0.85rem', padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4 }}>{c.name}</code>
                  <span style={{ fontWeight: 600 }}>{c.value.toLocaleString()}</span>
                  <span style={{ fontSize: '0.8rem', color: c.change >= 0 ? '#10b981' : '#ef4444' }}>{c.change >= 0 ? '↑' : '↓'}{Math.abs(c.change)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

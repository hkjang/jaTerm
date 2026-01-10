'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: { name: string; email: string; type: 'USER' | 'SYSTEM' | 'API' };
  action: string;
  resource: { type: string; name: string; id: string };
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  details: string;
  ipAddress: string;
  location: string;
}

export default function ActivityStreamPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchEvents = () => {
      setEvents([
        { id: '1', timestamp: '2026-01-10 14:47:05', actor: { name: '김관리자', email: 'admin@jaterm.io', type: 'USER' }, action: 'user.login', resource: { type: 'AUTH', name: 'Login Session', id: 'session-123' }, result: 'SUCCESS', details: 'MFA 인증 완료', ipAddress: '203.0.113.50', location: 'Seoul, KR' },
        { id: '2', timestamp: '2026-01-10 14:46:58', actor: { name: 'API Gateway', email: '', type: 'SYSTEM' }, action: 'rate_limit.triggered', resource: { type: 'API', name: '/api/users', id: 'endpoint-456' }, result: 'PARTIAL', details: '요청 제한 적용: 100/min 초과', ipAddress: '10.0.1.50', location: 'Internal' },
        { id: '3', timestamp: '2026-01-10 14:46:45', actor: { name: '박개발', email: 'dev@jaterm.io', type: 'USER' }, action: 'server.connect', resource: { type: 'SERVER', name: 'web-server-01', id: 'server-789' }, result: 'SUCCESS', details: 'SSH 세션 시작', ipAddress: '203.0.113.25', location: 'Seoul, KR' },
        { id: '4', timestamp: '2026-01-10 14:46:30', actor: { name: 'ci-bot', email: 'ci@jaterm.io', type: 'API' }, action: 'deployment.create', resource: { type: 'DEPLOYMENT', name: 'api-server:v2.5.0', id: 'deploy-abc' }, result: 'SUCCESS', details: 'Staging 배포 완료', ipAddress: '10.0.2.100', location: 'Internal' },
        { id: '5', timestamp: '2026-01-10 14:46:15', actor: { name: '이보안', email: 'security@jaterm.io', type: 'USER' }, action: 'user.permission.update', resource: { type: 'USER', name: '신입사원', id: 'user-xyz' }, result: 'SUCCESS', details: '권한 변경: readonly → developer', ipAddress: '203.0.113.75', location: 'Seoul, KR' },
        { id: '6', timestamp: '2026-01-10 14:46:00', actor: { name: 'unknown', email: '', type: 'USER' }, action: 'user.login', resource: { type: 'AUTH', name: 'Login Attempt', id: 'session-fail' }, result: 'FAILURE', details: '비밀번호 5회 실패 - 계정 잠금', ipAddress: '185.220.101.45', location: 'Unknown' },
        { id: '7', timestamp: '2026-01-10 14:45:45', actor: { name: 'Scheduler', email: '', type: 'SYSTEM' }, action: 'backup.complete', resource: { type: 'BACKUP', name: 'daily-backup', id: 'backup-daily' }, result: 'SUCCESS', details: '데이터베이스 백업 완료: 45GB', ipAddress: '10.0.1.10', location: 'Internal' },
        { id: '8', timestamp: '2026-01-10 14:45:30', actor: { name: '최운영', email: 'ops@jaterm.io', type: 'USER' }, action: 'config.update', resource: { type: 'CONFIG', name: 'system-settings', id: 'config-main' }, result: 'SUCCESS', details: '세션 타임아웃 변경: 30min → 60min', ipAddress: '203.0.113.100', location: 'Seoul, KR' },
      ]);
      setLoading(false);
    };
    fetchEvents();
    if (autoRefresh) { const t = setInterval(fetchEvents, 10000); return () => clearInterval(t); }
  }, [autoRefresh]);

  const getResultColor = (r: string) => ({ SUCCESS: '#10b981', FAILURE: '#ef4444', PARTIAL: '#f59e0b' }[r] || '#6b7280');
  const getActorIcon = (t: string) => ({ USER: '👤', SYSTEM: '🤖', API: '🔌' }[t] || '❓');
  const getResourceIcon = (t: string) => ({ AUTH: '🔐', API: '🌐', SERVER: '🖥️', DEPLOYMENT: '🚀', USER: '👥', BACKUP: '💾', CONFIG: '⚙️' }[t] || '📦');

  const filtered = events.filter(e => (filterType === 'all' || e.actor.type === filterType) && (filterResult === 'all' || e.result === filterResult) && (search === '' || e.action.includes(search) || e.resource.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <AdminLayout title="활동 스트림" description="실시간 시스템 활동 모니터링">
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">오늘 이벤트</div><div className="stat-value">{events.length * 125}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 성공</div><div className="stat-value" style={{ color: '#10b981' }}>{events.filter(e => e.result === 'SUCCESS').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{events.filter(e => e.result === 'FAILURE').length}</div></div>
        <div className="stat-card"><div className="stat-label">👥 활성 사용자</div><div className="stat-value">{new Set(events.filter(e => e.actor.type === 'USER').map(e => e.actor.email)).size}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 120 }}><option value="all">전체 유형</option><option value="USER">사용자</option><option value="SYSTEM">시스템</option><option value="API">API</option></select>
        <select className="form-input" value={filterResult} onChange={e => setFilterResult(e.target.value)} style={{ maxWidth: 120 }}><option value="all">전체 결과</option><option value="SUCCESS">성공</option><option value="FAILURE">실패</option></select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', cursor: 'pointer' }}><input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />🔄 자동 새로고침</label>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          {filtered.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.5rem' }}>{getActorIcon(e.actor.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{e.actor.name}</span>{e.actor.email && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{e.actor.email}</span>}<span style={{ padding: '2px 6px', background: `${getResultColor(e.result)}20`, color: getResultColor(e.result), borderRadius: 4, fontSize: '0.75rem', marginLeft: 'auto' }}>{e.result}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><code style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{e.action}</code><span>{getResourceIcon(e.resource.type)}</span><span>{e.resource.name}</span></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{e.details}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)', minWidth: 140 }}><div>{e.timestamp}</div><div>{e.ipAddress}</div><div>{e.location}</div></div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

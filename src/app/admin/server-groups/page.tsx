'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: string;
  isActive: boolean;
}

interface ServerGroup {
  environment: string;
  servers: Server[];
}

export default function ServerGroupsPage() {
  const [groups, setGroups] = useState<ServerGroup[]>([]);
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

  const fetchServers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/servers', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch servers');
      
      const data = await response.json();
      const servers: Server[] = data.servers || [];
      
      // Group servers by environment
      const groupMap = new Map<string, Server[]>();
      servers.forEach(server => {
        const env = server.environment || 'OTHER';
        if (!groupMap.has(env)) {
          groupMap.set(env, []);
        }
        groupMap.get(env)!.push(server);
      });
      
      const groupedServers: ServerGroup[] = Array.from(groupMap.entries()).map(([environment, servers]) => ({
        environment,
        servers,
      }));
      
      // Sort: PROD, STAGE, DEV, others
      const order = ['PROD', 'STAGE', 'DEV'];
      groupedServers.sort((a, b) => {
        const aIdx = order.indexOf(a.environment);
        const bIdx = order.indexOf(b.environment);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
      
      setGroups(groupedServers);
      setError('');
    } catch (err) {
      setError('서버 목록을 불러오는데 실패했습니다.');
      console.error('Fetch servers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getEnvBadgeClass = (env: string) => {
    switch (env) {
      case 'PROD': return 'badge-danger';
      case 'STAGE': return 'badge-warning';
      case 'DEV': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const prodCount = groups.find(g => g.environment === 'PROD')?.servers.length || 0;
  const stageCount = groups.find(g => g.environment === 'STAGE')?.servers.length || 0;
  const devCount = groups.find(g => g.environment === 'DEV')?.servers.length || 0;

  return (
    <AdminLayout 
      title="서버 그룹" 
      description="환경별 서버 그룹 관리"
      actions={
        <button className="btn btn-ghost" onClick={() => fetchServers()}>🔄 새로고침</button>
      }
    >
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">PROD</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{prodCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">STAGE</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stageCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">DEV</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{devCount}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          서버가 없습니다. 먼저 서버를 추가해주세요.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {groups.map(group => (
            <div 
              key={group.environment} 
              className="card" 
              style={{ padding: '20px', borderTop: `3px solid ${getEnvColor(group.environment)}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontWeight: 600 }}>{group.environment} 환경</h3>
                  <span className={`badge ${getEnvBadgeClass(group.environment)}`}>
                    {group.environment}
                  </span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getEnvColor(group.environment) }}>
                  {group.servers.length}
                </div>
              </div>
              <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                {group.servers.map(server => (
                  <div 
                    key={server.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.85rem', 
                      padding: '6px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{server.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {server.hostname}
                      </span>
                      <span 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: server.isActive ? 'var(--color-success)' : 'var(--color-danger)' 
                        }} 
                      />
                    </div>
                  </div>
                ))}
                {group.servers.length === 0 && (
                  <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px' }}>
                    서버 없음
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

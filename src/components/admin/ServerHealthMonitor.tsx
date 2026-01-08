// Server Health Monitor Component
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ServerHealth {
  id: string;
  name: string;
  hostname: string;
  environment: string;
  status: 'online' | 'offline' | 'warning';
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
}

interface ServerHealthMonitorProps {
  compact?: boolean;
}

export function ServerHealthMonitor({ compact = false }: ServerHealthMonitorProps) {
  const [servers, setServers] = useState<ServerHealth[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const response = await fetch('/api/admin/server-health', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error('Fetch server health error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 15000);
    return () => clearInterval(interval);
  }, [fetchServers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'var(--color-success)';
      case 'warning': return 'var(--color-warning)';
      case 'offline': return 'var(--color-danger)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'var(--color-danger)';
    if (usage >= 70) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <span className="spinner" style={{ width: '24px', height: '24px' }} />
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {servers.map(server => (
          <div
            key={server.id}
            title={`${server.name} (${server.hostname})\nCPU: ${server.cpuUsage}%\nMemory: ${server.memoryUsage}%\n응답시간: ${server.responseTime}ms`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getStatusColor(server.status),
              animation: server.status === 'online' ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.8rem' }}>{server.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
      {servers.map(server => (
        <div
          key={server.id}
          style={{
            padding: '16px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            borderLeft: `3px solid ${getStatusColor(server.status)}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{server.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{server.hostname}</div>
            </div>
            <span className={`badge badge-${server.environment === 'PROD' ? 'danger' : server.environment === 'STAGE' ? 'warning' : 'success'}`} style={{ fontSize: '0.65rem' }}>
              {server.environment}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                <span>CPU</span>
                <span style={{ color: getUsageColor(server.cpuUsage) }}>{server.cpuUsage}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--color-bg)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${server.cpuUsage}%`, background: getUsageColor(server.cpuUsage), transition: 'width 0.3s' }} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                <span>Memory</span>
                <span style={{ color: getUsageColor(server.memoryUsage) }}>{server.memoryUsage}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--color-bg)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${server.memoryUsage}%`, background: getUsageColor(server.memoryUsage), transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <span>{server.responseTime}ms</span>
            <span>{server.activeSessions} 세션</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Activity Feed Component - Real-time activity stream
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Activity {
  id: string;
  type: 'session' | 'command' | 'alert' | 'user' | 'server';
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  details?: string;
}

const typeIcons: Record<string, string> = {
  session: '💻',
  command: '⌨️',
  alert: '🔔',
  user: '👤',
  server: '🖥️',
};

const typeColors: Record<string, string> = {
  session: 'var(--color-success)',
  command: 'var(--color-primary)',
  alert: 'var(--color-danger)',
  user: 'var(--color-info)',
  server: 'var(--color-warning)',
};

interface ActivityFeedProps {
  maxItems?: number;
  autoRefresh?: number;
}

export function ActivityFeed({ maxItems = 10, autoRefresh = 15000 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
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

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/activities?limit=${maxItems}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Fetch activities error:', error);
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, autoRefresh);
    return () => clearInterval(interval);
  }, [fetchActivities, autoRefresh]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <span className="spinner" style={{ width: '24px', height: '24px' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {activities.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          최근 활동이 없습니다
        </div>
      ) : (
        activities.map((activity, index) => (
          <div
            key={activity.id}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: index === 0 ? 'var(--color-surface)' : 'transparent',
              borderRadius: 'var(--radius-md)',
              borderLeft: index === 0 ? `3px solid ${typeColors[activity.type]}` : 'none',
              animation: index === 0 ? 'fadeIn 0.3s ease-out' : 'none',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{typeIcons[activity.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem' }}>
                <strong>{activity.actor}</strong>
                <span style={{ color: 'var(--color-text-muted)' }}> {activity.action} </span>
                <strong>{activity.target}</strong>
              </div>
              {activity.details && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activity.details}
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {formatTime(activity.timestamp)}
            </span>
          </div>
        ))
      )}
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

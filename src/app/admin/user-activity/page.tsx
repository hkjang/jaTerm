'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface UserActivity {
  id: string;
  userId: string;
  username: string;
  email: string;
  action: string;
  category: 'SESSION' | 'SERVER' | 'COMMAND' | 'FILE' | 'AUTH' | 'ADMIN' | 'API';
  target?: string;
  details?: string;
  timestamp: string;
  ipAddress: string;
  location?: { country: string; city: string };
  device?: { browser: string; os: string };
  duration?: number; // seconds
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
}

export default function UserActivityPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  useEffect(() => {
    const mockActivities: UserActivity[] = [
      { id: '1', userId: 'u1', username: '김관리', email: 'admin@example.com', action: 'SSH 세션 시작', category: 'SESSION', target: 'prod-web-01', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), ipAddress: '10.0.1.100', location: { country: '한국', city: '서울' }, device: { browser: 'Chrome 120', os: 'Windows 11' }, duration: 1800, status: 'SUCCESS' },
      { id: '2', userId: 'u2', username: '박운영', email: 'ops@example.com', action: '명령어 실행', category: 'COMMAND', target: 'sudo systemctl restart nginx', details: 'Exit code: 0', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), ipAddress: '10.0.1.101', location: { country: '한국', city: '부산' }, status: 'SUCCESS' },
      { id: '3', userId: 'u1', username: '김관리', email: 'admin@example.com', action: '파일 다운로드', category: 'FILE', target: '/var/log/nginx/access.log', details: '2.5MB', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), ipAddress: '10.0.1.100', status: 'SUCCESS' },
      { id: '4', userId: 'u3', username: '이보안', email: 'sec@example.com', action: '로그인 시도', category: 'AUTH', details: '잘못된 비밀번호', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), ipAddress: '192.168.1.50', location: { country: '한국', city: '대전' }, status: 'FAILURE' },
      { id: '5', userId: 'u2', username: '박운영', email: 'ops@example.com', action: '서버 추가', category: 'SERVER', target: 'new-api-server', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), ipAddress: '10.0.1.101', status: 'SUCCESS' },
      { id: '6', userId: 'u1', username: '김관리', email: 'admin@example.com', action: '사용자 권한 변경', category: 'ADMIN', target: '정개발', details: 'user → admin', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), ipAddress: '10.0.1.100', status: 'SUCCESS' },
      { id: '7', userId: 'api1', username: 'External API', email: 'api@ext.com', action: 'API 호출', category: 'API', target: '/api/servers', details: 'GET, 200 OK', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), ipAddress: '203.0.113.50', status: 'SUCCESS' },
      { id: '8', userId: 'u3', username: '이보안', email: 'sec@example.com', action: '로그인', category: 'AUTH', timestamp: new Date(Date.now() - 90 * 60000).toISOString(), ipAddress: '10.0.1.102', location: { country: '한국', city: '대전' }, device: { browser: 'Firefox 121', os: 'macOS' }, status: 'SUCCESS' },
      { id: '9', userId: 'u2', username: '박운영', email: 'ops@example.com', action: 'SSH 세션 종료', category: 'SESSION', target: 'prod-db-01', duration: 3600, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), ipAddress: '10.0.1.101', status: 'SUCCESS' },
      { id: '10', userId: 'u1', username: '김관리', email: 'admin@example.com', action: '설정 변경', category: 'ADMIN', target: 'MFA 필수화', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), ipAddress: '10.0.1.100', status: 'SUCCESS' },
    ];
    setActivities(mockActivities);
    setLoading(false);
  }, []);

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'SESSION': return { color: '#3b82f6', label: '세션', icon: '💻' };
      case 'SERVER': return { color: '#10b981', label: '서버', icon: '🖥️' };
      case 'COMMAND': return { color: '#8b5cf6', label: '명령어', icon: '⌨️' };
      case 'FILE': return { color: '#f59e0b', label: '파일', icon: '📁' };
      case 'AUTH': return { color: '#ef4444', label: '인증', icon: '🔐' };
      case 'ADMIN': return { color: '#ec4899', label: '관리', icon: '⚙️' };
      case 'API': return { color: '#06b6d4', label: 'API', icon: '🔌' };
      default: return { color: '#6b7280', label: category, icon: '❓' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SUCCESS': return { color: '#10b981', label: '성공', icon: '✓' };
      case 'FAILURE': return { color: '#ef4444', label: '실패', icon: '✗' };
      case 'PENDING': return { color: '#f59e0b', label: '대기', icon: '⏳' };
      default: return { color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
    return `${(seconds / 3600).toFixed(1)}시간`;
  };

  const uniqueUsers = [...new Set(activities.map(a => a.username))];
  const filteredActivities = activities.filter(a => {
    if (searchQuery && !a.action.toLowerCase().includes(searchQuery.toLowerCase()) && !a.target?.toLowerCase().includes(searchQuery.toLowerCase()) && !a.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterUser !== 'all' && a.username !== filterUser) return false;
    return true;
  });

  const sessionCount = activities.filter(a => a.category === 'SESSION').length;
  const commandCount = activities.filter(a => a.category === 'COMMAND').length;
  const failureCount = activities.filter(a => a.status === 'FAILURE').length;

  return (
    <AdminLayout 
      title="사용자 활동" 
      description="실시간 사용자 활동 모니터링"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 활동</div>
          <div className="stat-value">{activities.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💻 세션</div>
          <div className="stat-value">{sessionCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⌨️ 명령어</div>
          <div className="stat-value">{commandCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✗ 실패</div>
          <div className="stat-value" style={{ color: failureCount > 0 ? '#ef4444' : 'inherit' }}>{failureCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">👥 활성 사용자</div>
          <div className="stat-value">{uniqueUsers.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 활동 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 카테고리</option>
          <option value="SESSION">💻 세션</option>
          <option value="COMMAND">⌨️ 명령어</option>
          <option value="FILE">📁 파일</option>
          <option value="AUTH">🔐 인증</option>
          <option value="SERVER">🖥️ 서버</option>
          <option value="ADMIN">⚙️ 관리</option>
          <option value="API">🔌 API</option>
        </select>
        <select className="form-input" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="all">전체 사용자</option>
          {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('list')}>📋 목록</button>
          <button className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('timeline')}>📅 타임라인</button>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary">📥 내보내기</button>
      </div>

      {/* Activities */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {filteredActivities.map(activity => {
            const categoryConfig = getCategoryConfig(activity.category);
            const statusConfig = getStatusConfig(activity.status);
            return (
              <div 
                key={activity.id} 
                style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                onClick={() => setSelectedActivity(activity)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ fontSize: '1.3rem' }}>{categoryConfig.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{activity.username}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                      <span>{activity.action}</span>
                      <span style={{ padding: '2px 6px', background: statusConfig.color + '20', color: statusConfig.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{statusConfig.icon}</span>
                    </div>
                    {activity.target && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        <code style={{ fontSize: '0.8rem' }}>{activity.target}</code>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>{getTimeAgo(activity.timestamp)}</span>
                      <span>•</span>
                      <span>{activity.ipAddress}</span>
                      {activity.location && <><span>•</span><span>📍 {activity.location.city}</span></>}
                      {activity.duration && <><span>•</span><span>⏱️ {formatDuration(activity.duration)}</span></>}
                    </div>
                  </div>
                  <span style={{ padding: '2px 8px', background: `${categoryConfig.color}20`, color: categoryConfig.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 500 }}>{categoryConfig.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedActivity && (
        <div className="modal-overlay active" onClick={() => setSelectedActivity(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getCategoryConfig(selectedActivity.category).icon} 활동 상세</h3>
              <button className="modal-close" onClick={() => setSelectedActivity(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>사용자</div>
                  <div style={{ fontWeight: 600 }}>{selectedActivity.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{selectedActivity.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>카테고리</div>
                  <span style={{ padding: '4px 10px', background: `${getCategoryConfig(selectedActivity.category).color}20`, color: getCategoryConfig(selectedActivity.category).color, borderRadius: '4px', fontSize: '0.85rem' }}>{getCategoryConfig(selectedActivity.category).label}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>액션</div>
                  <div>{selectedActivity.action}</div>
                </div>
                {selectedActivity.target && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>대상</div>
                    <code>{selectedActivity.target}</code>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>시간</div>
                  <div>{new Date(selectedActivity.timestamp).toLocaleString('ko-KR')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>IP 주소</div>
                  <code>{selectedActivity.ipAddress}</code>
                </div>
                {selectedActivity.location && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>위치</div>
                    <div>📍 {selectedActivity.location.city}, {selectedActivity.location.country}</div>
                  </div>
                )}
                {selectedActivity.device && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>디바이스</div>
                    <div>{selectedActivity.device.browser} / {selectedActivity.device.os}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedActivity(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

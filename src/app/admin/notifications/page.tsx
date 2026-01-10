'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Notification {
  id: string;
  type: 'SECURITY' | 'SYSTEM' | 'ACCESS' | 'MAINTENANCE' | 'ALERT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationPreference {
  id: string;
  category: string;
  email: boolean;
  slack: boolean;
  inApp: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const mockNotifications: Notification[] = [
      { id: '1', type: 'SECURITY', title: '🚨 심각한 보안 이벤트', message: 'prod-web-01 서버에서 위험 명령어 실행 시도가 차단되었습니다.', isRead: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString(), link: '/admin/security-alerts' },
      { id: '2', type: 'ACCESS', title: '✋ 접근 승인 요청', message: '김개발님이 prod-db-01 서버 접근을 요청했습니다.', isRead: false, createdAt: new Date(Date.now() - 15 * 60000).toISOString(), link: '/admin/access-approval' },
      { id: '3', type: 'SYSTEM', title: '⚠️ 서비스 성능 저하', message: 'API Gateway 응답 시간이 증가했습니다.', isRead: false, createdAt: new Date(Date.now() - 30 * 60000).toISOString(), link: '/admin/system-health' },
      { id: '4', type: 'MAINTENANCE', title: '🔧 유지보수 시작', message: '긴급 보안 패치가 시작되었습니다. 예상 소요 시간: 2시간', isRead: true, createdAt: new Date(Date.now() - 45 * 60000).toISOString(), link: '/admin/maintenance' },
      { id: '5', type: 'SECURITY', title: '🔓 무차별 대입 공격 감지', message: '45.33.32.156 IP에서 8회 로그인 실패가 감지되었습니다.', isRead: true, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: '6', type: 'SYSTEM', title: '💾 백업 완료', message: '일일 전체 백업이 성공적으로 완료되었습니다. (2.5GB)', isRead: true, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
      { id: '7', type: 'ACCESS', title: '👤 신규 사용자 등록', message: '박신입님이 시스템에 등록되었습니다.', isRead: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
      { id: '8', type: 'ALERT', title: '📊 주간 보고서', message: '지난 주 접근 통계 보고서가 생성되었습니다.', isRead: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    ];

    const mockPreferences: NotificationPreference[] = [
      { id: '1', category: '보안 알림', email: true, slack: true, inApp: true },
      { id: '2', category: '접근 요청', email: true, slack: true, inApp: true },
      { id: '3', category: '시스템 상태', email: false, slack: true, inApp: true },
      { id: '4', category: '백업/복원', email: true, slack: false, inApp: true },
      { id: '5', category: '유지보수', email: true, slack: true, inApp: true },
      { id: '6', category: '사용자 활동', email: false, slack: false, inApp: true },
    ];

    setNotifications(mockNotifications);
    setPreferences(mockPreferences);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleMarkRead = (notification: Notification) => {
    setNotifications(notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setMessage({ type: 'success', text: '모든 알림을 읽음 처리했습니다.' });
  };

  const handleDelete = (notification: Notification) => {
    setNotifications(notifications.filter(n => n.id !== notification.id));
  };

  const handleClearAll = () => {
    if (!confirm('모든 알림을 삭제하시겠습니까?')) return;
    setNotifications([]);
    setMessage({ type: 'success', text: '모든 알림이 삭제되었습니다.' });
  };

  const handleTogglePref = (prefId: string, channel: 'email' | 'slack' | 'inApp') => {
    setPreferences(preferences.map(p => p.id === prefId ? { ...p, [channel]: !p[channel] } : p));
    setMessage({ type: 'success', text: '알림 설정이 저장되었습니다.' });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'SECURITY': return { color: '#ef4444', bg: '#ef444420', icon: '🚨' };
      case 'SYSTEM': return { color: '#f59e0b', bg: '#f59e0b20', icon: '⚙️' };
      case 'ACCESS': return { color: '#3b82f6', bg: '#3b82f620', icon: '🔐' };
      case 'MAINTENANCE': return { color: '#8b5cf6', bg: '#8b5cf620', icon: '🔧' };
      case 'ALERT': return { color: '#10b981', bg: '#10b98120', icon: '📊' };
      default: return { color: '#6b7280', bg: '#6b728020', icon: '📌' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = selectedTab === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <AdminLayout 
      title="알림 센터" 
      description="시스템 알림 및 이벤트 관리"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
              ✅ 모두 읽음
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={handleClearAll}>
              🗑️ 모두 삭제
            </button>
          )}
        </div>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
        <button className={`btn btn-sm ${selectedTab === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedTab('all')}>
          📬 전체 ({notifications.length})
        </button>
        <button className={`btn btn-sm ${selectedTab === 'unread' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedTab('unread')}>
          🔔 읽지 않음 ({unreadCount})
        </button>
        <button className={`btn btn-sm ${selectedTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedTab('settings')}>
          ⚙️ 설정
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : selectedTab === 'settings' ? (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>📢 알림 채널 설정</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th style={{ textAlign: 'center' }}>📧 이메일</th>
                  <th style={{ textAlign: 'center' }}>💬 Slack</th>
                  <th style={{ textAlign: 'center' }}>🔔 인앱</th>
                </tr>
              </thead>
              <tbody>
                {preferences.map(pref => (
                  <tr key={pref.id}>
                    <td style={{ fontWeight: 500 }}>{pref.category}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={pref.email} onChange={() => handleTogglePref(pref.id, 'email')} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={pref.slack} onChange={() => handleTogglePref(pref.id, 'slack')} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={pref.inApp} onChange={() => handleTogglePref(pref.id, 'inApp')} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
          {selectedTab === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredNotifications.map(notification => {
            const type = getTypeConfig(notification.type);
            return (
              <div 
                key={notification.id} 
                className="card" 
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer',
                  background: notification.isRead ? 'var(--color-bg)' : 'var(--color-surface)',
                  borderLeft: notification.isRead ? '3px solid transparent' : `3px solid ${type.color}`,
                }}
                onClick={() => handleMarkRead(notification)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                      <span style={{ fontWeight: notification.isRead ? 400 : 600 }}>{notification.title}</span>
                      {!notification.isRead && (
                        <span style={{ width: '8px', height: '8px', background: type.color, borderRadius: '50%' }} />
                      )}
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '6px' }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {getTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-text-muted)' }} onClick={(e) => { e.stopPropagation(); handleDelete(notification); }}>
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

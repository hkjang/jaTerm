'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface LoginRecord {
  id: string;
  user: { id: string; name: string; email: string };
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'MFA_REQUIRED';
  ipAddress: string;
  location?: string;
  device: string;
  browser: string;
  failReason?: string;
  mfaMethod?: string;
  timestamp: string;
  sessionDuration?: number; // minutes
}

export default function LoginHistoryPage() {
  const [records, setRecords] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('24h');
  const [selectedRecord, setSelectedRecord] = useState<LoginRecord | null>(null);

  useEffect(() => {
    const mockRecords: LoginRecord[] = [
      { id: '1', user: { id: 'u1', name: '김개발', email: 'kim@company.com' }, status: 'SUCCESS', ipAddress: '192.168.1.100', location: '서울, 대한민국', device: 'Desktop', browser: 'Chrome 120', mfaMethod: 'TOTP', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), sessionDuration: 45 },
      { id: '2', user: { id: 'u2', name: '박DBA', email: 'park@company.com' }, status: 'SUCCESS', ipAddress: '192.168.1.101', location: '서울, 대한민국', device: 'Desktop', browser: 'Firefox 121', mfaMethod: 'TOTP', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), sessionDuration: 120 },
      { id: '3', user: { id: 'u3', name: '이운영', email: 'lee@company.com' }, status: 'FAILED', ipAddress: '203.0.113.50', location: '부산, 대한민국', device: 'Mobile', browser: 'Safari Mobile', failReason: '잘못된 비밀번호', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: '4', user: { id: 'u3', name: '이운영', email: 'lee@company.com' }, status: 'FAILED', ipAddress: '203.0.113.50', location: '부산, 대한민국', device: 'Mobile', browser: 'Safari Mobile', failReason: '잘못된 비밀번호', timestamp: new Date(Date.now() - 32 * 60000).toISOString() },
      { id: '5', user: { id: 'u3', name: '이운영', email: 'lee@company.com' }, status: 'SUCCESS', ipAddress: '192.168.1.102', location: '서울, 대한민국', device: 'Desktop', browser: 'Chrome 120', mfaMethod: 'SMS', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), sessionDuration: 30 },
      { id: '6', user: { id: 'u4', name: '최보안', email: 'choi@company.com' }, status: 'BLOCKED', ipAddress: '1.2.3.4', location: '알 수 없음', device: 'Unknown', browser: 'Unknown', failReason: 'IP 차단됨', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: '7', user: { id: 'u5', name: '정테스트', email: 'jung@company.com' }, status: 'MFA_REQUIRED', ipAddress: '192.168.1.103', location: '서울, 대한민국', device: 'Tablet', browser: 'Safari', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: '8', user: { id: 'u1', name: '김개발', email: 'kim@company.com' }, status: 'SUCCESS', ipAddress: '10.0.1.50', location: 'VPN - 본사', device: 'Desktop', browser: 'Chrome 120', mfaMethod: 'Hardware Key', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), sessionDuration: 180 },
      { id: '9', user: { id: 'u6', name: '외부사용자', email: 'external@partner.com' }, status: 'FAILED', ipAddress: '8.8.8.8', location: '미국', device: 'Desktop', browser: 'Edge', failReason: 'MFA 인증 실패', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
      { id: '10', user: { id: 'u2', name: '박DBA', email: 'park@company.com' }, status: 'SUCCESS', ipAddress: '192.168.1.101', location: '서울, 대한민국', device: 'Desktop', browser: 'Firefox 121', mfaMethod: 'TOTP', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), sessionDuration: 90 },
    ];
    setRecords(mockRecords);
    setLoading(false);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SUCCESS': return { color: '#10b981', bg: '#10b98120', label: '성공', icon: '✓' };
      case 'FAILED': return { color: '#ef4444', bg: '#ef444420', label: '실패', icon: '✗' };
      case 'BLOCKED': return { color: '#dc2626', bg: '#dc262620', label: '차단', icon: '⛔' };
      case 'MFA_REQUIRED': return { color: '#f59e0b', bg: '#f59e0b20', label: 'MFA 필요', icon: '🔐' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '?' };
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

  const uniqueUsers = [...new Set(records.map(r => r.user.name))];
  const filteredRecords = records.filter(r => {
    if (searchQuery && !r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.ipAddress.includes(searchQuery)) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterUser !== 'all' && r.user.name !== filterUser) return false;
    return true;
  });

  const successCount = records.filter(r => r.status === 'SUCCESS').length;
  const failedCount = records.filter(r => r.status === 'FAILED').length;
  const blockedCount = records.filter(r => r.status === 'BLOCKED').length;
  const uniqueIPs = new Set(records.map(r => r.ipAddress)).size;

  return (
    <AdminLayout 
      title="로그인 히스토리" 
      description="사용자 로그인 기록 및 분석"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 로그인</div>
          <div className="stat-value">{records.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ 성공</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{successCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">❌ 실패</div>
          <div className="stat-value" style={{ color: failedCount > 0 ? '#ef4444' : 'inherit' }}>{failedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⛔ 차단</div>
          <div className="stat-value" style={{ color: blockedCount > 0 ? '#dc2626' : 'inherit' }}>{blockedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🌐 고유 IP</div>
          <div className="stat-value">{uniqueIPs}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 사용자 또는 IP 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="all">모든 사용자</option>
          {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'SUCCESS', 'FAILED', 'BLOCKED'].map(status => {
            const config = status !== 'all' ? getStatusConfig(status) : null;
            return (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '전체' : config?.label}
              </button>
            );
          })}
        </div>
        <select className="form-input" value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ maxWidth: '130px', marginLeft: 'auto' }}>
          <option value="1h">최근 1시간</option>
          <option value="24h">최근 24시간</option>
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
        </select>
      </div>

      {/* Records List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>사용자</th>
                  <th>IP / 위치</th>
                  <th>디바이스</th>
                  <th>시간</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => {
                  const statusConfig = getStatusConfig(record.status);
                  return (
                    <tr key={record.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                          <span>{statusConfig.icon}</span>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{record.user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{record.user.email}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <code style={{ fontSize: '0.8rem' }}>{record.ipAddress}</code>
                          {record.location && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📍 {record.location}</div>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>{record.device}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{record.browser}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {getTimeAgo(record.timestamp)}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRecord(record)}>👁️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="modal-overlay active" onClick={() => setSelectedRecord(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔍 로그인 상세</h3>
              <button className="modal-close" onClick={() => setSelectedRecord(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>사용자</div>
                  <div style={{ fontWeight: 500 }}>{selectedRecord.user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selectedRecord.user.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>상태</div>
                  <span style={{ padding: '4px 10px', background: getStatusConfig(selectedRecord.status).bg, color: getStatusConfig(selectedRecord.status).color, borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                    {getStatusConfig(selectedRecord.status).label}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>IP 주소</div>
                  <code>{selectedRecord.ipAddress}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>위치</div>
                  <div>{selectedRecord.location || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>디바이스</div>
                  <div>{selectedRecord.device}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>브라우저</div>
                  <div>{selectedRecord.browser}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>시간</div>
                  <div>{new Date(selectedRecord.timestamp).toLocaleString('ko-KR')}</div>
                </div>
                {selectedRecord.mfaMethod && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>MFA 방식</div>
                    <div>🔐 {selectedRecord.mfaMethod}</div>
                  </div>
                )}
                {selectedRecord.failReason && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>실패 사유</div>
                    <div style={{ color: '#ef4444' }}>❌ {selectedRecord.failReason}</div>
                  </div>
                )}
                {selectedRecord.sessionDuration && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>세션 시간</div>
                    <div>⏱️ {selectedRecord.sessionDuration}분</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SessionRecording {
  id: string;
  sessionId: string;
  user: { id: string; name: string; email: string };
  server: { name: string; ip: string };
  startedAt: string;
  endedAt?: string;
  duration: number; // seconds
  fileSize: number; // bytes
  commandCount: number;
  status: 'RECORDING' | 'COMPLETED' | 'PROCESSING' | 'FAILED';
  hasVideo: boolean;
  hasAudit: boolean;
  keystrokes: number;
  errorCount: number;
  flagged?: boolean;
  flagReason?: string;
  tags: string[];
}

export default function SessionRecordingPage() {
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  useEffect(() => {
    const mockRecordings: SessionRecording[] = [
      { id: '1', sessionId: 'sess-001', user: { id: 'u1', name: '김개발', email: 'kim@company.com' }, server: { name: 'prod-web-01', ip: '10.0.1.10' }, startedAt: new Date(Date.now() - 30 * 60000).toISOString(), duration: 1800, fileSize: 15728640, commandCount: 47, status: 'RECORDING', hasVideo: true, hasAudit: true, keystrokes: 2340, errorCount: 2, tags: ['production', 'deploy'] },
      { id: '2', sessionId: 'sess-002', user: { id: 'u2', name: '박DBA', email: 'park@company.com' }, server: { name: 'db-master-01', ip: '10.0.3.10' }, startedAt: new Date(Date.now() - 2 * 3600000).toISOString(), endedAt: new Date(Date.now() - 1 * 3600000).toISOString(), duration: 3600, fileSize: 31457280, commandCount: 156, status: 'COMPLETED', hasVideo: true, hasAudit: true, keystrokes: 5680, errorCount: 0, tags: ['database', 'backup'] },
      { id: '3', sessionId: 'sess-003', user: { id: 'u3', name: '이운영', email: 'lee@company.com' }, server: { name: 'stage-app-01', ip: '10.0.2.10' }, startedAt: new Date(Date.now() - 4 * 3600000).toISOString(), endedAt: new Date(Date.now() - 3 * 3600000).toISOString(), duration: 3600, fileSize: 26214400, commandCount: 89, status: 'COMPLETED', hasVideo: true, hasAudit: true, keystrokes: 3200, errorCount: 5, flagged: true, flagReason: '민감 명령어 실행', tags: ['staging'] },
      { id: '4', sessionId: 'sess-004', user: { id: 'u1', name: '김개발', email: 'kim@company.com' }, server: { name: 'prod-web-02', ip: '10.0.1.11' }, startedAt: new Date(Date.now() - 6 * 3600000).toISOString(), endedAt: new Date(Date.now() - 5 * 3600000).toISOString(), duration: 3600, fileSize: 20971520, commandCount: 34, status: 'COMPLETED', hasVideo: true, hasAudit: true, keystrokes: 1800, errorCount: 0, tags: ['production'] },
      { id: '5', sessionId: 'sess-005', user: { id: 'u4', name: '최보안', email: 'choi@company.com' }, server: { name: 'log-server-01', ip: '10.0.5.10' }, startedAt: new Date(Date.now() - 12 * 3600000).toISOString(), endedAt: new Date(Date.now() - 11 * 3600000).toISOString(), duration: 3600, fileSize: 10485760, commandCount: 23, status: 'COMPLETED', hasVideo: false, hasAudit: true, keystrokes: 890, errorCount: 0, tags: ['audit'] },
      { id: '6', sessionId: 'sess-006', user: { id: 'u2', name: '박DBA', email: 'park@company.com' }, server: { name: 'db-slave-01', ip: '10.0.3.11' }, startedAt: new Date(Date.now() - 10 * 60000).toISOString(), duration: 600, fileSize: 5242880, commandCount: 12, status: 'RECORDING', hasVideo: true, hasAudit: true, keystrokes: 560, errorCount: 0, tags: ['database'] },
      { id: '7', sessionId: 'sess-007', user: { id: 'u3', name: '이운영', email: 'lee@company.com' }, server: { name: 'prod-api-01', ip: '10.0.1.20' }, startedAt: new Date(Date.now() - 24 * 3600000).toISOString(), duration: 1200, fileSize: 0, commandCount: 45, status: 'FAILED', hasVideo: false, hasAudit: true, keystrokes: 1200, errorCount: 12, tags: ['production', 'api'] },
      { id: '8', sessionId: 'sess-008', user: { id: 'u1', name: '김개발', email: 'kim@company.com' }, server: { name: 'prod-web-01', ip: '10.0.1.10' }, startedAt: new Date(Date.now() - 5 * 60000).toISOString(), duration: 300, fileSize: 2097152, commandCount: 8, status: 'PROCESSING', hasVideo: true, hasAudit: true, keystrokes: 340, errorCount: 0, tags: ['production'] },
    ];
    setRecordings(mockRecordings);
    setLoading(false);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'RECORDING': return { color: '#ef4444', bg: '#ef444420', label: '녹화중', icon: '🔴' };
      case 'COMPLETED': return { color: '#10b981', bg: '#10b98120', label: '완료', icon: '✓' };
      case 'PROCESSING': return { color: '#f59e0b', bg: '#f59e0b20', label: '처리중', icon: '⏳' };
      case 'FAILED': return { color: '#6b7280', bg: '#6b728020', label: '실패', icon: '✗' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '?' };
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}시간 ${m}분`;
    if (m > 0) return `${m}분 ${s}초`;
    return `${s}초`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const uniqueUsers = [...new Set(recordings.map(r => r.user.name))];
  const filteredRecordings = recordings.filter(r => {
    if (searchQuery && !r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.server.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterUser !== 'all' && r.user.name !== filterUser) return false;
    return true;
  });

  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
  const totalCommands = recordings.reduce((sum, r) => sum + r.commandCount, 0);
  const activeCount = recordings.filter(r => r.status === 'RECORDING').length;
  const flaggedCount = recordings.filter(r => r.flagged).length;

  return (
    <AdminLayout 
      title="세션 녹화" 
      description="SSH 세션 녹화 및 재생"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 녹화</div>
          <div className="stat-value">{recordings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔴 녹화중</div>
          <div className="stat-value" style={{ color: activeCount > 0 ? '#ef4444' : 'inherit' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⏱️ 총 시간</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>{formatDuration(totalDuration)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💻 명령어</div>
          <div className="stat-value">{totalCommands.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🚩 플래그</div>
          <div className="stat-value" style={{ color: flaggedCount > 0 ? '#f59e0b' : 'inherit' }}>{flaggedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 사용자 또는 서버..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="all">모든 사용자</option>
          {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'RECORDING', 'COMPLETED', 'PROCESSING'].map(status => {
            const config = status !== 'all' ? getStatusConfig(status) : null;
            return (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '전체' : `${config?.icon} ${config?.label}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recordings Table */}
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
                  <th>서버</th>
                  <th>시간</th>
                  <th>명령어</th>
                  <th>크기</th>
                  <th>시작</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecordings.map(recording => {
                  const statusConfig = getStatusConfig(recording.status);
                  return (
                    <tr key={recording.id} style={{ background: recording.flagged ? '#f59e0b10' : undefined }}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                        {recording.flagged && <span style={{ marginLeft: '6px' }} title={recording.flagReason}>🚩</span>}
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{recording.user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{recording.user.email}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{recording.server.name}</div>
                          <code style={{ fontSize: '0.75rem' }}>{recording.server.ip}</code>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{formatDuration(recording.duration)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{recording.commandCount}</span>
                          {recording.errorCount > 0 && (
                            <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>❌ {recording.errorCount}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{formatFileSize(recording.fileSize)}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{getTimeAgo(recording.startedAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {recording.hasVideo && recording.status === 'COMPLETED' && (
                            <button className="btn btn-ghost btn-sm" title="재생" onClick={() => setPlaybackUrl(recording.id)}>▶️</button>
                          )}
                          <button className="btn btn-ghost btn-sm" title="상세" onClick={() => setSelectedRecording(recording)}>👁️</button>
                          {recording.hasAudit && (
                            <button className="btn btn-ghost btn-sm" title="감사 로그">📋</button>
                          )}
                        </div>
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
      {selectedRecording && (
        <div className="modal-overlay active" onClick={() => setSelectedRecording(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🎬 세션 녹화 상세</h3>
              <button className="modal-close" onClick={() => setSelectedRecording(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>세션 ID</div>
                  <code>{selectedRecording.sessionId}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>상태</div>
                  <span style={{ padding: '4px 10px', background: getStatusConfig(selectedRecording.status).bg, color: getStatusConfig(selectedRecording.status).color, borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                    {getStatusConfig(selectedRecording.status).icon} {getStatusConfig(selectedRecording.status).label}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>사용자</div>
                  <div>{selectedRecording.user.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>서버</div>
                  <div>{selectedRecording.server.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>녹화 시간</div>
                  <div>⏱️ {formatDuration(selectedRecording.duration)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>파일 크기</div>
                  <div>{formatFileSize(selectedRecording.fileSize)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>명령어 수</div>
                  <div>💻 {selectedRecording.commandCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>키 입력</div>
                  <div>⌨️ {selectedRecording.keystrokes.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>비디오</div>
                  <div>{selectedRecording.hasVideo ? '🎥 있음' : '❌ 없음'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>감사 로그</div>
                  <div>{selectedRecording.hasAudit ? '📋 있음' : '❌ 없음'}</div>
                </div>
                {selectedRecording.flagged && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>플래그 사유</div>
                    <div style={{ color: '#f59e0b' }}>🚩 {selectedRecording.flagReason}</div>
                  </div>
                )}
                {selectedRecording.tags.length > 0 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>태그</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {selectedRecording.tags.map(tag => (
                        <span key={tag} style={{ padding: '2px 8px', background: '#3b82f620', color: '#3b82f6', borderRadius: '4px', fontSize: '0.75rem' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedRecording.hasVideo && selectedRecording.status === 'COMPLETED' && (
                <button className="btn btn-primary" onClick={() => { setPlaybackUrl(selectedRecording.id); setSelectedRecording(null); }}>▶️ 재생</button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedRecording(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Playback Modal */}
      {playbackUrl && (
        <div className="modal-overlay active" onClick={() => setPlaybackUrl(null)}>
          <div className="modal" style={{ maxWidth: '900px', height: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">▶️ 세션 재생</h3>
              <button className="modal-close" onClick={() => setPlaybackUrl(null)}>×</button>
            </div>
            <div className="modal-body" style={{ height: 'calc(100% - 120px)', padding: 0 }}>
              <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎬</div>
                  <div>세션 녹화 재생 플레이어</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>(실제 구현 시 asciinema-player 또는 커스텀 플레이어 연동)</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost">⏮️</button>
              <button className="btn btn-ghost">⏪</button>
              <button className="btn btn-primary">⏯️</button>
              <button className="btn btn-ghost">⏩</button>
              <button className="btn btn-ghost">⏭️</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={() => setPlaybackUrl(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

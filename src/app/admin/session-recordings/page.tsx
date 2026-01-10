'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Recording {
  id: string;
  sessionId: string;
  user: { name: string; email: string };
  server: { name: string; ip: string };
  startedAt: string;
  endedAt: string;
  duration: number; // seconds
  size: number; // bytes
  commands: number;
  status: 'AVAILABLE' | 'PROCESSING' | 'ARCHIVED' | 'EXPIRED';
  hasAlerts: boolean;
  thumbnail?: string;
}

export default function SessionRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    setLoading(true);
    const mockRecordings: Recording[] = [
      { id: '1', sessionId: 'sess-001', user: { name: '김개발', email: 'kim@example.com' }, server: { name: 'prod-web-01', ip: '10.0.1.10' }, startedAt: new Date(Date.now() - 2 * 3600000).toISOString(), endedAt: new Date(Date.now() - 1 * 3600000).toISOString(), duration: 3600, size: 15 * 1024 * 1024, commands: 145, status: 'AVAILABLE', hasAlerts: false },
      { id: '2', sessionId: 'sess-002', user: { name: '박운영', email: 'park@example.com' }, server: { name: 'db-master-01', ip: '10.0.3.10' }, startedAt: new Date(Date.now() - 4 * 3600000).toISOString(), endedAt: new Date(Date.now() - 3 * 3600000).toISOString(), duration: 2540, size: 8.5 * 1024 * 1024, commands: 89, status: 'AVAILABLE', hasAlerts: true },
      { id: '3', sessionId: 'sess-003', user: { name: '이보안', email: 'lee@example.com' }, server: { name: 'stage-app-01', ip: '10.0.2.10' }, startedAt: new Date(Date.now() - 6 * 3600000).toISOString(), endedAt: new Date(Date.now() - 5.5 * 3600000).toISOString(), duration: 1800, size: 5.2 * 1024 * 1024, commands: 56, status: 'AVAILABLE', hasAlerts: false },
      { id: '4', sessionId: 'sess-004', user: { name: '최데브옵스', email: 'choi@example.com' }, server: { name: 'prod-api-01', ip: '10.0.1.20' }, startedAt: new Date(Date.now() - 24 * 3600000).toISOString(), endedAt: new Date(Date.now() - 23 * 3600000).toISOString(), duration: 4200, size: 22 * 1024 * 1024, commands: 312, status: 'AVAILABLE', hasAlerts: true },
      { id: '5', sessionId: 'sess-005', user: { name: '정관리', email: 'jung@example.com' }, server: { name: 'prod-web-02', ip: '10.0.1.11' }, startedAt: new Date(Date.now() - 48 * 3600000).toISOString(), endedAt: new Date(Date.now() - 47 * 3600000).toISOString(), duration: 2700, size: 12 * 1024 * 1024, commands: 98, status: 'ARCHIVED', hasAlerts: false },
      { id: '6', sessionId: 'sess-006', user: { name: '김개발', email: 'kim@example.com' }, server: { name: 'prod-web-01', ip: '10.0.1.10' }, startedAt: new Date(Date.now() - 0.5 * 3600000).toISOString(), endedAt: new Date().toISOString(), duration: 0, size: 0, commands: 0, status: 'PROCESSING', hasAlerts: false },
    ];
    setRecordings(mockRecordings);
    setLoading(false);
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return { color: '#10b981', bg: '#10b98120', label: '재생 가능', icon: '▶️' };
      case 'PROCESSING': return { color: '#3b82f6', bg: '#3b82f620', label: '처리 중', icon: '🔄' };
      case 'ARCHIVED': return { color: '#6b7280', bg: '#6b728020', label: '보관됨', icon: '📦' };
      case 'EXPIRED': return { color: '#ef4444', bg: '#ef444420', label: '만료됨', icon: '⏰' };
      default: return { color: '#6b7280', bg: '#6b728020', label: status, icon: '📹' };
    }
  };

  const filteredRecordings = recordings.filter(r => {
    const matchesSearch = searchQuery === '' ||
      r.user.name.includes(searchQuery) ||
      r.server.name.includes(searchQuery) ||
      r.sessionId.includes(searchQuery);
    
    const now = Date.now();
    const recordDate = new Date(r.startedAt).getTime();
    let matchesDate = true;
    if (dateFilter === 'today') matchesDate = (now - recordDate) < 24 * 3600000;
    else if (dateFilter === 'week') matchesDate = (now - recordDate) < 7 * 24 * 3600000;
    else if (dateFilter === 'month') matchesDate = (now - recordDate) < 30 * 24 * 3600000;
    
    return matchesSearch && matchesDate;
  });

  const totalSize = recordings.reduce((sum, r) => sum + r.size, 0);
  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
  const alertCount = recordings.filter(r => r.hasAlerts).length;

  return (
    <AdminLayout 
      title="세션 녹화" 
      description="터미널 세션 녹화 및 재생"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 녹화</div>
          <div className="stat-value">{recordings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 용량</div>
          <div className="stat-value">{formatSize(totalSize)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 시간</div>
          <div className="stat-value">{formatDuration(totalDuration)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ 알림 있음</div>
          <div className="stat-value" style={{ color: alertCount > 0 ? '#f59e0b' : 'inherit' }}>{alertCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 사용자, 서버, 세션 ID 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { value: 'all', label: '전체' },
            { value: 'today', label: '오늘' },
            { value: 'week', label: '이번 주' },
            { value: 'month', label: '이번 달' },
          ].map(option => (
            <button 
              key={option.value}
              className={`btn btn-sm ${dateFilter === option.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDateFilter(option.value as typeof dateFilter)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recordings Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredRecordings.map(recording => {
            const status = getStatusConfig(recording.status);
            return (
              <div key={recording.id} className="card" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => setSelectedRecording(recording)}>
                {/* Thumbnail placeholder */}
                <div style={{ height: '120px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: '2rem', opacity: 0.5 }}>🖥️</span>
                  {recording.hasAlerts && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 8px', background: '#f59e0b', color: 'white', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                      ⚠️ 알림
                    </span>
                  )}
                  <span style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '2px 8px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>
                    {formatDuration(recording.duration)}
                  </span>
                  <span style={{ position: 'absolute', bottom: '8px', left: '8px', padding: '2px 8px', background: status.bg, color: status.color, borderRadius: '4px', fontSize: '0.7rem' }}>
                    {status.icon} {status.label}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{recording.user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{recording.server.name}</div>
                  </div>
                  <code style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px' }}>
                    {recording.sessionId}
                  </code>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>📅 {formatDate(recording.startedAt)}</span>
                  <span>⌨️ {recording.commands}개 명령어</span>
                  <span>💾 {formatSize(recording.size)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Playback Modal */}
      {selectedRecording && (
        <div className="modal-overlay active" onClick={() => setSelectedRecording(null)}>
          <div className="modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🎬 세션 재생 - {selectedRecording.sessionId}</h3>
              <button className="modal-close" onClick={() => setSelectedRecording(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {/* Player area */}
              <div style={{ height: '400px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>▶️</div>
                  <div style={{ opacity: 0.7 }}>세션 녹화 재생</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.5, marginTop: '8px' }}>
                    {selectedRecording.user.name} @ {selectedRecording.server.name}
                  </div>
                </div>
              </div>
              {/* Controls */}
              <div style={{ padding: '16px', background: 'var(--color-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm">⏮️</button>
                  <button className="btn btn-primary btn-sm">▶️ 재생</button>
                  <button className="btn btn-ghost btn-sm">⏭️</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  <span>00:00 / {formatDuration(selectedRecording.duration)}</span>
                  <span>|</span>
                  <span>1x 속도</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm">📥 다운로드</button>
                  <button className="btn btn-ghost btn-sm">📋 로그</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

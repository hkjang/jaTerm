'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Recording {
  id: string;
  sessionId: string;
  userName: string;
  serverName: string;
  environment: string;
  duration: number;
  size: number;
  checksum: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
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

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/recordings', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setRecordings(data.recordings);
      setError('');
    } catch (err) {
      setError('녹화 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  };

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const totalSize = recordings.reduce((a, r) => a + r.size, 0);
  const avgDuration = recordings.length > 0 
    ? recordings.reduce((a, r) => a + r.duration, 0) / recordings.length 
    : 0;

  return (
    <AdminLayout title="세션 녹화" description="터미널 세션 녹화 관리 및 리플레이"
      actions={<button className="btn btn-secondary">📥 일괄 다운로드</button>}>
      
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          {error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 녹화</div><div className="stat-value">{recordings.length}</div></div>
        <div className="stat-card"><div className="stat-label">총 용량</div><div className="stat-value">{formatSize(totalSize)}</div></div>
        <div className="stat-card"><div className="stat-label">평균 시간</div><div className="stat-value">{formatDuration(avgDuration)}</div></div>
        <div className="stat-card"><div className="stat-label">보존 기간</div><div className="stat-value">90일</div></div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : recordings.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          녹화된 세션이 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>세션</th><th>사용자</th><th>서버</th><th>시간</th><th>용량</th><th>검증</th><th>작업</th></tr></thead>
              <tbody>
                {recordings.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{rec.sessionId.substring(0, 12)}...</td>
                    <td style={{ fontWeight: 500 }}>{rec.userName}</td>
                    <td>
                      <span className={`badge badge-${rec.environment === 'PROD' ? 'danger' : rec.environment === 'STAGE' ? 'warning' : 'success'}`} style={{ fontSize: '0.65rem', marginRight: '8px' }}>{rec.environment}</span>
                      {rec.serverName}
                    </td>
                    <td>{formatDuration(rec.duration)}</td>
                    <td>{formatSize(rec.size)}</td>
                    <td>{rec.checksum ? <span style={{ color: 'var(--color-success)' }}>✓ 검증됨</span> : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRecording(rec)}>▶️ 재생</button>
                        <button className="btn btn-ghost btn-sm">📥 다운로드</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRecording && (
        <div className="modal-overlay active" onClick={() => setSelectedRecording(null)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">세션 리플레이 - {selectedRecording.sessionId.substring(0, 12)}...</h3><button className="modal-close" onClick={() => setSelectedRecording(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ background: 'var(--terminal-bg)', borderRadius: 'var(--radius-md)', padding: '20px', minHeight: '300px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--color-success)' }}>$ ssh {selectedRecording.userName}@{selectedRecording.serverName}</div>
                <div style={{ marginTop: '8px' }}>Connected to {selectedRecording.serverName}</div>
                <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>[ 타임라인 플레이어 영역 ]</div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="btn btn-secondary">⏮️</button>
                <button className="btn btn-primary">▶️ 재생</button>
                <button className="btn btn-secondary">⏭️</button>
                <div style={{ flex: 1, height: '4px', background: 'var(--color-surface)', borderRadius: '2px' }}>
                  <div style={{ width: '30%', height: '100%', background: 'var(--color-primary)', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>0:00 / {formatDuration(selectedRecording.duration)}</span>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelectedRecording(null)}>닫기</button><button className="btn btn-primary">📥 다운로드</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Report {
  id: string;
  name: string;
  type: 'ACCESS' | 'SECURITY' | 'COMPLIANCE' | 'SESSION' | 'COMMAND';
  format: 'PDF' | 'CSV' | 'JSON';
  status: 'COMPLETED' | 'GENERATING' | 'SCHEDULED' | 'FAILED';
  dateRange: { start: string; end: string };
  createdAt: string;
  size?: number;
  downloadUrl?: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: string;
  recipients: string[];
  nextRun: string;
  isActive: boolean;
}

export default function AuditReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'reports' | 'schedules'>('reports');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [newType, setNewType] = useState<string>('ACCESS');
  const [newFormat, setNewFormat] = useState<string>('PDF');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => {
    setLoading(true);
    const mockReports: Report[] = [
      { id: '1', name: '월간 접근 리포트 - 2026년 1월', type: 'ACCESS', format: 'PDF', status: 'COMPLETED', dateRange: { start: '2026-01-01', end: '2026-01-31' }, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), size: 2.4 * 1024 * 1024 },
      { id: '2', name: '보안 이벤트 리포트', type: 'SECURITY', format: 'PDF', status: 'GENERATING', dateRange: { start: '2026-01-01', end: '2026-01-09' }, createdAt: new Date().toISOString() },
      { id: '3', name: '컴플라이언스 감사 - Q4 2025', type: 'COMPLIANCE', format: 'PDF', status: 'COMPLETED', dateRange: { start: '2025-10-01', end: '2025-12-31' }, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), size: 5.8 * 1024 * 1024 },
      { id: '4', name: '세션 기록 내보내기', type: 'SESSION', format: 'CSV', status: 'COMPLETED', dateRange: { start: '2026-01-01', end: '2026-01-09' }, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), size: 12.3 * 1024 * 1024 },
      { id: '5', name: '명령어 로그', type: 'COMMAND', format: 'JSON', status: 'COMPLETED', dateRange: { start: '2026-01-08', end: '2026-01-09' }, createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), size: 890 * 1024 },
      { id: '6', name: '주간 접근 리포트', type: 'ACCESS', format: 'PDF', status: 'FAILED', dateRange: { start: '2026-01-01', end: '2026-01-07' }, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    ];

    const mockSchedules: ScheduledReport[] = [
      { id: '1', name: '월간 접근 리포트', type: 'ACCESS', frequency: '매월 1일', recipients: ['admin@example.com', 'security@example.com'], nextRun: new Date(Date.now() + 22 * 86400000).toISOString(), isActive: true },
      { id: '2', name: '주간 보안 요약', type: 'SECURITY', frequency: '매주 월요일', recipients: ['security@example.com'], nextRun: new Date(Date.now() + 5 * 86400000).toISOString(), isActive: true },
      { id: '3', name: '일일 세션 로그', type: 'SESSION', frequency: '매일 06:00', recipients: ['ops@example.com'], nextRun: new Date(Date.now() + 12 * 3600000).toISOString(), isActive: true },
    ];

    setReports(mockReports);
    setSchedules(mockSchedules);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleGenerate = () => {
    if (!newStartDate || !newEndDate) return;
    setMessage({ type: 'success', text: '리포트 생성이 시작되었습니다.' });
    setShowGenerateModal(false);
  };

  const handleDownload = (report: Report) => {
    setMessage({ type: 'success', text: '다운로드가 시작되었습니다.' });
  };

  const handleDelete = (report: Report) => {
    if (!confirm(`'${report.name}' 리포트를 삭제하시겠습니까?`)) return;
    setReports(reports.filter(r => r.id !== report.id));
    setMessage({ type: 'success', text: '리포트가 삭제되었습니다.' });
  };

  const handleToggleSchedule = (schedule: ScheduledReport) => {
    setSchedules(schedules.map(s => s.id === schedule.id ? { ...s, isActive: !s.isActive } : s));
    setMessage({ type: 'success', text: schedule.isActive ? '스케줄이 비활성화되었습니다.' : '스케줄이 활성화되었습니다.' });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'ACCESS': return { color: '#3b82f6', bg: '#3b82f620', label: '접근', icon: '🔐' };
      case 'SECURITY': return { color: '#ef4444', bg: '#ef444420', label: '보안', icon: '🛡️' };
      case 'COMPLIANCE': return { color: '#8b5cf6', bg: '#8b5cf620', label: '컴플라이언스', icon: '✓' };
      case 'SESSION': return { color: '#10b981', bg: '#10b98120', label: '세션', icon: '📺' };
      case 'COMMAND': return { color: '#f59e0b', bg: '#f59e0b20', label: '명령어', icon: '⌨️' };
      default: return { color: '#6b7280', bg: '#6b728020', label: type, icon: '📋' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { color: '#10b981', label: '완료' };
      case 'GENERATING': return { color: '#3b82f6', label: '생성 중' };
      case 'SCHEDULED': return { color: '#f59e0b', label: '예약됨' };
      case 'FAILED': return { color: '#ef4444', label: '실패' };
      default: return { color: '#6b7280', label: status };
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const completedCount = reports.filter(r => r.status === 'COMPLETED').length;
  const totalSize = reports.filter(r => r.size).reduce((sum, r) => sum + (r.size || 0), 0);

  return (
    <AdminLayout 
      title="감사 리포트" 
      description="감사 로그 리포트 생성 및 내보내기"
      actions={
        <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
          📊 리포트 생성
        </button>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 리포트</div>
          <div className="stat-value">{reports.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">완료됨</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{completedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 크기</div>
          <div className="stat-value">{formatSize(totalSize)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">활성 스케줄</div>
          <div className="stat-value">{schedules.filter(s => s.isActive).length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
        <button className={`btn btn-sm ${selectedTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedTab('reports')}>
          📋 리포트 ({reports.length})
        </button>
        <button className={`btn btn-sm ${selectedTab === 'schedules' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedTab('schedules')}>
          📅 스케줄 ({schedules.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : selectedTab === 'reports' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map(report => {
            const type = getTypeConfig(report.type);
            const status = getStatusConfig(report.status);
            return (
              <div key={report.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                      <span style={{ fontWeight: 600 }}>{report.name}</span>
                      <span style={{ padding: '2px 8px', background: type.bg, color: type.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{type.label}</span>
                      <span style={{ padding: '2px 8px', background: status.color + '20', color: status.color, borderRadius: '4px', fontSize: '0.7rem' }}>
                        {report.status === 'GENERATING' && '🔄 '}{status.label}
                      </span>
                      <span style={{ padding: '2px 6px', background: 'var(--color-surface)', borderRadius: '4px', fontSize: '0.7rem' }}>{report.format}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span>📅 {report.dateRange.start} ~ {report.dateRange.end}</span>
                      {report.size && <span>💾 {formatSize(report.size)}</span>}
                      <span>🕐 {getTimeAgo(report.createdAt)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {report.status === 'COMPLETED' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleDownload(report)}>⬇️ 다운로드</button>
                    )}
                    {report.status === 'FAILED' && (
                      <button className="btn btn-ghost btn-sm">🔄 재시도</button>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(report)}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {schedules.map(schedule => {
            const type = getTypeConfig(schedule.type);
            return (
              <div key={schedule.id} className="card" style={{ padding: '16px', opacity: schedule.isActive ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{schedule.name}</span>
                      <span style={{ padding: '2px 8px', background: type.bg, color: type.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{type.label}</span>
                      <span className={`badge ${schedule.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {schedule.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span>⏰ {schedule.frequency}</span>
                      <span>📧 {schedule.recipients.join(', ')}</span>
                      <span>📅 다음 실행: {new Date(schedule.nextRun).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleToggleSchedule(schedule)}>
                    {schedule.isActive ? '⏸️ 비활성화' : '▶️ 활성화'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="modal-overlay active" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📊 리포트 생성</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">리포트 유형</label>
                <select className="form-input form-select" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="ACCESS">🔐 접근 리포트</option>
                  <option value="SECURITY">🛡️ 보안 리포트</option>
                  <option value="COMPLIANCE">✓ 컴플라이언스</option>
                  <option value="SESSION">📺 세션 기록</option>
                  <option value="COMMAND">⌨️ 명령어 로그</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">출력 형식</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['PDF', 'CSV', 'JSON'].map(format => (
                    <label key={format} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: newFormat === format ? 'var(--color-primary)20' : 'var(--color-surface)', borderRadius: '6px', border: newFormat === format ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer' }}>
                      <input type="radio" name="format" checked={newFormat === format} onChange={() => setNewFormat(format)} style={{ display: 'none' }} />
                      <span style={{ fontWeight: 500 }}>{format}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">시작일</label>
                  <input type="date" className="form-input" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">종료일</label>
                  <input type="date" className="form-input" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={!newStartDate || !newEndDate}>생성</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

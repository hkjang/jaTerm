'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface OnCallSchedule {
  id: string;
  name: string;
  team: string;
  currentOnCall: { name: string; email: string; phone: string };
  nextOnCall: { name: string; startTime: string };
  rotationType: 'WEEKLY' | 'DAILY' | 'CUSTOM';
  escalationPolicy: string;
  activeIncidents: number;
  lastAlert: string;
}

export default function OnCallSchedulePage() {
  const [schedules, setSchedules] = useState<OnCallSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<OnCallSchedule | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setSchedules([
      { id: '1', name: 'Platform Oncall', team: 'Platform Team', currentOnCall: { name: '김민수', email: 'minsu@jaterm.io', phone: '+82-10-1234-5678' }, nextOnCall: { name: '이영희', startTime: '2026-01-13 09:00' }, rotationType: 'WEEKLY', escalationPolicy: '5분 → 팀장 → CTO', activeIncidents: 2, lastAlert: '2026-01-10 14:15' },
      { id: '2', name: 'Backend Oncall', team: 'Backend Team', currentOnCall: { name: '박지훈', email: 'jihun@jaterm.io', phone: '+82-10-2345-6789' }, nextOnCall: { name: '최서연', startTime: '2026-01-11 09:00' }, rotationType: 'DAILY', escalationPolicy: '15분 → 시니어 → 팀장', activeIncidents: 0, lastAlert: '2026-01-09 22:30' },
      { id: '3', name: 'Frontend Oncall', team: 'Frontend Team', currentOnCall: { name: '정다은', email: 'daeun@jaterm.io', phone: '+82-10-3456-7890' }, nextOnCall: { name: '강현우', startTime: '2026-01-17 09:00' }, rotationType: 'WEEKLY', escalationPolicy: '10분 → 팀장', activeIncidents: 1, lastAlert: '2026-01-10 10:45' },
      { id: '4', name: 'Security Oncall', team: 'Security Team', currentOnCall: { name: '조성민', email: 'sungmin@jaterm.io', phone: '+82-10-4567-8901' }, nextOnCall: { name: '한지원', startTime: '2026-01-13 09:00' }, rotationType: 'WEEKLY', escalationPolicy: '즉시 → CISO', activeIncidents: 0, lastAlert: '2026-01-08 16:20' },
      { id: '5', name: 'Database Oncall', team: 'DBA Team', currentOnCall: { name: '윤재영', email: 'jaeyoung@jaterm.io', phone: '+82-10-5678-9012' }, nextOnCall: { name: '임수진', startTime: '2026-01-14 09:00' }, rotationType: 'CUSTOM', escalationPolicy: '5분 → DBA Lead → Platform Lead', activeIncidents: 1, lastAlert: '2026-01-10 13:00' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleOverride = (s: OnCallSchedule) => { setSuccess(`${s.name} 수동 변경됨`); setTimeout(() => setSelectedSchedule(null), 500); };
  const handleNotify = (s: OnCallSchedule) => { setSuccess(`${s.currentOnCall.name}에게 알림 전송됨`); };

  const totalActiveIncidents = schedules.reduce((a, s) => a + s.activeIncidents, 0);

  return (
    <AdminLayout title="온콜 스케줄" description="당직 일정 및 에스컬레이션 관리" actions={<button className="btn btn-primary">+ 스케줄</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 스케줄</div><div className="stat-value">{schedules.length}</div></div>
        <div className="stat-card"><div className="stat-label">👤 현재 온콜</div><div className="stat-value">{schedules.length}</div></div>
        <div className="stat-card"><div className="stat-label">🚨 활성 인시던트</div><div className="stat-value" style={{ color: totalActiveIncidents > 0 ? '#ef4444' : '#10b981' }}>{totalActiveIncidents}</div></div>
        <div className="stat-card"><div className="stat-label">주간 로테이션</div><div className="stat-value">{schedules.filter(s => s.rotationType === 'WEEKLY').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {schedules.map(s => (
            <div key={s.id} className="card" style={{ borderLeft: `4px solid ${s.activeIncidents > 0 ? '#ef4444' : '#10b981'}`, cursor: 'pointer' }} onClick={() => setSelectedSchedule(s)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.team}</div></div>
                <div style={{ display: 'flex', gap: 6 }}><span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.7rem' }}>{s.rotationType}</span>{s.activeIncidents > 0 && <span style={{ padding: '2px 8px', background: '#ef444420', color: '#ef4444', borderRadius: 4, fontSize: '0.75rem' }}>🚨 {s.activeIncidents}</span>}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>현재 온콜</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: '1.5rem' }}>👤</span><div><div style={{ fontWeight: 600 }}>{s.currentOnCall.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.currentOnCall.email}</div></div></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}><span style={{ color: 'var(--color-text-muted)' }}>다음: {s.nextOnCall.name}</span><span style={{ color: 'var(--color-text-muted)' }}>{s.nextOnCall.startTime}</span></div>
            </div>
          ))}
        </div>
      )}
      {selectedSchedule && (
        <div className="modal-overlay active" onClick={() => setSelectedSchedule(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📞 {selectedSchedule.name}</h3><button className="modal-close" onClick={() => setSelectedSchedule(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ padding: 16, background: 'var(--color-bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>현재 온콜</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 4 }}>{selectedSchedule.currentOnCall.name}</div>
              <div style={{ fontSize: '0.9rem' }}>📧 {selectedSchedule.currentOnCall.email}</div>
              <div style={{ fontSize: '0.9rem' }}>📱 {selectedSchedule.currentOnCall.phone}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>팀:</b> {selectedSchedule.team}</div><div><b>로테이션:</b> {selectedSchedule.rotationType}</div>
              <div><b>다음 온콜:</b> {selectedSchedule.nextOnCall.name}</div><div><b>변경 시간:</b> {selectedSchedule.nextOnCall.startTime}</div>
            </div>
            <div style={{ padding: 12, background: '#f59e0b10', borderRadius: 8, marginBottom: 16 }}><b>에스컬레이션:</b> {selectedSchedule.escalationPolicy}</div>
            {selectedSchedule.activeIncidents > 0 && <div style={{ padding: 12, background: '#ef444420', borderRadius: 8, color: '#ef4444' }}>🚨 활성 인시던트: {selectedSchedule.activeIncidents}개</div>}
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={() => handleNotify(selectedSchedule)}>📲 알림 전송</button><button className="btn btn-secondary" onClick={() => handleOverride(selectedSchedule)}>🔄 수동 변경</button><button className="btn btn-ghost" onClick={() => setSelectedSchedule(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

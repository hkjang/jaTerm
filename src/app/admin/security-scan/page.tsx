'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SecurityScan {
  id: string;
  name: string;
  type: 'VULNERABILITY' | 'COMPLIANCE' | 'PENETRATION' | 'CVE' | 'MALWARE';
  target: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED';
  severity: { critical: number; high: number; medium: number; low: number };
  startedAt: string;
  completedAt?: string;
  duration?: string;
  lastRunBy: string;
  schedule?: string;
}

export default function SecurityScanPage() {
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<SecurityScan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'VULNERABILITY', target: '*' });

  useEffect(() => {
    setScans([
      { id: '1', name: '전체 취약점 스캔', type: 'VULNERABILITY', target: 'All Servers', status: 'COMPLETED', severity: { critical: 2, high: 8, medium: 25, low: 45 }, startedAt: '2026-01-10 02:00', completedAt: '2026-01-10 04:35', duration: '2h 35m', lastRunBy: 'Scheduled', schedule: '매주 월요일 02:00' },
      { id: '2', name: 'PCI-DSS 컴플라이언스', type: 'COMPLIANCE', target: 'Payment Systems', status: 'COMPLETED', severity: { critical: 0, high: 3, medium: 12, low: 8 }, startedAt: '2026-01-09 10:00', completedAt: '2026-01-09 11:20', duration: '1h 20m', lastRunBy: 'admin', schedule: '매월 1일' },
      { id: '3', name: 'CVE 데이터베이스 체크', type: 'CVE', target: 'Production', status: 'RUNNING', severity: { critical: 0, high: 0, medium: 0, low: 0 }, startedAt: '2026-01-10 14:00', lastRunBy: 'security-bot' },
      { id: '4', name: '멀웨어 스캔', type: 'MALWARE', target: 'File Servers', status: 'COMPLETED', severity: { critical: 0, high: 0, medium: 1, low: 3 }, startedAt: '2026-01-08 22:00', completedAt: '2026-01-09 02:15', duration: '4h 15m', lastRunBy: 'Scheduled', schedule: '매일 22:00' },
      { id: '5', name: '침투 테스트', type: 'PENETRATION', target: 'Web Applications', status: 'SCHEDULED', severity: { critical: 0, high: 0, medium: 0, low: 0 }, startedAt: '2026-01-15 00:00', lastRunBy: 'pentest-team' },
      { id: '6', name: '긴급 CVE 스캔', type: 'CVE', target: 'Critical Systems', status: 'FAILED', severity: { critical: 0, high: 0, medium: 0, low: 0 }, startedAt: '2026-01-10 08:00', lastRunBy: 'admin' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setScans([{ id: String(Date.now()), name: form.name, type: form.type as SecurityScan['type'], target: form.target, status: 'SCHEDULED', severity: { critical: 0, high: 0, medium: 0, low: 0 }, startedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), lastRunBy: 'admin' }, ...scans]); setSuccess('스캔 생성됨'); setShowCreate(false); };
  const handleRunNow = (s: SecurityScan) => { setScans(scans.map(scan => scan.id === s.id ? { ...scan, status: 'RUNNING', startedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : scan)); setSuccess(`${s.name} 시작됨`); setSelectedScan(null); };
  const handleStop = (s: SecurityScan) => { setScans(scans.map(scan => scan.id === s.id ? { ...scan, status: 'FAILED' } : scan)); setSuccess('중지됨'); setSelectedScan(null); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setScans(scans.filter(s => s.id !== id)); setSuccess('삭제됨'); setSelectedScan(null); } };

  const getStatusColor = (s: string) => ({ RUNNING: '#3b82f6', COMPLETED: '#10b981', FAILED: '#ef4444', SCHEDULED: '#6b7280' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ VULNERABILITY: '🔍', COMPLIANCE: '✓', PENETRATION: '🎯', CVE: '🛡️', MALWARE: '🦠' }[t] || '📋');

  const totalCritical = scans.reduce((a, s) => a + s.severity.critical, 0);
  const totalHigh = scans.reduce((a, s) => a + s.severity.high, 0);

  return (
    <AdminLayout title="보안 스캔" description="시스템 보안 취약점 스캔" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 스캔</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 스캔</div><div className="stat-value">{scans.length}</div></div>
        <div className="stat-card"><div className="stat-label">🔵 실행중</div><div className="stat-value" style={{ color: '#3b82f6' }}>{scans.filter(s => s.status === 'RUNNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 Critical</div><div className="stat-value" style={{ color: '#ef4444' }}>{totalCritical}</div></div>
        <div className="stat-card"><div className="stat-label">🟠 High</div><div className="stat-value" style={{ color: '#f59e0b' }}>{totalHigh}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 완료</div><div className="stat-value" style={{ color: '#10b981' }}>{scans.filter(s => s.status === 'COMPLETED').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>스캔</th><th>유형</th><th>대상</th><th>Critical</th><th>High</th><th>Med</th><th>Low</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>{scans.map(s => (
              <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedScan(s)}>
                <td><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.schedule || '수동'}</div></td>
                <td>{getTypeIcon(s.type)} {s.type}</td>
                <td>{s.target}</td>
                <td style={{ color: s.severity.critical > 0 ? '#ef4444' : 'inherit', fontWeight: s.severity.critical > 0 ? 700 : 400 }}>{s.severity.critical}</td>
                <td style={{ color: s.severity.high > 0 ? '#f59e0b' : 'inherit' }}>{s.severity.high}</td>
                <td>{s.severity.medium}</td>
                <td>{s.severity.low}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), borderRadius: 4, fontSize: '0.75rem' }}>{s.status}</span></td>
                <td onClick={e => e.stopPropagation()}>{s.status !== 'RUNNING' ? <button className="btn btn-ghost btn-sm" onClick={() => handleRunNow(s)}>▶️</button> : <button className="btn btn-ghost btn-sm" onClick={() => handleStop(s)}>⏹️</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedScan && (
        <div className="modal-overlay active" onClick={() => setSelectedScan(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedScan.type)} {selectedScan.name}</h3><button className="modal-close" onClick={() => setSelectedScan(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedScan.status)}20`, color: getStatusColor(selectedScan.status), borderRadius: 6 }}>{selectedScan.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedScan.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ padding: 12, background: '#ef444420', borderRadius: 8 }}><div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Critical</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{selectedScan.severity.critical}</div></div>
              <div style={{ padding: 12, background: '#f59e0b20', borderRadius: 8 }}><div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>High</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{selectedScan.severity.high}</div></div>
              <div style={{ padding: 12, background: '#3b82f620', borderRadius: 8 }}><div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Medium</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{selectedScan.severity.medium}</div></div>
              <div style={{ padding: 12, background: '#6b728020', borderRadius: 8 }}><div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Low</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6b7280' }}>{selectedScan.severity.low}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>대상:</b> {selectedScan.target}</div><div><b>실행자:</b> {selectedScan.lastRunBy}</div><div><b>시작:</b> {selectedScan.startedAt}</div><div><b>완료:</b> {selectedScan.completedAt || '-'}</div>{selectedScan.duration && <div><b>소요:</b> {selectedScan.duration}</div>}{selectedScan.schedule && <div><b>스케줄:</b> {selectedScan.schedule}</div>}</div>
          </div>
          <div className="modal-footer">{selectedScan.status !== 'RUNNING' ? <button className="btn btn-primary" onClick={() => handleRunNow(selectedScan)}>▶️ 실행</button> : <button className="btn btn-secondary" onClick={() => handleStop(selectedScan)}>⏹️ 중지</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedScan.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedScan(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔍 보안 스캔 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="VULNERABILITY">취약점</option><option value="COMPLIANCE">컴플라이언스</option><option value="CVE">CVE</option><option value="MALWARE">멀웨어</option><option value="PENETRATION">침투</option></select></div>
            <div className="form-group"><label className="form-label">대상</label><input className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

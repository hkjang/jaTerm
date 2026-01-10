'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface RetentionPolicy {
  id: string;
  name: string;
  dataType: 'LOGS' | 'SESSIONS' | 'AUDIT_TRAILS' | 'BACKUPS' | 'METRICS' | 'RECORDINGS';
  retentionDays: number;
  storage: { used: number; unit: string };
  status: 'ACTIVE' | 'PROCESSING' | 'PAUSED';
  lastPurge: string;
  nextPurge: string;
  purgable: number;
  complianceTag: string | null;
}

export default function DataRetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<RetentionPolicy | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', dataType: 'LOGS', retentionDays: 90, complianceTag: '' });

  useEffect(() => {
    setPolicies([
      { id: '1', name: '시스템 로그', dataType: 'LOGS', retentionDays: 90, storage: { used: 125, unit: 'GB' }, status: 'ACTIVE', lastPurge: '2026-01-09 02:00', nextPurge: '2026-01-16 02:00', purgable: 45, complianceTag: null },
      { id: '2', name: '터미널 세션', dataType: 'SESSIONS', retentionDays: 365, storage: { used: 850, unit: 'GB' }, status: 'ACTIVE', lastPurge: '2026-01-01 03:00', nextPurge: '2026-02-01 03:00', purgable: 120, complianceTag: 'SOC2' },
      { id: '3', name: '감사 추적', dataType: 'AUDIT_TRAILS', retentionDays: 2555, storage: { used: 1.2, unit: 'TB' }, status: 'ACTIVE', lastPurge: '2025-12-01 04:00', nextPurge: '2026-01-01 04:00', purgable: 0, complianceTag: 'SOX' },
      { id: '4', name: '데이터베이스 백업', dataType: 'BACKUPS', retentionDays: 180, storage: { used: 2.5, unit: 'TB' }, status: 'ACTIVE', lastPurge: '2026-01-05 05:00', nextPurge: '2026-02-05 05:00', purgable: 350, complianceTag: null },
      { id: '5', name: '시스템 메트릭', dataType: 'METRICS', retentionDays: 30, storage: { used: 85, unit: 'GB' }, status: 'PROCESSING', lastPurge: '2026-01-10 01:00', nextPurge: '2026-01-17 01:00', purgable: 0, complianceTag: null },
      { id: '6', name: '세션 녹화', dataType: 'RECORDINGS', retentionDays: 730, storage: { used: 3.8, unit: 'TB' }, status: 'ACTIVE', lastPurge: '2025-12-15 06:00', nextPurge: '2026-01-15 06:00', purgable: 250, complianceTag: 'GDPR' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setPolicies([{ id: String(Date.now()), name: form.name, dataType: form.dataType as RetentionPolicy['dataType'], retentionDays: form.retentionDays, storage: { used: 0, unit: 'GB' }, status: 'ACTIVE', lastPurge: '-', nextPurge: '-', purgable: 0, complianceTag: form.complianceTag || null }, ...policies]); setSuccess('정책 생성됨'); setShowCreate(false); setForm({ name: '', dataType: 'LOGS', retentionDays: 90, complianceTag: '' }); };
  const handlePurge = (p: RetentionPolicy) => { if (confirm(`${p.purgable}GB 삭제?`)) { setPolicies(policies.map(pol => pol.id === p.id ? { ...pol, status: 'PROCESSING', purgable: 0 } : pol)); setSuccess(`${p.name} 정리 시작`); setSelectedPolicy(null); } };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setPolicies(policies.filter(p => p.id !== id)); setSuccess('삭제됨'); setSelectedPolicy(null); } };

  const getTypeIcon = (t: string) => ({ LOGS: '📜', SESSIONS: '💻', AUDIT_TRAILS: '📋', BACKUPS: '💾', METRICS: '📊', RECORDINGS: '🎥' }[t] || '📁');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', PROCESSING: '#3b82f6', PAUSED: '#6b7280' }[s] || '#6b7280');
  const formatStorage = (s: { used: number; unit: string }) => `${s.used} ${s.unit}`;

  const totalStorage = policies.reduce((a, p) => a + (p.storage.unit === 'TB' ? p.storage.used * 1000 : p.storage.used), 0);
  const totalPurgable = policies.reduce((a, p) => a + p.purgable, 0);

  return (
    <AdminLayout title="데이터 보존 정책" description="데이터 수명주기 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 정책</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 정책</div><div className="stat-value">{policies.length}</div></div>
        <div className="stat-card"><div className="stat-label">💾 총 스토리지</div><div className="stat-value">{(totalStorage / 1000).toFixed(1)} TB</div></div>
        <div className="stat-card"><div className="stat-label">🗑️ 삭제 가능</div><div className="stat-value" style={{ color: totalPurgable > 0 ? '#f59e0b' : '#10b981' }}>{totalPurgable} GB</div></div>
        <div className="stat-card"><div className="stat-label">📋 컴플라이언스</div><div className="stat-value">{policies.filter(p => p.complianceTag).length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>정책</th><th>데이터 유형</th><th>보존 기간</th><th>스토리지</th><th>삭제 가능</th><th>다음 정리</th><th>상태</th></tr></thead>
            <tbody>{policies.map(p => (
              <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPolicy(p)}>
                <td><div style={{ fontWeight: 600 }}>{p.name}</div>{p.complianceTag && <span style={{ padding: '2px 6px', background: '#8b5cf620', color: '#8b5cf6', borderRadius: 4, fontSize: '0.7rem' }}>{p.complianceTag}</span>}</td>
                <td>{getTypeIcon(p.dataType)} {p.dataType}</td>
                <td>{p.retentionDays}일</td>
                <td>{formatStorage(p.storage)}</td>
                <td style={{ color: p.purgable > 0 ? '#f59e0b' : 'inherit' }}>{p.purgable > 0 ? `${p.purgable} GB` : '-'}</td>
                <td style={{ fontSize: '0.85rem' }}>{p.nextPurge}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(p.status)}20`, color: getStatusColor(p.status), borderRadius: 4, fontSize: '0.8rem' }}>{p.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedPolicy && (
        <div className="modal-overlay active" onClick={() => setSelectedPolicy(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedPolicy.dataType)} {selectedPolicy.name}</h3><button className="modal-close" onClick={() => setSelectedPolicy(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedPolicy.status)}20`, color: getStatusColor(selectedPolicy.status), borderRadius: 6 }}>{selectedPolicy.status}</span>{selectedPolicy.complianceTag && <span style={{ padding: '4px 10px', background: '#8b5cf620', color: '#8b5cf6', borderRadius: 6 }}>{selectedPolicy.complianceTag}</span>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><b>데이터 유형:</b> {selectedPolicy.dataType}</div><div><b>보존 기간:</b> {selectedPolicy.retentionDays}일</div>
              <div><b>스토리지:</b> {formatStorage(selectedPolicy.storage)}</div><div><b>삭제 가능:</b> {selectedPolicy.purgable} GB</div>
              <div><b>마지막 정리:</b> {selectedPolicy.lastPurge}</div><div><b>다음 정리:</b> {selectedPolicy.nextPurge}</div>
            </div>
            {selectedPolicy.purgable > 0 && <div style={{ padding: 12, background: '#f59e0b10', borderRadius: 8, color: '#f59e0b' }}>⚠️ {selectedPolicy.purgable}GB 삭제 가능한 데이터가 있습니다.</div>}
          </div>
          <div className="modal-footer">{selectedPolicy.purgable > 0 && <button className="btn btn-secondary" onClick={() => handlePurge(selectedPolicy)}>🗑️ 지금 정리</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedPolicy.id)}>삭제</button><button className="btn btn-ghost" onClick={() => setSelectedPolicy(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📋 보존 정책 추가</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmub={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">정책 이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">데이터 유형</label><select className="form-input" value={form.dataType} onChange={e => setForm({ ...form, dataType: e.target.value })}><option value="LOGS">로그</option><option value="SESSIONS">세션</option><option value="AUDIT_TRAILS">감사 추적</option><option value="BACKUPS">백업</option><option value="METRICS">메트릭</option><option value="RECORDINGS">녹화</option></select></div>
            <div className="form-group"><label className="form-label">보존 기간 (일)</label><input type="number" className="form-input" value={form.retentionDays} onChange={e => setForm({ ...form, retentionDays: parseInt(e.target.value) })} min={1} required /></div>
            <div className="form-group"><label className="form-label">컴플라이언스 태그 (선택)</label><input className="form-input" value={form.complianceTag} onChange={e => setForm({ ...form, complianceTag: e.target.value })} placeholder="SOC2, GDPR, SOX..." /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

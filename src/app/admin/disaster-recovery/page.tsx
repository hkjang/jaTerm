'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DrPlan {
  id: string;
  name: string;
  type: 'FAILOVER' | 'BACKUP_RESTORE' | 'ACTIVE_ACTIVE' | 'PILOT_LIGHT';
  status: 'ACTIVE' | 'TESTING' | 'OUTDATED' | 'DRAFT';
  primaryRegion: string;
  drRegion: string;
  rto: string;
  rpo: string;
  lastTest: string;
  nextTest: string;
  services: string[];
}

export default function DisasterRecoveryPage() {
  const [plans, setPlans] = useState<DrPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<DrPlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', type: 'FAILOVER', primaryRegion: 'ap-northeast-2', drRegion: 'ap-southeast-1', rto: '4h', rpo: '1h', services: 'API,DB' });

  useEffect(() => {
    setPlans([
      { id: '1', name: 'Production Full DR', type: 'ACTIVE_ACTIVE', status: 'ACTIVE', primaryRegion: 'ap-northeast-2', drRegion: 'ap-southeast-1', rto: '15분', rpo: '0', lastTest: '2026-01-05', nextTest: '2026-02-05', services: ['API Server', 'Database', 'Redis', 'Storage'] },
      { id: '2', name: 'Database Backup/Restore', type: 'BACKUP_RESTORE', status: 'ACTIVE', primaryRegion: 'ap-northeast-2', drRegion: 'ap-northeast-1', rto: '4시간', rpo: '1시간', lastTest: '2025-12-20', nextTest: '2026-01-20', services: ['PostgreSQL', 'MongoDB'] },
      { id: '3', name: 'Web Tier Failover', type: 'FAILOVER', status: 'TESTING', primaryRegion: 'ap-northeast-2', drRegion: 'us-west-2', rto: '30분', rpo: '5분', lastTest: '2026-01-08', nextTest: '2026-01-15', services: ['Web App', 'CDN', 'Load Balancer'] },
      { id: '4', name: 'K8s Pilot Light', type: 'PILOT_LIGHT', status: 'DRAFT', primaryRegion: 'ap-northeast-2', drRegion: 'eu-west-1', rto: '2시간', rpo: '30분', lastTest: '-', nextTest: '2026-02-01', services: ['Kubernetes', 'Container Registry'] },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setPlans([{ id: String(Date.now()), name: form.name, type: form.type as DrPlan['type'], status: 'DRAFT', primaryRegion: form.primaryRegion, drRegion: form.drRegion, rto: form.rto, rpo: form.rpo, lastTest: '-', nextTest: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10), services: form.services.split(',').map(s => s.trim()) }, ...plans]); setSuccess('DR 계획 생성됨'); setShowCreate(false); };
  const handleTest = (p: DrPlan) => { setPlans(plans.map(plan => plan.id === p.id ? { ...plan, status: 'TESTING', lastTest: new Date().toISOString().slice(0,10) } : plan)); setSuccess(`${p.name} DR 테스트 시작`); setSelectedPlan(null); };
  const handleActivate = (p: DrPlan) => { setPlans(plans.map(plan => plan.id === p.id ? { ...plan, status: 'ACTIVE' } : plan)); setSuccess(`${p.name} 활성화됨`); setSelectedPlan(null); };
  const handleFailover = (p: DrPlan) => { if (confirm(`${p.name} Failover를 실행하시겠습니까? 이 작업은 프로덕션에 영향을 줍니다.`)) { setSuccess(`🚨 ${p.name} Failover 실행 중...`); } };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setPlans(plans.filter(p => p.id !== id)); setSuccess('삭제됨'); setSelectedPlan(null); } };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', TESTING: '#3b82f6', OUTDATED: '#f59e0b', DRAFT: '#6b7280' }[s] || '#6b7280');
  const getTypeIcon = (t: string) => ({ FAILOVER: '🔄', BACKUP_RESTORE: '💾', ACTIVE_ACTIVE: '⚡', PILOT_LIGHT: '🔥' }[t] || '📋');

  return (
    <AdminLayout title="재해 복구(DR)" description="Disaster Recovery 계획 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ DR 계획</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 DR 계획</div><div className="stat-value">{plans.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{plans.filter(p => p.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔵 테스트중</div><div className="stat-value" style={{ color: '#3b82f6' }}>{plans.filter(p => p.status === 'TESTING').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 초안/만료</div><div className="stat-value" style={{ color: '#f59e0b' }}>{plans.filter(p => p.status === 'DRAFT' || p.status === 'OUTDATED').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gap: 12 }}>{plans.map(p => (
          <div key={p.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(p.status)}`, cursor: 'pointer' }} onClick={() => setSelectedPlan(p)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: '1.2rem' }}>{getTypeIcon(p.type)}</span><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.name}</span><span style={{ padding: '2px 8px', background: `${getStatusColor(p.status)}20`, color: getStatusColor(p.status), borderRadius: 4, fontSize: '0.75rem' }}>{p.status}</span></div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 8 }}><span>🌏 {p.primaryRegion} → {p.drRegion}</span><span>⏱️ RTO: {p.rto}</span><span>💾 RPO: {p.rpo}</span></div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{p.services.map(s => <span key={s} style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.75rem' }}>{s}</span>)}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem' }}><div>마지막 테스트: {p.lastTest}</div><div>다음 테스트: {p.nextTest}</div></div>
            </div>
          </div>
        ))}</div>
      )}
      {selectedPlan && (
        <div className="modal-overlay active" onClick={() => setSelectedPlan(null)}><div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedPlan.type)} {selectedPlan.name}</h3><button className="modal-close" onClick={() => setSelectedPlan(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedPlan.status)}20`, color: getStatusColor(selectedPlan.status), borderRadius: 6 }}>{selectedPlan.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedPlan.type}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}><div><b>Primary:</b> {selectedPlan.primaryRegion}</div><div><b>DR Site:</b> {selectedPlan.drRegion}</div><div><b>RTO:</b> {selectedPlan.rto}</div><div><b>RPO:</b> {selectedPlan.rpo}</div><div><b>마지막 테스트:</b> {selectedPlan.lastTest}</div><div><b>다음 테스트:</b> {selectedPlan.nextTest}</div></div>
            <div style={{ marginBottom: 8 }}><b>포함 서비스:</b></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{selectedPlan.services.map(s => <span key={s} style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.85rem' }}>{s}</span>)}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={() => handleTest(selectedPlan)}>🧪 테스트</button>{selectedPlan.status === 'ACTIVE' && <button className="btn btn-secondary" style={{ color: '#ef4444' }} onClick={() => handleFailover(selectedPlan)}>🚨 Failover</button>}{selectedPlan.status !== 'ACTIVE' && <button className="btn btn-secondary" onClick={() => handleActivate(selectedPlan)}>✅ 활성화</button>}<button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedPlan.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedPlan(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🛡️ DR 계획 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">계획 이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="FAILOVER">Failover</option><option value="BACKUP_RESTORE">Backup/Restore</option><option value="ACTIVE_ACTIVE">Active-Active</option><option value="PILOT_LIGHT">Pilot Light</option></select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div className="form-group"><label className="form-label">Primary Region</label><input className="form-input" value={form.primaryRegion} onChange={e => setForm({ ...form, primaryRegion: e.target.value })} /></div><div className="form-group"><label className="form-label">DR Region</label><input className="form-input" value={form.drRegion} onChange={e => setForm({ ...form, drRegion: e.target.value })} /></div><div className="form-group"><label className="form-label">RTO</label><input className="form-input" value={form.rto} onChange={e => setForm({ ...form, rto: e.target.value })} /></div><div className="form-group"><label className="form-label">RPO</label><input className="form-input" value={form.rpo} onChange={e => setForm({ ...form, rpo: e.target.value })} /></div></div>
            <div className="form-group"><label className="form-label">서비스 (쉼표 구분)</label><input className="form-input" value={form.services} onChange={e => setForm({ ...form, services: e.target.value })} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

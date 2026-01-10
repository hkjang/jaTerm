'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SLA {
  id: string;
  name: string;
  service: string;
  targetUptime: number;
  currentUptime: number;
  targetResponseTime: number;
  currentResponseTime: number;
  status: 'MEETING' | 'AT_RISK' | 'BREACHED';
  period: string;
  breachCount: number;
  errorBudget: number;
  errorBudgetUsed: number;
}

export default function SLAMonitoringPage() {
  const [slas, setSLAs] = useState<SLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSLA, setSelectedSLA] = useState<SLA | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', service: '', targetUptime: 99.9, targetResponseTime: 200, period: 'MONTHLY', errorBudget: 43.2 });

  useEffect(() => {
    const mock: SLA[] = [
      { id: '1', name: 'Production API', service: 'API Gateway', targetUptime: 99.95, currentUptime: 99.98, targetResponseTime: 200, currentResponseTime: 145, status: 'MEETING', period: 'MONTHLY', breachCount: 0, errorBudget: 21.6, errorBudgetUsed: 8.5 },
      { id: '2', name: 'Database', service: 'PostgreSQL', targetUptime: 99.99, currentUptime: 99.95, targetResponseTime: 50, currentResponseTime: 42, status: 'AT_RISK', period: 'MONTHLY', breachCount: 1, errorBudget: 4.3, errorBudgetUsed: 3.8 },
      { id: '3', name: 'CDN', service: 'CloudFlare', targetUptime: 99.9, currentUptime: 99.99, targetResponseTime: 100, currentResponseTime: 35, status: 'MEETING', period: 'MONTHLY', breachCount: 0, errorBudget: 43.2, errorBudgetUsed: 4.3 },
      { id: '4', name: 'Payment', service: 'Stripe', targetUptime: 99.99, currentUptime: 99.85, targetResponseTime: 500, currentResponseTime: 620, status: 'BREACHED', period: 'MONTHLY', breachCount: 3, errorBudget: 4.3, errorBudgetUsed: 6.5 },
      { id: '5', name: 'Auth', service: 'Auth0', targetUptime: 99.95, currentUptime: 99.97, targetResponseTime: 150, currentResponseTime: 120, status: 'MEETING', period: 'MONTHLY', breachCount: 0, errorBudget: 21.6, errorBudgetUsed: 12.9 },
    ];
    setSLAs(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newSLA: SLA = {
      id: String(slas.length + 1), name: formData.name, service: formData.service, targetUptime: formData.targetUptime, currentUptime: formData.targetUptime,
      targetResponseTime: formData.targetResponseTime, currentResponseTime: 0, status: 'MEETING', period: formData.period, breachCount: 0, errorBudget: formData.errorBudget, errorBudgetUsed: 0,
    };
    setSLAs([newSLA, ...slas]);
    setSuccess('SLA가 생성되었습니다.');
    setShowCreateModal(false);
    setFormData({ name: '', service: '', targetUptime: 99.9, targetResponseTime: 200, period: 'MONTHLY', errorBudget: 43.2 });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSLA) return;
    setSLAs(slas.map(s => s.id === selectedSLA.id ? { ...s, name: formData.name, service: formData.service, targetUptime: formData.targetUptime, targetResponseTime: formData.targetResponseTime, period: formData.period, errorBudget: formData.errorBudget } : s));
    setSuccess('SLA가 수정되었습니다.');
    setShowEditModal(false);
    setSelectedSLA(null);
  };

  const handleDelete = (id: string) => { if (confirm('삭제하시겠습니까?')) { setSLAs(slas.filter(s => s.id !== id)); setSuccess('삭제되었습니다.'); setSelectedSLA(null); } };

  const openEdit = (s: SLA) => {
    setSelectedSLA(s);
    setFormData({ name: s.name, service: s.service, targetUptime: s.targetUptime, targetResponseTime: s.targetResponseTime, period: s.period, errorBudget: s.errorBudget });
    setShowEditModal(true);
  };

  const getStatusStyle = (s: string) => ({ MEETING: '#10b981', AT_RISK: '#f59e0b', BREACHED: '#ef4444' }[s] || '#6b7280');
  const getStatusLabel = (s: string) => ({ MEETING: '✅ 충족', AT_RISK: '⚠️ 위험', BREACHED: '🚨 위반' }[s] || s);

  const filtered = slas.filter(s => (filterStatus === 'all' || s.status === filterStatus) && (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.service.toLowerCase().includes(searchQuery.toLowerCase())));
  const avgUptime = slas.length ? (slas.reduce((a, s) => a + s.currentUptime, 0) / slas.length).toFixed(2) : 0;

  return (
    <AdminLayout title="SLA 모니터링" description="Service Level Agreement 달성률 및 Error Budget 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ SLA 추가</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 SLA</div><div className="stat-value">{slas.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 충족</div><div className="stat-value" style={{ color: '#10b981' }}>{slas.filter(s => s.status === 'MEETING').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 위험</div><div className="stat-value" style={{ color: '#f59e0b' }}>{slas.filter(s => s.status === 'AT_RISK').length}</div></div>
        <div className="stat-card"><div className="stat-label">🚨 위반</div><div className="stat-value" style={{ color: '#ef4444' }}>{slas.filter(s => s.status === 'BREACHED').length}</div></div>
        <div className="stat-card"><div className="stat-label">평균 Uptime</div><div className="stat-value">{avgUptime}%</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input type="text" className="form-input" placeholder="🔍 검색" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ maxWidth: 180 }} />
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 120 }}>
          <option value="all">전체</option><option value="MEETING">충족</option><option value="AT_RISK">위험</option><option value="BREACHED">위반</option>
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(sla => {
            const budgetPct = (sla.errorBudgetUsed / sla.errorBudget) * 100;
            return (
              <div key={sla.id} className="card" style={{ cursor: 'pointer', border: sla.status === 'BREACHED' ? '1px solid #ef4444' : sla.status === 'AT_RISK' ? '1px solid #f59e0b' : 'none' }} onClick={() => setSelectedSLA(sla)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div><div style={{ fontWeight: 600 }}>{sla.name}</div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{sla.service}</div></div>
                  <span style={{ padding: '4px 10px', background: `${getStatusStyle(sla.status)}20`, color: getStatusStyle(sla.status), borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, height: 'fit-content' }}>{getStatusLabel(sla.status)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                  <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Uptime</div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: sla.currentUptime >= sla.targetUptime ? '#10b981' : '#ef4444' }}>{sla.currentUptime}%</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>목표: {sla.targetUptime}%</div></div>
                  <div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Response</div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: sla.currentResponseTime <= sla.targetResponseTime ? '#10b981' : '#ef4444' }}>{sla.currentResponseTime}ms</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>목표: {sla.targetResponseTime}ms</div></div>
                </div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}><span>Error Budget</span><span style={{ color: budgetPct > 80 ? '#ef4444' : '#10b981' }}>{sla.errorBudgetUsed.toFixed(1)} / {sla.errorBudget.toFixed(1)}분</span></div>
                  <div style={{ height: 6, background: 'var(--color-bg-secondary)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 80 ? '#ef4444' : '#10b981', borderRadius: 3 }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSLA && !showEditModal && (
        <div className="modal-overlay active" onClick={() => setSelectedSLA(null)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">📊 {selectedSLA.name}</h3><button className="modal-close" onClick={() => setSelectedSLA(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusStyle(selectedSLA.status)}20`, color: getStatusStyle(selectedSLA.status), borderRadius: 6 }}>{getStatusLabel(selectedSLA.status)}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedSLA.period}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Uptime</div><div style={{ fontSize: '1.8rem', fontWeight: 700, color: selectedSLA.currentUptime >= selectedSLA.targetUptime ? '#10b981' : '#ef4444' }}>{selectedSLA.currentUptime}%</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Response</div><div style={{ fontSize: '1.8rem', fontWeight: 700, color: selectedSLA.currentResponseTime <= selectedSLA.targetResponseTime ? '#10b981' : '#ef4444' }}>{selectedSLA.currentResponseTime}ms</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div>서비스: <b>{selectedSLA.service}</b></div><div>위반: <b style={{ color: selectedSLA.breachCount > 0 ? '#ef4444' : 'inherit' }}>{selectedSLA.breachCount}회</b></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => openEdit(selectedSLA)}>✏️ 수정</button><button className="btn btn-ghost" onClick={() => setSelectedSLA(null)}>닫기</button></div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">➕ SLA 추가</h3><button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">서비스</label><input className="form-input" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">목표 Uptime (%)</label><input type="number" step="0.01" className="form-input" value={formData.targetUptime} onChange={e => setFormData({...formData, targetUptime: parseFloat(e.target.value)})} /></div>
                  <div className="form-group"><label className="form-label">목표 응답시간 (ms)</label><input type="number" className="form-input" value={formData.targetResponseTime} onChange={e => setFormData({...formData, targetResponseTime: parseInt(e.target.value)})} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">기간</label><select className="form-input" value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})}><option value="MONTHLY">월간</option><option value="QUARTERLY">분기</option><option value="YEARLY">연간</option></select></div>
                  <div className="form-group"><label className="form-label">Error Budget (분)</label><input type="number" step="0.1" className="form-input" value={formData.errorBudget} onChange={e => setFormData({...formData, errorBudget: parseFloat(e.target.value)})} /></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedSLA && (
        <div className="modal-overlay active" onClick={() => { setShowEditModal(false); setSelectedSLA(null); }}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">✏️ 수정 - {selectedSLA.name}</h3><button className="modal-close" onClick={() => { setShowEditModal(false); setSelectedSLA(null); }}>×</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">서비스</label><input className="form-input" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">목표 Uptime (%)</label><input type="number" step="0.01" className="form-input" value={formData.targetUptime} onChange={e => setFormData({...formData, targetUptime: parseFloat(e.target.value)})} /></div>
                  <div className="form-group"><label className="form-label">목표 응답시간 (ms)</label><input type="number" className="form-input" value={formData.targetResponseTime} onChange={e => setFormData({...formData, targetResponseTime: parseInt(e.target.value)})} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">기간</label><select className="form-input" value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})}><option value="MONTHLY">월간</option><option value="QUARTERLY">분기</option><option value="YEARLY">연간</option></select></div>
                  <div className="form-group"><label className="form-label">Error Budget (분)</label><input type="number" step="0.1" className="form-input" value={formData.errorBudget} onChange={e => setFormData({...formData, errorBudget: parseFloat(e.target.value)})} /></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedSLA.id)}>🗑️</button><div style={{ flex: 1 }} /><button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedSLA(null); }}>취소</button><button type="submit" className="btn btn-primary">저장</button></div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

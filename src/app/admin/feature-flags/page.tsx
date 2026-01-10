'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Feature {
  id: string;
  name: string;
  key: string;
  description: string;
  status: 'ENABLED' | 'DISABLED' | 'PARTIAL';
  environment: string[];
  rolloutPercent: number;
  targetUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editFeature, setEditFeature] = useState<Feature | null>(null);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', key: '', description: '', rolloutPercent: 0, environments: ['DEVELOPMENT'] });

  useEffect(() => {
    setFeatures([
      { id: '1', name: '새 대시보드 UI', key: 'new_dashboard_ui', description: '개선된 대시보드 인터페이스', status: 'PARTIAL', environment: ['PRODUCTION', 'STAGING'], rolloutPercent: 25, targetUsers: ['beta-testers'], createdAt: '2026-01-05', updatedAt: '2026-01-10 14:00' },
      { id: '2', name: '다크 모드', key: 'dark_mode', description: '다크 테마 지원', status: 'ENABLED', environment: ['PRODUCTION', 'STAGING', 'DEVELOPMENT'], rolloutPercent: 100, targetUsers: [], createdAt: '2025-12-01', updatedAt: '2026-01-08 10:30' },
      { id: '3', name: '실시간 알림', key: 'realtime_notifications', description: 'WebSocket 기반 실시간 알림', status: 'PARTIAL', environment: ['STAGING', 'DEVELOPMENT'], rolloutPercent: 50, targetUsers: ['internal'], createdAt: '2026-01-02', updatedAt: '2026-01-09 16:00' },
      { id: '4', name: 'AI 자동완성', key: 'ai_autocomplete', description: 'AI 기반 명령어 자동완성', status: 'DISABLED', environment: ['DEVELOPMENT'], rolloutPercent: 0, targetUsers: ['developers'], createdAt: '2026-01-08', updatedAt: '2026-01-08 14:00' },
      { id: '5', name: '멀티 세션', key: 'multi_session', description: '동시 다중 터미널 세션', status: 'ENABLED', environment: ['PRODUCTION', 'STAGING', 'DEVELOPMENT'], rolloutPercent: 100, targetUsers: [], createdAt: '2025-11-15', updatedAt: '2025-12-20 12:00' },
      { id: '6', name: '2FA 강제', key: 'force_2fa', description: '2단계 인증 필수화', status: 'PARTIAL', environment: ['PRODUCTION'], rolloutPercent: 10, targetUsers: ['admin'], createdAt: '2026-01-09', updatedAt: '2026-01-10 09:00' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setFeatures([{ id: String(Date.now()), name: form.name, key: form.key, description: form.description, status: form.rolloutPercent === 0 ? 'DISABLED' : form.rolloutPercent === 100 ? 'ENABLED' : 'PARTIAL', environment: form.environments, rolloutPercent: form.rolloutPercent, targetUsers: [], createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }, ...features]); setSuccess('기능 플래그 생성됨'); setShowCreate(false); setForm({ name: '', key: '', description: '', rolloutPercent: 0, environments: ['DEVELOPMENT'] }); };
  const handleToggle = (f: Feature) => { const newStatus = f.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'; const newPercent = newStatus === 'ENABLED' ? 100 : 0; setFeatures(features.map(feat => feat.id === f.id ? { ...feat, status: newStatus, rolloutPercent: newPercent } : feat)); setSuccess(`${f.name} ${newStatus === 'ENABLED' ? '활성화' : '비활성화'}됨`); };
  const handleRollout = (f: Feature, percent: number) => { const status = percent === 0 ? 'DISABLED' : percent === 100 ? 'ENABLED' : 'PARTIAL'; setFeatures(features.map(feat => feat.id === f.id ? { ...feat, rolloutPercent: percent, status } : feat)); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setFeatures(features.filter(f => f.id !== id)); setSuccess('삭제됨'); setEditFeature(null); } };

  const getStatusColor = (s: string) => ({ ENABLED: '#10b981', DISABLED: '#6b7280', PARTIAL: '#f59e0b' }[s] || '#6b7280');

  return (
    <AdminLayout title="기능 플래그" description="기능 토글 및 A/B 테스트 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 플래그</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{features.filter(f => f.status === 'ENABLED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🟡 부분</div><div className="stat-value" style={{ color: '#f59e0b' }}>{features.filter(f => f.status === 'PARTIAL').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚪ 비활성</div><div className="stat-value" style={{ color: '#6b7280' }}>{features.filter(f => f.status === 'DISABLED').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {features.map(f => (
            <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
              <button className="btn btn-ghost" style={{ fontSize: '1.5rem', padding: 8 }} onClick={() => handleToggle(f)}>{f.status === 'ENABLED' ? '🟢' : f.status === 'PARTIAL' ? '🟡' : '⚪'}</button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 700 }}>{f.name}</span><code style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{f.key}</code></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{f.description}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>{f.environment.map(e => <span key={e} style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.7rem' }}>{e}</span>)}</div>
              </div>
              <div style={{ width: 150 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}><span>롤아웃</span><span style={{ color: getStatusColor(f.status) }}>{f.rolloutPercent}%</span></div>
                <input type="range" min={0} max={100} step={5} value={f.rolloutPercent} onChange={e => handleRollout(f, parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}><button className="btn btn-ghost btn-sm" onClick={() => setEditFeature(f)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(f.id)}>🗑️</button></div>
            </div>
          ))}
        </div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🚩 기능 플래그 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">키</label><input className="form-input" value={form.key} onChange={e => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="feature_key" required /></div>
            <div className="form-group"><label className="form-label">설명</label><textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="form-group"><label className="form-label">롤아웃 (%)</label><input type="range" min={0} max={100} step={5} value={form.rolloutPercent} onChange={e => setForm({ ...form, rolloutPercent: parseInt(e.target.value) })} style={{ width: '100%' }} /><div style={{ textAlign: 'center' }}>{form.rolloutPercent}%</div></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
      {editFeature && (
        <div className="modal-overlay active" onClick={() => setEditFeature(null)}><div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">✏️ {editFeature.name}</h3><button className="modal-close" onClick={() => setEditFeature(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ marginBottom: 16 }}><code style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4 }}>{editFeature.key}</code></div>
            <p style={{ marginBottom: 16 }}>{editFeature.description}</p>
            <div style={{ marginBottom: 16 }}><b>대상 사용자:</b> {editFeature.targetUsers.length > 0 ? editFeature.targetUsers.join(', ') : '전체'}</div>
            <div><b>생성:</b> {editFeature.createdAt} · <b>수정:</b> {editFeature.updatedAt}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(editFeature.id)}>🗑️ 삭제</button><button className="btn btn-ghost" onClick={() => setEditFeature(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

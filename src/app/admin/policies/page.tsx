'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Policy {
  id: string;
  name: string;
  description: string;
  type: 'TIME' | 'IP' | 'COMMAND' | 'MFA' | 'ROLE';
  status: 'ACTIVE' | 'DISABLED' | 'TESTING';
  priority: number;
  targets: string[];
  conditions: Record<string, unknown>;
  actions: string[];
  createdAt: string;
  updatedAt: string;
}

const initialPolicies: Policy[] = [
  { id: '1', name: '업무시간 접근 제한', description: '운영 서버 업무시간(09-18시)만 접근', type: 'TIME', status: 'ACTIVE', priority: 1, targets: ['prod-*'], conditions: { hours: '09:00-18:00', days: [1,2,3,4,5] }, actions: ['ALLOW'], createdAt: '2025-06-01', updatedAt: '2026-01-05' },
  { id: '2', name: 'MFA 필수', description: '운영 서버 MFA 인증 필수', type: 'MFA', status: 'ACTIVE', priority: 2, targets: ['prod-*'], conditions: { require: true }, actions: ['REQUIRE_MFA'], createdAt: '2025-06-01', updatedAt: '2025-06-01' },
  { id: '3', name: '위험 명령 차단', description: 'rm -rf, shutdown 등 위험 명령 차단', type: 'COMMAND', status: 'ACTIVE', priority: 3, targets: ['*'], conditions: { blocked: ['rm -rf', 'shutdown', 'reboot', 'init 0'] }, actions: ['BLOCK', 'ALERT'], createdAt: '2025-01-15', updatedAt: '2026-01-10' },
  { id: '4', name: 'IP 화이트리스트', description: '허용된 IP에서만 접근', type: 'IP', status: 'ACTIVE', priority: 4, targets: ['prod-*'], conditions: { allowed: ['192.168.1.0/24', '10.0.0.0/8'] }, actions: ['ALLOW'], createdAt: '2025-03-01', updatedAt: '2025-12-20' },
  { id: '5', name: '개발자 역할 제한', description: '개발자는 개발/스테이징만 접근', type: 'ROLE', status: 'ACTIVE', priority: 5, targets: ['dev-*', 'staging-*'], conditions: { roles: ['DEVELOPER'] }, actions: ['ALLOW'], createdAt: '2025-06-01', updatedAt: '2025-06-01' },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', description: '', type: 'TIME', priority: 10, targets: '', status: 'ACTIVE' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newPolicy: Policy = { id: String(Date.now()), ...form, type: form.type as Policy['type'], status: form.status as Policy['status'], targets: form.targets.split(',').map(t => t.trim()).filter(Boolean), conditions: {}, actions: ['ALLOW'], createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
    setPolicies([newPolicy, ...policies]);
    setSuccess('정책 생성됨');
    setShowCreate(false);
    setForm({ name: '', description: '', type: 'TIME', priority: 10, targets: '', status: 'ACTIVE' });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    setPolicies(policies.map(p => p.id === selectedPolicy.id ? { ...p, ...form, type: form.type as Policy['type'], status: form.status as Policy['status'], targets: form.targets.split(',').map(t => t.trim()).filter(Boolean), updatedAt: new Date().toISOString().slice(0, 10) } : p));
    setSuccess('수정됨');
    setShowEdit(false);
    setSelectedPolicy(null);
  };

  const openEdit = (policy: Policy) => {
    setForm({ name: policy.name, description: policy.description, type: policy.type, priority: policy.priority, targets: policy.targets.join(', '), status: policy.status });
    setSelectedPolicy(policy);
    setShowEdit(true);
  };

  const handleToggle = (p: Policy) => {
    setPolicies(policies.map(pol => pol.id === p.id ? { ...pol, status: pol.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : pol));
    setSuccess(p.status === 'ACTIVE' ? '비활성화됨' : '활성화됨');
    setSelectedPolicy(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제?')) {
      setPolicies(policies.filter(p => p.id !== id));
      setSuccess('삭제됨');
      setSelectedPolicy(null);
    }
  };

  const getTypeIcon = (t: string) => ({ TIME: '⏰', IP: '🌐', COMMAND: '⌨️', MFA: '📱', ROLE: '🛡️' }[t] || '📋');
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', DISABLED: '#6b7280', TESTING: '#f59e0b' }[s] || '#6b7280');

  return (
    <AdminLayout title="접근 정책" description="서버 접근 제어 정책 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 정책</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{policies.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{policies.filter(p => p.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">⏸️ 비활성</div><div className="stat-value">{policies.filter(p => p.status === 'DISABLED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🧪 테스트</div><div className="stat-value" style={{ color: '#f59e0b' }}>{policies.filter(p => p.status === 'TESTING').length}</div></div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {policies.sort((a, b) => a.priority - b.priority).map(p => (
          <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedPolicy(p)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: '1.5rem' }}>{getTypeIcon(p.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ padding: '2px 6px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.7rem' }}>#{p.priority}</span>
                  <span style={{ padding: '2px 6px', background: `${getStatusColor(p.status)}20`, color: getStatusColor(p.status), borderRadius: 4, fontSize: '0.7rem' }}>{p.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{p.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>대상: {p.targets.join(', ')}</div>
              </div>
              <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(p)}>{p.status === 'ACTIVE' ? '⏸️' : '▶️'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedPolicy && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedPolicy(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedPolicy.type)} {selectedPolicy.name}</h3><button className="modal-close" onClick={() => setSelectedPolicy(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedPolicy.status)}20`, color: getStatusColor(selectedPolicy.status), borderRadius: 6 }}>{selectedPolicy.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedPolicy.type}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>우선순위 #{selectedPolicy.priority}</span></div>
            <div style={{ marginBottom: 16 }}>{selectedPolicy.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>대상:</b> {selectedPolicy.targets.join(', ')}</div><div><b>생성:</b> {selectedPolicy.createdAt}</div><div><b>수정:</b> {selectedPolicy.updatedAt}</div></div>
            <div style={{ marginTop: 16, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.85rem' }}><b>조건:</b> {JSON.stringify(selectedPolicy.conditions, null, 2)}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={() => handleToggle(selectedPolicy)}>{selectedPolicy.status === 'ACTIVE' ? '⏸️ 비활성화' : '▶️ 활성화'}</button><button className="btn btn-secondary" onClick={() => openEdit(selectedPolicy)}>✏️ 수정</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedPolicy.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedPolicy(null)}>닫기</button></div>
        </div></div>
      )}
      
      {(showCreate || showEdit) && (
        <div className="modal-overlay active" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedPolicy(null); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{showEdit ? '✏️ 정책 수정' : '📋 정책 생성'}</h3><button className="modal-close" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedPolicy(null); }}>×</button></div>
          <form onSubmit={showEdit ? handleEdit : handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">설명</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="TIME">시간</option><option value="IP">IP</option><option value="COMMAND">명령어</option><option value="MFA">MFA</option><option value="ROLE">역할</option></select></div>
              <div className="form-group"><label className="form-label">우선순위</label><input type="number" className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })} /></div>
              <div className="form-group"><label className="form-label">상태</label><select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">활성</option><option value="DISABLED">비활성</option><option value="TESTING">테스트</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">대상 (쉼표 구분)</label><input className="form-input" value={form.targets} onChange={e => setForm({ ...form, targets: e.target.value })} placeholder="prod-*, staging-*" /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedPolicy(null); }}>취소</button><button type="submit" className="btn btn-primary">{showEdit ? '저장' : '생성'}</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ChangeRequest {
  id: string;
  title: string;
  type: 'STANDARD' | 'NORMAL' | 'EMERGENCY' | 'MAJOR';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  requester: string;
  approvers: { name: string; status: string }[];
  scheduledDate: string;
  createdAt: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  rollbackPlan: string;
  affectedSystems: string[];
  description: string;
}

export default function ChangeManagementPage() {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState<ChangeRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ title: '', type: 'NORMAL', priority: 'MEDIUM', category: 'APPLICATION', riskLevel: 'MEDIUM', rollbackPlan: '', affectedSystems: '', description: '', scheduledDate: '' });

  useEffect(() => {
    const mock: ChangeRequest[] = [
      { id: 'CHG-001', title: 'Production DB Upgrade', type: 'MAJOR', status: 'PENDING_APPROVAL', priority: 'HIGH', category: 'DATABASE', requester: '김철수', approvers: [{ name: '박부장', status: 'APPROVED' }, { name: 'DBA팀장', status: 'PENDING' }], scheduledDate: '2026-01-15 02:00', createdAt: '2026-01-08', riskLevel: 'HIGH', rollbackPlan: '스냅샷 복원', affectedSystems: ['PostgreSQL', 'API'], description: 'DB 업그레이드' },
      { id: 'CHG-002', title: 'SSL Certificate Renewal', type: 'STANDARD', status: 'SCHEDULED', priority: 'MEDIUM', category: 'SECURITY', requester: '이영희', approvers: [{ name: '보안팀장', status: 'APPROVED' }], scheduledDate: '2026-01-12', createdAt: '2026-01-09', riskLevel: 'LOW', rollbackPlan: '이전 인증서', affectedSystems: ['LB', 'CDN'], description: 'SSL 갱신' },
      { id: 'CHG-003', title: 'K8s Node Addition', type: 'NORMAL', status: 'APPROVED', priority: 'MEDIUM', category: 'INFRASTRUCTURE', requester: '박민수', approvers: [{ name: 'DevOps팀장', status: 'APPROVED' }], scheduledDate: '2026-01-11', createdAt: '2026-01-07', riskLevel: 'MEDIUM', rollbackPlan: '노드 제거', affectedSystems: ['K8s'], description: '노드 추가' },
      { id: 'CHG-004', title: 'Security Patch', type: 'EMERGENCY', status: 'IN_PROGRESS', priority: 'CRITICAL', category: 'SECURITY', requester: '보안팀', approvers: [{ name: 'CISO', status: 'APPROVED' }], scheduledDate: '2026-01-10', createdAt: '2026-01-10', riskLevel: 'HIGH', rollbackPlan: '패치 롤백', affectedSystems: ['All'], description: '긴급 패치' },
      { id: 'CHG-005', title: 'API Rate Limit Update', type: 'STANDARD', status: 'COMPLETED', priority: 'LOW', category: 'NETWORK', requester: '최지훈', approvers: [{ name: 'API팀장', status: 'APPROVED' }], scheduledDate: '2026-01-09', createdAt: '2026-01-08', riskLevel: 'LOW', rollbackPlan: '설정 복원', affectedSystems: ['Gateway'], description: 'Rate limit 변경' },
    ];
    setChanges(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newChange: ChangeRequest = {
      id: `CHG-${String(changes.length + 1).padStart(3, '0')}`, title: formData.title, type: formData.type as ChangeRequest['type'], status: 'DRAFT',
      priority: formData.priority as ChangeRequest['priority'], category: formData.category, requester: '현재 사용자', approvers: [], scheduledDate: formData.scheduledDate || '-',
      createdAt: new Date().toISOString().split('T')[0], riskLevel: formData.riskLevel as ChangeRequest['riskLevel'], rollbackPlan: formData.rollbackPlan,
      affectedSystems: formData.affectedSystems.split(',').map(s => s.trim()).filter(Boolean), description: formData.description,
    };
    setChanges([newChange, ...changes]);
    setSuccess('생성되었습니다.');
    setShowCreateModal(false);
    setFormData({ title: '', type: 'NORMAL', priority: 'MEDIUM', category: 'APPLICATION', riskLevel: 'MEDIUM', rollbackPlan: '', affectedSystems: '', description: '', scheduledDate: '' });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChange) return;
    setChanges(changes.map(c => c.id === selectedChange.id ? { ...c, ...formData, affectedSystems: formData.affectedSystems.split(',').map(s => s.trim()).filter(Boolean) } as ChangeRequest : c));
    setSuccess('수정되었습니다.');
    setShowEditModal(false);
    setSelectedChange(null);
  };

  const handleDelete = (id: string) => { if (confirm('삭제하시겠습니까?')) { setChanges(changes.filter(c => c.id !== id)); setSuccess('삭제되었습니다.'); setSelectedChange(null); } };
  const handleApprove = (c: ChangeRequest) => { setChanges(changes.map(x => x.id === c.id ? { ...x, status: 'APPROVED' as const } : x)); setSuccess('승인되었습니다.'); };
  
  const openEdit = (c: ChangeRequest) => {
    setSelectedChange(c);
    setFormData({ title: c.title, type: c.type, priority: c.priority, category: c.category, riskLevel: c.riskLevel, rollbackPlan: c.rollbackPlan, affectedSystems: c.affectedSystems.join(', '), description: c.description, scheduledDate: c.scheduledDate });
    setShowEditModal(true);
  };

  const getTypeStyle = (t: string) => ({ STANDARD: '#6b7280', NORMAL: '#3b82f6', EMERGENCY: '#ef4444', MAJOR: '#8b5cf6' }[t] || '#6b7280');
  const getStatusStyle = (s: string) => ({ DRAFT: '#6b7280', PENDING_APPROVAL: '#f59e0b', APPROVED: '#10b981', SCHEDULED: '#3b82f6', IN_PROGRESS: '#8b5cf6', COMPLETED: '#10b981', FAILED: '#ef4444' }[s] || '#6b7280');
  const getRiskIcon = (r: string) => ({ LOW: '🟢', MEDIUM: '🟡', HIGH: '🔴' }[r] || '⚪');

  const filtered = changes.filter(c => (filterStatus === 'all' || c.status === filterStatus) && (!searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <AdminLayout title="변경 관리 (CAB)" description="Change Advisory Board" actions={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 변경 요청</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>❌ {error}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총</div><div className="stat-value">{changes.length}</div></div>
        <div className="stat-card"><div className="stat-label">⏳ 대기</div><div className="stat-value" style={{ color: '#f59e0b' }}>{changes.filter(c => c.status === 'PENDING_APPROVAL').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔄 진행</div><div className="stat-value" style={{ color: '#8b5cf6' }}>{changes.filter(c => c.status === 'IN_PROGRESS').length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 완료</div><div className="stat-value" style={{ color: '#10b981' }}>{changes.filter(c => c.status === 'COMPLETED').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{changes.filter(c => c.status === 'FAILED').length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input type="text" className="form-input" placeholder="🔍 검색" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ maxWidth: 180 }} />
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 130 }}>
          <option value="all">전체 상태</option><option value="DRAFT">초안</option><option value="PENDING_APPROVAL">승인대기</option><option value="APPROVED">승인됨</option><option value="COMPLETED">완료</option>
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>ID</th><th>제목</th><th>유형</th><th>상태</th><th>위험</th><th>작업</th></tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id}>
                <td><code>{c.id}</code></td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                <td><span style={{ padding: '3px 8px', background: `${getTypeStyle(c.type)}20`, color: getTypeStyle(c.type), borderRadius: 4, fontSize: '0.8rem' }}>{c.type}</span></td>
                <td><span style={{ padding: '3px 8px', background: `${getStatusStyle(c.status)}20`, color: getStatusStyle(c.status), borderRadius: 4, fontSize: '0.8rem' }}>{c.status}</span></td>
                <td>{getRiskIcon(c.riskLevel)}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => setSelectedChange(c)}>👁️</button><button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(c.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {selectedChange && !showEditModal && (
        <div className="modal-overlay active" onClick={() => setSelectedChange(null)}>
          <div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">📋 {selectedChange.id}</h3><button className="modal-close" onClick={() => setSelectedChange(null)}>×</button></div>
            <div className="modal-body">
              <h4>{selectedChange.title}</h4>
              <p style={{ color: 'var(--color-text-muted)' }}>{selectedChange.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>유형: <b>{selectedChange.type}</b></div><div>상태: <b>{selectedChange.status}</b></div>
                <div>위험: {getRiskIcon(selectedChange.riskLevel)} {selectedChange.riskLevel}</div><div>예정: {selectedChange.scheduledDate}</div>
              </div>
              <div style={{ marginTop: 12 }}>롤백: <b>{selectedChange.rollbackPlan}</b></div>
              <div style={{ marginTop: 12 }}>시스템: {selectedChange.affectedSystems.join(', ')}</div>
            </div>
            <div className="modal-footer">
              {selectedChange.status === 'PENDING_APPROVAL' && <button className="btn btn-primary" onClick={() => handleApprove(selectedChange)}>✅ 승인</button>}
              <button className="btn btn-secondary" onClick={() => openEdit(selectedChange)}>✏️</button>
              <button className="btn btn-ghost" onClick={() => setSelectedChange(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">📝 변경 요청</h3><button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">제목</label><input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="STANDARD">표준</option><option value="NORMAL">일반</option><option value="EMERGENCY">긴급</option><option value="MAJOR">대규모</option></select></div>
                  <div className="form-group"><label className="form-label">우선순위</label><select className="form-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}><option value="LOW">낮음</option><option value="MEDIUM">중간</option><option value="HIGH">높음</option><option value="CRITICAL">긴급</option></select></div>
                  <div className="form-group"><label className="form-label">위험</label><select className="form-input" value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value})}><option value="LOW">낮음</option><option value="MEDIUM">중간</option><option value="HIGH">높음</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">설명</label><textarea className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ minHeight: 60 }} /></div>
                <div className="form-group"><label className="form-label">영향 시스템</label><input className="form-input" value={formData.affectedSystems} onChange={e => setFormData({...formData, affectedSystems: e.target.value})} placeholder="쉼표 구분" /></div>
                <div className="form-group"><label className="form-label">롤백 계획</label><input className="form-input" value={formData.rollbackPlan} onChange={e => setFormData({...formData, rollbackPlan: e.target.value})} required /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedChange && (
        <div className="modal-overlay active" onClick={() => { setShowEditModal(false); setSelectedChange(null); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">✏️ 수정 - {selectedChange.id}</h3><button className="modal-close" onClick={() => { setShowEditModal(false); setSelectedChange(null); }}>×</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">제목</label><input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="STANDARD">표준</option><option value="NORMAL">일반</option><option value="EMERGENCY">긴급</option><option value="MAJOR">대규모</option></select></div>
                  <div className="form-group"><label className="form-label">우선순위</label><select className="form-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}><option value="LOW">낮음</option><option value="MEDIUM">중간</option><option value="HIGH">높음</option><option value="CRITICAL">긴급</option></select></div>
                  <div className="form-group"><label className="form-label">위험</label><select className="form-input" value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value})}><option value="LOW">낮음</option><option value="MEDIUM">중간</option><option value="HIGH">높음</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">설명</label><textarea className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ minHeight: 60 }} /></div>
                <div className="form-group"><label className="form-label">영향 시스템</label><input className="form-input" value={formData.affectedSystems} onChange={e => setFormData({...formData, affectedSystems: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">롤백 계획</label><input className="form-input" value={formData.rollbackPlan} onChange={e => setFormData({...formData, rollbackPlan: e.target.value})} required /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedChange.id)}>🗑️</button><div style={{ flex: 1 }} /><button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedChange(null); }}>취소</button><button type="submit" className="btn btn-primary">저장</button></div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'AUTH' | 'ALERT' | 'REPORT' | 'SYSTEM' | 'NOTIFICATION';
  status: 'ACTIVE' | 'DRAFT' | 'DISABLED';
  variables: string[];
  lastModified: string;
  sentCount: number;
  createdAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState({ name: '', subject: '', category: 'NOTIFICATION', body: '' });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setTemplates([
      { id: '1', name: 'welcome_email', subject: 'jaTerm에 오신 것을 환영합니다', category: 'AUTH', status: 'ACTIVE', variables: ['{{user_name}}', '{{company}}', '{{login_url}}'], lastModified: '2026-01-08', sentCount: 1520, createdAt: '2025-01-15' },
      { id: '2', name: 'password_reset', subject: '비밀번호 재설정 안내', category: 'AUTH', status: 'ACTIVE', variables: ['{{user_name}}', '{{reset_link}}', '{{expires_in}}'], lastModified: '2026-01-05', sentCount: 845, createdAt: '2025-01-15' },
      { id: '3', name: 'login_alert', subject: '새로운 로그인이 감지되었습니다', category: 'ALERT', status: 'ACTIVE', variables: ['{{user_name}}', '{{ip_address}}', '{{location}}', '{{time}}'], lastModified: '2026-01-10', sentCount: 12500, createdAt: '2025-02-01' },
      { id: '4', name: 'session_expiry', subject: '세션 만료 경고', category: 'NOTIFICATION', status: 'ACTIVE', variables: ['{{user_name}}', '{{session_id}}', '{{expires_at}}'], lastModified: '2026-01-03', sentCount: 3200, createdAt: '2025-03-20' },
      { id: '5', name: 'weekly_report', subject: '주간 활동 리포트', category: 'REPORT', status: 'ACTIVE', variables: ['{{user_name}}', '{{period}}', '{{stats}}'], lastModified: '2026-01-07', sentCount: 8450, createdAt: '2025-04-01' },
      { id: '6', name: 'emergency_access', subject: '🚨 긴급 접근 승인됨', category: 'ALERT', status: 'ACTIVE', variables: ['{{user_name}}', '{{server}}', '{{reason}}', '{{approver}}'], lastModified: '2026-01-09', sentCount: 45, createdAt: '2025-05-15' },
      { id: '7', name: 'mfa_enabled', subject: 'MFA가 활성화되었습니다', category: 'SYSTEM', status: 'ACTIVE', variables: ['{{user_name}}', '{{method}}'], lastModified: '2025-12-15', sentCount: 580, createdAt: '2025-06-01' },
      { id: '8', name: 'compliance_alert', subject: '컴플라이언스 위반 감지', category: 'ALERT', status: 'DRAFT', variables: ['{{policy}}', '{{violation}}', '{{user}}'], lastModified: '2026-01-02', sentCount: 0, createdAt: '2025-11-01' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setTemplates([{ id: String(Date.now()), name: form.name, subject: form.subject, category: form.category as EmailTemplate['category'], status: 'DRAFT', variables: form.body.match(/\{\{[^}]+\}\}/g) || [], lastModified: new Date().toISOString().slice(0, 10), sentCount: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...templates]); setSuccess('템플릿 생성됨'); setShowCreate(false); setForm({ name: '', subject: '', category: 'NOTIFICATION', body: '' }); };
  const handleUpdate = (e: React.FormEvent) => { e.preventDefault(); if (!selectedTemplate) return; setTemplates(templates.map(t => t.id === selectedTemplate.id ? { ...t, subject: form.subject, lastModified: new Date().toISOString().slice(0, 10) } : t)); setSuccess('템플릿 수정됨'); setEditing(false); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setTemplates(templates.filter(t => t.id !== id)); setSuccess('삭제됨'); setSelectedTemplate(null); } };
  const handleToggleStatus = (t: EmailTemplate) => { setTemplates(templates.map(temp => temp.id === t.id ? { ...temp, status: temp.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : temp)); setSuccess(`${t.name} ${t.status === 'ACTIVE' ? '비활성화' : '활성화'}됨`); };
  const handleDuplicate = (t: EmailTemplate) => { setTemplates([{ ...t, id: String(Date.now()), name: `${t.name}_copy`, status: 'DRAFT', sentCount: 0, createdAt: new Date().toISOString().slice(0, 10), lastModified: new Date().toISOString().slice(0, 10) }, ...templates]); setSuccess('복제됨'); };
  const handleTest = (t: EmailTemplate) => { setSuccess(`${t.name} 테스트 발송 중...`); };

  const getCategoryColor = (c: string) => ({ AUTH: '#6366f1', ALERT: '#ef4444', REPORT: '#10b981', SYSTEM: '#6b7280', NOTIFICATION: '#3b82f6' }[c] || '#6b7280');
  const getCategoryLabel = (c: string) => ({ AUTH: '인증', ALERT: '알림', REPORT: '리포트', SYSTEM: '시스템', NOTIFICATION: '알림' }[c] || c);
  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', DRAFT: '#f59e0b', DISABLED: '#6b7280' }[s] || '#6b7280');

  const filtered = templates.filter(t => (filterCategory === '' || t.category === filterCategory) && (search === '' || t.name.includes(search) || t.subject.includes(search)));

  return (
    <AdminLayout title="이메일 템플릿" description="시스템 이메일 템플릿 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 템플릿</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 템플릿</div><div className="stat-value">{templates.length}</div></div>
        <div className="stat-card"><div className="stat-label">🟢 활성</div><div className="stat-value" style={{ color: '#10b981' }}>{templates.filter(t => t.status === 'ACTIVE').length}</div></div>
        <div className="stat-card"><div className="stat-label">📧 총 발송</div><div className="stat-value">{templates.reduce((a, t) => a + t.sentCount, 0).toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">📝 초안</div><div className="stat-value" style={{ color: '#f59e0b' }}>{templates.filter(t => t.status === 'DRAFT').length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 템플릿 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: 150 }}><option value="">전체 카테고리</option><option value="AUTH">인증</option><option value="ALERT">알림</option><option value="REPORT">리포트</option><option value="SYSTEM">시스템</option><option value="NOTIFICATION">알림</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>템플릿</th><th>제목</th><th>카테고리</th><th>변수</th><th>발송</th><th>수정일</th><th>상태</th><th style={{ width: 120 }}>액션</th></tr></thead>
            <tbody>{filtered.map(t => (
              <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedTemplate(t); setEditing(false); }}>
                <td><code style={{ fontSize: '0.85rem' }}>{t.name}</code></td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                <td><span style={{ padding: '2px 8px', background: `${getCategoryColor(t.category)}20`, color: getCategoryColor(t.category), borderRadius: 4, fontSize: '0.75rem' }}>{getCategoryLabel(t.category)}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{t.variables.length}개</td>
                <td>{t.sentCount.toLocaleString()}</td>
                <td style={{ fontSize: '0.85rem' }}>{t.lastModified}</td>
                <td><span style={{ padding: '2px 8px', background: `${getStatusColor(t.status)}20`, color: getStatusColor(t.status), borderRadius: 4, fontSize: '0.75rem' }}>{t.status}</span></td>
                <td onClick={e => e.stopPropagation()}><button className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(t)}>{t.status === 'ACTIVE' ? '⏸️' : '▶️'}</button><button className="btn btn-ghost btn-sm" onClick={() => handleTest(t)}>📧</button><button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(t)}>📋</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedTemplate && !editing && (
        <div className="modal-overlay active" onClick={() => setSelectedTemplate(null)}><div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📧 {selectedTemplate.name}</h3><button className="modal-close" onClick={() => setSelectedTemplate(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedTemplate.status)}20`, color: getStatusColor(selectedTemplate.status), borderRadius: 6 }}>{selectedTemplate.status}</span><span style={{ padding: '4px 10px', background: `${getCategoryColor(selectedTemplate.category)}20`, color: getCategoryColor(selectedTemplate.category), borderRadius: 6 }}>{getCategoryLabel(selectedTemplate.category)}</span></div>
            <div style={{ marginBottom: 12 }}><b>제목:</b> {selectedTemplate.subject}</div>
            <div style={{ marginBottom: 12 }}><b>변수:</b></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>{selectedTemplate.variables.map(v => <code key={v} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.85rem' }}>{v}</code>)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>발송 횟수:</b> {selectedTemplate.sentCount.toLocaleString()}</div><div><b>수정일:</b> {selectedTemplate.lastModified}</div><div><b>생성일:</b> {selectedTemplate.createdAt}</div></div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { setEditing(true); setForm({ name: selectedTemplate.name, subject: selectedTemplate.subject, category: selectedTemplate.category, body: '' }); }}>✏️ 수정</button><button className="btn btn-secondary" onClick={() => handleTest(selectedTemplate)}>📧 테스트</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedTemplate.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedTemplate(null)}>닫기</button></div>
        </div></div>
      )}
      {selectedTemplate && editing && (
        <div className="modal-overlay active" onClick={() => setEditing(false)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">✏️ 템플릿 수정</h3><button className="modal-close" onClick={() => setEditing(false)}>×</button></div>
          <form onSubmit={handleUpdate}><div className="modal-body">
            <div className="form-group"><label className="form-label">제목</label><input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">변수 (읽기전용)</label><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{selectedTemplate.variables.map(v => <code key={v} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.85rem' }}>{v}</code>)}</div></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>취소</button><button type="submit" className="btn btn-primary">저장</button></div></form>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📧 템플릿 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">템플릿 이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: welcome_email" required /></div>
            <div className="form-group"><label className="form-label">카테고리</label><select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="AUTH">인증</option><option value="ALERT">알림</option><option value="REPORT">리포트</option><option value="SYSTEM">시스템</option><option value="NOTIFICATION">알림</option></select></div>
            <div className="form-group"><label className="form-label">제목</label><input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">본문 (변수 포함)</label><textarea className="form-input" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={5} placeholder="안녕하세요 {{user_name}}님..." /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

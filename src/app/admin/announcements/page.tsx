'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'MAINTENANCE' | 'UPDATE' | 'SECURITY';
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'EXPIRED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  target: 'ALL' | 'ADMINS' | 'DEVELOPERS' | 'SPECIFIC';
  scheduledAt: string | null;
  expiresAt: string | null;
  views: number;
  createdBy: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ title: '', content: '', type: 'INFO', priority: 'NORMAL', target: 'ALL', expiresAt: '' });

  useEffect(() => {
    setAnnouncements([
      { id: '1', title: '시스템 정기 점검 안내', content: '2026년 1월 15일 02:00-04:00 정기 점검이 예정되어 있습니다.', type: 'MAINTENANCE', status: 'PUBLISHED', priority: 'HIGH', target: 'ALL', scheduledAt: null, expiresAt: '2026-01-15', views: 450, createdBy: 'admin', createdAt: '2026-01-08' },
      { id: '2', title: 'v2.5.0 업데이트 출시', content: '새로운 기능이 추가되었습니다. 자세한 내용은 릴리즈 노트를 확인하세요.', type: 'UPDATE', status: 'PUBLISHED', priority: 'NORMAL', target: 'ALL', scheduledAt: null, expiresAt: null, views: 320, createdBy: 'product', createdAt: '2026-01-10' },
      { id: '3', title: '보안 패치 적용 완료', content: '최신 보안 패치가 적용되었습니다. 재로그인이 필요할 수 있습니다.', type: 'SECURITY', status: 'PUBLISHED', priority: 'CRITICAL', target: 'ALL', scheduledAt: null, expiresAt: '2026-01-12', views: 890, createdBy: 'security', createdAt: '2026-01-09' },
      { id: '4', title: '개발자 API 변경 안내', content: 'v3 API 엔드포인트가 변경됩니다. 마이그레이션 가이드를 참고하세요.', type: 'WARNING', status: 'SCHEDULED', priority: 'HIGH', target: 'DEVELOPERS', scheduledAt: '2026-01-11 09:00', expiresAt: '2026-02-01', views: 0, createdBy: 'devrel', createdAt: '2026-01-10' },
      { id: '5', title: '신규 기능 테스트 참여 요청', content: '베타 테스터를 모집합니다.', type: 'INFO', status: 'DRAFT', priority: 'LOW', target: 'ADMINS', scheduledAt: null, expiresAt: null, views: 0, createdBy: 'product', createdAt: '2026-01-10' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setAnnouncements([{ id: String(Date.now()), title: form.title, content: form.content, type: form.type as Announcement['type'], status: 'DRAFT', priority: form.priority as Announcement['priority'], target: form.target as Announcement['target'], scheduledAt: null, expiresAt: form.expiresAt || null, views: 0, createdBy: 'admin', createdAt: new Date().toISOString().slice(0, 10) }, ...announcements]); setSuccess('공지 생성됨'); setShowCreate(false); setForm({ title: '', content: '', type: 'INFO', priority: 'NORMAL', target: 'ALL', expiresAt: '' }); };
  const handlePublish = (a: Announcement) => { setAnnouncements(announcements.map(ann => ann.id === a.id ? { ...ann, status: 'PUBLISHED' } : ann)); setSuccess('게시됨'); setSelectedAnn(null); };
  const handleDelete = (id: string) => { if (confirm('삭제?')) { setAnnouncements(announcements.filter(a => a.id !== id)); setSuccess('삭제됨'); setSelectedAnn(null); } };

  const getTypeIcon = (t: string) => ({ INFO: 'ℹ️', WARNING: '⚠️', MAINTENANCE: '🔧', UPDATE: '🆕', SECURITY: '🔒' }[t] || '📢');
  const getTypeColor = (t: string) => ({ INFO: '#3b82f6', WARNING: '#f59e0b', MAINTENANCE: '#8b5cf6', UPDATE: '#10b981', SECURITY: '#ef4444' }[t] || '#6b7280');
  const getStatusColor = (s: string) => ({ PUBLISHED: '#10b981', DRAFT: '#6b7280', SCHEDULED: '#3b82f6', EXPIRED: '#9ca3af' }[s] || '#6b7280');
  const getPriorityColor = (p: string) => ({ LOW: '#6b7280', NORMAL: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444' }[p] || '#6b7280');

  return (
    <AdminLayout title="공지사항" description="시스템 공지 및 알림 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 공지</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 공지</div><div className="stat-value">{announcements.length}</div></div>
        <div className="stat-card"><div className="stat-label">📢 게시됨</div><div className="stat-value" style={{ color: '#10b981' }}>{announcements.filter(a => a.status === 'PUBLISHED').length}</div></div>
        <div className="stat-card"><div className="stat-label">📅 예약</div><div className="stat-value" style={{ color: '#3b82f6' }}>{announcements.filter(a => a.status === 'SCHEDULED').length}</div></div>
        <div className="stat-card"><div className="stat-label">총 조회</div><div className="stat-value">{announcements.reduce((a, ann) => a + ann.views, 0).toLocaleString()}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {announcements.map(a => (
            <div key={a.id} className="card" style={{ borderLeft: `4px solid ${getTypeColor(a.type)}`, cursor: 'pointer', opacity: a.status === 'EXPIRED' ? 0.6 : 1 }} onClick={() => setSelectedAnn(a)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ fontSize: '1.2rem' }}>{getTypeIcon(a.type)}</span><span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{a.title}</span><span style={{ padding: '2px 6px', background: `${getPriorityColor(a.priority)}20`, color: getPriorityColor(a.priority), borderRadius: 4, fontSize: '0.7rem' }}>{a.priority}</span></div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{a.content.slice(0, 100)}{a.content.length > 100 ? '...' : ''}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}><span>🎯 {a.target}</span><span>👁️ {a.views}</span>{a.expiresAt && <span>⏰ ~{a.expiresAt}</span>}</div>
                </div>
                <span style={{ padding: '4px 10px', background: `${getStatusColor(a.status)}20`, color: getStatusColor(a.status), borderRadius: 6, fontSize: '0.8rem' }}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedAnn && (
        <div className="modal-overlay active" onClick={() => setSelectedAnn(null)}><div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{getTypeIcon(selectedAnn.type)} {selectedAnn.title}</h3><button className="modal-close" onClick={() => setSelectedAnn(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getTypeColor(selectedAnn.type)}20`, color: getTypeColor(selectedAnn.type), borderRadius: 6 }}>{selectedAnn.type}</span><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedAnn.status)}20`, color: getStatusColor(selectedAnn.status), borderRadius: 6 }}>{selectedAnn.status}</span><span style={{ padding: '4px 10px', background: `${getPriorityColor(selectedAnn.priority)}20`, color: getPriorityColor(selectedAnn.priority), borderRadius: 6 }}>{selectedAnn.priority}</span></div>
            <div style={{ padding: 16, background: 'var(--color-bg-secondary)', borderRadius: 8, marginBottom: 16 }}>{selectedAnn.content}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><b>대상:</b> {selectedAnn.target}</div><div><b>조회:</b> {selectedAnn.views}</div>
              <div><b>작성자:</b> {selectedAnn.createdBy}</div><div><b>작성일:</b> {selectedAnn.createdAt}</div>
              {selectedAnn.scheduledAt && <div><b>예약:</b> {selectedAnn.scheduledAt}</div>}
              {selectedAnn.expiresAt && <div><b>만료:</b> {selectedAnn.expiresAt}</div>}
            </div>
          </div>
          <div className="modal-footer">{selectedAnn.status === 'DRAFT' && <button className="btn btn-primary" onClick={() => handlePublish(selectedAnn)}>📢 게시</button>}<button className="btn btn-secondary">✏️ 편집</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedAnn.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedAnn(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📢 공지 작성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">제목</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">내용</label><textarea className="form-input" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="INFO">정보</option><option value="WARNING">경고</option><option value="MAINTENANCE">점검</option><option value="UPDATE">업데이트</option><option value="SECURITY">보안</option></select></div>
              <div className="form-group"><label className="form-label">우선순위</label><select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="LOW">낮음</option><option value="NORMAL">보통</option><option value="HIGH">높음</option><option value="CRITICAL">긴급</option></select></div>
              <div className="form-group"><label className="form-label">대상</label><select className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}><option value="ALL">전체</option><option value="ADMINS">관리자</option><option value="DEVELOPERS">개발자</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">만료일 (선택)</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">저장 (초안)</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

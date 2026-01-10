'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'FAILED';
  lastTriggered?: string;
  successRate: number;
  secret?: string;
}

const initialWebhooks: Webhook[] = [
  { id: '1', name: 'Slack Alerts', url: 'https://hooks.slack.com/services/xxx', events: ['security.alert', 'session.start'], status: 'ACTIVE', lastTriggered: '2026-01-10 15:30', successRate: 99.5 },
  { id: '2', name: 'PagerDuty', url: 'https://events.pagerduty.com/v2/enqueue', events: ['security.critical'], status: 'ACTIVE', lastTriggered: '2026-01-09 10:00', successRate: 100 },
  { id: '3', name: 'Audit Log Export', url: 'https://siem.company.com/ingest', events: ['audit.*'], status: 'ACTIVE', lastTriggered: '2026-01-10 15:35', successRate: 98.2 },
  { id: '4', name: 'Legacy System', url: 'https://old.system.com/webhook', events: ['session.end'], status: 'FAILED', lastTriggered: '2026-01-08 12:00', successRate: 45.0 },
];

const allEvents = ['security.alert', 'security.critical', 'session.start', 'session.end', 'user.login', 'user.logout', 'audit.*', 'backup.complete'];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[], secret: '' });

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newWebhook: Webhook = { id: String(Date.now()), ...form, status: 'ACTIVE', successRate: 100 };
    setWebhooks([newWebhook, ...webhooks]);
    setSuccess('Webhook 생성됨');
    setShowCreate(false);
    setForm({ name: '', url: '', events: [], secret: '' });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebhook) return;
    setWebhooks(webhooks.map(w => w.id === selectedWebhook.id ? { ...w, ...form } : w));
    setSuccess('수정됨');
    setShowEdit(false);
    setSelectedWebhook(null);
  };

  const openEdit = (webhook: Webhook) => {
    setForm({ name: webhook.name, url: webhook.url, events: webhook.events, secret: webhook.secret || '' });
    setSelectedWebhook(webhook);
    setShowEdit(true);
  };

  const handleTest = (w: Webhook) => {
    setSuccess(`${w.name} 테스트 발송...`);
  };

  const handleToggle = (w: Webhook) => {
    setWebhooks(webhooks.map(wh => wh.id === w.id ? { ...wh, status: wh.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : wh));
    setSuccess(w.status === 'ACTIVE' ? '비활성화됨' : '활성화됨');
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제?')) {
      setWebhooks(webhooks.filter(w => w.id !== id));
      setSuccess('삭제됨');
      setSelectedWebhook(null);
    }
  };

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event]
    }));
  };

  const getStatusColor = (s: string) => ({ ACTIVE: '#10b981', INACTIVE: '#6b7280', FAILED: '#ef4444' }[s] || '#6b7280');

  return (
    <AdminLayout title="Webhooks" description="이벤트 웹훅 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Webhook</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>이름</th><th>URL</th><th>이벤트</th><th>성공률</th><th>마지막 호출</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>{webhooks.map(w => (
            <tr key={w.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedWebhook(w)}>
              <td style={{ fontWeight: 600 }}>{w.name}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</td>
              <td style={{ fontSize: '0.85rem' }}>{w.events.length}개</td>
              <td><span style={{ color: w.successRate > 90 ? '#10b981' : w.successRate > 70 ? '#f59e0b' : '#ef4444' }}>{w.successRate}%</span></td>
              <td style={{ fontSize: '0.85rem' }}>{w.lastTriggered || '-'}</td>
              <td><span style={{ padding: '2px 8px', background: `${getStatusColor(w.status)}20`, color: getStatusColor(w.status), borderRadius: 4, fontSize: '0.75rem' }}>{w.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleTest(w)}>🔔</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(w)}>{w.status === 'ACTIVE' ? '⏸️' : '▶️'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(w)}>✏️</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {selectedWebhook && !showEdit && (
        <div className="modal-overlay active" onClick={() => setSelectedWebhook(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🔗 {selectedWebhook.name}</h3><button className="modal-close" onClick={() => setSelectedWebhook(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedWebhook.status)}20`, color: getStatusColor(selectedWebhook.status), borderRadius: 6 }}>{selectedWebhook.status}</span><span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>{selectedWebhook.successRate}% 성공</span></div>
            <div style={{ marginBottom: 12 }}><b>URL:</b><div style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: 8, background: 'var(--color-bg-secondary)', borderRadius: 6, marginTop: 4, wordBreak: 'break-all' }}>{selectedWebhook.url}</div></div>
            <div style={{ marginBottom: 12 }}><b>이벤트:</b><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{selectedWebhook.events.map(e => <span key={e} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>{e}</span>)}</div></div>
            {selectedWebhook.lastTriggered && <div><b>마지막 호출:</b> {selectedWebhook.lastTriggered}</div>}
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => handleTest(selectedWebhook)}>🔔 테스트</button><button className="btn btn-secondary" onClick={() => openEdit(selectedWebhook)}>✏️ 수정</button><button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedWebhook.id)}>🗑️</button><button className="btn btn-ghost" onClick={() => setSelectedWebhook(null)}>닫기</button></div>
        </div></div>
      )}
      
      {(showCreate || showEdit) && (
        <div className="modal-overlay active" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedWebhook(null); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{showEdit ? '✏️ Webhook 수정' : '🔗 Webhook 생성'}</h3><button className="modal-close" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedWebhook(null); }}>×</button></div>
          <form onSubmit={showEdit ? handleEdit : handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">URL</label><input className="form-input" type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required placeholder="https://..." /></div>
            <div className="form-group"><label className="form-label">시크릿 (선택)</label><input className="form-input" type="password" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} placeholder="HMAC 서명용" /></div>
            <div className="form-group"><label className="form-label">이벤트</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {allEvents.map(e => (
                  <label key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.events.includes(e)} onChange={() => toggleEvent(e)} />
                    <span>{e}</span>
                  </label>
                ))}
              </div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setSelectedWebhook(null); }}>취소</button><button type="submit" className="btn btn-primary">{showEdit ? '저장' : '생성'}</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

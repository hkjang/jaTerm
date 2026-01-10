'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AuditLog {
  id: string;
  action: string;
  category: 'AUTH' | 'ACCESS' | 'ADMIN' | 'SECURITY';
  user: string;
  target: string;
  result: 'SUCCESS' | 'FAILED';
  ip: string;
  timestamp: string;
  details: string;
}

const initialLogs: AuditLog[] = [
  { id: '1', action: 'LOGIN_SUCCESS', category: 'AUTH', user: '김관리자', target: 'Auth Service', result: 'SUCCESS', ip: '192.168.1.100', timestamp: '2026-01-10 15:30:00', details: 'MFA 인증 완료' },
  { id: '2', action: 'SERVER_CONNECT', category: 'ACCESS', user: '이개발', target: 'prod-api-01', result: 'SUCCESS', ip: '192.168.1.101', timestamp: '2026-01-10 15:25:00', details: 'SSH 세션 시작' },
  { id: '3', action: 'USER_CREATED', category: 'ADMIN', user: '김관리자', target: '신규사용자', result: 'SUCCESS', ip: '192.168.1.100', timestamp: '2026-01-10 14:50:00', details: '개발자 역할 부여' },
  { id: '4', action: 'LOGIN_FAILED', category: 'AUTH', user: 'unknown', target: 'Auth Service', result: 'FAILED', ip: '203.0.113.50', timestamp: '2026-01-10 14:30:00', details: '잘못된 비밀번호 (3회차)' },
  { id: '5', action: 'COMMAND_BLOCKED', category: 'SECURITY', user: '박운영', target: 'prod-db-01', result: 'FAILED', ip: '192.168.1.102', timestamp: '2026-01-10 14:15:00', details: 'rm -rf 명령 차단' },
  { id: '6', action: 'POLICY_UPDATED', category: 'ADMIN', user: '김관리자', target: 'prod-policy', result: 'SUCCESS', ip: '192.168.1.100', timestamp: '2026-01-10 13:00:00', details: '시간 제한 변경' },
  { id: '7', action: 'KEY_ROTATED', category: 'SECURITY', user: 'System', target: 'aws-access-key', result: 'SUCCESS', ip: '127.0.0.1', timestamp: '2026-01-10 02:00:00', details: '자동 회전' },
];

export default function AuditPage() {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const getCategoryColor = (c: string) => ({ AUTH: '#3b82f6', ACCESS: '#10b981', ADMIN: '#8b5cf6', SECURITY: '#f59e0b' }[c] || '#6b7280');
  const getResultColor = (r: string) => ({ SUCCESS: '#10b981', FAILED: '#ef4444' }[r] || '#6b7280');

  const filtered = logs.filter(l => 
    (filterCategory === '' || l.category === filterCategory) &&
    (filterResult === '' || l.result === filterResult) &&
    (search === '' || l.user.includes(search) || l.target.includes(search) || l.action.includes(search))
  );

  const handleExport = () => {
    alert('감사 로그 CSV 내보내기');
  };

  return (
    <AdminLayout title="감사 로그" description="시스템 활동 추적" actions={<button className="btn btn-secondary" onClick={handleExport}>📥 내보내기</button>}>
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{logs.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 성공</div><div className="stat-value" style={{ color: '#10b981' }}>{logs.filter(l => l.result === 'SUCCESS').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{logs.filter(l => l.result === 'FAILED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🛡️ 보안</div><div className="stat-value">{logs.filter(l => l.category === 'SECURITY').length}</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: 120 }}>
          <option value="">전체</option><option value="AUTH">인증</option><option value="ACCESS">접근</option><option value="ADMIN">관리</option><option value="SECURITY">보안</option>
        </select>
        <select className="form-input" value={filterResult} onChange={e => setFilterResult(e.target.value)} style={{ width: 100 }}>
          <option value="">전체</option><option value="SUCCESS">성공</option><option value="FAILED">실패</option>
        </select>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>시간</th><th>액션</th><th>사용자</th><th>대상</th><th>IP</th><th>결과</th></tr></thead>
          <tbody>{filtered.map(l => (
            <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(l)}>
              <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ padding: '2px 6px', background: `${getCategoryColor(l.category)}20`, color: getCategoryColor(l.category), borderRadius: 4, fontSize: '0.7rem' }}>{l.category}</span><span style={{ fontSize: '0.85rem' }}>{l.action}</span></div></td>
              <td style={{ fontWeight: 500 }}>{l.user}</td>
              <td style={{ fontSize: '0.85rem' }}>{l.target}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{l.ip}</td>
              <td><span style={{ padding: '2px 8px', background: `${getResultColor(l.result)}20`, color: getResultColor(l.result), borderRadius: 4, fontSize: '0.75rem' }}>{l.result}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {selectedLog && (
        <div className="modal-overlay active" onClick={() => setSelectedLog(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">📝 {selectedLog.action}</h3><button className="modal-close" onClick={() => setSelectedLog(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getResultColor(selectedLog.result)}20`, color: getResultColor(selectedLog.result), borderRadius: 6 }}>{selectedLog.result}</span><span style={{ padding: '4px 10px', background: `${getCategoryColor(selectedLog.category)}20`, color: getCategoryColor(selectedLog.category), borderRadius: 6 }}>{selectedLog.category}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>사용자:</b> {selectedLog.user}</div><div><b>대상:</b> {selectedLog.target}</div><div><b>IP:</b> {selectedLog.ip}</div><div><b>시간:</b> {selectedLog.timestamp}</div></div>
            <div style={{ marginTop: 16, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 6 }}><b>상세:</b> {selectedLog.details}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setSelectedLog(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

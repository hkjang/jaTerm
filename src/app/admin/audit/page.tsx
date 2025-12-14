'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  hash?: string;
  timestamp: Date;
}

const mockAuditLogs: AuditLog[] = [
  { id: '1', userId: '1', userName: '홍길동', action: 'SESSION_START', resource: 'TerminalSession', resourceId: 'session-123', details: '서버 prod-web-01 접속', ipAddress: '192.168.1.100', hash: 'sha256:abc123', timestamp: new Date(Date.now() - 3600000) },
  { id: '2', userId: '1', userName: '홍길동', action: 'COMMAND_EXECUTE', resource: 'CommandLog', resourceId: 'cmd-456', details: 'ls -la /var/log', ipAddress: '192.168.1.100', hash: 'sha256:def456', timestamp: new Date(Date.now() - 3500000) },
  { id: '3', userId: '2', userName: '김철수', action: 'COMMAND_BLOCKED', resource: 'CommandLog', resourceId: 'cmd-789', details: 'rm -rf / 명령 차단됨', ipAddress: '192.168.1.101', hash: 'sha256:ghi789', timestamp: new Date(Date.now() - 7200000) },
  { id: '4', userId: '1', userName: '홍길동', action: 'SESSION_END', resource: 'TerminalSession', resourceId: 'session-120', details: '세션 정상 종료', ipAddress: '192.168.1.100', hash: 'sha256:jkl012', timestamp: new Date(Date.now() - 10800000) },
  { id: '5', userId: '3', userName: '이영희', action: 'LOGIN', resource: 'User', resourceId: 'user-3', details: 'MFA 인증 성공', ipAddress: '192.168.1.102', hash: 'sha256:mno345', timestamp: new Date(Date.now() - 14400000) },
];

export default function AuditPage() {
  const [logs] = useState(mockAuditLogs);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  const filteredLogs = logs.filter(log => !actionFilter || log.action === actionFilter);

  const getActionBadge = (action: string) => {
    if (action.includes('BLOCKED')) return 'badge-danger';
    if (action.includes('CREATE') || action.includes('START')) return 'badge-success';
    if (action.includes('UPDATE') || action.includes('EXECUTE')) return 'badge-info';
    if (action.includes('DELETE') || action.includes('END')) return 'badge-warning';
    return 'badge-info';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('SESSION')) return '📺';
    if (action.includes('COMMAND')) return '⌨️';
    if (action.includes('LOGIN')) return '🔐';
    if (action.includes('POLICY')) return '📋';
    if (action.includes('SERVER')) return '🖥️';
    return '📝';
  };

  return (
    <AdminLayout title="감사 로그" description="모든 시스템 활동 기록 및 검색"
      actions={<><button className="btn btn-secondary" onClick={() => setShowRetentionModal(true)}>⚙️ 보존 정책</button><button className="btn btn-secondary" style={{ marginLeft: '8px' }}>📥 내보내기</button></>}>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}><input type="text" className="form-input" placeholder="사용자, 명령어, IP 검색..." /></div>
          <select className="form-input form-select" style={{ width: '180px' }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">모든 액션</option><option value="SESSION_START">세션 시작</option><option value="SESSION_END">세션 종료</option><option value="COMMAND_EXECUTE">명령 실행</option><option value="COMMAND_BLOCKED">명령 차단</option><option value="LOGIN">로그인</option>
          </select>
          <select className="form-input form-select" style={{ width: '150px' }} value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="1d">최근 1일</option><option value="7d">최근 7일</option><option value="30d">최근 30일</option><option value="90d">최근 90일</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>시간</th><th>사용자</th><th>액션</th><th>상세</th><th>IP</th><th>검증</th></tr></thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{log.timestamp.toLocaleDateString()}<br />{log.timestamp.toLocaleTimeString()}</td>
                  <td><div style={{ fontWeight: 500 }}>{log.userName}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.userId}</div></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{getActionIcon(log.action)}</span><span className={`badge ${getActionBadge(log.action)}`}>{log.action}</span></div></td>
                  <td style={{ maxWidth: '300px' }}><div style={{ fontSize: '0.9rem' }}>{log.details}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.resource}: {log.resourceId}</div></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{log.ipAddress}</td>
                  <td>{log.hash ? <span style={{ color: 'var(--color-success)' }} title={log.hash}>✓ Hash 검증됨</span> : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        <div>총 {filteredLogs.length}개 항목</div>
        <div style={{ display: 'flex', gap: '8px' }}><button className="btn btn-ghost btn-sm" disabled>← 이전</button><button className="btn btn-ghost btn-sm">다음 →</button></div>
      </div>

      {/* Retention Policy Modal */}
      {showRetentionModal && (
        <div className="modal-overlay active" onClick={() => setShowRetentionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">보존 정책 설정</h3><button className="modal-close" onClick={() => setShowRetentionModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">로그 보존 기간</label><select className="form-input form-select"><option value="30">30일</option><option value="60">60일</option><option value="90">90일 (권장)</option><option value="180">180일</option><option value="365">365일</option></select></div>
              <div className="form-group"><label className="form-label">녹화 파일 보존</label><select className="form-input form-select"><option value="30">30일</option><option value="90">90일 (권장)</option><option value="180">180일</option></select></div>
              <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 만료 전 자동 아카이브</label></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowRetentionModal(false)}>취소</button><button className="btn btn-primary">저장</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

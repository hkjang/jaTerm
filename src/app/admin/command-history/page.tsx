'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CommandLog {
  id: string;
  timestamp: string;
  user: string;
  server: string;
  sessionId: string;
  command: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  exitCode?: number;
  duration?: string;
  output?: string;
  isSensitive: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export default function CommandHistoryPage() {
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<CommandLog | null>(null);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterResult, setFilterResult] = useState('');

  useEffect(() => {
    setLogs([
      { id: '1', timestamp: '2026-01-10 14:45:23', user: '김관리자', server: 'prod-db-01', sessionId: 'sess-a1b2c3', command: 'SELECT COUNT(*) FROM users;', result: 'SUCCESS', exitCode: 0, duration: '125ms', isSensitive: false, riskLevel: 'LOW' },
      { id: '2', timestamp: '2026-01-10 14:44:15', user: '김관리자', server: 'prod-db-01', sessionId: 'sess-a1b2c3', command: 'sudo systemctl restart postgresql', result: 'SUCCESS', exitCode: 0, duration: '3.2s', isSensitive: false, riskLevel: 'HIGH' },
      { id: '3', timestamp: '2026-01-10 14:42:00', user: '이개발', server: 'staging-api-01', sessionId: 'sess-d4e5f6', command: 'cat /etc/passwd', result: 'SUCCESS', exitCode: 0, duration: '50ms', isSensitive: true, riskLevel: 'MEDIUM' },
      { id: '4', timestamp: '2026-01-10 14:40:33', user: '박운영', server: 'prod-web-01', sessionId: 'sess-g7h8i9', command: 'rm -rf /tmp/cache/*', result: 'SUCCESS', exitCode: 0, duration: '1.5s', isSensitive: false, riskLevel: 'MEDIUM' },
      { id: '5', timestamp: '2026-01-10 14:38:10', user: '최시니어', server: 'prod-db-01', sessionId: 'sess-j0k1l2', command: 'DROP TABLE temp_logs;', result: 'DENIED', isSensitive: false, riskLevel: 'CRITICAL' },
      { id: '6', timestamp: '2026-01-10 14:35:45', user: '강테스트', server: 'dev-server-01', sessionId: 'sess-m3n4o5', command: 'npm run build', result: 'FAILURE', exitCode: 1, duration: '45s', output: 'Error: Module not found', isSensitive: false, riskLevel: 'LOW' },
      { id: '7', timestamp: '2026-01-10 14:33:20', user: '김관리자', server: 'prod-k8s-master', sessionId: 'sess-a1b2c3', command: 'kubectl delete pod api-pod-abc123', result: 'SUCCESS', exitCode: 0, duration: '2.1s', isSensitive: false, riskLevel: 'HIGH' },
      { id: '8', timestamp: '2026-01-10 14:30:00', user: '정보안', server: 'secure-bastion', sessionId: 'sess-p6q7r8', command: 'cat /var/log/auth.log | grep failed', result: 'SUCCESS', exitCode: 0, duration: '800ms', isSensitive: true, riskLevel: 'MEDIUM' },
    ]);
    setLoading(false);
  }, []);

  const handleExport = () => { alert('명령어 이력을 CSV로 내보냅니다'); };

  const getResultColor = (r: string) => ({ SUCCESS: '#10b981', FAILURE: '#f59e0b', DENIED: '#ef4444' }[r] || '#6b7280');
  const getRiskColor = (r: string) => ({ LOW: '#6b7280', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' }[r] || '#6b7280');

  const filtered = logs.filter(l => (filterRisk === '' || l.riskLevel === filterRisk) && (filterResult === '' || l.result === filterResult) && (search === '' || l.command.includes(search) || l.user.includes(search) || l.server.includes(search)));

  return (
    <AdminLayout title="명령어 이력" description="터미널 명령어 실행 이력 및 감사" actions={<button className="btn btn-secondary" onClick={handleExport}>📥 내보내기</button>}>
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체</div><div className="stat-value">{logs.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 성공</div><div className="stat-value" style={{ color: '#10b981' }}>{logs.filter(l => l.result === 'SUCCESS').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 실패</div><div className="stat-value" style={{ color: '#f59e0b' }}>{logs.filter(l => l.result === 'FAILURE').length}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 거부</div><div className="stat-value" style={{ color: '#ef4444' }}>{logs.filter(l => l.result === 'DENIED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 고위험</div><div className="stat-value" style={{ color: '#ef4444' }}>{logs.filter(l => l.riskLevel === 'HIGH' || l.riskLevel === 'CRITICAL').length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 명령어 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="form-input" value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ width: 120 }}><option value="">전체 위험도</option><option value="LOW">낮음</option><option value="MEDIUM">중간</option><option value="HIGH">높음</option><option value="CRITICAL">치명</option></select>
        <select className="form-input" value={filterResult} onChange={e => setFilterResult(e.target.value)} style={{ width: 100 }}><option value="">전체 결과</option><option value="SUCCESS">성공</option><option value="FAILURE">실패</option><option value="DENIED">거부</option></select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>시간</th><th>사용자</th><th>서버</th><th>명령어</th><th>위험도</th><th>결과</th><th>소요</th></tr></thead>
            <tbody>{filtered.map(l => (
              <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(l)}>
                <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                <td>{l.user}</td>
                <td style={{ fontSize: '0.85rem' }}>{l.server}</td>
                <td><code style={{ fontSize: '0.8rem', maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.isSensitive ? '******' : l.command}</code>{l.isSensitive && <span style={{ marginLeft: 4, color: '#f59e0b', fontSize: '0.75rem' }}>🔒</span>}</td>
                <td><span style={{ padding: '2px 8px', background: `${getRiskColor(l.riskLevel)}20`, color: getRiskColor(l.riskLevel), borderRadius: 4, fontSize: '0.75rem' }}>{l.riskLevel}</span></td>
                <td><span style={{ padding: '2px 8px', background: `${getResultColor(l.result)}20`, color: getResultColor(l.result), borderRadius: 4, fontSize: '0.75rem' }}>{l.result}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{l.duration || '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedLog && (
        <div className="modal-overlay active" onClick={() => setSelectedLog(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">⌨️ 명령어 상세</h3><button className="modal-close" onClick={() => setSelectedLog(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getResultColor(selectedLog.result)}20`, color: getResultColor(selectedLog.result), borderRadius: 6 }}>{selectedLog.result}</span><span style={{ padding: '4px 10px', background: `${getRiskColor(selectedLog.riskLevel)}20`, color: getRiskColor(selectedLog.riskLevel), borderRadius: 6 }}>{selectedLog.riskLevel}</span>{selectedLog.isSensitive && <span style={{ padding: '4px 10px', background: '#f59e0b20', color: '#f59e0b', borderRadius: 6 }}>🔒 민감</span>}</div>
            <div style={{ marginBottom: 12 }}><b>명령어:</b></div><code style={{ display: 'block', padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selectedLog.isSensitive ? '[민감 정보 마스킹됨]' : selectedLog.command}</code>
            {selectedLog.output && <><div style={{ marginTop: 12, marginBottom: 8 }}><b>출력:</b></div><pre style={{ padding: 12, background: '#1a1a1a', color: '#f0f0f0', borderRadius: 6, fontSize: '0.85rem', overflow: 'auto', maxHeight: 150 }}>{selectedLog.output}</pre></>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}><div><b>시간:</b> {selectedLog.timestamp}</div><div><b>사용자:</b> {selectedLog.user}</div><div><b>서버:</b> {selectedLog.server}</div><div><b>세션:</b> {selectedLog.sessionId}</div>{selectedLog.exitCode !== undefined && <div><b>종료 코드:</b> {selectedLog.exitCode}</div>}{selectedLog.duration && <div><b>소요 시간:</b> {selectedLog.duration}</div>}</div>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setSelectedLog(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

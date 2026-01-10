'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ComplianceCheck {
  id: string;
  name: string;
  framework: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS';
  category: string;
  status: 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_APPLICABLE';
  lastChecked: string;
  nextDue: string;
  evidence: number;
  description: string;
}

export default function ComplianceReportsPage() {
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheck | null>(null);

  useEffect(() => {
    setChecks([
      { id: '1', name: '접근 제어 정책', framework: 'SOC2', category: 'CC6.1', status: 'PASSED', lastChecked: '2026-01-10', nextDue: '2026-02-10', evidence: 5, description: '시스템 접근 권한이 적절히 제한되어 있음' },
      { id: '2', name: '암호화 키 관리', framework: 'SOC2', category: 'CC6.7', status: 'PASSED', lastChecked: '2026-01-09', nextDue: '2026-02-09', evidence: 3, description: '모든 암호화 키가 안전하게 관리됨' },
      { id: '3', name: '데이터 백업 절차', framework: 'ISO27001', category: 'A.12.3', status: 'PASSED', lastChecked: '2026-01-08', nextDue: '2026-02-08', evidence: 4, description: '정기적인 백업이 수행되고 있음' },
      { id: '4', name: '취약점 관리', framework: 'ISO27001', category: 'A.12.6', status: 'WARNING', lastChecked: '2026-01-07', nextDue: '2026-01-14', evidence: 2, description: '일부 시스템에 패치가 지연됨' },
      { id: '5', name: '데이터 주체 권리', framework: 'GDPR', category: 'Art.15-22', status: 'PASSED', lastChecked: '2026-01-05', nextDue: '2026-02-05', evidence: 6, description: '개인정보 열람/삭제 요청 절차 준수' },
      { id: '6', name: '데이터 이전 제한', framework: 'GDPR', category: 'Art.44-49', status: 'FAILED', lastChecked: '2026-01-03', nextDue: '2026-01-10', evidence: 0, description: 'EU 외 지역 이전 계약서 미비' },
      { id: '7', name: '접근 로그 감사', framework: 'HIPAA', category: '164.312(b)', status: 'PASSED', lastChecked: '2026-01-10', nextDue: '2026-02-10', evidence: 8, description: '모든 접근이 기록되고 있음' },
      { id: '8', name: '카드 데이터 암호화', framework: 'PCI-DSS', category: 'Req.3', status: 'NOT_APPLICABLE', lastChecked: '-', nextDue: '-', evidence: 0, description: '카드 데이터 미처리' },
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (s: string) => ({ PASSED: '#10b981', FAILED: '#ef4444', WARNING: '#f59e0b', NOT_APPLICABLE: '#6b7280' }[s] || '#6b7280');
  const getStatusLabel = (s: string) => ({ PASSED: '✅ 통과', FAILED: '❌ 실패', WARNING: '⚠️ 경고', NOT_APPLICABLE: '➖ 해당없음' }[s] || s);
  const getFrameworkColor = (f: string) => ({ SOC2: '#3b82f6', ISO27001: '#10b981', GDPR: '#8b5cf6', HIPAA: '#f59e0b', 'PCI-DSS': '#ef4444' }[f] || '#6b7280');

  const filtered = checks.filter(c => (selectedFramework === 'all' || c.framework === selectedFramework) && (selectedStatus === 'all' || c.status === selectedStatus));
  const passRate = Math.round((checks.filter(c => c.status === 'PASSED').length / checks.filter(c => c.status !== 'NOT_APPLICABLE').length) * 100);

  return (
    <AdminLayout title="컴플라이언스 리포트" description="규정 준수 현황 모니터링" actions={<button className="btn btn-primary">📥 리포트 내보내기</button>}>
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 항목</div><div className="stat-value">{checks.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 통과</div><div className="stat-value" style={{ color: '#10b981' }}>{checks.filter(c => c.status === 'PASSED').length}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ 경고</div><div className="stat-value" style={{ color: '#f59e0b' }}>{checks.filter(c => c.status === 'WARNING').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{checks.filter(c => c.status === 'FAILED').length}</div></div>
        <div className="stat-card"><div className="stat-label">준수율</div><div className="stat-value" style={{ color: passRate >= 90 ? '#10b981' : passRate >= 70 ? '#f59e0b' : '#ef4444' }}>{passRate}%</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI-DSS'].map(f => (
          <button key={f} className={`btn ${selectedFramework === f ? 'btn-primary' : 'btn-secondary'}`} style={{ background: selectedFramework === f ? getFrameworkColor(f) : undefined }} onClick={() => setSelectedFramework(selectedFramework === f ? 'all' : f)}>{f}</button>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}><select className="form-input" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ maxWidth: 150 }}><option value="all">전체 상태</option><option value="PASSED">통과</option><option value="FAILED">실패</option><option value="WARNING">경고</option></select></div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>항목</th><th>프레임워크</th><th>카테고리</th><th>상태</th><th>마지막 점검</th><th>다음 점검</th><th>증빙</th></tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCheck(c)}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td><span style={{ padding: '2px 8px', background: `${getFrameworkColor(c.framework)}20`, color: getFrameworkColor(c.framework), borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>{c.framework}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{c.category}</td>
                <td><span style={{ color: getStatusColor(c.status) }}>{getStatusLabel(c.status)}</span></td>
                <td>{c.lastChecked}</td>
                <td>{c.nextDue}</td>
                <td>{c.evidence > 0 && <span style={{ padding: '2px 8px', background: 'var(--color-bg-secondary)', borderRadius: 4, fontSize: '0.8rem' }}>📎 {c.evidence}</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selectedCheck && (
        <div className="modal-overlay active" onClick={() => setSelectedCheck(null)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{selectedCheck.name}</h3><button className="modal-close" onClick={() => setSelectedCheck(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getFrameworkColor(selectedCheck.framework)}20`, color: getFrameworkColor(selectedCheck.framework), borderRadius: 6 }}>{selectedCheck.framework}</span><span style={{ padding: '4px 10px', background: `${getStatusColor(selectedCheck.status)}20`, color: getStatusColor(selectedCheck.status), borderRadius: 6 }}>{getStatusLabel(selectedCheck.status)}</span></div>
            <p style={{ marginBottom: 16 }}>{selectedCheck.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><b>카테고리:</b> {selectedCheck.category}</div><div><b>증빙 수:</b> {selectedCheck.evidence}개</div>
              <div><b>마지막 점검:</b> {selectedCheck.lastChecked}</div><div><b>다음 점검:</b> {selectedCheck.nextDue}</div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary">📎 증빙 추가</button><button className="btn btn-ghost" onClick={() => setSelectedCheck(null)}>닫기</button></div>
        </div></div>
      )}
    </AdminLayout>
  );
}

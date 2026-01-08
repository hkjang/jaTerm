'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ComplianceReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  period: string;
  status: string;
  findings: number;
}

export default function CompliancePage() {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [error, setError] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const user = localStorage.getItem('user');
    if (!user) return {};
    try {
      const { id } = JSON.parse(user);
      return { 'Authorization': `Bearer ${id}` };
    } catch {
      return {};
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/compliance', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setReports(data.reports);
      setError('');
    } catch (err) {
      setError('리포트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const passCount = reports.filter(r => r.status === 'PASS').length;
  const warningCount = reports.filter(r => r.status === 'WARNING').length;
  const totalFindings = reports.reduce((a, r) => a + r.findings, 0);

  return (
    <AdminLayout title="컴플라이언스" description="규정 준수 및 감사 대응 관리"
      actions={<><button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>📦 증적 패키지</button><button className="btn btn-primary" style={{ marginLeft: '8px' }}>+ 리포트 생성</button></>}>
      
      {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>}
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">감사 리포트</div><div className="stat-value">{reports.length}</div></div>
        <div className="stat-card"><div className="stat-label">통과</div><div className="stat-value" style={{ color: 'var(--color-success)' }}>{passCount}</div></div>
        <div className="stat-card"><div className="stat-label">경고</div><div className="stat-value" style={{ color: 'var(--color-warning)' }}>{warningCount}</div></div>
        <div className="stat-card"><div className="stat-label">발견 사항</div><div className="stat-value">{totalFindings}</div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, var(--color-surface), var(--color-bg))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2rem' }}>👁️</div>
          <div>
            <div style={{ fontWeight: 600 }}>감사 계정 (Read Only)</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>감사 계정은 모든 로그와 기록을 조회할 수 있지만 수정/삭제 권한이 없습니다.</div>
          </div>
          <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}>🔑 감사 계정 초대</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>규정 매핑 현황</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[{ name: 'ISMS-P', coverage: 95, status: '인증 유효' }, { name: 'ISO 27001', coverage: 92, status: '인증 유효' }, { name: 'SOC 2 Type II', coverage: 88, status: '감사 예정' }].map(item => (
            <div key={item.name} style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontWeight: 500 }}>{item.name}</span><span className="badge badge-success">{item.status}</span></div>
              <div style={{ height: '8px', background: 'var(--color-bg)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${item.coverage}%`, background: 'var(--color-success)' }} /></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>충족률: {item.coverage}%</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><span className="spinner" style={{ width: '32px', height: '32px' }} /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}><h3 style={{ fontWeight: 600 }}>감사 리포트</h3></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>리포트</th><th>유형</th><th>기간</th><th>상태</th><th>발견사항</th><th>생성일</th><th>작업</th></tr></thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>리포트가 없습니다.</td></tr>
                ) : (
                  reports.map(report => (
                    <tr key={report.id}>
                      <td style={{ fontWeight: 500 }}>{report.name}</td>
                      <td><span className="badge badge-info">{report.type}</span></td>
                      <td>{report.period}</td>
                      <td><span className={`badge ${report.status === 'PASS' ? 'badge-success' : report.status === 'WARNING' ? 'badge-warning' : 'badge-danger'}`}>{report.status}</span></td>
                      <td>{report.findings}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{new Date(report.generatedAt).toLocaleDateString()}</td>
                      <td><button className="btn btn-ghost btn-sm">📥 다운로드</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="modal-overlay active" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">증적 패키지 생성</h3><button className="modal-close" onClick={() => setShowExportModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">기간</label><input type="month" className="form-input" /></div>
              <div className="form-group"><label className="form-label">포함 항목</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label><input type="checkbox" defaultChecked /> 감사 로그</label>
                  <label><input type="checkbox" defaultChecked /> 세션 기록</label>
                  <label><input type="checkbox" defaultChecked /> 정책 변경 이력</label>
                  <label><input type="checkbox" defaultChecked /> 접근 승인 기록</label>
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>취소</button><button className="btn btn-primary">📦 생성</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

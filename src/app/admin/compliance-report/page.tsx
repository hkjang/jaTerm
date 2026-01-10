'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ComplianceCheck {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_CHECKED';
  lastChecked: string;
  details?: string;
  remediation?: string;
}

interface ComplianceReport {
  id: string;
  standard: string;
  generatedAt: string;
  passRate: number;
  checks: ComplianceCheck[];
}

export default function ComplianceReportPage() {
  const [loading, setLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState('SOC2');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Mock compliance data
    const mockChecks: ComplianceCheck[] = [
      { id: '1', category: '접근 통제', name: 'MFA 적용률', description: '모든 사용자에게 MFA가 적용되어 있어야 합니다', status: 'PASS', lastChecked: new Date().toISOString(), details: '100% 사용자에게 MFA 적용 (25/25)' },
      { id: '2', category: '접근 통제', name: '비밀번호 정책', description: '최소 12자 이상, 복잡성 요구사항 충족', status: 'PASS', lastChecked: new Date().toISOString(), details: '정책 준수율 100%' },
      { id: '3', category: '접근 통제', name: '휴면 계정', description: '90일 이상 미접속 계정 비활성화', status: 'WARNING', lastChecked: new Date().toISOString(), details: '3개 계정이 60일 이상 미접속', remediation: '해당 계정 검토 및 비활성화 필요' },
      { id: '4', category: '세션 관리', name: '세션 타임아웃', description: '비활성 세션 자동 종료 (최대 30분)', status: 'PASS', lastChecked: new Date().toISOString() },
      { id: '5', category: '세션 관리', name: '세션 녹화', description: 'PROD 환경 세션 녹화 활성화', status: 'PASS', lastChecked: new Date().toISOString(), details: 'PROD 서버 100% 녹화 중' },
      { id: '6', category: '감사', name: '감사 로그 보관', description: '최소 1년간 감사 로그 보관', status: 'PASS', lastChecked: new Date().toISOString(), details: '현재 395일간 로그 보관 중' },
      { id: '7', category: '감사', name: '로그 무결성', description: '감사 로그 변조 방지', status: 'PASS', lastChecked: new Date().toISOString() },
      { id: '8', category: '네트워크', name: 'IP 화이트리스트', description: 'PROD 서버 IP 제한 설정', status: 'FAIL', lastChecked: new Date().toISOString(), details: 'prod-db-02 서버에 IP 제한 미설정', remediation: '해당 서버 IP 화이트리스트 설정 필요' },
      { id: '9', category: '네트워크', name: 'SSL/TLS', description: '모든 통신 암호화', status: 'PASS', lastChecked: new Date().toISOString() },
      { id: '10', category: '권한', name: '최소 권한 원칙', description: '과도한 권한 부여 없음', status: 'WARNING', lastChecked: new Date().toISOString(), details: '2명의 개발자에게 ADMIN 권한 부여됨', remediation: '권한 검토 및 조정 권장' },
    ];

    const passCount = mockChecks.filter(c => c.status === 'PASS').length;
    
    setReport({
      id: '1',
      standard: selectedStandard,
      generatedAt: new Date().toISOString(),
      passRate: Math.round((passCount / mockChecks.length) * 100),
      checks: mockChecks,
    });
    setLoading(false);
  }, [selectedStandard]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PASS': return { color: '#10b981', bg: '#10b98120', icon: '✅', label: '통과' };
      case 'FAIL': return { color: '#ef4444', bg: '#ef444420', icon: '❌', label: '실패' };
      case 'WARNING': return { color: '#f59e0b', bg: '#f59e0b20', icon: '⚠️', label: '경고' };
      case 'NOT_CHECKED': return { color: '#6b7280', bg: '#6b728020', icon: '⏳', label: '미검사' };
      default: return { color: '#6b7280', bg: '#6b728020', icon: '•', label: status };
    }
  };

  const categories = report ? [...new Set(report.checks.map(c => c.category))] : [];
  const passCount = report?.checks.filter(c => c.status === 'PASS').length || 0;
  const failCount = report?.checks.filter(c => c.status === 'FAIL').length || 0;
  const warningCount = report?.checks.filter(c => c.status === 'WARNING').length || 0;

  return (
    <AdminLayout 
      title="컴플라이언스 리포트" 
      description="보안 규정 준수 현황"
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select className="form-input form-select" style={{ width: '150px' }} value={selectedStandard} onChange={(e) => setSelectedStandard(e.target.value)}>
            <option value="SOC2">SOC 2</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="ISMS">ISMS</option>
            <option value="CUSTOM">사내 정책</option>
          </select>
          <button className="btn btn-primary">📄 PDF 내보내기</button>
        </div>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : report && (
        <>
          {/* Summary */}
          <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
              <div className="stat-label">준수율</div>
              <div className="stat-value" style={{ color: report.passRate >= 80 ? '#10b981' : report.passRate >= 60 ? '#f59e0b' : '#ef4444' }}>
                {report.passRate}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">통과</div>
              <div className="stat-value" style={{ color: '#10b981' }}>{passCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">경고</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>{warningCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">실패</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>{failCount}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 600 }}>{selectedStandard} 준수 현황</span>
              <span style={{ color: 'var(--color-text-muted)' }}>마지막 검사: {new Date(report.generatedAt).toLocaleString('ko-KR')}</span>
            </div>
            <div style={{ height: '12px', background: 'var(--color-surface)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(passCount / report.checks.length) * 100}%`, background: '#10b981', transition: 'width 0.3s' }} />
              <div style={{ width: `${(warningCount / report.checks.length) * 100}%`, background: '#f59e0b', transition: 'width 0.3s' }} />
              <div style={{ width: `${(failCount / report.checks.length) * 100}%`, background: '#ef4444', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Checks by Category */}
          {categories.map(category => (
            <div key={category} className="card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>📁 {category}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {report.checks.filter(c => c.category === category).map(check => {
                  const status = getStatusConfig(check.status);
                  const isExpanded = expandedCheck === check.id;
                  return (
                    <div key={check.id}>
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '12px', 
                          background: 'var(--color-surface)', 
                          borderRadius: '8px',
                          cursor: check.details || check.remediation ? 'pointer' : 'default',
                          borderLeft: `3px solid ${status.color}`,
                        }}
                        onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{status.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{check.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{check.description}</div>
                        </div>
                        <span style={{ padding: '4px 10px', background: status.bg, color: status.color, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {status.label}
                        </span>
                        {(check.details || check.remediation) && (
                          <span style={{ color: 'var(--color-text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                        )}
                      </div>
                      {isExpanded && (check.details || check.remediation) && (
                        <div style={{ marginLeft: '24px', marginTop: '8px', padding: '12px', background: 'var(--color-bg)', borderRadius: '6px', fontSize: '0.9rem' }}>
                          {check.details && <div style={{ marginBottom: '8px' }}>📊 {check.details}</div>}
                          {check.remediation && (
                            <div style={{ color: '#f59e0b' }}>
                              💡 조치 필요: {check.remediation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </AdminLayout>
  );
}

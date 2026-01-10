'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Certificate {
  id: string;
  name: string;
  type: 'TLS' | 'SSH_CA' | 'CLIENT' | 'CODE_SIGN' | 'INTERNAL';
  subject: { cn: string; o?: string; ou?: string };
  issuer: { cn: string; o?: string };
  serialNumber: string;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'REVOKED' | 'PENDING';
  validFrom: string;
  validTo: string;
  keySize: number;
  algorithm: 'RSA' | 'EC' | 'ED25519';
  domains?: string[];
  servers?: string[];
  fingerprint: { sha256: string; sha1: string };
  autoRenew: boolean;
  createdAt: string;
  lastChecked?: string;
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const mockCerts: Certificate[] = [
      { id: '1', name: 'prod-wildcard.example.com', type: 'TLS', subject: { cn: '*.example.com', o: 'Example Corp', ou: 'IT' }, issuer: { cn: "Let's Encrypt Authority X3", o: "Let's Encrypt" }, serialNumber: '04:1F:2B:3C:4D:5E:6F', status: 'VALID', validFrom: new Date(Date.now() - 200 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() + 65 * 24 * 3600000).toISOString(), keySize: 2048, algorithm: 'RSA', domains: ['*.example.com', 'example.com'], autoRenew: true, createdAt: new Date(Date.now() - 200 * 24 * 3600000).toISOString(), lastChecked: new Date(Date.now() - 2 * 3600000).toISOString(), fingerprint: { sha256: 'A1:B2:C3:D4:E5...', sha1: '1A:2B:3C:4D:5E...' } },
      { id: '2', name: 'api.example.com', type: 'TLS', subject: { cn: 'api.example.com', o: 'Example Corp' }, issuer: { cn: 'DigiCert SHA2', o: 'DigiCert Inc' }, serialNumber: '0A:1B:2C:3D:4E', status: 'EXPIRING', validFrom: new Date(Date.now() - 335 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() + 30 * 24 * 3600000).toISOString(), keySize: 4096, algorithm: 'RSA', domains: ['api.example.com', 'api2.example.com'], autoRenew: false, createdAt: new Date(Date.now() - 335 * 24 * 3600000).toISOString(), fingerprint: { sha256: 'B2:C3:D4:E5:F6...', sha1: '2B:3C:4D:5E:6F...' } },
      { id: '3', name: 'SSH Host CA', type: 'SSH_CA', subject: { cn: 'SSH Host CA', o: 'jaTerm' }, issuer: { cn: 'jaTerm Internal CA', o: 'jaTerm' }, serialNumber: 'CA:01:02:03', status: 'VALID', validFrom: new Date(Date.now() - 365 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() + 4 * 365 * 24 * 3600000).toISOString(), keySize: 4096, algorithm: 'RSA', servers: ['*'], autoRenew: false, createdAt: new Date(Date.now() - 365 * 24 * 3600000).toISOString(), fingerprint: { sha256: 'C3:D4:E5:F6:G7...', sha1: '3C:4D:5E:6F:7G...' } },
      { id: '4', name: 'SSH User CA', type: 'SSH_CA', subject: { cn: 'SSH User CA', o: 'jaTerm' }, issuer: { cn: 'jaTerm Internal CA', o: 'jaTerm' }, serialNumber: 'CA:04:05:06', status: 'VALID', validFrom: new Date(Date.now() - 300 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() + 4.2 * 365 * 24 * 3600000).toISOString(), keySize: 4096, algorithm: 'EC', autoRenew: false, createdAt: new Date(Date.now() - 300 * 24 * 3600000).toISOString(), fingerprint: { sha256: 'D4:E5:F6:G7:H8...', sha1: '4D:5E:6F:7G:8H...' } },
      { id: '5', name: 'old-staging.example.com', type: 'TLS', subject: { cn: 'staging.example.com' }, issuer: { cn: "Let's Encrypt", o: "Let's Encrypt" }, serialNumber: '05:06:07:08', status: 'EXPIRED', validFrom: new Date(Date.now() - 400 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() - 35 * 24 * 3600000).toISOString(), keySize: 2048, algorithm: 'RSA', domains: ['staging.example.com'], autoRenew: false, createdAt: new Date(Date.now() - 400 * 24 * 3600000).toISOString(), fingerprint: { sha256: 'E5:F6:G7:H8:I9...', sha1: '5E:6F:7G:8H:9I...' } },
      { id: '6', name: 'Client Auth Cert', type: 'CLIENT', subject: { cn: 'client-auth', o: 'Partner Corp' }, issuer: { cn: 'jaTerm Client CA', o: 'jaTerm' }, serialNumber: 'CL:01:02', status: 'REVOKED', validFrom: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() + 185 * 24 * 3600000).toISOString(), keySize: 2048, algorithm: 'RSA', autoRenew: false, createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), fingerprint: { sha256: 'F6:G7:H8:I9:J0...', sha1: '6F:7G:8H:9I:0J...' } },
      { id: '7', name: 'Code Signing Cert', type: 'CODE_SIGN', subject: { cn: 'jaTerm Build', o: 'jaTerm' }, issuer: { cn: 'DigiCert', o: 'DigiCert' }, serialNumber: 'CS:01:02', status: 'VALID', validFrom: new Date(Date.now() - 100 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() + 265 * 24 * 3600000).toISOString(), keySize: 4096, algorithm: 'RSA', autoRenew: true, createdAt: new Date(Date.now() - 100 * 24 * 3600000).toISOString(), fingerprint: { sha256: 'G7:H8:I9:J0:K1...', sha1: '7G:8H:9I:0J:1K...' } },
      { id: '8', name: 'Internal Wildcard', type: 'INTERNAL', subject: { cn: '*.internal.example.com', o: 'Example Corp' }, issuer: { cn: 'jaTerm Internal CA', o: 'jaTerm' }, serialNumber: 'IN:01:02', status: 'VALID', validFrom: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), validTo: new Date(Date.now() + 305 * 24 * 3600000).toISOString(), keySize: 2048, algorithm: 'EC', domains: ['*.internal.example.com'], autoRenew: true, createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), fingerprint: { sha256: 'H8:I9:J0:K1:L2...', sha1: '8H:9I:0J:1K:2L...' } },
    ];
    setCerts(mockCerts);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'TLS': return { color: '#10b981', label: 'TLS/SSL', icon: '🔒' };
      case 'SSH_CA': return { color: '#3b82f6', label: 'SSH CA', icon: '🔐' };
      case 'CLIENT': return { color: '#8b5cf6', label: '클라이언트', icon: '👤' };
      case 'CODE_SIGN': return { color: '#f59e0b', label: '코드 서명', icon: '✍️' };
      case 'INTERNAL': return { color: '#06b6d4', label: '내부', icon: '🏢' };
      default: return { color: '#6b7280', label: type, icon: '📜' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'VALID': return { color: '#10b981', label: '유효', icon: '✓' };
      case 'EXPIRING': return { color: '#f59e0b', label: '만료 임박', icon: '⚠️' };
      case 'EXPIRED': return { color: '#ef4444', label: '만료', icon: '✗' };
      case 'REVOKED': return { color: '#dc2626', label: '폐기', icon: '🚫' };
      case 'PENDING': return { color: '#6b7280', label: '대기', icon: '⏳' };
      default: return { color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.floor(diff / (24 * 3600000));
    if (days < 0) return { days: Math.abs(days), label: `${Math.abs(days)}일 전 만료`, expired: true };
    if (days === 0) return { days: 0, label: '오늘 만료', expired: false };
    return { days, label: `${days}일 남음`, expired: false };
  };

  const filteredCerts = certs.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.subject.cn.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const validCount = certs.filter(c => c.status === 'VALID').length;
  const expiringCount = certs.filter(c => c.status === 'EXPIRING').length;
  const expiredCount = certs.filter(c => c.status === 'EXPIRED').length;

  return (
    <AdminLayout 
      title="인증서 관리" 
      description="TLS/SSL 및 CA 인증서 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 인증서</div>
          <div className="stat-value">{certs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 유효</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{validCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ 만료 임박</div>
          <div className="stat-value" style={{ color: expiringCount > 0 ? '#f59e0b' : 'inherit' }}>{expiringCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✗ 만료</div>
          <div className="stat-value" style={{ color: expiredCount > 0 ? '#ef4444' : 'inherit' }}>{expiredCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔄 자동갱신</div>
          <div className="stat-value">{certs.filter(c => c.autoRenew).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 인증서 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '220px' }}
        />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="all">전체 유형</option>
          <option value="TLS">🔒 TLS/SSL</option>
          <option value="SSH_CA">🔐 SSH CA</option>
          <option value="CLIENT">👤 클라이언트</option>
          <option value="CODE_SIGN">✍️ 코드 서명</option>
          <option value="INTERNAL">🏢 내부</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'VALID', 'EXPIRING', 'EXPIRED'].map(status => (
            <button
              key={status}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? '전체' : getStatusConfig(status).label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={() => setShowUploadModal(true)}>📤 인증서 업로드</button>
        <button className="btn btn-primary">+ 요청 생성</button>
      </div>

      {/* Certificates List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>인증서</th>
                  <th>유형</th>
                  <th>발급자</th>
                  <th>상태</th>
                  <th>만료일</th>
                  <th>자동갱신</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map(cert => {
                  const typeConfig = getTypeConfig(cert.type);
                  const statusConfig = getStatusConfig(cert.status);
                  const remaining = getDaysRemaining(cert.validTo);
                  return (
                    <tr key={cert.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{typeConfig.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{cert.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cert.subject.cn}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.75rem' }}>{typeConfig.label}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{cert.issuer.cn}</div>
                        {cert.issuer.o && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{cert.issuer.o}</div>}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{statusConfig.icon} {statusConfig.label}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{new Date(cert.validTo).toLocaleDateString('ko-KR')}</div>
                        <div style={{ fontSize: '0.7rem', color: remaining.expired ? '#ef4444' : remaining.days < 30 ? '#f59e0b' : 'var(--color-text-muted)' }}>{remaining.label}</div>
                      </td>
                      <td>
                        <span style={{ color: cert.autoRenew ? '#10b981' : 'var(--color-text-muted)' }}>{cert.autoRenew ? '🔄 활성' : '-'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" title="상세" onClick={() => setSelectedCert(cert)}>👁️</button>
                          <button className="btn btn-ghost btn-sm" title="다운로드">📥</button>
                          {cert.status === 'EXPIRING' && <button className="btn btn-ghost btn-sm" title="갱신">🔄</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCert && (
        <div className="modal-overlay active" onClick={() => setSelectedCert(null)}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedCert.type).icon} 인증서 상세</h3>
              <button className="modal-close" onClick={() => setSelectedCert(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedCert.name}</span>
                  <span style={{ padding: '2px 8px', background: `${getStatusConfig(selectedCert.status).color}20`, color: getStatusConfig(selectedCert.status).color, borderRadius: '4px', fontSize: '0.8rem' }}>{getStatusConfig(selectedCert.status).icon} {getStatusConfig(selectedCert.status).label}</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Subject CN</div>
                  <div>{selectedCert.subject.cn}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>발급자</div>
                  <div>{selectedCert.issuer.cn}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>알고리즘</div>
                  <div>{selectedCert.algorithm} {selectedCert.keySize}bit</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>시리얼 번호</div>
                  <code style={{ fontSize: '0.8rem' }}>{selectedCert.serialNumber}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>유효 기간</div>
                  <div>{new Date(selectedCert.validFrom).toLocaleDateString('ko-KR')} ~ {new Date(selectedCert.validTo).toLocaleDateString('ko-KR')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>자동 갱신</div>
                  <div>{selectedCert.autoRenew ? '🔄 활성' : '비활성'}</div>
                </div>
              </div>
              
              {selectedCert.domains && selectedCert.domains.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>도메인 (SAN)</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedCert.domains.map(d => <span key={d} style={{ padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', fontSize: '0.8rem' }}>{d}</span>)}
                  </div>
                </div>
              )}
              
              <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>지문</div>
                <div style={{ fontSize: '0.75rem' }}>
                  <div><strong>SHA-256:</strong> <code>{selectedCert.fingerprint.sha256}</code></div>
                  <div><strong>SHA-1:</strong> <code>{selectedCert.fingerprint.sha1}</code></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">📥 다운로드</button>
              {selectedCert.status === 'VALID' && <button className="btn btn-danger">🚫 폐기</button>}
              <button className="btn btn-ghost" onClick={() => setSelectedCert(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay active" onClick={() => setShowUploadModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📤 인증서 업로드</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">인증서 이름</label>
                <input type="text" className="form-input" placeholder="예: api.example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">유형</label>
                <select className="form-input">
                  <option value="TLS">🔒 TLS/SSL</option>
                  <option value="CLIENT">👤 클라이언트</option>
                  <option value="INTERNAL">🏢 내부</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">인증서 파일 (PEM)</label>
                <div style={{ border: '2px dashed var(--color-border)', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📜</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>클릭하여 파일 선택 또는 드래그</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>.pem, .crt, .cer</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">개인키 파일 (선택)</label>
                <input type="file" className="form-input" accept=".pem,.key" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" />
                <span>자동 갱신 활성화</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowUploadModal(false)}>취소</button>
              <button className="btn btn-primary">업로드</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

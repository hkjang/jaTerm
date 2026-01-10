'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Image {
  id: string;
  name: string;
  tags: string[];
  size: string;
  layers: number;
  pushedAt: string;
  pushedBy: string;
  pullCount: number;
  scanStatus: 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_SCANNED';
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
}

export default function ContainerRegistryPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScan, setFilterScan] = useState('all');

  useEffect(() => {
    const mock: Image[] = [
      { id: '1', name: 'jaterm/api-server', tags: ['v2.3.1', 'latest', 'stable'], size: '245 MB', layers: 12, pushedAt: '2026-01-10 09:30', pushedBy: 'ci-bot', pullCount: 1520, scanStatus: 'PASSED', vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 } },
      { id: '2', name: 'jaterm/web-frontend', tags: ['v3.0.0', 'latest'], size: '89 MB', layers: 8, pushedAt: '2026-01-10 08:15', pushedBy: 'ci-bot', pullCount: 980, scanStatus: 'PASSED', vulnerabilities: { critical: 0, high: 1, medium: 3, low: 8 } },
      { id: '3', name: 'jaterm/worker', tags: ['v1.5.2'], size: '312 MB', layers: 15, pushedAt: '2026-01-09 22:00', pushedBy: 'deploy-admin', pullCount: 450, scanStatus: 'FAILED', vulnerabilities: { critical: 2, high: 5, medium: 12, low: 20 } },
      { id: '4', name: 'jaterm/ssh-proxy', tags: ['v2.0.0', 'latest', 'prod'], size: '156 MB', layers: 10, pushedAt: '2026-01-09 18:45', pushedBy: 'ci-bot', pullCount: 2100, scanStatus: 'PASSED', vulnerabilities: { critical: 0, high: 0, medium: 1, low: 3 } },
      { id: '5', name: 'jaterm/auth-service', tags: ['v1.8.0'], size: '198 MB', layers: 11, pushedAt: '2026-01-08 14:20', pushedBy: 'ci-bot', pullCount: 780, scanStatus: 'PENDING', vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 } },
      { id: '6', name: 'jaterm/metrics-collector', tags: ['v1.2.0', 'beta'], size: '125 MB', layers: 9, pushedAt: '2026-01-07 10:00', pushedBy: 'dev-user', pullCount: 120, scanStatus: 'NOT_SCANNED', vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 } },
    ];
    setImages(mock);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleScan = (img: Image) => { setImages(images.map(i => i.id === img.id ? { ...i, scanStatus: 'PENDING' } : i)); setSuccess(`${img.name} 스캔 시작`); setTimeout(() => { setImages(prev => prev.map(i => i.id === img.id ? { ...i, scanStatus: 'PASSED', vulnerabilities: { critical: 0, high: Math.floor(Math.random() * 2), medium: Math.floor(Math.random() * 5), low: Math.floor(Math.random() * 10) } } : i)); setSuccess(`${img.name} 스캔 완료`); }, 3000); };
  const handleDelete = (id: string) => { if (confirm('삭제하시겠습니까?')) { setImages(images.filter(i => i.id !== id)); setSuccess('삭제되었습니다.'); setSelectedImage(null); } };

  const getScanStyle = (s: string) => ({ PASSED: '#10b981', FAILED: '#ef4444', PENDING: '#f59e0b', NOT_SCANNED: '#6b7280' }[s] || '#6b7280');
  const getScanLabel = (s: string) => ({ PASSED: '✅ 통과', FAILED: '❌ 실패', PENDING: '⏳ 스캔중', NOT_SCANNED: '⚫ 미스캔' }[s] || s);

  const filtered = images.filter(i => (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase())) && (filterScan === 'all' || i.scanStatus === filterScan));
  const totalVulns = images.reduce((a, i) => a + i.vulnerabilities.critical + i.vulnerabilities.high, 0);

  return (
    <AdminLayout title="컨테이너 레지스트리" description="Docker 이미지 저장소 관리" actions={<button className="btn btn-primary" onClick={() => setShowPushModal(true)}>📤 Push 가이드</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 이미지</div><div className="stat-value">{images.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ 스캔 통과</div><div className="stat-value" style={{ color: '#10b981' }}>{images.filter(i => i.scanStatus === 'PASSED').length}</div></div>
        <div className="stat-card"><div className="stat-label">❌ 스캔 실패</div><div className="stat-value" style={{ color: '#ef4444' }}>{images.filter(i => i.scanStatus === 'FAILED').length}</div></div>
        <div className="stat-card"><div className="stat-label">🔴 Critical/High</div><div className="stat-value" style={{ color: totalVulns > 0 ? '#ef4444' : '#10b981' }}>{totalVulns}</div></div>
        <div className="stat-card"><div className="stat-label">📥 총 Pull</div><div className="stat-value">{images.reduce((a, i) => a + i.pullCount, 0).toLocaleString()}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 이미지 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ maxWidth: 250 }} />
        <select className="form-input" value={filterScan} onChange={e => setFilterScan(e.target.value)} style={{ maxWidth: 130 }}><option value="all">전체 상태</option><option value="PASSED">통과</option><option value="FAILED">실패</option><option value="PENDING">스캔중</option><option value="NOT_SCANNED">미스캔</option></select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table"><thead><tr><th>이미지</th><th>태그</th><th>크기</th><th>스캔</th><th>취약점</th><th>Pull</th><th>푸시일</th><th>작업</th></tr></thead>
            <tbody>{filtered.map(img => (
              <tr key={img.id}>
                <td><div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{img.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{img.layers} layers</div></td>
                <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{img.tags.slice(0, 3).map((t, i) => <span key={i} style={{ padding: '2px 6px', background: t === 'latest' ? '#3b82f620' : 'var(--color-bg-secondary)', color: t === 'latest' ? '#3b82f6' : 'inherit', borderRadius: 4, fontSize: '0.75rem' }}>{t}</span>)}{img.tags.length > 3 && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>+{img.tags.length - 3}</span>}</div></td>
                <td>{img.size}</td>
                <td><span style={{ padding: '3px 8px', background: `${getScanStyle(img.scanStatus)}20`, color: getScanStyle(img.scanStatus), borderRadius: 4, fontSize: '0.8rem' }}>{getScanLabel(img.scanStatus)}</span></td>
                <td>{img.scanStatus === 'PASSED' || img.scanStatus === 'FAILED' ? <div style={{ display: 'flex', gap: 6, fontSize: '0.75rem' }}>{img.vulnerabilities.critical > 0 && <span style={{ color: '#ef4444' }}>C:{img.vulnerabilities.critical}</span>}{img.vulnerabilities.high > 0 && <span style={{ color: '#f97316' }}>H:{img.vulnerabilities.high}</span>}<span style={{ color: '#f59e0b' }}>M:{img.vulnerabilities.medium}</span><span style={{ color: '#10b981' }}>L:{img.vulnerabilities.low}</span></div> : '-'}</td>
                <td>{img.pullCount.toLocaleString()}</td>
                <td><div style={{ fontSize: '0.85rem' }}>{img.pushedAt}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{img.pushedBy}</div></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => setSelectedImage(img)}>👁️</button><button className="btn btn-ghost btn-sm" onClick={() => handleScan(img)} disabled={img.scanStatus === 'PENDING'} title="스캔">🔍</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(img.id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {selectedImage && (
        <div className="modal-overlay active" onClick={() => setSelectedImage(null)}>
          <div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">🐳 {selectedImage.name}</h3><button className="modal-close" onClick={() => setSelectedImage(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>{selectedImage.tags.map((t, i) => <span key={i} style={{ padding: '4px 10px', background: t === 'latest' ? '#3b82f620' : 'var(--color-bg-secondary)', color: t === 'latest' ? '#3b82f6' : 'inherit', borderRadius: 6, fontSize: '0.85rem' }}>{t}</span>)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>크기: <b>{selectedImage.size}</b></div><div>레이어: <b>{selectedImage.layers}</b></div>
                <div>Pull 횟수: <b>{selectedImage.pullCount.toLocaleString()}</b></div><div>푸시: <b>{selectedImage.pushedBy}</b></div>
              </div>
              <div style={{ padding: 12, background: `${getScanStyle(selectedImage.scanStatus)}10`, borderRadius: 8, marginBottom: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>보안 스캔</b><span style={{ color: getScanStyle(selectedImage.scanStatus) }}>{getScanLabel(selectedImage.scanStatus)}</span></div>
              {(selectedImage.scanStatus === 'PASSED' || selectedImage.scanStatus === 'FAILED') && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444' }}>{selectedImage.vulnerabilities.critical}</div><div style={{ fontSize: '0.7rem' }}>Critical</div></div><div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f97316' }}>{selectedImage.vulnerabilities.high}</div><div style={{ fontSize: '0.7rem' }}>High</div></div><div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f59e0b' }}>{selectedImage.vulnerabilities.medium}</div><div style={{ fontSize: '0.7rem' }}>Medium</div></div><div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>{selectedImage.vulnerabilities.low}</div><div style={{ fontSize: '0.7rem' }}>Low</div></div></div>}</div>
              <div style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>docker pull registry.jaterm.io/{selectedImage.name}:{selectedImage.tags[0]}</div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => { handleScan(selectedImage); setSelectedImage(null); }}>🔍 다시 스캔</button><button className="btn btn-ghost" onClick={() => setSelectedImage(null)}>닫기</button></div>
          </div>
        </div>
      )}

      {showPushModal && (
        <div className="modal-overlay active" onClick={() => setShowPushModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">📤 이미지 Push 가이드</h3><button className="modal-close" onClick={() => setShowPushModal(false)}>×</button></div>
            <div className="modal-body"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: 'var(--color-bg-secondary)', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>{`# 1. Docker 로그인
docker login registry.jaterm.io

# 2. 이미지 태그
docker tag my-image:latest registry.jaterm.io/my-image:latest

# 3. 이미지 Push
docker push registry.jaterm.io/my-image:latest`}</div></div>
            <div className="modal-footer"><button className="btn btn-primary" onClick={() => setShowPushModal(false)}>확인</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

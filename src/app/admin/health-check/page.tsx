'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface HealthCheck {
  id: string;
  name: string;
  category: 'INFRASTRUCTURE' | 'SERVICE' | 'DATABASE' | 'SECURITY' | 'NETWORK' | 'STORAGE';
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  message?: string;
  lastCheck: string;
  nextCheck: string;
  responseTime?: number; // ms
  uptime?: number; // percent
  details?: Record<string, string | number>;
  enabled: boolean;
  interval: number; // seconds
}

export default function HealthCheckPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCheck, setSelectedCheck] = useState<HealthCheck | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const mockChecks: HealthCheck[] = [
      { id: '1', name: 'API Gateway', category: 'SERVICE', status: 'HEALTHY', message: '모든 엔드포인트 정상', lastCheck: new Date(Date.now() - 30000).toISOString(), nextCheck: new Date(Date.now() + 30000).toISOString(), responseTime: 45, uptime: 99.98, details: { 'Active Connections': 234, 'Requests/min': 1520, 'Error Rate': '0.02%' }, enabled: true, interval: 60 },
      { id: '2', name: 'PostgreSQL Primary', category: 'DATABASE', status: 'HEALTHY', message: '연결 풀 정상', lastCheck: new Date(Date.now() - 15000).toISOString(), nextCheck: new Date(Date.now() + 45000).toISOString(), responseTime: 12, uptime: 99.99, details: { 'Active Connections': 45, 'Max Connections': 100, 'Replication Lag': '0ms' }, enabled: true, interval: 30 },
      { id: '3', name: 'Redis Cache', category: 'DATABASE', status: 'HEALTHY', message: 'Hit rate 95%', lastCheck: new Date(Date.now() - 20000).toISOString(), nextCheck: new Date(Date.now() + 40000).toISOString(), responseTime: 3, uptime: 99.95, details: { 'Memory Used': '2.4GB', 'Hit Rate': '95.2%', 'Connected Clients': 28 }, enabled: true, interval: 60 },
      { id: '4', name: 'SSH Gateway', category: 'INFRASTRUCTURE', status: 'HEALTHY', message: '32개 활성 세션', lastCheck: new Date(Date.now() - 10000).toISOString(), nextCheck: new Date(Date.now() + 50000).toISOString(), responseTime: 8, uptime: 99.97, details: { 'Active Sessions': 32, 'Max Sessions': 500, 'Avg Session Duration': '24m' }, enabled: true, interval: 30 },
      { id: '5', name: 'Storage Cluster', category: 'STORAGE', status: 'WARNING', message: '디스크 사용량 82%', lastCheck: new Date(Date.now() - 60000).toISOString(), nextCheck: new Date(Date.now() + 240000).toISOString(), uptime: 99.90, details: { 'Total': '10TB', 'Used': '8.2TB', 'Free': '1.8TB', 'IOPS': 15000 }, enabled: true, interval: 300 },
      { id: '6', name: 'Load Balancer', category: 'NETWORK', status: 'HEALTHY', message: '백엔드 4개 활성', lastCheck: new Date(Date.now() - 25000).toISOString(), nextCheck: new Date(Date.now() + 35000).toISOString(), responseTime: 2, uptime: 99.99, details: { 'Active Backends': 4, 'Total Requests': '2.5M', 'Bandwidth': '450Mbps' }, enabled: true, interval: 60 },
      { id: '7', name: 'SSL Certificate Check', category: 'SECURITY', status: 'WARNING', message: '*.example.com 28일 후 만료', lastCheck: new Date(Date.now() - 3600000).toISOString(), nextCheck: new Date(Date.now() + 82800000).toISOString(), details: { 'Certificates': 5, 'Expiring Soon': 1, 'Expired': 0 }, enabled: true, interval: 86400 },
      { id: '8', name: 'Firewall Rules', category: 'SECURITY', status: 'HEALTHY', message: '152개 규칙 활성', lastCheck: new Date(Date.now() - 1800000).toISOString(), nextCheck: new Date(Date.now() + 1800000).toISOString(), details: { 'Active Rules': 152, 'Blocked Today': 4523, 'Allowed Today': '1.2M' }, enabled: true, interval: 3600 },
      { id: '9', name: 'Backup Service', category: 'INFRASTRUCTURE', status: 'HEALTHY', message: '마지막 백업 2시간 전', lastCheck: new Date(Date.now() - 7200000).toISOString(), nextCheck: new Date(Date.now() + 7200000).toISOString(), details: { 'Last Backup': '2h ago', 'Backup Size': '45GB', 'Success Rate': '100%' }, enabled: true, interval: 14400 },
      { id: '10', name: 'Notification Service', category: 'SERVICE', status: 'CRITICAL', message: 'SMTP 서버 연결 실패', lastCheck: new Date(Date.now() - 5000).toISOString(), nextCheck: new Date(Date.now() + 25000).toISOString(), responseTime: 5000, uptime: 95.50, details: { 'Queue Size': 128, 'Failed': 45, 'Status': 'SMTP Connection Timeout' }, enabled: true, interval: 30 },
      { id: '11', name: 'DNS Resolution', category: 'NETWORK', status: 'HEALTHY', message: '평균 응답 15ms', lastCheck: new Date(Date.now() - 45000).toISOString(), nextCheck: new Date(Date.now() + 15000).toISOString(), responseTime: 15, uptime: 99.99, details: { 'Queries/sec': 450, 'Cache Hit': '92%' }, enabled: true, interval: 60 },
      { id: '12', name: 'Audit Logger', category: 'SERVICE', status: 'UNKNOWN', message: '상태 확인 중...', lastCheck: new Date(Date.now() - 600000).toISOString(), nextCheck: new Date(Date.now() + 600000).toISOString(), enabled: false, interval: 300 },
    ];
    setChecks(mockChecks);
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => setLastRefresh(new Date()), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE': return { color: '#8b5cf6', label: '인프라', icon: '🏗️' };
      case 'SERVICE': return { color: '#3b82f6', label: '서비스', icon: '⚙️' };
      case 'DATABASE': return { color: '#10b981', label: '데이터베이스', icon: '🗄️' };
      case 'SECURITY': return { color: '#ef4444', label: '보안', icon: '🔒' };
      case 'NETWORK': return { color: '#06b6d4', label: '네트워크', icon: '🌐' };
      case 'STORAGE': return { color: '#f59e0b', label: '스토리지', icon: '💾' };
      default: return { color: '#6b7280', label: category, icon: '❓' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'HEALTHY': return { color: '#10b981', label: '정상', icon: '✓', bg: '#10b98120' };
      case 'WARNING': return { color: '#f59e0b', label: '경고', icon: '⚠️', bg: '#f59e0b20' };
      case 'CRITICAL': return { color: '#ef4444', label: '위험', icon: '✗', bg: '#ef444420' };
      case 'UNKNOWN': return { color: '#6b7280', label: '알 수 없음', icon: '?', bg: '#6b728020' };
      default: return { color: '#6b7280', label: status, icon: '?', bg: '#6b728020' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    return `${hours}시간 전`;
  };

  const filteredChecks = checks.filter(c => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const healthyCount = checks.filter(c => c.status === 'HEALTHY').length;
  const warningCount = checks.filter(c => c.status === 'WARNING').length;
  const criticalCount = checks.filter(c => c.status === 'CRITICAL').length;
  const overallHealth = (healthyCount / checks.length * 100).toFixed(1);

  return (
    <AdminLayout 
      title="시스템 상태" 
      description="실시간 시스템 헬스체크 모니터링"
    >
      {/* Overall Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center', background: `linear-gradient(135deg, ${criticalCount > 0 ? '#ef444420' : warningCount > 0 ? '#f59e0b20' : '#10b98120'} 0%, transparent 100%)` }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{criticalCount > 0 ? '🔴' : warningCount > 0 ? '🟡' : '🟢'}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{overallHealth}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>전체 상태</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✓ 정상</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{healthyCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ 경고</div>
          <div className="stat-value" style={{ color: warningCount > 0 ? '#f59e0b' : 'inherit' }}>{warningCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✗ 위험</div>
          <div className="stat-value" style={{ color: criticalCount > 0 ? '#ef4444' : 'inherit' }}>{criticalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 체크</div>
          <div className="stat-value">{checks.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="all">전체 카테고리</option>
          <option value="INFRASTRUCTURE">🏗️ 인프라</option>
          <option value="SERVICE">⚙️ 서비스</option>
          <option value="DATABASE">🗄️ 데이터베이스</option>
          <option value="SECURITY">🔒 보안</option>
          <option value="NETWORK">🌐 네트워크</option>
          <option value="STORAGE">💾 스토리지</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'HEALTHY', 'WARNING', 'CRITICAL'].map(status => (
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
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          🔄 자동 새로고침
        </label>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>마지막: {getTimeAgo(lastRefresh.toISOString())}</span>
        <button className="btn btn-secondary" onClick={() => setLastRefresh(new Date())}>🔄 새로고침</button>
      </div>

      {/* Health Checks Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredChecks.map(check => {
            const categoryConfig = getCategoryConfig(check.category);
            const statusConfig = getStatusConfig(check.status);
            return (
              <div 
                key={check.id} 
                className="card" 
                style={{ padding: '16px', cursor: 'pointer', borderLeft: `4px solid ${statusConfig.color}`, opacity: check.enabled ? 1 : 0.6 }}
                onClick={() => setSelectedCheck(check)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{categoryConfig.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{check.name}</div>
                      <span style={{ fontSize: '0.75rem', color: categoryConfig.color }}>{categoryConfig.label}</span>
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>{statusConfig.icon} {statusConfig.label}</span>
                </div>
                
                {check.message && <div style={{ fontSize: '0.85rem', marginBottom: '12px', color: check.status === 'CRITICAL' ? '#ef4444' : check.status === 'WARNING' ? '#f59e0b' : 'var(--color-text-muted)' }}>{check.message}</div>}
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {check.responseTime !== undefined && <span>⏱️ {check.responseTime}ms</span>}
                  {check.uptime !== undefined && <span>📈 {check.uptime}%</span>}
                  <span>🕐 {getTimeAgo(check.lastCheck)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCheck && (
        <div className="modal-overlay active" onClick={() => setSelectedCheck(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getCategoryConfig(selectedCheck.category).icon} {selectedCheck.name}</h3>
              <button className="modal-close" onClick={() => setSelectedCheck(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ padding: '6px 14px', background: getStatusConfig(selectedCheck.status).bg, color: getStatusConfig(selectedCheck.status).color, borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>{getStatusConfig(selectedCheck.status).icon} {getStatusConfig(selectedCheck.status).label}</span>
                <span style={{ padding: '4px 10px', background: `${getCategoryConfig(selectedCheck.category).color}20`, color: getCategoryConfig(selectedCheck.category).color, borderRadius: '4px', fontSize: '0.85rem' }}>{getCategoryConfig(selectedCheck.category).label}</span>
              </div>
              
              {selectedCheck.message && <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', marginBottom: '16px' }}>{selectedCheck.message}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {selectedCheck.responseTime !== undefined && (
                  <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>응답 시간</div><div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedCheck.responseTime}ms</div></div>
                )}
                {selectedCheck.uptime !== undefined && (
                  <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>업타임</div><div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedCheck.uptime}%</div></div>
                )}
                <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>마지막 체크</div><div>{getTimeAgo(selectedCheck.lastCheck)}</div></div>
                <div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>체크 주기</div><div>{selectedCheck.interval}초</div></div>
              </div>
              
              {selectedCheck.details && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>상세 정보</div>
                  <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                    {Object.entries(selectedCheck.details).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{key}</span>
                        <span style={{ fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">🔄 지금 체크</button>
              <button className="btn btn-ghost" onClick={() => setSelectedCheck(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

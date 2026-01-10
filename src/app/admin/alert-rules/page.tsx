'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  type: 'SECURITY' | 'PERFORMANCE' | 'COMPLIANCE' | 'CUSTOM';
  condition: {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
    window: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  channels: string[];
  enabled: boolean;
  triggered: number;
  lastTriggered?: string;
  createdBy: string;
  createdAt: string;
}

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AlertRule['type']>('SECURITY');
  const [newSeverity, setNewSeverity] = useState<AlertRule['severity']>('MEDIUM');
  const [newMetric, setNewMetric] = useState('failed_logins');
  const [newOperator, setNewOperator] = useState<AlertRule['condition']['operator']>('>');
  const [newThreshold, setNewThreshold] = useState('5');
  const [newWindow, setNewWindow] = useState('5분');

  useEffect(() => {
    const mockRules: AlertRule[] = [
      { id: '1', name: '로그인 실패 급증', description: '5분 내 로그인 실패 5회 초과', type: 'SECURITY', condition: { metric: 'failed_logins', operator: '>', threshold: 5, window: '5분' }, severity: 'HIGH', channels: ['email', 'slack'], enabled: true, triggered: 23, lastTriggered: new Date(Date.now() - 2 * 3600000).toISOString(), createdBy: '보안팀', createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
      { id: '2', name: 'CPU 과부하', description: 'CPU 사용률 90% 초과 10분 지속', type: 'PERFORMANCE', condition: { metric: 'cpu_usage', operator: '>', threshold: 90, window: '10분' }, severity: 'CRITICAL', channels: ['email', 'slack', 'sms'], enabled: true, triggered: 8, lastTriggered: new Date(Date.now() - 48 * 3600000).toISOString(), createdBy: '운영팀', createdAt: new Date(Date.now() - 180 * 86400000).toISOString() },
      { id: '3', name: '권한 상승 시도', description: 'sudo 명령어 10회 초과', type: 'SECURITY', condition: { metric: 'sudo_commands', operator: '>', threshold: 10, window: '1시간' }, severity: 'HIGH', channels: ['email', 'slack'], enabled: true, triggered: 5, lastTriggered: new Date(Date.now() - 24 * 3600000).toISOString(), createdBy: '보안팀', createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
      { id: '4', name: '세션 동시 접속', description: '동일 사용자 5개 이상 세션', type: 'COMPLIANCE', condition: { metric: 'concurrent_sessions', operator: '>=', threshold: 5, window: '실시간' }, severity: 'MEDIUM', channels: ['slack'], enabled: true, triggered: 12, lastTriggered: new Date(Date.now() - 6 * 3600000).toISOString(), createdBy: '관리자', createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
      { id: '5', name: '디스크 용량 부족', description: '디스크 사용률 85% 초과', type: 'PERFORMANCE', condition: { metric: 'disk_usage', operator: '>', threshold: 85, window: '30분' }, severity: 'MEDIUM', channels: ['email'], enabled: true, triggered: 3, lastTriggered: new Date(Date.now() - 7 * 86400000).toISOString(), createdBy: '운영팀', createdAt: new Date(Date.now() - 120 * 86400000).toISOString() },
      { id: '6', name: '야간 접속 탐지', description: '22시-06시 사이 접속', type: 'CUSTOM', condition: { metric: 'night_access', operator: '>', threshold: 0, window: '이벤트' }, severity: 'LOW', channels: ['slack'], enabled: false, triggered: 156, lastTriggered: new Date(Date.now() - 12 * 3600000).toISOString(), createdBy: '보안팀', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
      { id: '7', name: '파일 대량 전송', description: '1시간 내 100MB 이상 전송', type: 'COMPLIANCE', condition: { metric: 'file_transfer_size', operator: '>', threshold: 100, window: '1시간' }, severity: 'HIGH', channels: ['email', 'slack'], enabled: true, triggered: 7, lastTriggered: new Date(Date.now() - 3 * 86400000).toISOString(), createdBy: '보안팀', createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
    ];
    setRules(mockRules);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAdd = () => {
    if (!newName) return;
    setMessage({ type: 'success', text: '알림 규칙이 생성되었습니다.' });
    setShowAddModal(false);
    setNewName('');
    setNewType('SECURITY');
    setNewSeverity('MEDIUM');
  };

  const handleToggle = (rule: AlertRule) => {
    setRules(rules.map(r => 
      r.id === rule.id ? { ...r, enabled: !r.enabled } : r
    ));
    setMessage({ type: 'success', text: `규칙이 ${rule.enabled ? '비활성화' : '활성화'}되었습니다.` });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'SECURITY': return { color: '#ef4444', icon: '🔒', label: '보안' };
      case 'PERFORMANCE': return { color: '#3b82f6', icon: '📈', label: '성능' };
      case 'COMPLIANCE': return { color: '#8b5cf6', icon: '📋', label: '컴플라이언스' };
      case 'CUSTOM': return { color: '#6b7280', icon: '⚙️', label: '사용자 정의' };
      default: return { color: '#6b7280', icon: '📋', label: type };
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return { color: '#dc2626', bg: '#dc262620', label: '심각' };
      case 'HIGH': return { color: '#ef4444', bg: '#ef444420', label: '높음' };
      case 'MEDIUM': return { color: '#f59e0b', bg: '#f59e0b20', label: '중간' };
      case 'LOW': return { color: '#10b981', bg: '#10b98120', label: '낮음' };
      default: return { color: '#6b7280', bg: '#6b728020', label: severity };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const filteredRules = rules.filter(r => {
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    return true;
  });

  const enabledCount = rules.filter(r => r.enabled).length;
  const totalTriggered = rules.reduce((sum, r) => sum + r.triggered, 0);
  const criticalCount = rules.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length;

  return (
    <AdminLayout 
      title="알림 규칙" 
      description="자동 알림 조건 설정"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 규칙 추가
        </button>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">총 규칙</div>
          <div className="stat-value">{rules.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ 활성</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{enabledCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔔 총 발생</div>
          <div className="stat-value">{totalTriggered}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🚨 긴급</div>
          <div className="stat-value" style={{ color: criticalCount > 0 ? '#ef4444' : 'inherit' }}>{criticalCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 규칙 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">모든 유형</option>
          <option value="SECURITY">🔒 보안</option>
          <option value="PERFORMANCE">📈 성능</option>
          <option value="COMPLIANCE">📋 컴플라이언스</option>
          <option value="CUSTOM">⚙️ 사용자 정의</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => {
            const config = severity !== 'all' ? getSeverityConfig(severity) : null;
            return (
              <button
                key={severity}
                className={`btn btn-sm ${filterSeverity === severity ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterSeverity(severity)}
              >
                {severity === 'all' ? '전체' : config?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRules.map(rule => {
            const typeConfig = getTypeConfig(rule.type);
            const severityConfig = getSeverityConfig(rule.severity);
            return (
              <div key={rule.id} className="card" style={{ padding: '20px', opacity: rule.enabled ? 1 : 0.6, borderLeft: `4px solid ${severityConfig.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{typeConfig.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{rule.name}</span>
                      <span style={{ padding: '2px 8px', background: typeConfig.color + '20', color: typeConfig.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {typeConfig.label}
                      </span>
                      <span style={{ padding: '2px 8px', background: severityConfig.bg, color: severityConfig.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {severityConfig.label}
                      </span>
                      {!rule.enabled && <span style={{ padding: '2px 8px', background: '#6b728020', color: '#6b7280', borderRadius: '4px', fontSize: '0.7rem' }}>비활성</span>}
                    </div>
                    {rule.description && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                        {rule.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span>📊 조건: <code>{rule.condition.metric} {rule.condition.operator} {rule.condition.threshold}</code> ({rule.condition.window})</span>
                      <span>📢 채널: {rule.channels.join(', ')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(rule)} title={rule.enabled ? '비활성화' : '활성화'}>
                        {rule.enabled ? '⏸️' : '▶️'}
                      </button>
                      <button className="btn btn-ghost btn-sm">✏️</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>🗑️</button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                      <div>🔔 {rule.triggered}회 발생</div>
                      {rule.lastTriggered && <div>마지막: {getTimeAgo(rule.lastTriggered)}</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ 알림 규칙 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">규칙 이름</label>
                <input type="text" className="form-input" placeholder="예: 로그인 실패 급증" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">유형</label>
                  <select className="form-input" value={newType} onChange={(e) => setNewType(e.target.value as AlertRule['type'])}>
                    <option value="SECURITY">🔒 보안</option>
                    <option value="PERFORMANCE">📈 성능</option>
                    <option value="COMPLIANCE">📋 컴플라이언스</option>
                    <option value="CUSTOM">⚙️ 사용자 정의</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">심각도</label>
                  <select className="form-input" value={newSeverity} onChange={(e) => setNewSeverity(e.target.value as AlertRule['severity'])}>
                    <option value="CRITICAL">🚨 심각</option>
                    <option value="HIGH">🔴 높음</option>
                    <option value="MEDIUM">🟡 중간</option>
                    <option value="LOW">🟢 낮음</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">조건</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="form-input" value={newMetric} onChange={(e) => setNewMetric(e.target.value)} style={{ flex: 2 }}>
                    <option value="failed_logins">로그인 실패</option>
                    <option value="cpu_usage">CPU 사용률 (%)</option>
                    <option value="memory_usage">메모리 사용률 (%)</option>
                    <option value="disk_usage">디스크 사용률 (%)</option>
                    <option value="sudo_commands">sudo 명령어</option>
                    <option value="concurrent_sessions">동시 세션</option>
                    <option value="file_transfer_size">파일 전송량 (MB)</option>
                  </select>
                  <select className="form-input" value={newOperator} onChange={(e) => setNewOperator(e.target.value as AlertRule['condition']['operator'])} style={{ flex: 1 }}>
                    <option value=">">{'>'}</option>
                    <option value=">=">{'>='}</option>
                    <option value="<">{'<'}</option>
                    <option value="<=">{'<='}</option>
                    <option value="=">=</option>
                  </select>
                  <input type="number" className="form-input" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">시간 창</label>
                <select className="form-input" value={newWindow} onChange={(e) => setNewWindow(e.target.value)}>
                  <option value="실시간">실시간</option>
                  <option value="5분">5분</option>
                  <option value="10분">10분</option>
                  <option value="30분">30분</option>
                  <option value="1시간">1시간</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newName}>저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

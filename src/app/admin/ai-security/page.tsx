'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AnomalyRule {
  id: string;
  name: string;
  description: string | null;
  type: string;
  threshold: number;
  isActive: boolean;
}

interface Stats {
  activeRules: number;
  todayDetections: number;
  todayBlocks: number;
}

export default function AISecurityPage() {
  const [rules, setRules] = useState<AnomalyRule[]>([]);
  const [stats, setStats] = useState<Stats>({ activeRules: 0, todayDetections: 0, todayBlocks: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ai-security', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setRules(data.rules);
      setStats(data.stats);
      setError('');
    } catch (err) {
      setError('규칙을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = async (rule: AnomalyRule) => {
    try {
      await fetch('/api/admin/ai-security', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });
      setSuccess(rule.isActive ? '규칙이 비활성화되었습니다.' : '규칙이 활성화되었습니다.');
      fetchRules();
    } catch (err) {
      setError('상태 변경에 실패했습니다.');
    }
  };

  return (
    <AdminLayout title="AI 보안" description="AI 기반 이상 행위 탐지 및 자동 차단 설정">
      {success && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{success}<button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>}
      {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>}
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">활성 규칙</div><div className="stat-value">{stats.activeRules}</div></div>
        <div className="stat-card"><div className="stat-label">오늘 탐지</div><div className="stat-value">{stats.todayDetections}</div></div>
        <div className="stat-card"><div className="stat-label">자동 차단</div><div className="stat-value">{stats.todayBlocks}</div></div>
        <div className="stat-card"><div className="stat-label">학습 데이터</div><div className="stat-value">1.2M</div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>🤖 AI 모델 상태</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>모델 버전</div><div style={{ fontSize: '1.25rem', fontWeight: 600 }}>v2.3.1</div></div>
          <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>정확도</div><div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-success)' }}>94.2%</div></div>
          <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>마지막 학습</div><div style={{ fontSize: '1.25rem', fontWeight: 600 }}>2시간 전</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600 }}>이상 행위 탐지 규칙</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ 규칙 추가</button>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><span className="spinner" style={{ width: '32px', height: '32px' }} /></div>
        ) : rules.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>탐지 규칙이 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rules.map(rule => (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{rule.name}</span>
                    <span className="badge badge-info">{rule.type}</span>
                    <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-danger'}`}>{rule.isActive ? '활성' : '비활성'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{rule.description || '설명 없음'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>임계치</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{Math.round(rule.threshold * 100)}%</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(rule)}>{rule.isActive ? '비활성화' : '활성화'}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>알림 설정</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> Slack 알림 (모든 심각도)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 이메일 알림 (HIGH 이상)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" /> SMS 알림 (CRITICAL만)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 일간 리포트 자동 생성</label>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">이상 행위 규칙 추가</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">규칙 이름</label><input type="text" className="form-input" /></div>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input form-select"><option value="TIME">시간 기반</option><option value="LOCATION">위치 기반</option><option value="COMMAND">명령 기반</option><option value="BEHAVIOR">행동 기반</option></select></div>
              <div className="form-group"><label className="form-label">임계치 (%)</label><input type="number" className="form-input" defaultValue={80} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">추가</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

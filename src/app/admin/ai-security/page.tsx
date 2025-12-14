'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AnomalyRule {
  id: string;
  name: string;
  description: string;
  type: 'TIME' | 'LOCATION' | 'COMMAND' | 'BEHAVIOR';
  threshold: number;
  isActive: boolean;
}

const mockRules: AnomalyRule[] = [
  { id: '1', name: '비정상 접속 시간', description: '평소와 다른 시간대 접속 감지', type: 'TIME', threshold: 0.8, isActive: true },
  { id: '2', name: '새로운 IP 접속', description: '처음 접속하는 IP에서 로그인', type: 'LOCATION', threshold: 0.7, isActive: true },
  { id: '3', name: '위험 명령 패턴', description: '위험 명령 연속 실행 감지', type: 'COMMAND', threshold: 0.9, isActive: true },
  { id: '4', name: '이상 행동 패턴', description: '평소와 다른 명령 사용 패턴', type: 'BEHAVIOR', threshold: 0.75, isActive: true },
];

export default function AISecurityPage() {
  const [rules] = useState(mockRules);
  const [showModal, setShowModal] = useState(false);

  return (
    <AdminLayout title="AI 보안" description="AI 기반 이상 행위 탐지 및 자동 차단 설정">
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">활성 규칙</div><div className="stat-value">{rules.filter(r => r.isActive).length}</div></div>
        <div className="stat-card"><div className="stat-label">오늘 탐지</div><div className="stat-value">12</div></div>
        <div className="stat-card"><div className="stat-label">자동 차단</div><div className="stat-value">3</div></div>
        <div className="stat-card"><div className="stat-label">학습 데이터</div><div className="stat-value">1.2M</div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>🤖 AI 모델 상태</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>모델 버전</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>v2.3.1</div>
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>정확도</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-success)' }}>94.2%</div>
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>마지막 학습</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>2시간 전</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600 }}>이상 행위 탐지 규칙</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ 규칙 추가</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rules.map(rule => (
            <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500 }}>{rule.name}</span>
                  <span className="badge badge-info">{rule.type}</span>
                  <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-danger'}`}>{rule.isActive ? '활성' : '비활성'}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{rule.description}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>임계치</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{Math.round(rule.threshold * 100)}%</div>
              </div>
              <button className="btn btn-ghost btn-sm">수정</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>알림 설정</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> Slack 알림 (모든 심각도)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 이메일 알림 (HIGH 이상)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" /> SMS 알림 (CRITICAL만)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 일간 리포트 자동 생성</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked /> 월간 리포트 자동 생성</label>
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

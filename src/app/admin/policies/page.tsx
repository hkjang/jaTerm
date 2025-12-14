'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Policy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  allowedRoles: string[];
  commandMode: 'BLACKLIST' | 'WHITELIST';
  requireApproval: boolean;
  allowedDays: number[];
  allowedStartTime: string;
  allowedEndTime: string;
  serverCount: number;
}

const mockPolicies: Policy[] = [
  { id: '1', name: 'Production Full Access', description: 'ADMIN 역할 전용 프로덕션 서버 접근 정책', isActive: true, allowedRoles: ['ADMIN'], commandMode: 'BLACKLIST', requireApproval: false, allowedDays: [1, 2, 3, 4, 5], allowedStartTime: '09:00', allowedEndTime: '18:00', serverCount: 5 },
  { id: '2', name: 'Production Read Only', description: 'OPERATOR 역할 프로덕션 조회 전용 정책', isActive: true, allowedRoles: ['OPERATOR'], commandMode: 'WHITELIST', requireApproval: true, allowedDays: [0, 1, 2, 3, 4, 5, 6], allowedStartTime: '00:00', allowedEndTime: '23:59', serverCount: 5 },
  { id: '3', name: 'Staging Access', description: '개발자 스테이징 환경 접근 정책', isActive: true, allowedRoles: ['DEVELOPER', 'OPERATOR'], commandMode: 'BLACKLIST', requireApproval: false, allowedDays: [1, 2, 3, 4, 5], allowedStartTime: '08:00', allowedEndTime: '22:00', serverCount: 4 },
  { id: '4', name: 'Development Free Access', description: '개발 환경 자유 접근 정책', isActive: true, allowedRoles: ['DEVELOPER', 'OPERATOR', 'ADMIN'], commandMode: 'BLACKLIST', requireApproval: false, allowedDays: [0, 1, 2, 3, 4, 5, 6], allowedStartTime: '00:00', allowedEndTime: '23:59', serverCount: 6 },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState(mockPolicies);
  const [showModal, setShowModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  const getDayNames = (days: number[]) => {
    const names = ['일', '월', '화', '수', '목', '금', '토'];
    return days.map(d => names[d]).join(', ');
  };

  return (
    <AdminLayout title="접근 정책" description="서버 접근 정책 및 시간 제어 설정"
      actions={<><button className="btn btn-secondary" onClick={() => setShowSimulation(true)}>🔍 시뮬레이션</button><button className="btn btn-primary" style={{ marginLeft: '8px' }} onClick={() => setShowModal(true)}>+ 정책 추가</button></>}>

      {/* Policies Grid */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {policies.map(policy => (
          <div key={policy.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{policy.name}</h3>
                  <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-danger'}`}>{policy.isActive ? '활성' : '비활성'}</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{policy.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm">수정</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>삭제</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>허용 역할</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{policy.allowedRoles.map(role => <span key={role} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{role}</span>)}</div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>명령 제어</div>
                <span className={`badge ${policy.commandMode === 'WHITELIST' ? 'badge-warning' : 'badge-info'}`}>{policy.commandMode === 'WHITELIST' ? '화이트리스트' : '블랙리스트'}</span>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>접근 시간</div>
                <div style={{ fontSize: '0.9rem' }}>{getDayNames(policy.allowedDays)}<br /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{policy.allowedStartTime} - {policy.allowedEndTime}</span></div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>승인 필요</div>
                {policy.requireApproval ? <span style={{ color: 'var(--color-warning)' }}>⚠️ 사전 승인 필요</span> : <span style={{ color: 'var(--color-success)' }}>✓ 즉시 접근 가능</span>}
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>적용 서버</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>{policy.serverCount}대</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">정책 추가</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">정책 이름</label><input type="text" className="form-input" /></div>
              <div className="form-group"><label className="form-label">설명</label><input type="text" className="form-input" /></div>
              <div className="form-group"><label className="form-label">허용 역할</label><div style={{ display: 'flex', gap: '12px' }}>{['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER'].map(role => <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" />{role}</label>)}</div></div>
              <div className="form-group"><label className="form-label">명령 제어 모드</label><select className="form-input form-select"><option value="BLACKLIST">블랙리스트</option><option value="WHITELIST">화이트리스트</option></select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group"><label className="form-label">시작 시간</label><input type="time" className="form-input" defaultValue="09:00" /></div>
                <div className="form-group"><label className="form-label">종료 시간</label><input type="time" className="form-input" defaultValue="18:00" /></div>
              </div>
              <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" /> 사전 승인 필요</label></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">추가</button></div>
          </div>
        </div>
      )}

      {showSimulation && (
        <div className="modal-overlay active" onClick={() => setShowSimulation(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">정책 시뮬레이션</h3><button className="modal-close" onClick={() => setShowSimulation(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">사용자 선택</label><select className="form-input form-select"><option>김철수 (OPERATOR)</option><option>이영희 (DEVELOPER)</option></select></div>
              <div className="form-group"><label className="form-label">대상 서버</label><select className="form-input form-select"><option>prod-web-01</option><option>stage-api-01</option></select></div>
              <div className="form-group"><label className="form-label">시간</label><input type="datetime-local" className="form-input" /></div>
              <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)', marginTop: '16px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>시뮬레이션 결과</div>
                <div style={{ color: 'var(--color-success)' }}>✓ 접근 허용 (Production Read Only 정책 적용)</div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowSimulation(false)}>닫기</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

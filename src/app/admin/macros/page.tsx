'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Macro {
  id: string;
  name: string;
  description: string;
  steps: string[];
  variables: { name: string; defaultValue: string }[];
  isShared: boolean;
  createdBy: string;
  usageCount: number;
}

const mockMacros: Macro[] = [
  { id: '1', name: '서버 상태 점검', description: '서버 헬스체크 자동화', steps: ['uptime', 'df -h', 'free -m', 'top -bn1 | head -20'], variables: [], isShared: true, createdBy: '홍길동', usageCount: 156 },
  { id: '2', name: '로그 로테이션', description: '로그 파일 정리 자동화', steps: ['cd /var/log', 'find . -name "*.log" -mtime +30 -delete', 'du -sh .'], variables: [{ name: 'DAYS', defaultValue: '30' }], isShared: true, createdBy: '김철수', usageCount: 42 },
  { id: '3', name: '배포 시작', description: '애플리케이션 배포 스크립트', steps: ['git pull', 'npm install', 'npm run build', 'pm2 restart all'], variables: [{ name: 'BRANCH', defaultValue: 'main' }], isShared: false, createdBy: '이영희', usageCount: 28 },
];

export default function MacrosPage() {
  const [macros] = useState(mockMacros);
  const [showModal, setShowModal] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);

  return (
    <AdminLayout title="매크로 템플릿" description="공용 매크로 및 자동화 스크립트 관리"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 매크로 추가</button>}>
      
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">전체 매크로</div><div className="stat-value">{macros.length}</div></div>
        <div className="stat-card"><div className="stat-label">공유 매크로</div><div className="stat-value">{macros.filter(m => m.isShared).length}</div></div>
        <div className="stat-card"><div className="stat-label">총 실행</div><div className="stat-value">{macros.reduce((a, m) => a + m.usageCount, 0)}</div></div>
        <div className="stat-card"><div className="stat-label">변수 포함</div><div className="stat-value">{macros.filter(m => m.variables.length > 0).length}</div></div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {macros.map(macro => (
          <div key={macro.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{macro.name}</span>
                  {macro.isShared && <span className="badge badge-success">공유</span>}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{macro.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>{macro.usageCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>실행 횟수</div>
              </div>
            </div>
            <div style={{ background: 'var(--terminal-bg)', padding: '12px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '12px' }}>
              {macro.steps.slice(0, 3).map((step, i) => (
                <div key={i} style={{ color: 'var(--color-success)' }}>$ {step}</div>
              ))}
              {macro.steps.length > 3 && <div style={{ color: 'var(--color-text-muted)' }}>... +{macro.steps.length - 3} more</div>}
            </div>
            {macro.variables.length > 0 && (
              <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>변수: </span>
                {macro.variables.map((v, i) => (
                  <span key={i} className="badge badge-info" style={{ marginRight: '4px' }}>${'{' + v.name + '}'}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>작성자: {macro.createdBy}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMacro(macro)}>상세</button>
                <button className="btn btn-ghost btn-sm">수정</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">매크로 추가</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">매크로 이름</label><input type="text" className="form-input" /></div>
              <div className="form-group"><label className="form-label">설명</label><input type="text" className="form-input" /></div>
              <div className="form-group"><label className="form-label">명령어 (줄바꿈 구분)</label><textarea className="form-input" rows={5} style={{ fontFamily: 'var(--font-mono)' }} /></div>
              <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" /> 공용 템플릿으로 공유</label></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button><button className="btn btn-primary">추가</button></div>
          </div>
        </div>
      )}

      {selectedMacro && (
        <div className="modal-overlay active" onClick={() => setSelectedMacro(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">{selectedMacro.name}</h3><button className="modal-close" onClick={() => setSelectedMacro(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ background: 'var(--terminal-bg)', padding: '16px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                {selectedMacro.steps.map((step, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}><span style={{ color: 'var(--color-success)' }}>$</span> {step}</div>
                ))}
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelectedMacro(null)}>닫기</button><button className="btn btn-primary">실행</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

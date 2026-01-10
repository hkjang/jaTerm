'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface QuickCommand {
  id: string;
  name: string;
  command: string;
  description: string;
  category: string;
  icon: string;
  isPublic: boolean;
  usageCount: number;
  createdBy: { name: string };
  tags: string[];
}

export default function QuickCommandsPage() {
  const [commands, setCommands] = useState<QuickCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('시스템');
  const [newIsPublic, setNewIsPublic] = useState(true);

  useEffect(() => {
    setLoading(true);
    const mockCommands: QuickCommand[] = [
      { id: '1', name: '디스크 사용량', command: 'df -h', description: '디스크 사용량 확인', category: '시스템', icon: '💾', isPublic: true, usageCount: 1250, createdBy: { name: '관리자' }, tags: ['disk', 'storage'] },
      { id: '2', name: '메모리 사용량', command: 'free -h', description: '메모리 사용 현황', category: '시스템', icon: '🧠', isPublic: true, usageCount: 980, createdBy: { name: '관리자' }, tags: ['memory', 'ram'] },
      { id: '3', name: 'CPU 로드', command: 'uptime && cat /proc/loadavg', description: 'CPU 부하 확인', category: '시스템', icon: '⚡', isPublic: true, usageCount: 820, createdBy: { name: '관리자' }, tags: ['cpu', 'load'] },
      { id: '4', name: 'Nginx 재시작', command: 'sudo systemctl restart nginx', description: 'Nginx 웹서버 재시작', category: '서비스', icon: '🔄', isPublic: true, usageCount: 345, createdBy: { name: '운영팀' }, tags: ['nginx', 'restart'] },
      { id: '5', name: 'Nginx 로그', command: 'tail -100 /var/log/nginx/access.log', description: '최근 접속 로그 100줄', category: '로그', icon: '📜', isPublic: true, usageCount: 567, createdBy: { name: '운영팀' }, tags: ['nginx', 'log'] },
      { id: '6', name: 'Docker 컨테이너', command: 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', description: '실행 중인 컨테이너 목록', category: '도커', icon: '🐳', isPublic: true, usageCount: 423, createdBy: { name: '개발팀' }, tags: ['docker', 'container'] },
      { id: '7', name: 'Docker 로그', command: 'docker logs --tail 100 -f ${CONTAINER_NAME}', description: '컨테이너 로그 (변수 사용)', category: '도커', icon: '📋', isPublic: true, usageCount: 289, createdBy: { name: '개발팀' }, tags: ['docker', 'logs'] },
      { id: '8', name: '포트 확인', command: 'ss -tulpn | grep LISTEN', description: '열린 포트 확인', category: '네트워크', icon: '🔌', isPublic: true, usageCount: 678, createdBy: { name: '관리자' }, tags: ['port', 'network'] },
      { id: '9', name: '연결 확인', command: 'netstat -an | grep ESTABLISHED | wc -l', description: '활성 연결 수', category: '네트워크', icon: '🌐', isPublic: true, usageCount: 234, createdBy: { name: '관리자' }, tags: ['network', 'connection'] },
      { id: '10', name: '프로세스 목록', command: 'ps aux --sort=-%mem | head -20', description: '메모리 사용량 기준 상위 프로세스', category: '시스템', icon: '📊', isPublic: true, usageCount: 456, createdBy: { name: '관리자' }, tags: ['process', 'memory'] },
    ];
    setCommands(mockCommands);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAdd = () => {
    if (!newName || !newCommand) return;
    setMessage({ type: 'success', text: '명령어가 추가되었습니다.' });
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (cmd: QuickCommand) => {
    if (!confirm(`'${cmd.name}' 명령어를 삭제하시겠습니까?`)) return;
    setCommands(commands.filter(c => c.id !== cmd.id));
    setMessage({ type: 'success', text: '명령어가 삭제되었습니다.' });
  };

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setMessage({ type: 'success', text: '클립보드에 복사되었습니다.' });
  };

  const resetForm = () => {
    setNewName('');
    setNewCommand('');
    setNewDescription('');
    setNewCategory('시스템');
    setNewIsPublic(true);
  };

  const categories = ['all', ...new Set(commands.map(c => c.category))];

  const filteredCommands = commands.filter(cmd => {
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <AdminLayout 
      title="빠른 명령어" 
      description="자주 사용하는 명령어 스니펫"
      actions={
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 명령어 추가
        </button>
      }
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 명령어 검색..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? '전체' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Commands Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : filteredCommands.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          검색 결과가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredCommands.map(cmd => (
            <div key={cmd.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{cmd.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{cmd.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cmd.description}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-text-muted)' }} onClick={() => handleDelete(cmd)}>
                  ×
                </button>
              </div>
              <div 
                style={{ 
                  padding: '10px', 
                  background: 'var(--color-surface)', 
                  borderRadius: '6px', 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => handleCopy(cmd.command)}
                title="클릭하여 복사"
              >
                <code style={{ wordBreak: 'break-all' }}>{cmd.command}</code>
                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>📋</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ padding: '2px 6px', background: 'var(--color-primary)20', color: 'var(--color-primary)', borderRadius: '3px' }}>{cmd.category}</span>
                  {cmd.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{ padding: '2px 6px', background: 'var(--color-surface)', borderRadius: '3px' }}>#{tag}</span>
                  ))}
                </div>
                <span>📊 {cmd.usageCount}회</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ 명령어 추가</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">이름</label>
                <input type="text" className="form-input" placeholder="예: 디스크 사용량 확인" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">명령어</label>
                <textarea className="form-input" placeholder="예: df -h" value={newCommand} onChange={(e) => setNewCommand(e.target.value)} rows={3} style={{ fontFamily: 'var(--font-mono)', resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <input type="text" className="form-input" placeholder="명령어에 대한 설명" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">카테고리</label>
                  <select className="form-input form-select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    <option>시스템</option>
                    <option>서비스</option>
                    <option>로그</option>
                    <option>도커</option>
                    <option>네트워크</option>
                    <option>데이터베이스</option>
                    <option>기타</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">공개 범위</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="visibility" checked={newIsPublic} onChange={() => setNewIsPublic(true)} />
                      전체 공개
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="visibility" checked={!newIsPublic} onChange={() => setNewIsPublic(false)} />
                      비공개
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newName || !newCommand}>추가</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

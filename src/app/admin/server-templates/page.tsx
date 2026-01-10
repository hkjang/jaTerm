'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ServerTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'SSH' | 'SFTP' | 'RDGATEWAY' | 'DATABASE' | 'KUBERNETES';
  os: 'LINUX' | 'WINDOWS' | 'MACOS' | 'OTHER';
  config: {
    defaultPort: number;
    authType: 'PASSWORD' | 'KEY' | 'CERTIFICATE' | 'MFA';
    jumpHost?: string;
    proxyCommand?: string;
    timeout: number;
    keepAlive: boolean;
    compression: boolean;
    environmentVars?: Record<string, string>;
    initCommands?: string[];
  };
  terminalSettings: {
    shell?: string;
    colorScheme: string;
    fontSize: number;
    fontFamily: string;
    scrollback: number;
  };
  usageCount: number;
  isDefault: boolean;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export default function ServerTemplatesPage() {
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOs, setFilterOs] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ServerTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const mockTemplates: ServerTemplate[] = [
      { id: '1', name: 'Linux 프로덕션 서버', description: 'SSH 기반 리눅스 프로덕션 환경', type: 'SSH', os: 'LINUX', config: { defaultPort: 22, authType: 'KEY', timeout: 30, keepAlive: true, compression: true, initCommands: ['export LANG=ko_KR.UTF-8', 'alias ll="ls -la"'] }, terminalSettings: { shell: '/bin/bash', colorScheme: 'Dracula', fontSize: 14, fontFamily: 'Fira Code', scrollback: 10000 }, usageCount: 156, isDefault: true, createdBy: { id: 'u1', name: '김관리' }, createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString() },
      { id: '2', name: 'Windows 서버', description: 'RD Gateway 기반 Windows 접속', type: 'RDGATEWAY', os: 'WINDOWS', config: { defaultPort: 3389, authType: 'PASSWORD', timeout: 60, keepAlive: true, compression: false }, terminalSettings: { colorScheme: 'Windows', fontSize: 12, fontFamily: 'Consolas', scrollback: 5000 }, usageCount: 89, isDefault: false, createdBy: { id: 'u2', name: '박개발' }, createdAt: new Date(Date.now() - 120 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString() },
      { id: '3', name: 'Kubernetes 클러스터', description: 'K8s 클러스터 kubectl 접속', type: 'KUBERNETES', os: 'LINUX', config: { defaultPort: 6443, authType: 'CERTIFICATE', timeout: 30, keepAlive: true, compression: true }, terminalSettings: { shell: '/bin/bash', colorScheme: 'Material', fontSize: 13, fontFamily: 'JetBrains Mono', scrollback: 15000 }, usageCount: 234, isDefault: false, createdBy: { id: 'u1', name: '김관리' }, createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
      { id: '4', name: 'DB 관리 서버', description: 'PostgreSQL/MySQL 관리용', type: 'DATABASE', os: 'LINUX', config: { defaultPort: 5432, authType: 'PASSWORD', timeout: 60, keepAlive: true, compression: false, environmentVars: { PGPASSWORD: '***', MYSQL_PWD: '***' } }, terminalSettings: { shell: '/bin/bash', colorScheme: 'Monokai', fontSize: 14, fontFamily: 'Source Code Pro', scrollback: 8000 }, usageCount: 67, isDefault: false, createdBy: { id: 'u3', name: '이백엔드' }, createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString() },
      { id: '5', name: 'Bastion Host (점프 서버)', description: 'VPN 내부 서버 접속용 점프 호스트', type: 'SSH', os: 'LINUX', config: { defaultPort: 22, authType: 'MFA', jumpHost: 'bastion.example.com', timeout: 45, keepAlive: true, compression: true, proxyCommand: 'ssh -W %h:%p bastion' }, terminalSettings: { shell: '/bin/zsh', colorScheme: 'Nord', fontSize: 14, fontFamily: 'Hack', scrollback: 12000 }, usageCount: 312, isDefault: false, createdBy: { id: 'u1', name: '김관리' }, createdAt: new Date(Date.now() - 200 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString() },
      { id: '6', name: 'SFTP 파일 서버', description: '파일 전송 전용 SFTP 접속', type: 'SFTP', os: 'LINUX', config: { defaultPort: 22, authType: 'KEY', timeout: 120, keepAlive: false, compression: true }, terminalSettings: { colorScheme: 'Solarized', fontSize: 12, fontFamily: 'Monaco', scrollback: 3000 }, usageCount: 45, isDefault: false, createdBy: { id: 'u2', name: '박개발' }, createdAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString() },
      { id: '7', name: 'macOS 개발 서버', description: 'macOS Ventura 개발 환경', type: 'SSH', os: 'MACOS', config: { defaultPort: 22, authType: 'KEY', timeout: 30, keepAlive: true, compression: false }, terminalSettings: { shell: '/bin/zsh', colorScheme: 'One Dark', fontSize: 13, fontFamily: 'SF Mono', scrollback: 10000 }, usageCount: 28, isDefault: false, createdBy: { id: 'u4', name: '정테스트' }, createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
    ];
    setTemplates(mockTemplates);
    setLoading(false);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'SSH': return { color: '#10b981', label: 'SSH', icon: '🔐' };
      case 'SFTP': return { color: '#3b82f6', label: 'SFTP', icon: '📁' };
      case 'RDGATEWAY': return { color: '#8b5cf6', label: 'RD Gateway', icon: '🖥️' };
      case 'DATABASE': return { color: '#f59e0b', label: 'Database', icon: '🗄️' };
      case 'KUBERNETES': return { color: '#06b6d4', label: 'Kubernetes', icon: '☸️' };
      default: return { color: '#6b7280', label: type, icon: '?' };
    }
  };

  const getOsConfig = (os: string) => {
    switch (os) {
      case 'LINUX': return { color: '#f59e0b', label: 'Linux', icon: '🐧' };
      case 'WINDOWS': return { color: '#3b82f6', label: 'Windows', icon: '🪟' };
      case 'MACOS': return { color: '#6b7280', label: 'macOS', icon: '🍎' };
      default: return { color: '#6b7280', label: os, icon: '💻' };
    }
  };

  const getAuthConfig = (auth: string) => {
    switch (auth) {
      case 'PASSWORD': return { label: '패스워드', icon: '🔑' };
      case 'KEY': return { label: '키 인증', icon: '🔐' };
      case 'CERTIFICATE': return { label: '인증서', icon: '📜' };
      case 'MFA': return { label: 'MFA', icon: '📱' };
      default: return { label: auth, icon: '?' };
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterOs !== 'all' && t.os !== filterOs) return false;
    return true;
  });

  return (
    <AdminLayout 
      title="서버 템플릿" 
      description="서버 연결 템플릿 관리"
    >
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 템플릿</div>
          <div className="stat-value">{templates.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔐 SSH</div>
          <div className="stat-value">{templates.filter(t => t.type === 'SSH').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">☸️ K8s</div>
          <div className="stat-value">{templates.filter(t => t.type === 'KUBERNETES').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🐧 Linux</div>
          <div className="stat-value">{templates.filter(t => t.os === 'LINUX').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 사용 횟수</div>
          <div className="stat-value">{templates.reduce((a, t) => a + t.usageCount, 0)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" className="form-input" placeholder="🔍 템플릿 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '200px' }} />
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 유형</option>
          <option value="SSH">🔐 SSH</option>
          <option value="SFTP">📁 SFTP</option>
          <option value="RDGATEWAY">🖥️ RD Gateway</option>
          <option value="DATABASE">🗄️ Database</option>
          <option value="KUBERNETES">☸️ Kubernetes</option>
        </select>
        <select className="form-input" value={filterOs} onChange={(e) => setFilterOs(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="all">전체 OS</option>
          <option value="LINUX">🐧 Linux</option>
          <option value="WINDOWS">🪟 Windows</option>
          <option value="MACOS">🍎 macOS</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 템플릿 생성</button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredTemplates.map(template => {
            const typeConfig = getTypeConfig(template.type);
            const osConfig = getOsConfig(template.os);
            const authConfig = getAuthConfig(template.config.authType);
            return (
              <div key={template.id} className="card" style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => setSelectedTemplate(template)}>
                {template.isDefault && <span style={{ position: 'absolute', top: '10px', right: '10px', padding: '2px 8px', background: '#10b98120', color: '#10b981', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>기본</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{typeConfig.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{template.name}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span style={{ padding: '2px 6px', background: `${typeConfig.color}20`, color: typeConfig.color, borderRadius: '4px', fontSize: '0.7rem' }}>{typeConfig.label}</span>
                      <span style={{ padding: '2px 6px', background: `${osConfig.color}20`, color: osConfig.color, borderRadius: '4px', fontSize: '0.7rem' }}>{osConfig.icon} {osConfig.label}</span>
                    </div>
                  </div>
                </div>
                {template.description && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>{template.description}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>🔌 :{template.config.defaultPort}</span>
                  <span>{authConfig.icon} {authConfig.label}</span>
                  <span>📊 {template.usageCount}회</span>
                  {template.config.jumpHost && <span>🚀 점프호스트</span>}
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <span style={{ marginRight: '12px' }}>🎨 {template.terminalSettings.colorScheme}</span>
                  <span style={{ marginRight: '12px' }}>📝 {template.terminalSettings.fontFamily}</span>
                  <span>{template.terminalSettings.fontSize}px</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTemplate && (
        <div className="modal-overlay active" onClick={() => setSelectedTemplate(null)}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{getTypeConfig(selectedTemplate.type).icon} {selectedTemplate.name}</h3>
              <button className="modal-close" onClick={() => setSelectedTemplate(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedTemplate.description && <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>{selectedTemplate.description}</div>}
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', background: `${getTypeConfig(selectedTemplate.type).color}20`, color: getTypeConfig(selectedTemplate.type).color, borderRadius: '6px' }}>{getTypeConfig(selectedTemplate.type).label}</span>
                <span style={{ padding: '4px 10px', background: `${getOsConfig(selectedTemplate.os).color}20`, color: getOsConfig(selectedTemplate.os).color, borderRadius: '6px' }}>{getOsConfig(selectedTemplate.os).icon} {getOsConfig(selectedTemplate.os).label}</span>
                {selectedTemplate.isDefault && <span style={{ padding: '4px 10px', background: '#10b98120', color: '#10b981', borderRadius: '6px' }}>기본 템플릿</span>}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>연결 설정</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>포트:</span> {selectedTemplate.config.defaultPort}</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>인증:</span> {getAuthConfig(selectedTemplate.config.authType).label}</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>타임아웃:</span> {selectedTemplate.config.timeout}s</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Keep-Alive:</span> {selectedTemplate.config.keepAlive ? '✓' : '✗'}</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>압축:</span> {selectedTemplate.config.compression ? '✓' : '✗'}</div>
                  {selectedTemplate.config.jumpHost && <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>점프호스트:</span> {selectedTemplate.config.jumpHost}</div>}
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>터미널 설정</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  {selectedTemplate.terminalSettings.shell && <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>쉘:</span> {selectedTemplate.terminalSettings.shell}</div>}
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>테마:</span> {selectedTemplate.terminalSettings.colorScheme}</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>폰트:</span> {selectedTemplate.terminalSettings.fontFamily}</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>크기:</span> {selectedTemplate.terminalSettings.fontSize}px</div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>스크롤백:</span> {selectedTemplate.terminalSettings.scrollback.toLocaleString()}</div>
                </div>
              </div>
              
              {selectedTemplate.config.initCommands && selectedTemplate.config.initCommands.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>초기화 명령어</div>
                  <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {selectedTemplate.config.initCommands.map((cmd, i) => <div key={i}>$ {cmd}</div>)}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">📋 복제</button>
              <button className="btn btn-primary">✏️ 편집</button>
              <button className="btn btn-ghost" onClick={() => setSelectedTemplate(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">+ 템플릿 생성</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">템플릿 이름</label>
                <input type="text" className="form-input" placeholder="템플릿 이름 입력" />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <textarea className="form-input" rows={2} placeholder="템플릿 설명" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">연결 유형</label>
                  <select className="form-input">
                    <option value="SSH">SSH</option>
                    <option value="SFTP">SFTP</option>
                    <option value="RDGATEWAY">RD Gateway</option>
                    <option value="DATABASE">Database</option>
                    <option value="KUBERNETES">Kubernetes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">OS</label>
                  <select className="form-input">
                    <option value="LINUX">Linux</option>
                    <option value="WINDOWS">Windows</option>
                    <option value="MACOS">macOS</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">기본 포트</label>
                  <input type="number" className="form-input" defaultValue={22} />
                </div>
                <div className="form-group">
                  <label className="form-label">인증 방식</label>
                  <select className="form-input">
                    <option value="KEY">SSH 키</option>
                    <option value="PASSWORD">패스워드</option>
                    <option value="CERTIFICATE">인증서</option>
                    <option value="MFA">MFA</option>
                  </select>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" />
                <span>기본 템플릿으로 설정</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>취소</button>
              <button className="btn btn-primary">생성</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface TerminalTheme {
  id: string;
  name: string;
  description: string;
  type: 'LIGHT' | 'DARK' | 'HIGH_CONTRAST';
  colors: { background: string; foreground: string; cursor: string; selection: string; black: string; red: string; green: string; yellow: string; blue: string; };
  font: { family: string; size: number; lineHeight: number };
  isDefault: boolean;
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
}

export default function TerminalThemesPage() {
  const [themes, setThemes] = useState<TerminalTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<TerminalTheme | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', description: '', type: 'DARK', background: '#1e1e2e', foreground: '#cdd6f4', cursor: '#f5e0dc', fontFamily: 'JetBrains Mono', fontSize: 14 });

  useEffect(() => {
    setThemes([
      { id: '1', name: 'Catppuccin Mocha', description: '편안한 파스텔 다크 테마', type: 'DARK', colors: { background: '#1e1e2e', foreground: '#cdd6f4', cursor: '#f5e0dc', selection: '#45475a', black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af', blue: '#89b4fa' }, font: { family: 'JetBrains Mono', size: 14, lineHeight: 1.5 }, isDefault: true, isSystem: true, usageCount: 1250, createdAt: '2025-01-01' },
      { id: '2', name: 'Tokyo Night', description: '도쿄의 밤을 테마로 한 다크 모드', type: 'DARK', colors: { background: '#1a1b26', foreground: '#a9b1d6', cursor: '#c0caf5', selection: '#33467c', black: '#414868', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68', blue: '#7aa2f7' }, font: { family: 'Fira Code', size: 14, lineHeight: 1.4 }, isDefault: false, isSystem: true, usageCount: 890, createdAt: '2025-01-01' },
      { id: '3', name: 'One Dark Pro', description: 'Atom 에디터 기반 다크 테마', type: 'DARK', colors: { background: '#282c34', foreground: '#abb2bf', cursor: '#528bff', selection: '#3e4451', black: '#5c6370', red: '#e06c75', green: '#98c379', yellow: '#e5c07b', blue: '#61afef' }, font: { family: 'Source Code Pro', size: 13, lineHeight: 1.5 }, isDefault: false, isSystem: true, usageCount: 650, createdAt: '2025-01-01' },
      { id: '4', name: 'Solarized Light', description: '눈이 편안한 라이트 테마', type: 'LIGHT', colors: { background: '#fdf6e3', foreground: '#657b83', cursor: '#268bd2', selection: '#eee8d5', black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900', blue: '#268bd2' }, font: { family: 'IBM Plex Mono', size: 14, lineHeight: 1.5 }, isDefault: false, isSystem: true, usageCount: 320, createdAt: '2025-01-01' },
      { id: '5', name: 'High Contrast', description: '시인성 높은 고대비 테마', type: 'HIGH_CONTRAST', colors: { background: '#000000', foreground: '#ffffff', cursor: '#00ff00', selection: '#444444', black: '#000000', red: '#ff0000', green: '#00ff00', yellow: '#ffff00', blue: '#0000ff' }, font: { family: 'Consolas', size: 15, lineHeight: 1.6 }, isDefault: false, isSystem: true, usageCount: 85, createdAt: '2025-01-01' },
      { id: '6', name: '커스텀 블루', description: '사용자 정의 블루 테마', type: 'DARK', colors: { background: '#0d1117', foreground: '#c9d1d9', cursor: '#58a6ff', selection: '#264f78', black: '#484f58', red: '#ff7b72', green: '#7ee787', yellow: '#d29922', blue: '#58a6ff' }, font: { family: 'JetBrains Mono', size: 14, lineHeight: 1.5 }, isDefault: false, isSystem: false, usageCount: 45, createdAt: '2025-08-15' },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); setThemes([{ id: String(Date.now()), name: form.name, description: form.description, type: form.type as TerminalTheme['type'], colors: { background: form.background, foreground: form.foreground, cursor: form.cursor, selection: '#333333', black: '#000000', red: '#ff0000', green: '#00ff00', yellow: '#ffff00', blue: '#0000ff' }, font: { family: form.fontFamily, size: form.fontSize, lineHeight: 1.5 }, isDefault: false, isSystem: false, usageCount: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...themes]); setSuccess('테마 생성됨'); setShowCreate(false); setForm({ name: '', description: '', type: 'DARK', background: '#1e1e2e', foreground: '#cdd6f4', cursor: '#f5e0dc', fontFamily: 'JetBrains Mono', fontSize: 14 }); };
  const handleSetDefault = (t: TerminalTheme) => { setThemes(themes.map(theme => ({ ...theme, isDefault: theme.id === t.id }))); setSuccess(`${t.name} 기본 테마로 설정됨`); };
  const handleDelete = (id: string) => { const t = themes.find(th => th.id === id); if (t?.isSystem) { alert('시스템 테마는 삭제할 수 없습니다'); return; } if (t?.isDefault) { alert('기본 테마는 삭제할 수 없습니다'); return; } if (confirm('삭제?')) { setThemes(themes.filter(th => th.id !== id)); setSuccess('삭제됨'); setSelectedTheme(null); } };
  const handleDuplicate = (t: TerminalTheme) => { setThemes([{ ...t, id: String(Date.now()), name: `${t.name} (복제)`, isDefault: false, isSystem: false, usageCount: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...themes]); setSuccess('복제됨'); };

  const getTypeColor = (t: string) => ({ LIGHT: '#f59e0b', DARK: '#6366f1', HIGH_CONTRAST: '#10b981' }[t] || '#6b7280');
  const getTypeLabel = (t: string) => ({ LIGHT: '라이트', DARK: '다크', HIGH_CONTRAST: '고대비' }[t] || t);

  return (
    <AdminLayout title="터미널 테마" description="터미널 색상 및 폰트 테마 관리" actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 테마</button>}>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      <div className="dashboard-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">총 테마</div><div className="stat-value">{themes.length}</div></div>
        <div className="stat-card"><div className="stat-label">🌙 다크</div><div className="stat-value">{themes.filter(t => t.type === 'DARK').length}</div></div>
        <div className="stat-card"><div className="stat-label">☀️ 라이트</div><div className="stat-value">{themes.filter(t => t.type === 'LIGHT').length}</div></div>
        <div className="stat-card"><div className="stat-label">👤 커스텀</div><div className="stat-value">{themes.filter(t => !t.isSystem).length}</div></div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {themes.map(t => (
            <div key={t.id} className="card" style={{ cursor: 'pointer', border: t.isDefault ? '2px solid var(--color-primary)' : undefined }} onClick={() => setSelectedTheme(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><span style={{ fontWeight: 700 }}>{t.name}</span>{t.isDefault && <span style={{ marginLeft: 8, padding: '2px 6px', background: 'var(--color-primary)', color: '#fff', borderRadius: 4, fontSize: '0.7rem' }}>기본</span>}{t.isSystem && <span style={{ marginLeft: 4, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>시스템</span>}</div>
                <span style={{ padding: '2px 8px', background: `${getTypeColor(t.type)}20`, color: getTypeColor(t.type), borderRadius: 4, fontSize: '0.75rem' }}>{getTypeLabel(t.type)}</span>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: t.colors.background, color: t.colors.foreground, fontFamily: t.font.family, fontSize: t.font.size, marginBottom: 12 }}>
                <div>$ ssh user@server</div><div style={{ color: t.colors.green }}>Connected to server</div><div><span style={{ color: t.colors.blue }}>user</span>@<span style={{ color: t.colors.yellow }}>server</span>:~$ <span style={{ background: t.colors.cursor, width: 8, display: 'inline-block' }}>&nbsp;</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><span>{t.font.family} {t.font.size}px</span><span>사용: {t.usageCount}</span></div>
            </div>
          ))}
        </div>
      )}
      {selectedTheme && (
        <div className="modal-overlay active" onClick={() => setSelectedTheme(null)}><div className="modal" style={{ maxWidth: 550 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🎨 {selectedTheme.name}</h3><button className="modal-close" onClick={() => setSelectedTheme(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><span style={{ padding: '4px 10px', background: `${getTypeColor(selectedTheme.type)}20`, color: getTypeColor(selectedTheme.type), borderRadius: 6 }}>{getTypeLabel(selectedTheme.type)}</span>{selectedTheme.isDefault && <span style={{ padding: '4px 10px', background: 'var(--color-primary)', color: '#fff', borderRadius: 6 }}>기본</span>}{selectedTheme.isSystem && <span style={{ padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>시스템</span>}</div>
            <div style={{ marginBottom: 12 }}>{selectedTheme.description}</div>
            <div style={{ padding: 16, borderRadius: 8, background: selectedTheme.colors.background, color: selectedTheme.colors.foreground, fontFamily: selectedTheme.font.family, fontSize: selectedTheme.font.size, marginBottom: 16 }}>
              <div>$ echo &quot;Hello, World!&quot;</div><div style={{ color: selectedTheme.colors.green }}>Hello, World!</div><div><span style={{ color: selectedTheme.colors.red }}>error:</span> something went wrong</div><div><span style={{ color: selectedTheme.colors.yellow }}>warning:</span> check this</div>
            </div>
            <div style={{ marginBottom: 12 }}><b>색상:</b></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>{Object.entries(selectedTheme.colors).map(([key, val]) => <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 20, height: 20, background: val, borderRadius: 4, border: '1px solid var(--color-border)' }} /><span style={{ fontSize: '0.8rem' }}>{key}</span></div>)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><b>폰트:</b> {selectedTheme.font.family}</div><div><b>크기:</b> {selectedTheme.font.size}px</div><div><b>사용:</b> {selectedTheme.usageCount.toLocaleString()}</div><div><b>생성:</b> {selectedTheme.createdAt}</div></div>
          </div>
          <div className="modal-footer">{!selectedTheme.isDefault && <button className="btn btn-primary" onClick={() => handleSetDefault(selectedTheme)}>⭐ 기본으로 설정</button>}<button className="btn btn-secondary" onClick={() => handleDuplicate(selectedTheme)}>📋 복제</button>{!selectedTheme.isSystem && <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(selectedTheme.id)}>🗑️</button>}<button className="btn btn-ghost" onClick={() => setSelectedTheme(null)}>닫기</button></div>
        </div></div>
      )}
      {showCreate && (
        <div className="modal-overlay active" onClick={() => setShowCreate(false)}><div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">🎨 테마 생성</h3><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <form onSubmit={handleCreate}><div className="modal-body">
            <div className="form-group"><label className="form-label">테마 이름</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">설명</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">유형</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="DARK">다크</option><option value="LIGHT">라이트</option><option value="HIGH_CONTRAST">고대비</option></select></div>
              <div className="form-group"><label className="form-label">폰트</label><select className="form-input" value={form.fontFamily} onChange={e => setForm({ ...form, fontFamily: e.target.value })}><option>JetBrains Mono</option><option>Fira Code</option><option>Source Code Pro</option><option>IBM Plex Mono</option><option>Consolas</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <div className="form-group"><label className="form-label">배경</label><input type="color" className="form-input" value={form.background} onChange={e => setForm({ ...form, background: e.target.value })} style={{ height: 38, padding: 2 }} /></div>
              <div className="form-group"><label className="form-label">글자</label><input type="color" className="form-input" value={form.foreground} onChange={e => setForm({ ...form, foreground: e.target.value })} style={{ height: 38, padding: 2 }} /></div>
              <div className="form-group"><label className="form-label">커서</label><input type="color" className="form-input" value={form.cursor} onChange={e => setForm({ ...form, cursor: e.target.value })} style={{ height: 38, padding: 2 }} /></div>
              <div className="form-group"><label className="form-label">크기</label><input type="number" className="form-input" value={form.fontSize} onChange={e => setForm({ ...form, fontSize: parseInt(e.target.value) })} min={10} max={24} /></div>
            </div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button><button type="submit" className="btn btn-primary">생성</button></div></form>
        </div></div>
      )}
    </AdminLayout>
  );
}

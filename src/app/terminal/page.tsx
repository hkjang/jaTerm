'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import DemoTerminal from '@/components/terminal/DemoTerminal';
import { TerminalTab } from '@/lib/terminal/types';

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  status: 'online' | 'offline' | 'maintenance';
  tags?: string[];
}

interface EnhancedTab extends TerminalTab {
  canReconnect: boolean;
  lastConnectedAt?: Date;
  commandCount: number;
}

interface ContextMenu {
  tabId: string;
  x: number;
  y: number;
}

const DEMO_SERVERS: Server[] = [
  { id: '1', name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD', status: 'online', tags: ['nginx', 'frontend'] },
  { id: '2', name: 'prod-api-01', hostname: '192.168.1.11', environment: 'PROD', status: 'online', tags: ['nodejs', 'api'] },
  { id: '3', name: 'prod-db-01', hostname: '192.168.1.12', environment: 'PROD', status: 'online', tags: ['mysql', 'database'] },
  { id: '4', name: 'stage-web-01', hostname: '192.168.2.10', environment: 'STAGE', status: 'online', tags: ['nginx'] },
  { id: '5', name: 'stage-api-01', hostname: '192.168.2.11', environment: 'STAGE', status: 'online', tags: ['nodejs'] },
  { id: '6', name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV', status: 'online', tags: ['dev'] },
  { id: '7', name: 'dev-database', hostname: '192.168.3.20', environment: 'DEV', status: 'maintenance', tags: ['mysql'] },
];

// Keyboard shortcut hints
const SHORTCUTS = [
  { keys: 'Ctrl+T', action: '새 탭' },
  { keys: 'Ctrl+W', action: '탭 닫기' },
  { keys: 'Ctrl+Tab', action: '다음 탭' },
  { keys: 'Ctrl+Shift+Tab', action: '이전 탭' },
  { keys: 'Ctrl+1-9', action: '탭 전환' },
  { keys: 'Ctrl+\\', action: '분할 보기' },
];

export default function TerminalPage() {
  const [tabs, setTabs] = useState<EnhancedTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [splitMode, setSplitMode] = useState<'none' | 'horizontal' | 'vertical'>('none');
  const [secondaryTabId, setSecondaryTabId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: Show quick connect
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowQuickConnect(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      // Ctrl+W: Close current tab
      if (e.ctrlKey && e.key === 'w' && activeTabId) {
        e.preventDefault();
        handleTabClose(activeTabId);
      }
      // Ctrl+Tab: Next tab
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        navigateTab(1);
      }
      // Ctrl+Shift+Tab: Previous tab
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        navigateTab(-1);
      }
      // Ctrl+1-9: Switch to tab
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          setActiveTabId(tabs[index].id);
        }
      }
      // Ctrl+\: Toggle split view
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        toggleSplitView();
      }
      // Escape: Close context menu or quick connect
      if (e.key === 'Escape') {
        setContextMenu(null);
        setShowQuickConnect(false);
        setShowShortcuts(false);
      }
      // Ctrl+K: Focus search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // ?: Show shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.altKey && document.activeElement?.tagName !== 'INPUT') {
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const navigateTab = (direction: number) => {
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = tabs.length - 1;
    if (newIndex >= tabs.length) newIndex = 0;
    setActiveTabId(tabs[newIndex].id);
  };

  const toggleSplitView = () => {
    if (splitMode === 'none') {
      setSplitMode('vertical');
      // Set secondary tab to second tab if available
      if (tabs.length > 1 && activeTabId) {
        const otherTab = tabs.find(t => t.id !== activeTabId);
        setSecondaryTabId(otherTab?.id || null);
      }
    } else if (splitMode === 'vertical') {
      setSplitMode('horizontal');
    } else {
      setSplitMode('none');
      setSecondaryTabId(null);
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
  };

  const canAccessServer = (server: Server) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'OPERATOR') return true;
    if (user.role === 'DEVELOPER' && server.environment !== 'PROD') return true;
    return false;
  };

  const getStatusIcon = (status: EnhancedTab['status']) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      case 'error': return '⚠️';
      default: return '⚪';
    }
  };

  // Filter servers based on search
  const filteredServers = DEMO_SERVERS.filter(server => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(query) ||
      server.hostname.toLowerCase().includes(query) ||
      server.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Handle server selection
  const handleServerSelect = useCallback((server: Server) => {
    const existingTab = tabs.find(t => t.serverId === server.id);
    
    if (existingTab) {
      if (existingTab.status === 'connected' || existingTab.status === 'connecting') {
        setActiveTabId(existingTab.id);
        return;
      }
      setTabs(prev => prev.map(t => 
        t.id === existingTab.id 
          ? { ...t, status: 'connecting' as const, canReconnect: false }
          : t
      ));
      setActiveTabId(existingTab.id);
      setTimeout(() => {
        setTabs(prev => prev.map(t => 
          t.id === existingTab.id 
            ? { ...t, status: 'connected' as const, lastConnectedAt: new Date() }
            : t
        ));
      }, 1000);
      return;
    }

    const newTab: EnhancedTab = {
      id: `tab-${Date.now()}`,
      serverId: server.id,
      serverName: server.name,
      hostname: server.hostname,
      environment: server.environment,
      status: 'connecting',
      isRecording: true,
      startedAt: new Date(),
      connectionQuality: 'excellent',
      canReconnect: false,
      lastConnectedAt: undefined,
      commandCount: 0,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setShowQuickConnect(false);
    setSearchQuery('');

    setTimeout(() => {
      setTabs(prev => prev.map(t => 
        t.id === newTab.id 
          ? { ...t, status: 'connected' as const, lastConnectedAt: new Date() }
          : t
      ));
    }, 1000);
  }, [tabs]);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
        setSplitMode('none');
      }
      if (secondaryTabId === tabId) {
        setSecondaryTabId(null);
        setSplitMode('none');
      }
      return newTabs;
    });
  }, [activeTabId, secondaryTabId]);

  const handleCloseOtherTabs = useCallback((tabId: string) => {
    setTabs(prev => prev.filter(t => t.id === tabId));
    setActiveTabId(tabId);
    setSplitMode('none');
    setSecondaryTabId(null);
  }, []);

  const handleCloseAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
    setSplitMode('none');
    setSecondaryTabId(null);
  }, []);

  const handleReconnect = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId 
        ? { ...t, status: 'connecting' as const, canReconnect: false }
        : t
    ));
    setTimeout(() => {
      setTabs(prev => prev.map(t => 
        t.id === tabId 
          ? { ...t, status: 'connected' as const, lastConnectedAt: new Date() }
          : t
      ));
    }, 1000);
  }, []);

  const handleDisconnect = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId 
        ? { ...t, status: 'disconnected' as const, canReconnect: true }
        : t
    ));
  }, []);

  const handleDuplicateTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const server = DEMO_SERVERS.find(s => s.id === tab.serverId);
    if (server) {
      // Create a new tab with unique ID
      const newTab: EnhancedTab = {
        ...tab,
        id: `tab-${Date.now()}`,
        startedAt: new Date(),
        status: 'connecting',
        commandCount: 0,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      
      setTimeout(() => {
        setTabs(prev => prev.map(t => 
          t.id === newTab.id 
            ? { ...t, status: 'connected' as const, lastConnectedAt: new Date() }
            : t
        ));
      }, 1000);
    }
  }, [tabs]);

  const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  const activeTab = tabs.find(t => t.id === activeTabId);
  const secondaryTab = tabs.find(t => t.id === secondaryTabId);

  const formatConnectionTime = (date?: Date) => {
    if (!date) return '연결 중...';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}시간 ${mins % 60}분`;
    if (mins > 0) return `${mins}분`;
    return `${diff}초`;
  };

  const renderTerminalPanel = (tab: EnhancedTab | undefined, isPrimary: boolean = true) => {
    if (!tab) return null;

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Panel Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '8px',
          borderLeft: `3px solid ${getEnvironmentColor(tab.environment)}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: getEnvironmentColor(tab.environment) + '20',
              color: getEnvironmentColor(tab.environment)
            }}>
              {tab.environment}
            </span>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tab.serverName}</span>
              <span style={{ 
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                marginLeft: '8px'
              }}>
                {tab.hostname}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Connection Stats */}
            {tab.status === 'connected' && (
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span title="연결 시간">⏱️ {formatConnectionTime(tab.lastConnectedAt)}</span>
                <span title="명령어 수">📝 {tab.commandCount}</span>
                {tab.isRecording && (
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                    REC
                  </span>
                )}
              </div>
            )}
            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {tab.status === 'connected' && (
                <>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    title="분할 보기에 추가 (Ctrl+\\)"
                    onClick={() => {
                      if (splitMode === 'none') {
                        setSplitMode('vertical');
                        setSecondaryTabId(tab.id);
                      } else if (isPrimary) {
                        setSecondaryTabId(tab.id);
                      } else {
                        setActiveTabId(tab.id);
                      }
                    }}
                    style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                  >
                    ⊞
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDisconnect(tab.id)}
                    style={{ color: 'var(--color-warning)', fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    연결 끊기
                  </button>
                </>
              )}
              {tab.status === 'disconnected' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleReconnect(tab.id)}
                  style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                >
                  🔄 재연결
                </button>
              )}
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => handleTabClose(tab.id)}
                style={{ color: 'var(--color-danger)', fontSize: '0.8rem', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {tab.status === 'connected' ? (
            <DemoTerminal 
              key={tab.id}
              serverId={tab.serverId}
              serverName={tab.serverName}
            />
          ) : tab.status === 'connecting' ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              background: 'var(--terminal-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }} />
              <div style={{ color: 'var(--color-text-secondary)' }}>
                {tab.serverName}에 연결 중...
              </div>
            </div>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '20px',
              background: 'var(--terminal-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '3rem' }}>🔌</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  연결이 끊어졌습니다
                </div>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                  {tab.serverName}과의 연결이 종료되었습니다.
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleReconnect(tab.id)}
                >
                  🔄 재연결
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '0',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        height: '100vh',
        overflow: 'hidden',
        transition: 'width var(--transition-normal)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{ 
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link href="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            textDecoration: 'none'
          }}>
            <div className="header-logo-icon" style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>⌘</div>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>jaTerm</span>
          </Link>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setShowShortcuts(prev => !prev)}
            title="단축키 보기 (?)"
            style={{ padding: '4px 6px', fontSize: '0.75rem' }}
          >
            ⌨️
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div style={{ 
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
              </div>
              <span className={`badge badge-${user.role === 'ADMIN' ? 'danger' : user.role === 'OPERATOR' ? 'warning' : 'info'}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="서버 검색... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ 
                fontSize: '0.8rem', 
                padding: '8px 12px 8px 32px',
                background: 'var(--color-bg-tertiary)'
              }}
            />
            <span style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem'
            }}>
              🔍
            </span>
          </div>
        </div>

        {/* Server List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {['PROD', 'STAGE', 'DEV'].map(env => {
            const serversInEnv = filteredServers.filter(s => s.environment === env);
            if (serversInEnv.length === 0) return null;
            
            return (
              <div key={env} style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '4px 0'
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: getEnvironmentColor(env) 
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {env === 'PROD' ? 'Production' : env === 'STAGE' ? 'Staging' : 'Development'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                    {serversInEnv.length}
                  </span>
                </div>

                {serversInEnv.map(server => {
                  const canAccess = canAccessServer(server);
                  const serverTab = tabs.find(t => t.serverId === server.id);
                  const isActive = activeTab?.serverId === server.id;
                  
                  return (
                    <button
                      key={server.id}
                      onClick={() => canAccess && server.status === 'online' && handleServerSelect(server)}
                      disabled={!canAccess || server.status !== 'online'}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        marginBottom: '3px',
                        background: isActive ? `${getEnvironmentColor(server.environment)}15` : serverTab ? 'var(--color-surface)' : 'transparent',
                        border: isActive ? `1px solid ${getEnvironmentColor(server.environment)}50` : '1px solid transparent',
                        borderRadius: 'var(--radius-sm)',
                        cursor: canAccess && server.status === 'online' ? 'pointer' : 'not-allowed',
                        opacity: canAccess && server.status === 'online' ? 1 : 0.5,
                        textAlign: 'left',
                        color: 'inherit',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {serverTab && (
                            <span style={{ fontSize: '0.65rem' }}>{getStatusIcon(serverTab.status)}</span>
                          )}
                          <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 500,
                            color: isActive ? getEnvironmentColor(server.environment) : 'var(--color-text-primary)'
                          }}>
                            {server.name}
                          </span>
                        </div>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: server.status === 'online' ? 'var(--color-success)' : 
                                     server.status === 'maintenance' ? 'var(--color-warning)' : 'var(--color-danger)'
                        }} />
                      </div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '2px'
                      }}>
                        {server.hostname}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
          
          {filteredServers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              검색 결과가 없습니다
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div style={{ 
          padding: '12px 16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <Link href="/admin" className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '0.8rem' }}>
            관리자 대시보드
          </Link>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            style={{ width: '100%', fontSize: '0.8rem' }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <header style={{
          height: '44px',
          background: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '12px'
        }}>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ padding: '4px 8px' }}
          >
            ☰
          </button>

          {/* Split View Controls */}
          {tabs.length > 1 && (
            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
              <button 
                className={`btn btn-ghost btn-sm`}
                onClick={() => setSplitMode('none')}
                style={{ 
                  padding: '4px 8px', 
                  background: splitMode === 'none' ? 'var(--color-surface-active)' : 'transparent',
                  fontSize: '0.85rem'
                }}
                title="단일 뷰"
              >
                ▢
              </button>
              <button 
                className={`btn btn-ghost btn-sm`}
                onClick={() => {
                  setSplitMode('vertical');
                  if (!secondaryTabId && tabs.length > 1) {
                    setSecondaryTabId(tabs.find(t => t.id !== activeTabId)?.id || null);
                  }
                }}
                style={{ 
                  padding: '4px 8px', 
                  background: splitMode === 'vertical' ? 'var(--color-surface-active)' : 'transparent',
                  fontSize: '0.85rem'
                }}
                title="좌우 분할 (Ctrl+\\)"
              >
                ⧈
              </button>
              <button 
                className={`btn btn-ghost btn-sm`}
                onClick={() => {
                  setSplitMode('horizontal');
                  if (!secondaryTabId && tabs.length > 1) {
                    setSecondaryTabId(tabs.find(t => t.id !== activeTabId)?.id || null);
                  }
                }}
                style={{ 
                  padding: '4px 8px', 
                  background: splitMode === 'horizontal' ? 'var(--color-surface-active)' : 'transparent',
                  fontSize: '0.85rem'
                }}
                title="상하 분할"
              >
                ⬓
              </button>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Session Counter */}
          {tabs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <span>{tabs.filter(t => t.status === 'connected').length}/{tabs.length} 연결</span>
              {tabs.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleCloseAllTabs}
                  style={{ padding: '2px 6px', fontSize: '0.7rem', color: 'var(--color-danger)' }}
                  title="모든 탭 닫기"
                >
                  전체 닫기
                </button>
              )}
            </div>
          )}
        </header>

        {/* Tab Bar */}
        {tabs.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '38px',
            background: 'var(--color-bg-tertiary)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 8px',
            gap: '2px',
            overflowX: 'auto'
          }}>
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                draggable
                onDragStart={() => setDraggedTabId(tab.id)}
                onDragEnd={() => setDraggedTabId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: tab.id === activeTabId ? 'var(--color-bg-secondary)' : 
                             tab.id === secondaryTabId ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                  border: tab.id === activeTabId ? `1px solid ${getEnvironmentColor(tab.environment)}` : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                  minWidth: '120px',
                  maxWidth: '180px',
                  opacity: draggedTabId === tab.id ? 0.5 : 1,
                  boxShadow: tab.id === activeTabId ? `0 0 8px ${getEnvironmentColor(tab.environment)}30` : 'none'
                }}
              >
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: getEnvironmentColor(tab.environment) + '20',
                  color: getEnvironmentColor(tab.environment)
                }}>
                  {tab.environment.charAt(0)}
                </span>
                <span style={{ fontSize: '0.65rem' }}>{getStatusIcon(tab.status)}</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: tab.id === activeTabId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {tab.serverName}
                </span>
                {tab.isRecording && tab.status === 'connected' && (
                  <span style={{
                    width: '5px',
                    height: '5px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }} />
                )}
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginLeft: '2px' }}>
                  {index + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTabClose(tab.id);
                  }}
                  style={{
                    width: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '3px',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all var(--transition-fast)',
                    opacity: 0.6
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                >
                  ×
                </button>
              </div>
            ))}
            <button 
              onClick={() => {
                setShowQuickConnect(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              style={{
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                marginLeft: '4px',
                fontSize: '1rem'
              }}
              title="새 세션 (Ctrl+T)"
            >
              +
            </button>
          </div>
        )}

        {/* Terminal Area */}
        <div style={{ flex: 1, padding: '12px', overflow: 'hidden' }}>
          {activeTab ? (
            splitMode === 'none' ? (
              renderTerminalPanel(activeTab, true)
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: splitMode === 'horizontal' ? 'column' : 'row',
                gap: '8px',
                height: '100%'
              }}>
                <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                  {renderTerminalPanel(activeTab, true)}
                </div>
                <div style={{ 
                  width: splitMode === 'vertical' ? '1px' : '100%',
                  height: splitMode === 'horizontal' ? '1px' : '100%',
                  background: 'var(--color-border)'
                }} />
                <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                  {secondaryTab ? (
                    renderTerminalPanel(secondaryTab, false)
                  ) : (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '16px',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px dashed var(--color-border)'
                    }}>
                      <div style={{ fontSize: '2rem' }}>⊞</div>
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <div style={{ marginBottom: '8px' }}>세션을 선택하세요</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {tabs.filter(t => t.id !== activeTabId).slice(0, 3).map(t => (
                            <button
                              key={t.id}
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSecondaryTabId(t.id)}
                              style={{ fontSize: '0.75rem' }}
                            >
                              {t.serverName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div style={{ 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '24px',
              color: 'var(--color-text-muted)'
            }}>
              <div style={{ fontSize: '4rem' }}>🖥️</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  서버를 선택하세요
                </div>
                <div>좌측 목록에서 서버를 선택하거나 <kbd style={{ 
                  padding: '2px 6px', 
                  background: 'var(--color-surface)', 
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>Ctrl+T</kbd>를 눌러 빠른 연결을 사용하세요</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="btn btn-primary" onClick={() => setShowQuickConnect(true)}>
                  빠른 연결
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowShortcuts(true)}
                >
                  단축키 보기
                </button>
              </div>

              {!user && (
                <Link href="/login" className="btn btn-primary" style={{ marginTop: '8px' }}>
                  로그인하여 시작하기
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            minWidth: '160px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: '재연결', icon: '🔄', action: () => handleReconnect(contextMenu.tabId), show: tabs.find(t => t.id === contextMenu.tabId)?.status === 'disconnected' },
            { label: '연결 끊기', icon: '⏸️', action: () => handleDisconnect(contextMenu.tabId), show: tabs.find(t => t.id === contextMenu.tabId)?.status === 'connected' },
            { label: '탭 복제', icon: '📋', action: () => handleDuplicateTab(contextMenu.tabId), show: true },
            { label: '분할 보기에 추가', icon: '⊞', action: () => { setSecondaryTabId(contextMenu.tabId); setSplitMode('vertical'); }, show: tabs.length > 0 },
            { label: '다른 탭 닫기', icon: '🗑️', action: () => handleCloseOtherTabs(contextMenu.tabId), show: tabs.length > 1 },
            { label: '탭 닫기', icon: '✕', action: () => handleTabClose(contextMenu.tabId), show: true, danger: true },
          ].filter(item => item.show).map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); setContextMenu(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: item.danger ? 'var(--color-danger)' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textAlign: 'left',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div 
          className="modal-overlay active"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⌨️ 키보드 단축키</div>
              <button className="modal-close" onClick={() => setShowShortcuts(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SHORTCUTS.map((shortcut, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{shortcut.action}</span>
                    <kbd style={{ 
                      padding: '4px 8px', 
                      background: 'var(--color-surface)', 
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem'
                    }}>
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        kbd {
          border: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}

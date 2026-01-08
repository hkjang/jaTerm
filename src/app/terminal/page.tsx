'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DemoTerminal from '@/components/terminal/DemoTerminal';
import { TerminalTab } from '@/lib/terminal/types';

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  status: 'online' | 'offline' | 'maintenance';
}

interface EnhancedTab extends TerminalTab {
  canReconnect: boolean;
  lastConnectedAt?: Date;
}

const DEMO_SERVERS: Server[] = [
  { id: '1', name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD', status: 'online' },
  { id: '2', name: 'prod-api-01', hostname: '192.168.1.11', environment: 'PROD', status: 'online' },
  { id: '3', name: 'stage-web-01', hostname: '192.168.2.10', environment: 'STAGE', status: 'online' },
  { id: '4', name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV', status: 'online' },
  { id: '5', name: 'dev-database', hostname: '192.168.3.20', environment: 'DEV', status: 'maintenance' },
];

export default function TerminalPage() {
  const [tabs, setTabs] = useState<EnhancedTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
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

  // Handle server selection - create new tab or focus existing
  const handleServerSelect = useCallback((server: Server) => {
    // Check if already have a tab for this server
    const existingTab = tabs.find(t => t.serverId === server.id);
    
    if (existingTab) {
      // If connected, just focus
      if (existingTab.status === 'connected' || existingTab.status === 'connecting') {
        setActiveTabId(existingTab.id);
        return;
      }
      // If disconnected, reconnect
      setTabs(prev => prev.map(t => 
        t.id === existingTab.id 
          ? { ...t, status: 'connecting' as const, canReconnect: false }
          : t
      ));
      setActiveTabId(existingTab.id);
      // Simulate reconnection
      setTimeout(() => {
        setTabs(prev => prev.map(t => 
          t.id === existingTab.id 
            ? { ...t, status: 'connected' as const, lastConnectedAt: new Date() }
            : t
        ));
      }, 1000);
      return;
    }

    // Create new tab
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
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);

    // Simulate connection
    setTimeout(() => {
      setTabs(prev => prev.map(t => 
        t.id === newTab.id 
          ? { ...t, status: 'connected' as const, lastConnectedAt: new Date() }
          : t
      ));
    }, 1000);
  }, [tabs]);

  // Handle tab close
  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Handle reconnect
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

  // Handle disconnect
  const handleDisconnect = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId 
        ? { ...t, status: 'disconnected' as const, canReconnect: true }
        : t
    ));
  }, []);

  // Get active tab
  const activeTab = tabs.find(t => t.id === activeTabId);

  // Get server for active tab
  const activeServer = activeTab 
    ? DEMO_SERVERS.find(s => s.id === activeTab.serverId)
    : null;

  return (
    <div className="page-container" style={{ flexDirection: 'row' }}>
      {/* Sidebar - Server List */}
      <aside style={{
        width: sidebarOpen ? '280px' : '0',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        height: '100vh',
        overflow: 'hidden',
        transition: 'width var(--transition-normal)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          padding: '16px',
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
            <div className="header-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>⌘</div>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>jaTerm</span>
          </Link>
        </div>

        {/* User Info */}
        {user && (
          <div style={{ 
            padding: '16px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
            <span className={`badge badge-${user.role === 'ADMIN' ? 'danger' : user.role === 'OPERATOR' ? 'warning' : 'info'}`} style={{ marginTop: '8px' }}>
              {user.role}
            </span>
          </div>
        )}

        {/* Server List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <div style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            사용 가능한 서버
          </div>

          {['PROD', 'STAGE', 'DEV'].map(env => (
            <div key={env} style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px',
                padding: '6px 0'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: getEnvironmentColor(env) 
                }}></span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {env === 'PROD' ? 'Production' : env === 'STAGE' ? 'Staging' : 'Development'}
                </span>
              </div>

              {DEMO_SERVERS.filter(s => s.environment === env).map(server => {
                const canAccess = canAccessServer(server);
                const hasTab = tabs.some(t => t.serverId === server.id);
                const serverTab = tabs.find(t => t.serverId === server.id);
                const isConnected = serverTab?.status === 'connected';
                const isActive = activeTab?.serverId === server.id;
                
                return (
                  <button
                    key={server.id}
                    onClick={() => canAccess && server.status === 'online' && handleServerSelect(server)}
                    disabled={!canAccess || server.status !== 'online'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: '4px',
                      background: isActive ? 'var(--color-primary-glow)' : hasTab ? 'var(--color-surface)' : 'transparent',
                      border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                      borderRadius: 'var(--radius-md)',
                      cursor: canAccess && server.status === 'online' ? 'pointer' : 'not-allowed',
                      opacity: canAccess && server.status === 'online' ? 1 : 0.5,
                      textAlign: 'left',
                      color: 'inherit',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {hasTab && (
                          <span style={{ fontSize: '0.7rem' }}>
                            {getStatusIcon(serverTab?.status || 'disconnected')}
                          </span>
                        )}
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 500,
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)'
                        }}>
                          {server.name}
                        </span>
                      </div>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: server.status === 'online' ? 'var(--color-success)' : 
                                   server.status === 'maintenance' ? 'var(--color-warning)' : 'var(--color-danger)'
                      }}></span>
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {server.hostname}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div style={{ 
          padding: '16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <Link href="/admin" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
            관리자 대시보드
          </Link>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            style={{ width: '100%' }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <header style={{
          height: '50px',
          background: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '16px'
        }}>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div style={{ flex: 1 }} />

          {activeTab && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {tabs.length}개 세션 활성
              </span>
            </div>
          )}
        </header>

        {/* Tab Bar */}
        {tabs.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '44px',
            background: 'var(--color-bg-tertiary)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 8px',
            gap: '4px',
            overflowX: 'auto'
          }}>
            <div style={{ display: 'flex', flex: 1, overflowX: 'auto', gap: '4px', padding: '4px 0' }}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  draggable
                  onDragStart={() => setDraggedTabId(tab.id)}
                  onDragEnd={() => setDraggedTabId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: tab.id === activeTabId ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                    border: tab.id === activeTabId ? '1px solid var(--color-primary)' : '1px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                    minWidth: '140px',
                    maxWidth: '220px',
                    opacity: draggedTabId === tab.id ? 0.5 : 1,
                    boxShadow: tab.id === activeTabId ? '0 0 10px var(--color-primary-glow)' : 'none'
                  }}
                >
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: getEnvironmentColor(tab.environment) + '20',
                    color: getEnvironmentColor(tab.environment)
                  }}>
                    {tab.environment.charAt(0)}
                  </span>
                  <span style={{ fontSize: '0.7rem' }}>{getStatusIcon(tab.status)}</span>
                  <span style={{
                    fontSize: '0.8rem',
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
                      width: '6px',
                      height: '6px',
                      background: '#ef4444',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite'
                    }} title="녹화 중" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabClose(tab.id);
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all var(--transition-fast)'
                    }}
                    title="탭 닫기"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terminal Area */}
        <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
          {activeTab ? (
            <div style={{ height: '100%', position: 'relative' }}>
              {/* Active Tab Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: getEnvironmentColor(activeTab.environment) + '20',
                    color: getEnvironmentColor(activeTab.environment)
                  }}>
                    {activeTab.environment}
                  </span>
                  <span style={{ fontWeight: 600 }}>{activeTab.serverName}</span>
                  <span style={{ 
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem'
                  }}>
                    ({activeTab.hostname})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeTab.status === 'connected' && (
                    <>
                      <button className="btn btn-ghost btn-sm" title="Read Only Mode">
                        👁️ View Only
                      </button>
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => handleDisconnect(activeTab.id)}
                        style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
                      >
                        연결 끊기
                      </button>
                    </>
                  )}
                  {activeTab.status === 'disconnected' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleReconnect(activeTab.id)}
                    >
                      🔄 재연결
                    </button>
                  )}
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleTabClose(activeTab.id)}
                  >
                    세션 종료
                  </button>
                </div>
              </div>

              {/* Terminal or Disconnected State */}
              {activeTab.status === 'connected' ? (
                <div style={{ height: 'calc(100% - 60px)' }}>
                  <DemoTerminal 
                    key={activeTab.id}
                    serverId={activeTab.serverId}
                    serverName={activeTab.serverName}
                  />
                </div>
              ) : activeTab.status === 'connecting' ? (
                <div style={{
                  height: 'calc(100% - 60px)',
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
                    {activeTab.serverName}에 연결 중...
                  </div>
                </div>
              ) : (
                <div style={{
                  height: 'calc(100% - 60px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '24px',
                  background: 'var(--terminal-bg)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ fontSize: '4rem' }}>🔌</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                      연결이 끊어졌습니다
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      {activeTab.serverName}과의 연결이 종료되었습니다.
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleReconnect(activeTab.id)}
                    >
                      🔄 재연결
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                <div>좌측 목록에서 접속할 서버를 선택하면 터미널 탭이 열립니다.</div>
                <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                  여러 서버를 동시에 연결할 수 있습니다.
                </div>
              </div>

              {!user && (
                <Link href="/login" className="btn btn-primary">
                  로그인하여 시작하기
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

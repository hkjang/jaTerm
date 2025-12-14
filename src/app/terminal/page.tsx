'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DemoTerminal from '@/components/terminal/DemoTerminal';

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  status: 'online' | 'offline' | 'maintenance';
}

const DEMO_SERVERS: Server[] = [
  { id: '1', name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD', status: 'online' },
  { id: '2', name: 'prod-api-01', hostname: '192.168.1.11', environment: 'PROD', status: 'online' },
  { id: '3', name: 'stage-web-01', hostname: '192.168.2.10', environment: 'STAGE', status: 'online' },
  { id: '4', name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV', status: 'online' },
  { id: '5', name: 'dev-database', hostname: '192.168.3.20', environment: 'DEV', status: 'maintenance' },
];

export default function TerminalPage() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
                const isSelected = selectedServer?.id === server.id;
                
                return (
                  <button
                    key={server.id}
                    onClick={() => canAccess && server.status === 'online' && setSelectedServer(server)}
                    disabled={!canAccess || server.status !== 'online'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: '4px',
                      background: isSelected ? 'var(--color-primary-glow)' : 'transparent',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
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
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 500,
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)'
                      }}>
                        {server.name}
                      </span>
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

          {selectedServer && (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: getEnvironmentColor(selectedServer.environment) + '20',
                  color: getEnvironmentColor(selectedServer.environment)
                }}>
                  {selectedServer.environment}
                </span>
                <span style={{ fontWeight: 600 }}>{selectedServer.name}</span>
                <span style={{ 
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem'
                }}>
                  ({selectedServer.hostname})
                </span>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" title="Read Only Mode">
                  👁️ View Only
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => setSelectedServer(null)}
                >
                  연결 종료
                </button>
              </div>
            </>
          )}
        </header>

        {/* Terminal Area */}
        <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
          {selectedServer ? (
            <DemoTerminal 
              serverId={selectedServer.id}
              serverName={selectedServer.name}
            />
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
                <div>좌측 목록에서 접속할 서버를 선택하면 터미널이 열립니다.</div>
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
    </div>
  );
}

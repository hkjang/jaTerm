'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import DemoTerminal from '@/components/terminal/DemoTerminal';
import { TerminalTab } from '@/lib/terminal/types';
import { useServers, Server as ServerData } from '@/hooks/useServers';
import { useTerminalSessions, SessionRecording } from '@/hooks/useTerminalSessions';

// Extended Server interface for display (with runtime status)
interface Server extends Omit<ServerData, 'isActive'> {
  status: 'online' | 'offline' | 'maintenance';
  cpu?: number;
  memory?: number;
}

interface EnhancedTab extends TerminalTab {
  canReconnect: boolean;
  lastConnectedAt?: Date;
  commandCount: number;
  output?: string[];
}

interface ContextMenu {
  tabId: string;
  x: number;
  y: number;
}

interface QuickCommand {
  id: string;
  name: string;
  command: string;
  icon: string;
  color: string;
}

interface ConnectionHistory {
  serverId: string;
  serverName: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  connectedAt: Date;
}

const DEMO_SERVERS: Server[] = [
  { id: '1', name: 'prod-web-01', hostname: '192.168.1.10', environment: 'PROD', status: 'online', tags: ['nginx', 'frontend'], cpu: 45, memory: 62 },
  { id: '2', name: 'prod-api-01', hostname: '192.168.1.11', environment: 'PROD', status: 'online', tags: ['nodejs', 'api'], cpu: 78, memory: 85 },
  { id: '3', name: 'prod-db-01', hostname: '192.168.1.12', environment: 'PROD', status: 'online', tags: ['mysql', 'database'], cpu: 32, memory: 71 },
  { id: '4', name: 'stage-web-01', hostname: '192.168.2.10', environment: 'STAGE', status: 'online', tags: ['nginx'], cpu: 12, memory: 34 },
  { id: '5', name: 'stage-api-01', hostname: '192.168.2.11', environment: 'STAGE', status: 'online', tags: ['nodejs'], cpu: 23, memory: 45 },
  { id: '6', name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV', status: 'online', tags: ['dev'], cpu: 5, memory: 22 },
  { id: '7', name: 'dev-database', hostname: '192.168.3.20', environment: 'DEV', status: 'maintenance', tags: ['mysql'], cpu: 0, memory: 0 },
];

const QUICK_COMMANDS: QuickCommand[] = [
  { id: '1', name: '시스템 상태', command: 'top -b -n 1 | head -20', icon: '📊', color: '#10b981' },
  { id: '2', name: '디스크 사용량', command: 'df -h', icon: '💾', color: '#6366f1' },
  { id: '3', name: '로그 확인', command: 'tail -f /var/log/syslog', icon: '📜', color: '#f59e0b' },
  { id: '4', name: '프로세스 목록', command: 'ps aux | head -20', icon: '⚙️', color: '#8b5cf6' },
  { id: '5', name: '네트워크 상태', command: 'netstat -tulpn', icon: '🌐', color: '#ec4899' },
  { id: '6', name: '메모리 정보', command: 'free -h', icon: '🧠', color: '#14b8a6' },
];

const SESSION_RECORDINGS = [
  { id: '1', serverName: 'prod-web-01', date: '2026-01-08 15:30', duration: '00:45:23', size: '2.4 MB', user: 'admin' },
  { id: '2', serverName: 'prod-api-01', date: '2026-01-08 14:15', duration: '01:12:45', size: '4.1 MB', user: 'admin' },
  { id: '3', serverName: 'dev-server-01', date: '2026-01-07 10:00', duration: '00:23:10', size: '1.2 MB', user: 'developer' },
];

const CODE_SNIPPETS = [
  { id: '1', name: 'Git Pull & Restart', commands: ['cd /app', 'git pull origin main', 'pm2 restart all'], tags: ['deploy', 'git'] },
  { id: '2', name: 'Clear Cache', commands: ['redis-cli FLUSHALL', 'rm -rf /tmp/cache/*'], tags: ['cache', 'cleanup'] },
  { id: '3', name: 'Check Logs', commands: ['tail -100 /var/log/app.log', 'grep ERROR /var/log/app.log | tail -20'], tags: ['logs', 'debug'] },
  { id: '4', name: 'Database Backup', commands: ['mysqldump -u root -p dbname > backup.sql', 'gzip backup.sql'], tags: ['backup', 'mysql'] },
  { id: '5', name: 'SSL Certificate Check', commands: ['openssl s_client -connect localhost:443 -servername localhost 2>/dev/null | openssl x509 -noout -dates'], tags: ['ssl', 'security'] },
];

const SERVER_ALERTS = [
  { id: '1', serverId: '2', message: 'High CPU usage (78%)', severity: 'warning' as const, time: '2분 전' },
  { id: '2', serverId: '3', message: 'Disk space low (89%)', severity: 'critical' as const, time: '15분 전' },
];

const SHORTCUTS = [
  { keys: 'Ctrl+T', action: '새 탭' },
  { keys: 'Ctrl+W', action: '탭 닫기' },
  { keys: 'Ctrl+Tab', action: '다음 탭' },
  { keys: 'Ctrl+Shift+Tab', action: '이전 탭' },
  { keys: 'Ctrl+1-9', action: '탭 전환' },
  { keys: 'Ctrl+\\', action: '분할 보기' },
  { keys: 'Ctrl+K', action: '서버 검색' },
  { keys: 'Ctrl+B', action: '사이드바 토글' },
  { keys: 'Ctrl+P', action: '명령 팔레트' },
  { keys: 'Ctrl+Shift+B', action: '브로드캐스트 모드' },
];

const TERMINAL_THEMES = [
  { id: 'default', name: 'Default Dark', bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff' },
  { id: 'dracula', name: 'Dracula', bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9' },
  { id: 'monokai', name: 'Monokai', bg: '#272822', fg: '#f8f8f2', accent: '#a6e22e' },
  { id: 'nord', name: 'Nord', bg: '#2e3440', fg: '#eceff4', accent: '#88c0d0' },
  { id: 'solarized', name: 'Solarized Dark', bg: '#002b36', fg: '#839496', accent: '#2aa198' },
  { id: 'matrix', name: 'Matrix', bg: '#0d0208', fg: '#00ff41', accent: '#00ff41' },
];

const COMMAND_PALETTE_ACTIONS = [
  { id: 'new-tab', label: '새 터미널 탭', icon: '➕', shortcut: 'Ctrl+T' },
  { id: 'close-tab', label: '현재 탭 닫기', icon: '✕', shortcut: 'Ctrl+W' },
  { id: 'split-vertical', label: '좌우 분할', icon: '⧈', shortcut: 'Ctrl+\\' },
  { id: 'split-horizontal', label: '상하 분할', icon: '⬓', shortcut: '' },
  { id: 'toggle-sidebar', label: '사이드바 토글', icon: '☰', shortcut: 'Ctrl+B' },
  { id: 'clear-terminal', label: '터미널 클리어', icon: '🗑️', shortcut: '' },
  { id: 'broadcast-mode', label: '브로드캐스트 모드', icon: '📡', shortcut: 'Ctrl+Shift+B' },
  { id: 'export-session', label: '세션 내보내기', icon: '📥', shortcut: '' },
  { id: 'theme-settings', label: '테마 설정', icon: '🎨', shortcut: '' },
  { id: 'shortcuts', label: '단축키 보기', icon: '⌨️', shortcut: '?' },
];

export default function TerminalPage() {
  const [tabs, setTabs] = useState<EnhancedTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'servers' | 'history' | 'commands' | 'recordings' | 'snippets'>('servers');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [splitMode, setSplitMode] = useState<'none' | 'horizontal' | 'vertical'>('none');
  const [secondaryTabId, setSecondaryTabId] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showRecordingPlayer, setShowRecordingPlayer] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [connectionHistory, setConnectionHistory] = useState<ConnectionHistory[]>([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');
  const [pinnedCommands, setPinnedCommands] = useState<string[]>(['1', '2', '3']);
  const [terminalTheme, setTerminalTheme] = useState('default');
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [notifications, setNotifications] = useState<{id: string; message: string; type: 'success' | 'info' | 'warning'}[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandPaletteRef = useRef<HTMLInputElement>(null);

  // API Hooks - fetch servers and sessions from backend
  const { servers: apiServers, loading: serversLoading, error: serversError } = useServers({ autoRefresh: true, refreshInterval: 60000 });
  const { sessions, recordings, createSession, updateSessionStatus, terminateSession } = useTerminalSessions(user?.id);

  // Transform API servers to display format with simulated runtime stats
  const servers: Server[] = useMemo(() => {
    if (apiServers.length === 0) {
      // Fallback to demo data if no servers in database
      return DEMO_SERVERS;
    }
    return apiServers.map(s => ({
      ...s,
      status: s.isActive ? 'online' : 'offline',
      cpu: Math.floor(Math.random() * 80) + 10, // Simulated - would come from monitoring API
      memory: Math.floor(Math.random() * 70) + 20,
    })) as Server[];
  }, [apiServers]);

  // Transform session recordings from API
  const sessionRecordings = useMemo(() => {
    if (recordings.length === 0) {
      return SESSION_RECORDINGS; // Fallback to demo data
    }
    return recordings.map(r => ({
      id: r.id,
      serverName: r.server.name,
      date: new Date(r.createdAt).toLocaleString('ko-KR'),
      duration: r.duration ? formatDuration(r.duration) : '00:00:00',
      size: '-- MB',
      user: r.user.name || 'unknown',
    }));
  }, [recordings]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Load favorites from localStorage
    const storedFavorites = localStorage.getItem('terminal_favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    // Load history
    const storedHistory = localStorage.getItem('terminal_history');
    if (storedHistory) {
      setConnectionHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save favorites
  useEffect(() => {
    localStorage.setItem('terminal_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowQuickConnect(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.ctrlKey && e.key === 'w' && activeTabId) {
        e.preventDefault();
        handleTabClose(activeTabId);
      }
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        navigateTab(1);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        navigateTab(-1);
      }
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          setActiveTabId(tabs[index].id);
        }
      }
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        toggleSplitView();
      }
      if (e.key === 'Escape') {
        setContextMenu(null);
        setShowQuickConnect(false);
        setShowShortcuts(false);
        setCommandPaletteOpen(false);
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        setTimeout(() => commandPaletteRef.current?.focus(), 100);
      }
      if (e.key === '?' && !e.ctrlKey && !e.altKey && document.activeElement?.tagName !== 'INPUT') {
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Live resource update simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate CPU/memory fluctuation for demo
    }, 5000);
    return () => clearInterval(interval);
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

  const getResourceColor = (value: number) => {
    if (value >= 80) return '#ef4444';
    if (value >= 60) return '#f59e0b';
    return '#10b981';
  };

  const filteredServers = DEMO_SERVERS.filter(server => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(query) ||
      server.hostname.toLowerCase().includes(query) ||
      server.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const toggleFavorite = (serverId: string) => {
    setFavorites(prev => 
      prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

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

    // Add to history
    setConnectionHistory(prev => {
      const newHistory = [
        { serverId: server.id, serverName: server.name, environment: server.environment, connectedAt: new Date() },
        ...prev.filter(h => h.serverId !== server.id).slice(0, 9)
      ];
      localStorage.setItem('terminal_history', JSON.stringify(newHistory));
      return newHistory;
    });

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

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHistoryTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (mins > 0) return `${mins}분 전`;
    return '방금 전';
  };

  const renderServerCard = (server: Server, compact: boolean = false) => {
    const canAccess = canAccessServer(server);
    const serverTab = tabs.find(t => t.serverId === server.id);
    const isActive = activeTab?.serverId === server.id;
    const isFavorite = favorites.includes(server.id);

    return (
      <div
        key={server.id}
        onClick={() => canAccess && server.status === 'online' && handleServerSelect(server)}
        style={{
          padding: compact ? '8px 10px' : '10px 12px',
          marginBottom: '4px',
          background: isActive ? `${getEnvironmentColor(server.environment)}12` : serverTab ? 'var(--color-surface)' : 'transparent',
          border: isActive ? `1px solid ${getEnvironmentColor(server.environment)}40` : '1px solid transparent',
          borderRadius: 'var(--radius-md)',
          cursor: canAccess && server.status === 'online' ? 'pointer' : 'not-allowed',
          opacity: canAccess && server.status === 'online' ? 1 : 0.5,
          transition: 'all var(--transition-fast)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? '2px' : '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {serverTab && <span style={{ fontSize: '0.65rem' }}>{getStatusIcon(serverTab.status)}</span>}
            <span style={{ 
              fontSize: compact ? '0.8rem' : '0.85rem', 
              fontWeight: 500,
              color: isActive ? getEnvironmentColor(server.environment) : 'var(--color-text-primary)'
            }}>
              {server.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(server.id); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                opacity: isFavorite ? 1 : 0.3,
                transition: 'opacity var(--transition-fast)'
              }}
              title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              {isFavorite ? '⭐' : '☆'}
            </button>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: server.status === 'online' ? 'var(--color-success)' : 
                         server.status === 'maintenance' ? 'var(--color-warning)' : 'var(--color-danger)'
            }} />
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            {server.hostname}
          </span>
          
          {!compact && server.status === 'online' && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem' }}>
              <span style={{ color: getResourceColor(server.cpu || 0) }} title="CPU">
                ▪ {server.cpu}%
              </span>
              <span style={{ color: getResourceColor(server.memory || 0) }} title="Memory">
                ▪ {server.memory}%
              </span>
            </div>
          )}
        </div>

        {!compact && server.tags && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
            {server.tags.map(tag => (
              <span key={tag} style={{
                padding: '1px 5px',
                background: 'var(--color-surface)',
                borderRadius: '3px',
                fontSize: '0.6rem',
                color: 'var(--color-text-muted)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTerminalPanel = (tab: EnhancedTab | undefined, isPrimary: boolean = true) => {
    if (!tab) return null;

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '6px',
          borderLeft: `3px solid ${getEnvironmentColor(tab.environment)}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '0.65rem',
              fontWeight: 600,
              background: getEnvironmentColor(tab.environment) + '20',
              color: getEnvironmentColor(tab.environment)
            }}>
              {tab.environment}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tab.serverName}</span>
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
              {tab.hostname}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {tab.status === 'connected' && (
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                <span>⏱️ {formatConnectionTime(tab.lastConnectedAt)}</span>
                {tab.isRecording && (
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '5px', height: '5px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                    REC
                  </span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '4px' }}>
              {tab.status === 'connected' && (
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDisconnect(tab.id)}
                  style={{ color: 'var(--color-warning)', fontSize: '0.75rem', padding: '3px 6px' }}
                >
                  연결 끊기
                </button>
              )}
              {tab.status === 'disconnected' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleReconnect(tab.id)}
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  🔄 재연결
                </button>
              )}
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => handleTabClose(tab.id)}
                style={{ color: 'var(--color-danger)', fontSize: '0.75rem', padding: '3px 6px' }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          {tab.status === 'connected' ? (
            <DemoTerminal key={tab.id} serverId={tab.serverId} serverName={tab.serverName} />
          ) : tab.status === 'connecting' ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--terminal-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }} />
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
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
              gap: '16px',
              background: 'var(--terminal-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '2.5rem' }}>🔌</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  연결이 끊어졌습니다
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleReconnect(tab.id)}>
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
        width: sidebarOpen ? '280px' : '0',
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
          padding: '10px 14px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div className="header-logo-icon" style={{ width: '26px', height: '26px', fontSize: '0.85rem' }}>⌘</div>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>jaTerm</span>
          </Link>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowShortcuts(prev => !prev)}
              title="단축키 (?)"
              style={{ padding: '3px 5px', fontSize: '0.7rem' }}
            >
              ⌨️
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div style={{ 
            padding: '10px 14px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
            </div>
            <span className={`badge badge-${user.role === 'ADMIN' ? 'danger' : user.role === 'OPERATOR' ? 'warning' : 'info'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              {user.role}
            </span>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="서버 검색... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.75rem', padding: '6px 10px 6px 28px', background: 'var(--color-bg-tertiary)' }}
            />
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
          {[
            { id: 'servers', label: '서버', icon: '🖥️' },
            { id: 'history', label: '기록', icon: '📜' },
            { id: 'commands', label: '명령', icon: '⚡' },
            { id: 'snippets', label: '스니펫', icon: '📋' },
            { id: 'recordings', label: '녹화', icon: '🎬' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id as any)}
              style={{
                flex: '0 0 auto',
                padding: '6px 10px',
                background: sidebarTab === tab.id ? 'var(--color-surface)' : 'transparent',
                border: 'none',
                borderBottom: sidebarTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: sidebarTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon}
            </button>
          ))}
        </div>

        {/* Sidebar Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          {sidebarTab === 'servers' && (
            <>
              {/* Favorites */}
              {favorites.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    ⭐ 즐겨찾기
                  </div>
                  {DEMO_SERVERS.filter(s => favorites.includes(s.id)).map(server => renderServerCard(server, true))}
                </div>
              )}

              {/* Servers by Environment */}
              {['PROD', 'STAGE', 'DEV'].map(env => {
                const serversInEnv = filteredServers.filter(s => s.environment === env);
                if (serversInEnv.length === 0) return null;
                
                return (
                  <div key={env} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '3px 0' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getEnvironmentColor(env) }} />
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        {env === 'PROD' ? 'Production' : env === 'STAGE' ? 'Staging' : 'Development'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{serversInEnv.length}</span>
                    </div>
                    {serversInEnv.map(server => renderServerCard(server))}
                  </div>
                );
              })}
            </>
          )}

          {sidebarTab === 'history' && (
            <div>
              {connectionHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  최근 연결 기록이 없습니다
                </div>
              ) : (
                connectionHistory.map((item, i) => {
                  const server = DEMO_SERVERS.find(s => s.id === item.serverId);
                  if (!server) return null;
                  return (
                    <div
                      key={i}
                      onClick={() => handleServerSelect(server)}
                      style={{
                        padding: '8px 10px',
                        marginBottom: '4px',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: getEnvironmentColor(item.environment)
                          }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{item.serverName}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          {formatHistoryTime(item.connectedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {sidebarTab === 'commands' && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                빠른 명령어
              </div>
              {QUICK_COMMANDS.map(cmd => (
                <div
                  key={cmd.id}
                  style={{
                    padding: '8px 10px',
                    marginBottom: '4px',
                    background: pinnedCommands.includes(cmd.id) ? `${cmd.color}10` : 'var(--color-surface)',
                    border: pinnedCommands.includes(cmd.id) ? `1px solid ${cmd.color}30` : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  title={`명령어: ${cmd.command}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{cmd.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{cmd.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cmd.command}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedCommands(prev => 
                          prev.includes(cmd.id) ? prev.filter(id => id !== cmd.id) : [...prev, cmd.id]
                        );
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        opacity: pinnedCommands.includes(cmd.id) ? 1 : 0.4
                      }}
                    >
                      📌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'snippets' && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                코드 스니펫 라이브러리
              </div>
              {CODE_SNIPPETS.map(snippet => (
                <div
                  key={snippet.id}
                  style={{
                    padding: '10px',
                    marginBottom: '6px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{snippet.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{snippet.commands.length} cmds</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    {snippet.commands[0]}
                    {snippet.commands.length > 1 && <span style={{ opacity: 0.6 }}> +{snippet.commands.length - 1} more</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {snippet.tags.map(tag => (
                      <span key={tag} style={{ padding: '1px 5px', background: 'var(--color-primary)20', color: 'var(--color-primary)', borderRadius: '3px', fontSize: '0.6rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'recordings' && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                세션 녹화
              </div>
              {SESSION_RECORDINGS.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => setShowRecordingPlayer(rec.id)}
                  style={{
                    padding: '10px',
                    marginBottom: '6px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{rec.serverName}</span>
                    <span style={{ fontSize: '0.65rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ width: '4px', height: '4px', background: '#ef4444', borderRadius: '50%' }} />
                      {rec.duration}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                    <span>{rec.date}</span>
                    <span>{rec.size}</span>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '10px' }}>
                녹화된 세션을 클릭하여 재생
              </div>
            </div>
          )}

          {/* Server Alerts */}
          {sidebarTab === 'servers' && SERVER_ALERTS.length > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', background: 'var(--color-warning)10', border: '1px solid var(--color-warning)30', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '6px' }}>
                ⚠️ 알림 ({SERVER_ALERTS.length})
              </div>
              {SERVER_ALERTS.map(alert => {
                const server = DEMO_SERVERS.find(s => s.id === alert.serverId);
                return (
                  <div key={alert.id} style={{ fontSize: '0.7rem', color: alert.severity === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)', marginBottom: '4px' }}>
                    <strong>{server?.name}</strong>: {alert.message}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '6px' }}>
          <Link href="/admin" className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}>
            관리자
          </Link>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }}
            style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <header style={{
          height: '40px',
          background: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          gap: '10px'
        }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '3px 6px' }}>
            ☰
          </button>

          {tabs.length > 1 && (
            <div style={{ display: 'flex', gap: '2px' }}>
              {[
                { mode: 'none' as const, icon: '▢', title: '단일' },
                { mode: 'vertical' as const, icon: '⧈', title: '좌우' },
                { mode: 'horizontal' as const, icon: '⬓', title: '상하' },
              ].map(item => (
                <button 
                  key={item.mode}
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSplitMode(item.mode);
                    if (item.mode !== 'none' && !secondaryTabId && tabs.length > 1) {
                      setSecondaryTabId(tabs.find(t => t.id !== activeTabId)?.id || null);
                    }
                    if (item.mode === 'none') setSecondaryTabId(null);
                  }}
                  style={{ 
                    padding: '3px 6px', 
                    background: splitMode === item.mode ? 'var(--color-surface-active)' : 'transparent',
                    fontSize: '0.8rem'
                  }}
                  title={item.title}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Header Actions */}
          {activeTab && activeTab.status === 'connected' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setCommandPaletteOpen(true)}
                title="명령 팔레트 (Ctrl+P)"
                style={{ padding: '3px 6px', fontSize: '0.8rem' }}
              >
                ⌘
              </button>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowInfoPanel(p => !p)}
                title="세션 정보"
                style={{ padding: '3px 6px', fontSize: '0.8rem', background: showInfoPanel ? 'var(--color-surface-active)' : 'transparent' }}
              >
                ℹ️
              </button>
            </div>
          )}

          {tabs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>{tabs.filter(t => t.status === 'connected').length}/{tabs.length} 연결</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCloseAllTabs}
                style={{ padding: '2px 4px', fontSize: '0.65rem', color: 'var(--color-danger)' }}
              >
                전체 닫기
              </button>
            </div>
          )}
        </header>

        {/* Tab Bar */}
        {tabs.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '34px',
            background: 'var(--color-bg-tertiary)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 6px',
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
                  gap: '5px',
                  padding: '3px 8px',
                  background: tab.id === activeTabId ? 'var(--color-bg-secondary)' : 
                             tab.id === secondaryTabId ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                  border: tab.id === activeTabId ? `1px solid ${getEnvironmentColor(tab.environment)}` : '1px solid transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                  minWidth: '100px',
                  maxWidth: '160px',
                  opacity: draggedTabId === tab.id ? 0.5 : 1,
                  boxShadow: tab.id === activeTabId ? `0 0 6px ${getEnvironmentColor(tab.environment)}25` : 'none'
                }}
              >
                <span style={{
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  padding: '1px 3px',
                  borderRadius: '2px',
                  background: getEnvironmentColor(tab.environment) + '20',
                  color: getEnvironmentColor(tab.environment)
                }}>
                  {tab.environment.charAt(0)}
                </span>
                <span style={{ fontSize: '0.6rem' }}>{getStatusIcon(tab.status)}</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: tab.id === activeTabId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {tab.serverName}
                </span>
                {tab.isRecording && tab.status === 'connected' && (
                  <span style={{ width: '4px', height: '4px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                )}
                <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>{index + 1}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleTabClose(tab.id); }}
                  style={{
                    width: '12px',
                    height: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '2px',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    opacity: 0.6
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button 
              onClick={() => { setShowQuickConnect(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
              style={{
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px dashed var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                marginLeft: '4px',
                fontSize: '0.9rem'
              }}
              title="새 세션 (Ctrl+T)"
            >
              +
            </button>
          </div>
        )}

        {/* Quick Commands Bar (when connected) */}
        {activeTab?.status === 'connected' && pinnedCommands.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px 10px',
            background: 'var(--color-bg-tertiary)',
            borderBottom: '1px solid var(--color-border)',
            overflowX: 'auto'
          }}>
            {QUICK_COMMANDS.filter(c => pinnedCommands.includes(c.id)).map(cmd => (
              <button
                key={cmd.id}
                className="btn btn-ghost btn-sm"
                style={{
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  background: `${cmd.color}10`,
                  border: `1px solid ${cmd.color}30`,
                  color: cmd.color
                }}
                title={cmd.command}
              >
                {cmd.icon} {cmd.name}
              </button>
            ))}
          </div>
        )}

        {/* Terminal Area */}
        <div style={{ flex: 1, padding: '10px', overflow: 'hidden' }}>
          {activeTab ? (
            splitMode === 'none' ? (
              renderTerminalPanel(activeTab, true)
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: splitMode === 'horizontal' ? 'column' : 'row',
                gap: '6px',
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
                  {secondaryTab ? renderTerminalPanel(secondaryTab, false) : (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '12px',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px dashed var(--color-border)'
                    }}>
                      <div style={{ fontSize: '1.5rem' }}>⊞</div>
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        탭을 선택하세요
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {tabs.filter(t => t.id !== activeTabId).slice(0, 3).map(t => (
                          <button
                            key={t.id}
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSecondaryTabId(t.id)}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {t.serverName}
                          </button>
                        ))}
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
              gap: '20px',
              color: 'var(--color-text-muted)'
            }}>
              <div style={{ fontSize: '3.5rem' }}>🖥️</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  서버를 선택하세요
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  좌측 목록에서 서버를 선택하거나 <kbd style={{ padding: '2px 5px', background: 'var(--color-surface)', borderRadius: '3px', fontSize: '0.8rem' }}>Ctrl+T</kbd>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="btn btn-primary" onClick={() => setShowQuickConnect(true)}>빠른 연결</button>
                <button className="btn btn-secondary" onClick={() => setShowShortcuts(true)}>단축키</button>
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
            minWidth: '150px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: '재연결', icon: '🔄', action: () => handleReconnect(contextMenu.tabId), show: tabs.find(t => t.id === contextMenu.tabId)?.status === 'disconnected' },
            { label: '연결 끊기', icon: '⏸️', action: () => handleDisconnect(contextMenu.tabId), show: tabs.find(t => t.id === contextMenu.tabId)?.status === 'connected' },
            { label: '탭 복제', icon: '📋', action: () => handleDuplicateTab(contextMenu.tabId), show: true },
            { label: '분할 보기', icon: '⊞', action: () => { setSecondaryTabId(contextMenu.tabId); setSplitMode('vertical'); }, show: tabs.length > 0 },
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
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: item.danger ? 'var(--color-danger)' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textAlign: 'left'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="modal-overlay active" onClick={() => setShowShortcuts(false)}>
          <div className="modal" style={{ maxWidth: '360px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⌨️ 키보드 단축키</div>
              <button className="modal-close" onClick={() => setShowShortcuts(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {SHORTCUTS.map((shortcut, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{shortcut.action}</span>
                    <kbd style={{ 
                      padding: '3px 6px', 
                      background: 'var(--color-surface)', 
                      borderRadius: '3px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      border: '1px solid var(--color-border)'
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
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Command Palette */}
      {commandPaletteOpen && (
        <div 
          className="modal-overlay active" 
          onClick={() => { setCommandPaletteOpen(false); setCommandPaletteQuery(''); }}
          style={{ alignItems: 'flex-start', paddingTop: '15vh' }}
        >
          <div 
            className="modal" 
            style={{ maxWidth: '480px', padding: 0 }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <input
                ref={commandPaletteRef}
                type="text"
                placeholder="명령어 검색..."
                value={commandPaletteQuery}
                onChange={(e) => setCommandPaletteQuery(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.9rem', padding: '10px 14px', background: 'var(--color-bg-tertiary)' }}
                autoFocus
              />
            </div>
            <div style={{ maxHeight: '320px', overflow: 'auto', padding: '6px' }}>
              {COMMAND_PALETTE_ACTIONS
                .filter(a => a.label.toLowerCase().includes(commandPaletteQuery.toLowerCase()))
                .map(action => (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.id === 'toggle-sidebar') setSidebarOpen(p => !p);
                    if (action.id === 'split-vertical') { setSplitMode('vertical'); if (tabs.length > 1 && !secondaryTabId) setSecondaryTabId(tabs.find(t => t.id !== activeTabId)?.id || null); }
                    if (action.id === 'split-horizontal') { setSplitMode('horizontal'); if (tabs.length > 1 && !secondaryTabId) setSecondaryTabId(tabs.find(t => t.id !== activeTabId)?.id || null); }
                    if (action.id === 'broadcast-mode') setBroadcastMode(p => !p);
                    if (action.id === 'theme-settings') setShowThemeSelector(true);
                    if (action.id === 'shortcuts') setShowShortcuts(true);
                    if (action.id === 'close-tab' && activeTabId) handleTabClose(activeTabId);
                    setCommandPaletteOpen(false);
                    setCommandPaletteQuery('');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>{action.icon}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <kbd style={{ padding: '2px 6px', background: 'var(--color-surface)', borderRadius: '3px', fontSize: '0.7rem', border: '1px solid var(--color-border)' }}>
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector */}
      {showThemeSelector && (
        <div className="modal-overlay active" onClick={() => setShowThemeSelector(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🎨 터미널 테마</div>
              <button className="modal-close" onClick={() => setShowThemeSelector(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {TERMINAL_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => { setTerminalTheme(theme.id); setShowThemeSelector(false); }}
                    style={{
                      padding: '12px',
                      background: theme.bg,
                      border: terminalTheme === theme.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ color: theme.fg, fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>{theme.name}</div>
                    <div style={{ color: theme.accent, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>$ hello_world</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Mode Indicator */}
      {broadcastMode && (
        <div style={{
          position: 'fixed',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          padding: '8px 20px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span style={{ fontSize: '1.1rem' }}>📡</span>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>브로드캐스트 모드 활성</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{tabs.filter(t => t.status === 'connected').length}개 서버</span>
          <button 
            onClick={() => setBroadcastMode(false)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '2px 8px', cursor: 'pointer', color: 'white', fontSize: '0.75rem' }}
          >
            종료
          </button>
        </div>
      )}

      {/* Notifications */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000 }}>
        {notifications.map(n => (
          <div 
            key={n.id}
            style={{
              padding: '12px 16px',
              background: n.type === 'success' ? 'var(--color-success-bg)' : n.type === 'warning' ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
              border: `1px solid ${n.type === 'success' ? 'var(--color-success)' : n.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)'}40`,
              borderRadius: 'var(--radius-md)',
              color: n.type === 'success' ? 'var(--color-success)' : n.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)',
              fontSize: '0.85rem',
              animation: 'slideIn 0.3s ease-out',
              maxWidth: '300px'
            }}
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* Recording Player Modal */}
      {showRecordingPlayer && (
        <div className="modal-overlay active" onClick={() => setShowRecordingPlayer(null)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🎬 세션 녹화 재생</div>
              <button className="modal-close" onClick={() => setShowRecordingPlayer(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '0' }}>
              {(() => {
                const recording = SESSION_RECORDINGS.find(r => r.id === showRecordingPlayer);
                if (!recording) return null;
                return (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{recording.serverName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{recording.date} • {recording.user}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                        <span>⏱️ {recording.duration}</span>
                        <span>📁 {recording.size}</span>
                      </div>
                    </div>
                    <div style={{ background: '#0d1117', height: '350px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#c9d1d9', padding: '16px', overflow: 'auto' }}>
                      <div style={{ opacity: 0.6 }}>$ ssh {recording.serverName}</div>
                      <div style={{ color: '#10b981' }}>Connected to {recording.serverName}</div>
                      <div style={{ marginTop: '8px' }}>$ top</div>
                      <div style={{ color: '#f59e0b' }}>top - 15:30:45 up 12 days, 5:23, 2 users, load average: 0.52, 0.48, 0.45</div>
                      <div>Tasks: 256 total, 1 running, 255 sleeping, 0 stopped</div>
                      <div style={{ marginTop: '8px' }}>$ df -h</div>
                      <div>Filesystem Size Used Avail Use% Mounted on</div>
                      <div>/dev/sda1 100G 45G 55G 45% /</div>
                      <div style={{ marginTop: '8px', opacity: 0.6 }}>$ exit</div>
                      <div style={{ color: '#ef4444' }}>Connection closed.</div>
                    </div>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm">▶️ 재생</button>
                        <button className="btn btn-secondary btn-sm">⏸️ 일시정지</button>
                        <button className="btn btn-ghost btn-sm">⏹️ 중지</button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm">📥 다운로드</button>
                        <button className="btn btn-ghost btn-sm">🗑️ 삭제</button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Session Info Panel (Right Side) */}
      {showInfoPanel && activeTab && activeTab.status === 'connected' && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: '80px',
          bottom: 0,
          width: '280px',
          background: 'var(--color-bg-secondary)',
          borderLeft: '1px solid var(--color-border)',
          padding: '16px',
          zIndex: 100,
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>세션 정보</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowInfoPanel(false)}>✕</button>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>서버</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeTab.serverName}</div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{activeTab.hostname}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>연결 시간</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatConnectionTime(activeTab.lastConnectedAt)}</div>
            </div>
            <div style={{ padding: '10px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>상태</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-success)' }}>연결됨</div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>서버 정보</div>
            {[
              { label: 'OS', value: 'Ubuntu 22.04 LTS' },
              { label: 'Kernel', value: '5.15.0-generic' },
              { label: 'CPU', value: '4 Cores / 45%' },
              { label: 'Memory', value: '4GB / 62%' },
              { label: 'Uptime', value: '12 days' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>빠른 작업</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>📁 파일 브라우저</button>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>📤 파일 업로드</button>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>📊 리소스 모니터</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  terminalStore,
  TerminalTab,
  SessionGroup,
  CommandHistoryItem,
  CommandFavorite,
  ChatMessage,
  Macro,
  filterPaste,
  maskSensitiveInfo,
  autoLockManager,
  generateWatermark,
  analyzeCommand,
  validateCommand,
  simulateDryRun,
  requiresConfirmation,
  DryRunResult,
} from '@/lib/terminal';
import TerminalTabBar from '@/components/terminal/TerminalTabBar';
import TerminalSettingsPanel from '@/components/terminal/TerminalSettingsPanel';
import CommandHistoryPanel from '@/components/terminal/CommandHistoryPanel';
import EnhancedCommandInput from '@/components/terminal/EnhancedCommandInput';
import BroadcastPanel from '@/components/terminal/BroadcastPanel';
import MacrosPanel from '@/components/terminal/MacrosPanel';
import CollaborationPanel from '@/components/terminal/CollaborationPanel';
import TerminalStatusBar from '@/components/terminal/TerminalStatusBar';
// Phase 1-10 UX Enhancement Components
import DangerousCommandConfirm from '@/components/terminal/DangerousCommandConfirm';
import SessionTimeoutAlert from '@/components/terminal/SessionTimeoutAlert';
import DryRunPanel from '@/components/terminal/DryRunPanel';
import AIAssistPanel from '@/components/terminal/AIAssistPanel';
import ServerSearch from '@/components/terminal/ServerSearch';
import BeginnerMode from '@/components/terminal/BeginnerMode';
import MobileKeyboard from '@/components/terminal/MobileKeyboard';

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
  { id: '3', name: 'prod-db-01', hostname: '192.168.1.12', environment: 'PROD', status: 'online' },
  { id: '4', name: 'stage-web-01', hostname: '192.168.2.10', environment: 'STAGE', status: 'online' },
  { id: '5', name: 'stage-api-01', hostname: '192.168.2.11', environment: 'STAGE', status: 'online' },
  { id: '6', name: 'dev-server-01', hostname: '192.168.3.10', environment: 'DEV', status: 'online' },
  { id: '7', name: 'dev-database', hostname: '192.168.3.20', environment: 'DEV', status: 'maintenance' },
];

// Demo filesystem
const DEMO_FS: Record<string, string[]> = {
  '/': ['bin', 'etc', 'home', 'var', 'usr', 'tmp', 'root'],
  '/home': ['demo'],
  '/home/demo': ['documents', 'projects', '.bashrc', '.ssh'],
  '/var': ['log', 'www', 'lib'],
  '/var/log': ['syslog', 'auth.log', 'nginx', 'application.log'],
  '/etc': ['passwd', 'hosts', 'nginx', 'ssh'],
};

export default function EnhancedTerminalPage() {
  // Core state
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([
    { id: 'g1', name: 'Production', description: '운영 서버', serverIds: ['1', '2', '3'], color: '#ef4444', icon: '🔴', createdAt: new Date() },
    { id: 'g2', name: 'Development', description: '개발 서버', serverIds: ['6', '7'], color: '#10b981', icon: '🟢', createdAt: new Date() },
  ]);

  // Terminal state
  const [currentDir, setCurrentDir] = useState('/home/demo');
  const [currentInput, setCurrentInput] = useState('');
  const [outputHistory, setOutputHistory] = useState<{ type: string; text: string }[]>([]);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<CommandFavorite[]>([]);

  // Settings
  const [settings, setSettings] = useState(terminalStore.getState().settings);
  const [securitySettings, setSecuritySettings] = useState(terminalStore.getState().securitySettings);
  const themes = terminalStore.getState().themes;
  const currentTheme = themes.find(t => t.id === settings.theme) || themes[0];

  // Panels
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showMacros, setShowMacros] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [showServerSelector, setShowServerSelector] = useState(false);

  // Security
  const [isLocked, setIsLocked] = useState(false);
  const [lockPassword, setLockPassword] = useState('');

  // Phase 1: 실수 방지 UX State
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);
  const [pendingCommand, setPendingCommand] = useState('');
  const [pendingValidation, setPendingValidation] = useState<ReturnType<typeof validateCommand> | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [showSessionTimeout, setShowSessionTimeout] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(30 * 60); // 30 minutes

  // Phase 3: AI Panel State
  const [showAIAssist, setShowAIAssist] = useState(false);

  // Phase 7: Learning UX State
  const [beginnerModeEnabled, setBeginnerModeEnabled] = useState(false);

  // Phase 10: Mobile State
  const [showMobileKeyboard, setShowMobileKeyboard] = useState(false);

  // Favorite servers (Phase 4)
  const [favoriteServers, setFavoriteServers] = useState<string[]>([]);

  // Terminal ref
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Load user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    terminalStore.loadSettings();
  }, []);

  // Auto scroll
  useEffect(() => {
    if (terminalBodyRef.current && settings.autoScroll) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [outputHistory, settings.autoScroll]);

  // Auto lock
  useEffect(() => {
    if (securitySettings.autoLockEnabled) {
      autoLockManager.start(() => setIsLocked(true), securitySettings.autoLockTimeout);
    }
    return () => autoLockManager.stop();
  }, [securitySettings.autoLockEnabled, securitySettings.autoLockTimeout]);

  // Handle activity
  const handleActivity = useCallback(() => {
    if (securitySettings.autoLockEnabled) {
      autoLockManager.resetTimer();
    }
  }, [securitySettings.autoLockEnabled]);

  // Get environment color
  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'PROD': return '#ef4444';
      case 'STAGE': return '#f59e0b';
      case 'DEV': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Check access
  const canAccessServer = (server: Server) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'OPERATOR') return true;
    if (user.role === 'DEVELOPER' && server.environment !== 'PROD') return true;
    return false;
  };

  // Connect to server
  const connectToServer = (server: Server) => {
    if (!canAccessServer(server) || server.status !== 'online') return;

    const newTab: TerminalTab = {
      id: `tab_${Date.now()}`,
      serverId: server.id,
      serverName: server.name,
      hostname: server.hostname,
      environment: server.environment,
      status: 'connecting',
      isRecording: true,
      startedAt: new Date(),
      connectionQuality: 'good',
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setShowServerSelector(false);

    // Simulate connection
    setTimeout(() => {
      setTabs(prev => prev.map(t => 
        t.id === newTab.id ? { ...t, status: 'connected' } : t
      ));
      setOutputHistory([
        { type: 'info', text: '🔐 jaTerm Gateway에 연결 중...' },
        { type: 'success', text: '✓ 인증 성공' },
        { type: 'success', text: '✓ 접근 정책 확인 완료' },
        { type: 'info', text: '📹 세션 녹화가 시작되었습니다' },
        { type: 'output', text: `Connected to ${server.name}` },
        { type: 'output', text: '' },
      ]);
      setCurrentDir('/home/demo');
    }, 1500);
  };

  // Execute command - with dangerous command check
  const executeCommand = (cmd: string) => {
    handleActivity();
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // Phase 1: Check if command requires confirmation
    const validation = validateCommand(trimmedCmd);
    if (requiresConfirmation(trimmedCmd, activeTab.environment)) {
      setPendingCommand(trimmedCmd);
      setPendingValidation(validation);
      setShowDangerConfirm(true);
      return;
    }

    // Execute directly if safe
    executeConfirmedCommand(trimmedCmd);
  };

  // Execute command after confirmation
  const executeConfirmedCommand = (cmd: string) => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // Add to output
    setOutputHistory(prev => [...prev, {
      type: 'input',
      text: `demo@${activeTab.serverName}:${currentDir}$ ${cmd}`,
    }]);

    // Analyze command
    const analysis = analyzeCommand(cmd);

    // Check if blocked (critical risk)
    if (analysis.riskLevel === 'critical') {
      setOutputHistory(prev => [
        ...prev,
        { type: 'error', text: `⛔ BLOCKED: 위험 명령 감지됨` },
        { type: 'error', text: `   ${analysis.explanation}` },
        { type: 'warning', text: '🚨 보안 알림이 관리자에게 전송되었습니다' },
      ]);

      // Add to history as blocked
      const historyItem: CommandHistoryItem = {
        id: `cmd_${Date.now()}`,
        sessionId: activeTabId!,
        serverId: activeTab.serverId,
        command: cmd,
        riskScore: analysis.riskScore,
        blocked: true,
        executedAt: new Date(),
        tags: [],
      };
      setCommandHistory(prev => [historyItem, ...prev]);
      return;
    }

    // Process command
    processCommand(cmd, activeTab);

    // Add to history
    const historyItem: CommandHistoryItem = {
      id: `cmd_${Date.now()}`,
      sessionId: activeTabId!,
      serverId: activeTab.serverId,
      command: cmd,
      riskScore: analysis.riskScore,
      blocked: false,
      executedAt: new Date(),
      tags: [],
    };
    setCommandHistory(prev => [historyItem, ...prev]);
  };

  // Handle Dry Run
  const handleDryRun = () => {
    if (pendingCommand) {
      const result = simulateDryRun(pendingCommand);
      setDryRunResult(result);
      setShowDangerConfirm(false);
    }
  };

  // Handle confirmed dangerous command
  const handleConfirmDangerous = () => {
    if (pendingCommand) {
      executeConfirmedCommand(pendingCommand);
      setPendingCommand('');
      setPendingValidation(null);
      setShowDangerConfirm(false);
    }
  };

  // Close Dry Run panel
  const closeDryRunPanel = () => {
    setDryRunResult(null);
  };

  // Execute from Dry Run
  const handleExecuteFromDryRun = () => {
    if (pendingCommand) {
      executeConfirmedCommand(pendingCommand);
      setPendingCommand('');
      setDryRunResult(null);
    }
  };

  // Process command
  const processCommand = (cmd: string, activeTab: TerminalTab) => {
    const parts = cmd.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'ls':
        handleLs(args);
        break;
      case 'cd':
        handleCd(args);
        break;
      case 'pwd':
        setOutputHistory(prev => [...prev, { type: 'output', text: currentDir }]);
        break;
      case 'whoami':
        setOutputHistory(prev => [...prev, { type: 'output', text: 'demo' }]);
        break;
      case 'date':
        setOutputHistory(prev => [...prev, { type: 'output', text: new Date().toString() }]);
        break;
      case 'clear':
        setOutputHistory([]);
        break;
      case 'help':
        handleHelp();
        break;
      case 'exit':
        // Close current tab
        setTabs(prev => prev.filter(t => t.id !== activeTabId));
        const remainingTabs = tabs.filter(t => t.id !== activeTabId);
        setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
        break;
      case 'history':
        commandHistory.slice(0, 20).forEach((item, i) => {
          setOutputHistory(prev => [...prev, { type: 'output', text: `  ${i + 1}  ${item.command}` }]);
        });
        break;
      case 'ps':
        handlePs();
        break;
      case 'df':
        handleDf();
        break;
      case 'top':
        handleTop();
        break;
      case 'cat':
        handleCat(args);
        break;
      case 'echo':
        setOutputHistory(prev => [...prev, { type: 'output', text: args.join(' ') }]);
        break;
      case 'sudo':
        setOutputHistory(prev => [
          ...prev,
          { type: 'warning', text: '⚠️ sudo 명령 감지 - 권한 상승 시도가 기록됩니다' },
          { type: 'output', text: 'demo is not in the sudoers file. This incident will be reported.' },
        ]);
        break;
      default:
        setOutputHistory(prev => [...prev, { type: 'error', text: `${command}: command not found` }]);
    }
  };

  // Command handlers
  const handleLs = (args: string[]) => {
    const path = args[0] || currentDir;
    const fullPath = path.startsWith('/') ? path : `${currentDir}/${path}`.replace(/\/+/g, '/');
    const contents = DEMO_FS[fullPath];
    
    if (contents) {
      setOutputHistory(prev => [...prev, { type: 'output', text: contents.join('  ') }]);
    } else {
      setOutputHistory(prev => [...prev, { type: 'error', text: `ls: cannot access '${path}': No such file or directory` }]);
    }
  };

  const handleCd = (args: string[]) => {
    if (!args[0] || args[0] === '~') {
      setCurrentDir('/home/demo');
      return;
    }
    
    let newPath = args[0];
    if (!newPath.startsWith('/')) {
      newPath = `${currentDir}/${newPath}`.replace(/\/+/g, '/');
    }
    
    if (newPath.includes('..')) {
      const parts = currentDir.split('/').filter(Boolean);
      parts.pop();
      newPath = '/' + parts.join('/') || '/';
    }
    
    if (DEMO_FS[newPath]) {
      setCurrentDir(newPath);
    } else {
      setOutputHistory(prev => [...prev, { type: 'error', text: `cd: ${args[0]}: No such file or directory` }]);
    }
  };

  const handleHelp = () => {
    const helpLines = [
      'Available commands:',
      '  ls [path]     - List directory contents',
      '  cd [path]     - Change directory',
      '  pwd           - Print working directory',
      '  cat [file]    - Display file contents',
      '  whoami        - Display current user',
      '  date          - Display current date/time',
      '  ps            - List running processes',
      '  df            - Show disk usage',
      '  top           - Show system resources',
      '  history       - Show command history',
      '  clear         - Clear terminal',
      '  echo [text]   - Display text',
      '  exit          - End session',
    ];
    helpLines.forEach(line => {
      setOutputHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  const handlePs = () => {
    const lines = [
      '  PID TTY          TIME CMD',
      '    1 ?        00:00:02 systemd',
      '  234 ?        00:00:01 sshd',
      '  567 pts/0    00:00:00 bash',
    ];
    lines.forEach(line => {
      setOutputHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  const handleDf = () => {
    const lines = [
      'Filesystem     1K-blocks    Used Available Use% Mounted on',
      '/dev/sda1      102400000 45678900  56721100  45% /',
      '/dev/sda2       51200000 12345678  38854322  25% /home',
    ];
    lines.forEach(line => {
      setOutputHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  const handleTop = () => {
    const lines = [
      `top - ${new Date().toLocaleTimeString()} up 0 min,  1 user,  load average: 0.15, 0.10, 0.05`,
      'Tasks:  89 total,   1 running,  88 sleeping',
      '%Cpu(s):  2.3 us,  1.0 sy,  0.0 ni, 96.5 id',
      'MiB Mem :   8192.0 total,   4096.0 free,   2048.0 used',
    ];
    lines.forEach(line => {
      setOutputHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  const handleCat = (args: string[]) => {
    if (!args[0]) {
      setOutputHistory(prev => [...prev, { type: 'error', text: 'cat: missing operand' }]);
      return;
    }
    
    const fileContents: Record<string, string> = {
      '/home/demo/.bashrc': '# ~/.bashrc\nexport PATH=$HOME/bin:$PATH',
      '/etc/hosts': '127.0.0.1   localhost\n192.168.1.10  prod-web-01',
    };
    
    const path = args[0].startsWith('/') ? args[0] : `${currentDir}/${args[0]}`.replace(/\/+/g, '/');
    const content = fileContents[path];
    
    if (content) {
      content.split('\n').forEach(line => {
        // Mask sensitive info
        const { masked } = maskSensitiveInfo(line);
        setOutputHistory(prev => [...prev, { type: 'output', text: masked }]);
      });
    } else {
      setOutputHistory(prev => [...prev, { type: 'error', text: `cat: ${args[0]}: No such file or directory` }]);
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!securitySettings.pasteFilterEnabled) return;

    const text = e.clipboardData.getData('text');
    const result = filterPaste(text, securitySettings);

    if (!result.allowed) {
      e.preventDefault();
      setOutputHistory(prev => [
        ...prev,
        { type: 'error', text: '⛔ 붙여넣기 차단됨' },
        { type: 'warning', text: `위험 패턴 감지: ${result.blockedPatterns.join(', ')}` },
      ]);
    }
  };

  // Unlock terminal
  const handleUnlock = () => {
    // In real app, verify password
    setIsLocked(false);
    setLockPassword('');
    autoLockManager.resetTimer();
  };

  // Active tab
  const activeTab = tabs.find(t => t.id === activeTabId);

  // Lock screen
  if (isLocked) {
    return (
      <div className="lock-screen">
        <div className="lock-dialog">
          <div className="lock-icon">🔒</div>
          <h2>세션이 잠겼습니다</h2>
          <p>비활성으로 인해 자동 잠금되었습니다.</p>
          <input
            type="password"
            className="form-input"
            placeholder="비밀번호를 입력하세요"
            value={lockPassword}
            onChange={(e) => setLockPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          />
          <button className="btn btn-primary" onClick={handleUnlock}>
            잠금 해제
          </button>
        </div>
        <style jsx>{`
          .lock-screen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          .lock-dialog {
            text-align: center;
            padding: 40px;
          }
          .lock-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .lock-dialog h2 {
            margin-bottom: 8px;
          }
          .lock-dialog p {
            color: var(--color-text-secondary);
            margin-bottom: 24px;
          }
          .lock-dialog input {
            width: 300px;
            margin-bottom: 16px;
          }
          .lock-dialog button {
            width: 300px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="terminal-page" onClick={handleActivity} onKeyDown={handleActivity}>
      {/* Sidebar */}
      <aside className={`terminal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo">
            <div className="logo-icon">⌘</div>
            <span>jaTerm Pro</span>
          </Link>
        </div>

        {/* User Info */}
        {user && (
          <div className="sidebar-user">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
            <span className={`badge badge-${user.role === 'ADMIN' ? 'danger' : 'info'}`}>
              {user.role}
            </span>
          </div>
        )}

        {/* Session Groups */}
        <div className="sidebar-section">
          <div className="section-title">세션 그룹</div>
          {sessionGroups.map(group => (
            <button
              key={group.id}
              className="group-item"
              onClick={() => {
                // Connect to all servers in group
                const groupServers = DEMO_SERVERS.filter(s => group.serverIds.includes(s.id));
                groupServers.forEach(server => {
                  if (canAccessServer(server) && server.status === 'online') {
                    connectToServer(server);
                  }
                });
              }}
            >
              <span className="group-icon" style={{ color: group.color }}>{group.icon}</span>
              <span className="group-name">{group.name}</span>
              <span className="group-count">{group.serverIds.length}</span>
            </button>
          ))}
        </div>

        {/* Servers */}
        <div className="sidebar-section">
          <div className="section-header">
            <span className="section-title">서버 목록</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowServerSelector(true)}>
              + 연결
            </button>
          </div>
          
          {['PROD', 'STAGE', 'DEV'].map(env => (
            <div key={env} className="server-group">
              <div className="server-group-header">
                <span className="env-dot" style={{ background: getEnvironmentColor(env) }}></span>
                <span>{env}</span>
              </div>
              {DEMO_SERVERS.filter(s => s.environment === env).map(server => {
                const canAccess = canAccessServer(server);
                const isConnected = tabs.some(t => t.serverId === server.id);
                
                return (
                  <button
                    key={server.id}
                    className={`server-item ${isConnected ? 'connected' : ''} ${!canAccess ? 'disabled' : ''}`}
                    onClick={() => canAccess && connectToServer(server)}
                    disabled={!canAccess || server.status !== 'online'}
                  >
                    <span className={`status-dot ${server.status}`}></span>
                    <span className="server-name">{server.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="sidebar-actions">
          <Link href="/admin" className="btn btn-secondary" style={{ width: '100%' }}>
            관리자 대시보드
          </Link>
          <button
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="terminal-main">
        {/* Header */}
        <header className="terminal-header">
          <button className="btn btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>

          {tabs.length > 0 && (
            <TerminalTabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={setActiveTabId}
              onTabClose={(tabId) => {
                setTabs(prev => prev.filter(t => t.id !== tabId));
                if (activeTabId === tabId) {
                  const remaining = tabs.filter(t => t.id !== tabId);
                  setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
                }
              }}
              onAddTab={() => setShowServerSelector(true)}
            />
          )}

          <div className="header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAIAssist(true)} title="AI 어시스턴트">
              🤖
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowBroadcast(true)} title="브로드캐스트">
              🌐
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowMacros(true)} title="매크로">
              ⚡
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(true)} title="히스토리">
              📜
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCollab(true)} title="협업">
              👥
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)} title="설정">
              ⚙️
            </button>
          </div>
        </header>

        {/* Terminal Content */}
        {activeTab ? (
          <div className="terminal-container" style={{ 
            background: currentTheme.background,
            color: currentTheme.foreground,
          }}>
            {/* Watermark */}
            {securitySettings.watermarkEnabled && user && (
              <div className="terminal-watermark">
                {generateWatermark(user.email, user.name, activeTabId!).split(' | ').map((part, i) => (
                  <span key={i}>{part}</span>
                ))}
              </div>
            )}

            {/* Terminal Body */}
            <div 
              ref={terminalBodyRef}
              className="terminal-body"
              style={{
                fontSize: `${settings.fontSize}px`,
                fontFamily: settings.fontFamily,
                lineHeight: settings.lineHeight,
              }}
              onPaste={handlePaste}
            >
              {outputHistory.map((line, i) => (
                <div
                  key={i}
                  className={`output-line ${line.type}`}
                  style={{
                    color: line.type === 'error' ? currentTheme.red :
                           line.type === 'warning' ? currentTheme.yellow :
                           line.type === 'success' ? currentTheme.green :
                           line.type === 'info' ? currentTheme.cyan :
                           currentTheme.foreground,
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>

            {/* Command Input */}
            <div className="terminal-input-area">
              <EnhancedCommandInput
                value={currentInput}
                onChange={setCurrentInput}
                onExecute={(cmd) => {
                  executeCommand(cmd);
                  setCurrentInput('');
                }}
                serverName={activeTab.serverName}
                currentDir={currentDir}
                previewEnabled={true}
                readOnly={user?.role === 'VIEWER'}
              />
            </div>

            {/* Status Bar */}
            <TerminalStatusBar
              sessionId={activeTabId!}
              serverName={activeTab.serverName}
              isRecording={activeTab.isRecording}
              userRole={user?.role || 'USER'}
              connectionStatus={{
                sessionId: activeTabId!,
                status: activeTab.status === 'connected' ? 'connected' : 'reconnecting',
                latency: 45,
                quality: activeTab.connectionQuality,
                lastPingAt: new Date(),
                reconnectAttempts: 0,
              }}
            />
          </div>
        ) : (
          <div className="terminal-empty">
            <div className="empty-icon">🖥️</div>
            <h2>서버를 선택하세요</h2>
            <p>좌측 목록에서 서버를 선택하거나 새 세션을 시작하세요.</p>
            <button className="btn btn-primary" onClick={() => setShowServerSelector(true)}>
              새 세션 시작
            </button>
          </div>
        )}
      </main>

      {/* Panels */}
      {showSettings && (
        <TerminalSettingsPanel
          settings={settings}
          themes={themes}
          currentTheme={currentTheme}
          onUpdateSettings={(updates) => {
            setSettings(prev => ({ ...prev, ...updates }));
            terminalStore.updateSettings(updates);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHistory && (
        <CommandHistoryPanel
          history={commandHistory}
          favorites={favorites}
          onExecuteCommand={(cmd) => {
            if (activeTab) {
              executeCommand(cmd);
            }
          }}
          onAddFavorite={(cmd) => {
            const item: CommandFavorite = {
              id: `fav_${Date.now()}`,
              userId: user?.email || 'anonymous',
              command: cmd,
              tags: [],
              usageCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setFavorites(prev => [...prev, item]);
          }}
          onRemoveFavorite={(id) => {
            setFavorites(prev => prev.filter(f => f.id !== id));
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showBroadcast && (
        <>
          <div className="modal-overlay" onClick={() => setShowBroadcast(false)} />
          <BroadcastPanel
            servers={DEMO_SERVERS}
            onExecute={async (serverIds, command) => {
              // Simulate broadcast execution
              return serverIds.map(id => {
                const server = DEMO_SERVERS.find(s => s.id === id);
                return {
                  serverId: id,
                  serverName: server?.name || id,
                  status: Math.random() > 0.2 ? 'success' : 'failed' as const,
                  output: 'Command executed successfully',
                  duration: Math.floor(Math.random() * 500) + 100,
                };
              });
            }}
            onClose={() => setShowBroadcast(false)}
          />
        </>
      )}

      {showMacros && (
        <MacrosPanel
          macros={[]}
          onExecuteMacro={(macro, vars) => {
            console.log('Execute macro:', macro.name, vars);
          }}
          onAddMacro={(macro) => {
            console.log('Add macro:', macro);
          }}
          onRemoveMacro={(id) => {
            console.log('Remove macro:', id);
          }}
          onClose={() => setShowMacros(false)}
        />
      )}

      {showCollab && activeTab && (
        <CollaborationPanel
          sessionId={activeTabId!}
          currentUserId={user?.email || 'user'}
          currentUserName={user?.name || 'User'}
          sharedUsers={[]}
          chatMessages={[]}
          comments={[]}
          isOwner={true}
          onSendMessage={(msg) => console.log('Send:', msg)}
          onAddComment={(comment) => console.log('Comment:', comment)}
          onShareSession={(userId, perm) => console.log('Share:', userId, perm)}
          onRevokeAccess={(userId) => console.log('Revoke:', userId)}
          onTransferSession={(userId) => console.log('Transfer:', userId)}
          onClose={() => setShowCollab(false)}
        />
      )}

      {/* Server Selector Modal */}
      {showServerSelector && (
        <>
          <div className="modal-overlay" onClick={() => setShowServerSelector(false)} />
          <div className="server-selector-modal">
            <div className="modal-header">
              <h3>서버 선택</h3>
              <button className="modal-close" onClick={() => setShowServerSelector(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Enhanced Server Search */}
              <div style={{ marginBottom: '16px' }}>
                <ServerSearch
                  servers={DEMO_SERVERS.map(s => ({
                    ...s,
                    isFavorite: favoriteServers.includes(s.id),
                  }))}
                  onSelectServer={(server) => {
                    connectToServer(server);
                    setShowServerSelector(false);
                  }}
                  onToggleFavorite={(id) => {
                    setFavoriteServers(prev => 
                      prev.includes(id) 
                        ? prev.filter(sid => sid !== id)
                        : [...prev, id]
                    );
                  }}
                  selectedServerId={activeTab?.serverId}
                />
              </div>
              
              {['PROD', 'STAGE', 'DEV'].map(env => (
                <div key={env} className="env-section">
                  <div className="env-header">
                    <span className="env-dot" style={{ background: getEnvironmentColor(env) }}></span>
                    <span>{env === 'PROD' ? 'Production' : env === 'STAGE' ? 'Staging' : 'Development'}</span>
                  </div>
                  <div className="server-list">
                    {DEMO_SERVERS.filter(s => s.environment === env).map(server => {
                      const canAccess = canAccessServer(server);
                      return (
                        <button
                          key={server.id}
                          className={`server-option ${!canAccess ? 'disabled' : ''}`}
                          onClick={() => connectToServer(server)}
                          disabled={!canAccess || server.status !== 'online'}
                        >
                          <span className={`status-dot ${server.status}`}></span>
                          <div className="server-info">
                            <span className="server-name">{server.name}</span>
                            <span className="server-host">{server.hostname}</span>
                          </div>
                          {!canAccess && <span className="access-denied">접근 불가</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Phase 1: Dangerous Command Confirmation Modal */}
      {showDangerConfirm && pendingValidation && activeTab && (
        <DangerousCommandConfirm
          isOpen={showDangerConfirm}
          command={pendingCommand}
          serverName={activeTab.serverName}
          serverEnvironment={activeTab.environment}
          validation={pendingValidation}
          onConfirm={handleConfirmDangerous}
          onCancel={() => {
            setShowDangerConfirm(false);
            setPendingCommand('');
            setPendingValidation(null);
          }}
          onDryRun={handleDryRun}
        />
      )}

      {/* Phase 1: Dry Run Panel */}
      {dryRunResult && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '400px',
          zIndex: 1000,
        }}>
          <DryRunPanel
            result={dryRunResult}
            onClose={closeDryRunPanel}
            onExecute={handleExecuteFromDryRun}
          />
        </div>
      )}

      {/* Phase 1: Session Timeout Alert */}
      <SessionTimeoutAlert
        timeoutMinutes={30}
        warningMinutes={5}
        isActive={activeTab !== undefined}
        onExtend={() => {
          // Activity was detected, timer was reset
        }}
        onTimeout={() => {
          // Close all tabs and logout
          setTabs([]);
          setActiveTabId(null);
        }}
      />

      {/* Phase 3: AI Assist Panel */}
      {activeTab && (
        <AIAssistPanel
          serverName={activeTab.serverName}
          serverEnvironment={activeTab.environment}
          onCommandSuggested={(cmd) => {
            setCurrentInput(cmd);
            setShowAIAssist(false);
          }}
          commandHistory={commandHistory.map(h => h.command)}
          isOpen={showAIAssist}
          onClose={() => setShowAIAssist(false)}
        />
      )}

      {/* Phase 7: Beginner Mode */}
      <BeginnerMode
        isEnabled={beginnerModeEnabled}
        onToggle={setBeginnerModeEnabled}
        currentCommand={currentInput}
        serverEnvironment={activeTab?.environment}
      />

      {/* Phase 10: Mobile Keyboard */}
      <MobileKeyboard
        onKeyPress={(key) => {
          setCurrentInput(prev => prev + key);
        }}
        onSpecialKey={(key) => {
          switch (key) {
            case 'enter':
              if (currentInput.trim()) {
                executeCommand(currentInput);
                setCurrentInput('');
              }
              break;
            case 'ctrl-c':
              setOutputHistory(prev => [...prev, { type: 'warning', text: '^C' }]);
              setCurrentInput('');
              break;
            case 'up':
              // Navigate history up
              if (commandHistory.length > 0) {
                setCurrentInput(commandHistory[0].command);
              }
              break;
            case 'down':
              setCurrentInput('');
              break;
          }
        }}
        isVisible={showMobileKeyboard}
        onToggle={() => setShowMobileKeyboard(!showMobileKeyboard)}
      />


      <style jsx>{`
        .terminal-page {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .terminal-sidebar {
          width: 260px;
          background: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          transition: transform var(--transition-normal);
        }

        .terminal-sidebar:not(.open) {
          transform: translateX(-100%);
          position: absolute;
        }

        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: inherit;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-info));
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-logo span {
          font-weight: 600;
        }

        .sidebar-user {
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface);
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-bottom: 8px;
        }

        .sidebar-section {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
        }

        .group-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          margin-bottom: 8px;
          cursor: pointer;
          text-align: left;
          color: inherit;
          transition: all var(--transition-fast);
        }

        .group-item:hover {
          border-color: var(--color-text-muted);
        }

        .group-icon {
          font-size: 1rem;
        }

        .group-name {
          flex: 1;
          font-size: 0.9rem;
        }

        .group-count {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .server-group {
          margin-bottom: 16px;
        }

        .server-group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }

        .env-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .server-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .server-item:hover:not(.disabled) {
          background: var(--color-surface);
          color: var(--color-text-primary);
        }

        .server-item.connected {
          background: var(--color-primary-glow);
          color: var(--color-primary);
        }

        .server-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.online {
          background: #10b981;
        }

        .status-dot.offline {
          background: #ef4444;
        }

        .status-dot.maintenance {
          background: #f59e0b;
        }

        .sidebar-actions {
          padding: 16px;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .terminal-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 50px;
          padding: 0 16px;
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
        }

        .header-actions {
          display: flex;
          gap: 4px;
          margin-left: auto;
        }

        .terminal-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .terminal-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-15deg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.03);
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
        }

        .terminal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .output-line {
          white-space: pre-wrap;
          word-break: break-all;
        }

        .terminal-input-area {
          padding: 12px 16px;
          border-top: 1px solid var(--color-border);
        }

        .terminal-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--color-text-secondary);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .terminal-empty h2 {
          color: var(--color-text-primary);
          margin-bottom: 8px;
        }

        .terminal-empty p {
          margin-bottom: 24px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999;
        }

        .server-selector-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          z-index: 1000;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: 1.2rem;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          max-height: calc(80vh - 60px);
        }

        .env-section {
          margin-bottom: 20px;
        }

        .env-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .server-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .server-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: left;
          color: inherit;
          transition: all var(--transition-fast);
        }

        .server-option:hover:not(.disabled) {
          border-color: var(--color-primary);
        }

        .server-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .server-info {
          flex: 1;
        }

        .server-info .server-name {
          display: block;
          font-weight: 500;
        }

        .server-host {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        .access-denied {
          font-size: 0.75rem;
          color: var(--color-danger);
        }
      `}</style>
    </div>
  );
}

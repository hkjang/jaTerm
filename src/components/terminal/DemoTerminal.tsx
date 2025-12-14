'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface DemoTerminalProps {
  serverId?: string;
  serverName?: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
}

// Demo filesystem structure
const DEMO_FS: Record<string, string[]> = {
  '/': ['bin', 'etc', 'home', 'var', 'usr', 'tmp', 'root'],
  '/home': ['demo'],
  '/home/demo': ['documents', 'projects', '.bashrc', '.ssh'],
  '/home/demo/documents': ['readme.txt', 'notes.md'],
  '/home/demo/projects': ['webapp', 'api-server'],
  '/var': ['log', 'www', 'lib'],
  '/var/log': ['syslog', 'auth.log', 'application.log', 'nginx'],
  '/etc': ['passwd', 'hosts', 'nginx', 'ssh'],
};

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+(-rf?|--recursive)?\s+\//, message: '파일 시스템 손상 가능' },
  { pattern: /mkfs/, message: '디스크 포맷 시도' },
  { pattern: /dd\s+.*of=\/dev/, message: '직접 디스크 쓰기' },
  { pattern: /shutdown|reboot|halt|poweroff/, message: '시스템 종료 시도' },
  { pattern: /chmod\s+(-R\s+)?777\s+\//, message: '전체 권한 변경' },
];

export default function DemoTerminal({ 
  serverId = 'demo-server',
  serverName = 'demo-server-01',
  onSessionStart,
  onSessionEnd 
}: DemoTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<{ type: 'input' | 'output' | 'error' | 'warning' | 'success' | 'info', text: string }[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentDir, setCurrentDir] = useState('/home/demo');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(true);
  const [sessionStartTime] = useState(Date.now());

  // Initial connection message
  useEffect(() => {
    const initMessages = [
      { type: 'info' as const, text: '🔐 jaTerm Gateway에 연결 중...' },
      { type: 'success' as const, text: '✓ 인증 성공' },
      { type: 'success' as const, text: '✓ 접근 정책 확인 완료' },
      { type: 'info' as const, text: '📹 세션 녹화가 시작되었습니다' },
      { type: 'output' as const, text: `Connected to ${serverName}` },
      { type: 'output' as const, text: '' },
    ];
    
    initMessages.forEach((msg, i) => {
      setTimeout(() => {
        setHistory(prev => [...prev, msg]);
      }, i * 300);
    });

    onSessionStart?.();

    return () => {
      onSessionEnd?.();
    };
  }, [serverName, onSessionStart, onSessionEnd]);

  // Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Check dangerous command
  const checkDangerousCommand = (cmd: string): { isDangerous: boolean; message?: string } => {
    for (const { pattern, message } of DANGEROUS_PATTERNS) {
      if (pattern.test(cmd.toLowerCase())) {
        return { isDangerous: true, message };
      }
    }
    return { isDangerous: false };
  };

  // Process command
  const processCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add to history
    setHistory(prev => [...prev, { 
      type: 'input', 
      text: `demo@${serverName}:${currentDir}$ ${trimmedCmd}` 
    }]);
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    // Check for dangerous commands
    const dangerCheck = checkDangerousCommand(trimmedCmd);
    if (dangerCheck.isDangerous) {
      setHistory(prev => [
        ...prev,
        { type: 'error', text: `⛔ BLOCKED: 위험 명령 감지됨` },
        { type: 'error', text: `   Risk Score: 100% - ${dangerCheck.message}` },
        { type: 'warning', text: '🚨 보안 알림이 관리자에게 전송되었습니다' },
      ]);
      return;
    }

    // Parse command
    const parts = trimmedCmd.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    // Execute command
    switch (command) {
      case 'ls':
        handleLs(args);
        break;
      case 'cd':
        handleCd(args);
        break;
      case 'pwd':
        setHistory(prev => [...prev, { type: 'output', text: currentDir }]);
        break;
      case 'whoami':
        setHistory(prev => [...prev, { type: 'output', text: 'demo' }]);
        break;
      case 'date':
        setHistory(prev => [...prev, { type: 'output', text: new Date().toString() }]);
        break;
      case 'uptime':
        const uptime = Math.floor((Date.now() - sessionStartTime) / 1000);
        setHistory(prev => [...prev, { 
          type: 'output', 
          text: ` ${new Date().toLocaleTimeString()}  up ${Math.floor(uptime / 60)} min,  1 user,  load average: 0.15, 0.10, 0.05` 
        }]);
        break;
      case 'cat':
        handleCat(args);
        break;
      case 'echo':
        setHistory(prev => [...prev, { type: 'output', text: args.join(' ') }]);
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'help':
        handleHelp();
        break;
      case 'exit':
        setHistory(prev => [
          ...prev,
          { type: 'info', text: '세션이 종료되었습니다.' },
          { type: 'info', text: '📹 세션 녹화가 저장되었습니다.' },
        ]);
        onSessionEnd?.();
        break;
      case 'history':
        commandHistory.forEach((cmd, i) => {
          setHistory(prev => [...prev, { type: 'output', text: `  ${i + 1}  ${cmd}` }]);
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
      case 'sudo':
        setHistory(prev => [
          ...prev,
          { type: 'warning', text: '⚠️ sudo 명령 감지 - 권한 상승 시도가 기록됩니다' },
          { type: 'output', text: 'demo is not in the sudoers file. This incident will be reported.' },
        ]);
        break;
      default:
        setHistory(prev => [...prev, { type: 'error', text: `${command}: command not found` }]);
    }
  }, [currentDir, serverName, commandHistory, sessionStartTime, onSessionEnd]);

  // Command handlers
  const handleLs = (args: string[]) => {
    const path = args[0] || currentDir;
    const fullPath = path.startsWith('/') ? path : `${currentDir}/${path}`.replace(/\/+/g, '/');
    const contents = DEMO_FS[fullPath];
    
    if (contents) {
      const formatted = contents.map(item => {
        const isDir = DEMO_FS[`${fullPath}/${item}`.replace(/\/+/g, '/')];
        return isDir ? `\x1b[34m${item}/\x1b[0m` : item;
      }).join('  ');
      setHistory(prev => [...prev, { type: 'output', text: formatted }]);
    } else {
      setHistory(prev => [...prev, { type: 'error', text: `ls: cannot access '${path}': No such file or directory` }]);
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
    
    // Handle ..
    if (newPath.includes('..')) {
      const parts = currentDir.split('/').filter(Boolean);
      parts.pop();
      newPath = '/' + parts.join('/') || '/';
    }
    
    if (DEMO_FS[newPath]) {
      setCurrentDir(newPath);
    } else {
      setHistory(prev => [...prev, { type: 'error', text: `cd: ${args[0]}: No such file or directory` }]);
    }
  };

  const handleCat = (args: string[]) => {
    if (!args[0]) {
      setHistory(prev => [...prev, { type: 'error', text: 'cat: missing operand' }]);
      return;
    }
    
    const fileContents: Record<string, string> = {
      '/home/demo/documents/readme.txt': 'Welcome to jaTerm Demo!\n\nThis is a demonstration of the web-based SSH terminal.',
      '/home/demo/.bashrc': '# ~/.bashrc\nexport PATH=$HOME/bin:$PATH\nalias ll="ls -la"',
      '/etc/hosts': '127.0.0.1   localhost\n::1         localhost\n192.168.1.10  demo-server-01',
      '/var/log/application.log': '[2024-01-15 10:30:45] INFO - Application started\n[2024-01-15 10:30:46] INFO - Database connected\n[2024-01-15 10:31:00] WARN - High memory usage',
    };
    
    const path = args[0].startsWith('/') ? args[0] : `${currentDir}/${args[0]}`.replace(/\/+/g, '/');
    const content = fileContents[path];
    
    if (content) {
      content.split('\n').forEach(line => {
        setHistory(prev => [...prev, { type: 'output', text: line }]);
      });
    } else {
      setHistory(prev => [...prev, { type: 'error', text: `cat: ${args[0]}: No such file or directory` }]);
    }
  };

  const handleHelp = () => {
    const helpText = [
      'Available commands:',
      '  ls [path]     - List directory contents',
      '  cd [path]     - Change directory',
      '  pwd           - Print working directory',
      '  cat [file]    - Display file contents',
      '  whoami        - Display current user',
      '  date          - Display current date/time',
      '  uptime        - Show system uptime',
      '  ps            - List running processes',
      '  df            - Show disk usage',
      '  top           - Show system resources',
      '  history       - Show command history',
      '  clear         - Clear terminal',
      '  echo [text]   - Display text',
      '  exit          - End session',
      '',
      '⚠️ Dangerous commands (rm -rf, shutdown, etc.) are blocked.',
    ];
    helpText.forEach(line => {
      setHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  const handlePs = () => {
    const processes = [
      '  PID TTY          TIME CMD',
      '    1 ?        00:00:02 systemd',
      '  234 ?        00:00:01 sshd',
      '  567 pts/0    00:00:00 bash',
      '  890 pts/0    00:00:00 ps',
    ];
    processes.forEach(line => {
      setHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  const handleDf = () => {
    const dfOutput = [
      'Filesystem     1K-blocks    Used Available Use% Mounted on',
      '/dev/sda1      102400000 45678900  56721100  45% /',
      'tmpfs            4096000        0   4096000   0% /dev/shm',
      '/dev/sda2       51200000 12345678  38854322  25% /home',
    ];
    dfOutput.forEach(line => {
      setHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  const handleTop = () => {
    const topOutput = [
      `top - ${new Date().toLocaleTimeString()} up 0 min,  1 user,  load average: 0.15, 0.10, 0.05`,
      'Tasks:  89 total,   1 running,  88 sleeping,   0 stopped,   0 zombie',
      '%Cpu(s):  2.3 us,  1.0 sy,  0.0 ni, 96.5 id,  0.2 wa,  0.0 hi,  0.0 si',
      'MiB Mem :   8192.0 total,   4096.0 free,   2048.0 used,   2048.0 buff/cache',
      '',
      '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
      '    1 root      20   0  168940  13280   8500 S   0.0   0.2   0:02.34 systemd',
      '  234 root      20   0   15428   5632   4820 S   0.0   0.1   0:00.45 sshd',
    ];
    topOutput.forEach(line => {
      setHistory(prev => [...prev, { type: 'output', text: line }]);
    });
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      processCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion
      const parts = currentInput.split(/\s+/);
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const dir = DEMO_FS[currentDir] || [];
        const matches = dir.filter(item => item.startsWith(lastPart));
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          setCurrentInput(parts.join(' '));
        }
      }
    }
  };

  return (
    <div className="terminal-container" style={{ height: '100%' }}>
      <div className="terminal-header">
        <div className="terminal-header-title">
          <div className="terminal-dots">
            <div className="terminal-dot terminal-dot-red"></div>
            <div className="terminal-dot terminal-dot-yellow"></div>
            <div className="terminal-dot terminal-dot-green"></div>
          </div>
          <span className="terminal-title">demo@{serverName}:{currentDir}</span>
        </div>
        <div className="terminal-toolbar">
          {isRecording && (
            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                background: 'currentColor', 
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }}></span>
              REC
            </span>
          )}
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setHistory([])}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div 
        ref={terminalRef}
        className="terminal-body"
        onClick={focusInput}
        style={{ 
          height: 'calc(100% - 50px)',
          overflow: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          cursor: 'text'
        }}
      >
        {history.map((line, i) => (
          <div 
            key={i}
            style={{
              color: line.type === 'error' ? 'var(--color-danger)' :
                     line.type === 'warning' ? 'var(--color-warning)' :
                     line.type === 'success' ? 'var(--color-success)' :
                     line.type === 'info' ? 'var(--color-info)' :
                     line.type === 'input' ? 'var(--terminal-fg)' :
                     'var(--color-text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {line.text}
          </div>
        ))}
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-success)' }}>demo@{serverName}</span>
          <span style={{ color: 'var(--color-text-primary)' }}>:</span>
          <span style={{ color: 'var(--color-primary)' }}>{currentDir}</span>
          <span style={{ color: 'var(--color-text-primary)' }}>$ </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--terminal-fg)',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              caretColor: 'var(--color-primary)'
            }}
            autoFocus
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// Terminal State Management Store

import { 
  TerminalTab, 
  SessionGroup, 
  TerminalSplit, 
  TerminalSettings,
  TerminalTheme,
  CommandHistoryItem,
  CommandFavorite,
  SecuritySettings,
  ConnectionStatus,
  ChatMessage,
  SessionComment,
  Macro,
  RolePermissions,
  DEFAULT_ROLE_PERMISSIONS,
  TerminalRole
} from './types';

// ============================================
// Default Themes
// ============================================

export const DEFAULT_THEMES: TerminalTheme[] = [
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    background: '#0d1117',
    foreground: '#c9d1d9',
    cursor: '#58a6ff',
    selection: 'rgba(56, 139, 253, 0.4)',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#f0f6fc',
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    background: '#2d2a2e',
    foreground: '#fcfcfa',
    cursor: '#ffd866',
    selection: 'rgba(255, 216, 102, 0.3)',
    black: '#403e41',
    red: '#ff6188',
    green: '#a9dc76',
    yellow: '#ffd866',
    blue: '#78dce8',
    magenta: '#ab9df2',
    cyan: '#78dce8',
    white: '#fcfcfa',
    brightBlack: '#727072',
    brightRed: '#ff6188',
    brightGreen: '#a9dc76',
    brightYellow: '#ffd866',
    brightBlue: '#78dce8',
    brightMagenta: '#ab9df2',
    brightCyan: '#78dce8',
    brightWhite: '#fcfcfa',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    selection: 'rgba(68, 71, 90, 0.7)',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#cb4b16',
    selection: 'rgba(7, 54, 66, 0.8)',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  {
    id: 'prod-danger',
    name: 'Production (Danger)',
    background: '#1a0a0a',
    foreground: '#ffcccc',
    cursor: '#ff4444',
    selection: 'rgba(255, 68, 68, 0.3)',
    black: '#2e0c0c',
    red: '#ff5555',
    green: '#55ff55',
    yellow: '#ffff55',
    blue: '#5555ff',
    magenta: '#ff55ff',
    cyan: '#55ffff',
    white: '#ffffff',
    brightBlack: '#555555',
    brightRed: '#ff5555',
    brightGreen: '#55ff55',
    brightYellow: '#ffff55',
    brightBlue: '#5555ff',
    brightMagenta: '#ff55ff',
    brightCyan: '#55ffff',
    brightWhite: '#ffffff',
  },
];

// ============================================
// Default Settings
// ============================================

export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
  fontSize: 14,
  fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  lineHeight: 1.4,
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 10000,
  bellStyle: 'visual',
  theme: 'dark-pro',
  autoScroll: true,
  wordWrap: false,
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  pasteFilterEnabled: true,
  typingSpeedDetection: true,
  autoLockEnabled: true,
  autoLockTimeout: 300, // 5 minutes
  watermarkEnabled: true,
  readOnlyMode: false,
};

// ============================================
// Terminal Store
// ============================================

export interface TerminalStore {
  // Tabs & Sessions
  tabs: TerminalTab[];
  activeTabId: string | null;
  sessionGroups: SessionGroup[];
  splits: TerminalSplit[];
  
  // Settings
  settings: TerminalSettings;
  securitySettings: SecuritySettings;
  themes: TerminalTheme[];
  
  // Commands
  commandHistory: CommandHistoryItem[];
  favorites: CommandFavorite[];
  
  // Connection
  connectionStatuses: Record<string, ConnectionStatus>;
  
  // Collaboration
  chatMessages: ChatMessage[];
  sessionComments: SessionComment[];
  
  // Automation
  macros: Macro[];
  
  // User
  userRole: TerminalRole;
  permissions: RolePermissions;
  
  // UI State
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  inputPreviewEnabled: boolean;
  isLocked: boolean;
  lastActivity: Date;
}

// ============================================
// Store Actions
// ============================================

type StoreListener = (store: TerminalStore) => void;

class TerminalStoreManager {
  private store: TerminalStore;
  private listeners: Set<StoreListener> = new Set();

  constructor() {
    this.store = this.getInitialState();
  }

  private getInitialState(): TerminalStore {
    return {
      tabs: [],
      activeTabId: null,
      sessionGroups: [],
      splits: [],
      settings: DEFAULT_TERMINAL_SETTINGS,
      securitySettings: DEFAULT_SECURITY_SETTINGS,
      themes: DEFAULT_THEMES,
      commandHistory: [],
      favorites: [],
      connectionStatuses: {},
      chatMessages: [],
      sessionComments: [],
      macros: [],
      userRole: 'operator',
      permissions: DEFAULT_ROLE_PERMISSIONS['operator'],
      sidebarOpen: true,
      commandPaletteOpen: false,
      settingsOpen: false,
      inputPreviewEnabled: true,
      isLocked: false,
      lastActivity: new Date(),
    };
  }

  getState(): TerminalStore {
    return this.store;
  }

  subscribe(listener: StoreListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.store));
  }

  // Tab Management
  addTab(tab: TerminalTab) {
    this.store = {
      ...this.store,
      tabs: [...this.store.tabs, tab],
      activeTabId: tab.id,
    };
    this.notify();
  }

  removeTab(tabId: string) {
    const newTabs = this.store.tabs.filter(t => t.id !== tabId);
    const newActiveTabId = this.store.activeTabId === tabId 
      ? newTabs[newTabs.length - 1]?.id || null
      : this.store.activeTabId;
    
    this.store = {
      ...this.store,
      tabs: newTabs,
      activeTabId: newActiveTabId,
    };
    this.notify();
  }

  setActiveTab(tabId: string) {
    this.store = { ...this.store, activeTabId: tabId };
    this.notify();
  }

  updateTabStatus(tabId: string, status: TerminalTab['status']) {
    this.store = {
      ...this.store,
      tabs: this.store.tabs.map(t => 
        t.id === tabId ? { ...t, status } : t
      ),
    };
    this.notify();
  }

  // Session Groups
  addSessionGroup(group: SessionGroup) {
    this.store = {
      ...this.store,
      sessionGroups: [...this.store.sessionGroups, group],
    };
    this.notify();
  }

  removeSessionGroup(groupId: string) {
    this.store = {
      ...this.store,
      sessionGroups: this.store.sessionGroups.filter(g => g.id !== groupId),
    };
    this.notify();
  }

  // Settings
  updateSettings(settings: Partial<TerminalSettings>) {
    this.store = {
      ...this.store,
      settings: { ...this.store.settings, ...settings },
    };
    this.saveSettings();
    this.notify();
  }

  updateSecuritySettings(settings: Partial<SecuritySettings>) {
    this.store = {
      ...this.store,
      securitySettings: { ...this.store.securitySettings, ...settings },
    };
    this.saveSettings();
    this.notify();
  }

  // Commands
  addToHistory(command: CommandHistoryItem) {
    this.store = {
      ...this.store,
      commandHistory: [command, ...this.store.commandHistory].slice(0, 1000),
    };
    this.notify();
  }

  addFavorite(favorite: CommandFavorite) {
    this.store = {
      ...this.store,
      favorites: [...this.store.favorites, favorite],
    };
    this.notify();
  }

  removeFavorite(id: string) {
    this.store = {
      ...this.store,
      favorites: this.store.favorites.filter(f => f.id !== id),
    };
    this.notify();
  }

  // Connection
  updateConnectionStatus(sessionId: string, status: ConnectionStatus) {
    this.store = {
      ...this.store,
      connectionStatuses: {
        ...this.store.connectionStatuses,
        [sessionId]: status,
      },
    };
    this.notify();
  }

  // Role
  setUserRole(role: TerminalRole) {
    this.store = {
      ...this.store,
      userRole: role,
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
    };
    this.notify();
  }

  // UI State
  toggleSidebar() {
    this.store = { ...this.store, sidebarOpen: !this.store.sidebarOpen };
    this.notify();
  }

  toggleCommandPalette() {
    this.store = { ...this.store, commandPaletteOpen: !this.store.commandPaletteOpen };
    this.notify();
  }

  toggleSettings() {
    this.store = { ...this.store, settingsOpen: !this.store.settingsOpen };
    this.notify();
  }

  toggleInputPreview() {
    this.store = { ...this.store, inputPreviewEnabled: !this.store.inputPreviewEnabled };
    this.notify();
  }

  lockTerminal() {
    this.store = { ...this.store, isLocked: true };
    this.notify();
  }

  unlockTerminal() {
    this.store = { ...this.store, isLocked: false, lastActivity: new Date() };
    this.notify();
  }

  updateActivity() {
    this.store = { ...this.store, lastActivity: new Date() };
    // No notify for activity updates to avoid excessive re-renders
  }

  // Macros
  addMacro(macro: Macro) {
    this.store = {
      ...this.store,
      macros: [...this.store.macros, macro],
    };
    this.notify();
  }

  removeMacro(id: string) {
    this.store = {
      ...this.store,
      macros: this.store.macros.filter(m => m.id !== id),
    };
    this.notify();
  }

  updateMacro(id: string, updates: Partial<Macro>) {
    this.store = {
      ...this.store,
      macros: this.store.macros.map(m => 
        m.id === id ? { ...m, ...updates } : m
      ),
    };
    this.notify();
  }

  // Chat & Comments
  addChatMessage(message: ChatMessage) {
    this.store = {
      ...this.store,
      chatMessages: [...this.store.chatMessages, message],
    };
    this.notify();
  }

  addSessionComment(comment: SessionComment) {
    this.store = {
      ...this.store,
      sessionComments: [...this.store.sessionComments, comment],
    };
    this.notify();
  }

  // Persistence
  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('terminal-settings', JSON.stringify(this.store.settings));
      localStorage.setItem('terminal-security', JSON.stringify(this.store.securitySettings));
    }
  }

  loadSettings() {
    if (typeof window !== 'undefined') {
      try {
        const settings = localStorage.getItem('terminal-settings');
        const security = localStorage.getItem('terminal-security');
        
        if (settings) {
          this.store = {
            ...this.store,
            settings: { ...DEFAULT_TERMINAL_SETTINGS, ...JSON.parse(settings) },
          };
        }
        
        if (security) {
          this.store = {
            ...this.store,
            securitySettings: { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(security) },
          };
        }
      } catch (e) {
        console.error('Failed to load terminal settings:', e);
      }
    }
    this.notify();
  }

  // Reset
  reset() {
    this.store = this.getInitialState();
    this.notify();
  }
}

// Export singleton
export const terminalStore = new TerminalStoreManager();

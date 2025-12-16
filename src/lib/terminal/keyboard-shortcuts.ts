// Keyboard Shortcuts Manager for Terminal
// Allows users to customize keyboard shortcuts

// ============================================
// Default Shortcut Definitions
// ============================================

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  category: 'navigation' | 'terminal' | 'editing' | 'session' | 'ai' | 'general';
  defaultKeys: string[];
  customKeys?: string[];
  isEnabled: boolean;
}

export interface ShortcutAction {
  id: string;
  execute: () => void;
}

// Key normalization for cross-platform
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace('control', 'ctrl')
    .replace('command', 'meta')
    .replace('option', 'alt');
}

// Parse keyboard event to shortcut string
export function eventToShortcutString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  if (e.metaKey) parts.push('meta');
  
  const key = e.key.toLowerCase();
  if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
    parts.push(key === ' ' ? 'space' : key);
  }
  
  return parts.join('+');
}

// Compare shortcut strings
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const eventString = eventToShortcutString(event);
  const normalizedShortcut = normalizeKey(shortcut);
  return eventString === normalizedShortcut;
}

// ============================================
// Default Shortcuts
// ============================================

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'new-tab',
    name: '새 탭',
    description: '새 터미널 탭을 엽니다',
    category: 'navigation',
    defaultKeys: ['ctrl+t'],
    isEnabled: true,
  },
  {
    id: 'close-tab',
    name: '탭 닫기',
    description: '현재 탭을 닫습니다',
    category: 'navigation',
    defaultKeys: ['ctrl+w'],
    isEnabled: true,
  },
  {
    id: 'prev-tab',
    name: '이전 탭',
    description: '이전 탭으로 이동합니다',
    category: 'navigation',
    defaultKeys: ['ctrl+shift+tab', 'ctrl+pageup'],
    isEnabled: true,
  },
  {
    id: 'next-tab',
    name: '다음 탭',
    description: '다음 탭으로 이동합니다',
    category: 'navigation',
    defaultKeys: ['ctrl+tab', 'ctrl+pagedown'],
    isEnabled: true,
  },
  {
    id: 'goto-tab-1',
    name: '탭 1로 이동',
    description: '첫 번째 탭으로 이동합니다',
    category: 'navigation',
    defaultKeys: ['alt+1'],
    isEnabled: true,
  },
  {
    id: 'goto-tab-2',
    name: '탭 2로 이동',
    description: '두 번째 탭으로 이동합니다',
    category: 'navigation',
    defaultKeys: ['alt+2'],
    isEnabled: true,
  },

  // Terminal
  {
    id: 'clear-terminal',
    name: '터미널 지우기',
    description: '터미널 화면을 지웁니다',
    category: 'terminal',
    defaultKeys: ['ctrl+l'],
    isEnabled: true,
  },
  {
    id: 'cancel-command',
    name: '명령 취소',
    description: '실행 중인 명령을 취소합니다',
    category: 'terminal',
    defaultKeys: ['ctrl+c'],
    isEnabled: true,
  },
  {
    id: 'scroll-up',
    name: '위로 스크롤',
    description: '터미널 출력을 위로 스크롤합니다',
    category: 'terminal',
    defaultKeys: ['shift+pageup'],
    isEnabled: true,
  },
  {
    id: 'scroll-down',
    name: '아래로 스크롤',
    description: '터미널 출력을 아래로 스크롤합니다',
    category: 'terminal',
    defaultKeys: ['shift+pagedown'],
    isEnabled: true,
  },
  {
    id: 'scroll-to-top',
    name: '맨 위로',
    description: '터미널 출력 맨 위로 이동합니다',
    category: 'terminal',
    defaultKeys: ['ctrl+home'],
    isEnabled: true,
  },
  {
    id: 'scroll-to-bottom',
    name: '맨 아래로',
    description: '터미널 출력 맨 아래로 이동합니다',
    category: 'terminal',
    defaultKeys: ['ctrl+end'],
    isEnabled: true,
  },

  // Editing
  {
    id: 'copy',
    name: '복사',
    description: '선택한 텍스트를 복사합니다',
    category: 'editing',
    defaultKeys: ['ctrl+shift+c', 'ctrl+insert'],
    isEnabled: true,
  },
  {
    id: 'paste',
    name: '붙여넣기',
    description: '클립보드 내용을 붙여넣습니다',
    category: 'editing',
    defaultKeys: ['ctrl+shift+v', 'shift+insert'],
    isEnabled: true,
  },
  {
    id: 'select-all',
    name: '전체 선택',
    description: '터미널 내용을 모두 선택합니다',
    category: 'editing',
    defaultKeys: ['ctrl+shift+a'],
    isEnabled: true,
  },
  {
    id: 'find',
    name: '찾기',
    description: '터미널에서 텍스트를 검색합니다',
    category: 'editing',
    defaultKeys: ['ctrl+shift+f'],
    isEnabled: true,
  },

  // Session
  {
    id: 'toggle-recording',
    name: '녹화 토글',
    description: '세션 녹화를 시작/중지합니다',
    category: 'session',
    defaultKeys: ['ctrl+shift+r'],
    isEnabled: true,
  },
  {
    id: 'toggle-sidebar',
    name: '사이드바 토글',
    description: '사이드바를 표시/숨깁니다',
    category: 'session',
    defaultKeys: ['ctrl+b'],
    isEnabled: true,
  },
  {
    id: 'toggle-fullscreen',
    name: '전체 화면',
    description: '전체 화면 모드를 토글합니다',
    category: 'session',
    defaultKeys: ['f11'],
    isEnabled: true,
  },
  {
    id: 'disconnect',
    name: '연결 종료',
    description: '현재 세션 연결을 종료합니다',
    category: 'session',
    defaultKeys: ['ctrl+shift+d'],
    isEnabled: true,
  },

  // AI
  {
    id: 'ai-explain',
    name: 'AI 설명',
    description: 'AI에게 현재 명령 설명을 요청합니다',
    category: 'ai',
    defaultKeys: ['ctrl+shift+e'],
    isEnabled: true,
  },
  {
    id: 'ai-suggest',
    name: 'AI 제안',
    description: 'AI에게 명령 제안을 요청합니다',
    category: 'ai',
    defaultKeys: ['ctrl+shift+s'],
    isEnabled: true,
  },

  // General
  {
    id: 'open-settings',
    name: '설정 열기',
    description: '설정 패널을 엽니다',
    category: 'general',
    defaultKeys: ['ctrl+,'],
    isEnabled: true,
  },
  {
    id: 'open-history',
    name: '히스토리 열기',
    description: '명령 히스토리 패널을 엽니다',
    category: 'general',
    defaultKeys: ['ctrl+h'],
    isEnabled: true,
  },
  {
    id: 'command-palette',
    name: '명령 팔레트',
    description: '명령 팔레트를 엽니다',
    category: 'general',
    defaultKeys: ['ctrl+shift+p', 'f1'],
    isEnabled: true,
  },
];

// ============================================
// Keyboard Shortcuts Manager
// ============================================

const SHORTCUTS_STORAGE_KEY = 'jaTerm_keyboardShortcuts';

class KeyboardShortcutsManager {
  private shortcuts: KeyboardShortcut[] = [];
  private actions: Map<string, () => void> = new Map();
  private isListening = false;

  constructor() {
    this.loadShortcuts();
  }

  private loadShortcuts() {
    if (typeof window === 'undefined') {
      this.shortcuts = [...DEFAULT_SHORTCUTS];
      return;
    }

    try {
      const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (stored) {
        const customizations = JSON.parse(stored) as Record<string, Partial<KeyboardShortcut>>;
        
        // Merge custom settings with defaults
        this.shortcuts = DEFAULT_SHORTCUTS.map(shortcut => {
          const custom = customizations[shortcut.id];
          if (custom) {
            return { ...shortcut, ...custom };
          }
          return shortcut;
        });
      } else {
        this.shortcuts = [...DEFAULT_SHORTCUTS];
      }
    } catch (e) {
      console.error('Failed to load shortcuts:', e);
      this.shortcuts = [...DEFAULT_SHORTCUTS];
    }
  }

  private saveShortcuts() {
    if (typeof window === 'undefined') return;

    try {
      // Only save customized properties
      const customizations: Record<string, Partial<KeyboardShortcut>> = {};
      
      this.shortcuts.forEach(shortcut => {
        const defaultShortcut = DEFAULT_SHORTCUTS.find(d => d.id === shortcut.id);
        if (!defaultShortcut) return;

        const customProps: Partial<KeyboardShortcut> = {};
        
        if (shortcut.customKeys) {
          customProps.customKeys = shortcut.customKeys;
        }
        if (shortcut.isEnabled !== defaultShortcut.isEnabled) {
          customProps.isEnabled = shortcut.isEnabled;
        }
        
        if (Object.keys(customProps).length > 0) {
          customizations[shortcut.id] = customProps;
        }
      });

      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(customizations));
    } catch (e) {
      console.error('Failed to save shortcuts:', e);
    }
  }

  // Get all shortcuts
  getAllShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  // Get shortcuts by category
  getShortcutsByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
    return this.shortcuts.filter(s => s.category === category);
  }

  // Get shortcut by ID
  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.find(s => s.id === id);
  }

  // Get active keys for a shortcut (custom or default)
  getActiveKeys(id: string): string[] {
    const shortcut = this.getShortcut(id);
    if (!shortcut) return [];
    return shortcut.customKeys || shortcut.defaultKeys;
  }

  // Update shortcut keys
  updateShortcut(id: string, customKeys: string[]): boolean {
    const index = this.shortcuts.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.shortcuts[index] = {
      ...this.shortcuts[index],
      customKeys,
    };
    this.saveShortcuts();
    return true;
  }

  // Reset shortcut to default
  resetShortcut(id: string): boolean {
    const index = this.shortcuts.findIndex(s => s.id === id);
    if (index === -1) return false;

    delete this.shortcuts[index].customKeys;
    this.saveShortcuts();
    return true;
  }

  // Reset all shortcuts to defaults
  resetAllShortcuts() {
    this.shortcuts = DEFAULT_SHORTCUTS.map(s => ({ ...s }));
    this.saveShortcuts();
  }

  // Enable/disable a shortcut
  setShortcutEnabled(id: string, enabled: boolean): boolean {
    const index = this.shortcuts.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.shortcuts[index].isEnabled = enabled;
    this.saveShortcuts();
    return true;
  }

  // Register action for a shortcut
  registerAction(id: string, action: () => void) {
    this.actions.set(id, action);
  }

  // Unregister action
  unregisterAction(id: string) {
    this.actions.delete(id);
  }

  // Check for conflicts
  findConflicts(keys: string[]): KeyboardShortcut[] {
    return this.shortcuts.filter(s => {
      const activeKeys = s.customKeys || s.defaultKeys;
      return keys.some(key => 
        activeKeys.some(ak => normalizeKey(ak) === normalizeKey(key))
      );
    });
  }

  // Handle keyboard event
  handleKeyEvent(event: KeyboardEvent): boolean {
    if (!this.isListening) return false;

    const eventString = eventToShortcutString(event);
    
    for (const shortcut of this.shortcuts) {
      if (!shortcut.isEnabled) continue;
      
      const keys = shortcut.customKeys || shortcut.defaultKeys;
      for (const key of keys) {
        if (normalizeKey(key) === eventString) {
          const action = this.actions.get(shortcut.id);
          if (action) {
            event.preventDefault();
            event.stopPropagation();
            action();
            return true;
          }
        }
      }
    }
    
    return false;
  }

  // Start listening for shortcuts
  startListening() {
    if (this.isListening || typeof window === 'undefined') return;
    
    this.isListening = true;
    document.addEventListener('keydown', this.handleKeyEvent.bind(this), true);
  }

  // Stop listening
  stopListening() {
    if (!this.isListening || typeof window === 'undefined') return;
    
    this.isListening = false;
    document.removeEventListener('keydown', this.handleKeyEvent.bind(this), true);
  }

  // Format shortcut for display
  formatShortcut(keys: string): string {
    return keys
      .split('+')
      .map(k => {
        switch (k.toLowerCase()) {
          case 'ctrl': return 'Ctrl';
          case 'alt': return 'Alt';
          case 'shift': return 'Shift';
          case 'meta': return '⌘';
          case 'space': return 'Space';
          case 'arrowup': return '↑';
          case 'arrowdown': return '↓';
          case 'arrowleft': return '←';
          case 'arrowright': return '→';
          case 'enter': return 'Enter';
          case 'escape': return 'Esc';
          case 'backspace': return 'Backspace';
          case 'delete': return 'Del';
          case 'tab': return 'Tab';
          case 'pageup': return 'PgUp';
          case 'pagedown': return 'PgDn';
          case 'home': return 'Home';
          case 'end': return 'End';
          case 'insert': return 'Ins';
          default: return k.toUpperCase();
        }
      })
      .join(' + ');
  }
}

// Singleton instance
export const keyboardShortcutsManager = new KeyboardShortcutsManager();

// ============================================
// React Hook for Shortcuts
// ============================================

export function useKeyboardShortcut(id: string, action: () => void) {
  if (typeof window !== 'undefined') {
    keyboardShortcutsManager.registerAction(id, action);
    return () => keyboardShortcutsManager.unregisterAction(id);
  }
  return () => {};
}

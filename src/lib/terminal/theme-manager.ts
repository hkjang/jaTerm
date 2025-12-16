// Theme Manager for Terminal Customization
// Allows users to create, update, and manage custom terminal themes

import { TerminalTheme } from './types';

// ============================================
// Storage Keys
// ============================================

const CUSTOM_THEMES_KEY = 'jaTerm_customThemes';
const ACTIVE_THEME_KEY = 'jaTerm_activeTheme';

// ============================================
// Default Built-in Themes
// ============================================

export const BUILT_IN_THEMES: TerminalTheme[] = [
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    background: '#0d1117',
    foreground: '#c9d1d9',
    cursor: '#58a6ff',
    selection: 'rgba(56, 139, 253, 0.4)',
    black: '#484f58',
    red: '#ff7b72',
    green: '#7ee787',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#76e3ea',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#7ee787',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#a5d6ff',
    brightWhite: '#f0f6fc',
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    background: '#2d2a2e',
    foreground: '#fcfcfa',
    cursor: '#ffd866',
    selection: 'rgba(99, 99, 99, 0.4)',
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
    cursor: '#839496',
    selection: 'rgba(88, 110, 117, 0.4)',
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
  {
    id: 'high-contrast',
    name: 'High Contrast',
    background: '#000000',
    foreground: '#ffffff',
    cursor: '#00ff00',
    selection: 'rgba(0, 255, 0, 0.3)',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#0000ff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
    brightBlack: '#808080',
    brightRed: '#ff0000',
    brightGreen: '#00ff00',
    brightYellow: '#ffff00',
    brightBlue: '#0000ff',
    brightMagenta: '#ff00ff',
    brightCyan: '#00ffff',
    brightWhite: '#ffffff',
  },
];

// ============================================
// Theme Manager Class
// ============================================

class ThemeManager {
  private customThemes: TerminalTheme[] = [];
  private activeThemeId: string = 'dark-pro';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
      if (stored) {
        this.customThemes = JSON.parse(stored);
      }

      const activeTheme = localStorage.getItem(ACTIVE_THEME_KEY);
      if (activeTheme) {
        this.activeThemeId = activeTheme;
      }
    } catch (e) {
      console.error('Failed to load themes from storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(this.customThemes));
      localStorage.setItem(ACTIVE_THEME_KEY, this.activeThemeId);
    } catch (e) {
      console.error('Failed to save themes to storage:', e);
    }
  }

  // Get all themes (built-in + custom)
  getAllThemes(): TerminalTheme[] {
    return [...BUILT_IN_THEMES, ...this.customThemes];
  }

  // Get only custom themes
  getCustomThemes(): TerminalTheme[] {
    return [...this.customThemes];
  }

  // Get theme by ID
  getTheme(id: string): TerminalTheme | undefined {
    return this.getAllThemes().find(t => t.id === id);
  }

  // Get active theme
  getActiveTheme(): TerminalTheme {
    return this.getTheme(this.activeThemeId) || BUILT_IN_THEMES[0];
  }

  // Set active theme
  setActiveTheme(themeId: string): boolean {
    const theme = this.getTheme(themeId);
    if (!theme) return false;

    this.activeThemeId = themeId;
    this.saveToStorage();
    return true;
  }

  // Create new custom theme
  createTheme(theme: Omit<TerminalTheme, 'id'>): TerminalTheme {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newTheme: TerminalTheme = { id, ...theme };
    this.customThemes.push(newTheme);
    this.saveToStorage();
    return newTheme;
  }

  // Update existing custom theme
  updateTheme(id: string, updates: Partial<Omit<TerminalTheme, 'id'>>): boolean {
    const index = this.customThemes.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.customThemes[index] = { ...this.customThemes[index], ...updates };
    this.saveToStorage();
    return true;
  }

  // Delete custom theme
  deleteTheme(id: string): boolean {
    // Can't delete built-in themes
    if (BUILT_IN_THEMES.some(t => t.id === id)) return false;

    const index = this.customThemes.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.customThemes.splice(index, 1);

    // If deleted theme was active, switch to default
    if (this.activeThemeId === id) {
      this.activeThemeId = 'dark-pro';
    }

    this.saveToStorage();
    return true;
  }

  // Duplicate a theme as a new custom theme
  duplicateTheme(id: string, newName: string): TerminalTheme | null {
    const source = this.getTheme(id);
    if (!source) return null;

    const { id: _, ...themeWithoutId } = source;
    return this.createTheme({ ...themeWithoutId, name: newName });
  }

  // Generate CSS variables from theme
  getThemeCSSVariables(theme: TerminalTheme): Record<string, string> {
    return {
      '--terminal-bg': theme.background,
      '--terminal-fg': theme.foreground,
      '--terminal-cursor': theme.cursor,
      '--terminal-selection': theme.selection,
      '--terminal-black': theme.black,
      '--terminal-red': theme.red,
      '--terminal-green': theme.green,
      '--terminal-yellow': theme.yellow,
      '--terminal-blue': theme.blue,
      '--terminal-magenta': theme.magenta,
      '--terminal-cyan': theme.cyan,
      '--terminal-white': theme.white,
      '--terminal-bright-black': theme.brightBlack,
      '--terminal-bright-red': theme.brightRed,
      '--terminal-bright-green': theme.brightGreen,
      '--terminal-bright-yellow': theme.brightYellow,
      '--terminal-bright-blue': theme.brightBlue,
      '--terminal-bright-magenta': theme.brightMagenta,
      '--terminal-bright-cyan': theme.brightCyan,
      '--terminal-bright-white': theme.brightWhite,
    };
  }

  // Export theme as JSON
  exportTheme(id: string): string | null {
    const theme = this.getTheme(id);
    if (!theme) return null;
    return JSON.stringify(theme, null, 2);
  }

  // Import theme from JSON
  importTheme(json: string): TerminalTheme | null {
    try {
      const parsed = JSON.parse(json);
      // Validate required fields
      const required = ['name', 'background', 'foreground', 'cursor', 'selection'];
      for (const field of required) {
        if (!parsed[field]) throw new Error(`Missing required field: ${field}`);
      }
      // Remove ID to create new one
      const { id: _, ...themeData } = parsed;
      return this.createTheme(themeData);
    } catch (e) {
      console.error('Failed to import theme:', e);
      return null;
    }
  }

  // Get environment-specific theme
  getEnvironmentTheme(environment: 'PROD' | 'STAGE' | 'DEV'): TerminalTheme {
    switch (environment) {
      case 'PROD':
        return this.getTheme('prod-danger') || BUILT_IN_THEMES[0];
      default:
        return this.getActiveTheme();
    }
  }
}

// Singleton instance
export const themeManager = new ThemeManager();

// ============================================
// Theme Presets for Quick Creation
// ============================================

export const THEME_PRESETS: Partial<TerminalTheme>[] = [
  {
    name: 'Ocean Blue',
    background: '#0a192f',
    foreground: '#8892b0',
    cursor: '#64ffda',
    selection: 'rgba(100, 255, 218, 0.2)',
  },
  {
    name: 'Forest Green',
    background: '#1a1d23',
    foreground: '#a8b5b2',
    cursor: '#98c379',
    selection: 'rgba(152, 195, 121, 0.2)',
  },
  {
    name: 'Sunset Orange',
    background: '#1a1a2e',
    foreground: '#eee8d5',
    cursor: '#e94560',
    selection: 'rgba(233, 69, 96, 0.2)',
  },
  {
    name: 'Midnight Purple',
    background: '#1a1a2e',
    foreground: '#d4bfff',
    cursor: '#a855f7',
    selection: 'rgba(168, 85, 247, 0.2)',
  },
];

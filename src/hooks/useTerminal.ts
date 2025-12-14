'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  terminalStore, 
  TerminalStore, 
  DEFAULT_TERMINAL_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from '@/lib/terminal/store';
import {
  TerminalTab,
  CommandHistoryItem,
  CommandFavorite,
  Macro,
  ConnectionStatus,
  TerminalRole,
  RolePermissions,
  TerminalSettings,
  SecuritySettings,
  TerminalTheme,
} from '@/lib/terminal/types';

// Custom hook to use terminal store with React
export function useTerminalStore<T>(selector: (state: TerminalStore) => T): T {
  const [state, setState] = useState(() => selector(terminalStore.getState()));

  useEffect(() => {
    const unsubscribe = terminalStore.subscribe((newState) => {
      const newValue = selector(newState);
      setState(newValue);
    });

    return () => { unsubscribe(); };
  }, [selector]);

  return state;
}

// Hook for terminal tabs
export function useTerminalTabs() {
  const tabs = useTerminalStore((s: TerminalStore) => s.tabs);
  const activeTabId = useTerminalStore((s: TerminalStore) => s.activeTabId);
  const activeTab = tabs.find((t: TerminalTab) => t.id === activeTabId);

  const addTab = useCallback((tab: TerminalTab) => {
    terminalStore.addTab(tab);
  }, []);

  const removeTab = useCallback((tabId: string) => {
    terminalStore.removeTab(tabId);
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    terminalStore.setActiveTab(tabId);
  }, []);

  return { tabs, activeTabId, activeTab, addTab, removeTab, setActiveTab };
}

// Hook for terminal settings
export function useTerminalSettings() {
  const settings = useTerminalStore((s: TerminalStore) => s.settings);
  const themes = useTerminalStore((s: TerminalStore) => s.themes);
  const currentTheme = themes.find((t: TerminalTheme) => t.id === settings.theme) || themes[0];

  const updateSettings = useCallback((updates: Partial<TerminalSettings>) => {
    terminalStore.updateSettings(updates);
  }, []);

  return { settings, themes, currentTheme, updateSettings };
}

// Hook for security settings
export function useSecuritySettings() {
  const securitySettings = useTerminalStore((s: TerminalStore) => s.securitySettings);
  const isLocked = useTerminalStore((s: TerminalStore) => s.isLocked);

  const updateSecuritySettings = useCallback((updates: Partial<SecuritySettings>) => {
    terminalStore.updateSecuritySettings(updates);
  }, []);

  const lock = useCallback(() => {
    terminalStore.lockTerminal();
  }, []);

  const unlock = useCallback(() => {
    terminalStore.unlockTerminal();
  }, []);

  return { securitySettings, isLocked, updateSecuritySettings, lock, unlock };
}

// Hook for command history
export function useCommandHistory() {
  const commandHistory = useTerminalStore((s: TerminalStore) => s.commandHistory);
  const favorites = useTerminalStore((s: TerminalStore) => s.favorites);

  const addToHistory = useCallback((command: CommandHistoryItem) => {
    terminalStore.addToHistory(command);
  }, []);

  const addFavorite = useCallback((favorite: CommandFavorite) => {
    terminalStore.addFavorite(favorite);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    terminalStore.removeFavorite(id);
  }, []);

  return { commandHistory, favorites, addToHistory, addFavorite, removeFavorite };
}

// Hook for macros
export function useMacros() {
  const macros = useTerminalStore((s: TerminalStore) => s.macros);

  const addMacro = useCallback((macro: Macro) => {
    terminalStore.addMacro(macro);
  }, []);

  const removeMacro = useCallback((id: string) => {
    terminalStore.removeMacro(id);
  }, []);

  const updateMacro = useCallback((id: string, updates: Partial<Macro>) => {
    terminalStore.updateMacro(id, updates);
  }, []);

  return { macros, addMacro, removeMacro, updateMacro };
}

// Hook for connection status
export function useConnectionStatus(sessionId: string) {
  const connectionStatuses = useTerminalStore((s: TerminalStore) => s.connectionStatuses);
  const status = connectionStatuses[sessionId];

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    terminalStore.updateConnectionStatus(sessionId, newStatus);
  }, [sessionId]);

  return { status, updateStatus };
}

// Hook for user role and permissions
export function useTerminalRole() {
  const userRole = useTerminalStore((s: TerminalStore) => s.userRole);
  const permissions = useTerminalStore((s: TerminalStore) => s.permissions);

  const setRole = useCallback((role: TerminalRole) => {
    terminalStore.setUserRole(role);
  }, []);

  return { userRole, permissions, setRole };
}

// Hook for UI state
export function useTerminalUI() {
  const sidebarOpen = useTerminalStore((s: TerminalStore) => s.sidebarOpen);
  const commandPaletteOpen = useTerminalStore((s: TerminalStore) => s.commandPaletteOpen);
  const settingsOpen = useTerminalStore((s: TerminalStore) => s.settingsOpen);
  const inputPreviewEnabled = useTerminalStore((s: TerminalStore) => s.inputPreviewEnabled);

  return {
    sidebarOpen,
    commandPaletteOpen,
    settingsOpen,
    inputPreviewEnabled,
    toggleSidebar: () => terminalStore.toggleSidebar(),
    toggleCommandPalette: () => terminalStore.toggleCommandPalette(),
    toggleSettings: () => terminalStore.toggleSettings(),
    toggleInputPreview: () => terminalStore.toggleInputPreview(),
  };
}

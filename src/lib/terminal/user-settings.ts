// User Settings Manager for Terminal
// Handles personalization settings including default server, AI model, and notifications

// ============================================
// Types
// ============================================

export interface UserSettings {
  // Default server preferences
  defaultServerId?: string;
  lastConnectedServerId?: string;
  favoriteServerIds: string[];
  
  // AI preferences
  defaultAIProviderId?: string;
  defaultAIModelId?: string;
  aiSuggestionsEnabled: boolean;
  
  // Notification preferences
  notifications: NotificationSettings;
  
  // UI preferences
  sidebarOpen: boolean;
  compactMode: boolean;
  showTimestamps: boolean;
  beginnerMode: boolean;
  
  // Terminal preferences
  autoScrollEnabled: boolean;
  confirmDangerousCommands: boolean;
  environmentSpecificThemes: boolean;
  
  // Session preferences
  rememberSessionOnClose: boolean;
  autoReconnect: boolean;
  sessionTimeoutMinutes: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  // Types of notifications
  sessionTimeout: boolean;
  dangerousCommand: boolean;
  connectionLost: boolean;
  commandComplete: boolean;
  collaboratorJoined: boolean;
  securityAlert: boolean;
  
  // Notification methods
  browserNotifications: boolean;
  soundEnabled: boolean;
  visualToast: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;   // HH:mm format
}

// ============================================
// Default Settings
// ============================================

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  sessionTimeout: true,
  dangerousCommand: true,
  connectionLost: true,
  commandComplete: false,
  collaboratorJoined: true,
  securityAlert: true,
  
  browserNotifications: false,
  soundEnabled: false,
  visualToast: true,
  
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  favoriteServerIds: [],
  
  aiSuggestionsEnabled: true,
  
  notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
  
  sidebarOpen: true,
  compactMode: false,
  showTimestamps: true,
  beginnerMode: false,
  
  autoScrollEnabled: true,
  confirmDangerousCommands: true,
  environmentSpecificThemes: true,
  
  rememberSessionOnClose: true,
  autoReconnect: true,
  sessionTimeoutMinutes: 30,
  
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================
// User Settings Manager
// ============================================

const SETTINGS_STORAGE_KEY = 'jaTerm_userSettings';

class UserSettingsManager {
  private settings: UserSettings = { ...DEFAULT_USER_SETTINGS };
  private listeners: Set<(settings: UserSettings) => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = {
          ...DEFAULT_USER_SETTINGS,
          ...parsed,
          notifications: {
            ...DEFAULT_NOTIFICATION_SETTINGS,
            ...parsed.notifications,
          },
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
        };
      }
    } catch (e) {
      console.error('Failed to load user settings:', e);
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;

    try {
      this.settings.updatedAt = new Date();
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save user settings:', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getSettings()));
  }

  // Subscribe to settings changes
  subscribe(listener: (settings: UserSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get all settings
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(updates: Partial<UserSettings>) {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  // ============================================
  // Server Preferences
  // ============================================

  setDefaultServer(serverId: string | undefined) {
    this.updateSettings({ defaultServerId: serverId });
  }

  getDefaultServer(): string | undefined {
    return this.settings.defaultServerId;
  }

  setLastConnectedServer(serverId: string) {
    this.updateSettings({ lastConnectedServerId: serverId });
  }

  getLastConnectedServer(): string | undefined {
    return this.settings.lastConnectedServerId;
  }

  addFavoriteServer(serverId: string) {
    if (!this.settings.favoriteServerIds.includes(serverId)) {
      this.updateSettings({
        favoriteServerIds: [...this.settings.favoriteServerIds, serverId],
      });
    }
  }

  removeFavoriteServer(serverId: string) {
    this.updateSettings({
      favoriteServerIds: this.settings.favoriteServerIds.filter(id => id !== serverId),
    });
  }

  isFavoriteServer(serverId: string): boolean {
    return this.settings.favoriteServerIds.includes(serverId);
  }

  getFavoriteServers(): string[] {
    return [...this.settings.favoriteServerIds];
  }

  reorderFavoriteServers(serverIds: string[]) {
    this.updateSettings({ favoriteServerIds: serverIds });
  }

  // ============================================
  // AI Preferences
  // ============================================

  setDefaultAIProvider(providerId: string | undefined) {
    this.updateSettings({ defaultAIProviderId: providerId });
  }

  setDefaultAIModel(modelId: string | undefined) {
    this.updateSettings({ defaultAIModelId: modelId });
  }

  getDefaultAIProvider(): string | undefined {
    return this.settings.defaultAIProviderId;
  }

  getDefaultAIModel(): string | undefined {
    return this.settings.defaultAIModelId;
  }

  setAISuggestionsEnabled(enabled: boolean) {
    this.updateSettings({ aiSuggestionsEnabled: enabled });
  }

  // ============================================
  // Notification Preferences
  // ============================================

  updateNotificationSettings(updates: Partial<NotificationSettings>) {
    this.updateSettings({
      notifications: { ...this.settings.notifications, ...updates },
    });
  }

  getNotificationSettings(): NotificationSettings {
    return { ...this.settings.notifications };
  }

  isInQuietHours(): boolean {
    const { quietHoursEnabled, quietHoursStart, quietHoursEnd } = this.settings.notifications;
    if (!quietHoursEnabled || !quietHoursStart || !quietHoursEnd) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = quietHoursEnd.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      // Normal case: e.g., 22:00 to 08:00
      return currentTime >= startTime || currentTime < endTime;
    } else {
      // Overnight case
      return currentTime >= startTime && currentTime < endTime;
    }
  }

  shouldShowNotification(type: keyof Omit<NotificationSettings, 'browserNotifications' | 'soundEnabled' | 'visualToast' | 'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd'>): boolean {
    if (this.isInQuietHours()) return false;
    return this.settings.notifications[type];
  }

  // ============================================
  // UI Preferences
  // ============================================

  setSidebarOpen(open: boolean) {
    this.updateSettings({ sidebarOpen: open });
  }

  setCompactMode(compact: boolean) {
    this.updateSettings({ compactMode: compact });
  }

  setShowTimestamps(show: boolean) {
    this.updateSettings({ showTimestamps: show });
  }

  setBeginnerMode(enabled: boolean) {
    this.updateSettings({ beginnerMode: enabled });
  }

  // ============================================
  // Terminal Preferences
  // ============================================

  setAutoScroll(enabled: boolean) {
    this.updateSettings({ autoScrollEnabled: enabled });
  }

  setConfirmDangerousCommands(confirm: boolean) {
    this.updateSettings({ confirmDangerousCommands: confirm });
  }

  setEnvironmentSpecificThemes(enabled: boolean) {
    this.updateSettings({ environmentSpecificThemes: enabled });
  }

  // ============================================
  // Session Preferences
  // ============================================

  setRememberSession(remember: boolean) {
    this.updateSettings({ rememberSessionOnClose: remember });
  }

  setAutoReconnect(enabled: boolean) {
    this.updateSettings({ autoReconnect: enabled });
  }

  setSessionTimeout(minutes: number) {
    this.updateSettings({ sessionTimeoutMinutes: Math.max(5, Math.min(120, minutes)) });
  }

  // ============================================
  // Reset
  // ============================================

  reset() {
    this.settings = {
      ...DEFAULT_USER_SETTINGS,
      createdAt: this.settings.createdAt,
      updatedAt: new Date(),
    };
    this.saveSettings();
  }

  // ============================================
  // Export/Import
  // ============================================

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      this.settings = {
        ...DEFAULT_USER_SETTINGS,
        ...parsed,
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...parsed.notifications,
        },
        updatedAt: new Date(),
      };
      this.saveSettings();
      return true;
    } catch (e) {
      console.error('Failed to import settings:', e);
      return false;
    }
  }
}

// Singleton instance
export const userSettingsManager = new UserSettingsManager();

// ============================================
// React Hook for Settings
// ============================================

import { useState, useEffect } from 'react';

export function useUserSettings(): UserSettings {
  const [settings, setSettings] = useState<UserSettings>(userSettingsManager.getSettings());

  useEffect(() => {
    const unsubscribe = userSettingsManager.subscribe(setSettings);
    return unsubscribe;
  }, []);

  return settings;
}

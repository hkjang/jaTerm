'use client';

import { useState, useEffect } from 'react';

interface MobileKeyboardProps {
  onKeyPress: (key: string) => void;
  onSpecialKey: (key: 'enter' | 'tab' | 'escape' | 'ctrl-c' | 'ctrl-d' | 'ctrl-z' | 'up' | 'down') => void;
  isVisible: boolean;
  onToggle: () => void;
}

// Common terminal shortcuts
const QUICK_KEYS = [
  { label: 'Tab', key: 'tab', icon: '⇥' },
  { label: 'Up', key: 'up', icon: '↑' },
  { label: 'Down', key: 'down', icon: '↓' },
  { label: 'Ctrl+C', key: 'ctrl-c', icon: 'C' },
  { label: 'Ctrl+D', key: 'ctrl-d', icon: 'D' },
  { label: 'Ctrl+Z', key: 'ctrl-z', icon: 'Z' },
  { label: 'Esc', key: 'escape', icon: '⎋' },
];

// Common commands for quick access
const QUICK_COMMANDS = [
  { label: 'ls -la', command: 'ls -la' },
  { label: 'cd ..', command: 'cd ..' },
  { label: 'pwd', command: 'pwd' },
  { label: 'clear', command: 'clear' },
  { label: 'exit', command: 'exit' },
  { label: 'history', command: 'history' },
];

// Special characters that are hard to type on mobile
const SPECIAL_CHARS = [
  '|', '/', '\\', '~', '`', 
  '-', '_', '=', '+',
  '[', ']', '{', '}',
  '<', '>', '&', '$', '#',
];

export default function MobileKeyboard({
  onKeyPress,
  onSpecialKey,
  isVisible,
  onToggle,
}: MobileKeyboardProps) {
  const [activeTab, setActiveTab] = useState<'keys' | 'commands' | 'chars'>('keys');

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          border: 'none',
          color: 'white',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        ⌨️
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--color-bg-secondary)',
      borderTop: '1px solid var(--color-border)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 1000,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'keys', label: '단축키' },
            { id: 'commands', label: '명령어' },
            { id: 'chars', label: '특수문자' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === tab.id 
                  ? 'var(--color-primary)' 
                  : 'transparent',
                color: activeTab === tab.id 
                  ? 'white' 
                  : 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {/* Quick Keys */}
        {activeTab === 'keys' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}>
            {QUICK_KEYS.map(key => (
              <button
                key={key.key}
                onClick={() => onSpecialKey(key.key as any)}
                style={{
                  padding: '12px 8px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{key.icon}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {key.label}
                </span>
              </button>
            ))}
            <button
              onClick={() => onSpecialKey('enter')}
              style={{
                padding: '12px 8px',
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>↵</span>
              <span style={{ fontSize: '0.7rem' }}>Enter</span>
            </button>
          </div>
        )}

        {/* Quick Commands */}
        {activeTab === 'commands' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}>
            {QUICK_COMMANDS.map(cmd => (
              <button
                key={cmd.command}
                onClick={() => onKeyPress(cmd.command)}
                style={{
                  padding: '12px 8px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        )}

        {/* Special Characters */}
        {activeTab === 'chars' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '6px',
          }}>
            {SPECIAL_CHARS.map(char => (
              <button
                key={char}
                onClick={() => onKeyPress(char)}
                style={{
                  padding: '14px 8px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                }}
              >
                {char}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for touch selection
export function useTouchSelection() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });

  const startSelection = (x: number, y: number) => {
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
  };

  const updateSelection = (x: number, y: number) => {
    if (isSelecting) {
      setSelectionEnd({ x, y });
    }
  };

  const endSelection = () => {
    setIsSelecting(false);
  };

  const getSelectionRect = () => {
    if (!isSelecting) return null;
    
    return {
      left: Math.min(selectionStart.x, selectionEnd.x),
      top: Math.min(selectionStart.y, selectionEnd.y),
      width: Math.abs(selectionEnd.x - selectionStart.x),
      height: Math.abs(selectionEnd.y - selectionStart.y),
    };
  };

  return {
    isSelecting,
    startSelection,
    updateSelection,
    endSelection,
    getSelectionRect,
  };
}

// Responsive breakpoint hook
export function useResponsiveTerminal() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet };
}

// Low bandwidth mode component
export function LowBandwidthIndicator({ 
  isEnabled, 
  onToggle 
}: { 
  isEnabled: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        background: isEnabled ? 'var(--color-warning-bg)' : 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        color: isEnabled ? 'var(--color-warning)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: '0.75rem',
      }}
      title={isEnabled ? '저대역폭 모드 활성화됨' : '저대역폭 모드 비활성화'}
    >
      <span>{isEnabled ? '📶' : '📡'}</span>
      <span>{isEnabled ? '저대역폭' : '일반'}</span>
    </button>
  );
}

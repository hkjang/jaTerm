// Keyboard Shortcuts Manager for Admin
'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsContextType {
  shortcuts: Shortcut[];
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({ shortcuts: [] });

export function useKeyboardShortcuts() {
  return useContext(KeyboardShortcutsContext);
}

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    { key: '1', alt: true, description: '대시보드', action: () => router.push('/admin') },
    { key: '2', alt: true, description: '세션', action: () => router.push('/admin/sessions') },
    { key: '3', alt: true, description: '서버', action: () => router.push('/admin/servers') },
    { key: '4', alt: true, description: '사용자', action: () => router.push('/admin/users') },
    { key: '5', alt: true, description: '알림', action: () => router.push('/admin/alerts') },
    { key: '6', alt: true, description: '감사 로그', action: () => router.push('/admin/audit') },
    { key: '?', shift: true, description: '단축키 도움말', action: () => showShortcutsHelp(shortcuts) },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() || 
                         e.key === shortcut.key;
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return (
    <KeyboardShortcutsContext.Provider value={{ shortcuts }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

function showShortcutsHelp(shortcuts: Shortcut[]) {
  const modal = document.createElement('div');
  modal.id = 'shortcuts-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: var(--color-card);
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  `;
  
  content.innerHTML = `
    <h2 style="margin: 0 0 20px; font-size: 1.25rem; font-weight: 600;">⌨️ 키보드 단축키</h2>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-border);">
        <span>글로벌 검색</span>
        <kbd style="padding: 4px 8px; background: var(--color-surface); border-radius: 4px; font-size: 0.8rem;">⌘/Ctrl + K</kbd>
      </div>
      ${shortcuts.map(s => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-border);">
          <span>${s.description}</span>
          <kbd style="padding: 4px 8px; background: var(--color-surface); border-radius: 4px; font-size: 0.8rem;">
            ${s.ctrl ? '⌘/' : ''}${s.alt ? 'Alt + ' : ''}${s.shift ? 'Shift + ' : ''}${s.key.toUpperCase()}
          </kbd>
        </div>
      `).join('')}
    </div>
    <button id="close-shortcuts" style="
      margin-top: 20px;
      width: 100%;
      padding: 10px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
    ">닫기</button>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  content.querySelector('#close-shortcuts')?.addEventListener('click', closeModal);
  
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      window.removeEventListener('keydown', handleEsc);
    }
  };
  window.addEventListener('keydown', handleEsc);
}

// Toast Notification Component for Admin Pages
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTypeStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return { bg: 'var(--color-success)', icon: '✓' };
      case 'error': return { bg: 'var(--color-danger)', icon: '✕' };
      case 'warning': return { bg: 'var(--color-warning)', icon: '⚠' };
      case 'info': return { bg: 'var(--color-primary)', icon: 'ℹ' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {toasts.map(toast => {
          const styles = getTypeStyles(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                background: 'var(--color-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                borderLeft: `4px solid ${styles.bg}`,
                minWidth: '280px',
                maxWidth: '400px',
                animation: 'toast-slide-in 0.3s ease-out',
              }}
            >
              <span style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: styles.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {styles.icon}
              </span>
              <span style={{ flex: 1, fontSize: '0.9rem' }}>{toast.message}</span>
              <button 
                onClick={() => removeToast(toast.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 4px'
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

'use client';

import AdminSidebar from './AdminSidebar';
import { ToastProvider } from './Toast';
import { GlobalSearch } from './GlobalSearch';
import { KeyboardShortcutsProvider } from './KeyboardShortcuts';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function AdminLayout({ children, title, description, actions }: AdminLayoutProps) {
  return (
    <KeyboardShortcutsProvider>
      <ToastProvider>
        <div className="page-container" style={{ flexDirection: 'row' }}>
          <AdminSidebar />
          
          <main style={{ 
            flex: 1, 
            marginLeft: 'var(--sidebar-width)',
            padding: '24px',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>{title}</h1>
                {description && (
                  <p style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GlobalSearch />
                {actions}
              </div>
            </div>
            
            {children}
          </main>
        </div>
        
        <style jsx global>{`
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .skeleton {
            background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
          }
          
          kbd {
            padding: 2px 6px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 4px;
            font-family: var(--font-mono);
            font-size: 0.75rem;
          }
        `}</style>
      </ToastProvider>
    </KeyboardShortcutsProvider>
  );
}

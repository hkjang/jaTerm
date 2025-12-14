'use client';

import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function AdminLayout({ children, title, description, actions }: AdminLayoutProps) {
  return (
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
          {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
        </div>
        
        {children}
      </main>
    </div>
  );
}

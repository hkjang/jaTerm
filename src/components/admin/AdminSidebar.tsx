'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  badgeType?: 'success' | 'warning' | 'danger' | 'info';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Consolidated navigation - merged duplicates, reduced to 8 essential sections
const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: '대시보드', icon: '📊' },
      { href: '/admin/system-health', label: '시스템 상태', icon: '💚' },
      { href: '/admin/alerts', label: '알림 관리', icon: '🔔', badge: 5, badgeType: 'warning' },
    ],
  },
  {
    title: '사용자·권한',
    items: [
      { href: '/admin/users', label: '사용자', icon: '👥' },
      { href: '/admin/roles', label: '역할', icon: '🛡️' },
      { href: '/admin/access-approval', label: '접근 승인', icon: '✋', badge: 2, badgeType: 'warning' },
      { href: '/admin/emergency', label: '긴급 접근', icon: '🚨' },
    ],
  },
  {
    title: '서버·인프라',
    items: [
      { href: '/admin/servers', label: '서버', icon: '🖥️' },
      { href: '/admin/server-groups', label: '서버 그룹', icon: '📦' },
      { href: '/admin/databases', label: '데이터베이스', icon: '🗄️' },
      { href: '/admin/containers', label: '컨테이너', icon: '🐳' },
    ],
  },
  {
    title: '보안·자격증명',
    items: [
      { href: '/admin/credentials', label: '자격증명', icon: '🔒' },
      { href: '/admin/ssh-keys', label: 'SSH 키', icon: '🔑' },
      { href: '/admin/certificates', label: '인증서', icon: '📜' },
      { href: '/admin/mfa-settings', label: 'MFA', icon: '📱' },
      { href: '/admin/ip-management', label: 'IP 관리', icon: '🌐' },
      { href: '/admin/policies', label: '접근 정책', icon: '📋' },
    ],
  },
  {
    title: '세션·모니터링',
    items: [
      { href: '/admin/sessions', label: '세션', icon: '📺' },
      { href: '/admin/recordings', label: '녹화', icon: '🎬' },
      { href: '/admin/file-transfers', label: '파일 전송', icon: '📁' },
      { href: '/admin/command-history', label: '명령 이력', icon: '⌨️' },
    ],
  },
  {
    title: '감사·로그',
    items: [
      { href: '/admin/audit', label: '감사 로그', icon: '📝' },
      { href: '/admin/compliance', label: '컴플라이언스', icon: '✓' },
      { href: '/admin/analytics', label: '분석', icon: '📈' },
    ],
  },
  {
    title: '운영',
    items: [
      { href: '/admin/backups', label: '백업', icon: '💾' },
      { href: '/admin/scheduled-tasks', label: '스케줄', icon: '⏰' },
      { href: '/admin/incidents', label: '인시던트', icon: '🚨' },
    ],
  },
  {
    title: '설정',
    items: [
      { href: '/admin/settings', label: '시스템 설정', icon: '⚙️' },
      { href: '/admin/api-keys', label: 'API 키', icon: '🔑' },
      { href: '/admin/webhooks', label: 'Webhooks', icon: '🔗' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sidebarRef.current) {
      const activeLink = sidebarRef.current.querySelector('.sidebar-link.active');
      if (activeLink) {
        activeLink.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [pathname]);

  return (
    <aside ref={sidebarRef} className="sidebar" style={{ position: 'fixed', top: 0, height: '100vh', overflow: 'auto' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="header-logo-icon" style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>⌘</div>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>jaTerm Admin</span>
      </div>

      <nav className="sidebar-nav" style={{ paddingBottom: '120px', paddingTop: '4px' }}>
        {navSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`badge badge-${item.badgeType || 'info'}`} style={{ marginLeft: 'auto' }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 'var(--sidebar-width)', padding: '16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href="/terminal" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          ⌨️ 터미널
        </Link>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ width: '100%', color: 'var(--color-danger)' }}
          onClick={() => {
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
        >
          🚪 로그아웃
        </button>
      </div>
    </aside>
  );
}

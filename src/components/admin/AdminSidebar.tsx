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

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: '대시보드', icon: '📊' },
      { href: '/admin/operations', label: '운영 모니터링', icon: '💓' },
    ],
  },
  {
    title: '계정·권한',
    items: [
      { href: '/admin/users', label: '사용자 관리', icon: '👥' },
      { href: '/admin/admins', label: '관리자 계정', icon: '🔐' },
      { href: '/admin/access-history', label: '접근 이력', icon: '📜' },
    ],
  },
  {
    title: '서버·자원',
    items: [
      { href: '/admin/servers', label: '서버 관리', icon: '🖥️' },
      { href: '/admin/server-access', label: '접근 권한', icon: '🔐' },
      { href: '/admin/server-groups', label: '서버 그룹', icon: '📦' },
    ],
  },
  {
    title: '정책',
    items: [
      { href: '/admin/policies', label: '접근 정책', icon: '📋' },
      { href: '/admin/commands', label: '명령어 통제', icon: '⌨️' },
      { href: '/admin/approvals', label: '승인 워크플로', icon: '✅' },
      { href: '/admin/emergency', label: '긴급 접근', icon: '🚨' },
    ],
  },
  {
    title: '세션',
    items: [
      { href: '/admin/sessions', label: '세션 관제', icon: '📺' },
      { href: '/admin/recordings', label: '세션 녹화', icon: '🎬' },
    ],
  },
  {
    title: '감사',
    items: [
      { href: '/admin/audit', label: '감사 로그', icon: '📝' },
      { href: '/admin/compliance', label: '컴플라이언스', icon: '✓' },
    ],
  },
  {
    title: 'AI',
    items: [
      { href: '/admin/alerts', label: '보안 알림', icon: '🔔' },
      { href: '/admin/ai-security', label: 'AI 보안', icon: '🛡️' },
      { href: '/admin/ai-providers', label: 'AI Provider', icon: '🔌' },
      { href: '/admin/ai-models', label: 'AI 모델', icon: '🧠' },
      { href: '/admin/ai-prompts', label: '프롬프트', icon: '📝' },
      { href: '/admin/ai-policies', label: 'AI 정책', icon: '📋' },
      { href: '/admin/ai-logs', label: 'AI 로그', icon: '📊' },
    ],
  },
  {
    title: '자동화',
    items: [
      { href: '/admin/macros', label: '매크로', icon: '⚙️' },
      { href: '/admin/schedules', label: '스케줄', icon: '🕐' },
    ],
  },
  {
    title: '시스템',
    items: [
      { href: '/admin/settings', label: '시스템 설정', icon: '⚙️' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  // Auto-scroll to selected menu item
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
      <div style={{ 
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
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
                  <span 
                    className={`badge badge-${item.badgeType || 'info'}`} 
                    style={{ marginLeft: 'auto' }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: 'var(--sidebar-width)',
        padding: '16px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <Link href="/terminal" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          ⌨️ 터미널로 이동
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

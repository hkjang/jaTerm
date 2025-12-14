import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page-container">
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">⌘</div>
          <span>jaTerm</span>
        </div>
        <nav className="header-nav">
          <Link href="/terminal" className="header-nav-link">터미널</Link>
          <Link href="/servers" className="header-nav-link">서버 관리</Link>
          <Link href="/admin" className="header-nav-link">관리자</Link>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="btn btn-primary">로그인</Link>
        </div>
      </header>

      <main className="main-content">
        {/* Hero Section */}
        <section style={{ textAlign: 'center', padding: '80px 0' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 700, 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, var(--color-text-primary), var(--color-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            안전한 웹 기반 SSH 터미널
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Zero Trust 기반 서버 접근 제어, 실시간 세션 녹화, 
            AI 기반 보안 분석으로 안전한 서버 관리
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/terminal" className="btn btn-primary btn-lg">
              터미널 시작하기
            </Link>
            <Link href="/admin" className="btn btn-secondary btn-lg">
              관리자 대시보드
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="dashboard-grid" style={{ marginTop: '40px' }}>
          <div className="stat-card">
            <div className="stat-label">접근 제어</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>Zero Trust</div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px', fontSize: '0.9rem' }}>
              역할 기반 접근 제어(RBAC), 시간 기반 정책, 
              사전 승인 워크플로우
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-label">세션 녹화</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>실시간</div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px', fontSize: '0.9rem' }}>
              모든 터미널 세션 녹화 및 재생,
              위변조 방지 해시 검증
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-label">AI 보안</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>실시간 분석</div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px', fontSize: '0.9rem' }}>
              위험 명령 탐지, 이상 행위 분석,
              자동 알림 및 차단
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-label">감사 로그</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>완벽한 추적</div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px', fontSize: '0.9rem' }}>
              모든 액션 로깅, 명령어 기록,
              컴플라이언스 지원
            </p>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section className="card" style={{ marginTop: '48px' }}>
          <div className="card-header">
            <h2 className="card-title">시스템 아키텍처</h2>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '24px',
            padding: '40px 0',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'var(--color-info-bg)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '12px'
              }}>🖥️</div>
              <div style={{ fontWeight: 600 }}>Browser</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>xterm.js</div>
            </div>
            
            <div style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>→</div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'var(--color-danger-bg)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '12px'
              }}>🔐</div>
              <div style={{ fontWeight: 600 }}>Auth Gateway</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>MFA, RBAC</div>
            </div>
            
            <div style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>→</div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '12px'
              }}>🔄</div>
              <div style={{ fontWeight: 600 }}>SSH Proxy</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Command Filter</div>
            </div>
            
            <div style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>→</div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'var(--color-warning-bg)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '12px'
              }}>🖧</div>
              <div style={{ fontWeight: 600 }}>Target Server</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>SSH</div>
            </div>
          </div>
        </section>

        {/* Demo Terminal Preview */}
        <section className="terminal-container" style={{ marginTop: '48px' }}>
          <div className="terminal-header">
            <div className="terminal-header-title">
              <div className="terminal-dots">
                <div className="terminal-dot terminal-dot-red"></div>
                <div className="terminal-dot terminal-dot-yellow"></div>
                <div className="terminal-dot terminal-dot-green"></div>
              </div>
              <span className="terminal-title">demo@jaterm:~$</span>
            </div>
          </div>
          <div className="terminal-body" style={{ 
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--terminal-fg)',
            lineHeight: 1.8
          }}>
            <div><span style={{ color: 'var(--color-success)' }}>demo@jaterm</span>:<span style={{ color: 'var(--color-primary)' }}>~$</span> ssh prod-server-01</div>
            <div style={{ color: 'var(--color-text-muted)' }}>🔐 Authenticating with jaTerm gateway...</div>
            <div style={{ color: 'var(--color-success)' }}>✓ MFA verified</div>
            <div style={{ color: 'var(--color-success)' }}>✓ Access policy: OPERATOR role approved</div>
            <div style={{ color: 'var(--color-info)' }}>📹 Session recording started</div>
            <div style={{ color: 'var(--color-text-muted)' }}>Connected to prod-server-01</div>
            <br />
            <div><span style={{ color: 'var(--color-success)' }}>root@prod-server-01</span>:<span style={{ color: 'var(--color-primary)' }}>/var/log$</span> tail -f application.log</div>
            <div style={{ color: 'var(--color-text-muted)' }}>[2024-01-15 10:30:45] INFO - Application started successfully</div>
            <div style={{ color: 'var(--color-text-muted)' }}>[2024-01-15 10:30:46] INFO - Connected to database</div>
            <div style={{ color: 'var(--color-warning)' }}>[2024-01-15 10:30:47] WARN - High memory usage detected</div>
            <br />
            <div><span style={{ color: 'var(--color-success)' }}>root@prod-server-01</span>:<span style={{ color: 'var(--color-primary)' }}>/var/log$</span> rm -rf /</div>
            <div style={{ color: 'var(--color-danger)' }}>⛔ BLOCKED: Dangerous command detected</div>
            <div style={{ color: 'var(--color-danger)' }}>   Risk Score: 100% - 파일 시스템 손상 가능</div>
            <div style={{ color: 'var(--color-warning)' }}>🚨 Security alert sent to administrators</div>
          </div>
        </section>
      </main>

      <footer style={{ 
        padding: '40px 24px',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.875rem'
      }}>
        © 2024 jaTerm - Secure SSH Terminal Service
      </footer>
    </div>
  );
}

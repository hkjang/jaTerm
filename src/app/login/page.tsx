'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Verify credentials
      const authResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mfaCode: showMfa ? mfaCode : undefined }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        if (authData.requireMfa) {
          // User authenticated, but needs MFA
          setUserId(authData.userId);
          setShowMfa(true);
          setLoading(false);
          return;
        }

        if (authData.requireMfaSetup) {
          // User needs to set up MFA
          localStorage.setItem('user', JSON.stringify({
            id: authData.userId,
            email: authData.email,
            name: authData.name,
            role: authData.role,
          }));
          router.push('/otp-setup');
          return;
        }

        if (authData.locked) {
          setLockedUntil(new Date(authData.lockedUntil));
          setError(`계정이 잠겼습니다. ${new Date(authData.lockedUntil).toLocaleTimeString()} 이후에 다시 시도하세요.`);
          setLoading(false);
          return;
        }

        if (authData.remainingAttempts !== undefined) {
          setRemainingAttempts(authData.remainingAttempts);
          setError(`인증에 실패했습니다. 남은 시도 횟수: ${authData.remainingAttempts}회`);
          setLoading(false);
          return;
        }

        setError(authData.error || '로그인에 실패했습니다.');
        setLoading(false);
        return;
      }

      // Login successful
      localStorage.setItem('user', JSON.stringify({
        id: authData.id,
        email: authData.email,
        name: authData.name,
        role: authData.role,
      }));
      
      router.push('/terminal');
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowMfa(false);
    setMfaCode('');
    setUserId(null);
    setRemainingAttempts(null);
    setError('');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--color-bg-primary), var(--color-bg-secondary))'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '12px',
            textDecoration: 'none'
          }}>
            <div className="header-logo-icon" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>⌘</div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>jaTerm</span>
          </Link>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '16px' }}>
            안전한 서버 접근을 위해 로그인하세요
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={showMfa}
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={showMfa}
              />
            </div>

            {showMfa && (
              <div className="form-group" style={{ 
                background: 'var(--color-info-bg)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🔐</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>2단계 인증</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      인증 앱의 6자리 코드 또는 백업 코드를 입력하세요
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8))}
                  placeholder="000000 또는 백업코드"
                  style={{ 
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '0.2em',
                    fontFamily: 'var(--font-mono)'
                  }}
                  maxLength={8}
                  autoFocus
                />
                {remainingAttempts !== null && remainingAttempts < 5 && (
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    color: remainingAttempts <= 2 ? 'var(--color-danger)' : 'var(--color-warning)'
                  }}>
                    ⚠️ 남은 시도 횟수: {remainingAttempts}회
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '12px', width: '100%' }}
                  onClick={handleBackToLogin}
                >
                  ← 이메일/비밀번호 다시 입력
                </button>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {error}
              </div>
            )}

            {lockedUntil && (
              <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                <strong>계정 잠금</strong>
                <br />
                너무 많은 시도로 인해 계정이 일시적으로 잠겼습니다.
                <br />
                {lockedUntil.toLocaleTimeString()} 이후에 다시 시도하세요.
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || (lockedUntil && new Date() < lockedUntil)}
            >
              {loading && <span className="spinner" style={{ width: '18px', height: '18px' }} />}
              {showMfa ? '인증 확인' : '로그인'}
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--color-text-muted)',
            marginBottom: '12px'
          }}>
            데모 계정:
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Admin:</strong> admin@jaterm.com / admin123
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Operator:</strong> operator@jaterm.com / operator123
            </div>
            <div>
              <strong>Developer:</strong> dev@jaterm.com / dev123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

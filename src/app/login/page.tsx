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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo mode: simple validation
      if (email === 'admin@jaterm.com' && password === 'admin123') {
        // Show MFA step
        if (!showMfa) {
          setShowMfa(true);
          setLoading(false);
          return;
        }
        
        // Verify MFA (demo: any 6-digit code works)
        if (mfaCode.length === 6) {
          localStorage.setItem('user', JSON.stringify({
            id: '1',
            email: 'admin@jaterm.com',
            name: 'Admin User',
            role: 'ADMIN'
          }));
          router.push('/terminal');
        } else {
          setError('유효하지 않은 MFA 코드입니다.');
        }
      } else if (email === 'operator@jaterm.com' && password === 'operator123') {
        localStorage.setItem('user', JSON.stringify({
          id: '2',
          email: 'operator@jaterm.com',
          name: 'Operator User',
          role: 'OPERATOR'
        }));
        router.push('/terminal');
      } else if (email === 'dev@jaterm.com' && password === 'dev123') {
        localStorage.setItem('user', JSON.stringify({
          id: '3',
          email: 'dev@jaterm.com',
          name: 'Developer User',
          role: 'DEVELOPER'
        }));
        router.push('/terminal');
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
                      인증 앱의 6자리 코드를 입력하세요
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ 
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '0.3em',
                    fontFamily: 'var(--font-mono)'
                  }}
                  maxLength={6}
                  autoFocus
                />
              </div>
            )}

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
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
              <strong>Admin:</strong> admin@jaterm.com / admin123 + MFA
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

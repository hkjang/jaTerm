'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OTPSetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

export default function OTPSetupPage() {
  const [step, setStep] = useState<'loading' | 'qr' | 'verify' | 'backup' | 'complete'>('loading');
  const [setupData, setSetupData] = useState<OTPSetupData | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initSetup();
  }, []);

  const initSetup = async () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/login');
        return;
      }

      const { id } = JSON.parse(user);
      
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize OTP setup');
      }

      const data = await response.json();
      setSetupData(data);
      setStep('qr');
    } catch (err) {
      setError('OTP 설정 초기화에 실패했습니다.');
      setStep('qr');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6) {
      setError('6자리 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/login');
        return;
      }

      const { id } = JSON.parse(user);

      const response = await fetch('/api/auth/otp', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${id}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: setupData?.secret,
          code: verifyCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '인증에 실패했습니다.');
        return;
      }

      setBackupCodes(data.backupCodes || []);
      setStep('backup');
    } catch (err) {
      setError('인증 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = `jaTerm SSH Terminal - Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\n⚠️ 각 코드는 1회만 사용 가능합니다.\n⚠️ 안전한 곳에 보관하세요.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jaterm-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    router.push('/terminal');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--color-bg-primary), var(--color-bg-secondary))',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}>
            <div className="header-logo-icon" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>⌘</div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>jaTerm</span>
          </Link>
        </div>

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}>
          {['QR 스캔', '코드 확인', '백업 코드'].map((label, i) => {
            const stepIndex = ['qr', 'verify', 'backup'].indexOf(step === 'loading' ? 'qr' : step === 'complete' ? 'backup' : step);
            const isActive = i <= stepIndex;
            return (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isActive ? 'white' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>{i + 1}</div>
                <span style={{
                  fontSize: '0.85rem',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}>{label}</span>
                {i < 2 && <div style={{
                  width: '24px',
                  height: '2px',
                  background: i < stepIndex ? 'var(--color-primary)' : 'var(--color-surface)',
                }} />}
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {/* Loading */}
          {step === 'loading' && (
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>OTP 설정을 준비하고 있습니다...</p>
            </div>
          )}

          {/* Step 1: QR Code */}
          {step === 'qr' && (
            <>
              <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>2단계 인증 설정</h2>
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
                Google Authenticator 앱으로 QR 코드를 스캔하세요
              </p>

              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}>
                {setupData?.qrCodeUrl ? (
                  <img src={setupData.qrCodeUrl} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                ) : (
                  <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    QR 코드 로딩 중...
                  </div>
                )}
              </div>

              <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  또는 아래 시크릿 키를 직접 입력하세요:
                </div>
                <code style={{
                  display: 'block',
                  background: 'var(--color-bg-primary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all',
                  textAlign: 'center',
                }}>
                  {setupData?.secret || '...'}
                </code>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => setStep('verify')}
              >
                다음: 코드 확인
              </button>
            </>
          )}

          {/* Step 2: Verify */}
          {step === 'verify' && (
            <>
              <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>인증 코드 확인</h2>
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
                앱에 표시된 6자리 코드를 입력하세요
              </p>

              <form onSubmit={handleVerify}>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    style={{
                      textAlign: 'center',
                      fontSize: '2rem',
                      letterSpacing: '0.5em',
                      fontFamily: 'var(--font-mono)',
                      padding: '20px',
                    }}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setStep('qr')}
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    disabled={loading || verifyCode.length !== 6}
                  >
                    {loading && <span className="spinner" style={{ width: '18px', height: '18px' }} />}
                    확인
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Backup Codes */}
          {step === 'backup' && (
            <>
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--color-success-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '2rem',
                }}>✓</div>
                <h2 style={{ marginBottom: '8px' }}>2단계 인증 활성화됨</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  백업 코드를 안전한 곳에 저장하세요
                </p>
              </div>

              <div style={{
                background: 'var(--color-warning-bg)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span>⚠️</span>
                  <strong>중요</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  휴대폰을 분실하거나 인증 앱에 접근할 수 없을 때 이 코드를 사용하세요.
                  각 코드는 1회만 사용할 수 있습니다.
                </p>
              </div>

              <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                }}>
                  {backupCodes.map((code, index) => (
                    <div key={index} style={{
                      background: 'var(--color-bg-primary)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleCopyBackupCodes}
                >
                  {copied ? '✓ 복사됨' : '📋 복사'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleDownloadBackupCodes}
                >
                  📥 다운로드
                </button>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleComplete}
              >
                완료
              </button>
            </>
          )}
        </div>

        {/* Info */}
        {(step === 'qr' || step === 'verify') && (
          <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>ℹ️</span>
                <strong>Google Authenticator</strong>
              </div>
              <p style={{ margin: 0 }}>
                <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>Android</a>
                {' · '}
                <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>iOS</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

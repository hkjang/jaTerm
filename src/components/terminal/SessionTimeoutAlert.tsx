'use client';

import { useEffect, useState, useCallback } from 'react';

interface SessionTimeoutAlertProps {
  timeoutMinutes: number;
  onTimeout: () => void;
  onExtend: () => void;
  warningMinutes?: number;
  isActive?: boolean;
}

export default function SessionTimeoutAlert({
  timeoutMinutes,
  onTimeout,
  onExtend,
  warningMinutes = 1,
  isActive = true,
}: SessionTimeoutAlertProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeoutMinutes * 60);
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setRemainingSeconds(timeoutMinutes * 60);
    setShowWarning(false);
  }, [timeoutMinutes]);

  // Track user activity
  useEffect(() => {
    if (!isActive) return;

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, showWarning, resetTimer]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = prev - 1;
        
        // Show warning when reaching warning threshold
        if (newValue <= warningMinutes * 60 && newValue > 0 && !showWarning) {
          setShowWarning(true);
        }
        
        // Timeout reached
        if (newValue <= 0) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, warningMinutes, showWarning, onTimeout]);

  const handleExtend = () => {
    resetTimer();
    onExtend();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning || !isActive) return null;

  const urgencyLevel = remainingSeconds <= 30 ? 'critical' : remainingSeconds <= 60 ? 'high' : 'normal';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9998,
        animation: urgencyLevel === 'critical' ? 'pulse 0.5s ease-in-out infinite' : undefined,
      }}
    >
      <div
        style={{
          background: urgencyLevel === 'critical' 
            ? 'var(--color-danger)' 
            : urgencyLevel === 'high' 
              ? 'var(--color-warning)' 
              : 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${urgencyLevel === 'critical' ? 'var(--color-danger)' : urgencyLevel === 'high' ? 'var(--color-warning)' : 'var(--color-border)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minWidth: '320px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: urgencyLevel === 'critical' || urgencyLevel === 'high' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'var(--color-warning-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}
        >
          ⏱️
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: urgencyLevel === 'critical' || urgencyLevel === 'high' 
                ? 'white' 
                : 'var(--color-text-primary)',
              marginBottom: '4px',
            }}
          >
            세션 만료 경고
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: urgencyLevel === 'critical' || urgencyLevel === 'high' 
                ? 'rgba(255, 255, 255, 0.8)' 
                : 'var(--color-text-secondary)',
            }}
          >
            {remainingSeconds <= 30 
              ? '세션이 곧 종료됩니다!' 
              : '비활성으로 인해 세션이 종료됩니다'}
          </div>
          
          {/* Timer */}
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: urgencyLevel === 'critical' 
                ? 'white' 
                : urgencyLevel === 'high' 
                  ? 'white' 
                  : 'var(--color-warning)',
              marginTop: '4px',
            }}
          >
            {formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="btn btn-sm"
            onClick={handleExtend}
            style={{
              background: urgencyLevel === 'critical' || urgencyLevel === 'high' 
                ? 'white' 
                : 'var(--color-primary)',
              color: urgencyLevel === 'critical' 
                ? 'var(--color-danger)' 
                : urgencyLevel === 'high' 
                  ? 'var(--color-warning)' 
                  : 'white',
              border: 'none',
              fontWeight: 600,
            }}
          >
            연장
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onTimeout}
            style={{
              color: urgencyLevel === 'critical' || urgencyLevel === 'high' 
                ? 'rgba(255, 255, 255, 0.7)' 
                : 'var(--color-text-muted)',
              fontSize: '0.75rem',
            }}
          >
            종료
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}

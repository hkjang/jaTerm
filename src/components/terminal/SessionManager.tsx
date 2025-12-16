'use client';

import { useState, useEffect } from 'react';

interface SessionData {
  id: string;
  name: string;
  serverId: string;
  serverName: string;
  serverEnvironment: 'PROD' | 'STAGE' | 'DEV';
  memo?: string;
  startedAt: Date;
  lastActivity: Date;
  commandHistory: string[];
  outputBuffer: string;
}

interface SessionManagerProps {
  currentSession: SessionData | null;
  recentSessions: SessionData[];
  onRestoreSession: (session: SessionData) => void;
  onCompareSession: (session1: SessionData, session2: SessionData) => void;
  onQuickReconnect: (serverId: string) => void;
  onUpdateSessionName: (id: string, name: string) => void;
  onUpdateSessionMemo: (id: string, memo: string) => void;
}

// Storage key for session persistence
const SESSION_STORAGE_KEY = 'jaTerm_savedSessions';

// Save session to IndexedDB for browser persistence
export async function saveSessionToStorage(session: SessionData): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const sessions = await loadSessionsFromStorage();
    const updatedSessions = sessions.filter(s => s.id !== session.id);
    updatedSessions.unshift(session);
    
    // Keep only last 20 sessions
    const trimmedSessions = updatedSessions.slice(0, 20);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(trimmedSessions));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export async function loadSessionsFromStorage(): Promise<SessionData[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((s: any) => ({
      ...s,
      startedAt: new Date(s.startedAt),
      lastActivity: new Date(s.lastActivity),
    }));
  } catch (e) {
    console.error('Failed to load sessions:', e);
    return [];
  }
}

export async function deleteSessionFromStorage(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const sessions = await loadSessionsFromStorage();
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete session:', e);
  }
}

export default function SessionManager({
  currentSession,
  recentSessions,
  onRestoreSession,
  onCompareSession,
  onQuickReconnect,
  onUpdateSessionName,
  onUpdateSessionMemo,
}: SessionManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');
  const [memoValue, setMemoValue] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  const handleStartNameEdit = (session: SessionData) => {
    setEditingName(session.id);
    setNameValue(session.name || `세션 ${session.id.slice(0, 8)}`);
  };

  const handleSaveName = (id: string) => {
    onUpdateSessionName(id, nameValue);
    setEditingName(null);
  };

  const handleStartMemoEdit = (session: SessionData) => {
    setEditingMemo(session.id);
    setMemoValue(session.memo || '');
  };

  const handleSaveMemo = (id: string) => {
    onUpdateSessionMemo(id, memoValue);
    setEditingMemo(null);
  };

  const handleSelectForCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(s => s !== id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      const session1 = recentSessions.find(s => s.id === selectedForCompare[0]);
      const session2 = recentSessions.find(s => s.id === selectedForCompare[1]);
      if (session1 && session2) {
        onCompareSession(session1, session2);
      }
    }
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '60px',
          right: '16px',
          padding: '8px 12px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 100,
          fontSize: '0.85rem',
        }}
      >
        <span>📋</span>
        <span>세션</span>
        {recentSessions.length > 0 && (
          <span style={{
            background: 'var(--color-primary)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '0.7rem',
          }}>
            {recentSessions.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '16px',
          width: '360px',
          maxHeight: '500px',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{ fontWeight: 600 }}>세션 관리</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForCompare([]);
                }}
                className="btn btn-ghost btn-sm"
                style={{
                  background: compareMode ? 'var(--color-primary-bg)' : 'transparent',
                }}
              >
                비교
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Current Session */}
          {currentSession && (
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-primary-glow)',
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                marginBottom: '8px',
              }}>
                현재 세션
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  {editingName === currentSession.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                          fontSize: '0.85rem',
                        }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName(currentSession.id);
                          if (e.key === 'Escape') setEditingName(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveName(currentSession.id)}
                        className="btn btn-primary btn-sm"
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartNameEdit(currentSession)}
                      style={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {currentSession.name || `세션 ${currentSession.id.slice(0, 8)}`}
                      <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>✏️</span>
                    </div>
                  )}
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '4px',
                  }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      background: `${getEnvironmentColor(currentSession.serverEnvironment)}20`,
                      color: getEnvironmentColor(currentSession.serverEnvironment),
                    }}>
                      {currentSession.serverEnvironment}
                    </span>
                    {currentSession.serverName}
                  </div>
                </div>
              </div>
              
              {/* Memo */}
              <div style={{ marginTop: '8px' }}>
                {editingMemo === currentSession.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <textarea
                      value={memoValue}
                      onChange={(e) => setMemoValue(e.target.value)}
                      placeholder="세션 메모..."
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                        minHeight: '60px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingMemo(null)}
                        className="btn btn-ghost btn-sm"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveMemo(currentSession.id)}
                        className="btn btn-primary btn-sm"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleStartMemoEdit(currentSession)}
                    style={{
                      padding: '8px',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: currentSession.memo ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      minHeight: '32px',
                    }}
                  >
                    {currentSession.memo || '📝 메모 추가...'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compare Mode Header */}
          {compareMode && (
            <div style={{
              padding: '8px 16px',
              background: 'var(--color-info-bg)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-info)' }}>
                비교할 세션 2개를 선택하세요 ({selectedForCompare.length}/2)
              </span>
              {selectedForCompare.length === 2 && (
                <button
                  onClick={handleCompare}
                  className="btn btn-primary btn-sm"
                >
                  비교하기
                </button>
              )}
            </div>
          )}

          {/* Recent Sessions */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px',
          }}>
            {recentSessions.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}>
                저장된 세션이 없습니다
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentSessions.map(session => (
                  <div
                    key={session.id}
                    style={{
                      padding: '12px',
                      background: selectedForCompare.includes(session.id)
                        ? 'var(--color-primary-bg)'
                        : 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: selectedForCompare.includes(session.id)
                        ? '1px solid var(--color-primary)'
                        : '1px solid transparent',
                      cursor: compareMode ? 'pointer' : 'default',
                    }}
                    onClick={() => compareMode && handleSelectForCompare(session.id)}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}>
                        {session.name || `세션 ${session.id.slice(0, 8)}`}
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                      }}>
                        {formatDate(session.lastActivity)}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        background: `${getEnvironmentColor(session.serverEnvironment)}20`,
                        color: getEnvironmentColor(session.serverEnvironment),
                      }}>
                        {session.serverEnvironment}
                      </span>
                      <span style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)',
                      }}>
                        {session.serverName}
                      </span>
                    </div>
                    
                    {session.memo && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: '8px',
                        padding: '4px 8px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        📝 {session.memo}
                      </div>
                    )}
                    
                    {!compareMode && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                      }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onQuickReconnect(session.serverId)}
                        >
                          빠른 재접속
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => onRestoreSession(session)}
                        >
                          복원
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

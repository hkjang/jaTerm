// Global Search Component for Admin
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'user' | 'server' | 'session' | 'alert' | 'policy';
  title: string;
  subtitle: string;
  url: string;
}

const typeIcons: Record<string, string> = {
  user: '👤',
  server: '🖥️',
  session: '💻',
  alert: '🔔',
  policy: '📋',
};

const typeLabels: Record<string, string> = {
  user: '사용자',
  server: '서버',
  session: '세션',
  alert: '알림',
  policy: '정책',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Search API call
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const user = localStorage.getItem('user');
      const headers: Record<string, string> = {};
      if (user) {
        const { id } = JSON.parse(user);
        headers['Authorization'] = `Bearer ${id}`;
      }

      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  };

  const navigateToResult = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(result.url);
  };

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        🔍 검색
        <kbd style={{ 
          padding: '2px 6px', 
          background: 'var(--color-bg)', 
          borderRadius: '4px', 
          fontSize: '0.75rem',
          border: '1px solid var(--color-border)'
        }}>
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={() => setOpen(false)}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="사용자, 서버, 세션, 알림 검색..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                fontSize: '1.1rem',
                outline: 'none',
                color: 'var(--color-text)',
              }}
            />
            {loading && <span className="spinner" style={{ width: '20px', height: '20px' }} />}
          </div>
        </div>

        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {results.length === 0 && query && !loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              검색 결과가 없습니다
            </div>
          )}
          
          {results.map((result, index) => (
            <div
              key={result.id}
              onClick={() => navigateToResult(result)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                background: index === selectedIndex ? 'var(--color-surface)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{typeIcons[result.type]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{result.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{result.subtitle}</div>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{typeLabels[result.type]}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span><kbd>↑↓</kbd> 이동</span>
          <span><kbd>Enter</kbd> 열기</span>
          <span><kbd>Esc</kbd> 닫기</span>
        </div>
      </div>
    </div>
  );
}

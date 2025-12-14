'use client';

import { useState, useRef, useEffect } from 'react';
import { CommandHistoryItem, CommandFavorite, CommandTag } from '@/lib/terminal/types';

interface CommandHistoryPanelProps {
  history: CommandHistoryItem[];
  favorites: CommandFavorite[];
  onExecuteCommand: (command: string) => void;
  onAddFavorite: (command: string, tags?: string[]) => void;
  onRemoveFavorite: (id: string) => void;
  onClose: () => void;
}

const DEFAULT_TAGS: CommandTag[] = [
  { id: 'deploy', name: '배포', color: '#10b981' },
  { id: 'debug', name: '디버그', color: '#f59e0b' },
  { id: 'incident', name: '장애', color: '#ef4444' },
  { id: 'maintenance', name: '유지보수', color: '#6366f1' },
  { id: 'monitoring', name: '모니터링', color: '#06b6d4' },
];

export default function CommandHistoryPanel({
  history,
  favorites,
  onExecuteCommand,
  onAddFavorite,
  onRemoveFavorite,
  onClose,
}: CommandHistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAddFavorite, setShowAddFavorite] = useState(false);
  const [newFavoriteCommand, setNewFavoriteCommand] = useState('');
  const [newFavoriteTags, setNewFavoriteTags] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredHistory = history.filter(item => {
    if (searchQuery && !item.command.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTag && !item.tags.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  const filteredFavorites = favorites.filter(item => {
    if (searchQuery && !item.command.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTag && !item.tags.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  const handleAddToFavorites = (command: string) => {
    setNewFavoriteCommand(command);
    setShowAddFavorite(true);
  };

  const handleSaveFavorite = () => {
    onAddFavorite(newFavoriteCommand, newFavoriteTags);
    setShowAddFavorite(false);
    setNewFavoriteCommand('');
    setNewFavoriteTags([]);
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'var(--color-danger)';
    if (score >= 0.4) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>명령어 히스토리</h2>
        <button className="history-close" onClick={onClose}>×</button>
      </div>

      <div className="history-search">
        <input
          ref={searchInputRef}
          type="text"
          className="form-input"
          placeholder="명령어 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="history-tabs">
        <button
          className={`history-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          🕑 히스토리 ({history.length})
        </button>
        <button
          className={`history-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ⭐ 즐겨찾기 ({favorites.length})
        </button>
      </div>

      <div className="history-tags">
        <button
          className={`tag-filter ${selectedTag === null ? 'active' : ''}`}
          onClick={() => setSelectedTag(null)}
        >
          전체
        </button>
        {DEFAULT_TAGS.map((tag) => (
          <button
            key={tag.id}
            className={`tag-filter ${selectedTag === tag.id ? 'active' : ''}`}
            style={{ '--tag-color': tag.color } as React.CSSProperties}
            onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <div className="history-list">
        {activeTab === 'history' && (
          <>
            {filteredHistory.length === 0 ? (
              <div className="history-empty">
                <span className="history-empty-icon">📜</span>
                <p>검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-time">{formatTime(item.executedAt)}</span>
                    {item.blocked && (
                      <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>차단됨</span>
                    )}
                    <span
                      className="history-risk"
                      style={{ color: getRiskColor(item.riskScore) }}
                    >
                      위험도: {Math.round(item.riskScore * 100)}%
                    </span>
                  </div>
                  <div className="history-command">
                    <code>{item.command}</code>
                  </div>
                  <div className="history-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onExecuteCommand(item.command)}
                    >
                      실행
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigator.clipboard.writeText(item.command)}
                    >
                      복사
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleAddToFavorites(item.command)}
                    >
                      ⭐ 저장
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {filteredFavorites.length === 0 ? (
              <div className="history-empty">
                <span className="history-empty-icon">⭐</span>
                <p>즐겨찾기가 없습니다</p>
                <span className="history-empty-hint">자주 사용하는 명령어를 저장해보세요</span>
              </div>
            ) : (
              filteredFavorites.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <div className="favorite-tags">
                      {item.tags.map((tagId) => {
                        const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                        return tag ? (
                          <span
                            key={tagId}
                            className="tag-badge"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <span className="favorite-usage">사용: {item.usageCount}회</span>
                  </div>
                  {item.description && (
                    <div className="favorite-description">{item.description}</div>
                  )}
                  <div className="history-command">
                    <code>{item.command}</code>
                  </div>
                  <div className="history-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onExecuteCommand(item.command)}
                    >
                      실행
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigator.clipboard.writeText(item.command)}
                    >
                      복사
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onRemoveFavorite(item.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Add Favorite Modal */}
      {showAddFavorite && (
        <div className="add-favorite-modal">
          <div className="modal-content">
            <h3>즐겨찾기에 추가</h3>
            <div className="form-group">
              <label>명령어</label>
              <code className="command-preview">{newFavoriteCommand}</code>
            </div>
            <div className="form-group">
              <label>태그 선택</label>
              <div className="tag-selector">
                {DEFAULT_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    className={`tag-option ${newFavoriteTags.includes(tag.id) ? 'selected' : ''}`}
                    style={{ '--tag-color': tag.color } as React.CSSProperties}
                    onClick={() => {
                      setNewFavoriteTags(
                        newFavoriteTags.includes(tag.id)
                          ? newFavoriteTags.filter(t => t !== tag.id)
                          : [...newFavoriteTags, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddFavorite(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSaveFavorite}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .history-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 450px;
          height: 100vh;
          background: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .history-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .history-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: 1.2rem;
        }

        .history-close:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .history-search {
          padding: 12px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .history-tabs {
          display: flex;
          padding: 0 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .history-tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .history-tab:hover {
          color: var(--color-text-primary);
        }

        .history-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .history-tags {
          display: flex;
          gap: 8px;
          padding: 12px 20px;
          overflow-x: auto;
          border-bottom: 1px solid var(--color-border);
        }

        .tag-filter {
          padding: 4px 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 9999px;
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }

        .tag-filter:hover {
          border-color: var(--tag-color, var(--color-border));
          color: var(--tag-color, var(--color-text-primary));
        }

        .tag-filter.active {
          background: var(--color-primary-glow);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .history-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .history-item {
          padding: 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          margin-bottom: 8px;
          transition: all var(--transition-fast);
        }

        .history-item:hover {
          border-color: var(--color-text-muted);
        }

        .history-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .history-time {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }

        .history-risk {
          font-size: 0.7rem;
          margin-left: auto;
        }

        .history-command {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          padding: 8px;
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-sm);
          overflow-x: auto;
          margin-bottom: 8px;
        }

        .history-command code {
          white-space: pre;
        }

        .history-actions {
          display: flex;
          gap: 8px;
        }

        .favorite-tags {
          display: flex;
          gap: 4px;
        }

        .tag-badge {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 500;
        }

        .favorite-usage {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          margin-left: auto;
        }

        .favorite-description {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }

        .history-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .history-empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .history-empty p {
          color: var(--color-text-secondary);
        }

        .history-empty-hint {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .add-favorite-modal {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 24px;
          width: 100%;
          max-width: 350px;
        }

        .modal-content h3 {
          margin-bottom: 16px;
        }

        .command-preview {
          display: block;
          padding: 12px;
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          overflow-x: auto;
        }

        .tag-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-option {
          padding: 6px 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 9999px;
          color: var(--color-text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tag-option:hover {
          border-color: var(--tag-color);
          color: var(--tag-color);
        }

        .tag-option.selected {
          background: var(--tag-color);
          border-color: var(--tag-color);
          color: white;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}

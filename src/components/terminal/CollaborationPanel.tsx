'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, SessionComment, SharedUser, SharePermission } from '@/lib/terminal/types';

interface CollaborationPanelProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  sharedUsers: SharedUser[];
  chatMessages: ChatMessage[];
  comments: SessionComment[];
  isOwner: boolean;
  onSendMessage: (content: string) => void;
  onAddComment: (content: string) => void;
  onShareSession: (userId: string, permission: SharePermission) => void;
  onRevokeAccess: (userId: string) => void;
  onTransferSession: (userId: string) => void;
  onClose: () => void;
}

export default function CollaborationPanel({
  sessionId,
  currentUserId,
  currentUserName,
  sharedUsers,
  chatMessages,
  comments,
  isOwner,
  onSendMessage,
  onAddComment,
  onShareSession,
  onRevokeAccess,
  onTransferSession,
  onClose,
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'comments' | 'sharing'>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<SharePermission>('view');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput('');
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    onAddComment(commentInput);
    setCommentInput('');
  };

  const handleShare = () => {
    if (!shareEmail.trim()) return;
    onShareSession(shareEmail, sharePermission);
    setShareEmail('');
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const getPermissionLabel = (permission: SharePermission) => {
    switch (permission) {
      case 'view': return '보기';
      case 'interact': return '상호작용';
      case 'control': return '제어';
    }
  };

  const getPermissionColor = (permission: SharePermission) => {
    switch (permission) {
      case 'view': return '#6366f1';
      case 'interact': return '#f59e0b';
      case 'control': return '#ef4444';
    }
  };

  return (
    <div className="collab-panel">
      <div className="collab-header">
        <h2>👥 협업</h2>
        <div className="collab-session-id">
          <span>세션: {sessionId.slice(0, 8)}</span>
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(sessionId)}
            title="세션 ID 복사"
          >
            📋
          </button>
        </div>
        <button className="collab-close" onClick={onClose}>×</button>
      </div>

      <div className="collab-tabs">
        <button
          className={`collab-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 채팅
          {chatMessages.length > 0 && (
            <span className="tab-badge">{chatMessages.length}</span>
          )}
        </button>
        <button
          className={`collab-tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          📝 코멘트
        </button>
        <button
          className={`collab-tab ${activeTab === 'sharing' ? 'active' : ''}`}
          onClick={() => setActiveTab('sharing')}
        >
          🔗 공유
          {sharedUsers.length > 0 && (
            <span className="tab-badge">{sharedUsers.length}</span>
          )}
        </button>
      </div>

      <div className="collab-content">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-empty">
                  <span className="empty-icon">💬</span>
                  <p>아직 메시지가 없습니다</p>
                  <span className="empty-hint">팀원과 실시간으로 소통하세요</span>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-message ${msg.userId === currentUserId ? 'own' : ''} ${msg.type === 'system' ? 'system' : ''}`}
                    >
                      {msg.type !== 'system' && msg.userId !== currentUserId && (
                        <div className="message-meta">
                          <span className="message-user">{msg.userName}</span>
                          <span className="message-time">{formatTime(msg.timestamp)}</span>
                        </div>
                      )}
                      <div className="message-content">
                        {msg.type === 'command' ? (
                          <code className="message-command">{msg.content}</code>
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.userId === currentUserId && (
                        <span className="message-time own-time">{formatTime(msg.timestamp)}</span>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <div className="chat-input">
              <input
                type="text"
                className="form-input"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
              />
              <button
                className="btn btn-primary"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                전송
              </button>
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="comments-container">
            <div className="comments-info">
              <span className="info-icon">💡</span>
              <span>코멘트는 세션 기록에 함께 저장되어 나중에 검토할 수 있습니다.</span>
            </div>

            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="comments-empty">
                  <span className="empty-icon">📝</span>
                  <p>코멘트가 없습니다</p>
                  <span className="empty-hint">작업 중 메모를 남겨보세요</span>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-user">{comment.userName}</span>
                      <span className="comment-time">{formatTime(comment.timestamp)}</span>
                    </div>
                    <div className="comment-content">{comment.content}</div>
                  </div>
                ))
              )}
            </div>

            <div className="comment-input">
              <textarea
                className="form-input"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="코멘트를 추가하세요..."
                rows={3}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
              >
                코멘트 추가
              </button>
            </div>
          </div>
        )}

        {/* Sharing Tab */}
        {activeTab === 'sharing' && (
          <div className="sharing-container">
            <div className="sharing-current">
              <h4>현재 참여자</h4>
              <div className="users-list">
                <div className="user-item owner">
                  <div className="user-avatar">{currentUserName.slice(0, 1)}</div>
                  <div className="user-info">
                    <span className="user-name">{currentUserName} (나)</span>
                    <span className="user-permission owner-badge">소유자</span>
                  </div>
                </div>

                {sharedUsers.map((user) => (
                  <div key={user.userId} className={`user-item ${user.isActive ? 'active' : ''}`}>
                    <div className="user-avatar">{user.userName.slice(0, 1)}</div>
                    <div className="user-info">
                      <span className="user-name">{user.userName}</span>
                      <span
                        className="user-permission"
                        style={{
                          backgroundColor: getPermissionColor(user.permission) + '20',
                          color: getPermissionColor(user.permission),
                        }}
                      >
                        {getPermissionLabel(user.permission)}
                      </span>
                    </div>
                    <div className="user-status">
                      {user.isActive && <span className="status-dot active" title="온라인"></span>}
                    </div>
                    {isOwner && (
                      <div className="user-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onTransferSession(user.userId)}
                          title="세션 이관"
                        >
                          👤
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onRevokeAccess(user.userId)}
                          title="접근 해제"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isOwner && (
              <div className="sharing-invite">
                <h4>새 참여자 초대</h4>
                <div className="invite-form">
                  <input
                    type="email"
                    className="form-input"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="이메일 주소..."
                  />
                  <select
                    className="form-input form-select"
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value as SharePermission)}
                  >
                    <option value="view">보기 전용</option>
                    <option value="interact">상호작용</option>
                    <option value="control">전체 제어</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleShare}
                    disabled={!shareEmail.trim()}
                  >
                    초대
                  </button>
                </div>

                <div className="permission-info">
                  <div className="perm-item">
                    <span className="perm-label" style={{ color: '#6366f1' }}>보기 전용</span>
                    <span className="perm-desc">화면만 볼 수 있음</span>
                  </div>
                  <div className="perm-item">
                    <span className="perm-label" style={{ color: '#f59e0b' }}>상호작용</span>
                    <span className="perm-desc">채팅 및 코멘트 가능</span>
                  </div>
                  <div className="perm-item">
                    <span className="perm-label" style={{ color: '#ef4444' }}>전체 제어</span>
                    <span className="perm-desc">명령 실행 가능</span>
                  </div>
                </div>
              </div>
            )}

            <div className="sharing-link">
              <h4>공유 링크</h4>
              <div className="link-input">
                <input
                  type="text"
                  className="form-input"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/terminal/share/${sessionId}`}
                  readOnly
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => navigator.clipboard.writeText(
                    `${window.location.origin}/terminal/share/${sessionId}`
                  )}
                >
                  복사
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .collab-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 380px;
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

        .collab-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .collab-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .collab-session-id {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          margin-left: auto;
        }

        .copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.5;
        }

        .copy-btn:hover {
          opacity: 1;
        }

        .collab-close {
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

        .collab-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }

        .collab-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .collab-tab:hover {
          color: var(--color-text-primary);
        }

        .collab-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .tab-badge {
          padding: 2px 6px;
          background: var(--color-primary-glow);
          color: var(--color-primary);
          border-radius: 9999px;
          font-size: 0.7rem;
        }

        .collab-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .chat-container,
        .comments-container,
        .sharing-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .chat-empty,
        .comments-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--color-text-secondary);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        .empty-hint {
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .chat-message {
          margin-bottom: 12px;
          max-width: 85%;
        }

        .chat-message.own {
          margin-left: auto;
        }

        .chat-message.system {
          max-width: 100%;
          text-align: center;
          opacity: 0.6;
          font-size: 0.8rem;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .message-user {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .message-time {
          font-size: 0.65rem;
          color: var(--color-text-muted);
        }

        .own-time {
          display: block;
          text-align: right;
          margin-top: 4px;
        }

        .message-content {
          padding: 10px 14px;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }

        .chat-message.own .message-content {
          background: var(--color-primary-glow);
        }

        .message-command {
          display: block;
          font-family: var(--font-mono);
          color: var(--color-primary);
        }

        .chat-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid var(--color-border);
        }

        .chat-input .form-input {
          flex: 1;
        }

        .comments-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--color-info-bg);
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }

        .info-icon {
          font-size: 1rem;
        }

        .comments-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .comment-item {
          padding: 12px;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          margin-bottom: 8px;
        }

        .comment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .comment-user {
          font-weight: 600;
          font-size: 0.85rem;
        }

        .comment-time {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }

        .comment-content {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }

        .comment-input {
          padding: 16px;
          border-top: 1px solid var(--color-border);
        }

        .comment-input textarea {
          width: 100%;
          margin-bottom: 8px;
          resize: none;
        }

        .comment-input button {
          width: 100%;
        }

        .sharing-container {
          padding: 16px;
          overflow-y: auto;
        }

        .sharing-container h4 {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 12px;
        }

        .sharing-current {
          margin-bottom: 24px;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: var(--color-surface);
          border-radius: var(--radius-md);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary-glow);
          color: var(--color-primary);
          border-radius: 50%;
          font-weight: 600;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          display: block;
          font-weight: 500;
        }

        .user-permission {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 500;
        }

        .owner-badge {
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .user-status {
          display: flex;
          align-items: center;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-text-muted);
        }

        .status-dot.active {
          background: var(--color-success);
        }

        .user-actions {
          display: flex;
          gap: 4px;
        }

        .sharing-invite {
          margin-bottom: 24px;
        }

        .invite-form {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .invite-form input {
          flex: 2;
        }

        .invite-form select {
          flex: 1;
        }

        .permission-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .perm-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
        }

        .perm-label {
          font-weight: 500;
        }

        .perm-desc {
          color: var(--color-text-muted);
        }

        .sharing-link {
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .link-input {
          display: flex;
          gap: 8px;
        }

        .link-input input {
          flex: 1;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

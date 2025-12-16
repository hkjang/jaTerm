// Terminal Components Index
// Export all terminal UI components

export { default as TerminalTabBar } from './TerminalTabBar';
export { default as TerminalSettingsPanel } from './TerminalSettingsPanel';
export { default as CommandHistoryPanel } from './CommandHistoryPanel';
export { default as EnhancedCommandInput } from './EnhancedCommandInput';
export { default as BroadcastPanel } from './BroadcastPanel';
export { default as MacrosPanel } from './MacrosPanel';
export { default as CollaborationPanel } from './CollaborationPanel';
export { default as TerminalStatusBar } from './TerminalStatusBar';

// Phase 1: 실수 방지 UX 컴포넌트
export { default as DangerousCommandConfirm } from './DangerousCommandConfirm';
export { default as SessionTimeoutAlert } from './SessionTimeoutAlert';
export { default as DryRunPanel } from './DryRunPanel';

// Phase 3: AI 기반 편의 기능 컴포넌트
export { default as AIAssistPanel } from './AIAssistPanel';

// Phase 4: 로그인·접속 편의 컴포넌트
export { default as ServerSearch } from './ServerSearch';

// Phase 5-7: 효율·가독성·학습 컴포넌트
export { default as CommandTooltip } from './CommandTooltip';
export { default as BeginnerMode } from './BeginnerMode';
export { default as CollapsibleOutput } from './CollapsibleOutput';

// Phase 8: 세션 관리 컴포넌트
export { default as SessionManager } from './SessionManager';
export { saveSessionToStorage, loadSessionsFromStorage, deleteSessionFromStorage } from './SessionManager';

// Phase 10: 모바일·저사양 환경 컴포넌트
export { default as MobileKeyboard } from './MobileKeyboard';
export { useTouchSelection, useResponsiveTerminal, LowBandwidthIndicator } from './MobileKeyboard';

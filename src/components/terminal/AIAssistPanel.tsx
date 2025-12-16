'use client';

import { useState, useRef, useEffect } from 'react';

interface AIAssistPanelProps {
  serverName: string;
  serverEnvironment: 'PROD' | 'STAGE' | 'DEV';
  onCommandSuggested: (command: string) => void;
  commandHistory: string[];
  lastOutput?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AISuggestion {
  command: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
}

interface AIExplanation {
  summary: string;
  parameters: { name: string; description: string }[];
  examples: string[];
  warnings: string[];
}

interface AIErrorAnalysis {
  errorType: string;
  cause: string;
  solutions: string[];
  relatedCommands: string[];
}

type AIMode = 'natural' | 'explain' | 'suggest' | 'error';

export default function AIAssistPanel({
  serverName,
  serverEnvironment,
  onCommandSuggested,
  commandHistory,
  lastOutput,
  isOpen,
  onClose,
}: AIAssistPanelProps) {
  const [mode, setMode] = useState<AIMode>('natural');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [errorAnalysis, setErrorAnalysis] = useState<AIErrorAnalysis | null>(null);
  const [outputSummary, setOutputSummary] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Mock AI functions (would be replaced with actual AI service calls)
  const processNaturalLanguage = async (text: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    
    // Mock Korean natural language to command conversion
    const mockSuggestions: AISuggestion[] = [];
    const lowerText = text.toLowerCase();
    
    if (text.includes('파일') || text.includes('file')) {
      if (text.includes('찾') || text.includes('find') || text.includes('검색')) {
        mockSuggestions.push({
          command: `find . -name "*.log" -type f`,
          description: '현재 디렉토리에서 로그 파일 검색',
          risk: 'low',
          confidence: 0.85,
        });
      }
      if (text.includes('삭제') || text.includes('delete') || text.includes('지')) {
        mockSuggestions.push({
          command: `rm -i <파일경로>`,
          description: '파일 삭제 (확인 후)',
          risk: 'medium',
          confidence: 0.7,
        });
      }
      if (text.includes('목록') || text.includes('list') || text.includes('보')) {
        mockSuggestions.push({
          command: `ls -la`,
          description: '파일 목록 상세 표시',
          risk: 'low',
          confidence: 0.9,
        });
      }
    }
    
    if (text.includes('프로세스') || text.includes('process')) {
      mockSuggestions.push({
        command: `ps aux | grep <프로세스명>`,
        description: '실행 중인 프로세스 검색',
        risk: 'low',
        confidence: 0.88,
      });
    }
    
    if (text.includes('메모리') || text.includes('memory')) {
      mockSuggestions.push({
        command: `free -h`,
        description: '메모리 사용량 확인',
        risk: 'low',
        confidence: 0.95,
      });
    }
    
    if (text.includes('디스크') || text.includes('disk') || text.includes('용량')) {
      mockSuggestions.push({
        command: `df -h`,
        description: '디스크 사용량 확인',
        risk: 'low',
        confidence: 0.95,
      });
    }
    
    if (text.includes('로그') || text.includes('log')) {
      mockSuggestions.push({
        command: `tail -f /var/log/syslog`,
        description: '시스템 로그 실시간 확인',
        risk: 'low',
        confidence: 0.8,
      });
    }
    
    if (text.includes('서비스') || text.includes('service')) {
      if (text.includes('재시작') || text.includes('restart')) {
        mockSuggestions.push({
          command: `sudo systemctl restart <서비스명>`,
          description: '서비스 재시작',
          risk: 'high',
          confidence: 0.75,
        });
      }
      if (text.includes('상태') || text.includes('status')) {
        mockSuggestions.push({
          command: `systemctl status <서비스명>`,
          description: '서비스 상태 확인',
          risk: 'low',
          confidence: 0.9,
        });
      }
    }
    
    if (mockSuggestions.length === 0) {
      mockSuggestions.push({
        command: `# ${text}`,
        description: '요청을 이해하지 못했습니다. 더 구체적으로 설명해주세요.',
        risk: 'low',
        confidence: 0.1,
      });
    }
    
    setSuggestions(mockSuggestions);
    setLoading(false);
  };

  const explainCommand = async (command: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    
    // Mock command explanation
    const baseName = command.trim().split(/\s+/)[0];
    
    const mockExplanation: AIExplanation = {
      summary: `'${baseName}' 명령어에 대한 설명입니다.`,
      parameters: [
        { name: '-l', description: '상세 정보 표시' },
        { name: '-a', description: '숨김 파일 포함' },
      ],
      examples: [
        `${baseName} -la /home/user`,
        `${baseName} --help`,
      ],
      warnings: baseName === 'rm' ? ['이 명령은 파일을 삭제합니다. 되돌릴 수 없습니다.'] : [],
    };
    
    setExplanation(mockExplanation);
    setLoading(false);
  };

  const analyzeError = async (output: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    
    // Mock error analysis
    const mockAnalysis: AIErrorAnalysis = {
      errorType: '권한 오류',
      cause: '현재 사용자에게 해당 파일/디렉토리에 대한 권한이 없습니다.',
      solutions: [
        'sudo 명령으로 관리자 권한으로 실행',
        'chmod 명령으로 파일 권한 변경',
        '파일 소유자 확인: ls -la <경로>',
      ],
      relatedCommands: [
        'sudo !!',
        'chmod +x <파일>',
        'chown user:group <파일>',
      ],
    };
    
    setErrorAnalysis(mockAnalysis);
    setLoading(false);
  };

  const summarizeOutput = async (output: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    
    // Mock output summary
    const lines = output.split('\n').length;
    setOutputSummary(`출력 요약: ${lines}줄의 출력이 생성되었습니다. 주요 내용을 분석 중입니다...`);
    setLoading(false);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    switch (mode) {
      case 'natural':
        processNaturalLanguage(input);
        break;
      case 'explain':
        explainCommand(input);
        break;
      case 'error':
        analyzeError(input);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'var(--color-danger)';
      case 'medium': return 'var(--color-warning)';
      default: return 'var(--color-success)';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '60px',
      right: '16px',
      width: '420px',
      maxHeight: '500px',
      background: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <span style={{ fontWeight: 600 }}>AI 어시스턴트</span>
          <span style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            background: 'var(--color-primary-bg)',
            color: 'var(--color-primary)',
          }}>
            {serverName}
          </span>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px' }}
        >
          ✕
        </button>
      </div>

      {/* Mode Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 8px',
      }}>
        {[
          { id: 'natural', label: '자연어 입력', icon: '🗣️' },
          { id: 'explain', label: '명령 설명', icon: '📖' },
          { id: 'suggest', label: '추천', icon: '💡' },
          { id: 'error', label: '오류 분석', icon: '🔍' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id as AIMode)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: 'transparent',
              border: 'none',
              borderBottom: mode === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: mode === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'natural' ? '한국어로 원하는 작업을 설명하세요...' :
              mode === 'explain' ? '설명할 명령어를 입력하세요...' :
              mode === 'error' ? '오류 메시지를 붙여넣으세요...' :
              '입력하세요...'
            }
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem',
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : '전송'}
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 16px 16px',
      }}>
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: 'var(--color-text-muted)',
          }}>
            <span className="spinner" style={{ marginRight: '8px' }} />
            AI가 분석 중입니다...
          </div>
        )}

        {/* Natural Language Suggestions */}
        {mode === 'natural' && suggestions.length > 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              추천 명령어:
            </div>
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
                onClick={() => onCommandSuggested(suggestion.command)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <code style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    color: 'var(--color-primary)',
                  }}>
                    {suggestion.command}
                  </code>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    background: `${getRiskColor(suggestion.risk)}20`,
                    color: getRiskColor(suggestion.risk),
                  }}>
                    {suggestion.risk === 'high' ? '위험' : suggestion.risk === 'medium' ? '주의' : '안전'}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  {suggestion.description}
                </div>
                <div style={{
                  marginTop: '4px',
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                }}>
                  신뢰도: {Math.round(suggestion.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Command Explanation */}
        {mode === 'explain' && explanation && !loading && (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>설명</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {explanation.summary}
              </div>
            </div>
            
            {explanation.parameters.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>주요 옵션</div>
                {explanation.parameters.map((param, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                    <code style={{ color: 'var(--color-primary)' }}>{param.name}</code>
                    <span style={{ color: 'var(--color-text-secondary)' }}> - {param.description}</span>
                  </div>
                ))}
              </div>
            )}

            {explanation.warnings.length > 0 && (
              <div style={{
                background: 'var(--color-warning-bg)',
                color: 'var(--color-warning)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
              }}>
                ⚠️ {explanation.warnings.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Error Analysis */}
        {mode === 'error' && errorAnalysis && !loading && (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}>
                {errorAnalysis.errorType}
              </span>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>원인</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {errorAnalysis.cause}
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>해결 방법</div>
              {errorAnalysis.solutions.map((solution, i) => (
                <div key={i} style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                  paddingLeft: '16px',
                  position: 'relative',
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>{i + 1}.</span>
                  {solution}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>관련 명령어</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {errorAnalysis.relatedCommands.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => onCommandSuggested(cmd)}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--color-primary-bg)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggested Next Actions */}
        {mode === 'suggest' && !loading && (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '12px' }}>
              히스토리 기반 추천
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              최근 명령어 패턴을 분석하여 다음 작업을 추천합니다.
            </div>
            {commandHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  onClick={() => onCommandSuggested('git status')}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  💡 <code>git status</code> - 변경 사항 확인
                </div>
                <div
                  onClick={() => onCommandSuggested('docker ps')}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  💡 <code>docker ps</code> - 컨테이너 상태 확인
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                명령어 기록이 없습니다. 명령을 실행하면 패턴을 학습합니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

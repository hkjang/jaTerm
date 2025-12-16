'use client';

import { useState, useMemo } from 'react';

interface OutputLine {
  id: string;
  content: string;
  timestamp: Date;
  type: 'input' | 'output' | 'error' | 'system';
}

interface CollapsibleOutputProps {
  lines: OutputLine[];
  threshold?: number;
  showTimestamps?: boolean;
  highlightErrors?: boolean;
  onCopySelection?: (text: string) => void;
}

export default function CollapsibleOutput({
  lines,
  threshold = 50,
  showTimestamps = true,
  highlightErrors = true,
  onCopySelection,
}: CollapsibleOutputProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [pinnedLines, setPinnedLines] = useState<Set<string>>(new Set());
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [selectionStart, setSelectionStart] = useState<string | null>(null);

  // Group consecutive output lines if they exceed threshold
  const groupedOutput = useMemo(() => {
    const groups: {
      type: 'single' | 'collapsed';
      lines: OutputLine[];
      startIndex: number;
    }[] = [];
    
    let currentGroup: OutputLine[] = [];
    let groupStartIndex = 0;
    
    lines.forEach((line, index) => {
      // Always show input lines separately
      if (line.type === 'input') {
        if (currentGroup.length > 0) {
          if (currentGroup.length >= threshold) {
            groups.push({ type: 'collapsed', lines: currentGroup, startIndex: groupStartIndex });
          } else {
            currentGroup.forEach((l, i) => {
              groups.push({ type: 'single', lines: [l], startIndex: groupStartIndex + i });
            });
          }
          currentGroup = [];
        }
        groups.push({ type: 'single', lines: [line], startIndex: index });
        groupStartIndex = index + 1;
      } else {
        currentGroup.push(line);
      }
    });
    
    // Handle remaining lines
    if (currentGroup.length > 0) {
      if (currentGroup.length >= threshold) {
        groups.push({ type: 'collapsed', lines: currentGroup, startIndex: groupStartIndex });
      } else {
        currentGroup.forEach((l, i) => {
          groups.push({ type: 'single', lines: [l], startIndex: groupStartIndex + i });
        });
      }
    }
    
    return groups;
  }, [lines, threshold]);

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const togglePin = (lineId: string) => {
    const newPinned = new Set(pinnedLines);
    if (newPinned.has(lineId)) {
      newPinned.delete(lineId);
    } else {
      newPinned.add(lineId);
    }
    setPinnedLines(newPinned);
  };

  const handleLineClick = (lineId: string, shiftKey: boolean) => {
    if (shiftKey && selectionStart) {
      // Range selection
      const startIdx = lines.findIndex(l => l.id === selectionStart);
      const endIdx = lines.findIndex(l => l.id === lineId);
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      
      const newSelection = new Set<string>();
      for (let i = from; i <= to; i++) {
        newSelection.add(lines[i].id);
      }
      setSelectedLines(newSelection);
    } else {
      // Single selection
      const newSelection = new Set<string>();
      if (!selectedLines.has(lineId)) {
        newSelection.add(lineId);
      }
      setSelectedLines(newSelection);
      setSelectionStart(lineId);
    }
  };

  const copySelected = () => {
    if (selectedLines.size === 0) return;
    
    const selectedContent = lines
      .filter(l => selectedLines.has(l.id))
      .map(l => l.content)
      .join('\n');
    
    navigator.clipboard.writeText(selectedContent);
    onCopySelection?.(selectedContent);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'input': return 'var(--color-success)';
      case 'error': return 'var(--color-danger)';
      case 'system': return 'var(--color-info)';
      default: return 'var(--color-text-primary)';
    }
  };

  const detectErrorPatterns = (content: string): boolean => {
    const errorPatterns = [
      /error/i,
      /failed/i,
      /exception/i,
      /fatal/i,
      /cannot/i,
      /denied/i,
      /not found/i,
      /permission denied/i,
    ];
    return errorPatterns.some(pattern => pattern.test(content));
  };

  // Get pinned lines for sticky header
  const pinnedLineData = lines.filter(l => pinnedLines.has(l.id));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.85rem',
    }}>
      {/* Pinned Lines */}
      {pinnedLineData.length > 0 && (
        <div style={{
          background: 'var(--color-surface)',
          borderBottom: '2px solid var(--color-primary)',
          padding: '8px',
          maxHeight: '120px',
          overflow: 'auto',
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--color-primary)',
            marginBottom: '4px',
            fontWeight: 600,
          }}>
            📌 고정된 출력
          </div>
          {pinnedLineData.map(line => (
            <div
              key={`pinned-${line.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '2px 0',
              }}
            >
              <button
                onClick={() => togglePin(line.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  padding: '0 4px',
                }}
                title="고정 해제"
              >
                📌
              </button>
              {showTimestamps && (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  [{formatTimestamp(line.timestamp)}]
                </span>
              )}
              <span style={{ color: getLineColor(line.type) }}>{line.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Selection Actions */}
      {selectedLines.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--color-primary-bg)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
            {selectedLines.size}줄 선택됨
          </span>
          <button
            className="btn btn-sm btn-primary"
            onClick={copySelected}
          >
            복사
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setSelectedLines(new Set())}
          >
            선택 해제
          </button>
        </div>
      )}

      {/* Main Output */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px 0',
      }}>
        {groupedOutput.map((group, groupIndex) => {
          if (group.type === 'collapsed' && !expandedGroups.has(groupIndex)) {
            // Collapsed group header
            const errorCount = group.lines.filter(l => 
              highlightErrors && (l.type === 'error' || detectErrorPatterns(l.content))
            ).length;
            
            return (
              <div
                key={`group-${groupIndex}`}
                style={{
                  padding: '8px 12px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  margin: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={() => toggleGroup(groupIndex)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>▶</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {group.lines.length}줄 출력 (클릭하여 펼치기)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {errorCount > 0 && (
                    <span style={{
                      padding: '2px 6px',
                      background: 'var(--color-danger-bg)',
                      color: 'var(--color-danger)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                    }}>
                      ⚠️ {errorCount} 오류
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}>
                    {formatTimestamp(group.lines[0].timestamp)} ~ {formatTimestamp(group.lines[group.lines.length - 1].timestamp)}
                  </span>
                </div>
              </div>
            );
          }
          
          // Expanded or single lines
          const linesToShow = group.type === 'collapsed' ? group.lines : group.lines;
          
          return (
            <div key={`group-${groupIndex}`}>
              {group.type === 'collapsed' && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    margin: '4px 8px 0 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => toggleGroup(groupIndex)}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>▼</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {group.lines.length}줄 (클릭하여 접기)
                  </span>
                </div>
              )}
              
              {linesToShow.map(line => {
                const isError = highlightErrors && (line.type === 'error' || detectErrorPatterns(line.content));
                const isSelected = selectedLines.has(line.id);
                const isPinned = pinnedLines.has(line.id);
                
                return (
                  <div
                    key={line.id}
                    onClick={(e) => handleLineClick(line.id, e.shiftKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '2px 12px',
                      background: isSelected 
                        ? 'var(--color-primary-glow)' 
                        : isError 
                          ? 'rgba(239, 68, 68, 0.1)' 
                          : 'transparent',
                      borderLeft: isError ? '3px solid var(--color-danger)' : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Pin Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(line.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: isPinned ? 1 : 0.3,
                        padding: '0 2px',
                        color: isPinned ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                      }}
                      title={isPinned ? '고정 해제' : '출력 고정'}
                    >
                      📌
                    </button>
                    
                    {/* Timestamp */}
                    {showTimestamps && (
                      <span style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}>
                        [{formatTimestamp(line.timestamp)}]
                      </span>
                    )}
                    
                    {/* Content */}
                    <span style={{
                      color: isError ? 'var(--color-danger)' : getLineColor(line.type),
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}>
                      {line.type === 'input' && <span style={{ color: 'var(--color-success)' }}>$ </span>}
                      {line.content}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

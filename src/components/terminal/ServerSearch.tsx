'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface Server {
  id: string;
  name: string;
  hostname: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  status: 'online' | 'offline' | 'maintenance';
  tags?: string[];
  os?: string;
  lastConnected?: Date;
  isFavorite?: boolean;
}

interface ServerSearchProps {
  servers: Server[];
  onSelectServer: (server: Server) => void;
  onToggleFavorite: (serverId: string) => void;
  selectedServerId?: string;
  placeholder?: string;
}

type FilterType = 'all' | 'favorites' | 'recent' | 'PROD' | 'STAGE' | 'DEV';

export default function ServerSearch({
  servers,
  onSelectServer,
  onToggleFavorite,
  selectedServerId,
  placeholder = '서버 검색...',
}: ServerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and search servers
  const filteredServers = useMemo(() => {
    let result = [...servers];
    
    // Apply filter
    switch (activeFilter) {
      case 'favorites':
        result = result.filter(s => s.isFavorite);
        break;
      case 'recent':
        result = result
          .filter(s => s.lastConnected)
          .sort((a, b) => {
            const aTime = a.lastConnected?.getTime() || 0;
            const bTime = b.lastConnected?.getTime() || 0;
            return bTime - aTime;
          })
          .slice(0, 5);
        break;
      case 'PROD':
      case 'STAGE':
      case 'DEV':
        result = result.filter(s => s.environment === activeFilter);
        break;
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(server => 
        server.name.toLowerCase().includes(query) ||
        server.hostname.toLowerCase().includes(query) ||
        server.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        server.os?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [servers, searchQuery, activeFilter]);

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'PROD': return 'var(--color-danger)';
      case 'STAGE': return 'var(--color-warning)';
      case 'DEV': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'var(--color-success)';
      case 'maintenance': return 'var(--color-warning)';
      default: return 'var(--color-danger)';
    }
  };

  const filters: { id: FilterType; label: string; icon: string }[] = [
    { id: 'all', label: '전체', icon: '🖥️' },
    { id: 'favorites', label: '즐겨찾기', icon: '⭐' },
    { id: 'recent', label: '최근', icon: '🕐' },
    { id: 'PROD', label: 'Prod', icon: '🔴' },
    { id: 'STAGE', label: 'Stage', icon: '🟡' },
    { id: 'DEV', label: 'Dev', icon: '🟢' },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: '8px 12px',
      }}>
        <span style={{ color: 'var(--color-text-muted)' }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isExpanded && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          maxHeight: '400px',
          overflow: 'hidden',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '8px',
            borderBottom: '1px solid var(--color-border)',
            flexWrap: 'wrap',
          }}>
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: activeFilter === filter.id 
                    ? 'var(--color-primary)' 
                    : 'var(--color-surface)',
                  color: activeFilter === filter.id 
                    ? 'white' 
                    : 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>

          {/* Server List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px',
          }}>
            {filteredServers.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
              }}>
                {searchQuery 
                  ? `"${searchQuery}"에 대한 검색 결과가 없습니다`
                  : '서버가 없습니다'
                }
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredServers.map(server => (
                  <div
                    key={server.id}
                    onClick={() => {
                      if (server.status === 'online') {
                        onSelectServer(server);
                        setIsExpanded(false);
                        setSearchQuery('');
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: selectedServerId === server.id 
                        ? 'var(--color-primary-glow)' 
                        : 'var(--color-surface)',
                      border: selectedServerId === server.id 
                        ? '1px solid var(--color-primary)' 
                        : '1px solid transparent',
                      cursor: server.status === 'online' ? 'pointer' : 'not-allowed',
                      opacity: server.status === 'online' ? 1 : 0.5,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {/* Status Indicator */}
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getStatusColor(server.status),
                      flexShrink: 0,
                    }} />

                    {/* Server Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '2px',
                      }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: selectedServerId === server.id 
                            ? 'var(--color-primary)' 
                            : 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {server.name}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          background: `${getEnvironmentColor(server.environment)}20`,
                          color: getEnvironmentColor(server.environment),
                          flexShrink: 0,
                        }}>
                          {server.environment}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {server.hostname}
                        {server.tags && server.tags.length > 0 && (
                          <span style={{ marginLeft: '8px' }}>
                            {server.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                style={{
                                  marginLeft: '4px',
                                  padding: '1px 4px',
                                  background: 'var(--color-bg-secondary)',
                                  borderRadius: '2px',
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Favorite Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(server.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        opacity: server.isFavorite ? 1 : 0.3,
                        transition: 'opacity var(--transition-fast)',
                      }}
                      title={server.isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
                    >
                      ⭐
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '16px',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}>
            <span>총 {servers.length}개</span>
            <span>온라인 {servers.filter(s => s.status === 'online').length}개</span>
            <span>즐겨찾기 {servers.filter(s => s.isFavorite).length}개</span>
          </div>
        </div>
      )}
    </div>
  );
}

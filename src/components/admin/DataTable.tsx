// Data Table Component with Sorting, Search, and Pagination
'use client';

import React, { useState, useMemo } from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  getRowKey: (row: T) => string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = '검색...',
  pageSize = 10,
  emptyMessage = '데이터가 없습니다.',
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  // Filter data
  const filteredData = useMemo(() => {
    if (!search) return data;
    
    const lowerSearch = search.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const value = getNestedValue(row, col.key as string);
        return String(value).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, search, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      {searchable && (
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
          <input
            type="text"
            className="form-input"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: '300px' }}
          />
        </div>
      )}
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key as string}
                  style={{ 
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => col.sortable && handleSort(col.key as string)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {col.label}
                    {col.sortable && (
                      <span style={{ 
                        opacity: sortKey === col.key ? 1 : 0.3,
                        fontSize: '0.8rem'
                      }}>
                        {getSortIcon(col.key as string)}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map(row => (
                <tr 
                  key={getRowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map(col => (
                    <td key={col.key as string}>
                      {col.render 
                        ? col.render(getNestedValue(row, col.key as string), row)
                        : String(getNestedValue(row, col.key as string) ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            총 {sortedData.length}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedData.length)}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← 이전
            </button>
            <span style={{ padding: '8px', fontSize: '0.9rem' }}>
              {page} / {totalPages}
            </span>
            <button 
              className="btn btn-ghost btn-sm" 
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              다음 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get nested values like "user.name"
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

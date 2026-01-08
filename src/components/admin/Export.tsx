// Export Utility for Admin Data
// Supports CSV and JSON export

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  const keys = columns ? columns.map(c => c.key) : (Object.keys(data[0]) as (keyof T)[]);
  const headers = columns ? columns.map(c => c.label) : keys.map(String);

  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        const stringValue = value === null || value === undefined 
          ? '' 
          : typeof value === 'object' 
            ? JSON.stringify(value) 
            : String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = stringValue.replace(/"/g, '""');
        return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    )
  ].join('\n');

  // Add BOM for Korean character support
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToJSON<T>(data: T[], filename: string): void {
  if (data.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export button component
import React, { useState } from 'react';

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  filename: string;
  columns?: { key: keyof T; label: string }[];
}

export function ExportButton<T extends Record<string, unknown>>({ 
  data, 
  filename, 
  columns 
}: ExportButtonProps<T>) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-secondary btn-sm"
        onClick={() => setShowMenu(!showMenu)}
      >
        📥 내보내기
      </button>
      
      {showMenu && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowMenu(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid var(--color-border)',
            zIndex: 100,
            overflow: 'hidden',
            minWidth: '120px',
          }}>
            <button
              onClick={() => { exportToCSV(data, filename, columns); setShowMenu(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              📊 CSV
            </button>
            <button
              onClick={() => { exportToJSON(data, filename); setShowMenu(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              📋 JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Skeleton Loader Components for Admin Pages
import React from 'react';

// Base skeleton block
export function Skeleton({ 
  width = '100%', 
  height = '20px',
  className = ''
}: { 
  width?: string | number; 
  height?: string | number;
  className?: string;
}) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height,
        background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite',
        borderRadius: 'var(--radius-sm)',
      }} 
    />
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <Skeleton width="60%" height="14px" />
      <div style={{ marginTop: '8px' }}>
        <Skeleton width="40%" height="32px" />
      </div>
    </div>
  );
}

// Stats grid skeleton
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: `repeat(${count}, 1fr)`, marginBottom: '24px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <Skeleton width={i === 0 ? '80%' : '60%'} height="16px" />
        </td>
      ))}
    </tr>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}><Skeleton width="70%" height="14px" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Card list skeleton
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <Skeleton width="40%" height="20px" />
              <div style={{ marginTop: '8px' }}>
                <Skeleton width="60%" height="14px" />
              </div>
            </div>
            <Skeleton width="80px" height="32px" />
          </div>
          <Skeleton width="100%" height="60px" />
        </div>
      ))}
    </div>
  );
}

// Add CSS animation to global styles
export const skeletonStyles = `
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

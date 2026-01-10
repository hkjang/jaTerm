// Admin CRUD Utilities - Reusable components for admin pages
import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================
// Types
// ============================================

export interface ApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

export interface PaginatedResult<T> extends ApiResult<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
}

// ============================================
// Auth Headers Helper
// ============================================

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const user = localStorage.getItem('user');
  if (!user) return {};
  try {
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}` };
  } catch {
    return {};
  }
}

// ============================================
// Generic CRUD Hook
// ============================================

interface UseCrudOptions<T> {
  endpoint: string;
  idField?: keyof T;
  autoFetch?: boolean;
}

interface CrudResult<T> {
  items: T[];
  loading: boolean;
  error: string;
  success: string;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  fetch: (page?: number, filters?: Record<string, string>) => Promise<void>;
  create: (data: Partial<T>) => Promise<boolean>;
  update: (id: string, data: Partial<T>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearMessages: () => void;
}

export function useAdminCrud<T extends { id: string }>(options: UseCrudOptions<T>): CrudResult<T> {
  const { endpoint, autoFetch = true } = options;
  
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<CrudResult<T>['pagination']>(null);

  const fetch = useCallback(async (page = 1, filters: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20', ...filters });
      const response = await window.fetch(`${endpoint}?${params}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      const data = await response.json();
      setItems(data.items || data.data || data);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const create = useCallback(async (data: Partial<T>): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      const response = await window.fetch(endpoint, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '생성에 실패했습니다.');
      }
      setSuccess('생성되었습니다.');
      await fetch();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetch]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      const response = await window.fetch(endpoint, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('수정에 실패했습니다.');
      setSuccess('수정되었습니다.');
      await fetch();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    if (!confirm('정말 삭제하시겠습니까?')) return false;
    setLoading(true);
    setError('');
    try {
      const response = await window.fetch(endpoint, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('삭제에 실패했습니다.');
      setSuccess('삭제되었습니다.');
      await fetch();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetch]);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [autoFetch, fetch]);

  // Auto-clear success after 3s
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return { items, loading, error, success, pagination, fetch, create, update, remove, clearMessages };
}

// ============================================
// Toast Messages Component
// ============================================

export function AdminMessages({ error, success, onClear }: { error: string; success: string; onClear: () => void }) {
  if (!error && !success) return null;
  return (
    <>
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✅ {success}</span>
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>❌ {error}</span>
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}
    </>
  );
}

// ============================================
// Confirm Delete Dialog
// ============================================

export function ConfirmDialog({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  open: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay active" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>취소</button>
          <button className="btn btn-primary" style={{ background: 'var(--color-danger)' }} onClick={onConfirm}>삭제</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Status Badge Helper
// ============================================

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Common statuses
    ACTIVE: '#10b981', INACTIVE: '#6b7280', ENABLED: '#10b981', DISABLED: '#6b7280',
    ONLINE: '#10b981', OFFLINE: '#ef4444', PENDING: '#f59e0b', WARNING: '#f59e0b',
    SUCCESS: '#10b981', ERROR: '#ef4444', FAILED: '#ef4444', RUNNING: '#3b82f6',
    COMPLETED: '#10b981', CANCELLED: '#6b7280', APPROVED: '#10b981', REJECTED: '#ef4444',
    DRAFT: '#6b7280', IN_PROGRESS: '#8b5cf6', SCHEDULED: '#3b82f6', CRITICAL: '#ef4444',
    HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#10b981', INFO: '#3b82f6',
    // Environment
    PROD: '#ef4444', STAGE: '#f59e0b', DEV: '#10b981',
  };
  return statusColors[status.toUpperCase()] || '#6b7280';
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const color = getStatusColor(status);
  return (
    <span style={{ 
      padding: '4px 10px', 
      background: `${color}20`, 
      color, 
      borderRadius: '6px', 
      fontSize: '0.8rem', 
      fontWeight: 600 
    }}>
      {label || status}
    </span>
  );
}

// ============================================
// Empty State Component
// ============================================

export function EmptyState({ 
  icon = '📋', 
  title = '데이터가 없습니다', 
  description, 
  action 
}: { 
  icon?: string; 
  title?: string; 
  description?: string; 
  action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>{title}</div>
      {description && <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>{description}</div>}
      {action}
    </div>
  );
}

// ============================================
// Loading Spinner
// ============================================

export function LoadingSpinner({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
      <div style={{ color: 'var(--color-text-muted)' }}>{text}</div>
    </div>
  );
}

// ============================================
// Pagination Component
// ============================================

export function Pagination({ 
  pagination, 
  onPageChange 
}: { 
  pagination: { page: number; totalPages: number } | null; 
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
      {Array.from({ length: pagination.totalPages }).map((_, i) => (
        <button
          key={i}
          className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Search and Filter Bar
// ============================================

export function SearchFilter({ 
  searchValue, 
  onSearchChange, 
  placeholder = '🔍 검색...', 
  filters,
  onRefresh
}: { 
  searchValue: string; 
  onSearchChange: (value: string) => void; 
  placeholder?: string;
  filters?: React.ReactNode;
  onRefresh?: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
      <input 
        type="text" 
        className="form-input" 
        placeholder={placeholder} 
        value={searchValue} 
        onChange={(e) => onSearchChange(e.target.value)} 
        style={{ maxWidth: '250px' }} 
      />
      {filters}
      <div style={{ flex: 1 }} />
      {onRefresh && <button className="btn btn-ghost" onClick={onRefresh}>🔄 새로고침</button>}
    </div>
  );
}

// ============================================
// Stats Card Grid
// ============================================

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
      {children}
    </div>
  );
}

export function StatCard({ 
  label, 
  value, 
  color, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  color?: string; 
  icon?: string; 
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{icon} {label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}

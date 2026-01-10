// Comprehensive Admin CRUD Hook for API-based operations
import { useState, useCallback, useEffect, useRef } from 'react';

// Auth header helper
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const user = localStorage.getItem('user');
  if (!user) return {};
  try {
    const { id } = JSON.parse(user);
    return { 'Authorization': `Bearer ${id}`, 'Content-Type': 'application/json' };
  } catch {
    return {};
  }
}

// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

// Query params for list operations
interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: Record<string, string>;
  sort?: string;
  order?: 'asc' | 'desc';
}

// CRUD hook result
interface UseCrudResult<T> {
  items: T[];
  loading: boolean;
  error: string;
  success: string;
  total: number;
  // Operations
  fetch: (params?: QueryParams) => Promise<void>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  bulkRemove: (ids: string[]) => Promise<boolean>;
  // Utilities
  setSuccess: (msg: string) => void;
  clearError: () => void;
  clearSuccess: () => void;
}

interface UseCrudOptions {
  autoFetch?: boolean;
  autoRefresh?: number;
  mockData?: unknown[];
  useMock?: boolean;
}

export function useAdminCrud<T extends { id: string }>(
  endpoint: string,
  options: UseCrudOptions = {}
): UseCrudResult<T> {
  const { autoFetch = true, autoRefresh = 0, mockData = [], useMock = false } = options;
  
  const [items, setItems] = useState<T[]>(useMock ? mockData as T[] : []);
  const [loading, setLoading] = useState(!useMock && autoFetch);
  const [error, setError] = useState('');
  const [success, setSuccessState] = useState('');
  const [total, setTotal] = useState(useMock ? mockData.length : 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccessState(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Fetch items
  const fetch = useCallback(async (params?: QueryParams) => {
    setLoading(true);
    setError('');
    
    // Use mock data if specified
    if (useMock) {
      setItems(mockData as T[]);
      setTotal(mockData.length);
      setLoading(false);
      return;
    }

    try {
      const queryString = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            acc[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const response = await window.fetch(url, { headers: getAuthHeaders() });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const result: ApiResponse<T[]> = await response.json();
      setItems(result.data || []);
      setTotal(result.total || result.data?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      // Fallback to mock data if API fails
      if (mockData.length > 0) {
        setItems(mockData as T[]);
        setTotal(mockData.length);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, mockData, useMock]);

  // Create item
  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError('');
    
    if (useMock) {
      const newItem = { ...data, id: String(Date.now()) } as T;
      setItems(prev => [newItem, ...prev]);
      setTotal(prev => prev + 1);
      setSuccessState('생성되었습니다.');
      setLoading(false);
      return newItem;
    }

    try {
      const response = await window.fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '생성에 실패했습니다.');
      }
      
      const result: ApiResponse<T> = await response.json();
      if (result.data) {
        setItems(prev => [result.data!, ...prev]);
        setTotal(prev => prev + 1);
      }
      setSuccessState('생성되었습니다.');
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, useMock]);

  // Update item
  const update = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError('');
    
    if (useMock) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
      setSuccessState('수정되었습니다.');
      setLoading(false);
      return { ...data, id } as T;
    }

    try {
      const response = await window.fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '수정에 실패했습니다.');
      }
      
      const result: ApiResponse<T> = await response.json();
      if (result.data) {
        setItems(prev => prev.map(item => item.id === id ? result.data! : item));
      }
      setSuccessState('수정되었습니다.');
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, useMock]);

  // Delete item
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError('');
    
    if (useMock) {
      setItems(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
      setSuccessState('삭제되었습니다.');
      setLoading(false);
      return true;
    }

    try {
      const response = await window.fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '삭제에 실패했습니다.');
      }
      
      setItems(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
      setSuccessState('삭제되었습니다.');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, useMock]);

  // Bulk delete
  const bulkRemove = useCallback(async (ids: string[]): Promise<boolean> => {
    setLoading(true);
    setError('');
    
    if (useMock) {
      setItems(prev => prev.filter(item => !ids.includes(item.id)));
      setTotal(prev => prev - ids.length);
      setSuccessState(`${ids.length}개 삭제되었습니다.`);
      setLoading(false);
      return true;
    }

    try {
      const response = await window.fetch(`${endpoint}/bulk`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '일괄 삭제에 실패했습니다.');
      }
      
      setItems(prev => prev.filter(item => !ids.includes(item.id)));
      setTotal(prev => prev - ids.length);
      setSuccessState(`${ids.length}개 삭제되었습니다.`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, useMock]);

  // Auto-fetch on mount (skip if using mock since data is already initialized)
  useEffect(() => {
    if (autoFetch && !useMock) {
      fetch();
    }
    
    if (autoRefresh > 0 && !useMock) {
      intervalRef.current = setInterval(() => fetch(), autoRefresh);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoFetch, autoRefresh, fetch, useMock]);

  return {
    items,
    loading,
    error,
    success,
    total,
    fetch,
    create,
    update,
    remove,
    bulkRemove,
    setSuccess: setSuccessState,
    clearError: () => setError(''),
    clearSuccess: () => setSuccessState(''),
  };
}

// Custom action hook for non-CRUD operations
export function useAdminAction<TInput, TOutput = void>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const execute = useCallback(async (data: TInput, successMessage?: string): Promise<TOutput | null> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await window.fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '작업에 실패했습니다.');
      }
      
      const result = await response.json();
      setSuccess(successMessage || '완료되었습니다.');
      return result.data || result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method]);

  return { execute, loading, error, success, clearError: () => setError('') };
}

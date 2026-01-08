// Admin API Hook - Reusable hook for API calls with auth
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseAdminApiOptions<T> {
  initialData?: T;
  autoRefresh?: number; // milliseconds, 0 to disable
}

interface UseAdminApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

function getAuthHeaders(): Record<string, string> {
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

export function useAdminApi<T>(
  endpoint: string,
  options: UseAdminApiOptions<T> = {}
): UseAdminApiResult<T> {
  const { initialData = null, autoRefresh = 0 } = options;
  
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        }
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const result = await response.json();
      setData(result);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh > 0) {
      intervalRef.current = setInterval(fetchData, autoRefresh);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, autoRefresh]);

  return { data, loading, error, refetch: fetchData };
}

// Mutation hook for POST/PUT/DELETE operations
interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseMutationResult<T> {
  mutate: (data: T) => Promise<boolean>;
  loading: boolean;
  error: string;
}

export function useAdminMutation<T>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options: MutationOptions = {}
): UseMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mutate = useCallback(async (data: T): Promise<boolean> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '작업에 실패했습니다.');
      }
      
      options.onSuccess?.();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, options]);

  return { mutate, loading, error };
}

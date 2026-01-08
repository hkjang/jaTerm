'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Server {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  environment: 'PROD' | 'STAGE' | 'DEV';
  description?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface UseServersOptions {
  environment?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useServers(options: UseServersOptions = {}) {
  const { environment, autoRefresh = false, refreshInterval = 30000 } = options;
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (environment) params.set('environment', environment);

      const response = await fetch(`/api/servers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch servers');

      const data = await response.json();
      
      // Parse tags if stored as JSON string
      const parsedServers = data.map((s: any) => ({
        ...s,
        tags: s.tags ? (typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags) : [],
      }));

      setServers(parsedServers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    fetchServers();

    if (autoRefresh) {
      const interval = setInterval(fetchServers, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchServers, autoRefresh, refreshInterval]);

  const getServerById = useCallback((id: string) => {
    return servers.find(s => s.id === id);
  }, [servers]);

  const getServersByEnvironment = useCallback((env: string) => {
    return servers.filter(s => s.environment === env);
  }, [servers]);

  return {
    servers,
    loading,
    error,
    refetch: fetchServers,
    getServerById,
    getServersByEnvironment,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TerminalSessionData {
  id: string;
  userId: string;
  serverId: string;
  status: 'CONNECTING' | 'ACTIVE' | 'DISCONNECTED' | 'TERMINATED' | 'ERROR';
  startedAt: string;
  endedAt?: string;
  clientIp?: string;
  purpose?: string;
  server: {
    id: string;
    name: string;
    hostname: string;
    environment: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  format: string;
  duration?: number;
  createdAt: string;
  server: {
    id: string;
    name: string;
    hostname: string;
    environment: string;
  };
  user: {
    id: string;
    name: string;
  };
  sessionStartedAt: string;
  sessionEndedAt?: string;
}

export function useTerminalSessions(userId?: string) {
  const [sessions, setSessions] = useState<TerminalSessionData[]>([]);
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      params.set('limit', '50');

      const response = await fetch(`/api/terminal/sessions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchRecordings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      params.set('limit', '20');

      const response = await fetch(`/api/terminal/recordings?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch recordings');

      const data = await response.json();
      setRecordings(data);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchSessions();
    fetchRecordings();
  }, [fetchSessions, fetchRecordings]);

  const createSession = useCallback(async (serverId: string, purpose?: string): Promise<TerminalSessionData | null> => {
    try {
      const response = await fetch('/api/terminal/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          serverId,
          purpose,
          clientIp: undefined, // Server will detect if needed
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const session = await response.json();
      setSessions(prev => [session, ...prev]);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    }
  }, [userId]);

  const updateSessionStatus = useCallback(async (sessionId: string, status: string) => {
    try {
      const response = await fetch(`/api/terminal/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update session');

      const updatedSession = await response.json();
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      return updatedSession;
    } catch (err) {
      console.error('Failed to update session:', err);
      return null;
    }
  }, []);

  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/terminal/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to terminate session');

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'TERMINATED' as const, endedAt: new Date().toISOString() } : s
      ));
      return true;
    } catch (err) {
      console.error('Failed to terminate session:', err);
      return false;
    }
  }, []);

  const getActiveSessions = useCallback(() => {
    return sessions.filter(s => s.status === 'ACTIVE' || s.status === 'CONNECTING');
  }, [sessions]);

  const getSessionHistory = useCallback(() => {
    return sessions.filter(s => s.status === 'DISCONNECTED' || s.status === 'TERMINATED');
  }, [sessions]);

  return {
    sessions,
    recordings,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSessionStatus,
    terminateSession,
    getActiveSessions,
    getSessionHistory,
  };
}

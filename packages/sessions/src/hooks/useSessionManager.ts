import { useState, useEffect, useCallback } from 'react';
import type { UseSessionManagerReturn, SessionData } from '../types';
import { SessionService } from '../services/SessionService';

export function useSessionManager(sessionService: SessionService): UseSessionManagerReturn {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Note: This would need to be enhanced to get all sessions
      // For now, we'll just get the current session if available
      const currentSession = await sessionService.getCurrentSession();
      setSessions(currentSession ? [currentSession] : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load sessions'));
    } finally {
      setIsLoading(false);
    }
  }, [sessionService]);

  const cleanupSessions = useCallback(async (): Promise<number> => {
    setError(null);
    
    try {
      const count = await sessionService.cleanupExpiredSessions();
      await loadSessions(); // Refresh session list
      return count;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cleanup sessions');
      setError(error);
      throw error;
    }
  }, [sessionService, loadSessions]);

  const getUserSessions = useCallback(async (userId: string): Promise<SessionData[]> => {
    setError(null);
    
    try {
      return await sessionService.getUserSessions(userId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get user sessions');
      setError(error);
      throw error;
    }
  }, [sessionService]);

  const terminateSession = useCallback(async (sessionId: string): Promise<void> => {
    setError(null);
    
    try {
      await sessionService.terminateSession(sessionId);
      await loadSessions(); // Refresh session list
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to terminate session');
      setError(error);
      throw error;
    }
  }, [sessionService, loadSessions]);

  const terminateUserSessions = useCallback(async (userId: string): Promise<void> => {
    setError(null);
    
    try {
      await sessionService.terminateUserSessions(userId);
      await loadSessions(); // Refresh session list
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to terminate user sessions');
      setError(error);
      throw error;
    }
  }, [sessionService, loadSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const activeSessions = sessions.filter(session => {
    const now = new Date();
    return session.expiresAt > now;
  });

  const expiredSessions = sessions.filter(session => {
    const now = new Date();
    return session.expiresAt <= now;
  });

  return {
    sessions,
    activeSessions,
    expiredSessions,
    isLoading,
    error,
    cleanupSessions,
    getUserSessions,
    terminateSession,
    terminateUserSessions
  };
}
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  SessionContext as SessionContextType,
  SessionProviderProps, 
  SessionData,
  SessionValidationResult,
  SessionConfig,
  SessionSecurityOptions,
  SessionCleanupConfig,
  SessionLifecycleEvents
} from '../types';
import { SessionService } from '../services/SessionService';

export const SessionContext = createContext<SessionContextType | null>(null);

const defaultConfig: SessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  slidingExpiration: true,
  secureOnly: false,
  httpOnly: false,
  sameSite: 'lax',
  path: '/',
  storage: 'memory',
  fingerprintEnabled: true,
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
};

const defaultSecurityOptions: SessionSecurityOptions = {
  enableFingerprinting: true,
  enableEncryption: false,
  enableTamperDetection: true,
  maxSessionsPerUser: 5
};

const defaultCleanupConfig: SessionCleanupConfig = {
  enabled: true,
  interval: 5 * 60 * 1000, // 5 minutes
  batchSize: 50,
  expiredSessionRetention: 24 * 60 * 60 * 1000 // 24 hours
};

export function SessionProvider({ 
  children, 
  config: configOverrides = {},
  onSessionEvent = {}
}: SessionProviderProps) {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const config = useMemo(() => ({ ...defaultConfig, ...configOverrides }), [configOverrides]);
  
  const sessionService = useMemo(() => {
    return new SessionService(
      config,
      defaultSecurityOptions,
      defaultCleanupConfig,
      onSessionEvent
    );
  }, [config, onSessionEvent]);

  const loadCurrentSession = useCallback(async () => {
    try {
      const session = await sessionService.getCurrentSession();
      setCurrentSession(session);
      return session;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load session');
      setError(error);
      return null;
    }
  }, [sessionService]);

  const startSession = useCallback(async (
    userId?: string, 
    metadata: Record<string, any> = {}
  ): Promise<SessionData> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await sessionService.startSession(userId, metadata);
      setCurrentSession(session);
      return session;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start session');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionService]);

  const updateSession = useCallback(async (updates: Partial<SessionData>): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedSession = await sessionService.updateSession(updates);
      setCurrentSession(updatedSession);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update session');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionService]);

  const refreshSession = useCallback(async (): Promise<void> => {
    if (!currentSession) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const refreshedSession = await sessionService.refreshSession();
      setCurrentSession(refreshedSession);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh session');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionService, currentSession]);

  const endSession = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await sessionService.endSession();
      setCurrentSession(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to end session');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionService]);

  const validateSession = useCallback(async (): Promise<SessionValidationResult> => {
    try {
      return await sessionService.validateSession();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to validate session');
      setError(error);
      throw error;
    }
  }, [sessionService]);

  // Load current session on mount
  useEffect(() => {
    loadCurrentSession();
  }, [loadCurrentSession]);

  // Auto-refresh session before expiration
  useEffect(() => {
    if (!currentSession || !config.slidingExpiration) {
      return;
    }

    const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiration
    const timeUntilExpiry = currentSession.expiresAt.getTime() - Date.now();
    const refreshTime = Math.max(0, timeUntilExpiry - refreshThreshold);

    const timeout = setTimeout(() => {
      refreshSession();
    }, refreshTime);

    return () => clearTimeout(timeout);
  }, [currentSession, config.slidingExpiration, refreshSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionService.destroy();
    };
  }, [sessionService]);

  const contextValue: SessionContextType = {
    currentSession,
    isLoading,
    error,
    startSession,
    updateSession,
    refreshSession,
    endSession,
    validateSession
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}
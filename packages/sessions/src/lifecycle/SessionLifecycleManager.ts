import type { 
  SessionData, 
  SessionConfig, 
  SessionLifecycleEvents,
  SessionStorageProvider 
} from '../types';
import { SessionError } from '../types';
import { generateId } from '@company/utils';

export class SessionLifecycleManager {
  private events: Partial<SessionLifecycleEvents> = {};

  constructor(
    private storage: SessionStorageProvider,
    private config: SessionConfig
  ) {}

  async createSession(
    userId?: string, 
    metadata: Record<string, any> = {},
    fingerprint?: string
  ): Promise<SessionData> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.maxAge);

      const session: SessionData = {
        id: generateId(),
        userId,
        isAuthenticated: !!userId,
        expiresAt,
        lastActivity: now,
        metadata,
        fingerprint,
        createdAt: now,
        updatedAt: now
      };

      await this.storage.set(session.id, session);
      
      // Trigger lifecycle event
      if (this.events.onSessionStart) {
        this.events.onSessionStart(session);
      }

      return session;
    } catch (error) {
      throw new SessionError(
        `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_ERROR'
      );
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<SessionData> {
    try {
      const existingSession = await this.storage.get(sessionId);
      if (!existingSession) {
        throw new SessionError('Session not found', 'NOT_FOUND', sessionId);
      }

      const now = new Date();
      let expiresAt = existingSession.expiresAt;

      // Handle sliding expiration
      if (this.config.slidingExpiration) {
        expiresAt = new Date(now.getTime() + this.config.maxAge);
      }

      const updatedSession: SessionData = {
        ...existingSession,
        ...updates,
        id: sessionId, // Ensure ID cannot be changed
        updatedAt: now,
        lastActivity: now,
        expiresAt
      };

      await this.storage.set(sessionId, updatedSession);

      // Trigger lifecycle event
      if (this.events.onSessionUpdate) {
        this.events.onSessionUpdate(updatedSession);
      }

      return updatedSession;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR',
        sessionId
      );
    }
  }

  async refreshSession(sessionId: string): Promise<SessionData> {
    try {
      const session = await this.storage.get(sessionId);
      if (!session) {
        throw new SessionError('Session not found', 'NOT_FOUND', sessionId);
      }

      const now = new Date();
      const refreshedSession: SessionData = {
        ...session,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + this.config.maxAge),
        updatedAt: now
      };

      await this.storage.set(sessionId, refreshedSession);

      // Trigger lifecycle event
      if (this.events.onSessionUpdate) {
        this.events.onSessionUpdate(refreshedSession);
      }

      return refreshedSession;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to refresh session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REFRESH_ERROR',
        sessionId
      );
    }
  }

  async extendSession(sessionId: string, additionalTime: number): Promise<SessionData> {
    try {
      const session = await this.storage.get(sessionId);
      if (!session) {
        throw new SessionError('Session not found', 'NOT_FOUND', sessionId);
      }

      const now = new Date();
      const extendedSession: SessionData = {
        ...session,
        expiresAt: new Date(session.expiresAt.getTime() + additionalTime),
        lastActivity: now,
        updatedAt: now
      };

      await this.storage.set(sessionId, extendedSession);

      // Trigger lifecycle event
      if (this.events.onSessionUpdate) {
        this.events.onSessionUpdate(extendedSession);
      }

      return extendedSession;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to extend session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTEND_ERROR',
        sessionId
      );
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    try {
      const session = await this.storage.get(sessionId);
      
      await this.storage.remove(sessionId);

      // Trigger lifecycle event
      if (this.events.onSessionDestroy) {
        this.events.onSessionDestroy(sessionId);
      }

      // If session existed and was not expired, trigger expire event
      if (session && session.expiresAt > new Date()) {
        if (this.events.onSessionExpire) {
          this.events.onSessionExpire(session);
        }
      }
    } catch (error) {
      throw new SessionError(
        `Failed to destroy session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DESTROY_ERROR',
        sessionId
      );
    }
  }

  async expireSession(sessionId: string): Promise<void> {
    try {
      const session = await this.storage.get(sessionId);
      if (!session) {
        return; // Session already gone
      }

      // Update session to mark as expired
      const now = new Date();
      const expiredSession: SessionData = {
        ...session,
        expiresAt: now,
        updatedAt: now
      };

      await this.storage.set(sessionId, expiredSession);

      // Trigger lifecycle event
      if (this.events.onSessionExpire) {
        this.events.onSessionExpire(expiredSession);
      }
    } catch (error) {
      throw new SessionError(
        `Failed to expire session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXPIRE_ERROR',
        sessionId
      );
    }
  }

  async terminateUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    try {
      const userSessions = await this.storage.getUserSessions(userId);
      let terminatedCount = 0;

      for (const session of userSessions) {
        if (exceptSessionId && session.id === exceptSessionId) {
          continue;
        }

        await this.destroySession(session.id);
        terminatedCount++;
      }

      return terminatedCount;
    } catch (error) {
      throw new SessionError(
        `Failed to terminate user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TERMINATE_ERROR'
      );
    }
  }

  setEventHandlers(events: Partial<SessionLifecycleEvents>): void {
    this.events = { ...this.events, ...events };
  }

  removeEventHandlers(): void {
    this.events = {};
  }

  getConfig(): SessionConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
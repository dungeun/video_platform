import type { SessionData, SessionStorageProvider } from '../types';
import { SessionStorageError } from '../types';

export class LocalSessionStorageProvider implements SessionStorageProvider {
  private readonly prefix = 'session_';

  private getStorageKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  private parseSession(data: string): SessionData {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      expiresAt: new Date(parsed.expiresAt),
      lastActivity: new Date(parsed.lastActivity),
    };
  }

  private serializeSession(session: SessionData): string {
    return JSON.stringify(session);
  }

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      if (typeof window === 'undefined') {
        throw new SessionStorageError('LocalStorage is not available in server-side environment');
      }

      const key = this.getStorageKey(sessionId);
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }

      return this.parseSession(data);
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to get session from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new SessionStorageError('LocalStorage is not available in server-side environment');
      }

      const key = this.getStorageKey(sessionId);
      const data = this.serializeSession(session);
      
      localStorage.setItem(key, data);
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to set session in localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async remove(sessionId: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new SessionStorageError('LocalStorage is not available in server-side environment');
      }

      const key = this.getStorageKey(sessionId);
      localStorage.removeItem(key);
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to remove session from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new SessionStorageError('LocalStorage is not available in server-side environment');
      }

      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to clear sessions from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getExpiredSessions(): Promise<SessionData[]> {
    try {
      if (typeof window === 'undefined') {
        return [];
      }

      const now = new Date();
      const expiredSessions: SessionData[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const session = this.parseSession(data);
              if (session.expiresAt <= now) {
                expiredSessions.push(session);
              }
            }
          } catch (parseError) {
            // Skip invalid sessions
            continue;
          }
        }
      }

      return expiredSessions;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to get expired sessions from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async removeExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await this.getExpiredSessions();
      
      for (const session of expiredSessions) {
        await this.remove(session.id);
      }

      return expiredSessions.length;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to remove expired sessions from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      if (typeof window === 'undefined') {
        return [];
      }

      const userSessions: SessionData[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const session = this.parseSession(data);
              if (session.userId === userId) {
                userSessions.push(session);
              }
            }
          } catch (parseError) {
            // Skip invalid sessions
            continue;
          }
        }
      }

      return userSessions;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to get user sessions from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
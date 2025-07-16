import type { SessionData, SessionStorageProvider } from '../types';
import { SessionStorageError } from '../types';

export class MemorySessionStorageProvider implements SessionStorageProvider {
  private sessions = new Map<string, SessionData>();

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      return this.sessions.get(sessionId) || null;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to get session from memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    try {
      this.sessions.set(sessionId, { ...session });
    } catch (error) {
      throw new SessionStorageError(
        `Failed to set session in memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async remove(sessionId: string): Promise<void> {
    try {
      this.sessions.delete(sessionId);
    } catch (error) {
      throw new SessionStorageError(
        `Failed to remove session from memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async clear(): Promise<void> {
    try {
      this.sessions.clear();
    } catch (error) {
      throw new SessionStorageError(
        `Failed to clear sessions from memory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getExpiredSessions(): Promise<SessionData[]> {
    try {
      const now = new Date();
      const expiredSessions: SessionData[] = [];

      for (const session of this.sessions.values()) {
        if (session.expiresAt <= now) {
          expiredSessions.push(session);
        }
      }

      return expiredSessions;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to get expired sessions from memory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async removeExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await this.getExpiredSessions();
      
      for (const session of expiredSessions) {
        this.sessions.delete(session.id);
      }

      return expiredSessions.length;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to remove expired sessions from memory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessions: SessionData[] = [];

      for (const session of this.sessions.values()) {
        if (session.userId === userId) {
          userSessions.push(session);
        }
      }

      return userSessions;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to get user sessions from memory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Utility methods for memory storage
  getSessionCount(): number {
    return this.sessions.size;
  }

  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }
}
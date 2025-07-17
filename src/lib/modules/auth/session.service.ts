/**
 * Session Service
 * User session management service
 */

import { RedisManager } from '../../core/RedisManager';
import { SessionData, Session } from './auth.types';
import { randomBytes } from 'crypto';

export class SessionService {
  private redis: RedisManager;
  private sessionTTL: number;

  constructor(redis: RedisManager) {
    this.redis = redis;
    this.sessionTTL = parseInt(process.env.SESSION_TTL || '604800'); // 7 days default
  }

  private generateSessionId(userId: string): string {
    const timestamp = Date.now();
    const random = randomBytes(16).toString('hex');
    return `session:${userId}:${timestamp}:${random}`;
  }

  async createSession(userId: string, data: SessionData): Promise<Session> {
    const sessionId = this.generateSessionId(userId);
    const now = new Date();
    
    const session: Session = {
      id: sessionId,
      userId,
      refreshToken: data.refreshToken,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      createdAt: data.createdAt || now,
      expiresAt: data.expiresAt || new Date(now.getTime() + this.sessionTTL * 1000)
    };

    // Store session in Redis
    await this.redis.setJSON(sessionId, session, this.sessionTTL);
    
    // Add to user's session set
    await this.redis.sadd(`user-sessions:${userId}`, sessionId);
    
    // Store reverse lookup for token
    await this.redis.set(`refresh-token:${data.refreshToken}`, sessionId, this.sessionTTL);

    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.redis.getJSON<Session>(sessionId);
    return session;
  }

  async getSessionByToken(refreshToken: string): Promise<Session | null> {
    const sessionId = await this.redis.get(`refresh-token:${refreshToken}`);
    if (!sessionId) {
      return null;
    }
    return this.getSession(sessionId);
  }

  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const updatedSession = { ...session, ...data };
    await this.redis.setJSON(sessionId, updatedSession, this.sessionTTL);

    // Update token lookup if refresh token changed
    if (data.refreshToken && data.refreshToken !== session.refreshToken) {
      await this.redis.del(`refresh-token:${session.refreshToken}`);
      await this.redis.set(`refresh-token:${data.refreshToken}`, sessionId, this.sessionTTL);
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return;
    }

    // Remove session
    await this.redis.del(sessionId);
    
    // Remove from user's session set
    await this.redis.srem(`user-sessions:${session.userId}`, sessionId);
    
    // Remove token lookup
    await this.redis.del(`refresh-token:${session.refreshToken}`);
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(`user-sessions:${userId}`);
    
    for (const sessionId of sessionIds) {
      await this.invalidateSession(sessionId);
    }
    
    // Clear the set
    await this.redis.del(`user-sessions:${userId}`);
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionIds = await this.redis.smembers(`user-sessions:${userId}`);
    const sessions: Session[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  async cleanExpiredSessions(): Promise<number> {
    // This would be implemented as a background job
    // For now, sessions expire automatically via Redis TTL
    return 0;
  }
}
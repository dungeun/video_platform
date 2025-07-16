import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../src/services/SessionService';
import { MemorySessionStorageProvider } from '../src/storage/MemoryStorageProvider';
import { SessionValidator } from '../src/validation/SessionValidator';
import type { SessionConfig, SessionSecurityOptions, SessionCleanupConfig } from '../src/types';

describe('Sessions Module', () => {
  let sessionService: SessionService;
  let config: SessionConfig;
  let securityOptions: SessionSecurityOptions;
  let cleanupConfig: SessionCleanupConfig;

  beforeEach(() => {
    config = {
      maxAge: 60 * 60 * 1000, // 1 hour
      slidingExpiration: true,
      secureOnly: false,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      storage: 'memory',
      fingerprintEnabled: false,
      cleanupInterval: 5 * 60 * 1000
    };

    securityOptions = {
      enableFingerprinting: false,
      enableEncryption: false,
      enableTamperDetection: true,
      maxSessionsPerUser: 5
    };

    cleanupConfig = {
      enabled: false, // Disable for tests
      interval: 5 * 60 * 1000,
      batchSize: 50,
      expiredSessionRetention: 24 * 60 * 60 * 1000
    };

    sessionService = new SessionService(config, securityOptions, cleanupConfig);
  });

  describe('SessionService', () => {
    it('should create a new session', async () => {
      const session = await sessionService.startSession('user123', { role: 'admin' });

      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.isAuthenticated).toBe(true);
      expect(session.metadata.role).toBe('admin');
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.updatedAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
    });

    it('should create anonymous session when no userId provided', async () => {
      const session = await sessionService.startSession();

      expect(session.id).toBeDefined();
      expect(session.userId).toBeUndefined();
      expect(session.isAuthenticated).toBe(false);
    });

    it('should retrieve current session', async () => {
      const originalSession = await sessionService.startSession('user123');
      const retrievedSession = await sessionService.getCurrentSession();

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession!.id).toBe(originalSession.id);
      expect(retrievedSession!.userId).toBe('user123');
    });

    it('should update session metadata', async () => {
      await sessionService.startSession('user123', { role: 'admin' });
      
      const updatedSession = await sessionService.updateSession({
        metadata: { role: 'admin', department: 'IT' }
      });

      expect(updatedSession.metadata.role).toBe('admin');
      expect(updatedSession.metadata.department).toBe('IT');
      expect(updatedSession.updatedAt.getTime()).toBeGreaterThan(updatedSession.createdAt.getTime());
    });

    it('should refresh session expiration', async () => {
      const originalSession = await sessionService.startSession('user123');
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const refreshedSession = await sessionService.refreshSession();

      expect(refreshedSession.expiresAt.getTime()).toBeGreaterThan(originalSession.expiresAt.getTime());
      expect(refreshedSession.lastActivity.getTime()).toBeGreaterThan(originalSession.lastActivity.getTime());
    });

    it('should validate session correctly', async () => {
      await sessionService.startSession('user123');
      
      const validationResult = await sessionService.validateSession();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.reason).toBeUndefined();
      expect(validationResult.remainingTime).toBeGreaterThan(0);
    });

    it('should invalidate expired session', async () => {
      // Create session with very short expiration
      const shortConfig = { ...config, maxAge: 10 }; // 10ms
      const shortLivedService = new SessionService(shortConfig, securityOptions, cleanupConfig);
      
      await shortLivedService.startSession('user123');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const validationResult = await shortLivedService.validateSession();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.reason).toBe('expired');
    });

    it('should end session', async () => {
      await sessionService.startSession('user123');
      
      await sessionService.endSession();
      
      const currentSession = await sessionService.getCurrentSession();
      expect(currentSession).toBeNull();
    });

    it('should terminate specific session', async () => {
      const session = await sessionService.startSession('user123');
      
      await sessionService.terminateSession(session.id);
      
      const retrievedSession = await sessionService.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });
  });

  describe('MemorySessionStorageProvider', () => {
    let storage: MemorySessionStorageProvider;

    beforeEach(() => {
      storage = new MemorySessionStorageProvider();
    });

    it('should store and retrieve session', async () => {
      const session = {
        id: 'test-session',
        userId: 'user123',
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 60000),
        lastActivity: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storage.set(session.id, session);
      const retrieved = await storage.get(session.id);

      expect(retrieved).toEqual(session);
    });

    it('should return null for non-existent session', async () => {
      const retrieved = await storage.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should remove session', async () => {
      const session = {
        id: 'test-session',
        userId: 'user123',
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 60000),
        lastActivity: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storage.set(session.id, session);
      await storage.remove(session.id);
      
      const retrieved = await storage.get(session.id);
      expect(retrieved).toBeNull();
    });

    it('should find expired sessions', async () => {
      const expiredSession = {
        id: 'expired-session',
        userId: 'user123',
        isAuthenticated: true,
        expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
        lastActivity: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const activeSession = {
        id: 'active-session',
        userId: 'user456',
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 60000), // Expires in 1 minute
        lastActivity: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storage.set(expiredSession.id, expiredSession);
      await storage.set(activeSession.id, activeSession);

      const expiredSessions = await storage.getExpiredSessions();
      
      expect(expiredSessions).toHaveLength(1);
      expect(expiredSessions[0].id).toBe('expired-session');
    });
  });

  describe('SessionValidator', () => {
    let validator: SessionValidator;

    beforeEach(() => {
      validator = new SessionValidator({
        enableFingerprinting: false,
        enableEncryption: false,
        enableTamperDetection: true,
        maxSessionsPerUser: 5
      });
    });

    it('should validate active session', () => {
      const session = {
        id: 'test-session',
        userId: 'user123',
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 60000),
        lastActivity: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSession(session);

      expect(result.isValid).toBe(true);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should invalidate expired session', () => {
      const session = {
        id: 'test-session',
        userId: 'user123',
        isAuthenticated: true,
        expiresAt: new Date(Date.now() - 1000), // Expired
        lastActivity: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSession(session);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should detect tampered session', () => {
      const session = {
        id: 'test-session',
        userId: 'user123',
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 60000),
        lastActivity: new Date(),
        metadata: {},
        createdAt: new Date(Date.now() + 60000), // Future creation date
        updatedAt: new Date()
      };

      const result = validator.validateSession(session);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('tampered');
    });
  });
});
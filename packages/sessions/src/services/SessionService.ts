import type { 
  SessionData, 
  SessionConfig, 
  SessionValidationResult,
  SessionStorageProvider,
  SessionLifecycleEvents,
  SessionSecurityOptions,
  SessionCleanupConfig
} from '../types';
import { SessionError } from '../types';

import { MemorySessionStorageProvider } from '../storage/MemoryStorageProvider';
import { LocalSessionStorageProvider } from '../storage/LocalStorageProvider';
import { IndexedDBSessionStorageProvider } from '../storage/IndexedDBProvider';
import { SessionValidator } from '../validation/SessionValidator';
import { SessionLifecycleManager } from '../lifecycle/SessionLifecycleManager';
import { SessionSecurityManager } from '../security/SessionSecurityManager';
import { SessionCleanupManager } from '../cleanup/SessionCleanupManager';

export class SessionService {
  private storage: SessionStorageProvider;
  private validator: SessionValidator;
  private lifecycleManager: SessionLifecycleManager;
  private securityManager: SessionSecurityManager;
  private cleanupManager: SessionCleanupManager;
  private currentSessionId: string | null = null;

  constructor(
    private config: SessionConfig,
    private securityOptions: SessionSecurityOptions,
    private cleanupConfig: SessionCleanupConfig,
    events?: Partial<SessionLifecycleEvents>
  ) {
    // Initialize storage provider
    this.storage = this.createStorageProvider();
    
    // Initialize managers
    this.validator = new SessionValidator(securityOptions);
    this.lifecycleManager = new SessionLifecycleManager(this.storage, config);
    this.securityManager = new SessionSecurityManager(securityOptions);
    this.cleanupManager = new SessionCleanupManager(this.storage, cleanupConfig, events);

    // Set event handlers
    if (events) {
      this.lifecycleManager.setEventHandlers(events);
    }

    // Start cleanup if enabled
    if (cleanupConfig.enabled) {
      this.cleanupManager.start();
    }
  }

  private createStorageProvider(): SessionStorageProvider {
    switch (this.config.storage) {
      case 'localStorage':
        return new LocalSessionStorageProvider();
      case 'indexedDB':
        return new IndexedDBSessionStorageProvider();
      case 'memory':
      default:
        return new MemorySessionStorageProvider();
    }
  }

  async startSession(userId?: string, metadata: Record<string, any> = {}): Promise<SessionData> {
    try {
      // Generate fingerprint if security is enabled
      let fingerprint: string | undefined;
      if (this.securityOptions.enableFingerprinting) {
        fingerprint = this.securityManager.generateFingerprint();
      }

      // Check session limits for user
      if (userId && this.securityOptions.maxSessionsPerUser) {
        const userSessions = await this.storage.getUserSessions(userId);
        if (!this.securityManager.checkSessionLimits(userSessions)) {
          throw new SessionError(
            'Maximum number of sessions exceeded for user',
            'SESSION_LIMIT_EXCEEDED'
          );
        }
      }

      const session = await this.lifecycleManager.createSession(userId, metadata, fingerprint);
      this.currentSessionId = session.id;
      
      return session;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'START_ERROR'
      );
    }
  }

  async getCurrentSession(): Promise<SessionData | null> {
    if (!this.currentSessionId) {
      return null;
    }

    try {
      return await this.storage.get(this.currentSessionId);
    } catch (error) {
      throw new SessionError(
        `Failed to get current session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ERROR',
        this.currentSessionId
      );
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      return await this.storage.get(sessionId);
    } catch (error) {
      throw new SessionError(
        `Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ERROR',
        sessionId
      );
    }
  }

  async updateSession(updates: Partial<SessionData>): Promise<SessionData> {
    if (!this.currentSessionId) {
      throw new SessionError('No active session', 'NO_ACTIVE_SESSION');
    }

    try {
      // Sanitize updates for security
      const sanitizedUpdates = this.securityManager.sanitizeSessionData({
        ...updates,
        id: this.currentSessionId
      } as SessionData);

      return await this.lifecycleManager.updateSession(this.currentSessionId, sanitizedUpdates);
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR',
        this.currentSessionId
      );
    }
  }

  async refreshSession(): Promise<SessionData> {
    if (!this.currentSessionId) {
      throw new SessionError('No active session', 'NO_ACTIVE_SESSION');
    }

    try {
      return await this.lifecycleManager.refreshSession(this.currentSessionId);
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to refresh session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REFRESH_ERROR',
        this.currentSessionId
      );
    }
  }

  async validateSession(sessionId?: string): Promise<SessionValidationResult> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      return {
        isValid: false,
        reason: 'not_found'
      };
    }

    try {
      const session = await this.storage.get(targetSessionId);
      if (!session) {
        return {
          isValid: false,
          reason: 'not_found'
        };
      }

      // Generate current fingerprint for validation
      let currentFingerprint: string | undefined;
      if (this.securityOptions.enableFingerprinting) {
        currentFingerprint = this.securityManager.generateFingerprint();
      }

      return this.validator.validateSession(session, currentFingerprint);
    } catch (error) {
      throw new SessionError(
        `Failed to validate session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_ERROR',
        targetSessionId
      );
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }

    try {
      await this.lifecycleManager.destroySession(this.currentSessionId);
      this.currentSessionId = null;
    } catch (error) {
      throw new SessionError(
        `Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'END_ERROR',
        this.currentSessionId
      );
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await this.lifecycleManager.destroySession(sessionId);
      
      // Clear current session if it was terminated
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to terminate session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TERMINATE_ERROR',
        sessionId
      );
    }
  }

  async terminateUserSessions(userId: string, exceptCurrentSession = false): Promise<number> {
    try {
      const exceptSessionId = exceptCurrentSession ? this.currentSessionId : undefined;
      return await this.lifecycleManager.terminateUserSessions(userId, exceptSessionId);
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to terminate user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TERMINATE_USER_ERROR'
      );
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      return await this.storage.getUserSessions(userId);
    } catch (error) {
      throw new SessionError(
        `Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_USER_SESSIONS_ERROR'
      );
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      return await this.cleanupManager.forceCleanup();
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        `Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLEANUP_ERROR'
      );
    }
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  getConfig(): SessionConfig {
    return this.lifecycleManager.getConfig();
  }

  updateConfig(updates: Partial<SessionConfig>): void {
    this.lifecycleManager.updateConfig(updates);
  }

  getSecurityOptions(): SessionSecurityOptions {
    return this.securityManager.getSecurityOptions();
  }

  updateSecurityOptions(options: Partial<SessionSecurityOptions>): void {
    this.securityManager.updateSecurityOptions(options);
    this.validator.updateSecurityOptions(options);
  }

  getCleanupConfig(): SessionCleanupConfig {
    return this.cleanupManager.getConfig();
  }

  updateCleanupConfig(config: Partial<SessionCleanupConfig>): void {
    this.cleanupManager.updateConfig(config);
  }

  destroy(): void {
    this.cleanupManager.stop();
    this.currentSessionId = null;
  }
}
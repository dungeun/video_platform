import type { 
  SessionCleanupConfig, 
  SessionStorageProvider,
  SessionLifecycleEvents 
} from '../types';
import { SessionError } from '../types';

export class SessionCleanupManager {
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private storage: SessionStorageProvider,
    private config: SessionCleanupConfig,
    private events?: Partial<SessionLifecycleEvents>
  ) {}

  start(): void {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextCleanup();
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.isRunning = false;
  }

  private scheduleNextCleanup(): void {
    if (!this.isRunning || !this.config.enabled) {
      return;
    }

    this.cleanupTimer = setTimeout(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('Session cleanup failed:', error);
      }

      // Schedule next cleanup
      this.scheduleNextCleanup();
    }, this.config.interval);
  }

  async performCleanup(): Promise<number> {
    try {
      const expiredSessions = await this.storage.getExpiredSessions();
      
      if (expiredSessions.length === 0) {
        return 0;
      }

      let cleanedCount = 0;
      const batchSize = this.config.batchSize || 50;

      // Process in batches to avoid overwhelming the storage
      for (let i = 0; i < expiredSessions.length; i += batchSize) {
        const batch = expiredSessions.slice(i, i + batchSize);
        
        for (const session of batch) {
          try {
            // Check if session should be retained based on retention policy
            if (this.shouldRetainExpiredSession(session)) {
              continue;
            }

            await this.storage.remove(session.id);
            cleanedCount++;

            // Trigger expire event if handler exists
            if (this.events?.onSessionExpire) {
              this.events.onSessionExpire(session);
            }
          } catch (error) {
            console.error(`Failed to cleanup session ${session.id}:`, error);
          }
        }

        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < expiredSessions.length) {
          await this.delay(100);
        }
      }

      return cleanedCount;
    } catch (error) {
      throw new SessionError(
        `Session cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLEANUP_ERROR'
      );
    }
  }

  private shouldRetainExpiredSession(session: any): boolean {
    if (!this.config.expiredSessionRetention) {
      return false;
    }

    const now = new Date();
    const expirationTime = session.expiresAt.getTime();
    const retentionTime = this.config.expiredSessionRetention;

    return (now.getTime() - expirationTime) < retentionTime;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async forceCleanup(): Promise<number> {
    return await this.performCleanup();
  }

  async cleanupUserSessions(userId: string): Promise<number> {
    try {
      const userSessions = await this.storage.getUserSessions(userId);
      let cleanedCount = 0;

      for (const session of userSessions) {
        const now = new Date();
        if (session.expiresAt <= now) {
          await this.storage.remove(session.id);
          cleanedCount++;

          // Trigger expire event if handler exists
          if (this.events?.onSessionExpire) {
            this.events.onSessionExpire(session);
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      throw new SessionError(
        `User session cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLEANUP_ERROR'
      );
    }
  }

  async getCleanupStats(): Promise<{
    totalExpired: number;
    oldestExpired: Date | null;
    retentionQueueSize: number;
  }> {
    try {
      const expiredSessions = await this.storage.getExpiredSessions();
      
      const totalExpired = expiredSessions.length;
      const oldestExpired = expiredSessions.length > 0 
        ? expiredSessions.reduce((oldest, session) => 
            session.expiresAt < oldest ? session.expiresAt : oldest,
            expiredSessions[0].expiresAt
          )
        : null;

      const retentionQueueSize = expiredSessions.filter(session => 
        this.shouldRetainExpiredSession(session)
      ).length;

      return {
        totalExpired,
        oldestExpired,
        retentionQueueSize
      };
    } catch (error) {
      throw new SessionError(
        `Failed to get cleanup stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STATS_ERROR'
      );
    }
  }

  isCleanupRunning(): boolean {
    return this.isRunning;
  }

  getConfig(): SessionCleanupConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SessionCleanupConfig>): void {
    const oldEnabled = this.config.enabled;
    this.config = { ...this.config, ...updates };

    // Restart cleanup if enabled state changed
    if (oldEnabled !== this.config.enabled) {
      if (this.config.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  setEventHandlers(events: Partial<SessionLifecycleEvents>): void {
    this.events = { ...this.events, ...events };
  }
}
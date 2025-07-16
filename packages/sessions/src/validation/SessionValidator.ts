import type { 
  SessionData, 
  SessionValidationResult, 
  SessionInvalidReason,
  SessionSecurityOptions 
} from '../types';
import { SessionValidationError } from '../types';

export class SessionValidator {
  constructor(
    private securityOptions: SessionSecurityOptions = {
      enableFingerprinting: true,
      enableEncryption: false,
      enableTamperDetection: true,
      maxSessionsPerUser: 5
    }
  ) {}

  validateSession(session: SessionData, currentFingerprint?: string): SessionValidationResult {
    try {
      // Check if session exists
      if (!session) {
        return {
          isValid: false,
          reason: 'not_found'
        };
      }

      // Check expiration
      const now = new Date();
      if (session.expiresAt <= now) {
        return {
          isValid: false,
          reason: 'expired',
          remainingTime: 0
        };
      }

      // Check session format
      if (!this.isValidSessionFormat(session)) {
        return {
          isValid: false,
          reason: 'invalid_format'
        };
      }

      // Check fingerprint if enabled
      if (this.securityOptions.enableFingerprinting && currentFingerprint) {
        if (!this.validateFingerprint(session, currentFingerprint)) {
          return {
            isValid: false,
            reason: 'fingerprint_mismatch'
          };
        }
      }

      // Check tamper detection if enabled
      if (this.securityOptions.enableTamperDetection) {
        if (!this.validateIntegrity(session)) {
          return {
            isValid: false,
            reason: 'tampered'
          };
        }
      }

      // Check inactivity
      const inactiveTime = now.getTime() - session.lastActivity.getTime();
      const maxInactiveTime = 30 * 60 * 1000; // 30 minutes default
      
      if (inactiveTime > maxInactiveTime) {
        return {
          isValid: false,
          reason: 'inactive'
        };
      }

      // Calculate remaining time
      const remainingTime = session.expiresAt.getTime() - now.getTime();

      return {
        isValid: true,
        remainingTime
      };
    } catch (error) {
      throw new SessionValidationError(
        `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'not_found',
        session?.id
      );
    }
  }

  private isValidSessionFormat(session: SessionData): boolean {
    return !!(
      session.id &&
      typeof session.id === 'string' &&
      session.expiresAt instanceof Date &&
      session.lastActivity instanceof Date &&
      session.createdAt instanceof Date &&
      session.updatedAt instanceof Date &&
      typeof session.isAuthenticated === 'boolean' &&
      typeof session.metadata === 'object'
    );
  }

  private validateFingerprint(session: SessionData, currentFingerprint: string): boolean {
    if (!session.fingerprint) {
      return false;
    }

    return session.fingerprint === currentFingerprint;
  }

  private validateIntegrity(session: SessionData): boolean {
    // Simple integrity check - in a real implementation, you might use HMAC
    // This is a basic check for obvious tampering
    try {
      // Check for negative timestamps
      if (session.createdAt.getTime() < 0 || 
          session.updatedAt.getTime() < 0 || 
          session.expiresAt.getTime() < 0 ||
          session.lastActivity.getTime() < 0) {
        return false;
      }

      // Check logical order of timestamps
      if (session.createdAt > session.updatedAt ||
          session.createdAt > session.expiresAt ||
          session.lastActivity > session.expiresAt) {
        return false;
      }

      // Check for future creation date
      const now = new Date();
      if (session.createdAt > now) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  validateSessionData(data: any): data is SessionData {
    try {
      return this.isValidSessionFormat(data);
    } catch {
      return false;
    }
  }

  shouldRefreshSession(session: SessionData, refreshThreshold: number = 5 * 60 * 1000): boolean {
    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    return timeUntilExpiry <= refreshThreshold;
  }

  calculateRemainingTime(session: SessionData): number {
    const now = new Date();
    return Math.max(0, session.expiresAt.getTime() - now.getTime());
  }

  isSessionExpired(session: SessionData): boolean {
    const now = new Date();
    return session.expiresAt <= now;
  }

  updateSecurityOptions(options: Partial<SessionSecurityOptions>): void {
    this.securityOptions = { ...this.securityOptions, ...options };
  }

  getSecurityOptions(): SessionSecurityOptions {
    return { ...this.securityOptions };
  }
}
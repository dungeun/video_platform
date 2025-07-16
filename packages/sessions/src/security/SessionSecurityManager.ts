import type { SessionData, SessionSecurityOptions } from '../types';
import { SessionSecurityError } from '../types';

export class SessionSecurityManager {
  constructor(private options: SessionSecurityOptions) {}

  generateFingerprint(): string {
    if (typeof window === 'undefined') {
      return 'server-side-session';
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      this.getCanvasFingerprint(),
    ];

    return this.hashString(components.join('|'));
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Session fingerprint', 2, 2);
      
      return canvas.toDataURL();
    } catch {
      return '';
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  validateFingerprint(session: SessionData, currentFingerprint: string): boolean {
    if (!this.options.enableFingerprinting) {
      return true;
    }

    if (!session.fingerprint || !currentFingerprint) {
      return false;
    }

    return session.fingerprint === currentFingerprint;
  }

  encryptSessionData(data: SessionData): string {
    if (!this.options.enableEncryption || !this.options.encryptionKey) {
      return JSON.stringify(data);
    }

    try {
      // Simple XOR encryption for demonstration
      // In production, use proper encryption like AES
      const jsonData = JSON.stringify(data);
      const key = this.options.encryptionKey;
      let encrypted = '';

      for (let i = 0; i < jsonData.length; i++) {
        encrypted += String.fromCharCode(
          jsonData.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }

      return btoa(encrypted);
    } catch (error) {
      throw new SessionSecurityError(
        `Failed to encrypt session data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data.id
      );
    }
  }

  decryptSessionData(encryptedData: string): SessionData {
    if (!this.options.enableEncryption || !this.options.encryptionKey) {
      return JSON.parse(encryptedData);
    }

    try {
      const key = this.options.encryptionKey;
      const encrypted = atob(encryptedData);
      let decrypted = '';

      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }

      const parsed = JSON.parse(decrypted);
      
      // Convert date strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        expiresAt: new Date(parsed.expiresAt),
        lastActivity: new Date(parsed.lastActivity),
      };
    } catch (error) {
      throw new SessionSecurityError(
        `Failed to decrypt session data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  generateSecureSessionId(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments without crypto.getRandomValues
    return this.generateRandomId();
  }

  private generateRandomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  validateSessionIntegrity(session: SessionData): boolean {
    if (!this.options.enableTamperDetection) {
      return true;
    }

    try {
      // Basic integrity checks
      if (!session.id || typeof session.id !== 'string') {
        return false;
      }

      if (!(session.createdAt instanceof Date) || 
          !(session.updatedAt instanceof Date) ||
          !(session.expiresAt instanceof Date) ||
          !(session.lastActivity instanceof Date)) {
        return false;
      }

      // Check timestamp logic
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

  sanitizeSessionData(session: SessionData): SessionData {
    const sanitized = { ...session };

    // Remove potentially dangerous metadata
    if (sanitized.metadata) {
      const safeMeta: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(sanitized.metadata)) {
        // Only allow basic types
        if (typeof value === 'string' || 
            typeof value === 'number' || 
            typeof value === 'boolean' ||
            value === null) {
          safeMeta[key] = value;
        }
      }
      
      sanitized.metadata = safeMeta;
    }

    return sanitized;
  }

  checkSessionLimits(userSessions: SessionData[]): boolean {
    if (!this.options.maxSessionsPerUser) {
      return true;
    }

    const activeSessions = userSessions.filter(session => {
      const now = new Date();
      return session.expiresAt > now;
    });

    return activeSessions.length < this.options.maxSessionsPerUser;
  }

  updateSecurityOptions(options: Partial<SessionSecurityOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getSecurityOptions(): SessionSecurityOptions {
    return { ...this.options };
  }

  generateCSRFToken(): string {
    return this.generateSecureSessionId();
  }

  validateCSRFToken(token: string, expectedToken: string): boolean {
    return token === expectedToken;
  }
}
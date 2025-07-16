import type { BaseEntity, TimestampedEntity } from '@company/types';

// Core Session Types
export interface SessionData extends TimestampedEntity {
  id: string;
  userId?: string;
  isAuthenticated: boolean;
  expiresAt: Date;
  lastActivity: Date;
  metadata: Record<string, any>;
  fingerprint?: string;
}

export interface SessionConfig {
  maxAge: number; // in milliseconds
  slidingExpiration: boolean;
  secureOnly: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path: string;
  storage: SessionStorageType;
  fingerprintEnabled: boolean;
  cleanupInterval: number;
}

export type SessionStorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookie';

export interface SessionValidationResult {
  isValid: boolean;
  reason?: SessionInvalidReason;
  remainingTime?: number;
}

export type SessionInvalidReason = 
  | 'expired'
  | 'inactive'
  | 'tampered'
  | 'fingerprint_mismatch'
  | 'not_found'
  | 'invalid_format';

export interface SessionLifecycleEvents {
  onSessionStart: (session: SessionData) => void;
  onSessionUpdate: (session: SessionData) => void;
  onSessionExpire: (session: SessionData) => void;
  onSessionDestroy: (sessionId: string) => void;
  onSessionValidationFailed: (sessionId: string, reason: SessionInvalidReason) => void;
}

export interface SessionCleanupConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  batchSize: number;
  expiredSessionRetention: number; // how long to keep expired sessions
}

export interface SessionSecurityOptions {
  enableFingerprinting: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  enableTamperDetection: boolean;
  maxSessionsPerUser: number;
}

export interface SessionStorageProvider {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, session: SessionData): Promise<void>;
  remove(sessionId: string): Promise<void>;
  clear(): Promise<void>;
  getExpiredSessions(): Promise<SessionData[]>;
  removeExpiredSessions(): Promise<number>;
  getUserSessions(userId: string): Promise<SessionData[]>;
}

export interface SessionContext {
  currentSession: SessionData | null;
  isLoading: boolean;
  error: Error | null;
  startSession: (userId?: string, metadata?: Record<string, any>) => Promise<SessionData>;
  updateSession: (updates: Partial<SessionData>) => Promise<void>;
  refreshSession: () => Promise<void>;
  endSession: () => Promise<void>;
  validateSession: () => Promise<SessionValidationResult>;
}

// Hook return types
export interface UseSessionReturn extends SessionContext {}

export interface UseSessionManagerReturn {
  sessions: SessionData[];
  activeSessions: SessionData[];
  expiredSessions: SessionData[];
  isLoading: boolean;
  error: Error | null;
  cleanupSessions: () => Promise<number>;
  getUserSessions: (userId: string) => Promise<SessionData[]>;
  terminateSession: (sessionId: string) => Promise<void>;
  terminateUserSessions: (userId: string) => Promise<void>;
}

// Component Props
export interface SessionProviderProps {
  children: React.ReactNode;
  config?: Partial<SessionConfig>;
  onSessionEvent?: Partial<SessionLifecycleEvents>;
}

export interface SessionInfoProps {
  session?: SessionData;
  showDetails?: boolean;
  className?: string;
}

export interface SessionListProps {
  sessions: SessionData[];
  onSessionSelect?: (session: SessionData) => void;
  onSessionTerminate?: (sessionId: string) => void;
  className?: string;
}

// Error Types
export class SessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public sessionId?: string
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionValidationError extends SessionError {
  constructor(
    message: string,
    public reason: SessionInvalidReason,
    sessionId?: string
  ) {
    super(message, 'VALIDATION_ERROR', sessionId);
    this.name = 'SessionValidationError';
  }
}

export class SessionStorageError extends SessionError {
  constructor(message: string, sessionId?: string) {
    super(message, 'STORAGE_ERROR', sessionId);
    this.name = 'SessionStorageError';
  }
}

export class SessionSecurityError extends SessionError {
  constructor(message: string, sessionId?: string) {
    super(message, 'SECURITY_ERROR', sessionId);
    this.name = 'SessionSecurityError';
  }
}
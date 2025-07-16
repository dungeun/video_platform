/**
 * 2FA 관련 타입 정의
 */

export interface TotpConfig {
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
  window: number;
  issuer: string;
  serviceName: string;
}

export interface TotpSecret {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface TotpToken {
  token: string;
  remainingTime: number;
  isValid: boolean;
}

export interface BackupCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface BackupCodeSet {
  id: string;
  codes: BackupCode[];
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface RecoveryMethod {
  id: string;
  type: 'email' | 'phone' | 'backup-codes' | 'recovery-key';
  value: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface RecoveryRequest {
  id: string;
  userId: string;
  method: RecoveryMethod;
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface VerificationResult {
  isValid: boolean;
  method: '2fa' | 'backup-code' | 'recovery';
  remainingAttempts?: number;
  lockoutUntil?: Date;
  error?: string;
}

export interface TwoFactorSession {
  id: string;
  userId: string;
  isEnabled: boolean;
  setupCompleted: boolean;
  verificationMethod: 'totp' | 'backup' | 'recovery' | null;
  lastVerified?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
}

export interface TwoFactorSettings {
  isEnabled: boolean;
  enabledMethods: ('totp' | 'backup-codes' | 'recovery')[];
  requireForLogin: boolean;
  requireForSensitiveActions: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number;
  backupCodeCount: number;
  totpConfig: TotpConfig;
}

export interface TwoFactorSetupData {
  secret: TotpSecret;
  backupCodes: BackupCode[];
  recoveryMethods: RecoveryMethod[];
  qrCodeDataUrl: string;
}

// 에러 타입
export type TwoFactorError = 
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'INVALID_BACKUP_CODE'
  | 'BACKUP_CODE_ALREADY_USED'
  | 'TOO_MANY_ATTEMPTS'
  | 'ACCOUNT_LOCKED'
  | 'SETUP_NOT_COMPLETED'
  | 'INVALID_SECRET'
  | 'RECOVERY_METHOD_NOT_FOUND'
  | 'RECOVERY_CODE_EXPIRED';

// 이벤트 타입
export interface TwoFactorEvent {
  type: 'setup' | 'verification' | 'recovery' | 'disable';
  userId: string;
  method?: string;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 통계 타입
export interface TwoFactorStats {
  totalUsers: number;
  enabledUsers: number;
  setupCompletionRate: number;
  verificationSuccessRate: number;
  mostUsedMethod: string;
  averageSetupTime: number;
}
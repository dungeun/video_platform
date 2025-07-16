/**
 * 2FA 검증 관리자 - 통합 2FA 검증 처리
 */

import { VerificationResult, TwoFactorSession, TwoFactorError } from '../types';
import { TotpGenerator } from '../totp/TotpGenerator';
import { BackupCodeManager } from '../backup/BackupCodeManager';
import { RecoveryManager } from '../recovery/RecoveryManager';

export interface VerificationConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
  allowedMethods: ('totp' | 'backup-codes' | 'recovery')[];
  requireMethodForSensitiveActions: boolean;
}

export interface VerificationStorage {
  saveSession(session: TwoFactorSession): Promise<void>;
  getSession(userId: string): Promise<TwoFactorSession | null>;
  updateSession(session: TwoFactorSession): Promise<void>;
  deleteSession(userId: string): Promise<void>;
}

export class VerificationManager {
  private config: VerificationConfig;
  private storage: VerificationStorage;
  private totpGenerator: TotpGenerator;
  private backupCodeManager: BackupCodeManager;
  private recoveryManager: RecoveryManager;

  constructor(
    config?: Partial<VerificationConfig>,
    storage?: VerificationStorage,
    totpGenerator?: TotpGenerator,
    backupCodeManager?: BackupCodeManager,
    recoveryManager?: RecoveryManager
  ) {
    this.config = {
      maxFailedAttempts: 5,
      lockoutDuration: 30,
      allowedMethods: ['totp', 'backup-codes', 'recovery'],
      requireMethodForSensitiveActions: true,
      ...config
    };

    this.storage = storage || new DefaultVerificationStorage();
    this.totpGenerator = totpGenerator || new TotpGenerator();
    this.backupCodeManager = backupCodeManager || new BackupCodeManager();
    this.recoveryManager = recoveryManager || new RecoveryManager();
  }

  /**
   * TOTP 토큰 검증
   */
  async verifyTotpToken(
    userId: string, 
    secret: string, 
    token: string
  ): Promise<VerificationResult> {
    const session = await this.getOrCreateSession(userId);

    // 계정 잠금 확인
    if (this.isSessionLocked(session)) {
      return {
        isValid: false,
        method: '2fa',
        lockoutUntil: session.lockedUntil,
        error: 'Account temporarily locked due to too many failed attempts'
      };
    }

    // TOTP 토큰 검증
    const isValid = this.totpGenerator.verifyToken(secret, token);

    if (isValid) {
      await this.handleSuccessfulVerification(session, 'totp');
      return {
        isValid: true,
        method: '2fa'
      };
    } else {
      await this.handleFailedVerification(session);
      return {
        isValid: false,
        method: '2fa',
        remainingAttempts: this.getRemainingAttempts(session),
        error: 'Invalid TOTP token'
      };
    }
  }

  /**
   * 백업 코드 검증
   */
  async verifyBackupCode(
    userId: string, 
    backupCode: string
  ): Promise<VerificationResult> {
    const session = await this.getOrCreateSession(userId);

    // 계정 잠금 확인
    if (this.isSessionLocked(session)) {
      return {
        isValid: false,
        method: 'backup-code',
        lockoutUntil: session.lockedUntil,
        error: 'Account temporarily locked due to too many failed attempts'
      };
    }

    // 백업 코드 검증
    const verification = await this.backupCodeManager.verifyAndUseCode(userId, backupCode);

    if (verification.isValid) {
      await this.handleSuccessfulVerification(session, 'backup');
      return {
        isValid: true,
        method: 'backup-code'
      };
    } else {
      await this.handleFailedVerification(session);
      return {
        isValid: false,
        method: 'backup-code',
        remainingAttempts: this.getRemainingAttempts(session),
        error: verification.error || 'Invalid backup code'
      };
    }
  }

  /**
   * 복구 코드 검증
   */
  async verifyRecoveryCode(
    requestId: string, 
    recoveryCode: string
  ): Promise<VerificationResult> {
    const verification = await this.recoveryManager.verifyRecoveryCode(
      requestId, 
      recoveryCode
    );

    if (verification.isValid && verification.request) {
      const session = await this.getOrCreateSession(verification.request.userId);
      await this.handleSuccessfulVerification(session, 'recovery');
      
      return {
        isValid: true,
        method: 'recovery'
      };
    } else {
      return {
        isValid: false,
        method: 'recovery',
        error: verification.error || 'Invalid recovery code'
      };
    }
  }

  /**
   * 통합 검증 (여러 방법 시도)
   */
  async verify(
    userId: string,
    method: 'totp' | 'backup-code' | 'recovery',
    value: string,
    context?: { secret?: string; requestId?: string }
  ): Promise<VerificationResult> {
    switch (method) {
      case 'totp':
        if (!context?.secret) {
          throw new Error('TOTP secret is required for TOTP verification');
        }
        return await this.verifyTotpToken(userId, context.secret, value);

      case 'backup-code':
        return await this.verifyBackupCode(userId, value);

      case 'recovery':
        if (!context?.requestId) {
          throw new Error('Request ID is required for recovery verification');
        }
        return await this.verifyRecoveryCode(context.requestId, value);

      default:
        throw new Error(`Unsupported verification method: ${method}`);
    }
  }

  /**
   * 2FA 세션 상태 조회
   */
  async getVerificationStatus(userId: string): Promise<{
    isEnabled: boolean;
    isVerified: boolean;
    isLocked: boolean;
    failedAttempts: number;
    lockoutUntil?: Date;
    lastVerified?: Date;
  }> {
    const session = await this.storage.getSession(userId);

    if (!session) {
      return {
        isEnabled: false,
        isVerified: false,
        isLocked: false,
        failedAttempts: 0
      };
    }

    return {
      isEnabled: session.isEnabled,
      isVerified: !!session.lastVerified,
      isLocked: this.isSessionLocked(session),
      failedAttempts: session.failedAttempts,
      lockoutUntil: session.lockedUntil,
      lastVerified: session.lastVerified
    };
  }

  /**
   * 2FA 세션 초기화
   */
  async resetVerificationSession(userId: string): Promise<void> {
    const session = await this.getOrCreateSession(userId);
    
    session.failedAttempts = 0;
    session.lockedUntil = undefined;
    session.lastVerified = undefined;
    session.verificationMethod = null;

    await this.storage.updateSession(session);
  }

  /**
   * 계정 잠금 해제
   */
  async unlockAccount(userId: string): Promise<void> {
    const session = await this.storage.getSession(userId);
    
    if (session) {
      session.failedAttempts = 0;
      session.lockedUntil = undefined;
      await this.storage.updateSession(session);
    }
  }

  /**
   * 세션 조회 또는 생성
   */
  private async getOrCreateSession(userId: string): Promise<TwoFactorSession> {
    let session = await this.storage.getSession(userId);
    
    if (!session) {
      session = {
        id: this.generateId(),
        userId,
        isEnabled: false,
        setupCompleted: false,
        verificationMethod: null,
        failedAttempts: 0
      };
      await this.storage.saveSession(session);
    }

    return session;
  }

  /**
   * 성공적인 검증 처리
   */
  private async handleSuccessfulVerification(
    session: TwoFactorSession,
    method: 'totp' | 'backup' | 'recovery'
  ): Promise<void> {
    session.failedAttempts = 0;
    session.lockedUntil = undefined;
    session.lastVerified = new Date();
    session.verificationMethod = method;

    await this.storage.updateSession(session);
  }

  /**
   * 실패한 검증 처리
   */
  private async handleFailedVerification(session: TwoFactorSession): Promise<void> {
    session.failedAttempts += 1;

    // 최대 시도 횟수 초과 시 계정 잠금
    if (session.failedAttempts >= this.config.maxFailedAttempts) {
      session.lockedUntil = new Date(
        Date.now() + this.config.lockoutDuration * 60 * 1000
      );
    }

    await this.storage.updateSession(session);
  }

  /**
   * 세션 잠금 상태 확인
   */
  private isSessionLocked(session: TwoFactorSession): boolean {
    return session.lockedUntil ? session.lockedUntil > new Date() : false;
  }

  /**
   * 남은 시도 횟수 계산
   */
  private getRemainingAttempts(session: TwoFactorSession): number {
    return Math.max(0, this.config.maxFailedAttempts - session.failedAttempts);
  }

  /**
   * 안전한 ID 생성
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<VerificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): VerificationConfig {
    return { ...this.config };
  }
}

/**
 * 기본 검증 저장소 구현
 */
class DefaultVerificationStorage implements VerificationStorage {
  private sessions = new Map<string, TwoFactorSession>();

  async saveSession(session: TwoFactorSession): Promise<void> {
    this.sessions.set(session.userId, session);
  }

  async getSession(userId: string): Promise<TwoFactorSession | null> {
    return this.sessions.get(userId) || null;
  }

  async updateSession(session: TwoFactorSession): Promise<void> {
    this.sessions.set(session.userId, session);
  }

  async deleteSession(userId: string): Promise<void> {
    this.sessions.delete(userId);
  }
}
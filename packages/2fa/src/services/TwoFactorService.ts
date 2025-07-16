/**
 * 2FA 통합 서비스 - 모든 2FA 기능을 통합 관리
 */

import { 
  TwoFactorSession, 
  TwoFactorSetupData, 
  VerificationResult,
  BackupCode,
  RecoveryRequest 
} from '../types';
import { TotpGenerator } from '../totp/TotpGenerator';
import { QrCodeGenerator } from '../totp/QrCodeGenerator';
import { BackupCodeGenerator, BackupCodeManager } from '../backup';
import { RecoveryManager } from '../recovery/RecoveryManager';
import { VerificationManager } from '../verification/VerificationManager';

export interface TwoFactorServiceConfig {
  storagePrefix?: string;
  defaultTotpConfig?: any;
  defaultBackupConfig?: any;
  defaultRecoveryConfig?: any;
  defaultVerificationConfig?: any;
}

export class TwoFactorService {
  private totpGenerator: TotpGenerator;
  private qrCodeGenerator: QrCodeGenerator;
  private backupCodeGenerator: BackupCodeGenerator;
  private backupCodeManager: BackupCodeManager;
  private recoveryManager: RecoveryManager;
  private verificationManager: VerificationManager;
  private config: TwoFactorServiceConfig;

  constructor(config?: TwoFactorServiceConfig) {
    this.config = {
      storagePrefix: '2fa_',
      ...config
    };

    // 각 모듈 초기화
    this.totpGenerator = new TotpGenerator(config?.defaultTotpConfig);
    this.qrCodeGenerator = new QrCodeGenerator();
    this.backupCodeGenerator = new BackupCodeGenerator(config?.defaultBackupConfig);
    this.backupCodeManager = new BackupCodeManager();
    this.recoveryManager = new RecoveryManager(config?.defaultRecoveryConfig);
    this.verificationManager = new VerificationManager(config?.defaultVerificationConfig);
  }

  /**
   * 2FA 설정 시작 - 시크릿 생성 및 QR 코드 준비
   */
  async initializeSetup(userId: string): Promise<{
    secret: string;
    qrCodeDataUrl: string;
    manualEntryKey: string;
  }> {
    // TOTP 시크릿 생성
    const totpSecret = this.totpGenerator.generateSecret(userId);
    
    // QR 코드 생성
    const qrCodeDataUrl = await this.qrCodeGenerator.generateDataUrl(totpSecret.qrCodeUrl);

    return {
      secret: totpSecret.secret,
      qrCodeDataUrl,
      manualEntryKey: totpSecret.manualEntryKey
    };
  }

  /**
   * 2FA 설정 완료
   */
  async setup(userId: string, setupData: TwoFactorSetupData): Promise<boolean> {
    try {
      // 1. TOTP 시크릿 저장
      await this.saveUserSecret(userId, setupData.secret.secret);

      // 2. 백업 코드 저장
      const backupCodeSet = this.backupCodeGenerator.generateCodeSet(userId);
      await this.backupCodeManager.saveCodeSet(userId, backupCodeSet);

      // 3. 복구 방법 저장 (있는 경우)
      for (const recoveryMethod of setupData.recoveryMethods) {
        await this.recoveryManager.addRecoveryMethod(
          userId, 
          recoveryMethod.type as any, 
          recoveryMethod.value,
          recoveryMethod.isPrimary
        );
      }

      // 4. 2FA 세션 활성화
      const session = await this.getOrCreateSession(userId);
      session.isEnabled = true;
      session.setupCompleted = true;
      await this.saveSession(session);

      return true;
    } catch (error) {
      console.error('2FA setup failed:', error);
      return false;
    }
  }

  /**
   * 2FA 비활성화
   */
  async disable(userId: string): Promise<boolean> {
    try {
      // 1. 세션 비활성화
      const session = await this.getSession(userId);
      if (session) {
        session.isEnabled = false;
        session.setupCompleted = false;
        await this.saveSession(session);
      }

      // 2. 저장된 데이터 삭제
      await this.deleteUserSecret(userId);
      await this.backupCodeManager.deleteCodeSet(userId);

      return true;
    } catch (error) {
      console.error('2FA disable failed:', error);
      return false;
    }
  }

  /**
   * TOTP 토큰 검증
   */
  async verifyTotp(userId: string, token: string): Promise<VerificationResult> {
    const secret = await this.getUserSecret(userId);
    if (!secret) {
      return {
        isValid: false,
        method: '2fa',
        error: '2FA가 설정되지 않았습니다'
      };
    }

    return await this.verificationManager.verifyTotpToken(userId, secret, token);
  }

  /**
   * 백업 코드 검증
   */
  async verifyBackupCode(userId: string, code: string): Promise<VerificationResult> {
    return await this.verificationManager.verifyBackupCode(userId, code);
  }

  /**
   * 복구 시작
   */
  async initiateRecovery(userId: string, method: 'email' | 'phone'): Promise<string> {
    const request = await this.recoveryManager.initiateRecovery(userId, method);
    return request.id;
  }

  /**
   * 복구 검증
   */
  async verifyRecovery(requestId: string, code: string): Promise<VerificationResult> {
    return await this.verificationManager.verifyRecoveryCode(requestId, code);
  }

  /**
   * 백업 코드 재생성
   */
  async regenerateBackupCodes(userId: string): Promise<BackupCode[]> {
    const newCodeSet = this.backupCodeGenerator.generateCodeSet(userId);
    await this.backupCodeManager.saveCodeSet(userId, newCodeSet);
    return newCodeSet.codes;
  }

  /**
   * 2FA 세션 정보 조회
   */
  async getSession(userId: string): Promise<TwoFactorSession | null> {
    return await this.loadSession(userId);
  }

  /**
   * 검증 상태 조회
   */
  async getVerificationStatus(userId: string) {
    return await this.verificationManager.getVerificationStatus(userId);
  }

  /**
   * 세션 리셋
   */
  async resetSession(userId: string): Promise<void> {
    await this.verificationManager.resetVerificationSession(userId);
  }

  /**
   * 백업 코드 통계 조회
   */
  async getBackupCodeStats(userId: string) {
    return await this.backupCodeManager.getCodeStats(userId);
  }

  /**
   * 복구 방법 목록 조회
   */
  async getRecoveryMethods(userId: string) {
    return await this.recoveryManager.getRecoveryMethods(userId);
  }

  /**
   * 복구 방법 추가
   */
  async addRecoveryMethod(
    userId: string, 
    type: 'email' | 'phone', 
    value: string,
    isPrimary: boolean = false
  ) {
    return await this.recoveryManager.addRecoveryMethod(userId, type, value, isPrimary);
  }

  // Private 헬퍼 메서드들

  private async getOrCreateSession(userId: string): Promise<TwoFactorSession> {
    let session = await this.loadSession(userId);
    
    if (!session) {
      session = {
        id: this.generateId(),
        userId,
        isEnabled: false,
        setupCompleted: false,
        verificationMethod: null,
        failedAttempts: 0
      };
    }
    
    return session;
  }

  private async saveSession(session: TwoFactorSession): Promise<void> {
    const key = `${this.config.storagePrefix}session_${session.userId}`;
    localStorage.setItem(key, JSON.stringify(session));
  }

  private async loadSession(userId: string): Promise<TwoFactorSession | null> {
    const key = `${this.config.storagePrefix}session_${userId}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      const session = JSON.parse(data);
      // 날짜 객체 복원
      if (session.lastVerified) {
        session.lastVerified = new Date(session.lastVerified);
      }
      if (session.lockedUntil) {
        session.lockedUntil = new Date(session.lockedUntil);
      }
      return session;
    } catch {
      return null;
    }
  }

  private async saveUserSecret(userId: string, secret: string): Promise<void> {
    const key = `${this.config.storagePrefix}secret_${userId}`;
    // 실제 구현에서는 암호화하여 저장해야 함
    localStorage.setItem(key, secret);
  }

  private async getUserSecret(userId: string): Promise<string | null> {
    const key = `${this.config.storagePrefix}secret_${userId}`;
    return localStorage.getItem(key);
  }

  private async deleteUserSecret(userId: string): Promise<void> {
    const key = `${this.config.storagePrefix}secret_${userId}`;
    localStorage.removeItem(key);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}
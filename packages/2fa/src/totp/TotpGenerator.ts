/**
 * TOTP 생성기 - Time-based One-Time Password 생성
 */

import { authenticator } from 'otplib';
import { TotpConfig, TotpSecret, TotpToken } from '../types';

export class TotpGenerator {
  private config: TotpConfig;

  constructor(config?: Partial<TotpConfig>) {
    this.config = {
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      window: 1,
      issuer: 'Your App',
      serviceName: 'Your Service',
      ...config
    };

    // otplib 설정 적용 (소문자로 변환)
    authenticator.options = {
      algorithm: this.config.algorithm.toLowerCase() as any,
      digits: this.config.digits,
      period: this.config.period,
      window: this.config.window
    };
  }

  /**
   * 새로운 TOTP 시크릿 생성
   */
  generateSecret(accountName: string): TotpSecret {
    const secret = authenticator.generateSecret();
    const serviceName = `${this.config.issuer}:${accountName}`;
    
    const keyUri = authenticator.keyuri(
      accountName,
      this.config.issuer,
      secret
    );

    return {
      secret,
      qrCodeUrl: keyUri,
      manualEntryKey: this.formatSecretForManualEntry(secret),
      backupCodes: [] // 백업 코드는 별도 모듈에서 생성
    };
  }

  /**
   * 현재 TOTP 토큰 생성
   */
  generateToken(secret: string): TotpToken {
    const token = authenticator.generate(secret);
    const remainingTime = this.getRemainingTime();
    
    return {
      token,
      remainingTime,
      isValid: true
    };
  }

  /**
   * TOTP 토큰 검증
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({
        token,
        secret
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 시크릿 유효성 검증
   */
  isValidSecret(secret: string): boolean {
    try {
      // 테스트 토큰 생성으로 시크릿 유효성 확인
      authenticator.generate(secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 다음 토큰까지 남은 시간 (초)
   */
  getRemainingTime(): number {
    const period = this.config.period;
    const currentTime = Math.floor(Date.now() / 1000);
    return period - (currentTime % period);
  }

  /**
   * 토큰 만료 시간
   */
  getTokenExpiration(): Date {
    const remainingTime = this.getRemainingTime();
    return new Date(Date.now() + remainingTime * 1000);
  }

  /**
   * 수동 입력용 시크릿 포맷팅
   */
  private formatSecretForManualEntry(secret: string): string {
    // 4자리씩 공백으로 구분
    return secret.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * TOTP URI 생성
   */
  generateUri(accountName: string, secret: string): string {
    return authenticator.keyuri(
      accountName,
      this.config.issuer,
      secret
    );
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<TotpConfig>): void {
    this.config = { ...this.config, ...config };
    
    authenticator.options = {
      algorithm: this.config.algorithm.toLowerCase() as any,
      digits: this.config.digits,
      period: this.config.period,
      window: this.config.window
    };
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): TotpConfig {
    return { ...this.config };
  }
}
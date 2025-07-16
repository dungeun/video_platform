import * as crypto from 'crypto';
import { Result } from '@repo/core';

export interface TotpConfig {
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
  issuer: string;
  label: string;
}

export interface TotpSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  config: TotpConfig;
}

export interface TotpVerification {
  token: string;
  isValid: boolean;
  timeRemaining: number;
}

export class TotpManager {
  private readonly defaultConfig: TotpConfig = {
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    issuer: 'Company',
    label: 'user@company.com'
  };

  generateSecret(userEmail: string, config?: Partial<TotpConfig>): Result<TotpSecret> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config, label: userEmail };
      const secret = this.generateBase32Secret();
      const qrCode = this.generateQrCodeUrl(secret, finalConfig);
      const backupCodes = this.generateBackupCodes();

      return Result.success({
        secret,
        qrCode,
        backupCodes,
        config: finalConfig
      });
    } catch (error) {
      return Result.failure('TOTP_GENERATION_FAILED', 'Failed to generate TOTP secret');
    }
  }

  verifyToken(secret: string, token: string, config?: Partial<TotpConfig>): Result<TotpVerification> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const currentTime = Math.floor(Date.now() / 1000);
      const timeStep = Math.floor(currentTime / finalConfig.period);
      
      // Check current window and ±1 window for clock skew tolerance
      for (let window = -1; window <= 1; window++) {
        const expectedToken = this.generateTotpToken(secret, timeStep + window, finalConfig);
        if (expectedToken === token) {
          const timeRemaining = finalConfig.period - (currentTime % finalConfig.period);
          return Result.success({
            token,
            isValid: true,
            timeRemaining
          });
        }
      }

      return Result.success({
        token,
        isValid: false,
        timeRemaining: 0
      });
    } catch (error) {
      return Result.failure('TOTP_VERIFICATION_FAILED', 'Failed to verify TOTP token');
    }
  }

  verifyBackupCode(backupCodes: string[], providedCode: string): Result<{ isValid: boolean; remainingCodes: string[] }> {
    try {
      const codeIndex = backupCodes.indexOf(providedCode);
      if (codeIndex === -1) {
        return Result.success({ isValid: false, remainingCodes: backupCodes });
      }

      const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);
      return Result.success({ isValid: true, remainingCodes });
    } catch (error) {
      return Result.failure('BACKUP_CODE_VERIFICATION_FAILED', 'Failed to verify backup code');
    }
  }

  generateNewBackupCodes(): Result<string[]> {
    try {
      return Result.success(this.generateBackupCodes());
    } catch (error) {
      return Result.failure('BACKUP_CODE_GENERATION_FAILED', 'Failed to generate backup codes');
    }
  }

  private generateBase32Secret(): string {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  private generateTotpToken(secret: string, timeStep: number, config: TotpConfig): string {
    const key = this.base32Decode(secret);
    const time = Buffer.alloc(8);
    time.writeUInt32BE(0, 0);
    time.writeUInt32BE(timeStep, 4);

    const hmac = crypto.createHmac(config.algorithm.toLowerCase(), key);
    hmac.update(time);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code = (hash.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, config.digits);
    
    return code.toString().padStart(config.digits, '0');
  }

  private generateQrCodeUrl(secret: string, config: TotpConfig): string {
    const params = new URLSearchParams({
      secret,
      issuer: config.issuer,
      algorithm: config.algorithm,
      digits: config.digits.toString(),
      period: config.period.toString()
    });

    return `otpauth://totp/${encodeURIComponent(config.issuer)}:${encodeURIComponent(config.label)}?${params.toString()}`;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(5).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }

  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const result: number[] = [];

    for (let i = 0; i < encoded.length; i++) {
      const index = alphabet.indexOf(encoded[i].toUpperCase());
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        result.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(result);
  }
}

export const totpManager = new TotpManager();
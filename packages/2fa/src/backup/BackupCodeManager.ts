/**
 * 백업 코드 관리자 - 백업 코드의 저장, 조회, 관리
 */

import { BackupCode, BackupCodeSet } from '../types';
// import { StorageManager } from '@repo/storage';

// Simplified storage interface for this module
interface SimpleStorage {
  set(key: string, value: any): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
}

class LocalStorageManager implements SimpleStorage {
  async set(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

export interface BackupCodeStorage {
  save(userId: string, codeSet: BackupCodeSet): Promise<void>;
  load(userId: string): Promise<BackupCodeSet | null>;
  delete(userId: string): Promise<void>;
  update(userId: string, codeSet: BackupCodeSet): Promise<void>;
}

export class BackupCodeManager {
  private storage: BackupCodeStorage;

  constructor(storage?: BackupCodeStorage) {
    this.storage = storage || new DefaultBackupCodeStorage();
  }

  /**
   * 백업 코드 세트 저장
   */
  async saveCodeSet(userId: string, codeSet: BackupCodeSet): Promise<void> {
    await this.storage.save(userId, codeSet);
  }

  /**
   * 백업 코드 세트 조회
   */
  async getCodeSet(userId: string): Promise<BackupCodeSet | null> {
    return await this.storage.load(userId);
  }

  /**
   * 백업 코드 검증 및 사용 처리
   */
  async verifyAndUseCode(userId: string, inputCode: string): Promise<{
    isValid: boolean;
    remainingCodes: number;
    error?: string;
  }> {
    const codeSet = await this.getCodeSet(userId);
    
    if (!codeSet) {
      return {
        isValid: false,
        remainingCodes: 0,
        error: 'No backup codes found'
      };
    }

    // 코드 검증
    const verification = this.verifyCode(codeSet, inputCode);
    
    if (!verification.isValid) {
      return {
        isValid: false,
        remainingCodes: this.getAvailableCodeCount(codeSet),
        error: verification.error || 'Verification failed'
      };
    }

    // 코드 사용 처리
    if (verification.code) {
      verification.code.isUsed = true;
      verification.code.usedAt = new Date();
      
      // 업데이트된 코드 세트 저장
      await this.storage.update(userId, codeSet);
    }

    return {
      isValid: true,
      remainingCodes: this.getAvailableCodeCount(codeSet)
    };
  }

  /**
   * 백업 코드 검증 (사용하지 않음)
   */
  private verifyCode(codeSet: BackupCodeSet, inputCode: string): {
    isValid: boolean;
    code?: BackupCode;
    error?: string;
  } {
    // 코드 세트가 만료되었는지 확인
    if (codeSet.expiresAt && codeSet.expiresAt < new Date()) {
      return {
        isValid: false,
        error: 'Backup codes have expired'
      };
    }

    // 코드 세트가 비활성화되었는지 확인
    if (!codeSet.isActive) {
      return {
        isValid: false,
        error: 'Backup code set is inactive'
      };
    }

    // 정규화된 입력 코드
    const normalizedInput = inputCode.replace(/[\s-]/g, '').toUpperCase();

    // 일치하는 코드 찾기
    for (const code of codeSet.codes) {
      const normalizedCode = code.code.replace(/[\s-]/g, '').toUpperCase();
      
      if (normalizedCode === normalizedInput) {
        if (code.isUsed) {
          return {
            isValid: false,
            error: 'Backup code has already been used'
          };
        }

        return {
          isValid: true,
          code
        };
      }
    }

    return {
      isValid: false,
      error: 'Invalid backup code'
    };
  }

  /**
   * 사용 가능한 백업 코드 수 조회
   */
  private getAvailableCodeCount(codeSet: BackupCodeSet): number {
    return codeSet.codes.filter(code => !code.isUsed).length;
  }

  /**
   * 백업 코드 세트 갱신 필요 여부 확인
   */
  async needsRenewal(userId: string, threshold: number = 3): Promise<boolean> {
    const codeSet = await this.getCodeSet(userId);
    
    if (!codeSet) return true;

    const availableCount = this.getAvailableCodeCount(codeSet);
    
    return availableCount <= threshold || 
           (codeSet.expiresAt && codeSet.expiresAt < new Date());
  }

  /**
   * 백업 코드 세트 삭제
   */
  async deleteCodeSet(userId: string): Promise<void> {
    await this.storage.delete(userId);
  }

  /**
   * 백업 코드 세트 비활성화
   */
  async deactivateCodeSet(userId: string): Promise<void> {
    const codeSet = await this.getCodeSet(userId);
    
    if (codeSet) {
      codeSet.isActive = false;
      await this.storage.update(userId, codeSet);
    }
  }

  /**
   * 사용된 백업 코드 목록 조회
   */
  async getUsedCodes(userId: string): Promise<BackupCode[]> {
    const codeSet = await this.getCodeSet(userId);
    
    if (!codeSet) return [];

    return codeSet.codes.filter(code => code.isUsed);
  }

  /**
   * 백업 코드 통계 조회
   */
  async getCodeStats(userId: string): Promise<{
    total: number;
    used: number;
    available: number;
    isExpired: boolean;
    expiresAt?: Date;
  }> {
    const codeSet = await this.getCodeSet(userId);
    
    if (!codeSet) {
      return {
        total: 0,
        used: 0,
        available: 0,
        isExpired: false
      };
    }

    const total = codeSet.codes.length;
    const used = codeSet.codes.filter(code => code.isUsed).length;
    const available = total - used;
    const isExpired = codeSet.expiresAt ? codeSet.expiresAt < new Date() : false;

    return {
      total,
      used,
      available,
      isExpired,
      ...(codeSet.expiresAt && { expiresAt: codeSet.expiresAt })
    };
  }
}

/**
 * 기본 백업 코드 저장소 (LocalStorage 사용)
 */
class DefaultBackupCodeStorage implements BackupCodeStorage {
  private storageManager = new LocalStorageManager();
  private keyPrefix = '2fa_backup_codes_';

  async save(userId: string, codeSet: BackupCodeSet): Promise<void> {
    const key = this.getKey(userId);
    await this.storageManager.set(key, codeSet);
  }

  async load(userId: string): Promise<BackupCodeSet | null> {
    const key = this.getKey(userId);
    return await this.storageManager.get<BackupCodeSet>(key);
  }

  async delete(userId: string): Promise<void> {
    const key = this.getKey(userId);
    await this.storageManager.remove(key);
  }

  async update(userId: string, codeSet: BackupCodeSet): Promise<void> {
    await this.save(userId, codeSet);
  }

  private getKey(userId: string): string {
    return `${this.keyPrefix}${userId}`;
  }
}
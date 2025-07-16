/**
 * 백업 코드 생성기 - 2FA 백업 코드 생성 및 관리
 */

import { BackupCode, BackupCodeSet } from '../types';
// import { generateSecureRandom } from '@company/utils/crypto';

export interface BackupCodeConfig {
  count: number;
  length: number;
  pattern: 'alphanumeric' | 'numeric' | 'hex';
  groupSize: number;
  expirationDays?: number;
}

export class BackupCodeGenerator {
  private config: BackupCodeConfig;

  constructor(config?: Partial<BackupCodeConfig>) {
    this.config = {
      count: 10,
      length: 8,
      pattern: 'alphanumeric',
      groupSize: 4,
      expirationDays: 365,
      ...config
    };
  }

  /**
   * 새로운 백업 코드 세트 생성
   */
  generateCodeSet(_userId: string): BackupCodeSet {
    const codes = this.generateCodes();
    const expiresAt = this.config.expirationDays 
      ? new Date(Date.now() + this.config.expirationDays * 24 * 60 * 60 * 1000)
      : undefined;

    return {
      id: this.generateId(),
      codes,
      createdAt: new Date(),
      expiresAt: expiresAt,
      isActive: true
    };
  }

  /**
   * 백업 코드들 생성
   */
  private generateCodes(): BackupCode[] {
    const codes: BackupCode[] = [];
    
    for (let i = 0; i < this.config.count; i++) {
      codes.push({
        id: this.generateId(),
        code: this.generateSingleCode(),
        isUsed: false,
        createdAt: new Date()
      });
    }

    return codes;
  }

  /**
   * 단일 백업 코드 생성
   */
  private generateSingleCode(): string {
    let charset: string;
    
    switch (this.config.pattern) {
      case 'numeric':
        charset = '0123456789';
        break;
      case 'hex':
        charset = '0123456789ABCDEF';
        break;
      case 'alphanumeric':
      default:
        charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        break;
    }

    let code = '';
    for (let i = 0; i < this.config.length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      code += charset[randomIndex];
    }

    return this.formatCode(code);
  }

  /**
   * 코드 포맷팅 (그룹 단위로 분리)
   */
  private formatCode(code: string): string {
    const { groupSize } = this.config;
    if (groupSize <= 0) return code;

    const groups = [];
    for (let i = 0; i < code.length; i += groupSize) {
      groups.push(code.slice(i, i + groupSize));
    }
    
    return groups.join('-');
  }

  /**
   * 백업 코드 검증
   */
  verifyCode(codeSet: BackupCodeSet, inputCode: string): {
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

    // 정규화된 입력 코드 (공백, 하이픈 제거 후 대문자)
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
   * 백업 코드 사용 처리
   */
  useCode(code: BackupCode): BackupCode {
    return {
      ...code,
      isUsed: true,
      usedAt: new Date()
    };
  }

  /**
   * 사용 가능한 백업 코드 수 조회
   */
  getAvailableCodeCount(codeSet: BackupCodeSet): number {
    return codeSet.codes.filter(code => !code.isUsed).length;
  }

  /**
   * 백업 코드 세트 만료 처리
   */
  expireCodeSet(codeSet: BackupCodeSet): BackupCodeSet {
    return {
      ...codeSet,
      isActive: false
    };
  }

  /**
   * 새로운 백업 코드 세트 필요 여부 확인
   */
  needsNewCodeSet(codeSet: BackupCodeSet, threshold: number = 3): boolean {
    const availableCount = this.getAvailableCodeCount(codeSet);
    
    // 임계값 이하이거나 만료된 경우
    return availableCount <= threshold || 
           (codeSet.expiresAt && codeSet.expiresAt < new Date());
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
  updateConfig(config: Partial<BackupCodeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): BackupCodeConfig {
    return { ...this.config };
  }

  /**
   * 백업 코드를 안전한 형태로 표시 (일부 문자 마스킹)
   */
  maskCode(code: string): string {
    const parts = code.split('-');
    return parts.map(part => {
      if (part.length <= 2) return part;
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    }).join('-');
  }
}
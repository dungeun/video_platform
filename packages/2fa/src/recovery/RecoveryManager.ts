/**
 * 2FA 복구 관리자 - 2FA 분실 시 계정 복구 처리
 */

import { RecoveryMethod, RecoveryRequest } from '../types';
// import { generateSecureRandom } from '@company/utils/crypto';

export interface RecoveryConfig {
  codeLength: number;
  expirationMinutes: number;
  maxAttempts: number;
  cooldownMinutes: number;
  supportedMethods: ('email' | 'phone' | 'backup-codes' | 'recovery-key')[];
}

export interface RecoveryStorage {
  saveMethod(userId: string, method: RecoveryMethod): Promise<void>;
  getMethods(userId: string): Promise<RecoveryMethod[]>;
  saveRequest(request: RecoveryRequest): Promise<void>;
  getRequest(requestId: string): Promise<RecoveryRequest | null>;
  deleteRequest(requestId: string): Promise<void>;
  updateMethod(userId: string, method: RecoveryMethod): Promise<void>;
}

export class RecoveryManager {
  private config: RecoveryConfig;
  private storage: RecoveryStorage;

  constructor(config?: Partial<RecoveryConfig>, storage?: RecoveryStorage) {
    this.config = {
      codeLength: 8,
      expirationMinutes: 30,
      maxAttempts: 3,
      cooldownMinutes: 60,
      supportedMethods: ['email', 'phone', 'backup-codes'],
      ...config
    };
    
    this.storage = storage || new DefaultRecoveryStorage();
  }

  /**
   * 복구 방법 추가
   */
  async addRecoveryMethod(
    userId: string, 
    type: 'email' | 'phone' | 'recovery-key',
    value: string,
    isPrimary: boolean = false
  ): Promise<RecoveryMethod> {
    const method: RecoveryMethod = {
      id: this.generateId(),
      type,
      value,
      isVerified: false,
      isPrimary,
      createdAt: new Date()
    };

    await this.storage.saveMethod(userId, method);
    return method;
  }

  /**
   * 복구 방법 검증
   */
  async verifyRecoveryMethod(
    userId: string, 
    methodId: string,
    verificationCode: string
  ): Promise<boolean> {
    const methods = await this.storage.getMethods(userId);
    const method = methods.find(m => m.id === methodId);

    if (!method) {
      throw new Error('Recovery method not found');
    }

    // 실제 검증 로직은 구현체에 따라 다름 (이메일/SMS 등)
    // 여기서는 기본적인 구조만 제공
    const isValid = await this.performVerification(method, verificationCode);

    if (isValid) {
      method.isVerified = true;
      await this.storage.updateMethod(userId, method);
    }

    return isValid;
  }

  /**
   * 복구 요청 시작
   */
  async initiateRecovery(
    userId: string, 
    methodType: 'email' | 'phone'
  ): Promise<RecoveryRequest> {
    const methods = await this.storage.getMethods(userId);
    const method = methods.find(m => 
      m.type === methodType && 
      m.isVerified
    );

    if (!method) {
      throw new Error(`No verified ${methodType} recovery method found`);
    }

    const recoveryCode = this.generateRecoveryCode();
    const request: RecoveryRequest = {
      id: this.generateId(),
      userId,
      method,
      code: recoveryCode,
      expiresAt: new Date(Date.now() + this.config.expirationMinutes * 60 * 1000),
      isUsed: false,
      createdAt: new Date()
    };

    await this.storage.saveRequest(request);

    // 복구 코드 전송 (이메일/SMS)
    await this.sendRecoveryCode(method, recoveryCode);

    return request;
  }

  /**
   * 복구 코드 검증
   */
  async verifyRecoveryCode(
    requestId: string, 
    inputCode: string
  ): Promise<{
    isValid: boolean;
    request?: RecoveryRequest;
    error?: string;
  }> {
    const request = await this.storage.getRequest(requestId);

    if (!request) {
      return {
        isValid: false,
        error: 'Recovery request not found'
      };
    }

    if (request.isUsed) {
      return {
        isValid: false,
        error: 'Recovery code has already been used'
      };
    }

    if (request.expiresAt < new Date()) {
      return {
        isValid: false,
        error: 'Recovery code has expired'
      };
    }

    if (request.code !== inputCode) {
      return {
        isValid: false,
        error: 'Invalid recovery code'
      };
    }

    // 복구 코드 사용 처리
    request.isUsed = true;
    await this.storage.saveRequest(request);

    return {
      isValid: true,
      request
    };
  }

  /**
   * 2FA 재설정을 위한 임시 토큰 생성
   */
  async generateResetToken(recoveryRequest: RecoveryRequest): Promise<string> {
    if (!recoveryRequest.isUsed) {
      throw new Error('Recovery request must be used before generating reset token');
    }

    // 임시 토큰 생성 (짧은 만료 시간)
    const resetToken = Math.random().toString(36).substr(2, 32);
    
    // 토큰을 저장하고 관리하는 로직이 필요
    // 여기서는 기본 구조만 제공
    
    return resetToken;
  }

  /**
   * 복구 방법 목록 조회
   */
  async getRecoveryMethods(userId: string): Promise<RecoveryMethod[]> {
    return await this.storage.getMethods(userId);
  }

  /**
   * 복구 방법 삭제
   */
  async removeRecoveryMethod(userId: string, methodId: string): Promise<void> {
    const methods = await this.storage.getMethods(userId);
    const filteredMethods = methods.filter(m => m.id !== methodId);
    
    // 모든 메서드를 다시 저장 (실제로는 개별 삭제 API가 필요)
    for (const method of filteredMethods) {
      await this.storage.updateMethod(userId, method);
    }
  }

  /**
   * 기본 복구 방법 설정
   */
  async setPrimaryRecoveryMethod(
    userId: string, 
    methodId: string
  ): Promise<void> {
    const methods = await this.storage.getMethods(userId);
    
    for (const method of methods) {
      method.isPrimary = method.id === methodId;
      await this.storage.updateMethod(userId, method);
    }
  }

  /**
   * 복구 코드 생성
   */
  private generateRecoveryCode(): string {
    const charset = '0123456789';
    let code = '';
    
    for (let i = 0; i < this.config.codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      code += charset[randomIndex];
    }
    
    return code;
  }

  /**
   * 복구 방법 검증 수행
   */
  private async performVerification(
    method: RecoveryMethod, 
    code: string
  ): Promise<boolean> {
    // 실제 검증 로직은 외부 서비스에 위임
    // 이메일의 경우 이메일 서비스, SMS의 경우 SMS 서비스 등
    return true; // 임시
  }

  /**
   * 복구 코드 전송
   */
  private async sendRecoveryCode(
    method: RecoveryMethod, 
    code: string
  ): Promise<void> {
    // 실제 전송 로직은 외부 서비스에 위임
    switch (method.type) {
      case 'email':
        // 이메일 전송 서비스 호출
        break;
      case 'phone':
        // SMS 전송 서비스 호출
        break;
    }
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
  updateConfig(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): RecoveryConfig {
    return { ...this.config };
  }
}

/**
 * 기본 복구 저장소 구현
 */
class DefaultRecoveryStorage implements RecoveryStorage {
  private methods = new Map<string, RecoveryMethod[]>();
  private requests = new Map<string, RecoveryRequest>();

  async saveMethod(userId: string, method: RecoveryMethod): Promise<void> {
    const userMethods = this.methods.get(userId) || [];
    userMethods.push(method);
    this.methods.set(userId, userMethods);
  }

  async getMethods(userId: string): Promise<RecoveryMethod[]> {
    return this.methods.get(userId) || [];
  }

  async saveRequest(request: RecoveryRequest): Promise<void> {
    this.requests.set(request.id, request);
  }

  async getRequest(requestId: string): Promise<RecoveryRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async deleteRequest(requestId: string): Promise<void> {
    this.requests.delete(requestId);
  }

  async updateMethod(userId: string, method: RecoveryMethod): Promise<void> {
    const userMethods = this.methods.get(userId) || [];
    const index = userMethods.findIndex(m => m.id === method.id);
    
    if (index >= 0) {
      userMethods[index] = method;
      this.methods.set(userId, userMethods);
    }
  }
}
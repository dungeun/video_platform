import { Result } from '@repo/core';

export interface EncryptionOptions {
  algorithm?: 'AES-GCM' | 'AES-CBC' | 'AES-CTR';
  keySize?: 128 | 192 | 256;
  saltLength?: number;
  iterations?: number;
  tagLength?: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  algorithm: string;
  tag?: string;
}

export class StorageEncryption {
  private options: Required<EncryptionOptions>;
  private crypto: Crypto;
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

  constructor(options?: EncryptionOptions) {
    this.options = {
      algorithm: 'AES-GCM',
      keySize: 256,
      saltLength: 16,
      iterations: 100000,
      tagLength: 128,
      ...options
    };

    // 브라우저와 Node.js 환경 모두 지원
    this.crypto = typeof window !== 'undefined' 
      ? window.crypto 
      : (global as any).crypto || require('crypto').webcrypto;
  }

  /**
   * 데이터 암호화
   */
  async encrypt(data: any, password: string): Promise<Result<EncryptedData>> {
    try {
      // 데이터를 문자열로 변환
      const plaintext = JSON.stringify(data);
      const plaintextBuffer = this.textEncoder.encode(plaintext);

      // 랜덤 salt와 IV 생성
      const salt = this.crypto.getRandomValues(new Uint8Array(this.options.saltLength));
      const iv = this.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM은 12바이트 IV 권장

      // 비밀번호에서 키 유도
      const key = await this.deriveKey(password, salt);

      // 암호화
      const encryptedBuffer = await this.crypto.subtle.encrypt(
        {
          name: this.options.algorithm,
          iv: iv,
          tagLength: this.options.tagLength
        },
        key,
        plaintextBuffer
      );

      // Base64로 인코딩
      const encryptedData: EncryptedData = {
        data: this.bufferToBase64(new Uint8Array(encryptedBuffer)),
        iv: this.bufferToBase64(iv),
        salt: this.bufferToBase64(salt),
        algorithm: this.options.algorithm
      };

      return Result.success(encryptedData);
    } catch (error) {
      return Result.failure('ENCRYPTION_FAILED', `암호화 실패: ${error}`);
    }
  }

  /**
   * 데이터 복호화
   */
  async decrypt<T = any>(encryptedData: EncryptedData, password: string): Promise<Result<T>> {
    try {
      // Base64 디코딩
      const encryptedBuffer = this.base64ToBuffer(encryptedData.data);
      const iv = this.base64ToBuffer(encryptedData.iv);
      const salt = this.base64ToBuffer(encryptedData.salt);

      // 비밀번호에서 키 유도
      const key = await this.deriveKey(password, salt);

      // 복호화
      const decryptedBuffer = await this.crypto.subtle.decrypt(
        {
          name: encryptedData.algorithm,
          iv: iv,
          tagLength: this.options.tagLength
        },
        key,
        encryptedBuffer
      );

      // 문자열로 변환 후 JSON 파싱
      const plaintext = this.textDecoder.decode(decryptedBuffer);
      const data = JSON.parse(plaintext);

      return Result.success(data);
    } catch (error) {
      return Result.failure('DECRYPTION_FAILED', `복호화 실패: ${error}`);
    }
  }

  /**
   * 비밀번호 변경 (재암호화)
   */
  async changePassword<T = any>(
    encryptedData: EncryptedData,
    oldPassword: string,
    newPassword: string
  ): Promise<Result<EncryptedData>> {
    // 기존 비밀번호로 복호화
    const decryptResult = await this.decrypt<T>(encryptedData, oldPassword);
    if (decryptResult.isFailure) {
      return Result.failure('PASSWORD_CHANGE_FAILED', '기존 비밀번호가 올바르지 않습니다');
    }

    // 새 비밀번호로 암호화
    return this.encrypt(decryptResult.data, newPassword);
  }

  /**
   * 암호화 키 생성
   */
  async generateKey(): Promise<Result<CryptoKey>> {
    try {
      const key = await this.crypto.subtle.generateKey(
        {
          name: this.options.algorithm,
          length: this.options.keySize
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      return Result.success(key);
    } catch (error) {
      return Result.failure('KEY_GENERATION_FAILED', `키 생성 실패: ${error}`);
    }
  }

  /**
   * 키 내보내기
   */
  async exportKey(key: CryptoKey): Promise<Result<string>> {
    try {
      const exportedKey = await this.crypto.subtle.exportKey('raw', key);
      const keyString = this.bufferToBase64(new Uint8Array(exportedKey));
      return Result.success(keyString);
    } catch (error) {
      return Result.failure('KEY_EXPORT_FAILED', `키 내보내기 실패: ${error}`);
    }
  }

  /**
   * 키 가져오기
   */
  async importKey(keyString: string): Promise<Result<CryptoKey>> {
    try {
      const keyBuffer = this.base64ToBuffer(keyString);
      
      const key = await this.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        {
          name: this.options.algorithm,
          length: this.options.keySize
        },
        true,
        ['encrypt', 'decrypt']
      );

      return Result.success(key);
    } catch (error) {
      return Result.failure('KEY_IMPORT_FAILED', `키 가져오기 실패: ${error}`);
    }
  }

  /**
   * 안전한 비밀번호 생성
   */
  generateSecurePassword(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomBytes = this.crypto.getRandomValues(new Uint8Array(length));
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }
    
    return password;
  }

  /**
   * 데이터 해시 생성
   */
  async hash(data: any, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<Result<string>> {
    try {
      const dataString = JSON.stringify(data);
      const dataBuffer = this.textEncoder.encode(dataString);
      
      const hashBuffer = await this.crypto.subtle.digest(algorithm, dataBuffer);
      const hashString = this.bufferToBase64(new Uint8Array(hashBuffer));
      
      return Result.success(hashString);
    } catch (error) {
      return Result.failure('HASH_FAILED', `해시 생성 실패: ${error}`);
    }
  }

  /**
   * HMAC 생성
   */
  async hmac(data: any, secret: string): Promise<Result<string>> {
    try {
      const key = await this.crypto.subtle.importKey(
        'raw',
        this.textEncoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const dataBuffer = this.textEncoder.encode(JSON.stringify(data));
      const signature = await this.crypto.subtle.sign('HMAC', key, dataBuffer);
      
      return Result.success(this.bufferToBase64(new Uint8Array(signature)));
    } catch (error) {
      return Result.failure('HMAC_FAILED', `HMAC 생성 실패: ${error}`);
    }
  }

  /**
   * 비밀번호에서 키 유도
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    // 비밀번호를 CryptoKey로 변환
    const passwordKey = await this.crypto.subtle.importKey(
      'raw',
      this.textEncoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // PBKDF2로 키 유도
    return this.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.options.iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.options.algorithm,
        length: this.options.keySize
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Buffer를 Base64로 변환
   */
  private bufferToBase64(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer));
  }

  /**
   * Base64를 Buffer로 변환
   */
  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    
    return buffer;
  }

  /**
   * 암호화 강도 평가
   */
  evaluatePasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // 길이 검사
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length < 8) feedback.push('비밀번호는 최소 8자 이상이어야 합니다');

    // 문자 종류 검사
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    // 복잡도 검사
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 20;

    // 피드백 생성
    if (!/[a-z]/.test(password)) feedback.push('소문자를 포함해주세요');
    if (!/[A-Z]/.test(password)) feedback.push('대문자를 포함해주세요');
    if (!/[0-9]/.test(password)) feedback.push('숫자를 포함해주세요');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('특수문자를 포함해주세요');

    return { score: Math.min(100, score), feedback };
  }
}

// 암호화된 스토리지 프로바이더 래퍼
export class EncryptedStorageProvider {
  private provider: any;
  private encryption: StorageEncryption;
  private password: string;

  constructor(provider: any, password: string, options?: EncryptionOptions) {
    this.provider = provider;
    this.encryption = new StorageEncryption(options);
    this.password = password;
  }

  async get<T = any>(key: string): Promise<Result<T | null>> {
    const result = await this.provider.get<EncryptedData>(key);
    
    if (result.isFailure || result.data === null) {
      return result as Result<T | null>;
    }

    const decryptResult = await this.encryption.decrypt<T>(result.data, this.password);
    
    if (decryptResult.isFailure) {
      return Result.success(null);
    }

    return Result.success(decryptResult.data);
  }

  async set<T = any>(key: string, value: T, metadata?: any): Promise<Result<void>> {
    const encryptResult = await this.encryption.encrypt(value, this.password);
    
    if (encryptResult.isFailure) {
      return Result.failure('ENCRYPTED_SET_FAILED', encryptResult.message);
    }

    return this.provider.set(key, encryptResult.data, metadata);
  }

  // 나머지 메서드들도 동일한 패턴으로 구현
  async delete(key: string): Promise<Result<void>> {
    return this.provider.delete(key);
  }

  async exists(key: string): Promise<Result<boolean>> {
    return this.provider.exists(key);
  }

  async clear(namespace?: string): Promise<Result<void>> {
    return this.provider.clear(namespace);
  }

  async changePassword(newPassword: string): Promise<Result<void>> {
    try {
      // 모든 항목을 재암호화
      const keysResult = await this.provider.keys();
      if (keysResult.isFailure) {
        return Result.failure('PASSWORD_CHANGE_FAILED', '키 목록 조회 실패');
      }

      for (const key of keysResult.data) {
        const result = await this.provider.get<EncryptedData>(key);
        if (result.isSuccess && result.data !== null) {
          const changeResult = await this.encryption.changePassword(
            result.data,
            this.password,
            newPassword
          );
          
          if (changeResult.isSuccess) {
            await this.provider.set(key, changeResult.data);
          }
        }
      }

      this.password = newPassword;
      return Result.success(undefined);
    } catch (error) {
      return Result.failure('PASSWORD_CHANGE_ERROR', `비밀번호 변경 중 오류: ${error}`);
    }
  }
}

export const defaultEncryption = new StorageEncryption();
import { Result } from '@company/core';
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
export declare class StorageEncryption {
    private options;
    private crypto;
    private textEncoder;
    private textDecoder;
    constructor(options?: EncryptionOptions);
    /**
     * 데이터 암호화
     */
    encrypt(data: any, password: string): Promise<Result<EncryptedData>>;
    /**
     * 데이터 복호화
     */
    decrypt<T = any>(encryptedData: EncryptedData, password: string): Promise<Result<T>>;
    /**
     * 비밀번호 변경 (재암호화)
     */
    changePassword<T = any>(encryptedData: EncryptedData, oldPassword: string, newPassword: string): Promise<Result<EncryptedData>>;
    /**
     * 암호화 키 생성
     */
    generateKey(): Promise<Result<CryptoKey>>;
    /**
     * 키 내보내기
     */
    exportKey(key: CryptoKey): Promise<Result<string>>;
    /**
     * 키 가져오기
     */
    importKey(keyString: string): Promise<Result<CryptoKey>>;
    /**
     * 안전한 비밀번호 생성
     */
    generateSecurePassword(length?: number): string;
    /**
     * 데이터 해시 생성
     */
    hash(data: any, algorithm?: 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<Result<string>>;
    /**
     * HMAC 생성
     */
    hmac(data: any, secret: string): Promise<Result<string>>;
    /**
     * 비밀번호에서 키 유도
     */
    private deriveKey;
    /**
     * Buffer를 Base64로 변환
     */
    private bufferToBase64;
    /**
     * Base64를 Buffer로 변환
     */
    private base64ToBuffer;
    /**
     * 암호화 강도 평가
     */
    evaluatePasswordStrength(password: string): {
        score: number;
        feedback: string[];
    };
}
export declare class EncryptedStorageProvider {
    private provider;
    private encryption;
    private password;
    constructor(provider: any, password: string, options?: EncryptionOptions);
    get<T = any>(key: string): Promise<Result<T | null>>;
    set<T = any>(key: string, value: T, metadata?: any): Promise<Result<void>>;
    delete(key: string): Promise<Result<void>>;
    exists(key: string): Promise<Result<boolean>>;
    clear(namespace?: string): Promise<Result<void>>;
    changePassword(newPassword: string): Promise<Result<void>>;
}
export declare const defaultEncryption: StorageEncryption;
//# sourceMappingURL=StorageEncryption.d.ts.map
/**
 * @company/utils - 암호화/해시 유틸리티
 */
import { Result as CoreResult } from '@company/core';
export type Result<T> = CoreResult<T, string>;
/**
 * MD5 해시 생성
 */
export declare function md5(data: string): Result<string>;
/**
 * SHA-1 해시 생성
 */
export declare function sha1(data: string): Result<string>;
/**
 * SHA-256 해시 생성
 */
export declare function sha256(data: string): Result<string>;
/**
 * SHA-512 해시 생성
 */
export declare function sha512(data: string): Result<string>;
/**
 * HMAC-SHA256 해시 생성
 */
export declare function hmacSha256(data: string, key: string): Result<string>;
/**
 * AES 암호화
 */
export declare function aesEncrypt(data: string, key: string): Result<string>;
/**
 * AES 복호화
 */
export declare function aesDecrypt(encryptedData: string, key: string): Result<string>;
/**
 * Base64 인코딩
 */
export declare function base64Encode(data: string): Result<string>;
/**
 * Base64 디코딩
 */
export declare function base64Decode(encodedData: string): Result<string>;
/**
 * URL-safe Base64 인코딩
 */
export declare function base64UrlEncode(data: string): Result<string>;
/**
 * URL-safe Base64 디코딩
 */
export declare function base64UrlDecode(encodedData: string): Result<string>;
/**
 * 랜덤 문자열 생성
 */
export declare function generateRandomString(length?: number, charset?: string): Result<string>;
/**
 * 보안 랜덤 문자열 생성 (Node.js crypto 사용)
 */
export declare function generateSecureRandomString(length?: number): Result<string>;
/**
 * UUID v4 생성
 */
export declare function generateUuid(): Result<string>;
/**
 * 간단한 UUID 생성 (fallback)
 */
export declare function generateSimpleUuid(): Result<string>;
/**
 * 패스워드 해시 생성 (bcrypt 스타일)
 */
export declare function hashPassword(password: string, saltRounds?: number): Result<string>;
/**
 * 패스워드 검증
 */
export declare function verifyPassword(password: string, hash: string): Result<boolean>;
/**
 * 보안 토큰 생성
 */
export declare function generateSecureToken(length?: number): Result<string>;
/**
 * API 키 생성
 */
export declare function generateApiKey(prefix?: string): Result<string>;
//# sourceMappingURL=index.d.ts.map
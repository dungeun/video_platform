/**
 * @repo/utils - 암호화/해시 유틸리티
 */
import CryptoJS from 'crypto-js';
import * as crypto from 'crypto';
// ===== 해시 함수 =====
/**
 * MD5 해시 생성
 */
export function md5(data) {
    try {
        const hash = CryptoJS.MD5(data).toString();
        return { success: true, data: hash };
    }
    catch (error) {
        return { success: false, error: `MD5 해시 생성 실패: ${error}` };
    }
}
/**
 * SHA-1 해시 생성
 */
export function sha1(data) {
    try {
        const hash = CryptoJS.SHA1(data).toString();
        return { success: true, data: hash };
    }
    catch (error) {
        return { success: false, error: `SHA-1 해시 생성 실패: ${error}` };
    }
}
/**
 * SHA-256 해시 생성
 */
export function sha256(data) {
    try {
        const hash = CryptoJS.SHA256(data).toString();
        return { success: true, data: hash };
    }
    catch (error) {
        return { success: false, error: `SHA-256 해시 생성 실패: ${error}` };
    }
}
/**
 * SHA-512 해시 생성
 */
export function sha512(data) {
    try {
        const hash = CryptoJS.SHA512(data).toString();
        return { success: true, data: hash };
    }
    catch (error) {
        return { success: false, error: `SHA-512 해시 생성 실패: ${error}` };
    }
}
/**
 * HMAC-SHA256 해시 생성
 */
export function hmacSha256(data, key) {
    try {
        const hash = CryptoJS.HmacSHA256(data, key).toString();
        return { success: true, data: hash };
    }
    catch (error) {
        return { success: false, error: `HMAC-SHA256 해시 생성 실패: ${error}` };
    }
}
// ===== 암호화/복호화 =====
/**
 * AES 암호화
 */
export function aesEncrypt(data, key) {
    try {
        const encrypted = CryptoJS.AES.encrypt(data, key).toString();
        return { success: true, data: encrypted };
    }
    catch (error) {
        return { success: false, error: `AES 암호화 실패: ${error}` };
    }
}
/**
 * AES 복호화
 */
export function aesDecrypt(encryptedData, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, key);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
            return { success: false, error: 'AES 복호화 실패: 잘못된 키 또는 데이터' };
        }
        return { success: true, data: decrypted };
    }
    catch (error) {
        return { success: false, error: `AES 복호화 실패: ${error}` };
    }
}
/**
 * Base64 인코딩
 */
export function base64Encode(data) {
    try {
        const encoded = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
        return { success: true, data: encoded };
    }
    catch (error) {
        return { success: false, error: `Base64 인코딩 실패: ${error}` };
    }
}
/**
 * Base64 디코딩
 */
export function base64Decode(encodedData) {
    try {
        const decoded = CryptoJS.enc.Base64.parse(encodedData).toString(CryptoJS.enc.Utf8);
        return { success: true, data: decoded };
    }
    catch (error) {
        return { success: false, error: `Base64 디코딩 실패: ${error}` };
    }
}
/**
 * URL-safe Base64 인코딩
 */
export function base64UrlEncode(data) {
    try {
        const encoded = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        return { success: true, data: encoded };
    }
    catch (error) {
        return { success: false, error: `Base64URL 인코딩 실패: ${error}` };
    }
}
/**
 * URL-safe Base64 디코딩
 */
export function base64UrlDecode(encodedData) {
    try {
        let data = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        // 패딩 추가
        while (data.length % 4) {
            data += '=';
        }
        const decoded = CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
        return { success: true, data: decoded };
    }
    catch (error) {
        return { success: false, error: `Base64URL 디코딩 실패: ${error}` };
    }
}
// ===== 랜덤 생성 =====
/**
 * 랜덤 문자열 생성
 */
export function generateRandomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    try {
        if (length <= 0) {
            return { success: false, error: '길이는 0보다 커야 합니다' };
        }
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            result += charset[randomIndex];
        }
        return { success: true, data: result };
    }
    catch (error) {
        return { success: false, error: `랜덤 문자열 생성 실패: ${error}` };
    }
}
/**
 * 보안 랜덤 문자열 생성 (Node.js crypto 사용)
 */
export function generateSecureRandomString(length = 32) {
    try {
        if (length <= 0) {
            return { success: false, error: '길이는 0보다 커야 합니다' };
        }
        const bytes = crypto.randomBytes(length);
        const result = bytes.toString('hex').substring(0, length);
        return { success: true, data: result };
    }
    catch (error) {
        return { success: false, error: `보안 랜덤 문자열 생성 실패: ${error}` };
    }
}
/**
 * UUID v4 생성
 */
export function generateUuid() {
    try {
        const uuid = crypto.randomUUID();
        return { success: true, data: uuid };
    }
    catch (error) {
        return { success: false, error: `UUID 생성 실패: ${error}` };
    }
}
/**
 * 간단한 UUID 생성 (fallback)
 */
export function generateSimpleUuid() {
    try {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return { success: true, data: uuid };
    }
    catch (error) {
        return { success: false, error: `간단한 UUID 생성 실패: ${error}` };
    }
}
// ===== 패스워드 관련 =====
/**
 * 패스워드 해시 생성 (bcrypt 스타일)
 */
export function hashPassword(password, saltRounds = 10) {
    try {
        const salt = CryptoJS.lib.WordArray.random(128 / 8);
        const hash = CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: Math.pow(2, saltRounds)
        });
        const hashString = salt.toString() + hash.toString();
        return { success: true, data: hashString };
    }
    catch (error) {
        return { success: false, error: `패스워드 해시 생성 실패: ${error}` };
    }
}
/**
 * 패스워드 검증
 */
export function verifyPassword(password, hash) {
    try {
        if (hash.length < 32) {
            return { success: false, error: '유효하지 않은 해시 형식' };
        }
        const salt = CryptoJS.enc.Hex.parse(hash.substring(0, 32));
        const originalHash = hash.substring(32);
        const computedHash = CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 1024 // 기본값 사용
        });
        const isValid = computedHash.toString() === originalHash;
        return { success: true, data: isValid };
    }
    catch (error) {
        return { success: false, error: `패스워드 검증 실패: ${error}` };
    }
}
/**
 * 보안 토큰 생성
 */
export function generateSecureToken(length = 64) {
    try {
        const bytes = crypto.randomBytes(Math.ceil(length / 2));
        const token = bytes.toString('hex').substring(0, length);
        return { success: true, data: token };
    }
    catch (error) {
        return { success: false, error: `보안 토큰 생성 실패: ${error}` };
    }
}
/**
 * API 키 생성
 */
export function generateApiKey(prefix = 'ak') {
    try {
        const randomPart = crypto.randomBytes(24).toString('hex');
        const apiKey = `${prefix}_${randomPart}`;
        return { success: true, data: apiKey };
    }
    catch (error) {
        return { success: false, error: `API 키 생성 실패: ${error}` };
    }
}
//# sourceMappingURL=index.js.map
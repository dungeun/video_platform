/**
 * @repo/auth - Token Manager
 * Pure token management for authentication
 */

import { AuthConfig, AuthTokens, TokenInfo, TokenStorage } from '../types';

export class TokenManager implements TokenStorage {
  private config: AuthConfig;
  private currentTokens: AuthTokens | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.loadTokensFromStorage();
  }

  /**
   * 액세스 토큰 조회
   */
  public getAccessToken(): string | null {
    if (this.currentTokens) {
      return this.currentTokens.accessToken;
    }

    // 스토리지에서 직접 조회
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.config.tokenStorageKey);
    }

    return null;
  }

  /**
   * 리프레시 토큰 조회
   */
  public getRefreshToken(): string | null {
    if (this.currentTokens) {
      return this.currentTokens.refreshToken;
    }

    // 스토리지에서 직접 조회
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.config.refreshTokenKey);
    }

    return null;
  }

  /**
   * 토큰 저장
   */
  public setTokens(tokens: AuthTokens): void {
    this.currentTokens = tokens;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.config.tokenStorageKey, tokens.accessToken);
      localStorage.setItem(this.config.refreshTokenKey, tokens.refreshToken);
      localStorage.setItem(`${this.config.tokenStorageKey}_expires`, tokens.expiresAt.toISOString());
    }
  }

  /**
   * 토큰 삭제
   */
  public clearTokens(): void {
    this.currentTokens = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.config.tokenStorageKey);
      localStorage.removeItem(this.config.refreshTokenKey);
      localStorage.removeItem(`${this.config.tokenStorageKey}_expires`);
    }
  }

  /**
   * 토큰 정보 조회
   */
  public getTokenInfo(): TokenInfo {
    const token = this.getAccessToken();
    
    if (!token || !this.currentTokens) {
      return {
        isValid: false,
        timeUntilExpiry: 0,
        expiresAt: null
      };
    }

    const now = new Date();
    const expiresAt = this.currentTokens.expiresAt;
    const timeUntilExpiry = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return {
      isValid: timeUntilExpiry > 0,
      timeUntilExpiry,
      expiresAt
    };
  }

  /**
   * 토큰 유효성 확인
   */
  public isValidToken(): boolean {
    const tokenInfo = this.getTokenInfo();
    return tokenInfo.isValid;
  }

  /**
   * 토큰 만료 시간 조회
   */
  public getTokenExpiry(): Date | null {
    return this.currentTokens?.expiresAt || null;
  }

  /**
   * 토큰이 곧 만료되는지 확인
   */
  public isTokenExpiringSoon(minutesThreshold: number = 5): boolean {
    const tokenInfo = this.getTokenInfo();
    return tokenInfo.timeUntilExpiry < (minutesThreshold * 60);
  }

  /**
   * JWT 토큰 페이로드 디코딩 (클라이언트 사이드)
   */
  public decodeTokenPayload(token?: string): any | null {
    const targetToken = token || this.getAccessToken();
    
    if (!targetToken) {
      return null;
    }

    try {
      const parts = targetToken.split('.');
      if (parts.length !== 3 || !parts[1]) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * 저장소에서 토큰 로드
   */
  private loadTokensFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const accessToken = localStorage.getItem(this.config.tokenStorageKey);
      const refreshToken = localStorage.getItem(this.config.refreshTokenKey);
      const expiresAtStr = localStorage.getItem(`${this.config.tokenStorageKey}_expires`);

      if (accessToken && refreshToken && expiresAtStr) {
        const expiresAt = new Date(expiresAtStr);
        
        this.currentTokens = {
          accessToken,
          refreshToken,
          expiresAt,
          tokenType: 'Bearer'
        };

        // 만료된 토큰이면 삭제
        if (expiresAt <= new Date()) {
          this.clearTokens();
        }
      }
    } catch (error) {
      console.warn('토큰 로드 실패:', error);
      this.clearTokens();
    }
  }

  /**
   * 토큰 자동 정리 설정
   */
  public setupTokenCleanup(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // 페이지 언로드 시 토큰 정리 (설정에 따라)
    if (this.config.logoutOnWindowClose) {
      window.addEventListener('beforeunload', () => {
        this.clearTokens();
      });
    }

    // 주기적으로 만료된 토큰 정리
    setInterval(() => {
      if (this.currentTokens && this.currentTokens.expiresAt <= new Date()) {
        this.clearTokens();
      }
    }, 60 * 1000); // 1분마다 체크
  }
}
/**
 * @company/auth-core - 토큰 관리자
 * JWT 토큰 저장, 갱신, 검증 관리
 */

import Cookies from 'js-cookie';
import { AuthConfig, AuthTokens } from '../types';
import { Logger } from '@company/core';

export class TokenManager {
  private config: AuthConfig;
  private logger: Logger;
  private tokens: AuthTokens | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.logger = new Logger('TokenManager');
    this.loadTokensFromStorage();
  }

  // ===== 토큰 설정 =====

  /**
   * 토큰 설정 및 저장
   */
  public setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
    this.saveTokensToStorage();
    this.logger.debug('토큰 설정 완료');
  }

  /**
   * 액세스 토큰 조회
   */
  public getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  /**
   * 리프레시 토큰 조회
   */
  public getRefreshToken(): string | null {
    return this.tokens?.refreshToken || null;
  }

  /**
   * 토큰 만료 시간 조회
   */
  public getTokenExpiry(): Date | null {
    return this.tokens?.expiresAt || null;
  }

  /**
   * 토큰 유효성 확인
   */
  public isTokenValid(): boolean {
    if (!this.tokens || !this.tokens.accessToken) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(this.tokens.expiresAt);
    
    return expiresAt > now;
  }

  /**
   * 토큰이 곧 만료되는지 확인
   */
  public isTokenExpiringSoon(minutesBefore: number = 5): boolean {
    if (!this.tokens) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(this.tokens.expiresAt);
    const warningTime = new Date(expiresAt.getTime() - minutesBefore * 60 * 1000);
    
    return now >= warningTime;
  }

  /**
   * 토큰 초기화
   */
  public clearTokens(): void {
    this.tokens = null;
    this.removeTokensFromStorage();
    this.logger.debug('토큰 초기화 완료');
  }

  /**
   * 인증 헤더 생성
   */
  public getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    
    if (!token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`
    };
  }

  // ===== 저장소 관리 =====

  /**
   * 저장소에서 토큰 로드
   */
  private loadTokensFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // 쿠키에서 토큰 조회
      const accessToken = Cookies.get(this.config.tokenStorageKey);
      const refreshToken = Cookies.get(this.config.refreshTokenKey);
      
      if (!accessToken || !refreshToken) {
        // localStorage에서 조회 (fallback)
        if (typeof localStorage !== 'undefined') {
          const storedTokens = localStorage.getItem(this.config.tokenStorageKey);
          
          if (storedTokens) {
            this.tokens = JSON.parse(storedTokens);
          }
        }
        return;
      }

      // JWT 페이로드에서 만료 시간 추출
      const expiresAt = this.extractTokenExpiry(accessToken);
      
      this.tokens = {
        accessToken,
        refreshToken,
        expiresAt: expiresAt || new Date(Date.now() + 60 * 60 * 1000), // 1시간 후 기본값
        tokenType: 'Bearer'
      };

      this.logger.debug('저장소에서 토큰 로드 완료');

    } catch (error) {
      this.logger.warn('토큰 로드 실패', error as any);
      this.clearTokens();
    }
  }

  /**
   * 저장소에 토큰 저장
   */
  private saveTokensToStorage(): void {
    if (!this.tokens || typeof window === 'undefined') {
      return;
    }

    try {
      const cookieOptions: Cookies.CookieAttributes = {
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
        expires: this.tokens.expiresAt
      };

      // 쿠키에 저장 (HttpOnly는 서버에서만 설정 가능)
      Cookies.set(this.config.tokenStorageKey, this.tokens.accessToken, cookieOptions);
      Cookies.set(this.config.refreshTokenKey, this.tokens.refreshToken, {
        ...cookieOptions,
        expires: new Date(Date.now() + this.config.rememberMeDuration * 24 * 60 * 60 * 1000)
      });

      // localStorage에도 백업 저장
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.config.tokenStorageKey, JSON.stringify(this.tokens));
      }

      this.logger.debug('토큰 저장 완료');

    } catch (error) {
      this.logger.error('토큰 저장 실패', error as any);
    }
  }

  /**
   * 저장소에서 토큰 제거
   */
  private removeTokensFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // 쿠키 제거
      Cookies.remove(this.config.tokenStorageKey);
      Cookies.remove(this.config.refreshTokenKey);

      // localStorage 제거
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.config.tokenStorageKey);
      }

      this.logger.debug('저장소에서 토큰 제거 완료');

    } catch (error) {
      this.logger.warn('토큰 제거 실패', error as any);
    }
  }

  /**
   * JWT 토큰에서 만료 시간 추출
   */
  private extractTokenExpiry(token: string): Date | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1] || ''));
      
      if (!payload.exp) {
        return null;
      }

      return new Date(payload.exp * 1000);

    } catch (error) {
      this.logger.warn('토큰 만료 시간 추출 실패', error as any);
      return null;
    }
  }

  /**
   * JWT 토큰에서 사용자 정보 추출
   */
  public extractUserFromToken(token?: string): any | null {
    try {
      const targetToken = token || this.getAccessToken();
      
      if (!targetToken) {
        return null;
      }

      const parts = targetToken.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1] || ''));
      
      return {
        userId: payload.sub || payload.userId,
        email: payload.email,
        name: payload.name,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        iat: payload.iat,
        exp: payload.exp
      };

    } catch (error) {
      this.logger.warn('토큰에서 사용자 정보 추출 실패', error as any);
      return null;
    }
  }

  /**
   * 토큰 형식 검증
   */
  public validateTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // 각 부분이 Base64로 디코딩 가능한지 확인
      JSON.parse(atob(parts[0] || '')); // header
      JSON.parse(atob(parts[1] || '')); // payload
      
      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * 토큰 만료까지 남은 시간 (초)
   */
  public getTimeUntilExpiry(): number {
    if (!this.tokens) {
      return 0;
    }

    const now = new Date();
    const expiresAt = new Date(this.tokens.expiresAt);
    
    return Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  }

  /**
   * 토큰 정보 요약
   */
  public getTokenInfo(): {
    hasTokens: boolean;
    isValid: boolean;
    expiresAt: Date | null;
    timeUntilExpiry: number;
    user: any | null;
  } {
    const hasTokens = !!this.tokens;
    const isValid = this.isTokenValid();
    const expiresAt = this.getTokenExpiry();
    const timeUntilExpiry = this.getTimeUntilExpiry();
    const user = this.extractUserFromToken();

    return {
      hasTokens,
      isValid,
      expiresAt,
      timeUntilExpiry,
      user
    };
  }
}
/**
 * @repo/auth-core - 세션 관리자
 * 사용자 세션 생성, 유지, 종료 관리
 */

import { Logger } from '@repo/core';
import { AuthConfig, AuthSession, UserProfile, AuthTokens, AuthResult } from '../types';

export class SessionManager {
  private config: AuthConfig;
  private logger: Logger;
  private currentSession: AuthSession | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.logger = new Logger('SessionManager');
    this.setupActivityTracking();
  }

  // ===== 세션 관리 =====

  /**
   * 새 세션 생성
   */
  public async createSession(user: UserProfile, tokens: AuthTokens): Promise<AuthResult<AuthSession>> {
    try {
      const session: AuthSession = {
        user,
        tokens,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.sessionTimeout * 60 * 1000),
        ipAddress: this.getCurrentIP(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      };

      this.currentSession = session;
      this.saveSessionToStorage();
      this.startSessionTimer();

      this.logger.info('세션 생성 완료', { 
        userId: user.id,
        expiresAt: session.expiresAt 
      });

      return { success: true, data: session };

    } catch (error) {
      this.logger.error('세션 생성 실패', error as any);
      return { success: false, error: '세션 생성 중 오류가 발생했습니다' };
    }
  }

  /**
   * 저장된 세션 복원
   */
  public async restoreSession(): Promise<AuthResult<AuthSession>> {
    if (typeof localStorage === 'undefined') {
      return { success: false, error: '저장소를 사용할 수 없습니다' };
    }

    try {
      const storedSession = localStorage.getItem('auth-session');
      
      if (!storedSession) {
        return { success: false, error: '저장된 세션이 없습니다' };
      }

      const session: AuthSession = JSON.parse(storedSession);
      
      // 세션 만료 확인
      if (new Date() > new Date(session.expiresAt)) {
        this.clearSession();
        return { success: false, error: '세션이 만료되었습니다' };
      }

      this.currentSession = session;
      this.startSessionTimer();

      this.logger.info('세션 복원 완료', { userId: session.user.id });

      return { success: true, data: session };

    } catch (error) {
      this.logger.warn('세션 복원 실패', error as any);
      this.clearSession();
      return { success: false, error: '세션 복원 중 오류가 발생했습니다' };
    }
  }

  /**
   * 세션 정보 업데이트
   */
  public updateSession(updates: Partial<AuthSession>): void {
    if (!this.currentSession) {
      return;
    }

    this.currentSession = {
      ...this.currentSession,
      ...updates
    };

    this.saveSessionToStorage();
    this.logger.debug('세션 정보 업데이트 완료');
  }

  /**
   * 사용자 정보 업데이트
   */
  public updateUser(user: UserProfile): void {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.user = user;
    this.saveSessionToStorage();
    this.logger.debug('세션 사용자 정보 업데이트 완료');
  }

  /**
   * 세션 연장
   */
  public extendSession(additionalMinutes?: number): void {
    if (!this.currentSession) {
      return;
    }

    const extension = additionalMinutes || this.config.sessionTimeout;
    const newExpiry = new Date(Date.now() + extension * 60 * 1000);

    this.currentSession.expiresAt = newExpiry;
    this.saveSessionToStorage();
    this.startSessionTimer(); // 타이머 재시작

    this.logger.debug('세션 연장 완료', { 
      userId: this.currentSession.user.id,
      newExpiry 
    });
  }

  /**
   * 세션 초기화
   */
  public clearSession(): void {
    this.currentSession = null;
    this.clearSessionFromStorage();
    this.stopSessionTimer();

    this.logger.debug('세션 초기화 완료');
  }

  // ===== 상태 조회 =====

  /**
   * 현재 사용자 조회
   */
  public getCurrentUser(): UserProfile | null {
    return this.currentSession?.user || null;
  }

  /**
   * 현재 세션 조회
   */
  public getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * 인증 상태 확인
   */
  public isAuthenticated(): boolean {
    if (!this.currentSession) {
      return false;
    }

    // 세션 만료 확인
    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);

    if (now > expiresAt) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * 세션 만료까지 남은 시간 (분)
   */
  public getTimeUntilExpiry(): number {
    if (!this.currentSession) {
      return 0;
    }

    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);
    
    return Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (60 * 1000)));
  }

  /**
   * 세션 정보 요약
   */
  public getSessionInfo(): {
    isActive: boolean;
    user: UserProfile | null;
    expiresAt: Date | null;
    timeUntilExpiry: number;
    lastActivity: Date | null;
  } {
    const isActive = this.isAuthenticated();
    const user = this.getCurrentUser();
    const expiresAt = this.currentSession?.expiresAt || null;
    const timeUntilExpiry = this.getTimeUntilExpiry();
    const lastActivity = this.getLastActivity();

    return {
      isActive,
      user,
      expiresAt,
      timeUntilExpiry,
      lastActivity
    };
  }

  // ===== 활동 추적 =====

  /**
   * 사용자 활동 기록
   */
  public recordActivity(): void {
    if (!this.currentSession) {
      return;
    }

    const now = new Date();
    localStorage.setItem('last-activity', now.toISOString());

    // 세션 자동 연장 (설정에 따라)
    if (this.shouldAutoExtendSession()) {
      this.extendSession();
    }

    this.logger.debug('사용자 활동 기록', { timestamp: now });
  }

  /**
   * 마지막 활동 시간 조회
   */
  public getLastActivity(): Date | null {
    const lastActivity = localStorage.getItem('last-activity');
    return lastActivity ? new Date(lastActivity) : null;
  }

  /**
   * 비활성 시간 조회 (분)
   */
  public getInactiveTime(): number {
    const lastActivity = this.getLastActivity();
    
    if (!lastActivity) {
      return 0;
    }

    const now = new Date();
    return Math.floor((now.getTime() - lastActivity.getTime()) / (60 * 1000));
  }

  // ===== 내부 메소드 =====

  /**
   * 저장소에 세션 저장
   */
  private saveSessionToStorage(): void {
    if (!this.currentSession) {
      return;
    }

    try {
      const sessionData = {
        ...this.currentSession,
        issuedAt: this.currentSession.issuedAt.toISOString(),
        expiresAt: this.currentSession.expiresAt.toISOString()
      };

      localStorage.setItem('auth-session', JSON.stringify(sessionData));

    } catch (error) {
      this.logger.error('세션 저장 실패', error as any);
    }
  }

  /**
   * 저장소에서 세션 제거
   */
  private clearSessionFromStorage(): void {
    try {
      localStorage.removeItem('auth-session');
      localStorage.removeItem('last-activity');
    } catch (error) {
      this.logger.warn('세션 저장소 정리 실패', error as any);
    }
  }

  /**
   * 세션 타이머 시작
   */
  private startSessionTimer(): void {
    this.stopSessionTimer();

    if (!this.currentSession) {
      return;
    }

    const timeUntilExpiry = this.getTimeUntilExpiry() * 60 * 1000; // 밀리초로 변환

    this.sessionTimer = setTimeout(() => {
      this.logger.info('세션 자동 만료');
      this.clearSession();
      
      // 세션 만료 이벤트 발행 (브라우저 환경에서만)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
      
    }, timeUntilExpiry);

    this.logger.debug('세션 타이머 시작', { 
      expiresIn: `${this.getTimeUntilExpiry()}분` 
    });
  }

  /**
   * 세션 타이머 중지
   */
  private stopSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * 활동 추적 설정
   */
  private setupActivityTracking(): void {
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // 사용자 활동 이벤트 감지
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    let activityTimeout: NodeJS.Timeout | null = null;

    const recordUserActivity = () => {
      // 디바운싱으로 과도한 호출 방지
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      activityTimeout = setTimeout(() => {
        this.recordActivity();
      }, 1000); // 1초 디바운싱
    };

    events.forEach(event => {
      document.addEventListener(event, recordUserActivity, true);
    });

    // 창이 닫힐 때 정리
    window.addEventListener('beforeunload', () => {
      if (this.config.logoutOnWindowClose) {
        this.clearSession();
      }
    });

    // 포커스 변경 시 활동 기록
    window.addEventListener('focus', recordUserActivity);
  }

  /**
   * 세션 자동 연장 여부 판단
   */
  private shouldAutoExtendSession(): boolean {
    if (!this.currentSession) {
      return false;
    }

    const timeUntilExpiry = this.getTimeUntilExpiry();
    
    // 만료 10분 전에 자동 연장
    return timeUntilExpiry <= 10 && timeUntilExpiry > 0;
  }

  /**
   * 현재 IP 주소 조회 (클라이언트에서는 제한적)
   */
  private getCurrentIP(): string {
    // 실제 환경에서는 서버에서 제공하거나 외부 서비스 사용
    return 'client-ip';
  }
}
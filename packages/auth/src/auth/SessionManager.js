/**
 * @company/auth - Session Manager
 * Pure session management for authentication
 */
export class SessionManager {
    constructor(config) {
        this.currentSession = null;
        this.sessionKey = 'auth-session';
        this.config = config;
        this.loadSessionFromStorage();
    }
    /**
     * 현재 사용자 조회
     */
    getCurrentUser() {
        return this.currentSession?.user || null;
    }
    /**
     * 현재 세션 조회
     */
    getCurrentSession() {
        if (this.currentSession && this.isSessionValid()) {
            return this.currentSession;
        }
        return null;
    }
    /**
     * 세션 생성
     */
    createSession(user, tokens) {
        try {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + this.config.sessionTimeout * 60 * 1000);
            const session = {
                user,
                tokens,
                issuedAt: now,
                expiresAt,
                ipAddress: this.getClientIP(),
                userAgent: this.getUserAgent()
            };
            this.setSession(session);
            return { success: true, data: session };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '세션 생성 실패';
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * 세션 설정
     */
    setSession(session) {
        this.currentSession = session;
        this.updateLastActivity();
        this.saveSessionToStorage();
    }
    /**
     * 세션 삭제
     */
    clearSession() {
        this.currentSession = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.sessionKey);
            localStorage.removeItem(`${this.sessionKey}_last_activity`);
        }
    }
    /**
     * 인증 상태 확인
     */
    isAuthenticated() {
        return this.currentSession !== null && this.isSessionValid();
    }
    /**
     * 마지막 활동 시간 업데이트
     */
    updateLastActivity() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`${this.sessionKey}_last_activity`, new Date().toISOString());
        }
    }
    /**
     * 토큰 업데이트 (토큰 갱신 시 사용)
     */
    updateTokens(tokens) {
        if (this.currentSession) {
            this.currentSession.tokens = tokens;
            this.saveSessionToStorage();
        }
    }
    /**
     * 사용자 정보 업데이트
     */
    updateUser(user) {
        if (this.currentSession) {
            this.currentSession.user = user;
            this.saveSessionToStorage();
        }
    }
    /**
     * 세션 유효성 확인
     */
    isSessionValid() {
        if (!this.currentSession) {
            return false;
        }
        const now = new Date();
        // 세션 만료 체크
        if (this.currentSession.expiresAt <= now) {
            return false;
        }
        // 마지막 활동 시간 체크
        const lastActivity = this.getLastActivity();
        if (lastActivity) {
            const sessionTimeout = this.config.sessionTimeout * 60 * 1000; // ms로 변환
            const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
            if (timeSinceLastActivity > sessionTimeout) {
                return false;
            }
        }
        return true;
    }
    /**
     * 세션 만료까지 남은 시간 (초)
     */
    getTimeUntilExpiry() {
        if (!this.currentSession) {
            return 0;
        }
        const now = new Date();
        const timeUntilExpiry = Math.max(0, Math.floor((this.currentSession.expiresAt.getTime() - now.getTime()) / 1000));
        return timeUntilExpiry;
    }
    /**
     * 세션 연장
     */
    extendSession() {
        if (!this.currentSession || !this.isSessionValid()) {
            return false;
        }
        const now = new Date();
        this.currentSession.expiresAt = new Date(now.getTime() + this.config.sessionTimeout * 60 * 1000);
        this.updateLastActivity();
        this.saveSessionToStorage();
        return true;
    }
    /**
     * 세션 정보 요약
     */
    getSessionSummary() {
        if (!this.currentSession) {
            return null;
        }
        return {
            userId: this.currentSession.user.id,
            userEmail: this.currentSession.user.email,
            userName: this.currentSession.user.name,
            issuedAt: this.currentSession.issuedAt,
            expiresAt: this.currentSession.expiresAt,
            timeUntilExpiry: this.getTimeUntilExpiry(),
            isValid: this.isSessionValid()
        };
    }
    /**
     * 저장소에서 세션 로드
     */
    loadSessionFromStorage() {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                // Date 객체 복원
                session.issuedAt = new Date(session.issuedAt);
                session.expiresAt = new Date(session.expiresAt);
                session.tokens.expiresAt = new Date(session.tokens.expiresAt);
                this.currentSession = session;
                // 만료된 세션이면 삭제
                if (!this.isSessionValid()) {
                    this.clearSession();
                }
            }
        }
        catch (error) {
            console.warn('세션 로드 실패:', error);
            this.clearSession();
        }
    }
    /**
     * 세션을 저장소에 저장
     */
    saveSessionToStorage() {
        if (typeof window === 'undefined' || !this.currentSession) {
            return;
        }
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
        }
        catch (error) {
            console.warn('세션 저장 실패:', error);
        }
    }
    /**
     * 마지막 활동 시간 조회
     */
    getLastActivity() {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            const lastActivityStr = localStorage.getItem(`${this.sessionKey}_last_activity`);
            return lastActivityStr ? new Date(lastActivityStr) : null;
        }
        catch {
            return null;
        }
    }
    /**
     * 클라이언트 IP 주소 추정 (제한적)
     */
    getClientIP() {
        // 실제 환경에서는 서버에서 제공하거나 별도 서비스 사용
        return undefined;
    }
    /**
     * User Agent 조회
     */
    getUserAgent() {
        if (typeof window !== 'undefined') {
            return navigator.userAgent;
        }
        return undefined;
    }
    /**
     * 세션 자동 정리 설정
     */
    setupSessionCleanup() {
        if (typeof window === 'undefined') {
            return;
        }
        // 페이지 언로드 시 세션 정리 (설정에 따라)
        if (this.config.logoutOnWindowClose) {
            window.addEventListener('beforeunload', () => {
                this.clearSession();
            });
        }
        // 주기적으로 세션 유효성 체크
        setInterval(() => {
            if (this.currentSession && !this.isSessionValid()) {
                this.clearSession();
                // 세션 만료 이벤트 발행
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
            }
        }, 60 * 1000); // 1분마다 체크
        // 사용자 활동 감지하여 마지막 활동 시간 업데이트
        const updateActivity = () => this.updateLastActivity();
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });
    }
}
//# sourceMappingURL=SessionManager.js.map
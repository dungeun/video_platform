/**
 * @repo/auth - Pure Authentication Service
 * Ultra-Fine-Grained Module - Login/Logout Only
 */
class ModuleBase {
    constructor(config) {
        this.logger = {
            info: (...args) => console.log(...args),
            debug: (...args) => console.debug(...args),
            warn: (...args) => console.warn(...args),
            error: (...args) => console.error(...args)
        };
        this.errorHandler = {
            handle: (error, message) => message
        };
    }
    async safeExecute(fn, errorMessage) {
        try {
            const result = await fn();
            return { success: true, data: result };
        }
        catch (error) {
            return { success: false, error: errorMessage };
        }
    }
    emit(event, data) { }
    destroy() { }
}
class EventBus {
    static emitModuleEvent(module, event, data) { }
}
class HttpClient {
    constructor(config) { }
    async get(url) {
        return { success: true, data: {} };
    }
    async post(url, data) {
        return { success: true, data: {} };
    }
}
import { TokenManager } from './TokenManager';
import { SessionManager } from './SessionManager';
export class AuthService extends ModuleBase {
    constructor(config) {
        super({
            name: '@repo/auth',
            version: '1.0.0',
            description: 'Pure Authentication Service - Login/Logout Only'
        });
        this.authConfig = config;
        this.tokenManager = new TokenManager(config);
        this.sessionManager = new SessionManager(config);
        this.httpClient = new HttpClient({
            baseURL: config.apiUrl,
            timeout: 10000
        });
        this.setupAutoRefresh();
    }
    // ===== 라이프사이클 메소드 =====
    async onInitialize() {
        try {
            // 저장된 세션 복원 시도
            const session = this.sessionManager.getCurrentSession();
            if (session && this.tokenManager.isValidToken()) {
                this.logger.info('세션 복원 성공');
                this.emit('auth:session-restored', session);
            }
            return { success: true };
        }
        catch (error) {
            const authError = this.errorHandler.handle(error, '인증 서비스 초기화 실패');
            return { success: false, error: authError };
        }
    }
    async onDestroy() {
        try {
            this.tokenManager.clearTokens();
            this.sessionManager.clearSession();
            return { success: true };
        }
        catch (error) {
            const authError = this.errorHandler.handle(error, '인증 서비스 종료 실패');
            return { success: false, error: authError };
        }
    }
    async healthCheck() {
        try {
            const response = await this.httpClient.get('/health');
            return { success: true, data: response.success };
        }
        catch (error) {
            const authError = this.errorHandler.handle(error, '인증 서비스 연결 실패');
            return { success: false, error: authError };
        }
    }
    // ===== 인증 메소드 =====
    /**
     * 사용자 로그인
     */
    async login(credentials) {
        try {
            this.logger.info('로그인 시도', { email: credentials.email });
            // 1. 입력 검증
            const validation = this.validateLoginCredentials(credentials);
            if (!validation.success) {
                return { success: false, error: validation.error || '입력 검증 실패' };
            }
            // 2. API 호출
            const response = await this.httpClient.post('/auth/login', {
                email: credentials.email,
                password: credentials.password,
                rememberMe: credentials.rememberMe
            });
            if (!response.success || !response.data) {
                return {
                    success: false,
                    error: response.data?.message || '로그인에 실패했습니다'
                };
            }
            const loginData = response.data;
            // 3. 토큰 저장
            this.tokenManager.setTokens(loginData.tokens);
            // 4. 세션 생성
            const session = this.sessionManager.createSession(loginData.user, loginData.tokens);
            if (!session.success) {
                return {
                    success: false,
                    error: '세션 생성에 실패했습니다'
                };
            }
            // 5. 이벤트 발행
            EventBus.emitModuleEvent('@repo/auth', 'auth:login', {
                user: loginData.user,
                session: session.data
            });
            this.logger.info('로그인 성공', { userId: loginData.user.id });
            return { success: true, data: loginData };
        }
        catch (error) {
            return { success: false, error: '로그인 처리 중 오류가 발생했습니다' };
        }
    }
    /**
     * 로그아웃
     */
    async logout() {
        try {
            const currentUser = this.sessionManager.getCurrentUser();
            this.logger.info('로그아웃 시도', {
                userId: currentUser?.id || 'unknown'
            });
            // 1. 서버에 로그아웃 요청
            try {
                const response = await this.httpClient.post('/auth/logout', {
                    refreshToken: this.tokenManager.getRefreshToken()
                });
                // 서버 로그아웃 실패해도 로컬 정리는 진행
                if (!response.success) {
                    this.logger.warn('서버 로그아웃 실패, 로컬 정리 진행');
                }
            }
            catch (error) {
                // 서버 에러는 무시하고 로컬 정리 진행
                this.logger.warn('서버 로그아웃 실패, 로컬 정리 진행', error);
            }
            // 2. 로컬 데이터 정리
            this.tokenManager.clearTokens();
            this.sessionManager.clearSession();
            // 3. 이벤트 발행
            EventBus.emitModuleEvent('@repo/auth', 'auth:logout', {
                user: currentUser
            });
            this.logger.info('로그아웃 완료');
            return {
                success: true,
                data: { success: true, message: '로그아웃되었습니다' }
            };
        }
        catch (error) {
            return { success: false, error: '로그아웃 처리 중 오류가 발생했습니다' };
        }
    }
    /**
     * 토큰 갱신
     */
    async refreshToken() {
        try {
            const refreshToken = this.tokenManager.getRefreshToken();
            if (!refreshToken) {
                return { success: false, error: '리프레시 토큰이 없습니다' };
            }
            this.logger.debug('토큰 갱신 시도');
            const response = await this.httpClient.post('/auth/refresh', {
                refreshToken
            });
            if (!response.success || !response.data) {
                // 리프레시 토큰이 유효하지 않으면 로그아웃 처리
                await this.logout();
                return { success: false, error: '토큰 갱신에 실패했습니다' };
            }
            // 새 토큰 저장
            this.tokenManager.setTokens(response.data.tokens);
            // 세션 토큰 업데이트
            this.sessionManager.updateTokens(response.data.tokens);
            // 이벤트 발행
            EventBus.emitModuleEvent('@repo/auth', 'auth:token-refreshed', {
                tokens: response.data.tokens
            });
            this.logger.debug('토큰 갱신 완료');
            return { success: true, data: response.data };
        }
        catch (error) {
            return { success: false, error: '토큰 갱신 중 오류가 발생했습니다' };
        }
    }
    // ===== 상태 조회 =====
    /**
     * 현재 사용자 조회
     */
    getCurrentUser() {
        return this.sessionManager.getCurrentUser();
    }
    /**
     * 현재 세션 조회
     */
    getCurrentSession() {
        return this.sessionManager.getCurrentSession();
    }
    /**
     * 인증 상태 확인
     */
    isAuthenticated() {
        return this.sessionManager.isAuthenticated() && this.tokenManager.isValidToken();
    }
    /**
     * 토큰 정보 조회
     */
    getTokenInfo() {
        return this.tokenManager.getTokenInfo();
    }
    /**
     * 세션 유효성 확인
     */
    checkSession() {
        const session = this.sessionManager.getCurrentSession();
        const tokenValid = this.tokenManager.isValidToken();
        if (!session || !tokenValid) {
            this.logger.debug('세션 또는 토큰이 유효하지 않음');
            return false;
        }
        // 세션 만료 체크
        if (session.expiresAt < new Date()) {
            this.logger.debug('세션이 만료됨');
            this.sessionManager.clearSession();
            this.tokenManager.clearTokens();
            return false;
        }
        return true;
    }
    // ===== 내부 메소드 =====
    validateLoginCredentials(credentials) {
        if (!credentials.email || !credentials.password) {
            return { success: false, error: '이메일과 비밀번호를 입력해주세요' };
        }
        if (!this.isValidEmail(credentials.email)) {
            return { success: false, error: '올바른 이메일 형식이 아닙니다' };
        }
        return { success: true };
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    setupAutoRefresh() {
        if (!this.authConfig.autoRefreshToken) {
            return;
        }
        // 토큰 만료 5분 전에 자동 갱신
        setInterval(async () => {
            if (!this.isAuthenticated()) {
                return;
            }
            const tokenInfo = this.tokenManager.getTokenInfo();
            if (tokenInfo.isValid && tokenInfo.timeUntilExpiry < 300) { // 5분
                this.logger.debug('자동 토큰 갱신 시작');
                await this.refreshToken();
            }
        }, 60 * 1000); // 1분마다 체크
    }
}
//# sourceMappingURL=AuthService.js.map
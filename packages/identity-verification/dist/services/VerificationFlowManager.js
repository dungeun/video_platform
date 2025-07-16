"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationFlowManager = void 0;
const types_1 = require("../types");
/**
 * 본인인증 흐름 관리 서비스
 * 다양한 인증 수단을 통합 관리하고 인증 프로세스를 조율
 */
class VerificationFlowManager {
    constructor(config) {
        this.passAuthService = config.pass;
        this.mobileCarrierService = config.mobileCarrier;
        this.sessions = new Map();
        this.eventHandlers = new Map();
        // 세션 정리 스케줄러 시작
        this.startSessionCleanup();
    }
    /**
     * 본인인증 시작
     */
    async startVerification(request) {
        try {
            // 요청 검증
            this.validateRequest(request);
            // 세션 생성
            const session = this.createSession(request);
            // 인증 시작 이벤트 발생
            this.emitEvent({
                type: 'started',
                verificationId: session.sessionId,
                timestamp: new Date(),
                data: { method: request.method }
            });
            // 인증 수단에 따라 적절한 서비스 호출
            let response;
            switch (request.method) {
                case types_1.VerificationMethod.PASS:
                    if (!this.passAuthService) {
                        throw new Error('PASS 인증 서비스가 설정되지 않았습니다.');
                    }
                    response = await this.passAuthService.requestVerification(request);
                    break;
                case types_1.VerificationMethod.MOBILE_CARRIER:
                    if (!this.mobileCarrierService) {
                        throw new Error('통신사 인증 서비스가 설정되지 않았습니다.');
                    }
                    response = await this.mobileCarrierService.requestVerification(request);
                    break;
                default:
                    throw new Error(`지원하지 않는 인증 수단입니다: ${request.method}`);
            }
            // 세션 업데이트
            if (response.verificationId) {
                session.sessionId = response.verificationId;
                session.status = response.status;
                session.updatedAt = new Date();
                this.sessions.set(response.verificationId, session);
            }
            return response;
        }
        catch (error) {
            console.error('[Verification Flow] Start verification error:', error);
            // 실패 이벤트 발생
            this.emitEvent({
                type: 'failed',
                verificationId: '',
                timestamp: new Date(),
                data: { error }
            });
            return {
                verificationId: '',
                status: types_1.VerificationStatus.FAILED,
                error: {
                    code: types_1.VerificationErrorCode.UNKNOWN_ERROR,
                    message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
                }
            };
        }
    }
    /**
     * 인증 상태 확인
     */
    async checkStatus(verificationId) {
        const session = this.sessions.get(verificationId);
        if (!session) {
            return {
                verificationId,
                status: types_1.VerificationStatus.EXPIRED,
                error: {
                    code: types_1.VerificationErrorCode.SESSION_EXPIRED,
                    message: '인증 세션이 만료되었습니다.'
                }
            };
        }
        let response;
        switch (session.request.method) {
            case types_1.VerificationMethod.PASS:
                if (!this.passAuthService) {
                    throw new Error('PASS 인증 서비스가 설정되지 않았습니다.');
                }
                response = await this.passAuthService.checkStatus(verificationId);
                break;
            case types_1.VerificationMethod.MOBILE_CARRIER:
                if (!this.mobileCarrierService || !session.request.carrier) {
                    throw new Error('통신사 인증 서비스가 설정되지 않았습니다.');
                }
                response = await this.mobileCarrierService.checkStatus(verificationId, session.request.carrier);
                break;
            default:
                throw new Error(`지원하지 않는 인증 수단입니다: ${session.request.method}`);
        }
        // 세션 상태 업데이트
        session.status = response.status;
        session.updatedAt = new Date();
        return response;
    }
    /**
     * 인증 결과 확인
     */
    async verifyResult(verificationId, token) {
        const session = this.sessions.get(verificationId);
        if (!session) {
            return {
                success: false,
                verificationId,
                error: {
                    code: types_1.VerificationErrorCode.SESSION_EXPIRED,
                    message: '인증 세션이 만료되었습니다.'
                },
                timestamp: new Date()
            };
        }
        let result;
        switch (session.request.method) {
            case types_1.VerificationMethod.PASS:
                if (!this.passAuthService) {
                    throw new Error('PASS 인증 서비스가 설정되지 않았습니다.');
                }
                result = await this.passAuthService.getResult(verificationId, token);
                break;
            case types_1.VerificationMethod.MOBILE_CARRIER:
                if (!this.mobileCarrierService || !session.request.carrier) {
                    throw new Error('통신사 인증 서비스가 설정되지 않았습니다.');
                }
                result = await this.mobileCarrierService.getResult(verificationId, token, session.request.carrier);
                break;
            default:
                throw new Error(`지원하지 않는 인증 수단입니다: ${session.request.method}`);
        }
        // 결과에 따라 이벤트 발생
        if (result.success) {
            session.status = types_1.VerificationStatus.SUCCESS;
            this.emitEvent({
                type: 'completed',
                verificationId,
                timestamp: new Date(),
                data: { identity: result.identity }
            });
        }
        else {
            session.status = types_1.VerificationStatus.FAILED;
            this.emitEvent({
                type: 'failed',
                verificationId,
                timestamp: new Date(),
                data: { error: result.error }
            });
        }
        // 세션 정리
        this.sessions.delete(verificationId);
        return result;
    }
    /**
     * 인증 취소
     */
    async cancelVerification(verificationId) {
        const session = this.sessions.get(verificationId);
        if (!session) {
            return false;
        }
        let cancelled = false;
        switch (session.request.method) {
            case types_1.VerificationMethod.PASS:
                if (this.passAuthService) {
                    cancelled = await this.passAuthService.cancelVerification(verificationId);
                }
                break;
            case types_1.VerificationMethod.MOBILE_CARRIER:
                // 통신사 인증은 일반적으로 취소 API를 제공하지 않음
                cancelled = true;
                break;
        }
        if (cancelled) {
            session.status = types_1.VerificationStatus.CANCELLED;
            this.emitEvent({
                type: 'cancelled',
                verificationId,
                timestamp: new Date()
            });
            this.sessions.delete(verificationId);
        }
        return cancelled;
    }
    /**
     * 이벤트 리스너 등록
     */
    onEvent(handler) {
        const id = Math.random().toString(36).substr(2, 9);
        this.eventHandlers.set(id, handler);
        // 리스너 제거 함수 반환
        return () => {
            this.eventHandlers.delete(id);
        };
    }
    /**
     * 세션 조회
     */
    getSession(verificationId) {
        return this.sessions.get(verificationId);
    }
    /**
     * 활성 세션 목록 조회
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(session => session.status === types_1.VerificationStatus.IN_PROGRESS ||
            session.status === types_1.VerificationStatus.VERIFYING);
    }
    /**
     * 세션 생성
     */
    createSession(request) {
        const now = new Date();
        const expiresIn = request.options?.expiresIn || 300; // 기본 5분
        return {
            sessionId: this.generateSessionId(),
            request,
            status: types_1.VerificationStatus.INITIALIZING,
            createdAt: now,
            updatedAt: now,
            expiresAt: new Date(now.getTime() + expiresIn * 1000),
            attempts: 0
        };
    }
    /**
     * 세션 ID 생성
     */
    generateSessionId() {
        return `VERIFY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 요청 검증
     */
    validateRequest(request) {
        if (!request.method) {
            throw new Error('인증 수단을 선택해주세요.');
        }
        if (!request.name || request.name.trim().length < 2) {
            throw new Error('올바른 이름을 입력해주세요.');
        }
        if (!request.birthDate || !/^\d{8}$/.test(request.birthDate)) {
            throw new Error('올바른 생년월일을 입력해주세요. (YYYYMMDD)');
        }
        if (!request.phoneNumber || !/^01[0-9]{8,9}$/.test(request.phoneNumber.replace(/[^0-9]/g, ''))) {
            throw new Error('올바른 휴대폰 번호를 입력해주세요.');
        }
        // 통신사 인증인 경우 통신사 정보 필수
        if (request.method === types_1.VerificationMethod.MOBILE_CARRIER && !request.carrier) {
            throw new Error('통신사를 선택해주세요.');
        }
    }
    /**
     * 이벤트 발생
     */
    emitEvent(event) {
        this.eventHandlers.forEach(handler => {
            try {
                handler(event);
            }
            catch (error) {
                console.error('[Verification Flow] Event handler error:', error);
            }
        });
    }
    /**
     * 만료된 세션 정리
     */
    startSessionCleanup() {
        setInterval(() => {
            const now = new Date();
            const expiredSessions = [];
            this.sessions.forEach((session, id) => {
                if (session.expiresAt < now) {
                    expiredSessions.push(id);
                }
            });
            expiredSessions.forEach(id => {
                const session = this.sessions.get(id);
                if (session && session.status === types_1.VerificationStatus.IN_PROGRESS) {
                    this.emitEvent({
                        type: 'expired',
                        verificationId: id,
                        timestamp: now
                    });
                }
                this.sessions.delete(id);
            });
        }, 60000); // 1분마다 실행
    }
}
exports.VerificationFlowManager = VerificationFlowManager;
//# sourceMappingURL=VerificationFlowManager.js.map
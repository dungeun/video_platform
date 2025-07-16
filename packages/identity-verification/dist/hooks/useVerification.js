"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVerification = useVerification;
const react_1 = require("react");
const types_1 = require("../types");
const services_1 = require("../services");
/**
 * 본인인증 훅
 */
function useVerification(options = {}) {
    const { passConfig, carrierConfig, checkInterval = 3000, maxCheckAttempts = 100, onEvent } = options;
    // 상태 관리
    const [status, setStatus] = (0, react_1.useState)(types_1.VerificationStatus.IDLE);
    const [error, setError] = (0, react_1.useState)(null);
    const [identity, setIdentity] = (0, react_1.useState)(null);
    const [verificationId, setVerificationId] = (0, react_1.useState)(null);
    // 서비스 인스턴스
    const flowManagerRef = (0, react_1.useRef)(null);
    const checkIntervalRef = (0, react_1.useRef)(null);
    const checkAttemptsRef = (0, react_1.useRef)(0);
    // 서비스 초기화
    (0, react_1.useEffect)(() => {
        const services = {};
        if (passConfig) {
            services.pass = new services_1.PassAuthService(passConfig);
        }
        if (carrierConfig) {
            services.mobileCarrier = new services_1.MobileCarrierService(carrierConfig);
        }
        flowManagerRef.current = new services_1.VerificationFlowManager(services);
        // 이벤트 리스너 등록
        if (onEvent) {
            const unsubscribe = flowManagerRef.current.onEvent(onEvent);
            return unsubscribe;
        }
    }, [passConfig, carrierConfig, onEvent]);
    // 정리 함수
    (0, react_1.useEffect)(() => {
        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, []);
    /**
     * 인증 시작
     */
    const startVerification = (0, react_1.useCallback)(async (request) => {
        try {
            if (!flowManagerRef.current) {
                throw new Error('인증 서비스가 초기화되지 않았습니다.');
            }
            // 상태 초기화
            setStatus(types_1.VerificationStatus.INITIALIZING);
            setError(null);
            setIdentity(null);
            checkAttemptsRef.current = 0;
            // 인증 시작
            const response = await flowManagerRef.current.startVerification(request);
            if (response.status === types_1.VerificationStatus.FAILED) {
                setStatus(types_1.VerificationStatus.FAILED);
                setError(response.error || {
                    code: 'UNKNOWN_ERROR',
                    message: '알 수 없는 오류가 발생했습니다.'
                });
                return;
            }
            // 인증 ID 저장
            setVerificationId(response.verificationId);
            setStatus(response.status);
            // 팝업 또는 리다이렉트 처리
            if (response.authUrl) {
                const width = 450;
                const height = 700;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                window.open(response.authUrl, 'identity-verification', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
            }
            // 상태 체크 시작
            startStatusCheck(response.verificationId);
        }
        catch (err) {
            console.error('[useVerification] Start verification error:', err);
            setStatus(types_1.VerificationStatus.FAILED);
            setError({
                code: 'UNKNOWN_ERROR',
                message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
            });
        }
    }, []);
    /**
     * 상태 체크 시작
     */
    const startStatusCheck = (0, react_1.useCallback)((id) => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
        }
        checkIntervalRef.current = setInterval(async () => {
            if (!flowManagerRef.current)
                return;
            checkAttemptsRef.current++;
            // 최대 시도 횟수 체크
            if (checkAttemptsRef.current >= maxCheckAttempts) {
                if (checkIntervalRef.current) {
                    clearInterval(checkIntervalRef.current);
                }
                setStatus(types_1.VerificationStatus.EXPIRED);
                setError({
                    code: 'SESSION_EXPIRED',
                    message: '인증 시간이 만료되었습니다.'
                });
                return;
            }
            // 상태 확인
            const response = await flowManagerRef.current.checkStatus(id);
            setStatus(response.status);
            // 완료 상태 처리
            if ([
                types_1.VerificationStatus.SUCCESS,
                types_1.VerificationStatus.FAILED,
                types_1.VerificationStatus.EXPIRED,
                types_1.VerificationStatus.CANCELLED
            ].includes(response.status)) {
                if (checkIntervalRef.current) {
                    clearInterval(checkIntervalRef.current);
                }
                if (response.status === types_1.VerificationStatus.SUCCESS) {
                    // 결과 조회는 별도로 처리 (토큰 필요)
                    // 실제 구현에서는 콜백 URL로 토큰을 받아서 처리
                }
                else if (response.error) {
                    setError(response.error);
                }
            }
        }, checkInterval);
    }, [checkInterval, maxCheckAttempts]);
    /**
     * 상태 확인 (수동)
     */
    const checkStatus = (0, react_1.useCallback)(async () => {
        if (!flowManagerRef.current || !verificationId)
            return;
        try {
            const response = await flowManagerRef.current.checkStatus(verificationId);
            setStatus(response.status);
            if (response.error) {
                setError(response.error);
            }
        }
        catch (err) {
            console.error('[useVerification] Check status error:', err);
        }
    }, [verificationId]);
    /**
     * 인증 취소
     */
    const cancelVerification = (0, react_1.useCallback)(async () => {
        if (!flowManagerRef.current || !verificationId)
            return;
        try {
            await flowManagerRef.current.cancelVerification(verificationId);
            setStatus(types_1.VerificationStatus.CANCELLED);
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        }
        catch (err) {
            console.error('[useVerification] Cancel verification error:', err);
        }
    }, [verificationId]);
    /**
     * 상태 초기화
     */
    const reset = (0, react_1.useCallback)(() => {
        setStatus(types_1.VerificationStatus.IDLE);
        setError(null);
        setIdentity(null);
        setVerificationId(null);
        checkAttemptsRef.current = 0;
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
        }
    }, []);
    return {
        status,
        error,
        identity,
        verificationId,
        startVerification,
        checkStatus,
        cancelVerification,
        reset
    };
}
//# sourceMappingURL=useVerification.js.map
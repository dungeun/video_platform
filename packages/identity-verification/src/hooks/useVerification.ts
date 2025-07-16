import { useState, useCallback, useRef, useEffect } from 'react';
import {
  VerificationRequest,
  VerificationResponse,
  VerificationResult,
  VerificationStatus,
  VerificationError,
  UserIdentity,
  VerificationEvent,
  PassAuthConfig
} from '../types';
import {
  PassAuthService,
  MobileCarrierService,
  VerificationFlowManager
} from '../services';

interface UseVerificationOptions {
  /** PASS 인증 설정 */
  passConfig?: PassAuthConfig;
  /** 통신사 인증 설정 */
  carrierConfig?: {
    skt?: { endpoint: string; apiKey: string };
    kt?: { endpoint: string; apiKey: string };
    lgu?: { endpoint: string; apiKey: string };
  };
  /** 상태 체크 주기 (ms) */
  checkInterval?: number;
  /** 최대 체크 횟수 */
  maxCheckAttempts?: number;
  /** 이벤트 핸들러 */
  onEvent?: (event: VerificationEvent) => void;
}

interface UseVerificationReturn {
  /** 현재 상태 */
  status: VerificationStatus;
  /** 오류 정보 */
  error: VerificationError | null;
  /** 인증된 사용자 정보 */
  identity: UserIdentity | null;
  /** 인증 ID */
  verificationId: string | null;
  /** 인증 시작 */
  startVerification: (request: VerificationRequest) => Promise<void>;
  /** 상태 확인 */
  checkStatus: () => Promise<void>;
  /** 인증 취소 */
  cancelVerification: () => Promise<void>;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * 본인인증 훅
 */
export function useVerification(
  options: UseVerificationOptions = {}
): UseVerificationReturn {
  const {
    passConfig,
    carrierConfig,
    checkInterval = 3000,
    maxCheckAttempts = 100,
    onEvent
  } = options;

  // 상태 관리
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.IDLE);
  const [error, setError] = useState<VerificationError | null>(null);
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // 서비스 인스턴스
  const flowManagerRef = useRef<VerificationFlowManager | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkAttemptsRef = useRef(0);

  // 서비스 초기화
  useEffect(() => {
    const services: any = {};

    if (passConfig) {
      services.pass = new PassAuthService(passConfig);
    }

    if (carrierConfig) {
      services.mobileCarrier = new MobileCarrierService(carrierConfig);
    }

    flowManagerRef.current = new VerificationFlowManager(services);

    // 이벤트 리스너 등록
    if (onEvent) {
      const unsubscribe = flowManagerRef.current.onEvent(onEvent);
      return unsubscribe;
    }
  }, [passConfig, carrierConfig, onEvent]);

  // 정리 함수
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  /**
   * 인증 시작
   */
  const startVerification = useCallback(async (request: VerificationRequest) => {
    try {
      if (!flowManagerRef.current) {
        throw new Error('인증 서비스가 초기화되지 않았습니다.');
      }

      // 상태 초기화
      setStatus(VerificationStatus.INITIALIZING);
      setError(null);
      setIdentity(null);
      checkAttemptsRef.current = 0;

      // 인증 시작
      const response = await flowManagerRef.current.startVerification(request);
      
      if (response.status === VerificationStatus.FAILED) {
        setStatus(VerificationStatus.FAILED);
        setError(response.error || {
          code: 'UNKNOWN_ERROR',
          message: '알 수 없는 오류가 발생했습니다.'
        } as VerificationError);
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

        window.open(
          response.authUrl,
          'identity-verification',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
      }

      // 상태 체크 시작
      startStatusCheck(response.verificationId);
    } catch (err) {
      console.error('[useVerification] Start verification error:', err);
      setStatus(VerificationStatus.FAILED);
      setError({
        code: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      } as VerificationError);
    }
  }, []);

  /**
   * 상태 체크 시작
   */
  const startStatusCheck = useCallback((id: string) => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    checkIntervalRef.current = setInterval(async () => {
      if (!flowManagerRef.current) return;

      checkAttemptsRef.current++;

      // 최대 시도 횟수 체크
      if (checkAttemptsRef.current >= maxCheckAttempts) {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        setStatus(VerificationStatus.EXPIRED);
        setError({
          code: 'SESSION_EXPIRED',
          message: '인증 시간이 만료되었습니다.'
        } as VerificationError);
        return;
      }

      // 상태 확인
      const response = await flowManagerRef.current.checkStatus(id);
      setStatus(response.status);

      // 완료 상태 처리
      if ([
        VerificationStatus.SUCCESS,
        VerificationStatus.FAILED,
        VerificationStatus.EXPIRED,
        VerificationStatus.CANCELLED
      ].includes(response.status)) {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }

        if (response.status === VerificationStatus.SUCCESS) {
          // 결과 조회는 별도로 처리 (토큰 필요)
          // 실제 구현에서는 콜백 URL로 토큰을 받아서 처리
        } else if (response.error) {
          setError(response.error);
        }
      }
    }, checkInterval);
  }, [checkInterval, maxCheckAttempts]);

  /**
   * 상태 확인 (수동)
   */
  const checkStatus = useCallback(async () => {
    if (!flowManagerRef.current || !verificationId) return;

    try {
      const response = await flowManagerRef.current.checkStatus(verificationId);
      setStatus(response.status);
      
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error('[useVerification] Check status error:', err);
    }
  }, [verificationId]);

  /**
   * 인증 취소
   */
  const cancelVerification = useCallback(async () => {
    if (!flowManagerRef.current || !verificationId) return;

    try {
      await flowManagerRef.current.cancelVerification(verificationId);
      setStatus(VerificationStatus.CANCELLED);
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    } catch (err) {
      console.error('[useVerification] Cancel verification error:', err);
    }
  }, [verificationId]);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setStatus(VerificationStatus.IDLE);
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
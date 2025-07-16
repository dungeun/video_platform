/**
 * Identity Verification Types for Korean PASS Authentication
 */

/**
 * 본인인증 수단 유형
 */
export enum VerificationMethod {
  PASS = 'PASS',                    // PASS 인증
  MOBILE_CARRIER = 'MOBILE_CARRIER', // 통신사 인증
  KAKAO = 'KAKAO',                  // 카카오 인증
  NAVER = 'NAVER',                  // 네이버 인증
  TOSS = 'TOSS',                    // 토스 인증
  PAYCO = 'PAYCO',                  // 페이코 인증
  KB = 'KB'                         // KB국민은행 인증
}

/**
 * 통신사 유형
 */
export enum MobileCarrier {
  SKT = 'SKT',      // SK텔레콤
  KT = 'KT',        // KT
  LGU = 'LGU',      // LG유플러스
  MVNO = 'MVNO'     // 알뜰폰
}

/**
 * 인증 상태
 */
export enum VerificationStatus {
  IDLE = 'IDLE',                        // 대기
  INITIALIZING = 'INITIALIZING',        // 초기화 중
  IN_PROGRESS = 'IN_PROGRESS',          // 진행 중
  VERIFYING = 'VERIFYING',              // 검증 중
  SUCCESS = 'SUCCESS',                  // 성공
  FAILED = 'FAILED',                    // 실패
  EXPIRED = 'EXPIRED',                  // 만료
  CANCELLED = 'CANCELLED'               // 취소됨
}

/**
 * 오류 코드
 */
export enum VerificationErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_BIRTH_DATE = 'INVALID_BIRTH_DATE',
  INVALID_NAME = 'INVALID_NAME',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 본인인증 요청 데이터
 */
export interface VerificationRequest {
  /** 인증 수단 */
  method: VerificationMethod;
  /** 사용자 이름 */
  name: string;
  /** 생년월일 (YYYYMMDD) */
  birthDate: string;
  /** 성별 (M/F) */
  gender?: 'M' | 'F';
  /** 휴대폰 번호 */
  phoneNumber: string;
  /** 통신사 */
  carrier?: MobileCarrier;
  /** 내/외국인 구분 */
  nationality?: 'korean' | 'foreigner';
  /** 리턴 URL */
  returnUrl?: string;
  /** 추가 옵션 */
  options?: VerificationOptions;
}

/**
 * 인증 옵션
 */
export interface VerificationOptions {
  /** 중복 가입 확인 여부 */
  checkDuplicate?: boolean;
  /** 성인 인증 필요 여부 */
  requireAdult?: boolean;
  /** 인증 유효 시간 (초) */
  expiresIn?: number;
  /** 인증 후 리다이렉트 여부 */
  autoRedirect?: boolean;
  /** 커스텀 메시지 */
  customMessage?: string;
}

/**
 * 본인인증 응답 데이터
 */
export interface VerificationResponse {
  /** 인증 ID */
  verificationId: string;
  /** 인증 상태 */
  status: VerificationStatus;
  /** 인증 토큰 */
  token?: string;
  /** 인증 URL (팝업/리다이렉트용) */
  authUrl?: string;
  /** 만료 시간 */
  expiresAt?: Date;
  /** 오류 정보 */
  error?: VerificationError;
}

/**
 * 인증 오류 정보
 */
export interface VerificationError {
  /** 오류 코드 */
  code: VerificationErrorCode;
  /** 오류 메시지 */
  message: string;
  /** 상세 정보 */
  details?: Record<string, any>;
}

/**
 * 사용자 신원 정보
 */
export interface UserIdentity {
  /** 고유 식별자 (CI) */
  ci: string;
  /** 중복가입확인정보 (DI) */
  di?: string;
  /** 이름 */
  name: string;
  /** 생년월일 */
  birthDate: string;
  /** 성별 */
  gender: 'M' | 'F';
  /** 휴대폰 번호 */
  phoneNumber: string;
  /** 통신사 */
  carrier: MobileCarrier;
  /** 내/외국인 구분 */
  nationality: 'korean' | 'foreigner';
  /** 성인 여부 */
  isAdult: boolean;
  /** 인증 시간 */
  verifiedAt: Date;
  /** 인증 수단 */
  verificationMethod: VerificationMethod;
}

/**
 * 인증 결과
 */
export interface VerificationResult {
  /** 인증 성공 여부 */
  success: boolean;
  /** 인증 ID */
  verificationId: string;
  /** 사용자 신원 정보 */
  identity?: UserIdentity;
  /** 오류 정보 */
  error?: VerificationError;
  /** 인증 시간 */
  timestamp: Date;
}

/**
 * 인증 세션
 */
export interface VerificationSession {
  /** 세션 ID */
  sessionId: string;
  /** 인증 요청 정보 */
  request: VerificationRequest;
  /** 현재 상태 */
  status: VerificationStatus;
  /** 생성 시간 */
  createdAt: Date;
  /** 업데이트 시간 */
  updatedAt: Date;
  /** 만료 시간 */
  expiresAt: Date;
  /** 시도 횟수 */
  attempts: number;
}

/**
 * PASS 인증 설정
 */
export interface PassAuthConfig {
  /** 서비스 ID */
  serviceId: string;
  /** 서비스 키 */
  serviceKey: string;
  /** API 엔드포인트 */
  apiEndpoint: string;
  /** 콜백 URL */
  callbackUrl: string;
  /** 타임아웃 (초) */
  timeout?: number;
  /** 재시도 횟수 */
  maxRetries?: number;
}

/**
 * 인증 이벤트
 */
export interface VerificationEvent {
  /** 이벤트 타입 */
  type: 'started' | 'completed' | 'failed' | 'expired' | 'cancelled';
  /** 인증 ID */
  verificationId: string;
  /** 타임스탬프 */
  timestamp: Date;
  /** 추가 데이터 */
  data?: any;
}

/**
 * 인증 통계
 */
export interface VerificationStats {
  /** 전체 인증 시도 */
  totalAttempts: number;
  /** 성공한 인증 */
  successCount: number;
  /** 실패한 인증 */
  failureCount: number;
  /** 평균 인증 시간 (초) */
  averageTime: number;
  /** 인증 수단별 통계 */
  byMethod: Record<VerificationMethod, {
    attempts: number;
    success: number;
    failure: number;
  }>;
}
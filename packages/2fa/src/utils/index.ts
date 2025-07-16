/**
 * 2FA 유틸리티 함수들
 */

import { TwoFactorError } from '../types';

/**
 * 2FA 에러 메시지 변환
 */
export const getTwoFactorErrorMessage = (error: TwoFactorError): string => {
  const messages: Record<TwoFactorError, string> = {
    'INVALID_TOKEN': '잘못된 인증 코드입니다.',
    'EXPIRED_TOKEN': '인증 코드가 만료되었습니다.',
    'INVALID_BACKUP_CODE': '잘못된 백업 코드입니다.',
    'BACKUP_CODE_ALREADY_USED': '이미 사용된 백업 코드입니다.',
    'TOO_MANY_ATTEMPTS': '너무 많은 시도로 인해 제한되었습니다.',
    'ACCOUNT_LOCKED': '계정이 일시적으로 잠겼습니다.',
    'SETUP_NOT_COMPLETED': '2FA 설정이 완료되지 않았습니다.',
    'INVALID_SECRET': '잘못된 시크릿입니다.',
    'RECOVERY_METHOD_NOT_FOUND': '복구 방법을 찾을 수 없습니다.',
    'RECOVERY_CODE_EXPIRED': '복구 코드가 만료되었습니다.'
  };

  return messages[error] || '알 수 없는 오류가 발생했습니다.';
};

/**
 * TOTP 코드 포맷팅 (3자리씩 공백으로 구분)
 */
export const formatTotpCode = (code: string): string => {
  const cleanCode = code.replace(/\D/g, '');
  if (cleanCode.length <= 3) return cleanCode;
  return cleanCode.slice(0, 3) + ' ' + cleanCode.slice(3, 6);
};

/**
 * 백업 코드 포맷팅 (마스킹)
 */
export const maskBackupCode = (code: string): string => {
  const parts = code.split('-');
  return parts.map(part => {
    if (part.length <= 2) return part;
    return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
  }).join('-');
};

/**
 * 백업 코드 유효성 검사
 */
export const isValidBackupCodeFormat = (code: string): boolean => {
  // 기본적으로 영숫자와 하이픈만 허용
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code.toUpperCase());
};

/**
 * TOTP 코드 유효성 검사
 */
export const isValidTotpCode = (code: string): boolean => {
  const cleanCode = code.replace(/\s/g, '');
  return /^\d{6}$/.test(cleanCode);
};

/**
 * 시간 포맷팅 (남은 시간 표시)
 */
export const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return '만료됨';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}분 ${remainingSeconds}초`;
  }
  
  return `${remainingSeconds}초`;
};

/**
 * 날짜 포맷팅
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 보안 강도 계산
 */
export const calculateSecurityScore = (config: {
  hasTwoFactor: boolean;
  hasBackupCodes: boolean;
  hasRecoveryMethods: boolean;
  recentlyVerified: boolean;
}): {
  score: number;
  level: 'low' | 'medium' | 'high';
  recommendations: string[];
} => {
  let score = 0;
  const recommendations: string[] = [];

  if (config.hasTwoFactor) {
    score += 40;
  } else {
    recommendations.push('2단계 인증을 활성화하세요');
  }

  if (config.hasBackupCodes) {
    score += 25;
  } else {
    recommendations.push('백업 코드를 생성하세요');
  }

  if (config.hasRecoveryMethods) {
    score += 20;
  } else {
    recommendations.push('복구 방법을 설정하세요');
  }

  if (config.recentlyVerified) {
    score += 15;
  } else if (config.hasTwoFactor) {
    recommendations.push('최근에 2FA 인증을 수행하세요');
  }

  let level: 'low' | 'medium' | 'high';
  if (score >= 80) {
    level = 'high';
  } else if (score >= 50) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { score, level, recommendations };
};

/**
 * QR 코드 크기 계산
 */
export const calculateQrCodeSize = (content: string): number => {
  // 기본 크기에서 내용 길이에 따라 조정
  const baseSize = 200;
  const extraSize = Math.floor(content.length / 10) * 10;
  return Math.min(baseSize + extraSize, 400);
};

/**
 * 디바이스 타입 감지
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  
  if (isMobile && !isTablet) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
};

/**
 * 클립보드 지원 여부 확인
 */
export const isClipboardSupported = (): boolean => {
  return 'clipboard' in navigator && 'writeText' in navigator.clipboard;
};

/**
 * 안전한 랜덤 문자열 생성
 */
export const generateSecureRandom = (length: number): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
  } else {
    // 대체 방법 (보안성이 떨어짐)
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
};

/**
 * 브라우저 로컬 스토리지 지원 여부 확인
 */
export const isLocalStorageSupported = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * 2FA 설정 완료율 계산
 */
export const calculateSetupProgress = (steps: {
  secretGenerated: boolean;
  qrCodeScanned: boolean;
  tokenVerified: boolean;
  backupCodesSaved: boolean;
  recoveryMethodsSet: boolean;
}): {
  progress: number;
  currentStep: string;
  nextStep: string;
} => {
  const stepsList = [
    { key: 'secretGenerated', name: '시크릿 생성', next: 'QR 코드 스캔' },
    { key: 'qrCodeScanned', name: 'QR 코드 스캔', next: '토큰 검증' },
    { key: 'tokenVerified', name: '토큰 검증', next: '백업 코드 저장' },
    { key: 'backupCodesSaved', name: '백업 코드 저장', next: '복구 방법 설정' },
    { key: 'recoveryMethodsSet', name: '복구 방법 설정', next: '설정 완료' }
  ];

  let completedSteps = 0;
  let currentStep = stepsList[0].name;
  let nextStep = stepsList[0].next;

  for (let i = 0; i < stepsList.length; i++) {
    const step = stepsList[i];
    if (steps[step.key as keyof typeof steps]) {
      completedSteps++;
      if (i < stepsList.length - 1) {
        currentStep = stepsList[i + 1].name;
        nextStep = stepsList[i + 1].next;
      } else {
        currentStep = '설정 완료';
        nextStep = '';
      }
    } else {
      break;
    }
  }

  const progress = (completedSteps / stepsList.length) * 100;

  return { progress, currentStep, nextStep };
};
import React from 'react';
import { VerificationError as ErrorType, VerificationErrorCode } from '../types';

interface VerificationErrorProps {
  /** 오류 정보 */
  error: ErrorType;
  /** 재시도 콜백 */
  onRetry?: () => void;
  /** 취소 콜백 */
  onCancel?: () => void;
  /** 커스텀 스타일 */
  className?: string;
}

/**
 * 본인인증 오류 화면 컴포넌트
 */
export const VerificationError: React.FC<VerificationErrorProps> = ({
  error,
  onRetry,
  onCancel,
  className = ''
}) => {
  const getErrorInfo = (code: VerificationErrorCode) => {
    switch (code) {
      case VerificationErrorCode.INVALID_REQUEST:
        return {
          title: '잘못된 요청',
          description: '입력하신 정보를 다시 확인해주세요.',
          icon: '⚠️',
          suggestions: [
            '이름이 정확한지 확인해주세요.',
            '생년월일 형식(YYYYMMDD)이 올바른지 확인해주세요.',
            '휴대폰 번호가 정확한지 확인해주세요.'
          ]
        };
        
      case VerificationErrorCode.INVALID_PHONE:
        return {
          title: '휴대폰 번호 오류',
          description: '올바른 휴대폰 번호를 입력해주세요.',
          icon: '📱',
          suggestions: [
            '휴대폰 번호 형식을 확인해주세요.',
            '현재 사용 중인 번호인지 확인해주세요.',
            '통신사 정보가 정확한지 확인해주세요.'
          ]
        };
        
      case VerificationErrorCode.INVALID_BIRTH_DATE:
        return {
          title: '생년월일 오류',
          description: '올바른 생년월일을 입력해주세요.',
          icon: '📅',
          suggestions: [
            'YYYYMMDD 형식으로 입력해주세요.',
            '예: 19900101'
          ]
        };
        
      case VerificationErrorCode.INVALID_NAME:
        return {
          title: '이름 오류',
          description: '올바른 이름을 입력해주세요.',
          icon: '👤',
          suggestions: [
            '실명을 정확히 입력해주세요.',
            '특수문자나 숫자는 사용할 수 없습니다.'
          ]
        };
        
      case VerificationErrorCode.VERIFICATION_FAILED:
        return {
          title: '인증 실패',
          description: '본인인증에 실패했습니다.',
          icon: '❌',
          suggestions: [
            '입력하신 정보가 정확한지 다시 확인해주세요.',
            '본인 명의의 휴대폰인지 확인해주세요.',
            '다른 인증 수단을 시도해보세요.'
          ]
        };
        
      case VerificationErrorCode.SESSION_EXPIRED:
        return {
          title: '세션 만료',
          description: '인증 시간이 초과되었습니다.',
          icon: '⏰',
          suggestions: [
            '다시 인증을 시도해주세요.',
            '인증은 5분 이내에 완료해주세요.'
          ]
        };
        
      case VerificationErrorCode.SERVICE_UNAVAILABLE:
        return {
          title: '서비스 일시 중단',
          description: '일시적으로 서비스를 사용할 수 없습니다.',
          icon: '🔧',
          suggestions: [
            '잠시 후 다시 시도해주세요.',
            '다른 인증 수단을 이용해주세요.'
          ]
        };
        
      case VerificationErrorCode.RATE_LIMIT_EXCEEDED:
        return {
          title: '요청 제한 초과',
          description: '너무 많은 인증 시도가 있었습니다.',
          icon: '🚫',
          suggestions: [
            '잠시 후 다시 시도해주세요.',
            '반복적인 실패 시 고객센터에 문의해주세요.'
          ]
        };
        
      default:
        return {
          title: '인증 오류',
          description: error.message || '알 수 없는 오류가 발생했습니다.',
          icon: '❓',
          suggestions: [
            '다시 시도해주세요.',
            '문제가 지속되면 고객센터에 문의해주세요.'
          ]
        };
    }
  };

  const errorInfo = getErrorInfo(error.code);

  return (
    <div className={`verification-error ${className}`}>
      <div className="text-center py-8">
        {/* 오류 아이콘 */}
        <div className="text-6xl mb-4">{errorInfo.icon}</div>
        
        {/* 오류 제목 */}
        <h3 className="text-2xl font-bold text-red-600 mb-2">
          {errorInfo.title}
        </h3>
        
        {/* 오류 설명 */}
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {errorInfo.description}
        </p>
        
        {/* 해결 방법 제안 */}
        {errorInfo.suggestions.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              해결 방법
            </h4>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* 오류 코드 */}
        <p className="text-xs text-gray-500 mb-6">
          오류 코드: {error.code}
        </p>
        
        {/* 버튼 그룹 */}
        <div className="flex justify-center space-x-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          )}
        </div>
        
        {/* 고객센터 안내 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>문제가 계속되나요?</p>
          <a href="#" className="text-blue-500 hover:underline">
            고객센터 문의하기
          </a>
        </div>
      </div>
    </div>
  );
};
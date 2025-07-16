import React from 'react';
import { UserIdentity } from '../types';
import { maskPhoneNumber, maskName } from '../utils/formatters';

interface VerificationSuccessProps {
  /** 인증된 사용자 정보 */
  identity: UserIdentity;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 커스텀 스타일 */
  className?: string;
}

/**
 * 본인인증 성공 화면 컴포넌트
 */
export const VerificationSuccess: React.FC<VerificationSuccessProps> = ({
  identity,
  onClose,
  className = ''
}) => {
  return (
    <div className={`verification-success ${className}`}>
      <div className="text-center py-8">
        {/* 성공 아이콘 */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <svg
            className="w-12 h-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        {/* 제목 */}
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          본인인증 완료
        </h3>
        
        {/* 메시지 */}
        <p className="text-gray-600 mb-6">
          본인인증이 성공적으로 완료되었습니다.
        </p>
        
        {/* 인증 정보 표시 */}
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            인증 정보
          </h4>
          
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">이름</span>
              <span className="font-medium text-gray-800">
                {maskName(identity.name)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">생년월일</span>
              <span className="font-medium text-gray-800">
                {identity.birthDate.substring(0, 4)}.{identity.birthDate.substring(4, 6)}.{identity.birthDate.substring(6, 8)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">성별</span>
              <span className="font-medium text-gray-800">
                {identity.gender === 'M' ? '남성' : '여성'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">휴대폰 번호</span>
              <span className="font-medium text-gray-800">
                {maskPhoneNumber(identity.phoneNumber)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">통신사</span>
              <span className="font-medium text-gray-800">
                {identity.carrier}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">인증 수단</span>
              <span className="font-medium text-gray-800">
                {getVerificationMethodName(identity.verificationMethod)}
              </span>
            </div>
            
            {identity.isAdult && (
              <div className="flex justify-between">
                <span className="text-gray-600">성인 인증</span>
                <span className="font-medium text-green-600">
                  완료
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* 인증 시간 */}
        <p className="text-sm text-gray-500 mb-6">
          인증 시간: {identity.verifiedAt.toLocaleString('ko-KR')}
        </p>
        
        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          className="px-8 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
};

/**
 * 인증 수단 이름 반환
 */
function getVerificationMethodName(method: string): string {
  const methodNames: Record<string, string> = {
    'PASS': 'PASS 인증',
    'MOBILE_CARRIER': '휴대폰 인증',
    'KAKAO': '카카오 인증',
    'NAVER': '네이버 인증',
    'TOSS': '토스 인증',
    'PAYCO': '페이코 인증',
    'KB': 'KB국민은행 인증'
  };
  
  return methodNames[method] || method;
}
import React from 'react';
import { VerificationMethod } from '../types';

interface VerificationMethodSelectorProps {
  /** 사용 가능한 인증 수단 */
  availableMethods: VerificationMethod[];
  /** 선택 콜백 */
  onSelect: (method: VerificationMethod) => void;
  /** 취소 콜백 */
  onCancel?: () => void;
}

/**
 * 본인인증 수단 선택 컴포넌트
 */
export const VerificationMethodSelector: React.FC<VerificationMethodSelectorProps> = ({
  availableMethods,
  onSelect,
  onCancel
}) => {
  const methodInfo = {
    [VerificationMethod.PASS]: {
      name: 'PASS 인증',
      description: '통신 3사 PASS 앱으로 간편하게 인증',
      icon: '📱',
      color: 'bg-blue-500'
    },
    [VerificationMethod.MOBILE_CARRIER]: {
      name: '휴대폰 인증',
      description: '휴대폰 번호로 본인인증',
      icon: '📞',
      color: 'bg-green-500'
    },
    [VerificationMethod.KAKAO]: {
      name: '카카오 인증',
      description: '카카오톡으로 간편 인증',
      icon: '💬',
      color: 'bg-yellow-500'
    },
    [VerificationMethod.NAVER]: {
      name: '네이버 인증',
      description: '네이버로 간편 인증',
      icon: '🟢',
      color: 'bg-green-600'
    },
    [VerificationMethod.TOSS]: {
      name: '토스 인증',
      description: '토스로 간편 인증',
      icon: '💳',
      color: 'bg-blue-600'
    },
    [VerificationMethod.PAYCO]: {
      name: '페이코 인증',
      description: '페이코로 간편 인증',
      icon: '🔴',
      color: 'bg-red-500'
    },
    [VerificationMethod.KB]: {
      name: 'KB국민은행 인증',
      description: 'KB국민은행 앱으로 인증',
      icon: '🏦',
      color: 'bg-yellow-600'
    }
  };

  return (
    <div className="verification-method-selector">
      <p className="text-gray-600 mb-6">
        본인인증을 위한 방법을 선택해주세요.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableMethods.map((method) => {
          const info = methodInfo[method];
          
          return (
            <button
              key={method}
              onClick={() => onSelect(method)}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-3">
                <div className={`w-12 h-12 rounded-full ${info.color} flex items-center justify-center text-white text-xl`}>
                  {info.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {info.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {info.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {onCancel && (
        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { VerificationStatus as Status } from '../types';

interface VerificationStatusProps {
  /** 현재 상태 */
  status: Status;
  /** 취소 콜백 */
  onCancel?: () => void;
  /** 커스텀 스타일 */
  className?: string;
}

/**
 * 본인인증 진행 상태 표시 컴포넌트
 */
export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  onCancel,
  className = ''
}) => {
  const [dots, setDots] = useState('');
  
  // 로딩 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const statusInfo = {
    [Status.IDLE]: {
      title: '대기 중',
      message: '본인인증을 시작해주세요.',
      icon: '⏳',
      color: 'text-gray-600'
    },
    [Status.INITIALIZING]: {
      title: '초기화 중',
      message: '인증 서비스를 준비하고 있습니다.',
      icon: '🔧',
      color: 'text-blue-600'
    },
    [Status.IN_PROGRESS]: {
      title: '인증 진행 중',
      message: '본인인증을 진행해주세요. 새 창이 열렸다면 해당 창에서 인증을 완료해주세요.',
      icon: '📱',
      color: 'text-blue-600'
    },
    [Status.VERIFYING]: {
      title: '검증 중',
      message: '인증 정보를 확인하고 있습니다.',
      icon: '🔍',
      color: 'text-green-600'
    },
    [Status.SUCCESS]: {
      title: '인증 완료',
      message: '본인인증이 성공적으로 완료되었습니다.',
      icon: '✅',
      color: 'text-green-600'
    },
    [Status.FAILED]: {
      title: '인증 실패',
      message: '본인인증에 실패했습니다. 다시 시도해주세요.',
      icon: '❌',
      color: 'text-red-600'
    },
    [Status.EXPIRED]: {
      title: '인증 만료',
      message: '인증 시간이 만료되었습니다. 다시 시도해주세요.',
      icon: '⏰',
      color: 'text-orange-600'
    },
    [Status.CANCELLED]: {
      title: '인증 취소',
      message: '본인인증이 취소되었습니다.',
      icon: '🚫',
      color: 'text-gray-600'
    }
  };

  const info = statusInfo[status] || statusInfo[Status.IDLE];
  const isLoading = [Status.INITIALIZING, Status.IN_PROGRESS, Status.VERIFYING].includes(status);

  return (
    <div className={`verification-status ${className}`}>
      <div className="text-center py-12">
        {/* 아이콘 */}
        <div className={`text-6xl mb-4 ${isLoading ? 'animate-pulse' : ''}`}>
          {info.icon}
        </div>
        
        {/* 제목 */}
        <h3 className={`text-2xl font-bold mb-2 ${info.color}`}>
          {info.title}{isLoading ? dots : ''}
        </h3>
        
        {/* 메시지 */}
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {info.message}
        </p>
        
        {/* 진행 바 (로딩 중일 때) */}
        {isLoading && (
          <div className="w-64 mx-auto mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-progress" />
            </div>
          </div>
        )}
        
        {/* 안내 메시지 (인증 진행 중일 때) */}
        {status === Status.IN_PROGRESS && (
          <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto mb-6">
            <p className="text-sm text-blue-700">
              <strong>안내:</strong> 새 창에서 본인인증을 진행해주세요.
              <br />
              팝업 차단이 되어있다면 팝업을 허용해주세요.
            </p>
          </div>
        )}
        
        {/* 취소 버튼 */}
        {onCancel && isLoading && (
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            인증 취소
          </button>
        )}
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
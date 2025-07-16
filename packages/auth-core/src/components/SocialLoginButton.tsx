import React from 'react';
import { Result } from '@repo/core';

export type SocialProvider = 'google' | 'kakao' | 'naver' | 'facebook' | 'apple';

export interface SocialLoginButtonProps {
  provider: SocialProvider;
  onLogin: (provider: SocialProvider) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined';
  className?: string;
  children?: React.ReactNode;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    bgColor: 'bg-white',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    hoverBg: 'hover:bg-gray-50'
  },
  kakao: {
    name: 'Kakao',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C7.03 3 3 6.26 3 10.25c0 2.65 1.76 4.97 4.41 6.33l-1.08 3.98c-.07.27.21.49.45.35l4.81-3.11c.47.05.95.08 1.41.08 4.97 0 9-3.26 9-7.25S16.97 3 12 3z"/>
      </svg>
    ),
    bgColor: 'bg-yellow-400',
    textColor: 'text-black',
    borderColor: 'border-yellow-400',
    hoverBg: 'hover:bg-yellow-500'
  },
  naver: {
    name: 'Naver',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
      </svg>
    ),
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    borderColor: 'border-green-500',
    hoverBg: 'hover:bg-green-600'
  },
  facebook: {
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
    hoverBg: 'hover:bg-blue-700'
  },
  apple: {
    name: 'Apple',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.017 0C8.396 0 8.025.24 8.025 4.314v3.292H5.77v4.095h2.256V24h4.552V11.701h3.056l.465-4.095H12.58V6.314c0-.895.191-1.243 1.04-1.243h2.442V0h-3.005c-.011 0-.031 0-.04 0z"/>
      </svg>
    ),
    bgColor: 'bg-black',
    textColor: 'text-white',
    borderColor: 'border-black',
    hoverBg: 'hover:bg-gray-800'
  }
};

const sizeConfig = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg'
};

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onLogin,
  disabled = false,
  loading = false,
  size = 'md',
  variant = 'filled',
  className = '',
  children
}) => {
  const config = providerConfig[provider];
  const sizeClass = sizeConfig[size];

  const handleClick = async () => {
    if (disabled || loading) return;
    
    try {
      await onLogin(provider);
    } catch (error) {
      console.error(`${config.name} 로그인 오류:`, error);
    }
  };

  const getButtonStyles = () => {
    if (variant === 'outlined') {
      return `border-2 ${config.borderColor} bg-white ${config.textColor} hover:bg-gray-50`;
    }
    
    return `${config.bgColor} ${config.textColor} ${config.hoverBg}`;
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-3 
        ${sizeClass} 
        ${getButtonStyles()}
        font-medium rounded-lg transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${className}
      `}
      type="button"
    >
      {loading ? <LoadingSpinner /> : config.icon}
      
      <span>
        {children || (
          loading 
            ? `${config.name} 로그인 중...`
            : `${config.name}로 로그인`
        )}
      </span>
    </button>
  );
};

// 소셜 로그인 버튼 그룹 컴포넌트
export interface SocialLoginGroupProps {
  providers: SocialProvider[];
  onLogin: (provider: SocialProvider) => void | Promise<void>;
  disabled?: boolean;
  loading?: SocialProvider | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined';
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const SocialLoginGroup: React.FC<SocialLoginGroupProps> = ({
  providers,
  onLogin,
  disabled = false,
  loading = null,
  size = 'md',
  variant = 'filled',
  orientation = 'vertical',
  className = ''
}) => {
  const containerClass = orientation === 'vertical' 
    ? 'flex flex-col space-y-3' 
    : 'flex flex-row space-x-3 flex-wrap';

  return (
    <div className={`${containerClass} ${className}`}>
      {providers.map((provider) => (
        <SocialLoginButton
          key={provider}
          provider={provider}
          onLogin={onLogin}
          disabled={disabled}
          loading={loading === provider}
          size={size}
          variant={variant}
          className={orientation === 'horizontal' ? 'flex-1 min-w-0' : 'w-full'}
        />
      ))}
    </div>
  );
};

// 소셜 로그인 훅
export interface UseSocialLoginResult {
  login: (provider: SocialProvider) => Promise<Result<void>>;
  loading: SocialProvider | null;
  error: string | null;
}

export const useSocialLogin = (
  onSuccess?: (provider: SocialProvider, userData: any) => void,
  onError?: (provider: SocialProvider, error: string) => void
): UseSocialLoginResult => {
  const [loading, setLoading] = React.useState<SocialProvider | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const login = React.useCallback(async (provider: SocialProvider): Promise<Result<void>> => {
    setLoading(provider);
    setError(null);

    try {
      // 실제 소셜 로그인 로직 구현
      // 각 제공자별 OAuth 플로우 실행
      const authUrl = await generateAuthUrl(provider);
      
      if (authUrl.isFailure) {
        const errorMsg = `${provider} 로그인 URL 생성에 실패했습니다.`;
        setError(errorMsg);
        onError?.(provider, errorMsg);
        return authUrl;
      }

      // 새 창에서 소셜 로그인 진행
      const popup = window.open(
        authUrl.data,
        `${provider}-login`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // 팝업 메시지 리스너
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        const { type, provider: messageProvider, data, error: messageError } = event.data;
        
        if (type === 'SOCIAL_LOGIN_SUCCESS' && messageProvider === provider) {
          popup?.close();
          window.removeEventListener('message', messageListener);
          setLoading(null);
          onSuccess?.(provider, data);
        } else if (type === 'SOCIAL_LOGIN_ERROR' && messageProvider === provider) {
          popup?.close();
          window.removeEventListener('message', messageListener);
          setLoading(null);
          setError(messageError);
          onError?.(provider, messageError);
        }
      };

      window.addEventListener('message', messageListener);

      // 팝업이 닫힌 경우 정리
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setLoading(null);
        }
      }, 1000);

      return Result.success(undefined);
    } catch (error) {
      const errorMsg = `${provider} 로그인 중 오류가 발생했습니다.`;
      setError(errorMsg);
      setLoading(null);
      onError?.(provider, errorMsg);
      return Result.failure('SOCIAL_LOGIN_ERROR', errorMsg);
    }
  }, [onSuccess, onError]);

  return { login, loading, error };
};

// 유틸리티 함수
async function generateAuthUrl(provider: SocialProvider): Promise<Result<string>> {
  // 실제로는 각 소셜 제공자의 설정에 따라 URL 생성
  const baseUrls = {
    google: 'https://accounts.google.com/oauth2/auth',
    kakao: 'https://kauth.kakao.com/oauth/authorize',
    naver: 'https://nid.naver.com/oauth2.0/authorize',
    facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
    apple: 'https://appleid.apple.com/auth/authorize'
  };

  const url = baseUrls[provider];
  if (!url) {
    return Result.failure('UNSUPPORTED_PROVIDER', `지원하지 않는 소셜 로그인 제공자: ${provider}`);
  }

  // 실제 구현에서는 각 제공자별 설정을 사용해서 완전한 URL 생성
  return Result.success(url);
}
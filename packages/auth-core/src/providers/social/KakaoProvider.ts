import { Result } from '@company/core';

export interface KakaoConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}

export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile: {
      nickname: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image: boolean;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email?: string;
    has_phone_number: boolean;
    phone_number_needs_agreement: boolean;
    phone_number?: string;
    has_gender: boolean;
    gender_needs_agreement: boolean;
    gender?: 'female' | 'male';
    has_age_range: boolean;
    age_range_needs_agreement: boolean;
    age_range?: string;
    has_birthday: boolean;
    birthday_needs_agreement: boolean;
    birthday?: string;
    birthday_type?: 'SOLAR' | 'LUNAR';
  };
}

export interface KakaoTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope?: string;
}

export class KakaoProvider {
  private config: KakaoConfig;
  private readonly baseUrl = 'https://kauth.kakao.com/oauth';
  private readonly apiUrl = 'https://kapi.kakao.com/v2/user/me';

  constructor(config: KakaoConfig) {
    this.config = config;
  }

  generateAuthUrl(state?: string): Result<string> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        response_type: 'code',
        scope: 'profile_nickname,profile_image,account_email'
      });

      if (state) {
        params.append('state', state);
      }

      const authUrl = `${this.baseUrl}/authorize?${params.toString()}`;
      return Result.success(authUrl);
    } catch (error) {
      return Result.failure('KAKAO_AUTH_URL_FAILED', 'Kakao 인증 URL 생성에 실패했습니다.');
    }
  }

  async exchangeCodeForToken(code: string): Promise<Result<KakaoTokenResponse>> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        code,
      });

      if (this.config.clientSecret) {
        params.append('client_secret', this.config.clientSecret);
      }

      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.text();
        return Result.failure('KAKAO_TOKEN_EXCHANGE_FAILED', `토큰 교환 실패: ${error}`);
      }

      const tokenData: KakaoTokenResponse = await response.json();
      return Result.success(tokenData);
    } catch (error) {
      return Result.failure('KAKAO_TOKEN_EXCHANGE_ERROR', 'Kakao 토큰 교환 중 오류가 발생했습니다.');
    }
  }

  async getUserInfo(accessToken: string): Promise<Result<KakaoUserInfo>> {
    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      if (!response.ok) {
        return Result.failure('KAKAO_USER_INFO_FAILED', 'Kakao 사용자 정보 조회에 실패했습니다.');
      }

      const userInfo: KakaoUserInfo = await response.json();
      return Result.success(userInfo);
    } catch (error) {
      return Result.failure('KAKAO_USER_INFO_ERROR', 'Kakao 사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<KakaoTokenResponse>> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        refresh_token: refreshToken,
      });

      if (this.config.clientSecret) {
        params.append('client_secret', this.config.clientSecret);
      }

      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        return Result.failure('KAKAO_TOKEN_REFRESH_FAILED', 'Kakao 토큰 갱신에 실패했습니다.');
      }

      const tokenData: KakaoTokenResponse = await response.json();
      return Result.success(tokenData);
    } catch (error) {
      return Result.failure('KAKAO_TOKEN_REFRESH_ERROR', 'Kakao 토큰 갱신 중 오류가 발생했습니다.');
    }
  }

  async unlinkUser(accessToken: string): Promise<Result<void>> {
    try {
      const response = await fetch('https://kapi.kakao.com/v1/user/unlink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        return Result.failure('KAKAO_UNLINK_FAILED', 'Kakao 연결 해제에 실패했습니다.');
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure('KAKAO_UNLINK_ERROR', 'Kakao 연결 해제 중 오류가 발생했습니다.');
    }
  }

  async logoutUser(accessToken: string): Promise<Result<void>> {
    try {
      const response = await fetch('https://kapi.kakao.com/v1/user/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        return Result.failure('KAKAO_LOGOUT_FAILED', 'Kakao 로그아웃에 실패했습니다.');
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure('KAKAO_LOGOUT_ERROR', 'Kakao 로그아웃 중 오류가 발생했습니다.');
    }
  }

  parseUserInfo(userInfo: KakaoUserInfo): {
    id: string;
    email?: string;
    name: string;
    profileImage?: string;
    isEmailVerified: boolean;
  } {
    return {
      id: userInfo.id.toString(),
      email: userInfo.kakao_account.email,
      name: userInfo.kakao_account.profile.nickname || userInfo.properties.nickname,
      profileImage: userInfo.kakao_account.profile.profile_image_url || userInfo.properties.profile_image,
      isEmailVerified: userInfo.kakao_account.is_email_verified || false
    };
  }

  validateConfig(): Result<void> {
    const { clientId, redirectUri } = this.config;
    
    if (!clientId || !redirectUri) {
      return Result.failure('KAKAO_CONFIG_INVALID', 'Kakao 설정이 올바르지 않습니다.');
    }

    if (!redirectUri.startsWith('http://') && !redirectUri.startsWith('https://')) {
      return Result.failure('KAKAO_REDIRECT_URI_INVALID', 'Redirect URI는 http:// 또는 https://로 시작해야 합니다.');
    }

    return Result.success(undefined);
  }
}
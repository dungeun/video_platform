import { Result } from '@repo/core';

export interface NaverConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface NaverUserInfo {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    gender?: 'F' | 'M' | 'U';
    age?: string;
    birthday?: string;
    profile_image?: string;
    birthyear?: string;
    mobile?: string;
  };
}

export interface NaverTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export class NaverProvider {
  private config: NaverConfig;
  private readonly baseUrl = 'https://nid.naver.com/oauth2.0';
  private readonly apiUrl = 'https://openapi.naver.com/v1/nid/me';

  constructor(config: NaverConfig) {
    this.config = config;
  }

  generateAuthUrl(state?: string): Result<string> {
    try {
      const stateValue = state || this.generateRandomState();
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        state: stateValue,
      });

      const authUrl = `${this.baseUrl}/authorize?${params.toString()}`;
      return Result.success(authUrl);
    } catch (error) {
      return Result.failure('NAVER_AUTH_URL_FAILED', 'Naver 인증 URL 생성에 실패했습니다.');
    }
  }

  async exchangeCodeForToken(code: string, state: string): Promise<Result<NaverTokenResponse>> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code,
        state,
      });

      const response = await fetch(`${this.baseUrl}/token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': this.config.clientId,
          'X-Naver-Client-Secret': this.config.clientSecret,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return Result.failure('NAVER_TOKEN_EXCHANGE_FAILED', `토큰 교환 실패: ${error}`);
      }

      const tokenData: NaverTokenResponse = await response.json();
      return Result.success(tokenData);
    } catch (error) {
      return Result.failure('NAVER_TOKEN_EXCHANGE_ERROR', 'Naver 토큰 교환 중 오류가 발생했습니다.');
    }
  }

  async getUserInfo(accessToken: string): Promise<Result<NaverUserInfo>> {
    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Naver-Client-Id': this.config.clientId,
          'X-Naver-Client-Secret': this.config.clientSecret,
        },
      });

      if (!response.ok) {
        return Result.failure('NAVER_USER_INFO_FAILED', 'Naver 사용자 정보 조회에 실패했습니다.');
      }

      const userInfo: NaverUserInfo = await response.json();
      
      if (userInfo.resultcode !== '00') {
        return Result.failure('NAVER_USER_INFO_ERROR', `Naver API 오류: ${userInfo.message}`);
      }

      return Result.success(userInfo);
    } catch (error) {
      return Result.failure('NAVER_USER_INFO_ERROR', 'Naver 사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<NaverTokenResponse>> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      });

      const response = await fetch(`${this.baseUrl}/token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': this.config.clientId,
          'X-Naver-Client-Secret': this.config.clientSecret,
        },
      });

      if (!response.ok) {
        return Result.failure('NAVER_TOKEN_REFRESH_FAILED', 'Naver 토큰 갱신에 실패했습니다.');
      }

      const tokenData: NaverTokenResponse = await response.json();
      return Result.success(tokenData);
    } catch (error) {
      return Result.failure('NAVER_TOKEN_REFRESH_ERROR', 'Naver 토큰 갱신 중 오류가 발생했습니다.');
    }
  }

  async revokeToken(accessToken: string): Promise<Result<void>> {
    try {
      const params = new URLSearchParams({
        grant_type: 'delete',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        access_token: accessToken,
        service_provider: 'NAVER',
      });

      const response = await fetch(`${this.baseUrl}/token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': this.config.clientId,
          'X-Naver-Client-Secret': this.config.clientSecret,
        },
      });

      if (!response.ok) {
        return Result.failure('NAVER_TOKEN_REVOKE_FAILED', 'Naver 토큰 취소에 실패했습니다.');
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure('NAVER_TOKEN_REVOKE_ERROR', 'Naver 토큰 취소 중 오류가 발생했습니다.');
    }
  }

  parseUserInfo(userInfo: NaverUserInfo): {
    id: string;
    email?: string;
    name?: string;
    nickname?: string;
    profileImage?: string;
    gender?: string;
    mobile?: string;
    birthday?: string;
    birthyear?: string;
    age?: string;
  } {
    const user = userInfo.response;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profileImage: user.profile_image,
      gender: user.gender,
      mobile: user.mobile,
      birthday: user.birthday,
      birthyear: user.birthyear,
      age: user.age,
    };
  }

  private generateRandomState(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  validateConfig(): Result<void> {
    const { clientId, clientSecret, redirectUri } = this.config;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return Result.failure('NAVER_CONFIG_INVALID', 'Naver 설정이 올바르지 않습니다.');
    }

    if (!redirectUri.startsWith('http://') && !redirectUri.startsWith('https://')) {
      return Result.failure('NAVER_REDIRECT_URI_INVALID', 'Redirect URI는 http:// 또는 https://로 시작해야 합니다.');
    }

    return Result.success(undefined);
  }

  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }
}
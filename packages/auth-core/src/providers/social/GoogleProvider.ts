import { Result } from '@repo/core';

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export class GoogleProvider {
  private config: GoogleConfig;
  private readonly baseUrl = 'https://accounts.google.com/o/oauth2/v2';
  private readonly apiUrl = 'https://www.googleapis.com/oauth2/v2';

  constructor(config: GoogleConfig) {
    this.config = {
      ...config,
      scope: config.scope || ['openid', 'email', 'profile']
    };
  }

  generateAuthUrl(state?: string): Result<string> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        response_type: 'code',
        scope: this.config.scope!.join(' '),
        access_type: 'offline',
        prompt: 'consent'
      });

      if (state) {
        params.append('state', state);
      }

      const authUrl = `${this.baseUrl}/auth?${params.toString()}`;
      return Result.success(authUrl);
    } catch (error) {
      return Result.failure('GOOGLE_AUTH_URL_FAILED', 'Google 인증 URL 생성에 실패했습니다.');
    }
  }

  async exchangeCodeForToken(code: string): Promise<Result<GoogleTokenResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return Result.failure('GOOGLE_TOKEN_EXCHANGE_FAILED', `토큰 교환 실패: ${error}`);
      }

      const tokenData: GoogleTokenResponse = await response.json();
      return Result.success(tokenData);
    } catch (error) {
      return Result.failure('GOOGLE_TOKEN_EXCHANGE_ERROR', 'Google 토큰 교환 중 오류가 발생했습니다.');
    }
  }

  async getUserInfo(accessToken: string): Promise<Result<GoogleUserInfo>> {
    try {
      const response = await fetch(`${this.apiUrl}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return Result.failure('GOOGLE_USER_INFO_FAILED', 'Google 사용자 정보 조회에 실패했습니다.');
      }

      const userInfo: GoogleUserInfo = await response.json();
      return Result.success(userInfo);
    } catch (error) {
      return Result.failure('GOOGLE_USER_INFO_ERROR', 'Google 사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<GoogleTokenResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        return Result.failure('GOOGLE_TOKEN_REFRESH_FAILED', 'Google 토큰 갱신에 실패했습니다.');
      }

      const tokenData: GoogleTokenResponse = await response.json();
      return Result.success(tokenData);
    } catch (error) {
      return Result.failure('GOOGLE_TOKEN_REFRESH_ERROR', 'Google 토큰 갱신 중 오류가 발생했습니다.');
    }
  }

  async revokeToken(token: string): Promise<Result<void>> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        return Result.failure('GOOGLE_TOKEN_REVOKE_FAILED', 'Google 토큰 취소에 실패했습니다.');
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure('GOOGLE_TOKEN_REVOKE_ERROR', 'Google 토큰 취소 중 오류가 발생했습니다.');
    }
  }

  validateConfig(): Result<void> {
    const { clientId, clientSecret, redirectUri } = this.config;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return Result.failure('GOOGLE_CONFIG_INVALID', 'Google 설정이 올바르지 않습니다.');
    }

    if (!redirectUri.startsWith('http://') && !redirectUri.startsWith('https://')) {
      return Result.failure('GOOGLE_REDIRECT_URI_INVALID', 'Redirect URI는 http:// 또는 https://로 시작해야 합니다.');
    }

    return Result.success(undefined);
  }
}
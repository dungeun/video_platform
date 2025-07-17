/**
 * Token Service
 * JWT token management service
 */

import jwt from 'jsonwebtoken';
import { TokenPayload, RefreshTokenPayload } from './auth.types';

export class TokenService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default-access-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-refresh-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '1h';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  async generateTokenPair(payload: TokenPayload): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry
    } as jwt.SignOptions);

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: payload.userId,
      type: 'refresh'
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as TokenPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret) as RefreshTokenPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    const resetToken = jwt.sign(
      { userId, type: 'password-reset' },
      this.accessTokenSecret,
      { expiresIn: '1h' }
    );
    return resetToken;
  }

  async verifyPasswordResetToken(token: string): Promise<{ userId: string }> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as any;
      if (payload.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }
      return { userId: payload.userId };
    } catch (error) {
      throw new Error('Invalid password reset token');
    }
  }
}
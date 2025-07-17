/**
 * Auth Types
 * Authentication module type definitions
 */

export interface LoginDto {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  type?: 'BUSINESS' | 'INFLUENCER';
  userAgent?: string;
  ipAddress?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    type: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: string;
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

export interface SessionData {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt?: Date;
  expiresAt?: Date;
}

export interface Session extends SessionData {
  id: string;
  userId: string;
}
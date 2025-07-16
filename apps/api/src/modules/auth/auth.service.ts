/**
 * Auth Service
 * 핵심 인증 비즈니스 로직
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EventEmitter } from 'events';
import { RedisManager } from '../../core/RedisManager';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponse, 
  RefreshTokenDto,
  AuthError 
} from './auth.types';

interface AuthServiceDeps {
  db: PrismaClient;
  redis: RedisManager;
  tokenService: TokenService;
  sessionService: SessionService;
  eventBus: EventEmitter;
}

export class AuthService {
  private db: PrismaClient;
  private redis: RedisManager;
  private tokenService: TokenService;
  private sessionService: SessionService;
  private eventBus: EventEmitter;

  constructor(deps: AuthServiceDeps) {
    this.db = deps.db;
    this.redis = deps.redis;
    this.tokenService = deps.tokenService;
    this.sessionService = deps.sessionService;
    this.eventBus = deps.eventBus;
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      // Check if user exists
      const existingUser = await this.db.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new AuthError('User already exists', 'USER_EXISTS');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await this.db.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          type: data.type || 'influencer'
        }
      });

      // Generate tokens
      const { accessToken, refreshToken } = await this.tokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
        type: user.type
      });

      // Create session
      await this.sessionService.createSession(user.id, {
        refreshToken,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress
      });

      // Emit event
      this.eventBus.emit('auth:user-registered', {
        userId: user.id,
        email: user.email,
        type: user.type
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };

    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Registration failed', 'REGISTRATION_FAILED');
    }
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    try {
      // Find user
      const user = await this.db.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new AuthError('Account is not active', 'ACCOUNT_INACTIVE');
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.tokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
        type: user.type
      });

      // Create session
      await this.sessionService.createSession(user.id, {
        refreshToken,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress
      });

      // Update last login
      await this.db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Emit event
      this.eventBus.emit('auth:user-logged-in', {
        userId: user.id,
        email: user.email,
        ipAddress: data.ipAddress
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Login failed', 'LOGIN_FAILED');
    }
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        await this.sessionService.invalidateSession(sessionId);
      } else {
        await this.sessionService.invalidateUserSessions(userId);
      }

      // Emit event
      this.eventBus.emit('auth:user-logged-out', {
        userId,
        sessionId
      });

    } catch (error) {
      console.error('Logout error:', error);
      throw new AuthError('Logout failed', 'LOGOUT_FAILED');
    }
  }

  async refreshToken(data: RefreshTokenDto): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = await this.tokenService.verifyRefreshToken(data.refreshToken);
      
      // Check session
      const session = await this.sessionService.getSessionByToken(data.refreshToken);
      if (!session || session.userId !== payload.userId) {
        throw new AuthError('Invalid session', 'INVALID_SESSION');
      }

      // Get user
      const user = await this.db.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || user.status !== 'active') {
        throw new AuthError('User not found or inactive', 'USER_NOT_FOUND');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.tokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
        type: user.type
      });

      // Update session
      await this.sessionService.updateSession(session.id, {
        refreshToken: newRefreshToken
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type
        },
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      };

    } catch (error) {
      console.error('Refresh token error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Token refresh failed', 'TOKEN_REFRESH_FAILED');
    }
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        status: true
      }
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AuthError('User not found', 'USER_NOT_FOUND');
      }

      // Verify old password
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        throw new AuthError('Invalid old password', 'INVALID_PASSWORD');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Invalidate all sessions
      await this.sessionService.invalidateUserSessions(userId);

      // Emit event
      this.eventBus.emit('auth:password-changed', { userId });

    } catch (error) {
      console.error('Change password error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Password change failed', 'PASSWORD_CHANGE_FAILED');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.db.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists
        return;
      }

      // Generate reset token
      const resetToken = await this.tokenService.generatePasswordResetToken(user.id);

      // Store in Redis with expiry
      await this.redis.set(
        `password-reset:${resetToken}`,
        user.id,
        3600 // 1 hour
      );

      // Emit event for email service
      this.eventBus.emit('auth:password-reset-requested', {
        userId: user.id,
        email: user.email,
        resetToken
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      throw new AuthError('Password reset request failed', 'PASSWORD_RESET_REQUEST_FAILED');
    }
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Get user ID from Redis
      const userId = await this.redis.get(`password-reset:${resetToken}`);
      
      if (!userId) {
        throw new AuthError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Delete reset token
      await this.redis.del(`password-reset:${resetToken}`);

      // Invalidate all sessions
      await this.sessionService.invalidateUserSessions(userId);

      // Emit event
      this.eventBus.emit('auth:password-reset', { userId });

    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Password reset failed', 'PASSWORD_RESET_FAILED');
    }
  }
}
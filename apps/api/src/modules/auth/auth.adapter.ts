/**
 * Auth Module Adapter
 * 프론트엔드 Auth 모듈과 백엔드를 연결하는 어댑터
 * 기존 모듈의 HttpClient 호출을 실제 백엔드 로직으로 변환
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from '../../core/DatabaseManager';
import { RedisManager } from '../../core/RedisManager';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// 기존 모듈의 타입 재사용
import type { 
  LoginCredentials, 
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  AuthUser
} from '@repo/auth/src/types';

interface AdapterDeps {
  db: DatabaseManager;
  redis: RedisManager;
  eventBus: EventEmitter;
}

export class AuthModuleAdapter {
  private db: PrismaClient;
  private redis: RedisManager;
  private eventBus: EventEmitter;
  private jwtSecret: string;

  constructor(deps: AdapterDeps) {
    this.db = deps.db.getClient();
    this.redis = deps.redis;
    this.eventBus = deps.eventBus;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
  }

  /**
   * 프론트엔드 AuthService의 login 메소드가 호출하는 /auth/login 엔드포인트 처리
   */
  async handleLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // 1. 사용자 찾기
      const user = await this.db.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // 2. 비밀번호 검증
      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // 3. JWT 토큰 생성 (기존 모듈의 TokenManager와 동일한 구조)
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          type: user.type 
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { 
          userId: user.id,
          type: 'refresh'
        },
        this.jwtSecret,
        { expiresIn: '7d' }
      );

      // 4. 세션 정보를 Redis에 저장 (기존 SessionManager와 동일한 구조)
      const sessionId = `session:${user.id}:${Date.now()}`;
      const sessionData = {
        userId: user.id,
        refreshToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      await this.redis.setJSON(sessionId, sessionData, 7 * 24 * 60 * 60); // 7일
      await this.redis.sadd(`user-sessions:${user.id}`, sessionId);

      // 5. 마지막 로그인 시간 업데이트
      await this.db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // 6. 이벤트 발행 (기존 모듈과 동일한 이벤트)
      this.eventBus.emit('user.loggedIn', {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type
        }
      });

      // 7. 기존 모듈이 기대하는 응답 형식으로 반환
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          avatar: undefined
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간
          tokenType: 'Bearer'
        },
        message: '로그인에 성공했습니다'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        user: null as any,
        tokens: null as any,
        message: error instanceof Error ? error.message : '로그인에 실패했습니다'
      };
    }
  }

  /**
   * 프론트엔드 AuthService의 logout 메소드가 호출하는 /auth/logout 엔드포인트 처리
   */
  async handleLogout(_refreshToken?: string, userId?: string): Promise<LogoutResponse> {
    try {
      if (userId) {
        // 사용자의 모든 세션 삭제
        const sessionKeys = await this.redis.smembers(`user-sessions:${userId}`);
        
        for (const sessionKey of sessionKeys) {
          await this.redis.del(sessionKey);
        }
        
        await this.redis.del(`user-sessions:${userId}`);

        // 이벤트 발행
        this.eventBus.emit('user.loggedOut', { userId });
      }

      return {
        success: true,
        message: '로그아웃되었습니다'
      };

    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: '로그아웃 처리 중 오류가 발생했습니다'
      };
    }
  }

  /**
   * 프론트엔드 AuthService의 refreshToken 메소드가 호출하는 /auth/refresh 엔드포인트 처리
   */
  async handleRefreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // 1. 리프레시 토큰 검증
      const payload = jwt.verify(refreshToken, this.jwtSecret) as any;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // 2. 사용자 확인
      const user = await this.db.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User not found or inactive');
      }

      // 3. 새 토큰 생성
      const newAccessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          type: user.type 
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      );

      const newRefreshToken = jwt.sign(
        { 
          userId: user.id,
          type: 'refresh'
        },
        this.jwtSecret,
        { expiresIn: '7d' }
      );

      // 4. 세션 업데이트
      // ... (세션 업데이트 로직)

      return {
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간
          tokenType: 'Bearer'
        },
        message: '토큰이 갱신되었습니다'
      };

    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        tokens: null as any,
        message: '토큰 갱신에 실패했습니다'
      };
    }
  }

  /**
   * 프론트엔드 AuthService의 register 메소드가 호출하는 /auth/register 엔드포인트 처리
   */
  async handleRegister(data: {
    email: string;
    password: string;
    name?: string;
    type?: 'BUSINESS' | 'INFLUENCER';
  }): Promise<LoginResponse> {
    try {
      // 1. 중복 확인
      const existingUser = await this.db.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('이미 사용 중인 이메일입니다');
      }

      // 2. 비밀번호 해시
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // 3. 사용자 생성
      await this.db.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          type: data.type || 'INFLUENCER'
        }
      });

      // 4. 자동 로그인 처리
      return this.handleLogin({
        email: data.email,
        password: data.password,
        rememberMe: false
      });

    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        user: null as any,
        tokens: null as any,
        message: error instanceof Error ? error.message : '회원가입에 실패했습니다'
      };
    }
  }

  /**
   * 토큰 검증 미들웨어용 헬퍼
   */
  async verifyAccessToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      
      const user = await this.db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          type: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || '',
        avatar: undefined
      };

    } catch (error) {
      return null;
    }
  }
}
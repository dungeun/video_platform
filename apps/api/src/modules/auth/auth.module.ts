/**
 * Auth Module - Backend Implementation
 * 프론트엔드 Auth 모듈을 100% 활용하는 백엔드 모듈
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from '../../core/DatabaseManager';
import { RedisManager } from '../../core/RedisManager';
import { AuthModuleAdapter } from './auth.adapter';
import { createAuthRouter, authMiddleware } from './auth.router';
import { Router } from 'express';

interface AuthModuleConfig {
  jwtSecret?: string;
  jwtExpiresIn?: string;
  refreshTokenExpiresIn?: string;
  sessionTimeout?: number;
}

interface AuthModuleDeps {
  db: DatabaseManager;
  redis: RedisManager;
  eventBus: EventEmitter;
}

export class AuthModule {
  private adapter: AuthModuleAdapter;
  private router: Router;
  private middleware: any;
  private deps: AuthModuleDeps;

  constructor({ db, redis, eventBus }: AuthModuleDeps & AuthModuleConfig) {
    this.deps = { db, redis, eventBus };

    // 어댑터 생성 - 프론트엔드 모듈과 백엔드를 연결
    this.adapter = new AuthModuleAdapter({ db, redis, eventBus });
    
    // 라우터 생성 - 프론트엔드 모듈의 API 호출을 처리
    this.router = createAuthRouter(this.adapter);
    
    // 미들웨어 생성 - 다른 모듈에서 인증 확인용
    this.middleware = authMiddleware(this.adapter);
  }

  async initialize(): Promise<void> {
    console.log('🔐 Initializing Auth Module...');
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    console.log('✅ Auth Module initialized');
  }

  private setupEventListeners(): void {
    // 프론트엔드 모듈이 발행하는 이벤트와 동일한 이벤트 리스닝
    this.deps.eventBus.on('user.loggedIn', (data) => {
      console.log('User logged in:', data.user.email);
    });

    this.deps.eventBus.on('user.loggedOut', (data) => {
      console.log('User logged out:', data.userId);
    });

    this.deps.eventBus.on('user.registered', (data) => {
      console.log('User registered:', data.user.email);
    });
  }

  // Express 라우터 반환
  getRouter(): Router {
    return this.router;
  }

  // 인증 미들웨어 반환
  getMiddleware() {
    return this.middleware;
  }

  // 어댑터 반환 (다른 모듈에서 필요 시)
  getAdapter(): AuthModuleAdapter {
    return this.adapter;
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Redis 연결 확인
      const redisHealth = await this.deps.redis.healthCheck();
      
      return {
        status: 'healthy',
        details: {
          redis: redisHealth,
          adapter: 'active'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔐 Shutting down Auth Module...');
    // 필요 시 정리 작업
  }
}
/**
 * Notification Module
 * 알림 모듈 초기화 및 생명주기 관리
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from '../../core/DatabaseManager';
import { RedisManager } from '../../core/RedisManager';
import { NotificationModuleAdapter } from './notification.adapter';
import { NotificationService } from './notification.service';
import { createNotificationRouter } from './notification.router';
import { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';

export interface NotificationModuleDeps {
  db: DatabaseManager;
  redis: RedisManager;
  eventBus: EventEmitter;
  io: SocketIOServer;
}

export class NotificationModule {
  private adapter: NotificationModuleAdapter;
  private service: NotificationService;
  private router: Router;
  private initialized = false;

  constructor(private deps: NotificationModuleDeps) {
    this.adapter = new NotificationModuleAdapter(deps);
    this.service = new NotificationService(this.adapter, deps.eventBus);
    this.router = createNotificationRouter(this.service);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 이벤트 리스너 등록
    this.setupEventListeners();

    this.initialized = true;
    console.log('Notification module initialized');
  }

  private setupEventListeners(): void {
    const { eventBus } = this.deps;

    // 알림 전송 요청 처리
    eventBus.on('notification.send', async (data) => {
      console.log('Notification send request:', data);
      await this.service.sendNotification(data);
    });

    // 이메일 전송 처리 (실제 구현은 이메일 서비스에서)
    eventBus.on('email.send', async (data) => {
      console.log('Email send request:', data);
      // TODO: 실제 이메일 전송 로직
      // 여기서는 로그만 출력
      console.log(`Email would be sent to ${data.to}: ${data.subject}`);
    });

    // 사용자 연결 시 읽지 않은 알림 개수 전송
    this.deps.io.on('connection', (socket) => {
      socket.on('authenticated', async (userId: string) => {
        // 사용자 채널 참여
        socket.join(`user:${userId}`);

        // 읽지 않은 알림 개수 조회 및 전송
        try {
          const cachedCount = await this.deps.redis.get(`notification:unread:${userId}`);
          
          if (cachedCount) {
            socket.emit('notification:unread', {
              count: parseInt(cachedCount)
            });
          } else {
            // 캐시가 없으면 DB에서 조회
            const result = await this.service.getNotifications(userId, {
              read: false,
              page: 1,
              limit: 1
            });

            if (result.success && result.data) {
              const count = result.data.pagination.total;
              socket.emit('notification:unread', { count });
              
              // 캐시 저장
              await this.deps.redis.setWithExpiry(
                `notification:unread:${userId}`,
                String(count),
                3600
              );
            }
          }
        } catch (error) {
          console.error('Failed to get unread notification count:', error);
        }
      });
    });
  }

  getRouter(): Router {
    return this.router;
  }

  getService(): NotificationService {
    return this.service;
  }

  async destroy(): Promise<void> {
    // 이벤트 리스너 정리
    this.deps.eventBus.removeAllListeners('notification.send');
    this.deps.eventBus.removeAllListeners('email.send');
    
    this.initialized = false;
    console.log('Notification module destroyed');
  }

  // 정적 메서드로 모듈 타입 정의
  static getModuleType() {
    return 'notification';
  }

  static getDependencies() {
    return ['auth', 'database', 'redis'];
  }
}
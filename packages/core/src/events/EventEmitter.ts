/**
 * @repo/core - 이벤트 에미터
 * 모듈 간 이벤트 기반 통신을 위한 핵심 클래스
 */

import { v4 as uuidv4 } from 'uuid';
import { ModuleEvent, EventHandler, EventSubscription } from '../types';

export class EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHandlers: Map<string, Set<string>> = new Map();

  /**
   * 이벤트 구독
   */
  public on<T = any>(eventType: string, handler: EventHandler<T>): string {
    const subscriptionId = uuidv4();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler: handler as EventHandler,
      once: false
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    // 이벤트 타입별 핸들러 관리
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(subscriptionId);
    
    return subscriptionId;
  }

  /**
   * 일회성 이벤트 구독
   */
  public once<T = any>(eventType: string, handler: EventHandler<T>): string {
    const subscriptionId = uuidv4();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler: handler as EventHandler,
      once: true
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(subscriptionId);
    
    return subscriptionId;
  }

  /**
   * 이벤트 구독 해제
   */
  public off(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      
      const handlers = this.eventHandlers.get(subscription.eventType);
      if (handlers) {
        handlers.delete(subscriptionId);
        
        // 핸들러가 없으면 이벤트 타입 정리
        if (handlers.size === 0) {
          this.eventHandlers.delete(subscription.eventType);
        }
      }
    }
  }

  /**
   * 이벤트 발행
   */
  public emit(eventType: string, payload?: any, options?: {
    source?: string;
    target?: string;
    correlationId?: string;
    userId?: string;
  }): void {
    const event: ModuleEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      source: options?.source || 'unknown',
      type: eventType,
      target: options?.target,
      payload,
      correlationId: options?.correlationId,
      userId: options?.userId
    };

    this.processEvent(event);
  }

  /**
   * 특정 이벤트 타입의 구독자 수 반환
   */
  public getSubscriberCount(eventType: string): number {
    const handlers = this.eventHandlers.get(eventType);
    return handlers ? handlers.size : 0;
  }

  /**
   * 모든 구독 해제
   */
  public removeAllListeners(eventType?: string): void {
    if (eventType) {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.forEach(subscriptionId => {
          this.subscriptions.delete(subscriptionId);
        });
        this.eventHandlers.delete(eventType);
      }
    } else {
      this.subscriptions.clear();
      this.eventHandlers.clear();
    }
  }

  /**
   * 현재 활성 구독 목록 반환
   */
  public getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * 구독된 이벤트 타입 목록 반환
   */
  public getEventTypes(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  // ===== 내부 메서드 =====

  /**
   * 이벤트 처리
   */
  private async processEvent(event: ModuleEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type);
    
    if (!handlers || handlers.size === 0) {
      return;
    }

    // 병렬로 모든 핸들러 실행
    const promises: Promise<void>[] = [];
    const handlersToRemove: string[] = [];

    handlers.forEach(subscriptionId => {
      const subscription = this.subscriptions.get(subscriptionId);
      
      if (subscription) {
        promises.push(this.executeHandler(subscription, event));
        
        // 일회성 구독은 실행 후 제거
        if (subscription.once) {
          handlersToRemove.push(subscriptionId);
        }
      }
    });

    // 모든 핸들러 실행 완료 대기
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('이벤트 핸들러 실행 중 오류:', error);
    }

    // 일회성 구독 정리
    handlersToRemove.forEach(id => this.off(id));
  }

  /**
   * 개별 핸들러 실행
   */
  private async executeHandler(
    subscription: EventSubscription, 
    event: ModuleEvent
  ): Promise<void> {
    try {
      await subscription.handler({ ...event, payload: event.payload || {} });
    } catch (error) {
      console.error(
        `이벤트 핸들러 실행 실패: ${subscription.eventType}`,
        {
          subscriptionId: subscription.id,
          eventId: event.id,
          error
        }
      );
    }
  }
}

// ===== 전역 이벤트 버스 (싱글톤) =====

class GlobalEventBus extends EventEmitter {
  private static instance: GlobalEventBus;

  private constructor() {
    super();
  }

  public static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus();
    }
    return GlobalEventBus.instance;
  }

  /**
   * 모듈 이벤트 발행 (표준 형식 강제)
   */
  public emitModuleEvent(
    source: string,
    eventType: string,
    payload?: any,
    options?: {
      target?: string;
      correlationId?: string;
      userId?: string;
    }
  ): void {
    this.emit(eventType, payload, {
      source,
      ...options
    });
  }
}

export const EventBus = GlobalEventBus.getInstance();
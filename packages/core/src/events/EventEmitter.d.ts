/**
 * @company/core - 이벤트 에미터
 * 모듈 간 이벤트 기반 통신을 위한 핵심 클래스
 */
import { EventHandler, EventSubscription } from '../types';
export declare class EventEmitter {
    private subscriptions;
    private eventHandlers;
    /**
     * 이벤트 구독
     */
    on<T = any>(eventType: string, handler: EventHandler<T>): string;
    /**
     * 일회성 이벤트 구독
     */
    once<T = any>(eventType: string, handler: EventHandler<T>): string;
    /**
     * 이벤트 구독 해제
     */
    off(subscriptionId: string): void;
    /**
     * 이벤트 발행
     */
    emit(eventType: string, payload?: any, options?: {
        source?: string;
        target?: string;
        correlationId?: string;
        userId?: string;
    }): void;
    /**
     * 특정 이벤트 타입의 구독자 수 반환
     */
    getSubscriberCount(eventType: string): number;
    /**
     * 모든 구독 해제
     */
    removeAllListeners(eventType?: string): void;
    /**
     * 현재 활성 구독 목록 반환
     */
    getActiveSubscriptions(): EventSubscription[];
    /**
     * 구독된 이벤트 타입 목록 반환
     */
    getEventTypes(): string[];
    /**
     * 이벤트 처리
     */
    private processEvent;
    /**
     * 개별 핸들러 실행
     */
    private executeHandler;
}
declare class GlobalEventBus extends EventEmitter {
    private static instance;
    private constructor();
    static getInstance(): GlobalEventBus;
    /**
     * 모듈 이벤트 발행 (표준 형식 강제)
     */
    emitModuleEvent(source: string, eventType: string, payload?: any, options?: {
        target?: string;
        correlationId?: string;
        userId?: string;
    }): void;
}
export declare const EventBus: GlobalEventBus;
export {};
//# sourceMappingURL=EventEmitter.d.ts.map
/**
 * @repo/core - 모듈 기반 클래스
 * 모든 엔터프라이즈 모듈이 상속받아야 하는 추상 클래스
 */
import { EventEmitter } from '../events/EventEmitter';
import { Logger } from '../logging/Logger';
import { ErrorHandler } from '../error/ErrorHandler';
import { ModuleConfig, ModuleInfo, ModuleStatus, Result, EventHandler } from '../types';
export declare abstract class ModuleBase {
    protected config: ModuleConfig;
    protected status: ModuleStatus;
    protected eventEmitter: EventEmitter;
    protected logger: Logger;
    protected errorHandler: ErrorHandler;
    protected loadedAt?: Date;
    constructor(config: ModuleConfig);
    /**
     * 모듈 초기화 로직
     * 하위 클래스에서 반드시 구현해야 함
     */
    protected abstract onInitialize(): Promise<Result<void>>;
    /**
     * 모듈 정리 로직
     * 앱 종료 시 호출됨
     */
    protected abstract onDestroy(): Promise<Result<void>>;
    /**
     * 헬스 체크 로직
     * 모듈 상태 확인용
     */
    abstract healthCheck(): Promise<Result<boolean>>;
    /**
     * 모듈 초기화 (Zero Error)
     */
    private initialize;
    /**
     * 모듈 종료
     */
    destroy(): Promise<Result<void>>;
    /**
     * 모듈 정보 반환
     */
    getInfo(): ModuleInfo;
    /**
     * 모듈 설정 반환
     */
    getConfig(): ModuleConfig;
    /**
     * 모듈 상태 반환
     */
    getStatus(): ModuleStatus;
    /**
     * 모듈이 로드되었는지 확인
     */
    isLoaded(): boolean;
    /**
     * 모듈이 사용 가능한지 확인
     */
    isAvailable(): boolean;
    /**
     * 이벤트 구독
     */
    on(eventType: string, handler: EventHandler): string;
    /**
     * 일회성 이벤트 구독
     */
    once(eventType: string, handler: EventHandler): string;
    /**
     * 이벤트 구독 해제
     */
    off(subscriptionId: string): void;
    /**
     * 이벤트 발행 (내부용)
     */
    protected emit(eventType: string, payload?: any): void;
    private handleInitializationError;
    private getLastError;
    /**
     * 안전한 비동기 작업 실행 (Zero Error)
     */
    protected safeExecute<T>(operation: () => Promise<T>, errorMessage?: string): Promise<Result<T>>;
    /**
     * 조건부 실행 (상태 확인)
     */
    protected requireLoaded<T>(operation: () => T): Result<T>;
    /**
     * 설정 업데이트
     */
    protected updateConfig(updates: Partial<ModuleConfig>): void;
}
//# sourceMappingURL=ModuleBase.d.ts.map
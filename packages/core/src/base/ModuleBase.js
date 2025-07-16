/**
 * @repo/core - 모듈 기반 클래스
 * 모든 엔터프라이즈 모듈이 상속받아야 하는 추상 클래스
 */
import { EventEmitter } from '../events/EventEmitter';
import { Logger } from '../logging/Logger';
import { ErrorHandler } from '../error/ErrorHandler';
import { ModuleStatus } from '../types';
export class ModuleBase {
    constructor(config) {
        this.status = ModuleStatus.LOADING;
        this.config = config;
        this.eventEmitter = new EventEmitter();
        this.logger = new Logger(config.name);
        this.errorHandler = new ErrorHandler(config.name);
        this.initialize();
    }
    // ===== 공통 라이프사이클 메서드 =====
    /**
     * 모듈 초기화 (Zero Error)
     */
    async initialize() {
        try {
            this.logger.info('모듈 초기화 시작', { config: this.config });
            const result = await this.onInitialize();
            if (result.success) {
                this.status = ModuleStatus.LOADED;
                this.loadedAt = new Date();
                this.logger.info('모듈 초기화 완료');
                this.eventEmitter.emit('module:loaded', {
                    name: this.config.name,
                    loadedAt: this.loadedAt
                });
            }
            else {
                this.handleInitializationError(result.error);
            }
        }
        catch (error) {
            this.handleInitializationError(error);
        }
    }
    /**
     * 모듈 종료
     */
    async destroy() {
        try {
            this.logger.info('모듈 종료 시작');
            const result = await this.onDestroy();
            if (result.success) {
                this.status = ModuleStatus.DISABLED;
                this.eventEmitter.emit('module:destroyed', {
                    name: this.config.name
                });
                this.logger.info('모듈 종료 완료');
            }
            return result;
        }
        catch (error) {
            const moduleError = this.errorHandler.handle(error);
            this.logger.error('모듈 종료 중 오류', moduleError);
            return {
                success: false,
                error: moduleError
            };
        }
    }
    // ===== 정보 제공 메서드 =====
    /**
     * 모듈 정보 반환
     */
    getInfo() {
        return {
            config: this.config,
            status: this.status,
            loadedAt: this.loadedAt || new Date(),
            error: this.status === ModuleStatus.ERROR ? this.getLastError() : undefined
        };
    }
    /**
     * 모듈 설정 반환
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 모듈 상태 반환
     */
    getStatus() {
        return this.status;
    }
    /**
     * 모듈이 로드되었는지 확인
     */
    isLoaded() {
        return this.status === ModuleStatus.LOADED;
    }
    /**
     * 모듈이 사용 가능한지 확인
     */
    isAvailable() {
        return this.status === ModuleStatus.LOADED;
    }
    // ===== 이벤트 관련 메서드 =====
    /**
     * 이벤트 구독
     */
    on(eventType, handler) {
        return this.eventEmitter.on(eventType, handler);
    }
    /**
     * 일회성 이벤트 구독
     */
    once(eventType, handler) {
        return this.eventEmitter.once(eventType, handler);
    }
    /**
     * 이벤트 구독 해제
     */
    off(subscriptionId) {
        this.eventEmitter.off(subscriptionId);
    }
    /**
     * 이벤트 발행 (내부용)
     */
    emit(eventType, payload) {
        this.eventEmitter.emit(eventType, payload);
    }
    // ===== 에러 처리 =====
    handleInitializationError(error) {
        const moduleError = this.errorHandler.handle(error);
        this.status = ModuleStatus.ERROR;
        this.logger.error('모듈 초기화 실패', moduleError);
        this.eventEmitter.emit('module:error', {
            name: this.config.name,
            error: moduleError
        });
    }
    getLastError() {
        return this.errorHandler.getLastError();
    }
    // ===== 유틸리티 메서드 =====
    /**
     * 안전한 비동기 작업 실행 (Zero Error)
     */
    async safeExecute(operation, errorMessage = '작업 실행 중 오류') {
        try {
            const data = await operation();
            return { success: true, data };
        }
        catch (error) {
            const moduleError = this.errorHandler.handle(error, errorMessage);
            this.logger.error(errorMessage, moduleError);
            return { success: false, error: moduleError };
        }
    }
    /**
     * 조건부 실행 (상태 확인)
     */
    requireLoaded(operation) {
        if (!this.isLoaded()) {
            const error = this.errorHandler.createError('MODULE_NOT_LOADED', '모듈이 로드되지 않았습니다');
            return { success: false, error };
        }
        try {
            const data = operation();
            return { success: true, data };
        }
        catch (error) {
            const moduleError = this.errorHandler.handle(error);
            return { success: false, error: moduleError };
        }
    }
    /**
     * 설정 업데이트
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.logger.info('모듈 설정 업데이트됨', { updates });
        this.emit('module:config-updated', {
            name: this.config.name,
            updates
        });
    }
}
//# sourceMappingURL=ModuleBase.js.map
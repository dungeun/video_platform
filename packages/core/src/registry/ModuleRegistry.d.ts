/**
 * @company/core - 모듈 레지스트리
 * 모든 모듈의 등록, 관리, 검색을 담당하는 중앙 레지스트리
 */
import { ModuleBase } from '../base/ModuleBase';
import { ModuleConfig, ModuleInfo, ModuleStatus, Result } from '../types';
export interface ModuleDependency {
    name: string;
    version?: string;
    optional?: boolean;
}
export interface ModuleRegistration {
    module: ModuleBase;
    config: ModuleConfig;
    dependencies: ModuleDependency[];
    dependents: string[];
    registeredAt: Date;
}
export declare class ModuleRegistry {
    private static instance;
    private modules;
    private logger;
    private errorHandler;
    private initializationOrder;
    private constructor();
    static getInstance(): ModuleRegistry;
    /**
     * 모듈 등록
     */
    register(module: ModuleBase, dependencies?: ModuleDependency[]): Promise<Result<void>>;
    /**
     * 모듈 해제
     */
    unregister(moduleName: string): Promise<Result<void>>;
    /**
     * 모듈 검색
     */
    get(moduleName: string): ModuleBase | null;
    /**
     * 모듈 존재 확인
     */
    has(moduleName: string): boolean;
    /**
     * 모듈 정보 조회
     */
    getInfo(moduleName: string): ModuleInfo | null;
    /**
     * 모든 모듈 목록 조회
     */
    getAllModules(): string[];
    /**
     * 활성 모듈 목록 조회
     */
    getActiveModules(): string[];
    /**
     * 모듈 상태 조회
     */
    getModuleStatus(moduleName: string): ModuleStatus | null;
    /**
     * 의존성 그래프 조회
     */
    getDependencyGraph(): Record<string, string[]>;
    /**
     * 모듈 초기화 순서 계산
     */
    calculateInitializationOrder(): Result<string[]>;
    /**
     * 모든 모듈 상태 확인
     */
    healthCheck(): Promise<Result<Record<string, boolean>>>;
    /**
     * 의존성 검증
     */
    private validateDependencies;
    /**
     * 의존성 관계 업데이트
     */
    private updateDependencyRelations;
    /**
     * 의존성 관계 정리
     */
    private cleanupDependencyRelations;
    /**
     * 위상 정렬 (의존성 순서 계산)
     */
    private topologicalSort;
}
export declare const moduleRegistry: ModuleRegistry;
//# sourceMappingURL=ModuleRegistry.d.ts.map
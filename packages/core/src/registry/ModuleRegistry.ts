/**
 * @repo/core - 모듈 레지스트리
 * 모든 모듈의 등록, 관리, 검색을 담당하는 중앙 레지스트리
 */

import { ModuleBase } from '../base/ModuleBase';
import { Logger } from '../logging/Logger';
import { ErrorHandler } from '../error/ErrorHandler';
import { EventBus } from '../events/EventEmitter';
import { 
  ModuleConfig, 
  ModuleInfo, 
  ModuleStatus, 
  Result,
  ModuleError 
} from '../types';

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

export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, ModuleRegistration> = new Map();
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private initializationOrder: string[] = [];

  private constructor() {
    this.logger = new Logger('ModuleRegistry');
    this.errorHandler = new ErrorHandler('ModuleRegistry');
  }

  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * 모듈 등록
   */
  public async register(
    module: ModuleBase,
    dependencies: ModuleDependency[] = []
  ): Promise<Result<void>> {
    const config = module.getConfig();
    
    try {
      this.logger.info(`모듈 등록 시작: ${config.name}`);
      
      // 1. 중복 등록 확인
      if (this.modules.has(config.name)) {
        const error = this.errorHandler.createError(
          'MODULE_ALREADY_REGISTERED',
          `모듈이 이미 등록되어 있습니다: ${config.name}`
        );
        return { success: false, error };
      }

      // 2. 의존성 검증
      const dependencyCheck = await this.validateDependencies(dependencies);
      if (!dependencyCheck.success) {
        return dependencyCheck;
      }

      // 3. 모듈 등록
      const registration: ModuleRegistration = {
        module,
        config,
        dependencies,
        dependents: [],
        registeredAt: new Date()
      };

      this.modules.set(config.name, registration);

      // 4. 의존성 관계 업데이트
      this.updateDependencyRelations(config.name, dependencies);

      // 5. 이벤트 발행
      EventBus.emitModuleEvent(
        'ModuleRegistry',
        'module:registered',
        { moduleName: config.name, dependencies: dependencies.map(d => d.name) }
      );

      this.logger.info(`모듈 등록 완료: ${config.name}`);
      return { success: true };

    } catch (error) {
      const moduleError = this.errorHandler.handle(error, `모듈 등록 실패: ${config.name}`);
      return { success: false, error: moduleError };
    }
  }

  /**
   * 모듈 해제
   */
  public async unregister(moduleName: string): Promise<Result<void>> {
    try {
      this.logger.info(`모듈 해제 시작: ${moduleName}`);
      
      const registration = this.modules.get(moduleName);
      if (!registration) {
        const error = this.errorHandler.createError(
          'MODULE_NOT_FOUND',
          `모듈을 찾을 수 없습니다: ${moduleName}`
        );
        return { success: false, error };
      }

      // 1. 종속 모듈 확인
      if (registration.dependents.length > 0) {
        const error = this.errorHandler.createError(
          'MODULE_HAS_DEPENDENTS',
          `다른 모듈이 의존하고 있어 해제할 수 없습니다: ${registration.dependents.join(', ')}`
        );
        return { success: false, error };
      }

      // 2. 모듈 종료
      const destroyResult = await registration.module.destroy();
      if (!destroyResult.success) {
        return destroyResult;
      }

      // 3. 의존성 관계 정리
      this.cleanupDependencyRelations(moduleName, registration.dependencies);

      // 4. 레지스트리에서 제거
      this.modules.delete(moduleName);

      // 5. 이벤트 발행
      EventBus.emitModuleEvent(
        'ModuleRegistry',
        'module:unregistered',
        { moduleName }
      );

      this.logger.info(`모듈 해제 완료: ${moduleName}`);
      return { success: true };

    } catch (error) {
      const moduleError = this.errorHandler.handle(error, `모듈 해제 실패: ${moduleName}`);
      return { success: false, error: moduleError };
    }
  }

  /**
   * 모듈 검색
   */
  public get(moduleName: string): ModuleBase | null {
    const registration = this.modules.get(moduleName);
    return registration ? registration.module : null;
  }

  /**
   * 모듈 존재 확인
   */
  public has(moduleName: string): boolean {
    return this.modules.has(moduleName);
  }

  /**
   * 모듈 정보 조회
   */
  public getInfo(moduleName: string): ModuleInfo | null {
    const registration = this.modules.get(moduleName);
    return registration ? registration.module.getInfo() : null;
  }

  /**
   * 모든 모듈 목록 조회
   */
  public getAllModules(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * 활성 모듈 목록 조회
   */
  public getActiveModules(): string[] {
    const activeModules: string[] = [];
    
    for (const [name, registration] of this.modules) {
      if (registration.module.isLoaded()) {
        activeModules.push(name);
      }
    }
    
    return activeModules;
  }

  /**
   * 모듈 상태 조회
   */
  public getModuleStatus(moduleName: string): ModuleStatus | null {
    const registration = this.modules.get(moduleName);
    return registration ? registration.module.getStatus() : null;
  }

  /**
   * 의존성 그래프 조회
   */
  public getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    for (const [name, registration] of this.modules) {
      graph[name] = registration.dependencies.map(d => d.name);
    }
    
    return graph;
  }

  /**
   * 모듈 초기화 순서 계산
   */
  public calculateInitializationOrder(): Result<string[]> {
    try {
      const order = this.topologicalSort();
      this.initializationOrder = order;
      
      this.logger.info('모듈 초기화 순서 계산됨', { order });
      return { success: true, data: order };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error, '초기화 순서 계산 실패');
      return { success: false, error: moduleError };
    }
  }

  /**
   * 모든 모듈 상태 확인
   */
  public async healthCheck(): Promise<Result<Record<string, boolean>>> {
    const results: Record<string, boolean> = {};
    
    try {
      for (const [name, registration] of this.modules) {
        const healthResult = await registration.module.healthCheck();
        results[name] = healthResult.success && (healthResult.data ?? false);
      }
      
      const allHealthy = Object.values(results).every(healthy => healthy);
      
      this.logger.info('모듈 헬스체크 완료', { results, allHealthy });
      return { success: true, data: results };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error, '헬스체크 실패');
      return { success: false, error: moduleError };
    }
  }

  // ===== 내부 메서드 =====

  /**
   * 의존성 검증
   */
  private async validateDependencies(dependencies: ModuleDependency[]): Promise<Result<void>> {
    for (const dependency of dependencies) {
      if (!dependency.optional && !this.modules.has(dependency.name)) {
        const error = this.errorHandler.createError(
          'DEPENDENCY_NOT_FOUND',
          `필수 의존성을 찾을 수 없습니다: ${dependency.name}`
        );
        return { success: false, error };
      }

      // 버전 호환성 검사 (실제 환경에서는 semver 사용)
      if (dependency.version) {
        const dependencyModule = this.modules.get(dependency.name);
        if (dependencyModule && 
            dependencyModule.config.version !== dependency.version) {
          this.logger.warn(
            `의존성 버전 불일치: ${dependency.name} 요구(${dependency.version}) vs 설치(${dependencyModule.config.version})`
          );
        }
      }
    }

    return { success: true };
  }

  /**
   * 의존성 관계 업데이트
   */
  private updateDependencyRelations(moduleName: string, dependencies: ModuleDependency[]): void {
    for (const dependency of dependencies) {
      const dependencyRegistration = this.modules.get(dependency.name);
      if (dependencyRegistration) {
        dependencyRegistration.dependents.push(moduleName);
      }
    }
  }

  /**
   * 의존성 관계 정리
   */
  private cleanupDependencyRelations(moduleName: string, dependencies: ModuleDependency[]): void {
    for (const dependency of dependencies) {
      const dependencyRegistration = this.modules.get(dependency.name);
      if (dependencyRegistration) {
        const index = dependencyRegistration.dependents.indexOf(moduleName);
        if (index > -1) {
          dependencyRegistration.dependents.splice(index, 1);
        }
      }
    }
  }

  /**
   * 위상 정렬 (의존성 순서 계산)
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (moduleName: string): void => {
      if (visiting.has(moduleName)) {
        throw new Error(`순환 의존성 감지: ${moduleName}`);
      }
      
      if (visited.has(moduleName)) {
        return;
      }

      visiting.add(moduleName);

      const registration = this.modules.get(moduleName);
      if (registration) {
        for (const dependency of registration.dependencies) {
          if (this.modules.has(dependency.name)) {
            visit(dependency.name);
          }
        }
      }

      visiting.delete(moduleName);
      visited.add(moduleName);
      result.push(moduleName);
    };

    for (const moduleName of this.modules.keys()) {
      if (!visited.has(moduleName)) {
        visit(moduleName);
      }
    }

    return result.reverse(); // 의존성이 먼저 오도록 역순
  }
}

// ===== 전역 레지스트리 인스턴스 =====
export const moduleRegistry = ModuleRegistry.getInstance();
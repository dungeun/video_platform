/**
 * @repo/permissions - 권한 관리자
 * Ultra-fine-grained permission checking and access control
 */

import { Logger } from '@repo/core';
import {
  Role,
  Permission,
  PermissionAction,
  PermissionCondition,
  PermissionContext,
  PermissionEvaluationResult,
  PermissionEvaluationOptions,
  PermissionManagerConfig,
  PermissionCache,
  PermissionLoadOptions,
  PermissionSummary,
  PermissionEvent,
  PermissionEventType,
  PermissionError,
  PermissionErrorCode,
  ConditionOperator,
  LogicalOperator,
  ConditionEvaluationResult,
  ScopeType,
  RoleSource,
  PermissionSource,
  CacheInfo
} from '../types';

export class PermissionManager {
  private logger: Logger;
  private config: PermissionManagerConfig;
  private userRoles: Map<string, Role[]> = new Map();
  private userPermissions: Map<string, Permission[]> = new Map();
  private permissionCache: Map<string, PermissionCache> = new Map();
  private eventHandlers: Map<PermissionEventType, Function[]> = new Map();

  constructor(config: Partial<PermissionManagerConfig> = {}) {
    this.logger = new Logger('PermissionManager');
    this.config = {
      cacheEnabled: true,
      cacheTtl: 300, // 5 minutes
      maxCacheSize: 1000,
      strictMode: false,
      enableDebugMode: false,
      defaultScope: ScopeType.USER,
      ...config
    };

    this.logger.info('PermissionManager 초기화 완료', { config: this.config });
  }

  // ===== Permission Loading =====

  /**
   * 사용자 권한 로드
   */
  public async loadUserPermissions(
    userId: string, 
    options: PermissionLoadOptions = {}
  ): Promise<void> {
    try {
      this.logger.debug('사용자 권한 로드 시작', { userId, options });

      // 역할 및 권한 로드
      const [roles, permissions] = await Promise.all([
        this.loadUserRoles(userId, options),
        this.loadUserDirectPermissions(userId, options)
      ]);

      this.userRoles.set(userId, roles);
      this.userPermissions.set(userId, permissions);

      // 캐시 워밍업
      if (this.config.cacheEnabled) {
        await this.warmupUserCache(userId);
      }

      this.emitEvent({
        type: PermissionEventType.PERMISSIONS_LOADED,
        userId,
        timestamp: new Date(),
        metadata: { 
          rolesCount: roles.length, 
          permissionsCount: permissions.length 
        }
      });

      this.logger.info('사용자 권한 로드 완료', { 
        userId,
        rolesCount: roles.length,
        permissionsCount: permissions.length
      });

    } catch (error) {
      this.logger.error('사용자 권한 로드 실패', error);
      throw new PermissionError(
        PermissionErrorCode.EVALUATION_FAILED,
        `권한 로드 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { userId, options }
      );
    }
  }

  /**
   * 권한 정보 초기화
   */
  public clearUserPermissions(userId: string): void {
    this.userRoles.delete(userId);
    this.userPermissions.delete(userId);
    this.clearUserCache(userId);

    this.emitEvent({
      type: PermissionEventType.CACHE_CLEARED,
      userId,
      timestamp: new Date()
    });

    this.logger.debug('사용자 권한 정보 초기화 완료', { userId });
  }

  // ===== Permission Checking =====

  /**
   * 권한 보유 여부 확인
   */
  public hasPermission(
    userId: string,
    permissionName: string,
    context?: PermissionContext
  ): boolean {
    const result = this.evaluatePermission(userId, permissionName, context, {
      useCache: this.config.cacheEnabled,
      includeReasons: false
    });

    return result.granted;
  }

  /**
   * 역할 보유 여부 확인
   */
  public hasRole(userId: string, roleName: string): boolean {
    const roles = this.userRoles.get(userId) || [];
    return roles.some(role => role.name === roleName);
  }

  /**
   * 여러 권한 중 하나라도 보유 여부 확인
   */
  public hasAnyPermission(
    userId: string,
    permissions: string[],
    context?: PermissionContext
  ): boolean {
    return permissions.some(permission => 
      this.hasPermission(userId, permission, context)
    );
  }

  /**
   * 모든 권한 보유 여부 확인
   */
  public hasAllPermissions(
    userId: string,
    permissions: string[],
    context?: PermissionContext
  ): boolean {
    return permissions.every(permission => 
      this.hasPermission(userId, permission, context)
    );
  }

  /**
   * 리소스와 액션에 대한 권한 확인
   */
  public checkPermission(
    userId: string,
    resource: string,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean {
    const permissionName = `${resource}.${action}`;
    return this.hasPermission(userId, permissionName, context);
  }

  /**
   * 상세한 권한 평가
   */
  public evaluatePermission(
    userId: string,
    permissionName: string,
    context?: PermissionContext,
    options: PermissionEvaluationOptions = {}
  ): PermissionEvaluationResult {
    const fullContext = this.buildContext(userId, context);
    const cacheKey = this.buildCacheKey(userId, permissionName, fullContext);

    // 캐시 확인
    if (options.useCache && this.config.cacheEnabled) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return { granted: cached.result };
      }
    }

    try {
      // 권한 찾기
      const permission = this.findPermission(userId, permissionName);
      
      if (!permission) {
        const result = { granted: false, reason: '권한을 찾을 수 없습니다' };
        this.setCachedResult(cacheKey, result.granted, options.cacheTtl);
        return result;
      }

      // 조건 평가
      const conditionResults = this.evaluateConditions(
        permission.conditions || [],
        fullContext
      );

      const granted = conditionResults.length === 0 || 
        conditionResults.every(result => result.result);

      const result: PermissionEvaluationResult = {
        granted,
        reason: granted ? '권한이 허용되었습니다' : '조건을 만족하지 않습니다',
        conditions: options.includeReasons ? conditionResults : undefined
      };

      // 캐시 저장
      this.setCachedResult(cacheKey, granted, options.cacheTtl);

      // 이벤트 발생
      this.emitEvent({
        type: granted ? PermissionEventType.PERMISSION_GRANTED : PermissionEventType.PERMISSION_DENIED,
        userId,
        permission: permissionName,
        timestamp: new Date(),
        metadata: { reason: result.reason }
      });

      return result;

    } catch (error) {
      this.logger.error('권한 평가 실패', error);
      
      if (this.config.strictMode) {
        throw new PermissionError(
          PermissionErrorCode.EVALUATION_FAILED,
          `권한 평가 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { userId, permission: permissionName, context: fullContext }
        );
      }

      return { granted: false, reason: '권한 평가 중 오류가 발생했습니다' };
    }
  }

  // ===== Permission Summary =====

  /**
   * 권한 요약 정보 조회
   */
  public getPermissionSummary(userId: string): PermissionSummary | null {
    const roles = this.userRoles.get(userId) || [];
    const permissions = this.userPermissions.get(userId) || [];

    if (roles.length === 0 && permissions.length === 0) {
      return null;
    }

    // 모든 유효 권한 수집
    const allPermissions = new Map<string, Permission>();
    
    // 직접 권한 추가
    permissions.forEach(permission => {
      allPermissions.set(permission.name, permission);
    });

    // 역할 권한 추가
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        if (!allPermissions.has(permission.name)) {
          allPermissions.set(permission.name, permission);
        }
      });
    });

    return {
      userId,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        source: role.isSystem ? RoleSource.SYSTEM : RoleSource.DIRECT,
        inherited: !!role.parentRole,
        permissionCount: role.permissions.length
      })),
      permissions: Array.from(allPermissions.values()).map(permission => ({
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        source: permissions.includes(permission) ? PermissionSource.DIRECT : PermissionSource.ROLE,
        inherited: false,
        hasConditions: !!(permission.conditions && permission.conditions.length > 0),
        scope: permission.scope?.type
      })),
      effectivePermissions: Array.from(allPermissions.keys()),
      scopes: Array.from(new Set(
        Array.from(allPermissions.values())
          .map(p => p.scope?.type)
          .filter(Boolean)
      )) as ScopeType[],
      lastUpdated: new Date(),
      cacheInfo: this.getCacheInfo()
    };
  }

  // ===== Admin Methods =====

  /**
   * 관리자 권한 확인
   */
  public isAdmin(userId: string): boolean {
    return this.hasRole(userId, 'admin') || this.hasRole(userId, 'superAdmin');
  }

  /**
   * 시스템 사용자 권한 확인
   */
  public isSystemUser(userId: string): boolean {
    return this.hasRole(userId, 'system');
  }

  // ===== Cache Management =====

  /**
   * 캐시 정보 조회
   */
  public getCacheInfo(): CacheInfo {
    const now = Date.now();
    const validEntries = Array.from(this.permissionCache.values())
      .filter(cache => now - cache.timestamp < cache.ttl * 1000);

    return {
      size: this.permissionCache.size,
      hitRate: 0, // TODO: implement hit rate tracking
      lastCleared: new Date(),
      entries: validEntries.length
    };
  }

  /**
   * 전체 캐시 정리
   */
  public clearCache(): void {
    this.permissionCache.clear();
    this.logger.debug('권한 캐시 전체 정리 완료');
  }

  /**
   * 사용자별 캐시 정리
   */
  public clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.permissionCache.keys())
      .filter(key => key.startsWith(`${userId}:`));
    
    keysToDelete.forEach(key => this.permissionCache.delete(key));
    
    this.logger.debug('사용자 캐시 정리 완료', { userId, deletedKeys: keysToDelete.length });
  }

  // ===== Event Management =====

  /**
   * 이벤트 핸들러 등록
   */
  public addEventListener(type: PermissionEventType, handler: Function): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
  }

  /**
   * 이벤트 핸들러 제거
   */
  public removeEventListener(type: PermissionEventType, handler: Function): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // ===== Private Methods =====

  private async loadUserRoles(userId: string, options: PermissionLoadOptions): Promise<Role[]> {
    // TODO: API 연동 구현
    // 현재는 기본 역할 반환
    return [
      {
        id: 'user-role',
        name: 'user',
        description: '일반 사용자',
        permissions: [],
        isSystem: false
      }
    ];
  }

  private async loadUserDirectPermissions(userId: string, options: PermissionLoadOptions): Promise<Permission[]> {
    // TODO: API 연동 구현
    // 현재는 기본 권한 반환
    return [
      {
        id: 'profile-read',
        name: 'profile.read',
        resource: 'profile',
        action: PermissionAction.READ
      }
    ];
  }

  private async warmupUserCache(userId: string): Promise<void> {
    // 자주 사용되는 권한들을 미리 캐싱
    const commonPermissions = ['profile.read', 'profile.update'];
    
    await Promise.all(
      commonPermissions.map(permission =>
        this.evaluatePermission(userId, permission, undefined, { useCache: false })
      )
    );
  }

  private buildContext(userId: string, context?: PermissionContext): PermissionContext {
    return {
      userId,
      ...context,
      environment: {
        ...context?.environment,
        time: {
          timestamp: new Date(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...context?.environment?.time
        }
      }
    };
  }

  private buildCacheKey(userId: string, permission: string, context: PermissionContext): string {
    const contextHash = this.hashContext(context);
    return `${userId}:${permission}:${contextHash}`;
  }

  private hashContext(context: PermissionContext): string {
    // 간단한 컨텍스트 해싱 (실제로는 더 정교한 해싱 필요)
    const relevant = {
      resource: context.resource?.id || '',
      action: context.action || '',
      environment: {
        ipAddress: context.environment?.ipAddress || '',
        location: context.environment?.location?.country || ''
      }
    };
    
    return Buffer.from(JSON.stringify(relevant)).toString('base64').substr(0, 8);
  }

  private getCachedResult(key: string): PermissionCache | null {
    const cached = this.permissionCache.get(key);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.permissionCache.delete(key);
      return null;
    }

    return cached;
  }

  private setCachedResult(key: string, result: boolean, ttl?: number): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    // 캐시 크기 제한 확인
    if (this.permissionCache.size >= this.config.maxCacheSize) {
      this.evictOldestCacheEntries();
    }

    this.permissionCache.set(key, {
      key,
      result,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTtl
    });
  }

  private evictOldestCacheEntries(): void {
    const entries = Array.from(this.permissionCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // 가장 오래된 10% 제거
    const toRemove = Math.floor(entries.length * 0.1);
    entries.slice(0, toRemove).forEach(([key]) => {
      this.permissionCache.delete(key);
    });
  }

  private findPermission(userId: string, permissionName: string): Permission | null {
    // 직접 권한에서 찾기
    const userPermissions = this.userPermissions.get(userId) || [];
    let permission = userPermissions.find(p => p.name === permissionName);
    
    if (permission) {
      return permission;
    }

    // 역할 권한에서 찾기
    const userRoles = this.userRoles.get(userId) || [];
    for (const role of userRoles) {
      permission = role.permissions.find(p => p.name === permissionName);
      if (permission) {
        return permission;
      }
    }

    return null;
  }

  private evaluateConditions(
    conditions: PermissionCondition[],
    context: PermissionContext
  ): ConditionEvaluationResult[] {
    return conditions.map(condition => this.evaluateCondition(condition, context));
  }

  private evaluateCondition(
    condition: PermissionCondition,
    context: PermissionContext
  ): ConditionEvaluationResult {
    try {
      const actualValue = this.getNestedValue(context, condition.field);
      const result = this.compareValues(actualValue, condition.operator, condition.value);

      return {
        condition,
        result,
        actualValue,
        reason: result ? '조건을 만족합니다' : '조건을 만족하지 않습니다'
      };

    } catch (error) {
      this.logger.warn('조건 평가 실패', { condition, error });
      
      return {
        condition,
        result: false,
        reason: '조건 평가 중 오류가 발생했습니다'
      };
    }
  }

  private compareValues(actual: any, operator: ConditionOperator, expected: any): boolean {
    switch (operator) {
      case ConditionOperator.EQ:
        return actual === expected;
      case ConditionOperator.NE:
        return actual !== expected;
      case ConditionOperator.IN:
        return Array.isArray(expected) && expected.includes(actual);
      case ConditionOperator.NIN:
        return Array.isArray(expected) && !expected.includes(actual);
      case ConditionOperator.GT:
        return actual > expected;
      case ConditionOperator.GTE:
        return actual >= expected;
      case ConditionOperator.LT:
        return actual < expected;
      case ConditionOperator.LTE:
        return actual <= expected;
      case ConditionOperator.CONTAINS:
        return String(actual).includes(String(expected));
      case ConditionOperator.STARTS_WITH:
        return String(actual).startsWith(String(expected));
      case ConditionOperator.ENDS_WITH:
        return String(actual).endsWith(String(expected));
      case ConditionOperator.REGEX:
        return new RegExp(expected).test(String(actual));
      default:
        this.logger.warn('알 수 없는 조건 연산자', { operator });
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  private emitEvent(event: PermissionEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.logger.error('이벤트 핸들러 실행 실패', error);
      }
    });
  }
}
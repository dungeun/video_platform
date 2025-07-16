/**
 * @company/auth-core - 권한 관리자
 * 사용자 권한 및 역할 관리
 */

import { Logger } from '@company/core';
import { Role, Permission, PermissionAction, PermissionCondition } from '../types';

export class PermissionManager {
  private logger: Logger;
  private userRoles: Role[] = [];
  private userPermissions: Permission[] = [];
  private permissionCache: Map<string, boolean> = new Map();

  constructor() {
    this.logger = new Logger('PermissionManager');
  }

  // ===== 권한 로드 =====

  /**
   * 사용자 권한 로드
   */
  public async loadUserPermissions(userId: string): Promise<void> {
    try {
      this.logger.debug('사용자 권한 로드 시작', { userId });

      // 실제 구현에서는 API 호출로 권한 정보 조회
      // 여기서는 기본 권한 설정
      await this.loadRolesFromAPI(userId);
      await this.loadPermissionsFromAPI(userId);

      this.buildPermissionCache();

      this.logger.info('사용자 권한 로드 완료', { 
        userId,
        rolesCount: this.userRoles.length,
        permissionsCount: this.userPermissions.length
      });

    } catch (error) {
      this.logger.error('사용자 권한 로드 실패', error);
      throw error;
    }
  }

  /**
   * 권한 정보 초기화
   */
  public clearPermissions(): void {
    this.userRoles = [];
    this.userPermissions = [];
    this.permissionCache.clear();
    this.logger.debug('권한 정보 초기화 완료');
  }

  // ===== 권한 검사 =====

  /**
   * 특정 권한 보유 여부 확인
   */
  public hasPermission(permissionName: string): boolean {
    // 캐시에서 먼저 확인
    if (this.permissionCache.has(permissionName)) {
      return this.permissionCache.get(permissionName)!;
    }

    // 직접 권한 확인
    const hasDirectPermission = this.userPermissions.some(
      permission => permission.name === permissionName
    );

    if (hasDirectPermission) {
      this.permissionCache.set(permissionName, true);
      return true;
    }

    // 역할을 통한 권한 확인
    const hasRolePermission = this.userRoles.some(role =>
      role.permissions.some(permission => permission.name === permissionName)
    );

    this.permissionCache.set(permissionName, hasRolePermission);
    return hasRolePermission;
  }

  /**
   * 특정 역할 보유 여부 확인
   */
  public hasRole(roleName: string): boolean {
    return this.userRoles.some(role => role.name === roleName);
  }

  /**
   * 여러 권한 중 하나라도 보유 여부 확인
   */
  public hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * 모든 권한 보유 여부 확인
   */
  public hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * 리소스에 대한 특정 액션 권한 확인
   */
  public checkPermission(resource: string, action: PermissionAction, context?: any): boolean {
    const permission = this.findPermission(resource, action);
    
    if (!permission) {
      return false;
    }

    // 조건부 권한 확인
    if (permission.conditions && permission.conditions.length > 0) {
      return this.evaluateConditions(permission.conditions, context);
    }

    return true;
  }

  /**
   * 관리자 권한 확인
   */
  public isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('superAdmin');
  }

  /**
   * 시스템 권한 확인
   */
  public isSystemUser(): boolean {
    return this.hasRole('system');
  }

  // ===== 권한 정보 조회 =====

  /**
   * 사용자의 모든 역할 조회
   */
  public getUserRoles(): Role[] {
    return [...this.userRoles];
  }

  /**
   * 사용자의 모든 권한 조회
   */
  public getUserPermissions(): Permission[] {
    return [...this.userPermissions];
  }

  /**
   * 특정 리소스에 대한 권한 조회
   */
  public getResourcePermissions(resource: string): Permission[] {
    const directPermissions = this.userPermissions.filter(
      permission => permission.resource === resource
    );

    const rolePermissions = this.userRoles.flatMap(role =>
      role.permissions.filter(permission => permission.resource === resource)
    );

    // 중복 제거
    const allPermissions = [...directPermissions, ...rolePermissions];
    const uniquePermissions = allPermissions.filter((permission, index, array) =>
      array.findIndex(p => p.id === permission.id) === index
    );

    return uniquePermissions;
  }

  /**
   * 권한 요약 정보 조회
   */
  public getPermissionSummary(): {
    roles: string[];
    permissions: string[];
    isAdmin: boolean;
    resourceCount: number;
  } {
    const roles = this.userRoles.map(role => role.name);
    
    const allPermissions = [
      ...this.userPermissions,
      ...this.userRoles.flatMap(role => role.permissions)
    ];
    
    const uniquePermissionNames = [...new Set(allPermissions.map(p => p.name))];
    const uniqueResources = [...new Set(allPermissions.map(p => p.resource))];

    return {
      roles,
      permissions: uniquePermissionNames,
      isAdmin: this.isAdmin(),
      resourceCount: uniqueResources.length
    };
  }

  // ===== 내부 메소드 =====

  /**
   * API에서 역할 정보 로드
   */
  private async loadRolesFromAPI(userId: string): Promise<void> {
    // 실제 구현에서는 API 호출
    // 여기서는 기본 역할 설정
    this.userRoles = [
      {
        id: 'user-role',
        name: 'user',
        description: '일반 사용자',
        permissions: [],
        isSystem: false
      }
    ];
  }

  /**
   * API에서 권한 정보 로드
   */
  private async loadPermissionsFromAPI(userId: string): Promise<void> {
    // 실제 구현에서는 API 호출
    // 여기서는 기본 권한 설정
    this.userPermissions = [
      {
        id: 'profile-read',
        name: 'profile.read',
        resource: 'profile',
        action: PermissionAction.READ
      },
      {
        id: 'profile-update',
        name: 'profile.update',
        resource: 'profile',
        action: PermissionAction.UPDATE,
        conditions: [
          {
            field: 'userId',
            operator: 'eq',
            value: userId
          }
        ]
      }
    ];
  }

  /**
   * 권한 캐시 구축
   */
  private buildPermissionCache(): void {
    this.permissionCache.clear();

    // 직접 권한 캐싱
    this.userPermissions.forEach(permission => {
      this.permissionCache.set(permission.name, true);
    });

    // 역할 권한 캐싱
    this.userRoles.forEach(role => {
      role.permissions.forEach(permission => {
        this.permissionCache.set(permission.name, true);
      });
    });

    this.logger.debug('권한 캐시 구축 완료', { 
      cacheSize: this.permissionCache.size 
    });
  }

  /**
   * 특정 리소스와 액션에 대한 권한 찾기
   */
  private findPermission(resource: string, action: PermissionAction): Permission | null {
    // 직접 권한에서 찾기
    let permission = this.userPermissions.find(
      p => p.resource === resource && p.action === action
    );

    if (permission) {
      return permission;
    }

    // 역할 권한에서 찾기
    for (const role of this.userRoles) {
      permission = role.permissions.find(
        p => p.resource === resource && p.action === action
      );
      
      if (permission) {
        return permission;
      }
    }

    return null;
  }

  /**
   * 권한 조건 평가
   */
  private evaluateConditions(conditions: PermissionCondition[], context?: any): boolean {
    if (!context) {
      return false;
    }

    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(context, condition.field);
      
      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value;
        case 'ne':
          return fieldValue !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'nin':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        case 'gt':
          return fieldValue > condition.value;
        case 'gte':
          return fieldValue >= condition.value;
        case 'lt':
          return fieldValue < condition.value;
        case 'lte':
          return fieldValue <= condition.value;
        default:
          this.logger.warn('알 수 없는 조건 연산자', { operator: condition.operator });
          return false;
      }
    });
  }

  /**
   * 중첩된 객체에서 값 추출
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * 권한 정보 검증
   */
  public validatePermissions(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 역할 검증
    this.userRoles.forEach(role => {
      if (!role.id || !role.name) {
        errors.push(`잘못된 역할 정보: ${role.name || 'unknown'}`);
      }
    });

    // 권한 검증
    this.userPermissions.forEach(permission => {
      if (!permission.id || !permission.name || !permission.resource) {
        errors.push(`잘못된 권한 정보: ${permission.name || 'unknown'}`);
      }
    });

    // 순환 참조 검증 (역할 간)
    const roleNames = new Set(this.userRoles.map(r => r.name));
    if (roleNames.size !== this.userRoles.length) {
      errors.push('중복된 역할이 존재합니다');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 권한 디버그 정보
   */
  public getDebugInfo(): any {
    return {
      roles: this.userRoles.map(role => ({
        id: role.id,
        name: role.name,
        permissionCount: role.permissions.length
      })),
      directPermissions: this.userPermissions.map(p => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action
      })),
      cacheSize: this.permissionCache.size,
      validation: this.validatePermissions()
    };
  }
}
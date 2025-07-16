/**
 * @company/permissions - 권한 유틸리티 함수
 * Helper functions for permission management
 */

import {
  Permission,
  Role,
  PermissionAction,
  PermissionCondition,
  ConditionOperator,
  LogicalOperator,
  ScopeType,
  PermissionValidationResult,
  PermissionValidationError,
  PermissionValidationWarning
} from '../types';

/**
 * 권한명 생성
 */
export function createPermissionName(resource: string, action: PermissionAction): string {
  return `${resource}.${action}`;
}

/**
 * 권한명 파싱
 */
export function parsePermissionName(permissionName: string): {
  resource: string;
  action: PermissionAction;
} | null {
  const parts = permissionName.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [resource, action] = parts;
  if (!Object.values(PermissionAction).includes(action as PermissionAction)) {
    return null;
  }

  return {
    resource,
    action: action as PermissionAction
  };
}

/**
 * 권한 객체 생성
 */
export function createPermission(
  id: string,
  resource: string,
  action: PermissionAction,
  conditions?: PermissionCondition[]
): Permission {
  return {
    id,
    name: createPermissionName(resource, action),
    resource,
    action,
    conditions
  };
}

/**
 * 조건 생성
 */
export function createCondition(
  field: string,
  operator: ConditionOperator,
  value: any,
  logicalOperator?: LogicalOperator
): PermissionCondition {
  return {
    field,
    operator,
    value,
    logicalOperator
  };
}

/**
 * 역할에서 권한 추출
 */
export function extractPermissionsFromRoles(roles: Role[]): Permission[] {
  const permissions = new Map<string, Permission>();

  roles.forEach(role => {
    role.permissions.forEach(permission => {
      permissions.set(permission.name, permission);
    });
  });

  return Array.from(permissions.values());
}

/**
 * 권한 중복 제거
 */
export function deduplicatePermissions(permissions: Permission[]): Permission[] {
  const unique = new Map<string, Permission>();

  permissions.forEach(permission => {
    unique.set(permission.name, permission);
  });

  return Array.from(unique.values());
}

/**
 * 권한 정렬
 */
export function sortPermissions(
  permissions: Permission[],
  sortBy: 'name' | 'resource' | 'action' = 'name'
): Permission[] {
  return [...permissions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'resource':
        return a.resource.localeCompare(b.resource);
      case 'action':
        return a.action.localeCompare(b.action);
      default:
        return 0;
    }
  });
}

/**
 * 권한 필터링
 */
export function filterPermissions(
  permissions: Permission[],
  filters: {
    resource?: string;
    action?: PermissionAction;
    hasConditions?: boolean;
    scope?: ScopeType;
  }
): Permission[] {
  return permissions.filter(permission => {
    if (filters.resource && permission.resource !== filters.resource) {
      return false;
    }

    if (filters.action && permission.action !== filters.action) {
      return false;
    }

    if (filters.hasConditions !== undefined) {
      const hasConditions = !!(permission.conditions && permission.conditions.length > 0);
      if (hasConditions !== filters.hasConditions) {
        return false;
      }
    }

    if (filters.scope && permission.scope?.type !== filters.scope) {
      return false;
    }

    return true;
  });
}

/**
 * 권한 그룹화
 */
export function groupPermissionsByResource(permissions: Permission[]): Map<string, Permission[]> {
  const groups = new Map<string, Permission[]>();

  permissions.forEach(permission => {
    const existing = groups.get(permission.resource) || [];
    existing.push(permission);
    groups.set(permission.resource, existing);
  });

  return groups;
}

/**
 * 권한 계층 구조 생성
 */
export function createPermissionHierarchy(permissions: Permission[]): {
  [resource: string]: {
    [action: string]: Permission;
  };
} {
  const hierarchy: any = {};

  permissions.forEach(permission => {
    if (!hierarchy[permission.resource]) {
      hierarchy[permission.resource] = {};
    }
    hierarchy[permission.resource][permission.action] = permission;
  });

  return hierarchy;
}

/**
 * 권한 상속 처리
 */
export function resolvePermissionInheritance(
  directPermissions: Permission[],
  roles: Role[]
): Permission[] {
  const allPermissions = new Map<string, Permission>();

  // 직접 권한 추가
  directPermissions.forEach(permission => {
    allPermissions.set(permission.name, permission);
  });

  // 역할에서 권한 상속
  const inheritedPermissions = extractPermissionsFromRoles(roles);
  inheritedPermissions.forEach(permission => {
    if (!allPermissions.has(permission.name)) {
      allPermissions.set(permission.name, permission);
    }
  });

  return Array.from(allPermissions.values());
}

/**
 * 권한 검증
 */
export function validatePermissions(permissions: Permission[]): PermissionValidationResult {
  const errors: PermissionValidationError[] = [];
  const warnings: PermissionValidationWarning[] = [];

  permissions.forEach((permission, index) => {
    // 필수 필드 검증
    if (!permission.id) {
      errors.push({
        code: 'MISSING_ID',
        message: `권한 ID가 누락되었습니다 (인덱스: ${index})`,
        field: 'id'
      });
    }

    if (!permission.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: `권한 이름이 누락되었습니다 (인덱스: ${index})`,
        field: 'name'
      });
    }

    if (!permission.resource) {
      errors.push({
        code: 'MISSING_RESOURCE',
        message: `권한 리소스가 누락되었습니다 (인덱스: ${index})`,
        field: 'resource'
      });
    }

    if (!permission.action) {
      errors.push({
        code: 'MISSING_ACTION',
        message: `권한 액션이 누락되었습니다 (인덱스: ${index})`,
        field: 'action'
      });
    }

    // 권한명 형식 검증
    if (permission.name && permission.resource && permission.action) {
      const expectedName = createPermissionName(permission.resource, permission.action);
      if (permission.name !== expectedName) {
        warnings.push({
          code: 'NAME_MISMATCH',
          message: `권한명이 예상 형식과 다릅니다: ${permission.name} (예상: ${expectedName})`,
          suggestion: `권한명을 ${expectedName}으로 변경하는 것을 권장합니다`
        });
      }
    }

    // 조건 검증
    if (permission.conditions) {
      permission.conditions.forEach((condition, condIndex) => {
        if (!condition.field) {
          errors.push({
            code: 'MISSING_CONDITION_FIELD',
            message: `조건 필드가 누락되었습니다 (권한: ${permission.name}, 조건 인덱스: ${condIndex})`,
            field: 'conditions'
          });
        }

        if (!condition.operator) {
          errors.push({
            code: 'MISSING_CONDITION_OPERATOR',
            message: `조건 연산자가 누락되었습니다 (권한: ${permission.name}, 조건 인덱스: ${condIndex})`,
            field: 'conditions'
          });
        }

        if (condition.value === undefined || condition.value === null) {
          warnings.push({
            code: 'NULL_CONDITION_VALUE',
            message: `조건 값이 null/undefined입니다 (권한: ${permission.name}, 조건 인덱스: ${condIndex})`,
            suggestion: '조건 값을 명시적으로 설정하는 것을 권장합니다'
          });
        }
      });
    }
  });

  // 중복 권한 확인
  const nameCount = new Map<string, number>();
  permissions.forEach(permission => {
    const count = nameCount.get(permission.name) || 0;
    nameCount.set(permission.name, count + 1);
  });

  nameCount.forEach((count, name) => {
    if (count > 1) {
      errors.push({
        code: 'DUPLICATE_PERMISSION',
        message: `중복된 권한이 있습니다: ${name} (${count}개)`,
        value: name
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 역할 검증
 */
export function validateRoles(roles: Role[]): PermissionValidationResult {
  const errors: PermissionValidationError[] = [];
  const warnings: PermissionValidationWarning[] = [];

  roles.forEach((role, index) => {
    // 필수 필드 검증
    if (!role.id) {
      errors.push({
        code: 'MISSING_ID',
        message: `역할 ID가 누락되었습니다 (인덱스: ${index})`,
        field: 'id'
      });
    }

    if (!role.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: `역할 이름이 누락되었습니다 (인덱스: ${index})`,
        field: 'name'
      });
    }

    // 권한 검증
    if (role.permissions) {
      const permissionValidation = validatePermissions(role.permissions);
      errors.push(...permissionValidation.errors.map(error => ({
        ...error,
        message: `역할 ${role.name}의 ${error.message}`
      })));
      warnings.push(...permissionValidation.warnings.map(warning => ({
        ...warning,
        message: `역할 ${role.name}의 ${warning.message}`
      })));
    }
  });

  // 중복 역할 확인
  const nameCount = new Map<string, number>();
  roles.forEach(role => {
    const count = nameCount.get(role.name) || 0;
    nameCount.set(role.name, count + 1);
  });

  nameCount.forEach((count, name) => {
    if (count > 1) {
      errors.push({
        code: 'DUPLICATE_ROLE',
        message: `중복된 역할이 있습니다: ${name} (${count}개)`,
        value: name
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 권한 집합 비교
 */
export function comparePermissionSets(
  setA: Permission[],
  setB: Permission[]
): {
  added: Permission[];
  removed: Permission[];
  common: Permission[];
  modified: Array<{
    old: Permission;
    new: Permission;
  }>;
} {
  const mapA = new Map(setA.map(p => [p.name, p]));
  const mapB = new Map(setB.map(p => [p.name, p]));

  const added: Permission[] = [];
  const removed: Permission[] = [];
  const common: Permission[] = [];
  const modified: Array<{ old: Permission; new: Permission }> = [];

  // B에는 있지만 A에는 없는 것 (추가됨)
  mapB.forEach((permission, name) => {
    if (!mapA.has(name)) {
      added.push(permission);
    }
  });

  // A에는 있지만 B에는 없는 것 (제거됨)
  mapA.forEach((permission, name) => {
    if (!mapB.has(name)) {
      removed.push(permission);
    }
  });

  // 둘 다 있는 것 (공통/수정됨)
  mapA.forEach((oldPermission, name) => {
    const newPermission = mapB.get(name);
    if (newPermission) {
      if (JSON.stringify(oldPermission) === JSON.stringify(newPermission)) {
        common.push(oldPermission);
      } else {
        modified.push({
          old: oldPermission,
          new: newPermission
        });
      }
    }
  });

  return { added, removed, common, modified };
}
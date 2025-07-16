/**
 * @company/permissions - 권한 관리 타입 정의
 * Ultra-fine-grained permission management types
 */

// ===== Core Permission Types =====

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  parentRole?: string;
  metadata?: Record<string, any>;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  conditions?: PermissionCondition[];
  scope?: PermissionScope;
  metadata?: Record<string, any>;
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  ADMIN = 'admin',
  LIST = 'list',
  EXECUTE = 'execute',
  MANAGE = 'manage'
}

export interface PermissionCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export enum ConditionOperator {
  EQ = 'eq',
  NE = 'ne',
  IN = 'in',
  NIN = 'nin',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex'
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

export interface PermissionScope {
  type: ScopeType;
  values: string[];
  excludes?: string[];
}

export enum ScopeType {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  PROJECT = 'project',
  TEAM = 'team',
  USER = 'user'
}

// ===== Permission Context =====

export interface PermissionContext {
  userId: string;
  resource?: any;
  action?: string;
  environment?: EnvironmentContext;
  request?: RequestContext;
  metadata?: Record<string, any>;
}

export interface EnvironmentContext {
  ipAddress?: string;
  userAgent?: string;
  location?: LocationContext;
  time?: TimeContext;
}

export interface LocationContext {
  country?: string;
  region?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface TimeContext {
  timestamp: Date;
  timezone: string;
  businessHours?: boolean;
  dayOfWeek?: number;
}

export interface RequestContext {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  query?: Record<string, any>;
}

// ===== Permission Evaluation =====

export interface PermissionEvaluationResult {
  granted: boolean;
  reason?: string;
  conditions?: ConditionEvaluationResult[];
  metadata?: Record<string, any>;
}

export interface ConditionEvaluationResult {
  condition: PermissionCondition;
  result: boolean;
  actualValue?: any;
  reason?: string;
}

export interface PermissionEvaluationOptions {
  useCache?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
  includeReasons?: boolean;
  strictMode?: boolean;
}

// ===== Permission Manager =====

export interface PermissionManagerConfig {
  cacheEnabled: boolean;
  cacheTtl: number; // seconds
  maxCacheSize: number;
  strictMode: boolean;
  enableDebugMode: boolean;
  defaultScope: ScopeType;
}

export interface PermissionCache {
  key: string;
  result: boolean;
  timestamp: number;
  ttl: number;
  metadata?: Record<string, any>;
}

export interface PermissionLoadOptions {
  includeInherited?: boolean;
  includeDisabled?: boolean;
  filterByScope?: ScopeType[];
  limit?: number;
  offset?: number;
}

// ===== Permission Summary =====

export interface PermissionSummary {
  userId: string;
  roles: RoleSummary[];
  permissions: PermissionSummary[];
  effectivePermissions: string[];
  scopes: ScopeType[];
  lastUpdated: Date;
  cacheInfo?: CacheInfo;
}

export interface RoleSummary {
  id: string;
  name: string;
  source: RoleSource;
  inherited: boolean;
  permissionCount: number;
}

export interface PermissionSummary {
  name: string;
  resource: string;
  action: PermissionAction;
  source: PermissionSource;
  inherited: boolean;
  hasConditions: boolean;
  scope?: ScopeType;
}

export interface CacheInfo {
  size: number;
  hitRate: number;
  lastCleared: Date;
  entries: number;
}

export enum RoleSource {
  DIRECT = 'direct',
  INHERITED = 'inherited',
  GROUP = 'group',
  SYSTEM = 'system'
}

export enum PermissionSource {
  ROLE = 'role',
  DIRECT = 'direct',
  COMPUTED = 'computed',
  SYSTEM = 'system'
}

// ===== Permission Events =====

export interface PermissionEvent {
  type: PermissionEventType;
  userId: string;
  resource?: string;
  permission?: string;
  role?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum PermissionEventType {
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_DENIED = 'permission.denied',
  ROLE_ADDED = 'role.added',
  ROLE_REMOVED = 'role.removed',
  PERMISSION_ADDED = 'permission.added',
  PERMISSION_REMOVED = 'permission.removed',
  CACHE_CLEARED = 'cache.cleared',
  PERMISSIONS_LOADED = 'permissions.loaded'
}

// ===== Hook Return Types =====

export interface UsePermissionReturn {
  hasPermission: (permission: string, context?: PermissionContext) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[], context?: PermissionContext) => boolean;
  hasAllPermissions: (permissions: string[], context?: PermissionContext) => boolean;
  checkPermission: (resource: string, action: PermissionAction, context?: PermissionContext) => boolean;
  evaluatePermission: (
    permission: string, 
    context?: PermissionContext, 
    options?: PermissionEvaluationOptions
  ) => PermissionEvaluationResult;
  getPermissionSummary: () => PermissionSummary | null;
  isLoading: boolean;
  error: string | null;
}

export interface UsePermissionCacheReturn {
  clearCache: () => void;
  getCacheStats: () => CacheInfo;
  warmupCache: (permissions: string[]) => Promise<void>;
  preloadPermissions: (userId: string) => Promise<void>;
}

// ===== Validation Types =====

export interface PermissionValidationResult {
  isValid: boolean;
  errors: PermissionValidationError[];
  warnings: PermissionValidationWarning[];
}

export interface PermissionValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

export interface PermissionValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// ===== Error Types =====

export enum PermissionErrorCode {
  PERMISSION_NOT_FOUND = 'PERM_001',
  ROLE_NOT_FOUND = 'PERM_002',
  INVALID_CONDITION = 'PERM_003',
  EVALUATION_FAILED = 'PERM_004',
  CACHE_ERROR = 'PERM_005',
  VALIDATION_FAILED = 'PERM_006',
  CONTEXT_MISSING = 'PERM_007',
  CIRCULAR_DEPENDENCY = 'PERM_008'
}

export class PermissionError extends Error {
  public readonly code: PermissionErrorCode;
  public readonly metadata?: Record<string, any>;

  constructor(code: PermissionErrorCode, message: string, metadata?: Record<string, any>) {
    super(message);
    this.name = 'PermissionError';
    this.code = code;
    this.metadata = metadata;
  }
}
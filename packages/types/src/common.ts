/**
 * @repo/types - 공통 기본 타입
 */

// ===== 기본 ID 타입 =====
export type ID = string;
export type UUID = string;
export type Timestamp = number;
export type DateString = string; // ISO 8601 format

// ===== 응답 타입 =====
export interface Response<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
  meta?: ResponseMeta;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export interface ResponseMeta {
  version: string;
  requestId: string;
  duration: number;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===== 페이지네이션 =====
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends Response<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}

// ===== 검색 타입 =====
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

export interface SearchResponse<T> extends PaginatedResponse<T> {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
    searchMeta: {
      query: string;
      totalMatches: number;
      searchTime: number;
    };
  };
}

// ===== 정렬 타입 =====
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  priority?: number;
}

export type SortParams = SortOption[] | string;

// ===== 필터 타입 =====
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  type?: 'and' | 'or';
}

export type FilterOperator = 
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'like'    // contains (case insensitive)
  | 'regex'   // regex match
  | 'exists'  // field exists
  | 'null'    // is null
  | 'empty';  // is empty

// ===== 상태 타입 =====
export type Status = 'active' | 'inactive' | 'pending' | 'disabled' | 'deleted';

export interface StatusInfo {
  status: Status;
  changedAt: Date;
  changedBy?: ID;
  reason?: string;
}

// ===== 메타데이터 타입 =====
export interface EntityMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ID;
  updatedBy?: ID;
  version: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ===== 주소 타입 =====
export interface Address {
  country: string;
  state?: string;
  city: string;
  district?: string;
  street: string;
  detail?: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

// ===== 연락처 타입 =====
export interface ContactInfo {
  phone?: string;
  mobile?: string;
  email?: string;
  fax?: string;
  website?: string;
}

// ===== 파일 타입 =====
export interface FileInfo {
  id: ID;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy?: ID;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    encoding?: string;
  };
}

export interface FileUpload {
  file: File | Buffer;
  fileName: string;
  mimeType: string;
  metadata?: Record<string, any>;
}

// ===== 통화 타입 =====
export interface Money {
  amount: number;
  currency: Currency;
}

export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY';

// ===== 언어/지역 타입 =====
export type Locale = 'ko-KR' | 'en-US' | 'ja-JP' | 'zh-CN' | 'es-ES';
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es';
export type Timezone = string; // IANA timezone

// ===== 색상 타입 =====
export interface Color {
  hex: string;
  rgb?: [number, number, number];
  hsl?: [number, number, number];
  name?: string;
}

// ===== 좌표 타입 =====
export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface BoundingBox {
  topLeft: Coordinates;
  bottomRight: Coordinates;
}

// ===== 통계 타입 =====
export interface Statistics {
  count: number;
  sum?: number;
  average?: number;
  min?: number;
  max?: number;
  median?: number;
  standardDeviation?: number;
}

// ===== 설정 타입 =====
export interface Configuration {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  isPublic: boolean;
  updatedAt: Date;
  updatedBy?: ID;
}

// ===== 알림 타입 =====
export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  category?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// ===== 로그 타입 =====
export interface LogEntry {
  id: ID;
  level: LogLevel;
  message: string;
  module: string;
  userId?: ID;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ===== 이벤트 타입 =====
export interface Event {
  id: ID;
  type: string;
  source: string;
  target?: string;
  payload: any;
  userId?: ID;
  sessionId?: string;
  correlationId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ===== 감사 타입 =====
export interface AuditLog {
  id: ID;
  action: AuditAction;
  entityType: string;
  entityId: ID;
  userId?: ID;
  changes?: Record<string, { before?: any; after?: any }>;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import';

// ===== 유틸리티 타입 =====
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type NonNullable<T> = T extends null | undefined ? never : T;

// ===== 조건부 타입 =====
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type IsArray<T> = T extends any[] ? true : false;
export type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

// ===== 배열 타입 =====
export type ArrayElement<T> = T extends (infer U)[] ? U : never;
export type NonEmptyArray<T> = [T, ...T[]];

// ===== 객체 타입 =====
export type ObjectKeys<T> = keyof T;
export type ObjectValues<T> = T[keyof T];
export type ObjectEntries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

// ===== 함수 타입 =====
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;
export type EventHandler<T = any> = (event: T) => void | Promise<void>;
export type Validator<T = any> = (value: T) => boolean | string | Promise<boolean | string>;

// ===== 상수 타입 =====
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

export const MIME_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  PDF: 'application/pdf',
  CSV: 'text/csv',
  HTML: 'text/html',
  PLAIN: 'text/plain',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  SVG: 'image/svg+xml'
} as const;

export type MimeType = typeof MIME_TYPES[keyof typeof MIME_TYPES];
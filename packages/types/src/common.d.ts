/**
 * @repo/types - 공통 기본 타입
 */
export type ID = string;
export type UUID = string;
export type Timestamp = number;
export type DateString = string;
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
export interface SortOption {
    field: string;
    direction: 'asc' | 'desc';
    priority?: number;
}
export type SortParams = SortOption[] | string;
export interface FilterCondition {
    field: string;
    operator: FilterOperator;
    value: any;
    type?: 'and' | 'or';
}
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'regex' | 'exists' | 'null' | 'empty';
export type Status = 'active' | 'inactive' | 'pending' | 'disabled' | 'deleted';
export interface StatusInfo {
    status: Status;
    changedAt: Date;
    changedBy?: ID;
    reason?: string;
}
export interface EntityMetadata {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: ID;
    updatedBy?: ID;
    version: number;
    tags?: string[];
    metadata?: Record<string, any>;
}
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
export interface ContactInfo {
    phone?: string;
    mobile?: string;
    email?: string;
    fax?: string;
    website?: string;
}
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
export interface Money {
    amount: number;
    currency: Currency;
}
export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY';
export type Locale = 'ko-KR' | 'en-US' | 'ja-JP' | 'zh-CN' | 'es-ES';
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es';
export type Timezone = string;
export interface Color {
    hex: string;
    rgb?: [number, number, number];
    hsl?: [number, number, number];
    name?: string;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude?: number;
}
export interface BoundingBox {
    topLeft: Coordinates;
    bottomRight: Coordinates;
}
export interface Statistics {
    count: number;
    sum?: number;
    average?: number;
    min?: number;
    max?: number;
    median?: number;
    standardDeviation?: number;
}
export interface Configuration {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    isPublic: boolean;
    updatedAt: Date;
    updatedBy?: ID;
}
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
export interface AuditLog {
    id: ID;
    action: AuditAction;
    entityType: string;
    entityId: ID;
    userId?: ID;
    changes?: Record<string, {
        before?: any;
        after?: any;
    }>;
    metadata?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import';
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];
export type NonNullable<T> = T extends null | undefined ? never : T;
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type IsArray<T> = T extends any[] ? true : false;
export type IsFunction<T> = T extends (...args: any[]) => any ? true : false;
export type ArrayElement<T> = T extends (infer U)[] ? U : never;
export type NonEmptyArray<T> = [T, ...T[]];
export type ObjectKeys<T> = keyof T;
export type ObjectValues<T> = T[keyof T];
export type ObjectEntries<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T][];
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;
export type EventHandler<T = any> = (event: T) => void | Promise<void>;
export type Validator<T = any> = (value: T) => boolean | string | Promise<boolean | string>;
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export declare const MIME_TYPES: {
    readonly JSON: "application/json";
    readonly XML: "application/xml";
    readonly PDF: "application/pdf";
    readonly CSV: "text/csv";
    readonly HTML: "text/html";
    readonly PLAIN: "text/plain";
    readonly JPEG: "image/jpeg";
    readonly PNG: "image/png";
    readonly GIF: "image/gif";
    readonly SVG: "image/svg+xml";
};
export type MimeType = typeof MIME_TYPES[keyof typeof MIME_TYPES];
//# sourceMappingURL=common.d.ts.map
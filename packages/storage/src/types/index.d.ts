/**
 * @company/storage - 타입 정의
 * 스토리지 시스템 타입
 */
import { Result } from '@company/core';
export interface StorageValue<T = any> {
    data: T;
    metadata?: StorageMetadata;
}
export interface StorageMetadata {
    created: number;
    updated: number;
    expires?: number;
    tags?: string[];
    version?: number;
    checksum?: string;
}
export interface StorageOptions {
    ttl?: number;
    encrypt?: boolean;
    compress?: boolean;
    namespace?: string;
    version?: number;
    tags?: string[];
}
export interface StorageQuery {
    prefix?: string;
    tags?: string[];
    beforeDate?: Date;
    afterDate?: Date;
    limit?: number;
    offset?: number;
    namespace?: string;
}
export interface StorageProvider {
    readonly name: string;
    readonly type: StorageType;
    readonly isAvailable: boolean;
    readonly capacity?: number;
    get<T>(key: string): Promise<Result<T | null>>;
    set<T>(key: string, value: T, options?: StorageOptions): Promise<Result<void>>;
    delete(key: string): Promise<Result<void>>;
    exists(key: string): Promise<Result<boolean>>;
    getMany<T>(keys: string[]): Promise<Result<Map<string, T>>>;
    setMany<T>(entries: Map<string, T>, options?: StorageOptions): Promise<Result<void>>;
    deleteMany(keys: string[]): Promise<Result<void>>;
    keys(query?: StorageQuery): Promise<Result<string[]>>;
    values<T>(query?: StorageQuery): Promise<Result<T[]>>;
    entries<T>(query?: StorageQuery): Promise<Result<Array<[string, T]>>>;
    clear(namespace?: string): Promise<Result<void>>;
    size(namespace?: string): Promise<Result<number>>;
    initialize?(): Promise<Result<void>>;
    destroy?(): Promise<Result<void>>;
}
export declare enum StorageType {
    LOCAL = "local",
    SESSION = "session",
    INDEXED_DB = "indexedDB",
    MEMORY = "memory",
    COOKIE = "cookie",
    CACHE = "cache"
}
export interface LocalStorageConfig {
    prefix?: string;
    separator?: string;
    serializer?: StorageSerializer;
    maxSize?: number;
}
export interface SessionStorageConfig extends LocalStorageConfig {
}
export interface IndexedDBConfig {
    databaseName: string;
    version?: number;
    stores: IndexedDBStoreConfig[];
    onUpgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number) => void;
}
export interface IndexedDBStoreConfig {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: IndexedDBIndexConfig[];
}
export interface IndexedDBIndexConfig {
    name: string;
    keyPath: string | string[];
    unique?: boolean;
    multiEntry?: boolean;
}
export interface MemoryStorageConfig {
    maxSize?: number;
    evictionPolicy?: EvictionPolicy;
    ttl?: number;
}
export declare enum EvictionPolicy {
    LRU = "lru",// Least Recently Used
    LFU = "lfu",// Least Frequently Used
    FIFO = "fifo",// First In First Out
    RANDOM = "random"
}
export interface CookieStorageConfig {
    domain?: string;
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
    maxAge?: number;
}
export interface CacheStorageConfig {
    cacheName: string;
    version?: string;
    maxAge?: number;
    maxEntries?: number;
}
export interface StorageSerializer {
    serialize<T>(value: T): string;
    deserialize<T>(value: string): T;
}
export interface StorageEncryption {
    encrypt(data: string, key?: string): Promise<string>;
    decrypt(data: string, key?: string): Promise<string>;
}
export interface StorageCompression {
    compress(data: string): Promise<string>;
    decompress(data: string): Promise<string>;
}
export interface StorageEvent<T = any> {
    type: StorageEventType;
    key: string;
    oldValue?: T;
    newValue?: T;
    namespace?: string;
    timestamp: number;
}
export declare enum StorageEventType {
    SET = "set",
    DELETE = "delete",
    CLEAR = "clear",
    EXPIRE = "expire"
}
export type StorageListener<T = any> = (event: StorageEvent<T>) => void;
export interface StorageStats {
    provider: string;
    type: StorageType;
    totalSize: number;
    usedSize: number;
    availableSize: number;
    itemCount: number;
    namespaces: string[];
    oldestItem?: Date;
    newestItem?: Date;
}
export interface StorageMigration {
    version: number;
    migrate: (oldData: any) => any;
    rollback?: (newData: any) => any;
}
export interface MigrationOptions {
    fromVersion: number;
    toVersion: number;
    migrations: StorageMigration[];
    onProgress?: (current: number, total: number) => void;
}
export type StorageKey = string;
export type StorageNamespace = string;
export type StorageResult<T> = Result<T>;
export interface StorageAdapter {
    get(key: string): any;
    set(key: string, value: any): void;
    remove(key: string): void;
    clear(): void;
    keys(): string[];
}
export interface StorageConfig {
    defaultProvider?: StorageType;
    providers?: {
        [key in StorageType]?: any;
    };
    encryption?: StorageEncryption;
    compression?: StorageCompression;
    serializer?: StorageSerializer;
    namespace?: string;
    prefix?: string;
    ttl?: number;
    autoCleanup?: boolean;
    cleanupInterval?: number;
}
//# sourceMappingURL=index.d.ts.map
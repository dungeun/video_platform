import { Result } from '@repo/core';
import { StorageProvider, StorageQuery, StorageMetadata, NamespaceStats } from '../types';
export interface IndexedDBConfig {
    dbName: string;
    version?: number;
    storeName?: string;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        options?: IDBIndexParameters;
    }>;
}
export declare class IndexedDBProvider implements StorageProvider {
    private db;
    private config;
    private initPromise;
    constructor(config: IndexedDBConfig);
    initialize(): Promise<Result<void>>;
    private openDatabase;
    get<T = any>(key: string): Promise<Result<T | null>>;
    set<T = any>(key: string, value: T, metadata?: Partial<StorageMetadata>): Promise<Result<void>>;
    delete(key: string): Promise<Result<void>>;
    exists(key: string): Promise<Result<boolean>>;
    clear(namespace?: string): Promise<Result<void>>;
    getMany<T = any>(keys: string[]): Promise<Result<Map<string, T>>>;
    setMany<T = any>(entries: Map<string, T>, metadata?: Partial<StorageMetadata>): Promise<Result<void>>;
    deleteMany(keys: string[]): Promise<Result<void>>;
    keys(query?: StorageQuery): Promise<Result<string[]>>;
    values<T = any>(query?: StorageQuery): Promise<Result<T[]>>;
    entries<T = any>(query?: StorageQuery): Promise<Result<Array<[string, T]>>>;
    size(namespace?: string): Promise<Result<number>>;
    getStats(namespace?: string): Promise<Result<NamespaceStats>>;
    cleanup(): Promise<Result<number>>;
    destroy(): Promise<Result<void>>;
    private ensureInitialized;
    private calculateSize;
    private updateAccessTime;
    query<T = any>(indexName: string, range?: IDBKeyRange | IDBValidKey, direction?: IDBCursorDirection): Promise<Result<T[]>>;
    transaction<T>(callback: (objectStore: IDBObjectStore) => Promise<T>): Promise<Result<T>>;
}
//# sourceMappingURL=IndexedDBProvider.d.ts.map
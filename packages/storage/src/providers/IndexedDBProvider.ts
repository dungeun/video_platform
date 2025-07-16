import { Result } from '@company/core';
import {
  StorageProvider,
  StorageEntry,
  StorageQuery,
  StorageMetadata,
  NamespaceStats
} from '../types';

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

export class IndexedDBProvider implements StorageProvider {
  private db: IDBDatabase | null = null;
  private config: Required<IndexedDBConfig>;
  private initPromise: Promise<void> | null = null;

  constructor(config: IndexedDBConfig) {
    this.config = {
      dbName: config.dbName,
      version: config.version || 1,
      storeName: config.storeName || 'storage',
      indexes: config.indexes || []
    };
  }

  async initialize(): Promise<Result<void>> {
    if (this.db) {
      return Result.success(undefined);
    }

    if (this.initPromise) {
      await this.initPromise;
      return Result.success(undefined);
    }

    this.initPromise = this.openDatabase();
    
    try {
      await this.initPromise;
      return Result.success(undefined);
    } catch (error) {
      return Result.failure('INDEXEDDB_INIT_FAILED', `IndexedDB 초기화 실패: ${error}`);
    }
  }

  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error('IndexedDB 열기 실패'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 객체 저장소 생성
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const objectStore = db.createObjectStore(this.config.storeName, { keyPath: 'key' });
          
          // 기본 인덱스 생성
          objectStore.createIndex('namespace', 'metadata.namespace', { unique: false });
          objectStore.createIndex('expires', 'metadata.expires', { unique: false });
          objectStore.createIndex('created', 'metadata.created', { unique: false });
          objectStore.createIndex('accessed', 'metadata.accessed', { unique: false });
          
          // 사용자 정의 인덱스 생성
          for (const index of this.config.indexes) {
            objectStore.createIndex(index.name, index.keyPath, index.options);
          }
        }
      };
    });
  }

  async get<T = any>(key: string): Promise<Result<T | null>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.config.storeName);
      const request = objectStore.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const entry = request.result as StorageEntry<T> | undefined;
          
          if (!entry) {
            resolve(Result.success(null));
            return;
          }

          // TTL 확인
          if (entry.metadata.expires && entry.metadata.expires < Date.now()) {
            this.delete(key); // 비동기로 삭제
            resolve(Result.success(null));
            return;
          }

          // 접근 시간 업데이트
          this.updateAccessTime(key);

          resolve(Result.success(entry.value));
        };

        request.onerror = () => {
          resolve(Result.failure('INDEXEDDB_GET_FAILED', '값 조회 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_GET_ERROR', `값 조회 중 오류: ${error}`);
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    metadata?: Partial<StorageMetadata>
  ): Promise<Result<void>> {
    await this.ensureInitialized();

    try {
      const now = Date.now();
      const entry: StorageEntry<T> = {
        key,
        value,
        metadata: {
          key,
          created: metadata?.created || now,
          accessed: now,
          modified: now,
          size: this.calculateSize(value),
          namespace: metadata?.namespace || 'default',
          ...metadata
        }
      };

      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.config.storeName);
      const request = objectStore.put(entry);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          resolve(Result.success(undefined));
        };

        request.onerror = () => {
          resolve(Result.failure('INDEXEDDB_SET_FAILED', '값 저장 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_SET_ERROR', `값 저장 중 오류: ${error}`);
    }
  }

  async delete(key: string): Promise<Result<void>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.config.storeName);
      const request = objectStore.delete(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          resolve(Result.success(undefined));
        };

        request.onerror = () => {
          resolve(Result.failure('INDEXEDDB_DELETE_FAILED', '값 삭제 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_DELETE_ERROR', `값 삭제 중 오류: ${error}`);
    }
  }

  async exists(key: string): Promise<Result<boolean>> {
    const result = await this.get(key);
    if (result.isFailure) {
      return Result.failure(result.error, result.message);
    }
    return Result.success(result.data !== null);
  }

  async clear(namespace?: string): Promise<Result<void>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.config.storeName);

      if (!namespace) {
        // 전체 삭제
        const request = objectStore.clear();
        
        return new Promise((resolve) => {
          request.onsuccess = () => {
            resolve(Result.success(undefined));
          };

          request.onerror = () => {
            resolve(Result.failure('INDEXEDDB_CLEAR_FAILED', '전체 삭제 실패'));
          };
        });
      } else {
        // 네임스페이스별 삭제
        const index = objectStore.index('namespace');
        const range = IDBKeyRange.only(namespace);
        const request = index.openCursor(range);

        return new Promise((resolve) => {
          const keysToDelete: string[] = [];

          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              keysToDelete.push(cursor.primaryKey as string);
              cursor.continue();
            } else {
              // 모든 키 수집 완료, 삭제 시작
              Promise.all(
                keysToDelete.map(key => objectStore.delete(key))
              ).then(() => {
                resolve(Result.success(undefined));
              }).catch(() => {
                resolve(Result.failure('INDEXEDDB_CLEAR_NS_FAILED', '네임스페이스 삭제 실패'));
              });
            }
          };

          request.onerror = () => {
            resolve(Result.failure('INDEXEDDB_CLEAR_NS_ERROR', '네임스페이스 조회 실패'));
          };
        });
      }
    } catch (error) {
      return Result.failure('INDEXEDDB_CLEAR_ERROR', `삭제 중 오류: ${error}`);
    }
  }

  async getMany<T = any>(keys: string[]): Promise<Result<Map<string, T>>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const result = await this.get<T>(key);
      if (result.isSuccess && result.data !== null) {
        results.set(key, result.data);
      }
    }

    return Result.success(results);
  }

  async setMany<T = any>(
    entries: Map<string, T>,
    metadata?: Partial<StorageMetadata>
  ): Promise<Result<void>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.config.storeName);
      const now = Date.now();

      const promises: Promise<void>[] = [];

      for (const [key, value] of entries) {
        const entry: StorageEntry<T> = {
          key,
          value,
          metadata: {
            key,
            created: now,
            accessed: now,
            modified: now,
            size: this.calculateSize(value),
            namespace: metadata?.namespace || 'default',
            ...metadata
          }
        };

        const request = objectStore.put(entry);
        promises.push(
          new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to set ${key}`));
          })
        );
      }

      await Promise.all(promises);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure('INDEXEDDB_SETMANY_ERROR', `대량 저장 중 오류: ${error}`);
    }
  }

  async deleteMany(keys: string[]): Promise<Result<void>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.config.storeName);
      
      const promises: Promise<void>[] = [];

      for (const key of keys) {
        const request = objectStore.delete(key);
        promises.push(
          new Promise((resolve) => {
            request.onsuccess = () => resolve();
            request.onerror = () => resolve(); // 에러 무시
          })
        );
      }

      await Promise.all(promises);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure('INDEXEDDB_DELETEMANY_ERROR', `대량 삭제 중 오류: ${error}`);
    }
  }

  async keys(query?: StorageQuery): Promise<Result<string[]>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.config.storeName);
      
      let request: IDBRequest;
      
      if (query?.namespace) {
        const index = objectStore.index('namespace');
        request = index.getAllKeys(IDBKeyRange.only(query.namespace));
      } else {
        request = objectStore.getAllKeys();
      }

      return new Promise((resolve) => {
        request.onsuccess = () => {
          let keys = request.result as string[];
          
          // 패턴 필터링
          if (query?.pattern) {
            const regex = new RegExp(query.pattern);
            keys = keys.filter(key => regex.test(key));
          }
          
          // 페이지네이션
          if (query?.limit) {
            const offset = query.offset || 0;
            keys = keys.slice(offset, offset + query.limit);
          }
          
          resolve(Result.success(keys));
        };

        request.onerror = () => {
          resolve(Result.failure('INDEXEDDB_KEYS_FAILED', '키 목록 조회 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_KEYS_ERROR', `키 목록 조회 중 오류: ${error}`);
    }
  }

  async values<T = any>(query?: StorageQuery): Promise<Result<T[]>> {
    const keysResult = await this.keys(query);
    if (keysResult.isFailure) {
      return Result.failure(keysResult.error, keysResult.message);
    }

    const values: T[] = [];
    for (const key of keysResult.data) {
      const result = await this.get<T>(key);
      if (result.isSuccess && result.data !== null) {
        values.push(result.data);
      }
    }

    return Result.success(values);
  }

  async entries<T = any>(query?: StorageQuery): Promise<Result<Array<[string, T]>>> {
    const keysResult = await this.keys(query);
    if (keysResult.isFailure) {
      return Result.failure(keysResult.error, keysResult.message);
    }

    const entries: Array<[string, T]> = [];
    for (const key of keysResult.data) {
      const result = await this.get<T>(key);
      if (result.isSuccess && result.data !== null) {
        entries.push([key, result.data]);
      }
    }

    return Result.success(entries);
  }

  async size(namespace?: string): Promise<Result<number>> {
    const keysResult = await this.keys({ namespace });
    if (keysResult.isFailure) {
      return Result.failure(keysResult.error, keysResult.message);
    }
    return Result.success(keysResult.data.length);
  }

  async getStats(namespace?: string): Promise<Result<NamespaceStats>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.config.storeName);
      
      let request: IDBRequest;
      
      if (namespace) {
        const index = objectStore.index('namespace');
        request = index.getAll(IDBKeyRange.only(namespace));
      } else {
        request = objectStore.getAll();
      }

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const entries = request.result as StorageEntry<any>[];
          
          const stats: NamespaceStats = {
            namespace: namespace || 'all',
            itemCount: entries.length,
            totalSize: entries.reduce((sum, entry) => sum + (entry.metadata.size || 0), 0),
            lastModified: entries.reduce((latest, entry) => 
              Math.max(latest, entry.metadata.modified || 0), 0
            ) || Date.now()
          };
          
          resolve(Result.success(stats));
        };

        request.onerror = () => {
          resolve(Result.failure('INDEXEDDB_STATS_FAILED', '통계 조회 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_STATS_ERROR', `통계 조회 중 오류: ${error}`);
    }
  }

  async cleanup(): Promise<Result<number>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.config.storeName);
      const index = objectStore.index('expires');
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      return new Promise((resolve) => {
        let cleaned = 0;
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            objectStore.delete(cursor.primaryKey);
            cleaned++;
            cursor.continue();
          } else {
            resolve(Result.success(cleaned));
          }
        };

        request.onerror = () => {
          resolve(Result.failure('INDEXEDDB_CLEANUP_FAILED', '정리 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_CLEANUP_ERROR', `정리 중 오류: ${error}`);
    }
  }

  async destroy(): Promise<Result<void>> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    try {
      const deleteRequest = indexedDB.deleteDatabase(this.config.dbName);
      
      return new Promise((resolve) => {
        deleteRequest.onsuccess = () => {
          resolve(Result.success(undefined));
        };

        deleteRequest.onerror = () => {
          resolve(Result.failure('INDEXEDDB_DESTROY_FAILED', '데이터베이스 삭제 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_DESTROY_ERROR', `삭제 중 오류: ${error}`);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      const result = await this.initialize();
      if (result.isFailure) {
        throw new Error(result.message);
      }
    }
  }

  private calculateSize(value: any): number {
    const str = JSON.stringify(value);
    return new Blob([str]).size;
  }

  private async updateAccessTime(key: string): Promise<void> {
    try {
      const getTransaction = this.db!.transaction([this.config.storeName], 'readonly');
      const getRequest = getTransaction.objectStore(this.config.storeName).get(key);
      
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          entry.metadata.accessed = Date.now();
          
          const putTransaction = this.db!.transaction([this.config.storeName], 'readwrite');
          putTransaction.objectStore(this.config.storeName).put(entry);
        }
      };
    } catch {
      // 접근 시간 업데이트 실패는 무시
    }
  }

  // 고급 쿼리 기능
  async query<T = any>(
    indexName: string,
    range?: IDBKeyRange | IDBValidKey,
    direction?: IDBCursorDirection
  ): Promise<Result<T[]>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.config.storeName);
      const index = objectStore.index(indexName);
      const request = index.openCursor(range, direction);

      return new Promise((resolve) => {
        const results: T[] = [];
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const entry = cursor.value as StorageEntry<T>;
            if (!entry.metadata.expires || entry.metadata.expires >= Date.now()) {
              results.push(entry.value);
            }
            cursor.continue();
          } else {
            resolve(Result.success(results));
          }
        };

        request.onerror = () => {
          resolve(Result.failure('INDEXEDDB_QUERY_FAILED', '쿼리 실행 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_QUERY_ERROR', `쿼리 실행 중 오류: ${error}`);
    }
  }

  // 트랜잭션 지원
  async transaction<T>(
    callback: (objectStore: IDBObjectStore) => Promise<T>
  ): Promise<Result<T>> {
    await this.ensureInitialized();

    try {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.config.storeName);
      
      const result = await callback(objectStore);
      
      return new Promise((resolve) => {
        transaction.oncomplete = () => {
          resolve(Result.success(result));
        };

        transaction.onerror = () => {
          resolve(Result.failure('INDEXEDDB_TRANSACTION_FAILED', '트랜잭션 실패'));
        };
      });
    } catch (error) {
      return Result.failure('INDEXEDDB_TRANSACTION_ERROR', `트랜잭션 중 오류: ${error}`);
    }
  }
}
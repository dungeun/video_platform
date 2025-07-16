import type { SessionData, SessionStorageProvider } from '../types';
import { SessionStorageError } from '../types';

export class IndexedDBSessionStorageProvider implements SessionStorageProvider {
  private readonly dbName = 'SessionsDB';
  private readonly storeName = 'sessions';
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new SessionStorageError('IndexedDB is not available in server-side environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new SessionStorageError(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  private async ensureInit(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  private getTransaction(mode: IDBTransactionMode = 'readonly'): IDBTransaction {
    if (!this.db) {
      throw new SessionStorageError('Database not initialized');
    }
    return this.db.transaction([this.storeName], mode);
  }

  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    return this.getTransaction(mode).objectStore(this.storeName);
  }

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      await this.ensureInit();

      return new Promise((resolve, reject) => {
        const store = this.getStore('readonly');
        const request = store.get(sessionId);

        request.onerror = () => {
          reject(new SessionStorageError(
            `Failed to get session from IndexedDB: ${request.error?.message}`,
            sessionId
          ));
        };

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve({
              ...result,
              createdAt: new Date(result.createdAt),
              updatedAt: new Date(result.updatedAt),
              expiresAt: new Date(result.expiresAt),
              lastActivity: new Date(result.lastActivity),
            });
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to get session from IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    try {
      await this.ensureInit();

      return new Promise((resolve, reject) => {
        const store = this.getStore('readwrite');
        const request = store.put(session);

        request.onerror = () => {
          reject(new SessionStorageError(
            `Failed to set session in IndexedDB: ${request.error?.message}`,
            sessionId
          ));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to set session in IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async remove(sessionId: string): Promise<void> {
    try {
      await this.ensureInit();

      return new Promise((resolve, reject) => {
        const store = this.getStore('readwrite');
        const request = store.delete(sessionId);

        request.onerror = () => {
          reject(new SessionStorageError(
            `Failed to remove session from IndexedDB: ${request.error?.message}`,
            sessionId
          ));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to remove session from IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sessionId
      );
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureInit();

      return new Promise((resolve, reject) => {
        const store = this.getStore('readwrite');
        const request = store.clear();

        request.onerror = () => {
          reject(new SessionStorageError(
            `Failed to clear sessions from IndexedDB: ${request.error?.message}`
          ));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to clear sessions from IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getExpiredSessions(): Promise<SessionData[]> {
    try {
      await this.ensureInit();

      return new Promise((resolve, reject) => {
        const store = this.getStore('readonly');
        const index = store.index('expiresAt');
        const now = new Date();
        const range = IDBKeyRange.upperBound(now);
        const request = index.getAll(range);

        request.onerror = () => {
          reject(new SessionStorageError(
            `Failed to get expired sessions from IndexedDB: ${request.error?.message}`
          ));
        };

        request.onsuccess = () => {
          const sessions = request.result.map(session => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            expiresAt: new Date(session.expiresAt),
            lastActivity: new Date(session.lastActivity),
          }));
          resolve(sessions);
        };
      });
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to get expired sessions from IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async removeExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await this.getExpiredSessions();
      
      for (const session of expiredSessions) {
        await this.remove(session.id);
      }

      return expiredSessions.length;
    } catch (error) {
      throw new SessionStorageError(
        `Failed to remove expired sessions from IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      await this.ensureInit();

      return new Promise((resolve, reject) => {
        const store = this.getStore('readonly');
        const index = store.index('userId');
        const request = index.getAll(userId);

        request.onerror = () => {
          reject(new SessionStorageError(
            `Failed to get user sessions from IndexedDB: ${request.error?.message}`
          ));
        };

        request.onsuccess = () => {
          const sessions = request.result.map(session => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            expiresAt: new Date(session.expiresAt),
            lastActivity: new Date(session.lastActivity),
          }));
          resolve(sessions);
        };
      });
    } catch (error) {
      if (error instanceof SessionStorageError) {
        throw error;
      }
      throw new SessionStorageError(
        `Failed to get user sessions from IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
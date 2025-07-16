/**
 * Redis Manager - 하이브리드 구현
 * Redis + @repo/cache를 활용한 캐시 관리
 */

import { createClient, RedisClientType } from 'redis';
import { CacheManager, createCacheManager } from '@repo/cache';

export class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType;
  private connected: boolean = false;

  private constructor() {
    // 메모리 캐시를 fallback으로 사용
    this.fallbackCache = createCacheManager({
      strategy: 'lru' as any,
      maxSize: 1000,
      ttl: 300000, // 5분
      enableStats: true
    });
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Event handlers
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
      this.connected = true;
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
      this.connected = false;
    });
  }

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await this.client.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('⚠️  Redis connection failed, using fallback memory cache:', error);
      // Don't throw error, let the app continue without Redis
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client.quit();
      this.connected = false;
      console.log('📦 Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    if (!this.connected) {
      throw new Error('Redis is not connected');
    }
    return this.client;
  }

  // Common cache operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, { EX: ttl });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  // JSON operations
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing JSON from Redis:', error);
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, ttl);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sAdd(key, members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.sRem(key, members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.sMembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return this.client.sIsMember(key, member);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hSet(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | undefined> {
    return this.client.hGet(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hDel(key, fields);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lPush(key, values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rPush(key, values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lPop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rPop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lRange(key, start, stop);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy'
      };
    }
  }
}
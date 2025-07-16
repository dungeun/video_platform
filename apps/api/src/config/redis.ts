/**
 * Redis Configuration
 * Redis 클라이언트 설정 및 연결 관리
 */

import { RedisManager } from '../core/RedisManager';
import type { RedisClientType } from 'redis';

// Get the Redis client from RedisManager singleton
const redisManager = RedisManager.getInstance();

// Create a lazy-loaded Redis client getter
let _redisClient: RedisClientType | null = null;

// Export the Redis client for use in rate limiting and other modules
// This will throw an error if Redis is not connected, which is the desired behavior
export const redisClient = new Proxy({} as RedisClientType, {
  get(_target, prop) {
    try {
      if (!_redisClient) {
        _redisClient = redisManager.getClient();
      }
      return _redisClient[prop as keyof RedisClientType];
    } catch (error) {
      console.error('Redis client not available:', error);
      throw new Error('Redis is not connected. Please ensure Redis connection is established before using rate limiting.');
    }
  }
});

// Helper function to ensure Redis is connected before using the client
export const ensureRedisConnection = async () => {
  await redisManager.connect();
  _redisClient = redisManager.getClient();
  return _redisClient;
};

// Export additional Redis utilities if needed
export const redis = {
  get client() {
    return redisClient;
  },
  manager: redisManager,
  
  // Common operations
  get: (key: string) => redisManager.get(key),
  set: (key: string, value: string, ttl?: number) => redisManager.set(key, value, ttl),
  del: (key: string) => redisManager.del(key),
  exists: (key: string) => redisManager.exists(key),
  expire: (key: string, ttl: number) => redisManager.expire(key, ttl),
  
  // JSON operations
  getJSON: <T>(key: string) => redisManager.getJSON<T>(key),
  setJSON: <T>(key: string, value: T, ttl?: number) => redisManager.setJSON(key, value, ttl),
  
  // Health check
  healthCheck: () => redisManager.healthCheck()
};
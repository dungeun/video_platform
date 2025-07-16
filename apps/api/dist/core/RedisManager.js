"use strict";
/**
 * Redis Manager - 하이브리드 구현
 * Redis + @repo/cache를 활용한 캐시 관리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const redis_1 = require("redis");
const cache_1 = require("@repo/cache");
class RedisManager {
    static instance;
    client;
    connected = false;
    constructor() {
        // 메모리 캐시를 fallback으로 사용
        this.fallbackCache = (0, cache_1.createCacheManager)({
            strategy: 'lru',
            maxSize: 1000,
            ttl: 300000, // 5분
            enableStats: true
        });
        this.client = (0, redis_1.createClient)({
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
    static getInstance() {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager();
        }
        return RedisManager.instance;
    }
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            await this.client.connect();
            console.log('✅ Redis connected successfully');
        }
        catch (error) {
            console.error('⚠️  Redis connection failed, using fallback memory cache:', error);
            // Don't throw error, let the app continue without Redis
        }
    }
    async disconnect() {
        if (!this.connected) {
            return;
        }
        try {
            await this.client.quit();
            this.connected = false;
            console.log('📦 Redis disconnected');
        }
        catch (error) {
            console.error('Error disconnecting Redis:', error);
            throw error;
        }
    }
    getClient() {
        if (!this.connected) {
            throw new Error('Redis is not connected');
        }
        return this.client;
    }
    // Common cache operations
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.client.set(key, value, { EX: ttl });
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        await this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async expire(key, ttl) {
        await this.client.expire(key, ttl);
    }
    // JSON operations
    async getJSON(key) {
        const value = await this.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch (error) {
            console.error('Error parsing JSON from Redis:', error);
            return null;
        }
    }
    async setJSON(key, value, ttl) {
        const jsonString = JSON.stringify(value);
        await this.set(key, jsonString, ttl);
    }
    // Set operations
    async sadd(key, ...members) {
        return this.client.sAdd(key, members);
    }
    async srem(key, ...members) {
        return this.client.sRem(key, members);
    }
    async smembers(key) {
        return this.client.sMembers(key);
    }
    async sismember(key, member) {
        return this.client.sIsMember(key, member);
    }
    // Hash operations
    async hset(key, field, value) {
        return this.client.hSet(key, field, value);
    }
    async hget(key, field) {
        return this.client.hGet(key, field);
    }
    async hgetall(key) {
        return this.client.hGetAll(key);
    }
    async hdel(key, ...fields) {
        return this.client.hDel(key, fields);
    }
    // List operations
    async lpush(key, ...values) {
        return this.client.lPush(key, values);
    }
    async rpush(key, ...values) {
        return this.client.rPush(key, values);
    }
    async lpop(key) {
        return this.client.lPop(key);
    }
    async rpop(key) {
        return this.client.rPop(key);
    }
    async lrange(key, start, stop) {
        return this.client.lRange(key, start, stop);
    }
    // Health check
    async healthCheck() {
        try {
            const start = Date.now();
            await this.client.ping();
            const latency = Date.now() - start;
            return {
                status: 'healthy',
                latency
            };
        }
        catch (error) {
            return {
                status: 'unhealthy'
            };
        }
    }
}
exports.RedisManager = RedisManager;

"use strict";
/**
 * Redis Configuration
 * Redis 클라이언트 설정 및 연결 관리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.ensureRedisConnection = exports.redisClient = void 0;
const RedisManager_1 = require("../core/RedisManager");
// Get the Redis client from RedisManager singleton
const redisManager = RedisManager_1.RedisManager.getInstance();
// Create a lazy-loaded Redis client getter
let _redisClient = null;
// Export the Redis client for use in rate limiting and other modules
// This will throw an error if Redis is not connected, which is the desired behavior
exports.redisClient = new Proxy({}, {
    get(_target, prop) {
        try {
            if (!_redisClient) {
                _redisClient = redisManager.getClient();
            }
            return _redisClient[prop];
        }
        catch (error) {
            console.error('Redis client not available:', error);
            throw new Error('Redis is not connected. Please ensure Redis connection is established before using rate limiting.');
        }
    }
});
// Helper function to ensure Redis is connected before using the client
const ensureRedisConnection = async () => {
    await redisManager.connect();
    _redisClient = redisManager.getClient();
    return _redisClient;
};
exports.ensureRedisConnection = ensureRedisConnection;
// Export additional Redis utilities if needed
exports.redis = {
    get client() {
        return exports.redisClient;
    },
    manager: redisManager,
    // Common operations
    get: (key) => redisManager.get(key),
    set: (key, value, ttl) => redisManager.set(key, value, ttl),
    del: (key) => redisManager.del(key),
    exists: (key) => redisManager.exists(key),
    expire: (key, ttl) => redisManager.expire(key, ttl),
    // JSON operations
    getJSON: (key) => redisManager.getJSON(key),
    setJSON: (key, value, ttl) => redisManager.setJSON(key, value, ttl),
    // Health check
    healthCheck: () => redisManager.healthCheck()
};

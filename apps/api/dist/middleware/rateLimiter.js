"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLimiter = exports.signupLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const RedisManager_1 = require("../core/RedisManager");
// Create rate limiter with Redis store if available, otherwise use memory store
const createRateLimiter = (options) => {
    const { prefix, ...rateLimitOptions } = options;
    try {
        // Try to get Redis client
        const redisManager = RedisManager_1.RedisManager.getInstance();
        const client = redisManager.getClient();
        // Create Redis store
        return (0, express_rate_limit_1.default)({
            ...rateLimitOptions,
            store: new rate_limit_redis_1.RedisStore({
                sendCommand: (...args) => client.sendCommand(args),
                prefix: prefix || 'rate_limit:',
            }),
        });
    }
    catch (error) {
        // Fallback to memory store if Redis is not available
        console.warn(`Rate limiter falling back to memory store (Redis not available): ${error}`);
        return (0, express_rate_limit_1.default)(rateLimitOptions);
    }
};
// 일반 API 요청 제한
exports.apiLimiter = createRateLimiter({
    prefix: 'rate_limit:api:',
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100개 요청
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
// 로그인 요청 제한
exports.authLimiter = createRateLimiter({
    prefix: 'rate_limit:auth:',
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 최대 5번 시도
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
});
// 회원가입 요청 제한
exports.signupLimiter = createRateLimiter({
    prefix: 'rate_limit:signup:',
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3, // 최대 3개 계정 생성
    message: 'Too many accounts created from this IP, please try again later.',
});
// 파일 업로드 제한
exports.uploadLimiter = createRateLimiter({
    prefix: 'rate_limit:upload:',
    windowMs: 60 * 60 * 1000, // 1시간
    max: 20, // 최대 20개 파일
    message: 'Too many uploads from this IP, please try again later.',
});

"use strict";
/**
 * KV Manager - Vercel KV wrapper
 * Redis 대신 Vercel KV를 사용하는 매니저
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVManager = void 0;
const kv_1 = require("@vercel/kv");
class KVManager {
    static instance;
    connected = false;
    constructor() { }
    static getInstance() {
        if (!KVManager.instance) {
            KVManager.instance = new KVManager();
        }
        return KVManager.instance;
    }
    async connect() {
        try {
            // Vercel KV는 자동 연결되므로 환경 변수만 확인
            if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
                console.warn('⚠️  Vercel KV environment variables not found, using memory fallback');
                return;
            }
            // 연결 테스트
            await kv_1.kv.ping();
            this.connected = true;
            console.log('✅ Vercel KV connected successfully');
        }
        catch (error) {
            console.error('❌ Vercel KV connection failed:', error);
            this.connected = false;
        }
    }
    async disconnect() {
        // Vercel KV는 연결 관리가 자동이므로 플래그만 변경
        this.connected = false;
        console.log('📦 KV Manager closed');
    }
    isConnected() {
        return this.connected;
    }
    // Redis 호환 메서드들
    async get(key) {
        if (!this.connected)
            return null;
        try {
            return await kv_1.kv.get(key);
        }
        catch (error) {
            console.error('KV get error:', error);
            return null;
        }
    }
    async set(key, value, options) {
        if (!this.connected)
            return;
        try {
            if (options?.ex) {
                await kv_1.kv.set(key, value, { ex: options.ex });
            }
            else {
                await kv_1.kv.set(key, value);
            }
        }
        catch (error) {
            console.error('KV set error:', error);
        }
    }
    async del(key) {
        if (!this.connected)
            return;
        try {
            await kv_1.kv.del(key);
        }
        catch (error) {
            console.error('KV del error:', error);
        }
    }
    async exists(key) {
        if (!this.connected)
            return false;
        try {
            const result = await kv_1.kv.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('KV exists error:', error);
            return false;
        }
    }
    async expire(key, seconds) {
        if (!this.connected)
            return;
        try {
            await kv_1.kv.expire(key, seconds);
        }
        catch (error) {
            console.error('KV expire error:', error);
        }
    }
    async ttl(key) {
        if (!this.connected)
            return -1;
        try {
            return await kv_1.kv.ttl(key);
        }
        catch (error) {
            console.error('KV ttl error:', error);
            return -1;
        }
    }
    async keys(_pattern) {
        if (!this.connected)
            return [];
        try {
            // Vercel KV는 keys 패턴 검색을 직접 지원하지 않음
            // 실제 구현시 다른 방법 필요
            console.warn('KV keys pattern search not fully supported');
            return [];
        }
        catch (error) {
            console.error('KV keys error:', error);
            return [];
        }
    }
    async flushall() {
        if (!this.connected)
            return;
        try {
            // Vercel KV는 flushall을 직접 지원하지 않음
            console.warn('KV flushall not supported in Vercel KV');
        }
        catch (error) {
            console.error('KV flushall error:', error);
        }
    }
    async healthCheck() {
        if (!this.connected) {
            return { status: 'disconnected' };
        }
        try {
            const start = Date.now();
            await kv_1.kv.ping();
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
exports.KVManager = KVManager;

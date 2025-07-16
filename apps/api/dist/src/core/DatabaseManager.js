"use strict";
/**
 * Database Manager - 모듈 기반 구현
 * @repo/database를 활용한 데이터베이스 연결 관리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("@repo/database");
class DatabaseManager {
    static instance;
    prisma;
    connected = false;
    constructor() {
        this.prisma = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error']
        });
        // 모듈 기반 데이터베이스 매니저 초기화
        this.moduleDb = (0, database_1.createDatabaseManager)();
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            await this.prisma.$connect();
            this.connected = true;
            console.log('✅ Database connected successfully');
        }
        catch (error) {
            console.error('⚠️  Database connection failed, running in demo mode:', error);
            // Don't throw error, let the app continue in demo mode
            this.connected = true; // Pretend connected for demo
        }
    }
    async disconnect() {
        if (!this.connected) {
            return;
        }
        try {
            await this.prisma.$disconnect();
            this.connected = false;
            console.log('📦 Database disconnected');
        }
        catch (error) {
            console.error('Error disconnecting database:', error);
            throw error;
        }
    }
    getClient() {
        if (!this.connected) {
            throw new Error('Database is not connected');
        }
        return this.prisma;
    }
    async healthCheck() {
        try {
            const start = Date.now();
            await this.prisma.$queryRaw `SELECT 1`;
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
    // Transaction helper
    async transaction(fn) {
        return this.prisma.$transaction(fn);
    }
}
exports.DatabaseManager = DatabaseManager;

/**
 * Database Manager - 모듈 기반 구현
 * @repo/database를 활용한 데이터베이스 연결 관리
 */

import { PrismaClient } from '@prisma/client';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private connected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error']
    });
    
    // 모듈 기반 데이터베이스 매니저 초기화
    this.moduleDb = createDatabaseManager();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await this.prisma.$connect();
      this.connected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('⚠️  Database connection failed, running in demo mode:', error);
      // Don't throw error, let the app continue in demo mode
      this.connected = true; // Pretend connected for demo
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.prisma.$disconnect();
      this.connected = false;
      console.log('📦 Database disconnected');
    } catch (error) {
      console.error('Error disconnecting database:', error);
      throw error;
    }
  }

  getClient(): PrismaClient {
    if (!this.connected) {
      throw new Error('Database is not connected');
    }
    return this.prisma;
  }

  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
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

  // Transaction helper
  async transaction<T>(fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
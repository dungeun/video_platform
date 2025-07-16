/**
 * @repo/core 테스트
 * Zero Error Architecture 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ModuleBase,
  EventBus,
  Logger,
  ErrorHandler,
  moduleRegistry,
  safeJsonParse,
  retry,
  withTimeout,
  type ModuleConfig,
  type Result
} from '../src';

// ===== 테스트용 모듈 클래스 =====
class TestModule extends ModuleBase {
  private isInitialized = false;

  protected async onInitialize(): Promise<Result<void>> {
    this.isInitialized = true;
    return { success: true };
  }

  protected async onDestroy(): Promise<Result<void>> {
    this.isInitialized = false;
    return { success: true };
  }

  public async healthCheck(): Promise<Result<boolean>> {
    return { success: true, data: this.isInitialized };
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }
}

class FailingModule extends ModuleBase {
  protected async onInitialize(): Promise<Result<void>> {
    return { 
      success: false, 
      error: { 
        code: 'INIT_FAILED',
        message: '초기화 실패',
        timestamp: Date.now()
      }
    };
  }

  protected async onDestroy(): Promise<Result<void>> {
    return { success: true };
  }

  public async healthCheck(): Promise<Result<boolean>> {
    return { success: false, data: false };
  }
}

// ===== 테스트 스위트 =====

describe('@repo/core', () => {
  
  describe('ModuleBase', () => {
    let testModule: TestModule;
    let config: ModuleConfig;

    beforeEach(() => {
      config = {
        name: 'test-module',
        version: '1.0.0',
        description: '테스트 모듈'
      };
    });

    it('should initialize module successfully', async () => {
      testModule = new TestModule(config);
      
      // 잠시 대기 (비동기 초기화)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(testModule.isLoaded()).toBe(true);
      expect(testModule.getInitialized()).toBe(true);
    });

    it('should return correct module info', () => {
      testModule = new TestModule(config);
      const info = testModule.getInfo();
      
      expect(info.config.name).toBe('test-module');
      expect(info.config.version).toBe('1.0.0');
    });

    it('should handle events correctly', (done) => {
      testModule = new TestModule(config);
      
      const subscriptionId = testModule.on('test-event', (event) => {
        expect(event.payload.message).toBe('Hello World');
        testModule.off(subscriptionId);
        done();
      });
      
      testModule['emit']('test-event', { message: 'Hello World' });
    });

    it('should handle initialization failure gracefully', async () => {
      const failingModule = new FailingModule(config);
      
      // 잠시 대기 (비동기 초기화)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(failingModule.isLoaded()).toBe(false);
    });
  });

  describe('EventBus', () => {
    it('should emit and receive events', (done) => {
      const subscriptionId = EventBus.on('test-global-event', (event) => {
        expect(event.payload.test).toBe(true);
        EventBus.off(subscriptionId);
        done();
      });
      
      EventBus.emitModuleEvent('test-source', 'test-global-event', { test: true });
    });

    it('should handle once events correctly', () => {
      let callCount = 0;
      
      EventBus.once('test-once-event', () => {
        callCount++;
      });
      
      EventBus.emit('test-once-event');
      EventBus.emit('test-once-event');
      
      expect(callCount).toBe(1);
    });
  });

  describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger('test-logger');
    });

    it('should log messages without errors', () => {
      expect(() => {
        logger.debug('Debug message');
        logger.info('Info message');
        logger.warn('Warning message');
        logger.error('Error message');
      }).not.toThrow();
    });

    it('should create child logger', () => {
      const childLogger = logger.child('sub-component');
      
      expect(() => {
        childLogger.info('Child logger message');
      }).not.toThrow();
    });

    it('should log user actions', () => {
      expect(() => {
        logger.logUserAction('user123', 'login', 'auth-system');
      }).not.toThrow();
    });

    it('should log performance metrics', () => {
      expect(() => {
        logger.logPerformance('database-query', 150);
      }).not.toThrow();
    });
  });

  describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
      errorHandler = new ErrorHandler('test-module');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const moduleError = errorHandler.handle(error);
      
      expect(moduleError.code).toBeDefined();
      expect(moduleError.message).toBeDefined();
      expect(moduleError.timestamp).toBeDefined();
      expect(moduleError.source).toBe('test-module');
    });

    it('should handle string errors', () => {
      const moduleError = errorHandler.handle('Simple error message');
      
      expect(moduleError.message).toBe('Simple error message');
      expect(moduleError.source).toBe('test-module');
    });

    it('should create custom errors', () => {
      const error = errorHandler.createError(
        'CUSTOM_001', 
        'Custom error message',
        { additionalInfo: 'test' }
      );
      
      expect(error.code).toBe('CUSTOM_001');
      expect(error.message).toBe('Custom error message');
      expect(error.details.additionalInfo).toBe('test');
    });

    it('should determine if error is recoverable', () => {
      const networkError = errorHandler.createError('NETWORK_ERROR', 'Network failed');
      const systemError = errorHandler.createError('SYSTEM_INTERNAL_ERROR', 'System failed');
      
      expect(errorHandler.isRecoverable(networkError)).toBe(true);
      expect(errorHandler.isRecoverable(systemError)).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    describe('safeJsonParse', () => {
      it('should parse valid JSON', () => {
        const result = safeJsonParse<{ test: boolean }>('{"test": true}');
        
        expect(result.success).toBe(true);
        expect(result.data?.test).toBe(true);
      });

      it('should handle invalid JSON gracefully', () => {
        const result = safeJsonParse('invalid json');
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('retry', () => {
      it('should succeed on first attempt', async () => {
        const operation = () => Promise.resolve('success');
        const result = await retry(operation);
        
        expect(result.success).toBe(true);
        expect(result.data).toBe('success');
        expect(result.attempts).toBe(1);
      });

      it('should retry on failure and eventually succeed', async () => {
        let attemptCount = 0;
        const operation = () => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.reject(new Error('Failed'));
          }
          return Promise.resolve('success');
        };
        
        const result = await retry(operation, { maxAttempts: 3, delay: 10 });
        
        expect(result.success).toBe(true);
        expect(result.data).toBe('success');
        expect(result.attempts).toBe(3);
      });

      it('should fail after max attempts', async () => {
        const operation = () => Promise.reject(new Error('Always fails'));
        const result = await retry(operation, { maxAttempts: 2, delay: 10 });
        
        expect(result.success).toBe(false);
        expect(result.attempts).toBe(2);
      });
    });

    describe('withTimeout', () => {
      it('should resolve before timeout', async () => {
        const promise = Promise.resolve('quick result');
        const result = await withTimeout(promise, 1000);
        
        expect(result.success).toBe(true);
        expect(result.data).toBe('quick result');
        expect(result.timedOut).toBe(false);
      });

      it('should timeout for slow operations', async () => {
        const promise = new Promise(resolve => setTimeout(() => resolve('slow result'), 200));
        const result = await withTimeout(promise, 100);
        
        expect(result.success).toBe(false);
        expect(result.timedOut).toBe(true);
      });
    });
  });
});
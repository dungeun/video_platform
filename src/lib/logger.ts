/**
 * 프로덕션용 로거 시스템
 * console.log를 대체하고 환경에 따라 로그를 제어합니다.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  isDevelopment: boolean;
  enableFileLogging?: boolean;
  enableRemoteLogging?: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      isDevelopment: process.env.NODE_ENV !== 'production',
      enableFileLogging: false,
      enableRemoteLogging: false,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // 프로덕션에서는 debug 로그 무시
    if (!this.config.isDevelopment && level === 'debug') {
      return false;
    }
    
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    
    return `${prefix} ${message}`;
  }

  private logMessage(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, args.length > 0 ? args : undefined);

    // 개발 환경에서만 콘솔 출력
    if (this.config.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    }

    // 프로덕션에서는 파일이나 원격 로깅 서비스로 전송
    if (!this.config.isDevelopment) {
      if (this.config.enableFileLogging) {
        this.writeToFile(formattedMessage);
      }
      
      if (this.config.enableRemoteLogging) {
        this.sendToRemote(level, message, args);
      }
    }
  }

  private writeToFile(message: string): void {
    // 파일 로깅 구현 (서버 사이드에서만)
    if (typeof window === 'undefined') {
      // Node.js 환경에서만 실행
      try {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');
        
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, message + '\n');
      } catch (error) {
        // 파일 로깅 실패 시 조용히 무시
      }
    }
  }

  private sendToRemote(level: LogLevel, message: string, data?: any[]): void {
    // 원격 로깅 서비스로 전송 (예: Sentry, LogRocket, DataDog)
    // TODO: 실제 원격 로깅 서비스 통합 시 구현
    if (level === 'error' && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, level);
    }
  }

  public debug(message: string, ...args: any[]): void {
    this.logMessage('debug', message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.logMessage('info', message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.logMessage('warn', message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    this.logMessage('error', message, ...args);
  }

  // console.log 대체 메서드
  public log(message: string, ...args: any[]): void {
    this.debug(message, ...args);
  }
}

// 싱글톤 인스턴스
const logger = new Logger();

// 전역 console 객체 오버라이드 (프로덕션에서만)
if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  // 브라우저 환경에서 console 메서드 오버라이드
  const originalConsole = { ...console };
  
  console.log = (...args: any[]) => logger.debug(args.join(' '));
  console.debug = (...args: any[]) => logger.debug(args.join(' '));
  console.info = (...args: any[]) => logger.info(args.join(' '));
  console.warn = (...args: any[]) => logger.warn(args.join(' '));
  console.error = (...args: any[]) => logger.error(args.join(' '));
  
  // 개발자 도구에서 원본 console 접근 가능하도록
  (window as any).__originalConsole = originalConsole;
}

export default logger;
export { Logger };
export type { LogLevel, LoggerConfig };
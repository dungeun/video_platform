/**
 * 속도 제한 미들웨어
 * DDoS 및 브루트포스 공격 방지
 */

import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// 속도 제한 타입
export interface RateLimitConfig {
  windowMs: number;           // 시간 윈도우 (밀리초)
  max: number;                 // 최대 요청 수
  message?: string;            // 초과 시 메시지
  skipSuccessfulRequests?: boolean;  // 성공 요청 제외
  skipFailedRequests?: boolean;      // 실패 요청 제외
  keyGenerator?: (req: NextRequest) => string;  // 키 생성 함수
  handler?: (req: NextRequest) => NextResponse; // 커스텀 핸들러
  skip?: (req: NextRequest) => boolean;         // 제외 조건
}

// 기본 설정
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,  // 15분
  max: 100,                   // 100개 요청
  message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
};

// 엔드포인트별 설정
const ENDPOINT_CONFIGS: Record<string, Partial<RateLimitConfig>> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000,  // 15분
    max: 5,                     // 5번 시도
    message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000,  // 1시간
    max: 3,                     // 3개 계정
    message: '회원가입 제한을 초과했습니다. 1시간 후 다시 시도해주세요.',
  },
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000,  // 1시간
    max: 3,                     // 3번 시도
    message: '비밀번호 재설정 요청이 너무 많습니다.',
  },
  '/api/payments': {
    windowMs: 60 * 1000,       // 1분
    max: 10,                    // 10번
    message: '결제 요청이 너무 많습니다.',
  },
  '/api/upload': {
    windowMs: 60 * 60 * 1000,  // 1시간
    max: 20,                    // 20개 파일
    message: '업로드 제한을 초과했습니다.',
  },
  '/api/admin': {
    windowMs: 60 * 1000,       // 1분
    max: 30,                    // 30번
    message: '관리자 요청이 너무 많습니다.',
  },
};

// IP 기반 글로벌 제한 (향후 사용 예정)
// const GLOBAL_LIMIT: RateLimitConfig = {
//   windowMs: 60 * 1000,        // 1분
//   max: 60,                     // 60번
//   message: '전체 요청 한도를 초과했습니다.',
// };

// 캐시 인스턴스
class RateLimitStore {
  private stores: Map<string, LRUCache<string, number[]>>;
  
  constructor() {
    this.stores = new Map();
  }
  
  getStore(namespace: string, windowMs: number): LRUCache<string, number[]> {
    const key = `${namespace}-${windowMs}`;
    
    if (!this.stores.has(key)) {
      const store = new LRUCache<string, number[]>({
        max: 10000,  // 최대 10,000개 IP 추적
        ttl: windowMs,
        updateAgeOnGet: false,
        updateAgeOnHas: false,
      });
      this.stores.set(key, store);
    }
    
    return this.stores.get(key)!;
  }
  
  increment(namespace: string, key: string, windowMs: number): number {
    const store = this.getStore(namespace, windowMs);
    const now = Date.now();
    const timestamps = store.get(key) || [];
    
    // 시간 윈도우 내의 요청만 유지
    const validTimestamps = timestamps.filter(
      t => now - t < windowMs
    );
    
    validTimestamps.push(now);
    store.set(key, validTimestamps);
    
    return validTimestamps.length;
  }
  
  reset(namespace: string, key: string, windowMs: number): void {
    const store = this.getStore(namespace, windowMs);
    store.delete(key);
  }
  
  clear(): void {
    this.stores.clear();
  }
}

// 싱글톤 스토어
const rateLimitStore = new RateLimitStore();

/**
 * IP 주소 추출
 */
function getClientIp(req: NextRequest): string {
  // Cloudflare
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  
  // X-Forwarded-For
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  // X-Real-IP
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;
  
  // 기본 IP (개발 환경)
  return '127.0.0.1';
}

/**
 * 요청 핑거프린트 생성 (향후 사용 예정)
 */
// function getFingerprint(req: NextRequest): string {
//   const ip = getClientIp(req);
//   const userAgent = req.headers.get('user-agent') || '';
//   const acceptLanguage = req.headers.get('accept-language') || '';
//   const acceptEncoding = req.headers.get('accept-encoding') || '';
  
//   const data = `${ip}-${userAgent}-${acceptLanguage}-${acceptEncoding}`;
//   return crypto.createHash('sha256').update(data).digest('hex');
// }

/**
 * 속도 제한 체크
 */
export async function checkRateLimit(
  req: NextRequest,
  config?: Partial<RateLimitConfig>
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const pathname = new URL(req.url).pathname;
  
  // 엔드포인트별 설정 가져오기
  const endpointConfig = ENDPOINT_CONFIGS[pathname] || {};
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...endpointConfig,
    ...config,
  };
  
  // 제외 조건 체크
  if (finalConfig.skip && finalConfig.skip(req)) {
    return { allowed: true, remaining: finalConfig.max, resetAt: new Date() };
  }
  
  // 키 생성
  const key = finalConfig.keyGenerator 
    ? finalConfig.keyGenerator(req)
    : getClientIp(req);
  
  // 요청 수 증가
  const count = rateLimitStore.increment(pathname, key, finalConfig.windowMs);
  
  // 남은 요청 수
  const remaining = Math.max(0, finalConfig.max - count);
  
  // 리셋 시간
  const resetAt = new Date(Date.now() + finalConfig.windowMs);
  
  // 제한 체크
  const allowed = count <= finalConfig.max;
  
  return { allowed, remaining, resetAt };
}

/**
 * 속도 제한 미들웨어
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  config?: Partial<RateLimitConfig>
): Promise<NextResponse | null> {
  const { allowed, remaining, resetAt } = await checkRateLimit(req, config);
  
  if (!allowed) {
    const pathname = new URL(req.url).pathname;
    const endpointConfig = ENDPOINT_CONFIGS[pathname] || {};
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...endpointConfig,
      ...config,
    };
    
    // 커스텀 핸들러
    if (finalConfig.handler) {
      return finalConfig.handler(req);
    }
    
    // 기본 응답
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: finalConfig.message,
        retryAfter: resetAt.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(finalConfig.max),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': resetAt.toISOString(),
          'Retry-After': String(Math.ceil(finalConfig.windowMs / 1000)),
        },
      }
    );
  }
  
  return null;  // 통과
}

/**
 * 브루트포스 방어
 */
export class BruteForceDefense {
  private attempts: Map<string, number[]> = new Map();
  private blocked: Set<string> = new Set();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000,  // 15분
    private blockDurationMs: number = 60 * 60 * 1000  // 1시간
  ) {}
  
  recordAttempt(key: string): boolean {
    // 차단된 경우
    if (this.blocked.has(key)) {
      return false;
    }
    
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // 시간 윈도우 내의 시도만 유지
    const validAttempts = attempts.filter(
      t => now - t < this.windowMs
    );
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    // 최대 시도 초과 시 차단
    if (validAttempts.length >= this.maxAttempts) {
      this.block(key);
      return false;
    }
    
    return true;
  }
  
  recordSuccess(key: string): void {
    this.attempts.delete(key);
    this.blocked.delete(key);
  }
  
  private block(key: string): void {
    this.blocked.add(key);
    
    // 일정 시간 후 차단 해제
    setTimeout(() => {
      this.blocked.delete(key);
      this.attempts.delete(key);
    }, this.blockDurationMs);
  }
  
  isBlocked(key: string): boolean {
    return this.blocked.has(key);
  }
  
  getRemainingAttempts(key: string): number {
    if (this.blocked.has(key)) return 0;
    
    const attempts = this.attempts.get(key) || [];
    const now = Date.now();
    const validAttempts = attempts.filter(
      t => now - t < this.windowMs
    );
    
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }
}

// 로그인 브루트포스 방어 인스턴스
export const loginDefense = new BruteForceDefense(5, 15 * 60 * 1000, 60 * 60 * 1000);

export default {
  checkRateLimit,
  rateLimitMiddleware,
  BruteForceDefense,
  loginDefense,
};
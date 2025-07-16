# 아키텍처 리팩토링 계획

## 현재 문제점
- 모듈 오케스트레이터의 복잡성
- 모듈 간 의존성 관리의 어려움
- 과도한 추상화로 인한 개발 속도 저하
- 일회성 반복 작업

## 새로운 아키텍처: Next.js 통합 아키텍처

### 1. 디렉토리 구조 (Next.js 통합)
```
apps/web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # 인증 페이지 그룹
│   │   ├── (dashboard)/          # 대시보드 페이지 그룹
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── users/
│   │   │   ├── campaigns/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/                      # 서버 사이드 라이브러리
│   │   ├── auth/                 # 인증 관련
│   │   │   ├── jwt.ts
│   │   │   └── session.ts
│   │   ├── db/                   # 데이터베이스
│   │   │   ├── prisma.ts
│   │   │   └── redis.ts
│   │   ├── services/             # 비즈니스 로직
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── campaign.service.ts
│   │   │   └── email.service.ts
│   │   └── utils/                # 유틸리티
│   │       ├── validators.ts
│   │       └── errors.ts
│   ├── middleware.ts             # Next.js 미들웨어
│   ├── components/               # React 컴포넌트
│   ├── hooks/                    # 커스텀 훅
│   └── types/                    # TypeScript 타입
```

### 2. 주요 변경사항

#### 2.1 Express에서 Next.js로 완전 통합
- Express 서버 제거
- Next.js API Routes 활용
- 프론트엔드와 백엔드 단일 코드베이스

#### 2.2 Next.js API Routes 구조
```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authService, loginSchema } from '@/lib/services/auth.service';
import { handleApiError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    
    const result = await authService.login(validatedData);
    
    const response = NextResponse.json({
      user: result.user,
      accessToken: result.accessToken,
    });

    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 2.3 서비스 계층 단순화
```typescript
// services/auth.service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        type: data.userType,
        name: data.name
      }
    });
    
    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    
    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, type: user.type },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
    
    // Redis에 refresh token 저장
    this.redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    
    return { accessToken, refreshToken, user };
  }
}
```

#### 2.4 Next.js 미들웨어
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth/jwt';

const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 라우트 보호
  if (pathname.startsWith('/api/')) {
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    const token = getTokenFromHeader(request.headers.get('authorization'));
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const payload = await verifyJWT(token);
      
      // 요청 헤더에 사용자 정보 추가
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.id);
      requestHeaders.set('x-user-type', payload.type);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  }
}
```

### 3. 싱글톤 패턴 데이터베이스 연결
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// lib/db/redis.ts
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
```

### 4. 리팩토링 단계

#### Phase 1: 기본 구조 설정 (1일)
1. 새로운 디렉토리 구조 생성
2. 기본 설정 파일 이동
3. 타입 정의 통합

#### Phase 2: 핵심 기능 마이그레이션 (2-3일)
1. 인증 시스템 마이그레이션
2. 사용자 관리 기능 구현
3. 기본 CRUD 작업 구현

#### Phase 3: 비즈니스 로직 이전 (2일)
1. 캠페인 관리 기능
2. 결제 시스템
3. 알림 시스템

#### Phase 4: 정리 및 최적화 (1일)
1. 구 모듈 시스템 제거
2. 테스트 작성
3. 문서화

### 5. 장점
- **단일 코드베이스**: 프론트엔드와 백엔드 통합 관리
- **타입 안전성**: 전체 스택에서 TypeScript 활용
- **개발 경험**: Hot reload, 통합 디버깅
- **성능 최적화**: Next.js의 최적화 기능 활용
- **배포 간소화**: 단일 애플리케이션 배포
- **서버 컴포넌트**: 효율적인 서버 사이드 렌더링

### 6. 주의사항
- 서버 컴포넌트 vs 클라이언트 컴포넌트 구분 명확히
- API 라우트 캐싱 전략 수립
- 미들웨어 제한사항 고려 (Edge Runtime)
- 데이터베이스 연결 풀링 관리
- 환경 변수 클라이언트/서버 구분

### 7. 예상 결과
- 코드량 30-40% 감소
- 개발 속도 2배 향상
- 새 개발자 온보딩 시간 단축
- 디버깅 시간 감소
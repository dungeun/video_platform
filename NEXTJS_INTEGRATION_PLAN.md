# Next.js 통합 아키텍처 계획

## 개요
Express 기반 백엔드 API를 Next.js App Router로 완전히 통합하여 단일 애플리케이션으로 구성

## 새로운 디렉토리 구조

```
apps/web/
├── app/
│   ├── (auth)/                     # 인증 관련 페이지 그룹
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/               # 대시보드 페이지 그룹
│   │   ├── campaigns/
│   │   ├── users/
│   │   └── layout.tsx
│   ├── api/                       # API 라우트 (기존 Express 대체)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── campaigns/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── admin/
│   │       └── [...path]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/                           # 서버 사이드 유틸리티
│   ├── auth/
│   │   ├── jwt.ts
│   │   ├── session.ts
│   │   └── middleware.ts
│   ├── db/
│   │   ├── prisma.ts
│   │   └── redis.ts
│   ├── services/                  # 비즈니스 로직
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── campaign.service.ts
│   │   └── email.service.ts
│   └── utils/
│       ├── validators.ts
│       └── errors.ts
├── middleware.ts                  # Next.js 미들웨어
├── components/                    # 클라이언트 컴포넌트
├── hooks/                        # 커스텀 훅
└── types/                        # TypeScript 타입

```

## 주요 변환 사항

### 1. Express 라우트 → Next.js API Routes

#### 기존 Express 방식:
```typescript
// routes/auth.routes.ts
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
```

#### Next.js App Router 방식:
```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { registerSchema } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);
    
    const result = await authService.register(validated);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### 2. 미들웨어 변환

#### Next.js middleware.ts:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  // 보호된 라우트 체크
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    try {
      const payload = await verifyAuth(token);
      // 요청에 사용자 정보 추가
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

export const config = {
  matcher: ['/api/((?!auth/login|auth/register).*)'],
};
```

### 3. 서비스 계층 통합

```typescript
// lib/services/auth.service.ts
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/auth/jwt';

class AuthService {
  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    
    return this.generateTokens(user);
  }

  private async generateTokens(user: any) {
    const accessToken = await signJWT(
      { id: user.id, email: user.email, type: user.type },
      { expiresIn: '15m' }
    );
    
    const refreshToken = await signJWT(
      { id: user.id },
      { expiresIn: '7d' }
    );
    
    // Redis에 refresh token 저장
    await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    
    return { accessToken, refreshToken, user };
  }
}

export const authService = new AuthService();
```

### 4. 데이터베이스 연결 (Singleton 패턴)

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

```typescript
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

### 5. 환경 변수 타입 안전성

```typescript
// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
    }
  }
}

export {};
```

## 마이그레이션 단계

### Phase 1: 기본 구조 설정 (1일)
1. Next.js 프로젝트 초기화
2. 필요한 패키지 설치
3. 기본 디렉토리 구조 생성
4. 환경 변수 설정

### Phase 2: 인증 시스템 (1-2일)
1. JWT 유틸리티 구현
2. 인증 API 라우트 구현
3. 미들웨어 설정
4. 세션 관리 구현

### Phase 3: 핵심 API 이전 (2-3일)
1. 사용자 관리 API
2. 캠페인 관리 API
3. 관리자 API
4. 파일 업로드 처리

### Phase 4: 프론트엔드 통합 (2일)
1. 페이지 컴포넌트 구현
2. API 클라이언트 훅 작성
3. 상태 관리 설정
4. UI 컴포넌트 통합

### Phase 5: 최적화 및 배포 (1일)
1. 빌드 최적화
2. 캐싱 전략 구현
3. 에러 처리 개선
4. 배포 설정

## 장점

1. **단일 코드베이스**: 프론트엔드와 백엔드 통합 관리
2. **타입 안전성**: 전체 스택에서 TypeScript 활용
3. **개발 경험**: Hot reload, 통합 디버깅
4. **성능**: Next.js의 최적화 기능 활용
5. **배포 간소화**: 단일 애플리케이션 배포

## 주의사항

1. **서버 컴포넌트 vs 클라이언트 컴포넌트** 구분 명확히
2. **API 라우트 캐싱** 전략 수립
3. **미들웨어 제한사항** 고려 (Edge Runtime)
4. **데이터베이스 연결 풀링** 관리
5. **환경 변수** 클라이언트/서버 구분

## 예상 결과

- 인프라 복잡도 50% 감소
- 개발 속도 30% 향상
- 유지보수 비용 감소
- 타입 안전성 향상
- 배포 프로세스 단순화
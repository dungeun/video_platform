# 🚀 배포 프로세스

## 개요

비디오픽 플랫폼의 배포 프로세스 및 환경별 설정 가이드입니다.

## 배포 환경

### 환경 구성
- **개발 (Development)**: 로컬 개발 환경
- **스테이징 (Staging)**: 프로덕션 배포 전 테스트
- **프로덕션 (Production)**: 실제 서비스 환경

## 배포 전 체크리스트

### 코드 준비
- [ ] 모든 변경사항 커밋
- [ ] 테스트 통과 확인
- [ ] 빌드 성공 확인
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 준비

### 보안 확인
- [ ] 민감한 정보 제거
- [ ] 환경 변수 암호화
- [ ] SSL 인증서 준비
- [ ] 보안 헤더 설정

## Coolify 배포

### Coolify 서버 설정

#### 1. Coolify 설치
```bash
# Docker 설치
curl -fsSL https://get.docker.com | sh

# Coolify 설치
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

#### 2. 프로젝트 설정
```yaml
# coolify.yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=videopick
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  uploads:
  postgres_data:
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 의존성 설치
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# 빌드
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

# 프로덕션
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Coolify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Coolify
      env:
        COOLIFY_WEBHOOK: ${{ secrets.COOLIFY_WEBHOOK }}
      run: |
        curl -X POST $COOLIFY_WEBHOOK
```

## 환경 변수 관리

### 환경별 변수 파일

#### 개발 환경 (.env.local)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/videopick_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key"

# YouTube API
YOUTUBE_API_KEY="development-api-key"

# Email
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="mailtrap-user"
SMTP_PASS="mailtrap-pass"

# Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# Logging
LOG_LEVEL="debug"
```

#### 프로덕션 환경 (.env.production)
```env
# Database
DATABASE_URL="${SECRET_DATABASE_URL}"

# NextAuth
NEXTAUTH_URL="https://videopick.com"
NEXTAUTH_SECRET="${SECRET_NEXTAUTH_KEY}"

# YouTube API
YOUTUBE_API_KEY="${SECRET_YOUTUBE_KEY}"

# Email
SMTP_HOST="${SECRET_SMTP_HOST}"
SMTP_PORT="${SECRET_SMTP_PORT}"
SMTP_USER="${SECRET_SMTP_USER}"
SMTP_PASS="${SECRET_SMTP_PASS}"

# Storage
UPLOAD_DIR="/data/uploads"
CDN_URL="https://cdn.videopick.com"

# Logging
LOG_LEVEL="info"
SENTRY_DSN="${SECRET_SENTRY_DSN}"
```

### 환경 변수 검증

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // YouTube
  YOUTUBE_API_KEY: z.string(),
  
  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().regex(/^\d+$/),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  
  // Node
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

export function validateEnv() {
  try {
    envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    process.exit(1)
  }
}
```

## 데이터베이스 마이그레이션

### 마이그레이션 전략

#### 1. 백업
```bash
# 프로덕션 데이터베이스 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. 마이그레이션 테스트
```bash
# 스테이징 환경에서 테스트
DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy
```

#### 3. 프로덕션 마이그레이션
```bash
# 프로덕션 마이그레이션
DATABASE_URL=$PRODUCTION_DB_URL npx prisma migrate deploy
```

### 롤백 계획

```bash
# 마이그레이션 롤백
npx prisma migrate resolve --rolled-back <migration_name>

# 데이터베이스 복구
psql $DATABASE_URL < backup.sql
```

## 모니터링 설정

### 헬스 체크

```typescript
// app/api/health/route.ts
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // 데이터베이스 연결 확인
    await prisma.$queryRaw`SELECT 1`
    
    // Redis 연결 확인 (사용 시)
    // await redis.ping()
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
```

### 로깅 설정

```typescript
// lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}

export default logger
```

### 성능 모니터링

```typescript
// lib/monitoring.ts
export function measurePerformance(name: string, fn: () => any) {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  
  logger.info('Performance', {
    operation: name,
    duration: `${duration.toFixed(2)}ms`,
    timestamp: new Date().toISOString(),
  })
  
  return result
}
```

## 배포 프로세스

### 1. 개발 → 스테이징

```bash
# 1. 코드 푸시
git push origin develop

# 2. 스테이징 브랜치 머지
git checkout staging
git merge develop
git push origin staging

# 3. 스테이징 배포 (자동)
# GitHub Actions가 자동으로 스테이징 환경에 배포
```

### 2. 스테이징 → 프로덕션

```bash
# 1. 스테이징 테스트 완료 확인
npm run test:e2e

# 2. 프로덕션 브랜치 머지
git checkout main
git merge staging
git push origin main

# 3. 프로덕션 배포 (자동)
# GitHub Actions가 자동으로 프로덕션 환경에 배포
```

### 3. 배포 후 확인

```bash
# 헬스 체크
curl https://videopick.com/api/health

# 로그 확인
docker logs videopick_app

# 메트릭 확인
curl https://videopick.com/api/metrics
```

## 롤백 절차

### 즉시 롤백

```bash
# 1. 이전 버전으로 롤백
docker stop videopick_app
docker run -d --name videopick_app videopick:previous

# 2. 데이터베이스 롤백 (필요시)
psql $DATABASE_URL < backup.sql

# 3. 캐시 클리어
redis-cli FLUSHALL
```

### Git 기반 롤백

```bash
# 1. 이전 커밋으로 롤백
git revert HEAD
git push origin main

# 2. 재배포 트리거
curl -X POST $COOLIFY_WEBHOOK
```

## 성능 최적화

### Next.js 최적화

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.videopick.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
```

### 캐싱 전략

```typescript
// 정적 자산 캐싱
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: false
}))

// API 응답 캐싱
export async function GET(request: Request) {
  const cached = await redis.get(cacheKey)
  if (cached) {
    return Response.json(JSON.parse(cached))
  }
  
  const data = await fetchData()
  await redis.setex(cacheKey, 3600, JSON.stringify(data))
  
  return Response.json(data)
}
```

### CDN 설정

```nginx
# nginx.conf
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location / {
  proxy_pass http://localhost:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

## 보안 설정

### 보안 헤더

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 보안 헤더 설정
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com; style-src 'self' 'unsafe-inline';"
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  
  return response
}
```

### SSL 설정

```bash
# Let's Encrypt SSL 인증서 발급
certbot certonly --webroot -w /var/www/videopick -d videopick.com -d www.videopick.com

# 자동 갱신
crontab -e
0 0 * * * /usr/bin/certbot renew --quiet
```

## 문제 해결

### 일반적인 문제

#### 1. 빌드 실패
```bash
# 캐시 클리어
rm -rf .next node_modules
npm ci
npm run build
```

#### 2. 데이터베이스 연결 실패
```bash
# 연결 테스트
psql $DATABASE_URL -c "SELECT 1"

# 연결 수 확인
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"
```

#### 3. 메모리 부족
```bash
# Node.js 메모리 증가
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 로그 분석

```bash
# 에러 로그 확인
tail -f error.log | grep ERROR

# 접근 로그 분석
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20

# 느린 쿼리 확인
grep "slow query" combined.log
```

## 백업 및 복구

### 자동 백업

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# 데이터베이스 백업
pg_dump $DATABASE_URL > $BACKUP_DIR/db_$DATE.sql

# 파일 백업
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /app/uploads

# S3 업로드
aws s3 cp $BACKUP_DIR/db_$DATE.sql s3://videopick-backups/
aws s3 cp $BACKUP_DIR/files_$DATE.tar.gz s3://videopick-backups/

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -type f -mtime +30 -delete
```

### 복구 절차

```bash
# 1. 서비스 중지
docker stop videopick_app

# 2. 데이터베이스 복구
psql $DATABASE_URL < backup.sql

# 3. 파일 복구
tar -xzf files_backup.tar.gz -C /

# 4. 서비스 재시작
docker start videopick_app
```

## 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 환경 변수 확인
- [ ] 데이터베이스 백업
- [ ] 마이그레이션 준비
- [ ] 롤백 계획 수립

### 배포 중
- [ ] 헬스 체크 모니터링
- [ ] 로그 실시간 확인
- [ ] 에러율 모니터링
- [ ] 성능 지표 확인

### 배포 후
- [ ] 기능 테스트
- [ ] 성능 테스트
- [ ] 보안 스캔
- [ ] 사용자 피드백 수집
- [ ] 문서 업데이트
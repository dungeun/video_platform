# Coolify 배포 설정 가이드

## 1. Coolify 환경 정보
- **URL**: https://coolify.one-q.xyz/
- **서버**: SSH root 접속 가능
- **목표**: Next.js 기반 레뷰 플랫폼 배포

## 2. 사전 준비사항

### 2.1 로컬 환경에서 SSH 키 확인
```bash
# SSH 키 존재 확인
ls -la ~/.ssh/

# 키가 없다면 생성
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 공개키 복사
cat ~/.ssh/id_rsa.pub
```

### 2.2 서버 접속 테스트
```bash
# 서버 접속 확인
ssh root@coolify.one-q.xyz

# 서버 정보 확인
uname -a
docker --version
docker-compose --version
```

## 3. Coolify 프로젝트 설정

### 3.1 새 프로젝트 생성 단계
1. Coolify 대시보드 접속: https://coolify.one-q.xyz/
2. "New Project" 클릭
3. 프로젝트 설정:
   - **Name**: revu-platform
   - **Description**: 인플루언서 마케팅 레뷰 플랫폼
   - **Environment**: production

### 3.2 Git Repository 연결
```bash
# 로컬에서 Git 저장소 초기화 (아직 안되어 있다면)
cd /Users/admin/new_project/revu-platform
git init
git add .
git commit -m "Initial commit: Revu platform setup"

# GitHub에 저장소 생성 후 연결
git remote add origin https://github.com/your-username/revu-platform.git
git push -u origin main
```

### 3.3 Coolify에서 애플리케이션 추가
1. "New Resource" → "Application"
2. 설정값:
   - **Source**: GitHub Repository
   - **Repository**: your-username/revu-platform
   - **Branch**: main
   - **Build Pack**: Nixpacks (Node.js 자동 감지)
   - **Port**: 3000

## 4. 환경 변수 설정

### 4.1 필수 환경 변수
```bash
# 데이터베이스
DATABASE_URL=postgresql://username:password@hostname:5432/revu_platform

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# Redis (캐시 및 세션)
REDIS_URL=redis://redis:6379

# 외부 서비스
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 파일 업로드 (예: Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 결제 (Toss Payments)
TOSS_CLIENT_KEY=test_ck_your-key
TOSS_SECRET_KEY=test_sk_your-key
```

### 4.2 Coolify에서 환경 변수 설정
1. 애플리케이션 대시보드 → "Environment Variables"
2. 위의 환경 변수들을 하나씩 추가
3. "Save" 클릭

## 5. Docker 설정

### 5.1 Dockerfile 생성
```dockerfile
# /Users/admin/new_project/revu-platform/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run database migrations and start the application
CMD ["node", "server.js"]
```

### 5.2 .dockerignore 파일
```
# /Users/admin/new_project/revu-platform/.dockerignore
node_modules
.next
.git
.gitignore
README.md
Dockerfile
.dockerignore
npm-debug.log
yarn-debug.log
yarn-error.log
.env.local
.env.development.local
.env.test.local
.env.production.local
.vercel
```

### 5.3 Next.js 설정 (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com'],
  },
}

module.exports = nextConfig
```

## 6. 데이터베이스 설정

### 6.1 PostgreSQL 서비스 추가
1. Coolify → "New Resource" → "Database"
2. 선택: PostgreSQL
3. 설정:
   - **Name**: revu-platform-db
   - **Username**: revu_user
   - **Password**: (강력한 비밀번호 생성)
   - **Database**: revu_platform

### 6.2 Redis 서비스 추가
1. Coolify → "New Resource" → "Database"
2. 선택: Redis
3. 설정:
   - **Name**: revu-platform-redis
   - **Port**: 6379

## 7. 빌드 및 배포 스크립트

### 7.1 package.json 스크립트 수정
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "deploy": "npm run db:migrate && npm run start"
  }
}
```

### 7.2 배포 후 초기화 스크립트
```bash
# /Users/admin/new_project/revu-platform/scripts/init-deploy.sh
#!/bin/bash
set -e

echo "🚀 Starting deployment initialization..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database (if needed)
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
fi

echo "✅ Deployment initialization complete!"
```

## 8. 도메인 및 SSL 설정

### 8.1 도메인 연결
1. 도메인 DNS 설정에서 A 레코드 추가:
   - **Host**: @ (또는 원하는 서브도메인)
   - **Value**: Coolify 서버 IP

### 8.2 SSL 인증서 (Let's Encrypt)
1. Coolify 애플리케이션 설정 → "Domains"
2. 도메인 추가: revu-platform.your-domain.com
3. "Enable SSL" 체크
4. "Save" 클릭 (자동으로 Let's Encrypt 인증서 생성)

## 9. 모니터링 및 로그

### 9.1 애플리케이션 로그 확인
```bash
# Coolify 대시보드에서 또는 SSH로 서버 접속 후
docker logs -f container-name
```

### 9.2 헬스 체크 엔드포인트
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
}
```

## 10. 배포 체크리스트

### 배포 전 확인사항
- [ ] 모든 환경 변수 설정 완료
- [ ] Dockerfile 및 .dockerignore 작성
- [ ] next.config.js output: 'standalone' 설정
- [ ] 데이터베이스 마이그레이션 파일 준비
- [ ] SSL 인증서 설정

### 배포 후 확인사항
- [ ] 애플리케이션 정상 접속
- [ ] 데이터베이스 연결 확인
- [ ] 인증 시스템 테스트
- [ ] API 엔드포인트 동작 확인
- [ ] 로그 모니터링 설정

## 11. 트러블슈팅

### 일반적인 문제 해결
1. **빌드 실패**: 의존성 문제 확인, Node.js 버전 확인
2. **데이터베이스 연결 실패**: DATABASE_URL 환경 변수 확인
3. **SSL 오류**: 도메인 DNS 전파 시간 대기 (최대 24시간)
4. **메모리 부족**: Docker 컨테이너 리소스 한계 확인

이제 실제 Coolify에서 프로젝트를 생성하고 PostgreSQL 데이터베이스를 설정해보시겠습니까?
# 🔄 개발 워크플로 가이드

## 📋 개발 환경 설정

### 🛠️ 필수 도구

#### 로컬 개발 환경
```bash
# Node.js 18+ 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2 글로벌 설치
npm install -g pm2

# TypeScript 글로벌 설치 (선택)
npm install -g typescript
```

#### IDE 설정 (VS Code 권장)
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 🔧 프로젝트 설정

#### 1. 저장소 클론
```bash
cd /Users/admin/new_project/
git clone <repository-url> video_platform
cd video_platform
```

#### 2. 의존성 설치
```bash
npm install
```

#### 3. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일 편집하여 개발 환경 설정
```

#### 4. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 개발 데이터베이스 마이그레이션
npx prisma migrate dev

# 샘플 데이터 시드
npx prisma db seed
```

---

## 🔄 Git 워크플로

### 브랜치 전략

```
main
├── develop
│   ├── feature/user-authentication
│   ├── feature/video-upload
│   └── feature/live-streaming
├── hotfix/critical-bug-fix
└── release/v1.1.0
```

#### 브랜치 규칙
- **main**: 프로덕션 배포 브랜치
- **develop**: 개발 통합 브랜치
- **feature/**: 새로운 기능 개발
- **hotfix/**: 긴급 버그 수정
- **release/**: 릴리스 준비

### 커밋 메시지 규칙

```bash
# 형식: type(scope): subject

# 타입
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 관련, 패키지 매니저 설정

# 예시
feat(auth): implement JWT authentication
fix(video): resolve video upload timeout issue
docs(readme): update installation guide
```

### 개발 프로세스

#### 1. 새로운 기능 개발
```bash
# develop 브랜치에서 시작
git checkout develop
git pull origin develop

# 피처 브랜치 생성
git checkout -b feature/video-analytics

# 개발 작업 수행
# ... 코딩 ...

# 변경사항 커밋
git add .
git commit -m "feat(analytics): add video view analytics dashboard"

# 브랜치 푸시
git push origin feature/video-analytics
```

#### 2. Pull Request 생성
1. GitHub에서 Pull Request 생성
2. 코드 리뷰 요청
3. CI/CD 테스트 통과 확인
4. 승인 후 develop 브랜치에 병합

#### 3. 프로덕션 배포
```bash
# develop → main 병합 후
git checkout main
git pull origin main

# 프로덕션 서버 배포
./scripts/deploy-production.sh
```

---

## 🧪 테스트 워크플로

### 테스트 구조
```
tests/
├── unit/           # 단위 테스트
├── integration/    # 통합 테스트
├── e2e/           # E2E 테스트
└── fixtures/      # 테스트 데이터
```

### 테스트 명령어

#### 로컬 테스트
```bash
# 전체 테스트 실행
npm run test

# 특정 테스트 파일
npm run test -- auth.test.ts

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

#### 테스트 시나리오 예시

**API 테스트**:
```javascript
// tests/api/auth.test.js
describe('Authentication API', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

**컴포넌트 테스트**:
```javascript
// tests/components/VideoPlayer.test.tsx
import { render, screen } from '@testing-library/react';
import VideoPlayer from '@/components/VideoPlayer';

test('renders video player with controls', () => {
  render(<VideoPlayer src="test-video.mp4" />);
  expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
});
```

---

## 🔄 CI/CD 파이프라인

### GitHub Actions 워크플로

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # 프로덕션 배포 스크립트 실행
          ./scripts/deploy-production.sh
```

### 배포 자동화

#### 스테이징 배포
```bash
#!/bin/bash
# scripts/deploy-staging.sh

echo "🚀 Staging 배포 시작..."

# 스테이징 서버 접속 및 배포
ssh staging-server << 'EOF'
  cd /opt/videopick/app
  git pull origin develop
  npm install --production
  npm run build
  pm2 restart videopick-staging
EOF

echo "✅ Staging 배포 완료"
```

#### 프로덕션 배포
```bash
#!/bin/bash
# scripts/deploy-production.sh

echo "🚀 프로덕션 배포 시작..."

# 백업 생성
ssh root@158.247.203.55 << 'EOF'
  # 데이터베이스 백업
  docker exec -e PGPASSWORD=secure_password_here videopick-postgres \
    pg_dump -U videopick videopick > /opt/backups/backup_$(date +%Y%m%d_%H%M%S).sql
  
  # 애플리케이션 코드 백업
  cp -r /opt/videopick/app /opt/backups/app_$(date +%Y%m%d_%H%M%S)
EOF

# 배포 실행
ssh root@158.247.203.55 << 'EOF'
  cd /opt/videopick/app
  git pull origin main
  npm install --production
  npm run build
  pm2 restart videopick
  
  # 헬스체크
  sleep 10
  curl -f http://localhost:3000/api/health || exit 1
EOF

echo "✅ 프로덕션 배포 완료"
```

---

## 🛠️ 개발 도구 및 스크립트

### 유용한 개발 스크립트

#### 데이터베이스 관리
```bash
# scripts/db-reset.sh
#!/bin/bash
echo "🗃️ 데이터베이스 리셋 중..."

# 기존 데이터베이스 삭제
npx prisma migrate reset --force

# 새로운 마이그레이션 적용
npx prisma migrate dev

# 시드 데이터 생성
npx prisma db seed

echo "✅ 데이터베이스 리셋 완료"
```

#### 개발 서버 시작
```bash
# scripts/dev-start.sh
#!/bin/bash
echo "🔄 개발 환경 시작 중..."

# Docker 서비스 시작
docker-compose up -d postgres redis

# 데이터베이스 연결 대기
sleep 5

# Next.js 개발 서버 시작
npm run dev
```

#### 코드 품질 체크
```bash
# scripts/quality-check.sh
#!/bin/bash
echo "🔍 코드 품질 검사 중..."

# TypeScript 타입 체크
npx tsc --noEmit

# ESLint 검사
npm run lint

# Prettier 포맷팅 체크
npm run format:check

# 테스트 실행
npm run test

echo "✅ 코드 품질 검사 완료"
```

### IDE 플러그인 권장사항

#### VS Code 확장
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## 📊 성능 모니터링

### 로컬 성능 분석

#### Next.js 번들 분석
```bash
# 번들 크기 분석
npm run build
npm run analyze

# 실행 시간 프로파일링
npm run dev -- --profile
```

#### 데이터베이스 쿼리 최적화
```bash
# Prisma 쿼리 로그 활성화
# .env.local
DATABASE_URL="postgresql://...?logging=true"

# 슬로우 쿼리 분석
npx prisma studio
```

### 모니터링 대시보드 접근

#### 로컬 모니터링 설정
```bash
# Docker로 Grafana + Prometheus 실행
docker-compose -f docker-compose.monitoring.yml up -d

# 접속: http://localhost:3001 (Grafana)
# 기본 계정: admin / admin
```

---

## 🔒 보안 개발 가이드

### 보안 체크리스트

#### 코드 작성 시 주의사항
- [ ] 사용자 입력 검증 및 삭제
- [ ] SQL 인젝션 방지 (Prisma ORM 사용)
- [ ] XSS 방지 (React의 기본 이스케이핑 활용)
- [ ] CSRF 보호 (NextAuth.js 사용)
- [ ] 민감한 데이터 로깅 금지

#### 환경 변수 관리
```bash
# 개발 환경 (.env.local)
DATABASE_URL="postgresql://localhost:5432/videopick_dev"
JWT_SECRET="development-secret-key"

# 프로덕션 환경에서는 반드시 강력한 시크릿 사용
# 환경 변수 파일을 Git에 커밋하지 않음
```

#### 의존성 보안 검사
```bash
# npm audit으로 취약점 검사
npm audit

# 자동 수정 (주의해서 사용)
npm audit fix

# 수동 취약점 검토
npm ls --audit
```

---

## 📈 성능 최적화 가이드

### 프론트엔드 최적화

#### Next.js 최적화
```javascript
// next.config.js
module.exports = {
  // 이미지 최적화
  images: {
    domains: ['storage.one-q.xyz'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 번들 분할
  experimental: {
    bundlePagesExternals: true,
  },
  
  // 압축 활성화
  compress: true,
};
```

#### React 컴포넌트 최적화
```jsx
// 메모화를 통한 불필요한 리렌더링 방지
import { memo, useMemo, useCallback } from 'react';

const VideoCard = memo(({ video, onPlay }) => {
  const handlePlay = useCallback(() => {
    onPlay(video.id);
  }, [video.id, onPlay]);
  
  return (
    <div onClick={handlePlay}>
      {video.title}
    </div>
  );
});
```

### 백엔드 최적화

#### 데이터베이스 쿼리 최적화
```javascript
// Prisma에서 관계 데이터 효율적으로 로드
const videos = await prisma.video.findMany({
  include: {
    channel: {
      select: { name: true, avatar: true }
    },
    _count: {
      select: { comments: true, likes: true }
    }
  },
  take: 20,
  orderBy: { createdAt: 'desc' }
});
```

#### Redis 캐싱
```javascript
// API 응답 캐싱
import { redis } from '@/lib/redis';

export async function GET(request) {
  const cacheKey = 'trending-videos';
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return Response.json(JSON.parse(cached));
  }
  
  const videos = await fetchTrendingVideos();
  await redis.setex(cacheKey, 300, JSON.stringify(videos)); // 5분 캐시
  
  return Response.json(videos);
}
```

---

**💡 팁**: 개발 시 자주 사용하는 명령어들을 alias로 등록하여 생산성을 높이세요!

**📝 마지막 업데이트**: 2025-08-20  
**📋 작성자**: Development Team
# 🔐 오픈소스 인증 솔루션 비교 분석

## 1. 주요 인증 솔루션 비교

### 1.1 Supabase Auth (Self-hosted)
```yaml
특징:
  - Firebase Auth의 오픈소스 대안
  - PostgreSQL 기반
  - 다양한 소셜 로그인 지원
  - Row Level Security
  - Coolify 지원: ✅ (Docker Compose)

장점:
  - 완전한 백엔드 솔루션
  - 실시간 기능 포함
  - 우수한 문서화
  - Next.js 완벽 호환

단점:
  - PostgreSQL 필수
  - 리소스 사용량 높음
  - 복잡한 설정
```

### 1.2 Keycloak
```yaml
특징:
  - Red Hat 개발
  - 엔터프라이즈급 IAM
  - OIDC, SAML 지원
  - 다중 테넌트 지원
  - Coolify 지원: ✅ (1-Click 설치)

장점:
  - 매우 강력한 기능
  - 대규모 확장 가능
  - 상세한 권한 관리
  - 관리자 UI 제공

단점:
  - 무거움 (1GB+ 메모리)
  - 복잡한 설정
  - 오버스펙일 수 있음
```

### 1.3 Authentik
```yaml
특징:
  - 현대적인 UI/UX
  - OAuth2/OIDC Provider
  - LDAP 지원
  - 플로우 기반 인증
  - Coolify 지원: ✅ (Docker)

장점:
  - 직관적인 관리 UI
  - 유연한 인증 플로우
  - 가벼움
  - 활발한 개발

단점:
  - 상대적으로 신규
  - 문서화 부족
  - 플러그인 생태계 작음
```

### 1.4 Ory (Kratos + Hydra)
```yaml
특징:
  - 마이크로서비스 아키텍처
  - Kratos (인증) + Hydra (OAuth2)
  - API 중심 설계
  - 헤드리스 (UI 없음)
  - Coolify 지원: ✅ (Docker Compose)

장점:
  - 매우 유연함
  - 고성능
  - 보안 중심 설계
  - 클라우드 네이티브

단점:
  - UI 직접 구현 필요
  - 가파른 학습 곡선
  - 복잡한 설정
```

### 1.5 Authelia
```yaml
특징:
  - 리버스 프록시 통합
  - 2FA/MFA 지원
  - SSO 지원
  - 간단한 설정
  - Coolify 지원: ✅ (Docker)

장점:
  - 매우 가벼움
  - 설정 간단
  - Traefik 통합 우수
  - 활발한 커뮤니티

단점:
  - 소셜 로그인 제한적
  - API 기능 부족
  - 주로 웹앱용
```

## 2. 동영상 플랫폼 추천: Supabase (Self-hosted)

### 2.1 선택 이유
```yaml
동영상 플랫폼 요구사항:
  - ✅ 소셜 로그인 (YouTube, Google, etc.)
  - ✅ JWT 토큰 기반 인증
  - ✅ 실시간 기능 (라이브 채팅)
  - ✅ PostgreSQL 이미 사용 중
  - ✅ Next.js 완벽 호환
  - ✅ 파일 스토리지 (프로필, 썸네일)
```

### 2.2 Coolify 설치 방법

#### Docker Compose 설정
```yaml
version: '3.8'

services:
  supabase-db:
    image: supabase/postgres:15.1.0.117
    container_name: supabase-db
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  supabase-auth:
    image: supabase/gotrue:v2.132.3
    container_name: supabase-auth
    depends_on:
      - supabase-db
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: ${SUPABASE_PUBLIC_URL}
      
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@supabase-db:5432/postgres
      
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: ${ALLOWED_URLS}
      
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      
      # 소셜 로그인 설정
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: true
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_CLIENT_SECRET}
      
      GOTRUE_EXTERNAL_GITHUB_ENABLED: true
      GOTRUE_EXTERNAL_GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GOTRUE_EXTERNAL_GITHUB_SECRET: ${GITHUB_CLIENT_SECRET}
    ports:
      - "9999:9999"
    restart: unless-stopped

  supabase-realtime:
    image: supabase/realtime:v2.25.50
    container_name: supabase-realtime
    depends_on:
      - supabase-db
    environment:
      DB_HOST: supabase-db
      DB_PORT: 5432
      DB_NAME: postgres
      DB_USER: supabase_admin
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_SSL: "false"
      
      PORT: 4000
      JWT_SECRET: ${JWT_SECRET}
      REPLICATION_MODE: RLS
      REPLICATION_POLL_INTERVAL: 100
      
      SECURE_CHANNELS: "true"
      SLOT_NAME: supabase_realtime_rls
      TEMPORARY_SLOT: "true"
    ports:
      - "4000:4000"
    restart: unless-stopped

  supabase-storage:
    image: supabase/storage-api:v0.43.11
    container_name: supabase-storage
    depends_on:
      - supabase-db
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      PROJECT_REF: videopick
      
      POSTGREST_URL: http://supabase-rest:3000
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@supabase-db:5432/postgres
      
      FILE_SIZE_LIMIT: 10737418240  # 10GB for videos
      STORAGE_BACKEND: s3
      
      # S3 설정 (선택사항)
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_DEFAULT_REGION: ${AWS_REGION}
      AWS_BUCKET: ${S3_BUCKET}
    volumes:
      - supabase-storage-data:/var/lib/storage
    ports:
      - "5000:5000"
    restart: unless-stopped

volumes:
  supabase-db-data:
  supabase-storage-data:
```

### 2.3 환경변수 설정
```bash
# Supabase 환경변수
SUPABASE_PUBLIC_URL=https://auth.video.one-q.xyz
SITE_URL=https://video.one-q.xyz

# JWT (기존과 동일하게 사용 가능)
JWT_SECRET=VideoPick2024!SuperSecretJWTKey#VideoplatformProduction$

# Supabase Keys
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (기존 DB 사용 가능)
POSTGRES_PASSWORD=47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX
```

## 3. 다른 옵션들의 Coolify 설치

### 3.1 Keycloak (가장 간단)
```bash
# Coolify 1-Click Apps에서 선택
1. Services → Add Service
2. Select "Keycloak"
3. Configure domain: auth.video.one-q.xyz
4. Deploy
```

### 3.2 Authentik
```yaml
version: '3.8'

services:
  authentik-redis:
    image: redis:alpine
    restart: unless-stopped
    
  authentik-server:
    image: ghcr.io/goauthentik/server:2023.10.7
    restart: unless-stopped
    command: server
    environment:
      AUTHENTIK_REDIS__HOST: authentik-redis
      AUTHENTIK_POSTGRESQL__HOST: ${PG_HOST}
      AUTHENTIK_POSTGRESQL__USER: ${PG_USER}
      AUTHENTIK_POSTGRESQL__NAME: ${PG_DB}
      AUTHENTIK_POSTGRESQL__PASSWORD: ${PG_PASS}
      AUTHENTIK_SECRET_KEY: ${SECRET_KEY}
    ports:
      - "9000:9000"
      
  authentik-worker:
    image: ghcr.io/goauthentik/server:2023.10.7
    restart: unless-stopped
    command: worker
    environment:
      # 동일한 환경변수
```

### 3.3 Ory Kratos
```yaml
version: '3.8'

services:
  kratos-migrate:
    image: oryd/kratos:v1.0.0
    environment:
      - DSN=postgres://...
    command: migrate sql -e --yes
    
  kratos:
    image: oryd/kratos:v1.0.0
    depends_on:
      - kratos-migrate
    ports:
      - "4433:4433" # public
      - "4434:4434" # admin
    environment:
      - DSN=postgres://...
      - SECRETS_COOKIE=${COOKIE_SECRET}
      - SECRETS_CIPHER=${CIPHER_SECRET}
      - LOG_LEVEL=debug
    command: serve -c /etc/config/kratos/kratos.yml --dev
```

## 4. 통합 가이드

### 4.1 Next.js + Supabase 통합
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 인증 훅
export function useAuth() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
      }
    )
    
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])
  
  return { user }
}
```

### 4.2 마이그레이션 전략
```sql
-- 기존 사용자를 Supabase Auth로 마이그레이션
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  created_at,
  updated_at
)
SELECT 
  id::uuid,
  email,
  password, -- bcrypt 해시 그대로 사용 가능
  created_at,
  updated_at
FROM users;
```

## 5. 추천 아키텍처

### 5.1 Supabase 통합 (권장)
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js App   │────▶│ Supabase Auth│────▶│ PostgreSQL  │
│                 │     │              │     │             │
│  - 소셜 로그인   │     │  - JWT 발급   │     │  - 사용자    │
│  - 회원가입      │     │  - 세션 관리  │     │  - 프로필    │
│  - 프로필 관리   │     │  - 권한 확인  │     │  - 권한      │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      │
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌──────────────┐
│     Redis       │     │   Storage    │
│                 │     │              │
│  - 세션 캐싱    │     │  - 프로필 이미지│
│  - 토큰 블랙리스트│     │  - 동영상 파일 │
└─────────────────┘     └──────────────┘
```

### 5.2 단계별 전환 계획
```yaml
Phase 1: 평가 (1주)
  - Supabase 로컬 테스트
  - 기능 검증
  - 성능 테스트

Phase 2: 통합 (2주)
  - Next.js 통합
  - 기존 인증 병행 운영
  - 마이그레이션 스크립트 준비

Phase 3: 마이그레이션 (1주)
  - 사용자 데이터 이전
  - 권한 매핑
  - 테스트

Phase 4: 전환 (1주)
  - 기존 인증 제거
  - 모니터링
  - 최적화
```

## 6. 비용 분석

### 6.1 자체 호스팅 비용
```yaml
Supabase Self-hosted:
  - 비용: 무료 (인프라 비용만)
  - 필요 리소스: 2GB RAM, 2 CPU
  - 관리: 직접 관리 필요

Keycloak:
  - 비용: 무료
  - 필요 리소스: 1GB RAM, 1 CPU
  - 관리: 중간 복잡도

Authentik:
  - 비용: 무료
  - 필요 리소스: 512MB RAM, 1 CPU
  - 관리: 쉬움
```

## 7. 결론

### 동영상 플랫폼에는 Supabase를 추천합니다:
1. **완전한 백엔드 솔루션** - Auth + Realtime + Storage
2. **Next.js 최적화** - 공식 SDK 제공
3. **소셜 로그인** - YouTube, Google 등 쉽게 추가
4. **실시간 기능** - 라이브 채팅, 알림에 활용
5. **기존 PostgreSQL 활용** - 데이터베이스 통합 가능

### 대안:
- **간단한 SSO만 필요**: Authelia
- **엔터프라이즈급 필요**: Keycloak
- **커스터마이징 중요**: Ory Kratos
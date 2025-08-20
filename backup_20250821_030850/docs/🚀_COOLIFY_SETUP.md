# 🚀 VideoPick Coolify 배포 가이드

> Appwrite 설치 완료 후 VideoPick 설정 및 배포

## 📋 사전 준비 체크리스트

### ✅ 이미 완료된 것들
- [x] Coolify 설치
- [x] PostgreSQL 설치 (새 DB)
- [x] Redis 설치
- [x] Appwrite 설치

### 🔧 필요한 설정
- [ ] Appwrite 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] Ant Media Server 연동
- [ ] 도메인 설정

## 1️⃣ Appwrite 설정

### 1.1 Appwrite 콘솔 접속
```bash
# Appwrite URL (Coolify에서 확인)
https://appwrite.coolify.one-q.xyz

# 관리자 계정으로 로그인
```

### 1.2 VideoPick 프로젝트 생성
```yaml
프로젝트 정보:
  이름: VideoPick
  프로젝트 ID: videopick
  
플랫폼 추가:
  - Web App
    - 이름: VideoPick Web
    - 호스트: wcs0go00wsocssgwk0o8848c.141.164.60.51.sslip.io
```

### 1.3 데이터베이스 & 컬렉션 생성
```javascript
// Appwrite Console에서 생성
Database: videopick

Collections:
1. channels
   - name (string, required)
   - description (string)
   - userId (string, required)
   - avatar (string)
   - banner (string)
   - subscriberCount (integer, default: 0)

2. videos  
   - title (string, required)
   - description (string)
   - channelId (string, required)
   - videoUrl (string)
   - thumbnailUrl (string)
   - duration (integer)
   - viewCount (integer, default: 0)
   - likeCount (integer, default: 0)
   - status (string) // draft, processing, published

3. comments
   - videoId (string, required)
   - userId (string, required)
   - content (string, required)
   - likeCount (integer, default: 0)
   - parentId (string) // for replies

4. liveChats
   - streamId (string, required)
   - userId (string, required)
   - message (string, required)
   - type (string) // normal, super_chat
   - amount (integer) // for super chat
```

### 1.4 API 키 생성
```yaml
API Keys:
  - 이름: VideoPick Server Key
  - 권한: 
    - Database: Read/Write
    - Storage: Read/Write
    - Auth: Admin
  - API Key: 복사하여 환경 변수에 사용
```

## 2️⃣ 환경 변수 설정

### 2.1 .env.production 생성
```bash
# 프로젝트 루트에서
cp .env .env.backup
touch .env.production
```

### 2.2 환경 변수 내용
```env
# ===== DATABASE (새 PostgreSQL) =====
DATABASE_URL="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"

# ===== REDIS =====
REDIS_URL="redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0"
DISABLE_REDIS="false"

# ===== AUTHENTICATION =====
JWT_SECRET="VideoPick2024!SuperSecretJWTKey#VideoplatformProduction$"

# ===== APPWRITE =====
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://appwrite.coolify.one-q.xyz/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="videopick"
APPWRITE_API_KEY="[위에서 생성한 API 키]"

# ===== APPLICATION =====
NEXT_PUBLIC_API_URL="http://wcs0go00wsocssgwk0o8848c.141.164.60.51.sslip.io"
NEXT_PUBLIC_APP_URL="http://wcs0go00wsocssgwk0o8848c.141.164.60.51.sslip.io"
NODE_ENV="production"

# ===== PAYMENT (기존 유지) =====
TOSS_SECRET_KEY="test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R"
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"

# ===== FEATURE FLAGS =====
ENABLE_VIDEO_TAB="true"
ENABLE_LEGACY_ROUTES="true"
MIGRATION_MODE="prepare"
```

## 3️⃣ 코드 수정 (최소한)

### 3.1 Appwrite 클라이언트 설정
```typescript
// lib/appwrite.ts
import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// 서버 사이드용 (API Key 사용)
export const serverClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
```

### 3.2 인증 통합
```typescript
// hooks/useAuth.ts 수정
import { account } from '@/lib/appwrite';

export function useAuth() {
  // 기존 JWT 로직 유지하면서 Appwrite 추가
  const loginWithAppwrite = async (email: string, password: string) => {
    try {
      // Appwrite 로그인
      const session = await account.createEmailSession(email, password);
      
      // 기존 시스템과 동기화
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({ appwriteSession: session })
      });
      
      // 기존 로직 계속...
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  // 기존 메서드 유지
  return {
    ...existingMethods,
    loginWithAppwrite,
  };
}
```

## 4️⃣ Coolify 배포

### 4.1 Git Repository 연결
```yaml
Coolify Dashboard:
  1. New Project → New Resource
  2. Public Repository 선택
  3. Repository URL 입력
  4. Branch: main
```

### 4.2 빌드 설정
```yaml
Build Pack: Nixpacks
Base Directory: /
Install Command: npm install
Build Command: npm run build
Start Command: npm run start
Port: 3000
```

### 4.3 환경 변수 설정
```yaml
Environment Variables:
  - .env.production 내용 복사
  - Coolify 환경 변수에 붙여넣기
  - Save
```

### 4.4 배포
```bash
# Coolify에서
1. Deploy 버튼 클릭
2. 로그 확인
3. 배포 완료 대기
```

## 5️⃣ 배포 후 설정

### 5.1 데이터베이스 마이그레이션
```bash
# Coolify 콘솔에서
npm run prisma:migrate
```

### 5.2 초기 데이터 설정
```bash
# 관리자 계정 생성
npm run seed:admin
```

### 5.3 헬스 체크
```bash
# 접속 확인
curl http://wcs0go00wsocssgwk0o8848c.141.164.60.51.sslip.io/api/health
```

## 6️⃣ Ant Media 연동 (추후)

### 6.1 Vultr에 Ant Media Server 설치
```bash
# 별도 가이드 참조
./scripts/install-antmedia.sh
```

### 6.2 환경 변수 추가
```env
ANT_MEDIA_URL="https://stream.video.one-q.xyz:5443"
ANT_MEDIA_APP="LiveApp"
```

## 7️⃣ 모니터링

### 7.1 Coolify 대시보드
- CPU/메모리 사용량
- 로그 실시간 확인
- 재시작/스케일링

### 7.2 Appwrite 콘솔
- 사용자 통계
- API 사용량
- 에러 로그

## 🚨 트러블슈팅

### 문제: Appwrite 연결 실패
```bash
# 해결책
1. Appwrite URL 확인
2. 프로젝트 ID 확인
3. CORS 설정 확인
```

### 문제: 데이터베이스 연결 실패
```bash
# 해결책
1. PostgreSQL 호스트 확인
2. 비밀번호 확인
3. 네트워크 연결 확인
```

### 문제: Redis 연결 실패
```bash
# 해결책
1. Redis URL 확인
2. 비밀번호 확인
3. DISABLE_REDIS="true" 임시 설정
```

## ✅ 체크리스트

- [ ] Appwrite 프로젝트 생성
- [ ] 컬렉션 생성 (4개)
- [ ] API 키 생성
- [ ] 환경 변수 설정
- [ ] 코드 수정 (최소)
- [ ] Coolify 배포
- [ ] 헬스 체크
- [ ] 관리자 계정 생성

---

**다음 단계**: 배포 완료 후 기능별 점진적 활성화
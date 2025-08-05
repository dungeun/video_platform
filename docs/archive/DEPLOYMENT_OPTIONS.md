# 🚀 동영상 플랫폼 배포 옵션

## 1. URL 구성 옵션

### 현재 상황
- **기존 LinkPick**: `https://revu.one-q.xyz` (운영 중)
- **Coolify 서버**: `https://coolify.one-q.xyz` (여러 프로젝트 호스팅)
- **새 동영상 플랫폼**: 별도 URL 필요

### 옵션 1: 서브도메인 사용 (권장) ✅
```bash
NEXT_PUBLIC_API_URL=https://video.one-q.xyz
NEXT_PUBLIC_APP_URL=https://video.one-q.xyz
```

**장점**:
- 기존 플랫폼과 완전히 분리
- 독립적인 운영 가능
- DNS 설정만으로 라우팅 가능

**필요 작업**:
1. DNS에 `video.one-q.xyz` A 레코드 추가
2. Coolify에서 도메인 설정
3. SSL 인증서 자동 발급

### 옵션 2: Coolify 자동 생성 URL 사용 (테스트용)
```bash
# Coolify가 생성하는 URL 형식
NEXT_PUBLIC_API_URL=https://[project-id].[server-ip].sslip.io
NEXT_PUBLIC_APP_URL=https://[project-id].[server-ip].sslip.io
```

**장점**:
- 즉시 사용 가능
- 별도 DNS 설정 불필요

**단점**:
- 긴 URL
- 프로덕션에 부적합

### 옵션 3: 다른 도메인 사용
```bash
# 새로운 도메인 구매
NEXT_PUBLIC_API_URL=https://videopick.com
NEXT_PUBLIC_APP_URL=https://videopick.com
```

**장점**:
- 완전히 새로운 브랜드
- 독립적인 서비스

**단점**:
- 도메인 구매 비용
- 새로운 브랜드 구축 필요

### 옵션 4: 경로 기반 라우팅 (비권장)
```bash
NEXT_PUBLIC_API_URL=https://revu.one-q.xyz/video
NEXT_PUBLIC_APP_URL=https://revu.one-q.xyz/video
```

**장점**:
- 같은 도메인 사용

**단점**:
- 기존 서비스와 충돌 가능
- 복잡한 라우팅 설정

## 2. Coolify 배포 설정

### 2.1 새 프로젝트 생성
1. Coolify 대시보드 접속
2. "New Project" 클릭
3. 프로젝트명: `video-platform` 또는 `videopick`

### 2.2 환경 설정
```yaml
# Coolify 설정
Service Name: videopick
Port: 3000
Health Check Path: /api/health
Build Pack: Node.js
```

### 2.3 도메인 설정
```bash
# 서브도메인 사용 시
Domains: video.one-q.xyz

# 또는 Coolify 자동 URL
Domains: (자동 생성됨)
```

### 2.4 환경변수 설정
`COOLIFY_ENV_VARS_VIDEO.txt` 파일 내용을 복사하여 붙여넣기

### 2.5 Redis 설정
```yaml
# docker-compose.yml에 추가
services:
  redis:
    image: redis:7-alpine
    container_name: video-platform-redis
    networks:
      - coolify
    volumes:
      - redis-data:/data
```

## 3. 마이그레이션 시나리오

### 시나리오 1: 완전 분리 (권장)
```
LinkPick (revu.one-q.xyz) ← 기존 유지
    ↓
VideoPick (video.one-q.xyz) ← 새로 구축
```

### 시나리오 2: 점진적 전환
```
1단계: video.one-q.xyz에서 베타 운영
2단계: 사용자 점진적 이동
3단계: revu.one-q.xyz를 video로 리다이렉트
```

### 시나리오 3: 병행 운영
```
revu.one-q.xyz → 캠페인 플랫폼
video.one-q.xyz → 동영상 플랫폼
(사용자 계정 공유)
```

## 4. 네트워크 구성

### 4.1 현재 구성
```
인터넷
  ↓
Coolify Proxy (Traefik)
  ↓
  ├── revu.one-q.xyz → LinkPick Container
  ├── coolify.one-q.xyz → Coolify Dashboard
  └── [기타 프로젝트들]
```

### 4.2 추가될 구성
```
인터넷
  ↓
Coolify Proxy (Traefik)
  ↓
  ├── revu.one-q.xyz → LinkPick Container
  ├── video.one-q.xyz → VideoPick Container
  ├── coolify.one-q.xyz → Coolify Dashboard
  └── [기타 프로젝트들]
```

## 5. 데이터베이스 분리

### 옵션 1: 같은 PostgreSQL, 다른 스키마
```sql
-- 기존
revu_platform (스키마)

-- 추가
video_platform (스키마)
```

### 옵션 2: 같은 PostgreSQL, 다른 데이터베이스
```sql
-- 기존
postgres://...@host:5432/revu_platform

-- 신규
postgres://...@host:5432/video_platform
```

### 옵션 3: 별도 PostgreSQL 인스턴스 (권장)
```bash
# 기존
DATABASE_URL=postgres://...@old-host:5432/revu_platform

# 신규
DATABASE_URL=postgres://...@new-host:5432/video_platform
```

## 6. 추천 배포 전략

### Phase 1: 개발/테스트 (현재)
- Coolify 자동 URL 사용
- 기능 플래그 모두 false
- 데이터베이스 스키마만 준비

### Phase 2: 베타 배포
- `video.one-q.xyz` 서브도메인 설정
- 선택된 사용자만 접근
- 기본 기능만 활성화

### Phase 3: 정식 출시
- 모든 기능 활성화
- 마케팅 시작
- 기존 사용자 안내

### Phase 4: 전환 완료
- 필요시 리다이렉트 설정
- 레거시 시스템 종료 계획

## 7. 체크리스트

### DNS 설정
- [ ] `video.one-q.xyz` A 레코드 추가
- [ ] SSL 인증서 발급 확인
- [ ] DNS 전파 확인 (dig video.one-q.xyz)

### Coolify 설정
- [ ] 새 프로젝트 생성
- [ ] Git 저장소 연결
- [ ] 환경변수 설정
- [ ] 도메인 설정
- [ ] 빌드 및 배포 테스트

### 데이터베이스
- [ ] 새 데이터베이스/스키마 생성
- [ ] 마이그레이션 스크립트 준비
- [ ] 백업 전략 수립

### 모니터링
- [ ] 헬스체크 엔드포인트 구현
- [ ] 로그 수집 설정
- [ ] 에러 추적 설정
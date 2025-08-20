# 🎬 VideoPick - 비디오 콘텐츠 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-green)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

비디오 콘텐츠 스트리밍과 인플루언서 마케팅을 결합한 차세대 플랫폼입니다.

## 🌟 주요 기능

### 📺 비디오 스트리밍
- **라이브 스트리밍**: RTMP 지원 실시간 방송
- **VOD 서비스**: 다양한 비디오 콘텐츠 재생
- **멀티 해상도**: 자동 화질 조정 (HLS)
- **실시간 채팅**: 시청자와 실시간 소통

### 💼 인플루언서 마케팅
- **캠페인 관리**: 브랜드-인플루언서 매칭
- **콘텐츠 협업**: 협찬 콘텐츠 제작 관리
- **수익 정산**: 자동 수익 분배 시스템
- **성과 분석**: 상세한 캠페인 리포트

### 🎯 타겟팅 기능
- **개인화 추천**: AI 기반 콘텐츠 큐레이션
- **카테고리 분류**: 다양한 주제별 분류
- **트렌드 분석**: 실시간 인기 콘텐츠 추적
- **사용자 프로필**: 맞춤형 사용자 경험

## 🏗️ 기술 스택

### Frontend
- **Next.js 14**: App Router, Server Components
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **HLS.js**: 비디오 스트리밍 플레이어

### Backend
- **Next.js API Routes**: RESTful API 구현
- **Prisma ORM**: 데이터베이스 추상화
- **PostgreSQL**: 관계형 데이터베이스
- **Redis**: 캐싱 및 세션 관리
- **JWT**: 인증 시스템

### Infrastructure
- **Docker**: 컨테이너화 배포
- **Nginx**: 리버스 프록시 및 로드 밸런싱
- **MediaMTX**: RTMP/HLS 스트리밍 서버
- **Centrifugo**: 실시간 통신
- **MinIO**: 객체 스토리지
- **TUS**: 대용량 파일 업로드

### Monitoring
- **Prometheus**: 메트릭 수집
- **Grafana**: 시각화 대시보드
- **Node Exporter**: 시스템 메트릭

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18 이상
- PostgreSQL 15 이상
- Docker & Docker Compose
- Redis (선택사항)

### 개발 환경 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-repo/videopick.git
   cd videopick
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   # .env.local 파일을 편집하여 필요한 환경 변수 설정
   ```

4. **데이터베이스 설정**
   ```bash
   # Prisma 클라이언트 생성
   npx prisma generate
   
   # 데이터베이스 스키마 적용
   npx prisma db push
   
   # (선택) 샘플 데이터 생성
   npx prisma db seed
   ```

5. **개발 서버 시작**
   ```bash
   npm run dev
   ```

6. **브라우저에서 확인**
   ```
   http://localhost:3000
   ```

## 📱 주요 페이지

### 사용자 페이지
- **메인페이지** (`/`): 인기 콘텐츠 및 추천 영상
- **비디오 목록** (`/videos`): 전체 비디오 카탈로그
- **라이브** (`/live`): 실시간 방송 목록
- **커뮤니티** (`/community`): 사용자 게시판
- **마이페이지** (`/mypage`): 개인 설정 및 구독 관리

### 크리에이터 페이지
- **스튜디오** (`/studio`): 콘텐츠 관리 허브
- **업로드** (`/studio/upload`): 비디오 업로드
- **수익** (`/studio/earnings`): 수익 현황
- **분석** (`/studio/analytics`): 성과 분석

### 비즈니스 페이지
- **대시보드** (`/dashboard`): 캠페인 관리 허브
- **캠페인** (`/dashboard/campaigns`): 마케팅 캠페인
- **인플루언서** (`/dashboard/influencers`): 크리에이터 매칭
- **결제** (`/dashboard/payments`): 정산 관리

### 관리자 페이지
- **관리 콘솔** (`/admin`): 전체 시스템 관리
- **사용자 관리** (`/admin/users`): 회원 관리
- **콘텐츠 관리** (`/admin/content`): 콘텐츠 모더레이션
- **시스템 설정** (`/admin/settings`): 플랫폼 설정

## 🗄️ 데이터베이스 스키마

### 핵심 엔티티
```sql
-- 사용자 관리
users              # 기본 사용자 정보
profiles           # 확장 프로필 정보
channels           # 크리에이터 채널

-- 콘텐츠 관리
videos             # 비디오 콘텐츠
live_streams       # 라이브 스트림
posts              # 커뮤니티 게시글
comments           # 댓글 시스템

-- 마케팅 캠페인
campaigns          # 마케팅 캠페인
campaign_applications # 지원 관리
contents           # 협찬 콘텐츠

-- 수익 시스템
payments           # 결제 정보
super_chats        # 슈퍼챗 후원
creator_earnings   # 크리에이터 수익
```

### 관계도
```
users (1:1) profiles
users (1:1) channels
channels (1:N) videos
channels (1:N) live_streams
campaigns (1:N) campaign_applications
users (1:N) campaign_applications
```

## 🔧 스크립트 명령어

```bash
# 개발
npm run dev          # 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 시작
npm run lint         # 코드 린팅
npm run type-check   # TypeScript 타입 검사

# 데이터베이스
npm run db:generate  # Prisma 클라이언트 생성
npm run db:push      # 스키마 적용
npm run db:migrate   # 마이그레이션 실행
npm run db:seed      # 샘플 데이터 생성
npm run db:studio    # Prisma Studio 실행

# 테스트
npm run test         # 단위 테스트 실행
npm run test:e2e     # E2E 테스트 실행
npm run test:watch   # 테스트 감시 모드
```

## 📦 배포

### Docker 배포
```bash
# Docker 이미지 빌드
docker build -t videopick:latest .

# Docker Compose로 전체 스택 실행
docker-compose up -d
```

### 클라우드 배포
현재 Vultr 클라우드에 배포되어 운영 중입니다.

- **메인 사이트**: https://main.one-q.xyz
- **모니터링**: http://monitor.one-q.xyz

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

## 🧪 테스트

### 단위 테스트
```bash
npm run test
```

### E2E 테스트
```bash
npm run test:e2e
```

### API 테스트
```bash
# 헬스 체크
curl http://localhost:3000/api/health

# 인증 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📚 문서

- [배포 가이드](./DEPLOYMENT.md): 프로덕션 배포 상세 가이드
- [API 문서](./docs/API.md): REST API 레퍼런스
- [데이터베이스 스키마](./docs/SCHEMA.md): DB 구조 문서
- [개발 가이드](./docs/DEVELOPMENT.md): 개발자 가이드

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 🆘 지원

### 기술 지원
- GitHub Issues: 버그 리포트 및 기능 요청
- 이메일: support@videopick.com

### FAQ

**Q: 개발 환경에서 비디오 업로드가 안 됩니다.**
A: MinIO 스토리지 서버와 TUS 업로드 서버가 실행되고 있는지 확인하세요.

**Q: 라이브 스트리밍 테스트는 어떻게 하나요?**
A: OBS Studio에서 RTMP 설정을 `rtmp://localhost:1935/live/{stream_key}`로 설정하세요.

**Q: 데이터베이스 마이그레이션 오류가 발생합니다.**
A: PostgreSQL이 실행 중이고 연결 문자열이 올바른지 확인하세요.

---

**🎬 VideoPick** - 다음 세대의 비디오 플랫폼을 만들어갑니다.

Made with ❤️ by VideoPick Team
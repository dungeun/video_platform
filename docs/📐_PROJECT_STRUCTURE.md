# 📐 VideoPick 프로젝트 구조

> PRD_VIDEO_PLATFORM_V2.md 기반 프로젝트 구조 정리

## 🗂️ 디렉토리 구조

```
video_platform/
├── 📄 설정 파일
│   ├── .env                      # 환경 변수 (운영)
│   ├── .env.video               # 비디오 플랫폼 기본 설정
│   ├── .env.antmedia           # Ant Media 설정
│   ├── package.json            # 프로젝트 의존성
│   └── tsconfig.json          # TypeScript 설정
│
├── 📊 데이터베이스
│   └── prisma/
│       ├── schema.prisma      # 데이터 모델 정의
│       └── migrations/        # 마이그레이션 파일
│
├── 🎨 프론트엔드
│   ├── app/                   # Next.js 14 App Router
│   │   ├── (auth)/           # 인증 관련 페이지
│   │   ├── (main)/           # 메인 서비스 페이지
│   │   ├── studio/           # 크리에이터 스튜디오
│   │   └── api/              # API 라우트
│   │
│   ├── components/            # React 컴포넌트
│   │   ├── common/           # 공통 컴포넌트
│   │   ├── video/            # 비디오 관련
│   │   ├── live/             # 라이브 관련
│   │   └── studio/           # 스튜디오 관련
│   │
│   └── public/               # 정적 파일
│       ├── images/          # 이미지
│       └── icons/           # 아이콘
│
├── 🔧 백엔드
│   ├── lib/                  # 핵심 라이브러리
│   │   ├── auth/            # 인증 (Appwrite)
│   │   ├── streaming/       # 스트리밍 (Ant Media)
│   │   ├── storage/         # 스토리지 (Vultr)
│   │   └── db/              # 데이터베이스
│   │
│   ├── services/            # 비즈니스 로직
│   │   ├── video/          # 비디오 서비스
│   │   ├── live/           # 라이브 서비스
│   │   └── analytics/      # 분석 서비스
│   │
│   └── utils/              # 유틸리티
│       ├── constants.ts    # 상수
│       └── helpers.ts      # 헬퍼 함수
│
├── 📚 문서
│   └── docs/
│       ├── 📋_DOCUMENT_INDEX.md      # 문서 인덱스
│       ├── 🎯_QUICK_START.md         # 빠른 시작
│       ├── 📐_PROJECT_STRUCTURE.md   # 이 문서
│       ├── PRD_VIDEO_PLATFORM_V2.md  # 핵심 PRD
│       └── archive/                  # 보관 문서
│
└── 🛠️ 스크립트
    └── scripts/
        ├── install-antmedia.sh      # Ant Media 설치
        ├── configure-s3.sh          # S3 설정
        └── migrate-data.js          # 데이터 마이그레이션
```

## 📦 주요 패키지 구조

### 1. 인증 시스템 (`lib/auth/`)
```typescript
auth/
├── appwrite.ts         # Appwrite 클라이언트
├── session.ts         # 세션 관리
├── middleware.ts      # 인증 미들웨어
└── hooks.ts          # React 훅 (useAuth 등)
```

### 2. 스트리밍 시스템 (`lib/streaming/`)
```typescript
streaming/
├── antmedia.ts       # Ant Media API 클라이언트
├── webrtc.ts        # WebRTC 연결 관리
├── player.ts        # 플레이어 컴포넌트
└── broadcast.ts     # 방송 관리
```

### 3. 스토리지 시스템 (`lib/storage/`)
```typescript
storage/
├── vultr.ts         # Vultr Object Storage
├── upload.ts        # 업로드 관리
├── cdn.ts          # CDN 통합
└── thumbnails.ts    # 썸네일 생성
```

## 🔌 API 구조

### 1. RESTful API (`app/api/`)
```
api/
├── auth/           # 인증 관련
├── videos/         # VOD 관리
├── streams/        # 라이브 스트림
├── channels/       # 채널 관리
├── comments/       # 댓글 시스템
└── analytics/      # 분석 데이터
```

### 2. WebSocket (`lib/realtime/`)
```
realtime/
├── chat.ts         # 실시간 채팅
├── notifications.ts # 실시간 알림
└── presence.ts     # 사용자 상태
```

## 🎯 핵심 컴포넌트

### 1. 비디오 플레이어
```tsx
components/video/
├── VideoPlayer.tsx      # 메인 플레이어
├── VideoControls.tsx    # 컨트롤 UI
├── VideoChat.tsx        # 채팅 통합
└── VideoInfo.tsx        # 정보 표시
```

### 2. 라이브 스트리밍
```tsx
components/live/
├── LivePlayer.tsx       # 라이브 플레이어
├── LiveChat.tsx         # 실시간 채팅
├── LiveStats.tsx        # 실시간 통계
└── StreamSetup.tsx      # 방송 설정
```

### 3. 스튜디오
```tsx
components/studio/
├── Dashboard.tsx        # 대시보드
├── VideoUpload.tsx      # 업로드 UI
├── LiveControl.tsx      # 라이브 컨트롤
└── Analytics.tsx        # 분석 차트
```

## 🗄️ 데이터 모델

### 핵심 엔티티
```prisma
// 주요 모델 (schema.prisma)
- User          # 사용자
- Channel       # 채널
- Video         # VOD 콘텐츠
- LiveStream    # 라이브 스트림
- Comment       # 댓글
- Subscription  # 구독
- Analytics     # 분석 데이터
```

## 🔐 환경 변수

### 필수 설정
```env
# 데이터베이스
DATABASE_URL            # PostgreSQL
REDIS_URL              # Redis

# 인증
APPWRITE_ENDPOINT      # Appwrite URL
APPWRITE_PROJECT_ID    # 프로젝트 ID

# 스트리밍
ANT_MEDIA_URL         # Ant Media 서버
ANT_MEDIA_APP        # 애플리케이션 이름

# 스토리지
VULTR_ACCESS_KEY     # Access Key
VULTR_SECRET_KEY     # Secret Key
VULTR_BUCKET_NAME    # 버킷 이름
```

## 🚀 빌드 및 배포

### 개발 환경
```bash
npm run dev          # 개발 서버
npm run build       # 프로덕션 빌드
npm run start       # 프로덕션 시작
```

### 배포 구조
```
Production/
├── Next.js App     # Vercel/Coolify
├── Ant Media      # Vultr 서버
├── PostgreSQL     # Coolify
├── Redis          # Coolify
└── Appwrite       # Coolify
```

## 📝 개발 규칙

### 1. 파일 명명 규칙
- 컴포넌트: PascalCase (`VideoPlayer.tsx`)
- 유틸리티: camelCase (`helpers.ts`)
- 상수: UPPER_SNAKE_CASE (`constants.ts`)

### 2. 코드 구조
- 컴포넌트별 폴더 구조
- 비즈니스 로직 분리
- 타입 정의 필수

### 3. Git 브랜치
- `main`: 프로덕션
- `develop`: 개발
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

---

이 구조를 따라 개발하면 PRD_V2의 요구사항을 체계적으로 구현할 수 있습니다.
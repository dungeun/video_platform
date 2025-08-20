# 📐 프로젝트 구조

## 전체 디렉토리 구조

```
video_platform/
├── src/                        # 소스 코드
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # 인증 관련 페이지
│   │   ├── admin/            # 관리자 페이지
│   │   ├── api/              # API 라우트
│   │   ├── business/         # 비즈니스 대시보드
│   │   ├── videos/           # 비디오 관련 페이지
│   │   ├── layout.tsx        # 루트 레이아웃
│   │   └── page.tsx          # 메인 페이지
│   │
│   ├── components/            # React 컴포넌트
│   │   ├── admin/            # 관리자 컴포넌트
│   │   ├── auth/             # 인증 컴포넌트
│   │   ├── common/           # 공통 컴포넌트
│   │   ├── layouts/          # 레이아웃 컴포넌트
│   │   ├── ui/               # UI 기본 컴포넌트
│   │   └── video/            # 비디오 컴포넌트
│   │
│   ├── lib/                   # 유틸리티 및 라이브러리
│   │   ├── api/              # API 클라이언트
│   │   ├── auth/             # 인증 로직
│   │   ├── constants/        # 상수
│   │   ├── db/               # 데이터베이스 연결
│   │   ├── hooks/            # Custom Hooks
│   │   ├── logger/           # 로깅 시스템
│   │   ├── stores/           # Zustand 스토어
│   │   ├── types/            # TypeScript 타입
│   │   ├── utils/            # 유틸리티 함수
│   │   └── youtube/          # YouTube API 통합
│   │
│   ├── styles/                # 스타일 파일
│   │   └── globals.css       # 전역 스타일
│   │
│   └── types/                 # 글로벌 타입 정의
│       ├── video.ts          # 비디오 타입
│       └── user.ts           # 사용자 타입
│
├── prisma/                    # Prisma ORM
│   ├── schema.prisma         # 데이터베이스 스키마
│   ├── seed.ts               # 시드 데이터
│   └── migrations/           # 마이그레이션 파일
│
├── public/                    # 정적 파일
│   ├── images/               # 이미지
│   └── icons/                # 아이콘
│
├── docs/                      # 프로젝트 문서
├── scripts/                   # 유틸리티 스크립트
└── tests/                     # 테스트 파일

```

## 주요 디렉토리 설명

### `/src/app` - Next.js App Router

#### 인증 페이지 (`/src/app/(auth)`)
- `login/` - 로그인 페이지
- `register/` - 회원가입 페이지
- `forgot-password/` - 비밀번호 찾기
- `reset-password/` - 비밀번호 재설정

#### 관리자 페이지 (`/src/app/admin`)
```
admin/
├── dashboard/          # 관리자 대시보드
├── users/             # 사용자 관리
├── videos/            # 비디오 관리
├── ui-config/         # UI 설정 관리
│   └── sections/      # 섹션별 설정
├── settings/          # 시스템 설정
└── layout.tsx         # 관리자 레이아웃
```

#### API 라우트 (`/src/app/api`)
```
api/
├── auth/              # 인증 API
│   ├── login/
│   ├── register/
│   ├── logout/
│   └── refresh/
├── admin/             # 관리자 API
│   ├── users/
│   ├── ui-config/
│   └── analytics/
├── videos/            # 비디오 API
│   ├── youtube/       # YouTube 임포트
│   └── [id]/          # 개별 비디오
├── users/             # 사용자 API
└── home/              # 홈페이지 데이터
```

### `/src/components` - 컴포넌트 구조

#### 관리자 컴포넌트 (`/src/components/admin`)
- `AdminSidebar.tsx` - 관리자 사이드바
- `DashboardStats.tsx` - 대시보드 통계
- `UserManagement.tsx` - 사용자 관리 테이블
- `SidebarMenuManager.tsx` - 사이드바 메뉴 관리
- `ui-config/` - UI 설정 관련 컴포넌트
  - `HeaderConfigTab.tsx`
  - `FooterConfigTab.tsx`
  - `SectionsConfigTab.tsx`
  - `SectionOrderTab.tsx`

#### 레이아웃 컴포넌트 (`/src/components/layouts`)
- `PageLayout.tsx` - 기본 페이지 레이아웃
- `Header.tsx` - 헤더
- `Footer.tsx` - 푸터
- `Sidebar.tsx` - 사이드바

#### 비디오 컴포넌트 (`/src/components/video`)
- `VideoCard.tsx` - 비디오 카드
- `VideoList.tsx` - 비디오 목록
- `VideoPlayer.tsx` - 비디오 플레이어
- `YouTubeImport.tsx` - YouTube 임포트 UI

### `/src/lib` - 핵심 라이브러리

#### 인증 시스템 (`/src/lib/auth`)
```typescript
// auth.ts - 인증 서비스
export class AuthService {
  static async login(email: string, password: string)
  static async register(userData: RegisterData)
  static async logout()
  static getCurrentUser()
  static isAuthenticated()
}
```

#### 상태 관리 (`/src/lib/stores`)
- `ui-config.store.ts` - UI 설정 전역 상태
- `user.store.ts` - 사용자 상태
- `video.store.ts` - 비디오 상태

#### YouTube 통합 (`/src/lib/youtube`)
- `youtube-service.ts` - YouTube API 서비스
- `youtube-import.ts` - 비디오 임포트 로직
- `youtube-parser.ts` - URL 파싱

#### 로깅 시스템 (`/src/lib/logger`)
- `logger.ts` - Winston 로거 설정
- `api-logger.ts` - API 요청 로깅
- `error-logger.ts` - 에러 로깅

### `/prisma` - 데이터베이스

#### 스키마 구조 (`schema.prisma`)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  type      UserType @default(USER)
  role      UserRole @default(USER)
  // ...
}

model Video {
  id          String   @id @default(uuid())
  title       String
  youtubeId   String?  @unique
  thumbnailUrl String?
  // ...
}

model UIConfig {
  id       String @id @default(uuid())
  key      String @unique
  config   Json
  // ...
}
```

## 주요 파일 설명

### 환경 설정 파일
- `.env.local` - 로컬 환경 변수
- `.env.production` - 프로덕션 환경 변수
- `next.config.js` - Next.js 설정
- `tailwind.config.ts` - Tailwind CSS 설정
- `tsconfig.json` - TypeScript 설정
- `package.json` - 프로젝트 의존성

### 핵심 페이지 파일

#### 메인 페이지 (`/src/app/page.tsx`)
- 동적 섹션 렌더링
- UI 설정 기반 레이아웃
- 비디오 목록 표시

#### 관리자 대시보드 (`/src/app/admin/dashboard/page.tsx`)
- 통계 대시보드
- 실시간 데이터
- 관리 바로가기

#### 비디오 상세 (`/src/app/videos/[id]/page.tsx`)
- 비디오 플레이어
- 메타데이터 표시
- 관련 비디오

## 코드 구조 패턴

### 페이지 컴포넌트 패턴
```typescript
// 서버 컴포넌트 (기본)
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}

// 클라이언트 컴포넌트
'use client'
export default function ClientPage() {
  const [state, setState] = useState()
  // ...
}
```

### API 라우트 패턴
```typescript
// GET 요청
export async function GET(request: Request) {
  // 인증 체크
  // 데이터 조회
  // 응답 반환
}

// POST 요청
export async function POST(request: Request) {
  // 요청 본문 파싱
  // 유효성 검사
  // 데이터 처리
  // 응답 반환
}
```

### 컴포넌트 구조 패턴
```typescript
interface ComponentProps {
  // props 정의
}

export function Component({ props }: ComponentProps) {
  // hooks
  // 상태
  // 핸들러
  // 렌더링
}
```

## 네이밍 컨벤션

### 파일명
- **컴포넌트**: PascalCase (예: `VideoCard.tsx`)
- **유틸리티**: camelCase (예: `formatDate.ts`)
- **상수**: UPPER_SNAKE_CASE (예: `API_ENDPOINTS.ts`)
- **스타일**: kebab-case (예: `video-card.module.css`)

### 변수/함수명
- **변수**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **함수**: camelCase
- **클래스**: PascalCase
- **인터페이스**: PascalCase with 'I' prefix (선택)
- **타입**: PascalCase

### API 엔드포인트
- RESTful 규칙 준수
- 복수형 사용 (예: `/api/videos`)
- 동작은 HTTP 메서드로 표현

## 보안 고려사항

### 인증/인가
- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)
- API 미들웨어에서 권한 체크

### 데이터 검증
- Zod 스키마 검증
- SQL 인젝션 방지 (Prisma ORM)
- XSS 방지 (React 자동 이스케이핑)

### 환경 변수
- 민감한 정보는 환경 변수로 관리
- `.env.local`은 Git에서 제외
- 프로덕션 환경 변수는 별도 관리

## 성능 최적화

### Next.js 최적화
- 서버 컴포넌트 우선 사용
- 동적 임포트로 코드 스플리팅
- Image 컴포넌트로 이미지 최적화
- 정적 생성 (SSG) 활용

### 데이터베이스 최적화
- 인덱스 설정
- N+1 쿼리 방지
- 커넥션 풀링
- 쿼리 최적화

### 프론트엔드 최적화
- React.memo로 불필요한 리렌더링 방지
- useMemo, useCallback 활용
- 가상 스크롤링 구현
- 레이지 로딩